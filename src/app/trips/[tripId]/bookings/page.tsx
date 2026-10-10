"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { BookingTicketCard } from "@/components/plan/BookingTicketCard";
import { Screen } from "@/components/shell/Screen";
import { BookingsZero } from "@/components/trip/empty/BookingsZero";
import { TripShell } from "@/components/trip/TripShell";
import { useTripShellProps } from "@/components/trip/useTripShellProps";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import type { TripId } from "@/data/types";
import { loadBookings, useTripGate } from "@/state";
import { toBookingCard } from "@/state/bookingView";
import { usersById } from "@/state/view";

/** Bookings tab (CONTRACT-APP §4.10): one card per booking, newest first; my tickets only where a booking covers me. */
function BookingsView({ tripId }: { tripId: TripId }) {
  const forceCollapsed = useSearchParams().get("collapsed") === "1";
  const data = useTripGate(tripId);
  const shell = useTripShellProps(tripId, "bookings");
  const ready = data !== null;

  useEffect(() => {
    if (ready) void loadBookings(tripId).catch(() => {});
  }, [ready, tripId]);

  if (!data?.view || !shell) return <Screen>{null}</Screen>;

  const users = usersById(data.view.people);
  const meId = data.view.me.person.person_id;
  // The tab's own read carries my passengers and documents; until it lands, the trip's own list draws the cards.
  const bookings = (data.bookings ?? data.view.bookings).map((b) => toBookingCard(b, tripId, users, meId));

  return (
    <TripShell {...shell} forceCollapsed={forceCollapsed}>
      {bookings.length === 0 ? (
        <BookingsZero tripId={tripId} />
      ) : (
        <>
          <SectionHeader title={BOOKINGS_COPY.title} meta={BOOKINGS_COPY.count(bookings.length)} />
          {bookings.map((b) => (
            <BookingTicketCard key={b.id} booking={b} members={users} />
          ))}
        </>
      )}
    </TripShell>
  );
}

export default function BookingsPage() {
  const { tripId } = useParams<{ tripId: TripId }>();
  return (
    <Suspense fallback={<Screen>{null}</Screen>}>
      <BookingsView key={tripId} tripId={tripId} />
    </Suspense>
  );
}
