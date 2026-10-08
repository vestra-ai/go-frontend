import type { ReactNode } from "react";
import { TRIP_IDS } from "@/data/seed/trips";

// Every trip screen is a client screen fed by the local store, so there is nothing to wait for on the server. Naming
// the seed trips makes these routes static: <Link> prefetches them in full and a tap navigates with no round trip
// (a dynamic route is not prefetched without a loading.tsx, so each tap would freeze until the server answered).
export function generateStaticParams() {
  return TRIP_IDS.map((tripId) => ({ tripId }));
}

export default function TripLayout({ children }: { children: ReactNode }) {
  return children;
}
