import type { ReactNode } from "react";
import { BOOKINGS } from "@/data/seed/bookings";

// Static for the same reason as the trip layout: a tap on a ticket link must not wait on the server.
export function generateStaticParams() {
  return BOOKINGS.map((b) => ({ bookingId: b.id }));
}

export default function BookingLayout({ children }: { children: ReactNode }) {
  return children;
}
