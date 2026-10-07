"use client";

import { notFound, useParams } from "next/navigation";
import { Suspense } from "react";
import { Screen } from "@/components/shell/Screen";
import { TripHomeScreen } from "@/components/trip/TripHomeScreen";
import { TRIP_IDS } from "@/data/seed/trips";
import type { TripId } from "@/data/types";
import { useHydrated } from "@/store/useHydrated";

// Trip home (I1 · J1–J7 · K1–K3): PLAN §8, J-triphome-calls.md §1.1.
export default function TripHomePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const hydrated = useHydrated();
  if (!TRIP_IDS.includes(tripId as TripId)) notFound();
  if (!hydrated) return <Screen scroll="none">{null}</Screen>;
  return (
    // useSearchParams needs a Suspense boundary for static prerendering.
    <Suspense fallback={<Screen scroll="none">{null}</Screen>}>
      <TripHomeScreen tripId={tripId as TripId} />
    </Suspense>
  );
}
