"use client";

import { usePathname } from "next/navigation";
import { routeSkeleton } from "@/components/shell/routeSkeleton";
import { Screen } from "@/components/shell/Screen";

const TICKET = /^\/trips\/[^/]+\/bookings\/[^/]+\/ticket\/?$/;

/**
 * Shown the instant a trip link is tapped, while the route's own shell arrives. The router commits this under the new
 * URL at once, so the page slide-up (PageTransition) plays on it: it draws the same skeleton the route itself shows
 * next (the trip tabs, the chat), not an empty canvas, which would be a blank flash with nothing left to animate.
 */
export default function TripLoading() {
  const pathname = usePathname();
  return routeSkeleton(pathname) ?? <Screen bg={TICKET.test(pathname) ? "viewer" : "canvas"}>{null}</Screen>;
}
