"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { errorMessage } from "@/api/http";
import { CheckBadge } from "@/components/common/CheckBadge";
import { GoNote } from "@/components/common/GoNote";
import { StepIndicator } from "@/components/common/StepIndicator";
import { BoardingPassCard } from "@/components/checkin/BoardingPassCard";
import { FadeDock } from "@/components/shell/FadeDock";
import { StickyDock } from "@/components/shell/StickyDock";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { Note } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { TripId } from "@/data/types";
import { toastGo } from "@/lib/toast";
import { loadBookings, loadCheckin, useTripGate } from "@/state";
import { ticketHref } from "@/state/bookingView";
import { toCheckIn } from "@/state/checkinView";
import { toUser, usersById } from "@/state/view";

const copy = CHECKIN_COPY.pass;
/** Go finishes on the airline's site and the pass follows: read the check-in again until it is there (CONTRACT-APP §4.12). */
const WORKING_POLL_MS = 5000;

export default function BoardingPassPage() {
  const tripId = useParams<{ tripId: string }>().tripId as TripId;
  return (
    <Suspense fallback={<Screen bg="canvas">{null}</Screen>}>
      <BoardingPass key={tripId} tripId={tripId} />
    </Suspense>
  );
}

function BoardingPass({ tripId }: { tripId: TripId }) {
  const bookingId = useSearchParams().get("booking");
  const data = useTripGate(tripId);
  const ready = data !== null;
  const stored = bookingId ? data?.checkin[bookingId] : undefined;
  const working = stored?.status === "working";

  useEffect(() => {
    if (!ready || !bookingId) return;
    void loadBookings(tripId).catch(() => {});
    loadCheckin(tripId, bookingId).catch((err) => toastGo(errorMessage(err)));
  }, [ready, tripId, bookingId]);
  useEffect(() => {
    if (!working || !bookingId) return;
    const timer = window.setInterval(() => void loadCheckin(tripId, bookingId).catch(() => {}), WORKING_POLL_MS);
    return () => window.clearInterval(timer);
  }, [working, tripId, bookingId]);

  if (!data?.view || !bookingId || !stored) return <Screen bg="canvas">{null}</Screen>;

  const booking = (data.bookings ?? data.view.bookings).find((b) => b.booking_id === bookingId);
  const checkin = toCheckIn(stored, booking, toUser(data.view.me.person));
  const friend = checkin.friendId ? (usersById(data.view.people)[checkin.friendId] ?? null) : null;
  const sel = checkin.seat;
  const done = checkin.status === "done" && checkin.pass !== null;
  const status = !done
    ? working
      ? copy.working
      : copy.notReady
    : friend && checkin.nextToFriend.includes(sel)
      ? copy.successNextTo(sel, friend.firstName)
      : copy.success(sel);
  const hasTicket = (booking?.documents?.length ?? 0) > 0;

  return (
    <Screen bg="canvas">
      <TopBar title={copy.title} backHref={`/trips/${tripId}`} />
      <div className="flex flex-col gap-3 px-4 pt-1 pb-[130px]">
        <StepIndicator step={3} labels={CHECKIN_COPY.steps} />
        <Note
          variant="green"
          icon={<CheckBadge size={24} />}
          className="text-15 font-semibold transition-[opacity,transform] duration-220 starting:translate-y-1.5 starting:opacity-0"
        >
          {status}
        </Note>
        {done && checkin.pass && <BoardingPassCard checkin={{ ...checkin, pass: checkin.pass }} seat={sel} digiYatra={checkin.digiYatra} />}
        {done && (
          <GoNote
            variant="outline"
            trailing={friend ? <Avatar size={28} name={friend.name} src={friend.avatar} tone={friend.tone} /> : undefined}
          >
            {copy.goNote(friend?.firstName ?? null, checkin.friendSeat || null)}
          </GoNote>
        )}
      </div>
      {hasTicket && (
        <StickyDock>
          <FadeDock variant="gradient" className="flex-row gap-2 px-4 pt-[30px]">
            <Button variant="primary" size="xl" asChild className="flex-1 text-17">
              <Link href={ticketHref(tripId, bookingId)}>{copy.download}</Link>
            </Button>
          </FadeDock>
        </StickyDock>
      )}
    </Screen>
  );
}
