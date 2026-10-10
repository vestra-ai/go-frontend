"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { Screen } from "@/components/shell/Screen";
import { TripHomeScreen } from "@/components/trip/TripHomeScreen";

/** Trip home: the zero state, or "Pending on you" and "Done" once the trip is planned. */
export default function TripHomePage() {
  const { tripId } = useParams<{ tripId: string }>();
  return (
    // useSearchParams needs a Suspense boundary for static prerendering.
    <Suspense fallback={<Screen>{null}</Screen>}>
      <TripHomeScreen key={tripId} tripId={tripId} />
    </Suspense>
  );
}
