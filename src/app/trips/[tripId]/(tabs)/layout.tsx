"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { TripShell } from "@/components/trip/TripShell";
import { TripSkeleton } from "@/components/trip/TripSkeleton";
import { tripTabOf } from "@/components/trip/TripTabs";
import { useTripShellProps } from "@/components/trip/useTripShellProps";
import type { TripId } from "@/data/types";
import { useTripGate } from "@/state";

// The four trip tabs (home / itinerary / bookings / expenses) are separate routes under one layout, so the hero, the
// tab bar and the Chat button are drawn here once and stay put when the tab changes: only the column under the tab bar
// swaps (and, while the next tab's payload is on its way, shows `loading.tsx`, which is empty). Until the session is
// read and the trip answers (a refresh), `TripSkeleton` stands in for the whole shell. The chat, the ticket, the
// check-in pass and the transactions history sit outside this group, with their own screens.
const tabOf = (pathname: string) => tripTabOf(pathname) ?? "home";

function TripTabsFrame({ tripId, children }: { tripId: TripId; children: ReactNode }) {
  const pathname = usePathname();
  const active = tabOf(pathname);
  // `?collapsed=1` on Bookings: no hero, the compact header always shown.
  const forceCollapsed = useSearchParams().get("collapsed") === "1" && active === "bookings";
  const data = useTripGate(tripId);
  const shell = useTripShellProps(tripId, active);

  if (!data?.view || !shell) return <TripSkeleton tripId={tripId} active={active} />;
  return (
    <TripShell {...shell} forceCollapsed={forceCollapsed}>
      {children}
    </TripShell>
  );
}

export default function TripTabsLayout({ children }: { children: ReactNode }) {
  const { tripId } = useParams<{ tripId: TripId }>();
  const pathname = usePathname();
  return (
    // useSearchParams needs a Suspense boundary for static prerendering.
    <Suspense fallback={<TripSkeleton tripId={tripId} active={tabOf(pathname)} />}>
      <TripTabsFrame key={tripId} tripId={tripId}>
        {children}
      </TripTabsFrame>
    </Suspense>
  );
}
