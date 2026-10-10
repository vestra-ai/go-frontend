"use client";

import { useState } from "react";
import type { Transfer, TripView } from "@/api/contract";
import type { RecordTarget } from "@/components/sheets/RecordPaymentSheet";
import { fromMinor, toUser, usersById, userOf } from "@/state/view";

/** The record-a-payment sheet's target for one of my debts (a transfer where I am the one who pays). */
export function recordTargetFor(view: TripView, transfer: Pick<Transfer, "to_person_id" | "amount_minor" | "currency">): RecordTarget {
  return {
    tripId: view.trip_id,
    me: toUser(view.me.person),
    payee: userOf(usersById(view.people), transfer.to_person_id),
    owed: fromMinor(transfer.amount_minor),
    currency: transfer.currency,
  };
}

/** Open state for the sheet; the last target is kept so the content stays put while the sheet animates out. */
export function useRecordSheet() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<RecordTarget | null>(null);
  return {
    open,
    target,
    show: (next: RecordTarget) => {
      setTarget(next);
      setOpen(true);
    },
    onOpenChange: setOpen,
  };
}
