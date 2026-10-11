"use client";

import { useParams, usePathname } from "next/navigation";
import { ChatSkeleton } from "@/components/chat/ChatSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TripSkeleton } from "@/components/trip/TripSkeleton";
import { tripTabOf } from "@/components/trip/TripTabs";
import type { TripId } from "@/data/types";

const CHAT = /^\/trips\/[^/]+\/chat\/?$/;
const TICKET = /^\/trips\/[^/]+\/bookings\/[^/]+\/ticket\/?$/;

/**
 * Shown the instant a trip link is tapped, while the route's own shell arrives. The router commits this under the new
 * URL at once, so the page slide-up (PageTransition) plays on it: it draws the same skeleton the route itself shows
 * next (the trip tabs, the chat), not an empty canvas, which would be a blank flash with nothing left to animate.
 */
export default function TripLoading() {
  const { tripId } = useParams<{ tripId: TripId }>();
  const pathname = usePathname();
  const tab = tripTabOf(pathname);
  if (tab) return <TripSkeleton tripId={tripId} active={tab} />;
  if (CHAT.test(pathname)) return <ChatSkeleton tripId={tripId} />;
  return <Screen bg={TICKET.test(pathname) ? "viewer" : "canvas"}>{null}</Screen>;
}
