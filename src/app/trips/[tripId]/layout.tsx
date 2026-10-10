import type { ReactNode } from "react";

// Trip ids are the Server's opaque ids, so these routes are dynamic. `loading.tsx` beside this file is what lets a
// <Link> to a trip be partially prefetched and navigate at once (a dynamic route without one waits on the server).
export default function TripLayout({ children }: { children: ReactNode }) {
  return children;
}
