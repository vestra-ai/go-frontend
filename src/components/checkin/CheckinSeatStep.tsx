"use client";

import { useRouter } from "next/navigation";
import { GoNote } from "@/components/common/GoNote";
import { StepIndicator } from "@/components/common/StepIndicator";
import { SeatLegend } from "@/components/checkin/SeatLegend";
import { SeatMap } from "@/components/checkin/SeatMap";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { announceNavigation } from "@/components/shell/NavFeedback";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { errorMessage, isApiError, newKey } from "@/api/http";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { CheckIn, TripId, User } from "@/data/types";
import { inr } from "@/lib/format";
import { toastGo } from "@/lib/toast";
import { completeCheckin, patchCheckin } from "@/state";
import { fromMinor } from "@/state/view";
import { useState } from "react";

const copy = CHECKIN_COPY.seat;

type CheckinSeatStepProps = {
  tripId: TripId;
  bookingId: string;
  checkin: CheckIn;
  /** The friend on the same booking, when there is one. */
  friend: User | null;
  /** Check-in is done and the pass page is on its way: the sheet must stay up until the route replaces it. */
  onLeave: () => void;
  /** The check-in did not finish after all: the sheet may close again. */
  onStay: () => void;
  onClose: () => void;
  /** The step replaced another inside the open sheet: its content slides in. */
  swapped: boolean;
};

/** Web check-in step 2: seat map, selection drives the note and the CTA. Content only (see CheckinDetailsStep). */
export function CheckinSeatStep({ tripId, bookingId, checkin, friend, onLeave, onStay, onClose, swapped }: CheckinSeatStepProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  // One key for this press of "Check in": a retry never submits twice (CONTRACT-APP §1.4).
  const [key, setKey] = useState(newKey);
  const { seats, friendSeat, nextToFriend } = checkin;
  const sel = checkin.seat;

  const pick = async (id: string) => {
    if (id === sel || pending) return;
    if (seats.find((s) => s.id === id)?.state === "taken") return toastGo(copy.takenToast(id));
    try {
      const state = await patchCheckin(tripId, bookingId, { seat: id });
      // A paid seat is not set: the vault pays first, and Go sets the seat when the payment lands.
      if (state.payment_required) {
        const price = state.seat_price ? inr(fromMinor(state.seat_price.amount_minor)) : "";
        toastGo(copy.paidToast(id, price));
      }
    } catch (err) {
      toastGo(isApiError(err) && err.status === 409 ? copy.takenToast(id) : errorMessage(err, copy.failed));
    }
  };

  const checkIn = async () => {
    if (pending || !sel) return;
    setPending(true);
    onLeave();
    try {
      const state = await completeCheckin(tripId, bookingId, key);
      if (state.status === "working") toastGo(copy.working);
      announceNavigation();
      router.push(`/trips/${tripId}/checkin/pass?booking=${encodeURIComponent(bookingId)}`);
    } catch (err) {
      // Go refused (409) or did not answer (502): my answers are kept, so fix and tap again.
      setPending(false);
      setKey(newKey());
      onStay();
      toastGo(errorMessage(err, copy.failed));
      if (isApiError(err) && err.status === 404) onClose();
    }
  };

  return (
    <>
      <SheetBody className={swapped ? "animate-page-in" : undefined}>
        <SheetHeader
          title={copy.title}
          subtitle={[checkin.flight, `${checkin.route.fromSub} → ${checkin.route.toSub}`, checkin.date].filter(Boolean).join(" · ")}
          closeLabel="Close"
        />
        <StepIndicator step={2} labels={CHECKIN_COPY.steps} />
        <GoNote variant="green">
          {/* DESIGN-ASSUMPTION (K-checkin.md §1.7 #1–2): the note follows the selection; non-adjacent copy is new. */}
          {!sel ? (
            copy.noteNone
          ) : friend && nextToFriend.includes(sel) ? (
            <>
              <b>{copy.noteNextTo(sel, friend.firstName)}</b>
              {copy.noteNextToTail}
            </>
          ) : (
            <>
              <b>{copy.noteFree(sel)}</b>
              {copy.noteFreeTail(friend?.firstName ?? null)}
            </>
          )}
        </GoNote>
        <Card variant="outline" radius="2xl" className="p-[14px_10px]">
          <SeatMap checkin={checkin} selected={sel} friendSeat={friendSeat} friend={friend} onPick={(id) => void pick(id)} />
        </Card>
        <SeatLegend friend={friend?.firstName} paid={seats.find((s) => s.state === "paid")?.price} />
      </SheetBody>
      <SheetFooter>
        <Button variant="primary" size="xl" className="w-full" disabled={!sel || pending} aria-busy={pending} onClick={() => void checkIn()}>
          {copy.cta(sel)}
        </Button>
      </SheetFooter>
    </>
  );
}
