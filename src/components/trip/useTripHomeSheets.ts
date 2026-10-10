"use client";

import { useState } from "react";
import type { RecordTarget } from "@/components/sheets/RecordPaymentSheet";
import type { CallModel } from "@/state/homeView";

// Sheet state for the trip home route. Which sheet is open lives in component state and opens only from a tap: no query
// param opens, names or closes a sheet. (`?open=<booking>` expands a Done row, not a sheet.)

export type TripHomeSheet = "recording" | "checkin" | "share" | "record" | "budget";
export type CheckinStep = "details" | "seat";

type Open = { sheet: TripHomeSheet; step: CheckinStep };

export interface TripHomeSheets {
  sheet: TripHomeSheet | null;
  /** Last opened call, kept after close so the Recording sheet can animate out. */
  call: CallModel | null;
  /** Last record-a-payment target, kept the same way. */
  record: RecordTarget | null;
  /** The flight being checked in, and the open step. */
  checkinBookingId: string | null;
  checkinStep: CheckinStep | null;
  shareOpen: boolean;
  setShareOpen(open: boolean): void;
  openRecording(call: CallModel): void;
  /** "Check in now" → step details. */
  openCheckin(bookingId: string): void;
  /** "Continue to seats" → step seat. */
  continueCheckin(): void;
  /** "Settle up" row → Record a payment. */
  openRecord(target: RecordTarget): void;
  openBudget(): void;
  close(): void;
}

export function useTripHomeSheets(): TripHomeSheets {
  const [open, setOpen] = useState<Open | null>(null);
  const [call, setCall] = useState<CallModel | null>(null);
  const [record, setRecord] = useState<RecordTarget | null>(null);
  const [checkinBookingId, setCheckinBookingId] = useState<string | null>(null);

  const show = (sheet: TripHomeSheet, step: CheckinStep = "details") => setOpen({ sheet, step });
  const sheet = open?.sheet ?? null;

  return {
    sheet,
    call,
    record,
    checkinBookingId,
    checkinStep: open?.sheet === "checkin" ? open.step : null,
    shareOpen: sheet === "share",
    setShareOpen: (isOpen) => (isOpen ? show("share") : setOpen(null)),
    openRecording: (next) => {
      setCall(next);
      show("recording");
    },
    openCheckin: (bookingId) => {
      setCheckinBookingId(bookingId);
      show("checkin");
    },
    continueCheckin: () => show("checkin", "seat"),
    openRecord: (target) => {
      setRecord(target);
      show("record");
    },
    openBudget: () => show("budget"),
    close: () => setOpen(null),
  };
}
