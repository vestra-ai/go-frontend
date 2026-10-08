"use client";

import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { BookingTicketCard } from "@/components/plan/BookingTicketCard";
import { Screen } from "@/components/shell/Screen";
import { BookingsZero } from "@/components/trip/empty/BookingsZero";
import { TripShell } from "@/components/trip/TripShell";
import { useTripShellProps } from "@/components/trip/useTripShellProps";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import type { TripId } from "@/data/types";
import { useBookings } from "@/store/hooks";
import { useHydrated } from "@/store/useHydrated";

function BookingsView({ tripId }: { tripId: TripId }) {
  const forceCollapsed = useSearchParams().get("collapsed") === "1";
  const shell = useTripShellProps(tripId, "bookings");
  const bookings = useBookings(tripId);
  if (!shell) notFound();

  return (
    <TripShell {...shell} forceCollapsed={forceCollapsed}>
      {bookings.length === 0 ? (
        <BookingsZero tripId={tripId} />
      ) : (
        <>
          <SectionHeader title={BOOKINGS_COPY.title} meta={BOOKINGS_COPY.count(bookings.length)} />
          {bookings.map((b) => (
            <BookingTicketCard key={b.id} booking={b} />
          ))}
        </>
      )}
    </TripShell>
  );
}

export default function BookingsPage() {
  const { tripId } = useParams<{ tripId: TripId }>();
  const hydrated = useHydrated();
  if (!hydrated) return <Screen>{null}</Screen>;
  return (
    <Suspense fallback={<Screen>{null}</Screen>}>
      <BookingsView tripId={tripId} />
    </Suspense>
  );
}
