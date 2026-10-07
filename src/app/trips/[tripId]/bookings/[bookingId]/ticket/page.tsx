"use client";

import { notFound, useParams } from "next/navigation";
import { PdfViewer } from "@/components/plan/PdfViewer";
import { Screen } from "@/components/shell/Screen";
import type { TripId } from "@/data/types";
import { selectTicket } from "@/store/selectors";
import { useStore } from "@/store/store";
import { useHydrated } from "@/store/useHydrated";

export default function TicketPage() {
  const { tripId, bookingId } = useParams<{ tripId: TripId; bookingId: string }>();
  const hydrated = useHydrated();
  const ticket = useStore((s) => selectTicket(s, tripId, bookingId));

  if (!hydrated) return <Screen bg="viewer" scroll="none">{null}</Screen>;
  if (!ticket) notFound();
  return (
    <Screen bg="viewer" scroll="none">
      <PdfViewer tripId={tripId} ticket={ticket} />
    </Screen>
  );
}
