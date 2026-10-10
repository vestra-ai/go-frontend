import type { ClientFrame, Id, ServerFrame } from "@/api/contract";
import { api } from "@/api/endpoints";
import { LIVE_URL } from "@/api/env";
import { isApiError } from "@/api/http";

// The live connection (CONTRACT-APP §3): one WebSocket per signed-in app instance, carrying every open trip plus the
// home screen. Writes are HTTP, never frames. Correctness never depends on the socket (§3.3): whoever listens re-reads
// the same endpoints on `resync`, on a `seq` jump, and on resume.

const DEVICE_KEY = "go-device-id";
/** §3.3: reconnect after 1, 2, 5, 10 s, then every 30 s; back to 1 s after a connect that works. */
const BACKOFF_MS = [1000, 2000, 5000, 10000, 30000];
/** §3.1: at most one typing `on` per 2 s per trip (extra ones are dropped by the Server). */
const TYPING_GAP_MS = 2000;

const CLOSE_REPLACED = 4000; // a second connect with the same device_id closed this one
const CLOSE_BAD_TICKET = 4401;

export type LiveStatus = "idle" | "connecting" | "open" | "waiting";
export type FrameListener = (frame: ServerFrame) => void;

/** Kept per browser profile so a reconnect replaces this device's old socket instead of adding one (§3). */
function deviceId(): string | undefined {
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return undefined; // storage blocked: every connect is a new device
  }
}

class LiveConnection {
  private socket: WebSocket | null = null;
  private status: LiveStatus = "idle";
  private wanted = false;
  private attempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private heartbeatMs = 25000;
  private generation = 0;
  /** trip → how many screens hold it open. */
  private readonly trips = new Map<Id, number>();
  private readonly listeners = new Set<FrameListener>();
  private readonly lastTypingOn = new Map<Id, number>();
  /** Supplies `since_seq` for a trip on every (re)subscribe: the highest seq / updated_seq the app holds, 0 for none. */
  private sinceSeq: (tripId: Id) => number = () => 0;

  /** Opens the socket and keeps it open (reconnecting) until `stop()`. Safe to call again. */
  start(sinceSeq: (tripId: Id) => number) {
    this.sinceSeq = sinceSeq;
    if (this.wanted) return;
    this.wanted = true;
    document.addEventListener("visibilitychange", this.onVisible);
    window.addEventListener("online", this.onOnline);
    void this.connect();
  }

  /** Sign-out: close for good and forget every subscription. */
  stop() {
    this.wanted = false;
    this.generation += 1;
    document.removeEventListener("visibilitychange", this.onVisible);
    window.removeEventListener("online", this.onOnline);
    this.clearTimers();
    this.trips.clear();
    this.lastTypingOn.clear();
    this.socket?.close(1000);
    this.socket = null;
    this.status = "idle";
  }

  onFrame(listener: FrameListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** A trip's room or Trip screens opened. Returns the matching release. */
  subscribe(tripId: Id): () => void {
    const held = this.trips.get(tripId) ?? 0;
    this.trips.set(tripId, held + 1);
    if (held === 0) this.send({ type: "subscribe", trips: [{ trip_id: tripId, since_seq: this.sinceSeq(tripId) }] });
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const left = (this.trips.get(tripId) ?? 1) - 1;
      if (left > 0) {
        this.trips.set(tripId, left);
        return;
      }
      this.trips.delete(tripId);
      this.lastTypingOn.delete(tripId);
      this.send({ type: "unsubscribe", trip_ids: [tripId] });
    };
  }

  /** Only for a trip this socket subscribed. `off` always goes through; `on` at most once per 2 s. */
  typing(tripId: Id, on: boolean) {
    if (!this.trips.has(tripId)) return;
    if (on) {
      const now = Date.now();
      if (now - (this.lastTypingOn.get(tripId) ?? 0) < TYPING_GAP_MS) return;
      this.lastTypingOn.set(tripId, now);
    } else {
      if (!this.lastTypingOn.has(tripId)) return; // never said `on`
      this.lastTypingOn.delete(tripId);
    }
    this.send({ type: "typing", trip_id: tripId, on });
  }

