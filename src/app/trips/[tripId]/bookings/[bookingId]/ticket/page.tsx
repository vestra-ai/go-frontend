"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect } from "react";
import { PdfViewer } from "@/components/plan/PdfViewer";
import { Screen } from "@/components/shell/Screen";
import type { TripId } from "@/data/types";
import { loadBookings, useTripGate } from "@/state";
import { toTicketDoc } from "@/state/bookingView";
import { toUser } from "@/state/view";

/** Ticket viewer (CONTRACT-APP §4.10): a booking's document, only for the people the booking covers. */
export default function TicketPage() {
  const { tripId, bookingId } = useParams<{ tripId: TripId; bookingId: string }>();
  const data = useTripGate(tripId);
  const ready = data !== null;

  useEffect(() => {
    if (ready) void loadBookings(tripId).catch(() => {});
  }, [ready, tripId]);

  // `documents[]` only comes with the bookings read, so wait for it before deciding there is no ticket.
  if (!data?.view || !data.bookings) return <Screen bg="viewer">{null}</Screen>;
  const booking = data.bookings.find((b) => b.booking_id === bookingId);
  const ticket = booking ? toTicketDoc(booking, undefined, toUser(data.view.me.person)) : null;
  if (!ticket) notFound();
  return (
    <Screen bg="viewer">
      <PdfViewer key={ticket.documentId} tripId={tripId} ticket={ticket} />
    </Screen>
  );
}
