import type { Id, ServerFrame, TripChangeKind } from "@/api/contract";
import { setSignedOutHandler } from "@/api/http";
import { live } from "@/api/live";
import { getSession, onSessionChange } from "@/lib/auth";
import {
  forgetCaches,
  loadConfig,
  loadHome,
  loadMe,
  loadNeedsYou,
  loadTrip,
  refreshTrip,
  resyncTrip,
  syncMessages,
} from "@/state/actions";
import { advanceSeq, resetState, tripDraft, upsertMessage, useGo } from "@/state/store";

// Keeps the store in step with the Server (CONTRACT-APP §3): the session, the live socket's frames, and a re-read on
// resume. Correctness never depends on the socket: every frame only says "this moved", and the same GETs fix it.

const set = useGo.setState;
const get = useGo.getState;

/** A person's typing line runs out 6 s after the Server heard it, Go's after 10 s (§3.1). */
const TYPING_MS = { go: 10000, person: 6000 } as const;
/** Several frames of one action arrive together: one re-read for the burst. */
const REFRESH_DEBOUNCE_MS = 150;
const RESUME_GAP_MS = 5000;

const typingKey = (who: { kind: "go" } | { kind: "person"; person_id: Id }) =>
  who.kind === "go" ? "go" : `p:${who.person_id}`;

// -- debounced re-reads ------------------------------------------------------

interface Queued {
  /** A frame of the burst had no `kinds` hint: re-read every loaded part. */
  all: boolean;
  kinds: Set<TripChangeKind>;
  messages: boolean;
  timer: ReturnType<typeof setTimeout>;
}
const pending = new Map<Id, Queued>();
let homeTimer: ReturnType<typeof setTimeout> | null = null;

function queueRefresh(tripId: Id, kinds: TripChangeKind[] | null | undefined, messages: boolean) {
  const queued = pending.get(tripId);
  if (queued) clearTimeout(queued.timer);
  const entry: Queued = {
    all: (queued?.all ?? false) || !kinds || kinds.length === 0,
    kinds: new Set([...(queued?.kinds ?? []), ...(kinds ?? [])]),
    messages: messages || (queued?.messages ?? false),
    timer: setTimeout(() => {
      pending.delete(tripId);
      void refreshTrip(tripId, entry.all ? null : [...entry.kinds], get().trips[tripId]?.seq);
      if (entry.messages && get().trips[tripId]?.room === "ready") void syncMessages(tripId).catch(() => {});
    }, REFRESH_DEBOUNCE_MS),
  };
  pending.set(tripId, entry);
  queueHome();
}

/** A trip's `attention` (and what I owe) changes with the trip, not with `home_changed` (§3.1): re-read home too. */
function queueHome() {
  if (!get().home) return;
  if (homeTimer) clearTimeout(homeTimer);
  homeTimer = setTimeout(() => {
    homeTimer = null;
    void loadHome().catch(() => {});
  }, 600);
}

// -- typing ------------------------------------------------------------------

const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearTyping(tripId: Id, key: string) {
  const timer = typingTimers.get(`${tripId}|${key}`);
  if (timer) clearTimeout(timer);
  typingTimers.delete(`${tripId}|${key}`);
  set((s) => {
    const t = s.trips[tripId];
    if (t) t.typing = t.typing.filter((e) => typingKey(e.who) !== key);
  });
}

// -- frames ------------------------------------------------------------------

