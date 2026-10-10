"use client";

import { useParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { BookingTicketCard } from "@/components/plan/BookingTicketCard";
import { BookingsZero } from "@/components/trip/empty/BookingsZero";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import type { TripId } from "@/data/types";
import { loadBookings, useTripGate } from "@/state";
import { toBookingCard } from "@/state/bookingView";
import { usersById } from "@/state/view";

/** Bookings tab (CONTRACT-APP §4.10): one card per booking, newest first; my tickets only where a booking covers me. */
function BookingsView({ tripId }: { tripId: TripId }) {
  const data = useTripGate(tripId);
  const ready = data !== null;

  useEffect(() => {
    if (ready) void loadBookings(tripId).catch(() => {});
  }, [ready, tripId]);

  if (!data?.view) return null;

  const users = usersById(data.view.people);
  const meId = data.view.me.person.person_id;
  // The tab's own read carries my passengers and documents; until it lands, the trip's own list draws the cards.
  const bookings = (data.bookings ?? data.view.bookings).map((b) => toBookingCard(b, tripId, users, meId));

  return bookings.length === 0 ? (
    <BookingsZero tripId={tripId} />
  ) : (
    <>
      <SectionHeader title={BOOKINGS_COPY.title} meta={BOOKINGS_COPY.count(bookings.length)} />
      {bookings.map((b) => (
        <BookingTicketCard key={b.id} booking={b} members={users} />
      ))}
    </>
  );
}

export default function BookingsPage() {
  const { tripId } = useParams<{ tripId: TripId }>();
  return (
    <Suspense fallback={null}>
      <BookingsView key={tripId} tripId={tripId} />
    </Suspense>
  );
}
