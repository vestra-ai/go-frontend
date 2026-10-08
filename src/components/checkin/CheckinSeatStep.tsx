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
import { CHECKIN, CHECKIN_COPY } from "@/data/seed/checkin";
import type { TripId } from "@/data/types";
import { toastGo } from "@/lib/toast";
import { useStore } from "@/store";

const copy = CHECKIN_COPY.seat;

type CheckinSeatStepProps = {
  tripId: TripId;
  /** Check-in is done and the pass page is on its way: the sheet must stay up until the route replaces it. */
  onLeave: () => void;
  /** The step replaced another inside the open sheet: its content slides in. */
  swapped: boolean;
};

/** K3 web check-in step 2: seat map, selection drives the note and the CTA. Content only (see CheckinDetailsStep). */
export function CheckinSeatStep({ tripId, onLeave, swapped }: CheckinSeatStepProps) {
  const router = useRouter();
  const sel = useStore((s) => s.home[tripId].checkin.seat);
  const setSeat = useStore((s) => s.setSeat);
  const completeCheckin = useStore((s) => s.completeCheckin);
  const { seats, friendSeat, friendId, nextToFriend } = CHECKIN;
  const paid = seats.find((s) => s.id === sel)?.state === "paid";

  const pick = (id: string) => {
    if (id === sel) return;
    if (seats.find((s) => s.id === id)?.state === "taken") return toastGo(copy.takenToast(id));
    setSeat(tripId, id);
  };

  const checkIn = () => {
    onLeave(); // completeCheckin() closes the check-in guard on the trip home
    completeCheckin(tripId);
    announceNavigation();
    router.push(`/trips/${tripId}/checkin/pass`);
  };

  return (
    <>
      <SheetBody className={swapped ? "animate-page-in" : undefined}>
        <SheetHeader title={copy.title} subtitle={copy.sub} closeLabel="Close" />
        <StepIndicator step={2} labels={CHECKIN_COPY.steps} />
        <GoNote variant="green">
          {/* DESIGN-ASSUMPTION (K-checkin.md §1.7 #1–2): the note follows the selection; non-adjacent copy is new. */}
          {nextToFriend.includes(sel) ? (
            <>
              <b>{copy.noteNextTo(sel)}</b>
              {copy.noteNextToTail}
            </>
          ) : (
            <>
              <b>{copy.noteFree(sel)}</b>
              {copy.noteFreeTail}
            </>
          )}
        </GoNote>
        <Card variant="outline" radius="2xl" className="p-[14px_10px]">
          <SeatMap seats={seats} selected={sel} friendSeat={friendSeat} friendId={friendId} onPick={pick} />
        </Card>
        <SeatLegend />
      </SheetBody>
      <SheetFooter>
        <Button variant="primary" size="xl" className="w-full" onClick={checkIn}>
          {copy.cta(sel, paid)}
        </Button>
      </SheetFooter>
    </>
  );
}
