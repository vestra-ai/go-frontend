"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { AUTH_CALLBACK_PATH } from "@/lib/auth";
import { useSession } from "@/state";

// The four trip tabs (home / itinerary / bookings / expenses) are separate routes that share one hero + tab bar.
const TRIP_TAB = /^\/trips\/([^/]+)(?:\/(?:itinerary|bookings|expenses))?$/;

// Pages that keep a pinned header still and animate their own body instead (they mark it with `[[data-own]_&]:animate-page-in`).
const OWN_TRANSITION = /^\/trips\/[^/]+\/(?:chat|expenses\/transactions)$/;

// Pages that draw a skeleton of their own while the session is read (Home, "Who's coming" at /trips/new, the trip tabs,
// the chat): the skeleton is the shell, so it shows at once.
const OWN_SKELETON = /^\/(?:home|trips\/[^/]+(?:\/(?:itinerary|bookings|expenses|chat))?)$/;

// When the slide-up of the page now on screen was let go (`performance.now()`), and for which pathname.
let released: { pathname: string; at: number } | null = null;

/**
 * A ref for a part that slides up on its own (`[[data-own]_&]:animate-page-in`). Such a part can be mounted more than
 * once during one page change: the route's loading shell draws the skeleton, then the page draws its own copy, then the
 * real content. A later copy picks the slide-up up where the page has got to (a negative delay) instead of playing it
 * again from the start; once the slide-up is over it simply stands in place.
 */
export function usePageInResume() {
  const pathname = usePathname();
  return useCallback(
    (el: HTMLElement | null) => {
      if (el && released?.pathname === pathname) el.style.animationDelay = `${Math.min(0, released.at - performance.now())}ms`;
    },
    [pathname],
  );
}

const keyOf = (pathname: string) => {
  const trip = TRIP_TAB.exec(pathname);
  return trip ? `trip:${trip[1]}` : pathname;
};

/**
 * Fade-in + slide-up for every page change (`animate-page-in`). The wrapper is re-keyed by pathname (query-string
 * changes such as an opening sheet never replay it). Moving between a trip's tabs keeps the same key, so the hero and
 * tab bar stay put; the wrapper then marks itself `data-switch="tab"` and TripShell animates just its content.
 * The chat and the transactions history mark it `data-own` instead: their sticky headers hold still while the body
 * and bottom bar slide up (the chat's skeleton too, see `usePageInResume`).
 * The slide-up starts only once the new page has painted: after a page change the wrapper is `data-phase="pre"` (the
 * animated parts hold at opacity 0, see globals.css) for two frames. A heavy first render (iOS) otherwise burns the
 * animation's clock before the first frame shows, and the page just snaps in. On a first load or refresh the pages
 * render an empty shell until the session has been read (client only), so the wrapper stays `pre` until then:
 * the slide-up plays on the real content instead of on the empty shell. (A page with its own skeleton, `OWN_SKELETON`,
 * is not held: its skeleton is what shows first.)
 * The sign-in callback draws the skeleton of the page it routes on to, so that page takes over in place: same wrapper,
 * no second slide-up (`inherited`).
 * (A root `template.tsx` would not do: it only remounts when the top-level segment changes.)
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // "Hydrated" is: the session has been read, so the page is drawing its real content.
  const hydrated = useSession() !== "loading";
  const [state, setState] = useState({ pathname, key: keyOf(pathname), tabSwitch: false, ready: true, inherited: false });
  if (state.pathname !== pathname) {
    if (state.pathname === AUTH_CALLBACK_PATH && OWN_SKELETON.test(pathname)) {
      setState({ ...state, pathname, inherited: true });
    } else {
      const tabSwitch = keyOf(pathname) === keyOf(state.pathname);
      setState({ pathname, key: tabSwitch ? state.key : keyOf(pathname), tabSwitch, ready: false, inherited: false });
    }
  }

  useEffect(() => {
    if (state.ready) return;
    const go = () => setState((s) => ({ ...s, ready: true }));
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(go);
    });
    // Backstop: never leave the page held at opacity 0 if frames stall.
    const backstop = setTimeout(go, 250);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      clearTimeout(backstop);
    };
  }, [state.ready, state.pathname]);

  // After the callback the wrapper has already slid up with the skeleton, so the page's own parts stay put.
  const own = OWN_TRANSITION.test(state.pathname) && !state.inherited;
  const skeleton = OWN_SKELETON.test(state.pathname) || state.pathname === AUTH_CALLBACK_PATH;
  const shown = state.ready && (hydrated || skeleton);

  useLayoutEffect(() => {
    if (shown) released = { pathname: state.pathname, at: performance.now() };
  }, [shown, state.pathname]);

  return (
    <div
      key={state.key}
      data-switch={state.tabSwitch ? "tab" : undefined}
      data-own={own ? "" : undefined}
      data-phase={shown ? undefined : "pre"}
      className={state.tabSwitch || own ? undefined : "animate-page-in"}
    >
      {children}
    </div>
  );
}
