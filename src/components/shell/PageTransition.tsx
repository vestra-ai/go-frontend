"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

// The four trip tabs (home / itinerary / bookings / expenses) are separate routes that share one hero + tab bar.
const TRIP_TAB = /^\/trips\/([^/]+)(?:\/(?:itinerary|bookings|expenses))?$/;

// Pages that keep a pinned header still and animate their own body instead (they mark it with `[[data-own]_&]:animate-page-in`).
const OWN_TRANSITION = /^\/trips\/[^/]+\/(?:chat|expenses\/transactions)$/;

const keyOf = (pathname: string) => {
  const trip = TRIP_TAB.exec(pathname);
  return trip ? `trip:${trip[1]}` : pathname;
};

/**
 * Fade-in + slide-up for every page change (`animate-page-in`). The wrapper is re-keyed by pathname (query-string
 * changes such as an opening sheet never replay it). Moving between a trip's tabs keeps the same key, so the hero and
 * tab bar stay put; the wrapper then marks itself `data-switch="tab"` and TripShell animates just its content.
 * The chat and the transactions history mark it `data-own` instead: their sticky headers hold still while the body
 * and bottom bar slide up.
 * (A root `template.tsx` would not do: it only remounts when the top-level segment changes.)
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState({ pathname, key: keyOf(pathname), tabSwitch: false });
  if (state.pathname !== pathname) {
    const key = keyOf(pathname);
    setState({ pathname, key, tabSwitch: key === state.key });
  }

  const own = OWN_TRANSITION.test(state.pathname);

  return (
    <div
      key={state.key}
      data-switch={state.tabSwitch ? "tab" : undefined}
      data-own={own ? "" : undefined}
      className={state.tabSwitch || own ? undefined : "animate-page-in"}
    >
      {children}
    </div>
  );
}