function onFrame(frame: ServerFrame) {
  switch (frame.type) {
    case "message": {
      const { trip_id: tripId, message } = frame;
      const held = get().trips[tripId]?.seq ?? 0;
      const myId = get().me?.person_id;
      set((s) => {
        const t = tripDraft(s, tripId);
        const isNew = !t.messages[message.message_id];
        upsertMessage(t, message);
        advanceSeq(t, message.updated_seq, held);
        if (message.author.kind === "system") return;
        // The author has spoken: their typing line goes at once.
        const authorKey = typingKey(message.author);
        t.typing = t.typing.filter((e) => typingKey(e.who) !== authorKey);
        if (!isNew) return;
        // The Chat button's preview (`TripView.chat`) follows the room without a re-read; system pills are never it.
        if (t.view && message.seq > t.view.seq && !message.deleted) {
          const preview = message.text ?? message.card?.fallback_text ?? "";
          if (preview) {
            t.view.chat.last_message = { message_id: message.message_id, author: message.author, text_preview: preview.slice(0, 80), sent_at: message.sent_at };
          }
        }
        if (message.author.kind === "person" && message.author.person_id === myId) {
          // My own send came back on the socket before its POST answered: hide the "sending" twin (§3.2).
          const twin = t.outbox.find((o) => !o.echoedBy && o.status === "sending" && (o.text ?? "") === (message.text ?? ""));
          if (twin) {
            twin.echoedBy = message.message_id;
            t.sentAs[message.message_id] = twin.clientId;
          }
        } else if (t.view && message.seq > t.view.seq) {
          // Not yet in the counts the trip was read with. Opening the room marks it read again.
          t.view.me.unread_count += 1;
          t.view.chat.unread_count += 1;
        }
      });
      // A jump of more than one change means something was missed: re-read before trusting the socket (§3.3).
      if (held > 0 && message.updated_seq > held + 1) queueRefresh(tripId, null, true);
      return;
    }
    case "card": {
      const { trip_id: tripId, message_id: messageId, card } = frame;
      const me = get().me?.person_id;
      const names = (ids?: Id[] | null) => Boolean(me && ids?.includes(me));
      const before = get().trips[tripId];
      const wasForMe =
        names(before?.messages[messageId]?.card?.for_person_ids) ||
        Boolean(before?.needsYou?.some((item) => item.target.card_id === card.card_id));
      set((s) => {
        const t = tripDraft(s, tripId);
        const message = t.messages[messageId];
        if (message) message.card = card;
        if (t.calls && card.kind === "call") {
          const at = t.calls.findIndex((c) => c.card.card_id === card.card_id);
          if (at >= 0) t.calls[at].card = card;
          else t.calls.unshift({ message_id: messageId, card, posted_at: new Date().toISOString() });
        }
      });
      // Go adds or drops me in `for_person_ids` with a card frame alone; the "needs you" list is the Server's to compute.
      if (before?.needsYou && wasForMe !== names(card.for_person_ids)) void loadNeedsYou(tripId).catch(() => {});
      return;
    }
    case "typing": {
      const { trip_id: tripId, who, on } = frame;
      const key = typingKey(who);
      if (!on) {
        clearTyping(tripId, key);
        return;
      }
      const fromUntil = frame.until ? Date.parse(frame.until) : NaN;
      const until = Number.isFinite(fromUntil) && fromUntil > Date.now() ? fromUntil : Date.now() + TYPING_MS[who.kind];
      set((s) => {
        const t = tripDraft(s, tripId);
        t.typing = [...t.typing.filter((e) => typingKey(e.who) !== key), { who, until }];
      });
      const timerKey = `${tripId}|${key}`;
      const old = typingTimers.get(timerKey);
      if (old) clearTimeout(old);
      typingTimers.set(timerKey, setTimeout(() => clearTyping(tripId, key), until - Date.now()));
      return;
    }
    case "trip_changed": {
      const { trip_id: tripId, seq, kinds } = frame;
      const held = get().trips[tripId]?.seq ?? 0;
      if (seq <= held) return;
      set((s) => advanceSeq(tripDraft(s, tripId), seq, held));
      queueRefresh(tripId, kinds, held > 0 && seq > held + 1);
      return;
    }
    case "home_changed":
      void loadHome().catch(() => {});
      return;
    case "resync":
      void resyncTrip(frame.trip_id);
      return;
    case "error":
      // `forbidden`: I am no longer in that trip. `too_many_trips` cannot happen from the screens of one app.
      if (frame.code === "forbidden") void loadTrip(frame.trip_id).catch(() => {});
      return;
    default:
      return; // hello, and any frame type this build does not know (§3.1)
  }
}

