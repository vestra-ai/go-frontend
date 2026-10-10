"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/api/http";
import { BottomSheet } from "@/components/shell/BottomSheet";
import type { TripId, User } from "@/data/types";
import { toastGo } from "@/lib/toast";
import { loadCheckin, useTripData } from "@/state";
import { toCheckIn } from "@/state/checkinView";
import { toUser, usersById } from "@/state/view";
import { CheckinDetailsStep } from "./CheckinDetailsStep";
import { CheckinSeatStep } from "./CheckinSeatStep";

type CheckinStep = "details" | "seat";

type CheckinSheetProps = {
  tripId: TripId;
  /** The flight being checked in (kept by the caller while the sheet animates out). */
  bookingId: string | null;
  /** The open step; null = closed. */
  step: CheckinStep | null;
  /** X / scrim / drag / Escape on either step: close the whole check-in (the check-in state is kept). */
  onClose: () => void;
  /** "Continue to seats". */
  onContinue: () => void;
};

/**
 * Web check-in steps 1 and 2 in ONE sheet: moving between them swaps the content in place (it slides up as the new
 * step), the sheet itself never closes and reopens. The step content is remembered while the sheet animates out.
 * Dismissing it, from either step, closes the check-in; browser Back steps seat → details (each step is a history entry).
 */
export function CheckinSheet({ tripId, bookingId, step, onClose, onContinue }: CheckinSheetProps) {
  const data = useTripData(tripId);
  const stored = bookingId ? data.checkin[bookingId] : undefined;
  const isOpen = step !== null;

  // `GET …/checkin`: what Go found on the airline's site (the Server answers its cached copy when Go is away).
  useEffect(() => {
    if (!isOpen || !bookingId) return;
    loadCheckin(tripId, bookingId).catch((err) => {
      toastGo(errorMessage(err));
      onClose();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once per open
  }, [isOpen, bookingId, tripId]);

  const view = data.view;
  const booking = view?.bookings.find((b) => b.booking_id === bookingId);
  const me: User | null = view ? toUser(view.me.person) : null;
  const checkin = stored && me ? toCheckIn(stored, booking, me) : null;
  const friend = checkin?.friendId && view ? (usersById(view.people)[checkin.friendId] ?? null) : null;

  // `shown` outlives `step` (null once closed) so the sheet keeps its content while it slides away; `swapped` is
  // true only for a step change inside an open sheet, not for the first open.
  const [state, setState] = useState<{ shown: CheckinStep; open: boolean; swapped: boolean }>({
    shown: step ?? "details",
    open: step !== null,
    swapped: false,
  });
  if (step !== null && (!state.open || step !== state.shown)) {
    setState({ shown: step, open: true, swapped: state.open });
  } else if (step === null && state.open) {
    setState({ ...state, open: false });
  }

  // Checking in completes the flow: keep the sheet up until the pass route replaces the page.
  const [leaving, setLeaving] = useState(false);

  return (
    <BottomSheet
      inset={48}
      open={step !== null || leaving}
      onOpenChange={(open) => !open && !leaving && onClose()}
    >
      {!checkin || !me || !bookingId ? null : state.shown === "details" ? (
        <CheckinDetailsStep tripId={tripId} bookingId={bookingId} checkin={checkin} me={me} friend={friend} onContinue={onContinue} swapped={state.swapped} />
      ) : (
        <CheckinSeatStep
          tripId={tripId}
          bookingId={bookingId}
          checkin={checkin}
          friend={friend}
          onLeave={() => setLeaving(true)}
          onStay={() => setLeaving(false)}
          onClose={onClose}
          swapped={state.swapped}
        />
      )}
    </BottomSheet>
  );
}