  private readonly onVisible = () => {
    // §3.3: reconnect at once when the app comes back to the front.
    if (document.visibilityState === "visible" && this.wanted && this.status !== "open" && this.status !== "connecting") {
      this.attempt = 0;
      void this.connect();
    }
  };

  private readonly onOnline = () => {
    if (this.wanted && this.status === "waiting") {
      this.attempt = 0;
      void this.connect();
    }
  };

  private send(frame: ClientFrame) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(frame));
  }

  private clearTimers() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.watchdog) clearTimeout(this.watchdog);
    this.retryTimer = null;
    this.watchdog = null;
  }

  private scheduleRetry() {
    if (!this.wanted) return;
    this.status = "waiting";
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)];
    this.attempt += 1;
    this.retryTimer = setTimeout(() => void this.connect(), delay);
  }

  /** The Server pings every `heartbeat_seconds`; two missed in a row means the line is dead even if the socket looks open. */
  private armWatchdog() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => this.socket?.close(), this.heartbeatMs * 2 + 5000);
  }

  private async connect() {
    if (!this.wanted || this.status === "connecting" || this.status === "open") return;
    this.clearTimers();
    this.status = "connecting";
    const generation = ++this.generation;

    let ticket: string;
    try {
      // Each connect needs a fresh ticket: single use, valid 30 seconds (§3).
      ticket = (await api.liveTicket(deviceId())).ticket;
    } catch (err) {
      if (generation !== this.generation) return;
      this.status = "waiting";
      // Signed out (the http layer already handled it): stay closed until the next start().
      if (isApiError(err) && err.status === 401) return;
      this.scheduleRetry();
      return;
    }
    if (generation !== this.generation || !this.wanted) return;

    const socket = new WebSocket(`${LIVE_URL}?ticket=${encodeURIComponent(ticket)}`);
    this.socket = socket;

    socket.onopen = () => {
      if (generation !== this.generation) return;
      this.status = "open";
      this.attempt = 0;
      this.armWatchdog();
      // §3.3 step 2: subscribe every open trip with its stored since_seq.
      if (this.trips.size > 0) {
        this.send({
          type: "subscribe",
          trips: [...this.trips.keys()].map((id) => ({ trip_id: id, since_seq: this.sinceSeq(id) })),
        });
      }
    };

    socket.onmessage = (event) => {
      if (generation !== this.generation) return;
      let frame: ServerFrame;
      try {
        frame = JSON.parse(String(event.data)) as ServerFrame;
      } catch {
        return; // frames that are not JSON are ignored (§3.1)
      }
      if (!frame || typeof frame !== "object" || typeof frame.type !== "string") return;
      this.armWatchdog();
      if (frame.type === "ping") {
        this.send({ type: "pong" });
        return;
      }
      if (frame.type === "hello" && frame.heartbeat_seconds > 0) this.heartbeatMs = frame.heartbeat_seconds * 1000;
      this.listeners.forEach((listener) => listener(frame));
    };

    socket.onclose = (event) => {
      if (generation !== this.generation) return;
      this.socket = null;
      if (this.watchdog) clearTimeout(this.watchdog);
      this.watchdog = null;
      if (!this.wanted) {
        this.status = "idle";
        return;
      }
      if (event.code === CLOSE_REPLACED) {
        // Another tab of this browser took the device's one socket. Reconnecting now would only bounce the two tabs
        // off each other; this tab reconnects when it comes back to the front.
        this.status = "waiting";
        return;
      }
      if (event.code === CLOSE_BAD_TICKET) this.attempt = 0; // the ticket ran out before the handshake: try a fresh one
      this.scheduleRetry();
    };

    socket.onerror = () => {
      // `onclose` always follows and does the bookkeeping.
    };
  }
}

/** The app's one live connection. */
export const live = new LiveConnection();