// -- open trips --------------------------------------------------------------

const openTrips = new Map<Id, number>();

/**
 * A trip's room or Trip screens opened: read it, subscribe to its changes. Returns the release for unmount. The data
 * stays cached after release; only the subscription goes.
 */
export function openTrip(tripId: Id): () => void {
  openTrips.set(tripId, (openTrips.get(tripId) ?? 0) + 1);
  set((s) => void tripDraft(s, tripId));
  let released = false;
  let unsubscribe: (() => void) | null = null;
  // Subscribe with the change number the read came back with: `since_seq: 0` would ask the Server to replay the whole
  // room over the socket (§3.1), when the room's own read fetches the page that is actually on screen.
  const subscribe = () => {
    if (!released) unsubscribe = live.subscribe(tripId);
  };
  const known = (get().trips[tripId]?.seq ?? 0) > 0;
  const read = loadTrip(tripId);
  if (known) subscribe();
  else void read.then(subscribe, () => {});
  read.catch(() => {});
  return () => {
    if (released) return;
    released = true;
    const left = (openTrips.get(tripId) ?? 1) - 1;
    if (left > 0) openTrips.set(tripId, left);
    else openTrips.delete(tripId);
    unsubscribe?.();
  };
}

// -- resume ------------------------------------------------------------------

let lastResume = 0;

/** §3.3 step 4: a resume re-reads the same endpoints, whatever the socket did meanwhile. */
function onResume() {
  if (document.visibilityState !== "visible" || get().session !== "signedIn") return;
  const now = Date.now();
  if (now - lastResume < RESUME_GAP_MS) return;
  lastResume = now;
  if (get().home) void loadHome().catch(() => {});
  for (const tripId of openTrips.keys()) {
    void refreshTrip(tripId);
    if (get().trips[tripId]?.room === "ready") void syncMessages(tripId).catch(() => {});
  }
}

// -- session -----------------------------------------------------------------

let started = false;

function enterSignedIn() {
  if (get().session !== "signedIn") {
    set({ session: "signedIn" });
    void loadMe().catch(() => {});
  }
  // `since_seq` on every (re)subscribe: with the room open, where it is complete up to, so the Server replays any
  // stretch that was missed; otherwise the newest change seen (there are no messages to bring up to date).
  live.start((tripId) => {
    const t = get().trips[tripId];
    if (!t) return 0;
    return t.room === "ready" ? t.syncedSeq : t.seq;
  }); // a no-op when it is already running
}

function enterSignedOut() {
  live.stop();
  forgetCaches();
  pending.forEach((p) => clearTimeout(p.timer));
  pending.clear();
  typingTimers.forEach((t) => clearTimeout(t));
  typingTimers.clear();
  openTrips.clear();
  resetState("signedOut");
}

/** Called once from the root layout: reads the Supabase session, then follows it. Returns the teardown. */
export function startSession(): () => void {
  if (started) return () => {};
  started = true;

  void loadConfig().catch(() => {});
  const offFrames = live.onFrame(onFrame);
  // A request that stays 401 after one refresh: the session is gone (§1.2).
  setSignedOutHandler(() => {
    if (get().session === "signedIn") enterSignedOut();
  });
  document.addEventListener("visibilitychange", onResume);

  void getSession().then((session) => {
    if (session) enterSignedIn();
    else if (get().session === "loading") set({ session: "signedOut" });
  });
  const offAuth = onSessionChange((session) => {
    if (session) enterSignedIn();
    else if (get().session !== "signedOut") enterSignedOut();
  });

  return () => {
    started = false;
    offFrames();
    offAuth();
    setSignedOutHandler(null);
    document.removeEventListener("visibilitychange", onResume);
    live.stop();
  };
}
