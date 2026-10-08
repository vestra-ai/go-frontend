"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { VENDOR_CALLS } from "@/data/seed/calls";
import type { TripId, VendorId } from "@/data/types";
import { useStore } from "@/store";
import type { OpenRow } from "@/store/state";

// URL ↔ sheet state for the trip home route (PLAN §8; J-triphome-calls.md §1.1–§1.5, K-checkin.md §1.1, §1.6):
// `?sheet=listen|recording&call=<vendor>`, `?sheet=checkin&step=details|seat`, `?sheet=share`, and the one-shot deep link `?open=stay|fly`.

export type TripHomeSheet = "listen" | "recording" | "checkin" | "share";
export type CheckinStep = "details" | "seat";

/** Params a sheet owns; closing strips them all. */
const SHEET_PARAMS = ["sheet", "call", "step"] as const;

const isVendor = (value: string | null): value is VendorId => value !== null && value in VENDOR_CALLS;
const isRow = (value: string | null): value is Exclude<OpenRow, null> => value === "stay" || value === "fly";

/**
 * Writes the query with the native History API (Next mirrors it into `useSearchParams`, no RSC round trip).
 * `push` adds an entry so Back closes the sheet first; `replace` rewrites the current one (PLAN §8).
 */
function writeQuery(mutate: (params: URLSearchParams) => void, how: "push" | "replace" = "replace") {
  const params = new URLSearchParams(window.location.search);
  mutate(params);
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  if (how === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

const stripSheet = (p: URLSearchParams) => SHEET_PARAMS.forEach((k) => p.delete(k));

export interface TripHomeSheets {
  /** The open sheet after the guards. */
  sheet: TripHomeSheet | null;
  /** Last valid `?call=`, kept after close so the Listen / Recording sheet can animate out. */
  callId: VendorId | null;
  /** Open check-in step (only while `checkin.status === 'open'`); a missing/unknown `?step=` is `details`. */
  checkinStep: CheckinStep | null;
  shareOpen: boolean;
  setShareOpen(open: boolean): void;
  openListen(id: VendorId): void;
  openRecording(id: VendorId): void;
  /** K1 "Check in now" → step details. */
  openCheckin(): void;
  /** K2 "Continue to seats" → step seat. */
  continueCheckin(): void;
  /**
   * Closes the open sheet: unwinds every history entry this screen pushed for it (`history.go(-n)`; two for the seat
   * step, which is pushed over details), otherwise a replace that strips it.
   */
  close(): void;
  /** Accordion row toggle: store only, never the URL. */
  toggleRow(row: OpenRow): void;
}

export function useTripHomeSheets(
  tripId: TripId,
  opts: { populated: boolean },
): TripHomeSheets {
  const { populated } = opts;
  const params = useSearchParams();
  const checkinOpen = useStore((s) => s.home[tripId].checkin.status === "open");

  const raw = params.get("sheet");
  const callParam = params.get("call");
  const call = isVendor(callParam) ? callParam : null;
  const openParam = params.get("open");
  const row = isRow(openParam) ? openParam : null;

  // Shape guards: unknown sheet, a call sheet without a vendor, or a trip-home sheet on the zero state.
  const valid =
    raw === "share" ||
    (populated && ((raw === "listen" || raw === "recording") && call !== null)) ||
    (populated && raw === "checkin");
  const sheet: TripHomeSheet | null = valid && (raw !== "checkin" || checkinOpen) ? (raw as TripHomeSheet) : null;

  const [callId, setCallId] = useState<VendorId | null>(call);
  if (call && call !== callId) setCallId(call);

  // History entries this screen pushed that are still above the base entry, and our own pending `history.back()`s.
  const depth = useRef(0);
  const pendingBacks = useRef(0);
  useEffect(() => {
    const onPop = () => {
      if (pendingBacks.current > 0) pendingBacks.current -= 1;
      else depth.current = Math.max(0, depth.current - 1); // browser Back
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Invalid params are dropped (replace). Check-in params are checked against the status only when the query changes,
  // so `completeCheckin()` + `router.push(pass)` is not raced by a URL rewrite (K-checkin.md §1.1).
  useEffect(() => {
    if (raw === null) return;
    const checkinClosed = raw === "checkin" && useStore.getState().home[tripId].checkin.status !== "open";
    if (!valid || checkinClosed) writeQuery(stripSheet);
  }, [raw, valid, tripId]);

  // `?open=stay|fly` is a one-shot deep link (the Bookings stay card, the map's flights link, the demo presets): apply it
  // on arrival, then drop it from the URL. The URL never holds the expanded row, so a refresh (or Back) cannot bring it
  // back; toggling a row only touches the store.
  useEffect(() => {
    if (!populated || row === null) return;
    const store = useStore.getState();
    if (store.home[tripId].openRow !== row) store.toggleRow(tripId, row);
    writeQuery((p) => p.delete("open"));
  }, [populated, row, tripId]);

  function push(mutate: (p: URLSearchParams) => void) {
    writeQuery(mutate, "push");
    depth.current += 1;
  }

  function openSheet(next: TripHomeSheet, extra?: Record<string, string>) {
    push((p) => {
      stripSheet(p);
      p.set("sheet", next);
      Object.entries(extra ?? {}).forEach(([k, v]) => p.set(k, v));
    });
  }

  function close() {
    if (pendingBacks.current > 0) return; // a close is already on its way (e.g. End call + the sheet's self-close)
    if (!new URLSearchParams(window.location.search).has("sheet")) return;
    if (depth.current > 0) {
      const n = depth.current;
      depth.current = 0;
      pendingBacks.current += 1; // one popstate, however many entries it skips
      window.history.go(-n);
    } else writeQuery(stripSheet);
  }

  function toggleRow(next: OpenRow) {
    useStore.getState().toggleRow(tripId, next);
  }

  return {
    sheet,
    callId,
    checkinStep: sheet === "checkin" ? (params.get("step") === "seat" ? "seat" : "details") : null,
    shareOpen: sheet === "share",
    setShareOpen: (open) => (open ? openSheet("share") : close()),
    openListen: (id) => openSheet("listen", { call: id }),
    openRecording: (id) => openSheet("recording", { call: id }),
    openCheckin: () => openSheet("checkin", { step: "details" }),
    continueCheckin: () => openSheet("checkin", { step: "seat" }),
    close,
    toggleRow,
  };
}
