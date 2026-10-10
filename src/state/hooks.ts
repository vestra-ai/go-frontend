"use client";

import { notFound, usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Id } from "@/api/contract";
import { openTrip } from "@/state/sync";
import { emptyTrip, useGo, type SessionStatus, type TripData } from "@/state/store";

export const useSession = (): SessionStatus => useGo((s) => s.session);

/**
 * For every signed-in screen: sends a signed-out visitor to the welcome page and brings them back after sign-in
 * (`?next=`). Render the canvas shell until it returns "signedIn".
 */
export function useRequireSession(): SessionStatus {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  useEffect(() => {
    if (session !== "signedOut") return;
    const next = pathname + window.location.search;
    router.replace(next && next !== "/home" ? `/?next=${encodeURIComponent(next)}` : "/");
  }, [session, pathname, router]);
  return session;
}

const NO_TRIP = emptyTrip();

/** What the app holds of a trip (a stable empty slot before the first read). */
export const useTripData = (tripId: Id): TripData => useGo((s) => s.trips[tripId] ?? NO_TRIP);

/** Reads the trip and keeps it live while the screen is mounted and the person is signed in. */
export function useOpenTrip(tripId: Id): TripData {
  const session = useSession();
  useEffect(() => {
    if (session !== "signedIn") return;
    return openTrip(tripId);
  }, [tripId, session]);
  return useTripData(tripId);
}

/**
 * The guard every trip screen starts with: signed in, the trip read and kept live. Null while that is on its way
 * (draw the canvas shell); a trip I am not in, or that does not exist, is the not-found page (the Server answers 403
 * for both, CONTRACT-APP §1.2).
 */
export function useTripGate(tripId: Id): TripData | null {
  const session = useRequireSession();
  const data = useOpenTrip(tripId);
  if (data.forbidden) notFound();
  return session === "signedIn" && data.view ? data : null;
}
