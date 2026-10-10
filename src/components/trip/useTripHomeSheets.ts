"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { TripId, VendorId } from "@/data/types";
import { dropQueryParams } from "@/lib/query";
import { useStore } from "@/store";
import type { OpenRow } from "@/store/state";

// Sheet state for the trip home route (J-triphome-calls.md §1.1–§1.5, K-checkin.md §1.1). Which sheet is open lives in
// component state and opens only from a tap: no query param opens, names or closes a sheet. (`?open=stay|fly` expands an
// accordion row, not a sheet.)

export type TripHomeSheet = "listen" | "recording" | "checkin" | "share" | "record" | "cab";
export type CheckinStep = "details" | "seat";


type Open = { sheet: TripHomeSheet; call: VendorId | null; step: CheckinStep };

const isRow = (value: string | null): value is Exclude<OpenRow, null> => value === "stay" || value === "fly";

export interface TripHomeSheets {
  /** The open sheet after the guards. */
  sheet: TripHomeSheet | null;
  /** Last opened call, kept after close so the Listen / Recording sheet can animate out. */
  callId: VendorId | null;
  /** Open check-in step (only while `checkin.status === 'open'`). */
  checkinStep: CheckinStep | null;
  shareOpen: boolean;
  setShareOpen(open: boolean): void;
  openListen(id: VendorId): void;
  openRecording(id: VendorId): void;
  /** K1 "Check in now" → step details. */
  openCheckin(): void;
  /** K2 "Continue to seats" → step seat. */
  continueCheckin(): void;
  /** "Settle up" row → Record a payment. */
  openRecord(): void;
  /** "Airport cab" row → Cab sheet. */
  openCab(): void;
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

  const [open, setOpen] = useState<Open | null>(null);

  const openParam = params.get("open");
  const row = isRow(openParam) ? openParam : null;

  // Shape guards: a call sheet without a vendor, or a populated-only sheet on the zero state, is not open.
  const valid =
    open !== null &&
    (open.sheet === "share" ||
      (populated &&
        (open.sheet === "record" ||
          open.sheet === "cab" ||
          ((open.sheet === "listen" || open.sheet === "recording") && open.call !== null) ||
          (open.sheet === "checkin" && checkinOpen))));
  if (open !== null && !valid) setOpen(null);
  const current = valid ? open : null;
  const sheet = current?.sheet ?? null;

  const [callId, setCallId] = useState<VendorId | null>(open?.call ?? null);
  if (open?.call && open.call !== callId) setCallId(open.call);

  // `?open=stay|fly` is a one-shot deep link (the Bookings stay card, the map's flights link, the demo presets): apply it
  // on arrival, then drop it from the URL. The URL never holds the expanded row, so a refresh (or Back) cannot bring it
  // back; toggling a row only touches the store.
  useEffect(() => {
    if (!populated || row === null) return;
    const store = useStore.getState();
    if (store.home[tripId].openRow !== row) store.toggleRow(tripId, row);
    dropQueryParams("open");
  }, [populated, row, tripId]);

  const openSheet = (next: TripHomeSheet, extra?: Partial<Omit<Open, "sheet">>) =>
    setOpen({ sheet: next, call: null, step: "details", ...extra });

  return {
    sheet,
    callId,
    checkinStep: current?.sheet === "checkin" ? current.step : null,
    shareOpen: sheet === "share",
    setShareOpen: (isOpen) => (isOpen ? openSheet("share") : setOpen(null)),
    openListen: (id) => openSheet("listen", { call: id }),
    openRecording: (id) => openSheet("recording", { call: id }),
    openCheckin: () => openSheet("checkin"),
    continueCheckin: () => openSheet("checkin", { step: "seat" }),
    openRecord: () => openSheet("record"),
    openCab: () => openSheet("cab"),
    close: () => setOpen(null),
    toggleRow: (next) => useStore.getState().toggleRow(tripId, next),
  };
}
