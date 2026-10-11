import type { ReactNode } from "react";
import { ChatSkeleton } from "@/components/chat/ChatSkeleton";
import { CrewSkeleton } from "@/components/home/CrewSkeleton";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { TripSkeleton } from "@/components/trip/TripSkeleton";
import { tripTabOf } from "@/components/trip/TripTabs";

const CHAT = /^\/trips\/[^/]+\/chat\/?$/;

/**
 * The skeleton the page at `pathname` draws while its data is on the way, or null for a page that has none. For
 * whoever holds the screen before that page is there: a route's loading shell, the sign-in callback.
 */
export function routeSkeleton(pathname: string): ReactNode {
  if (pathname === "/home") return <HomeSkeleton />;
  if (pathname === "/trips/new") return <CrewSkeleton />;
  const tripId = pathname.split("/")[2] ?? "";
  const tab = tripTabOf(pathname);
  if (tab) return <TripSkeleton tripId={tripId} active={tab} />;
  if (CHAT.test(pathname)) return <ChatSkeleton tripId={tripId} />;
  return null;
}
