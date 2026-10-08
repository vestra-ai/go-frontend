"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_EVENT = "go:navigate";

/** For navigations that do not go through a <Link> (`router.push`): call right before it to show the feedback too. */
export function announceNavigation() {
  document.dispatchEvent(new Event(NAV_EVENT));
}

// Gives up after this long, so a navigation that never lands cannot leave the bar running.
const GIVE_UP_MS = 8000;

/**
 * Immediate response to a tap that changes page: a progress bar at the top of the column and the outgoing page dims
 * (`html[data-navigating]`, see globals.css). Both are CSS animations with a short delay, so a navigation that lands
 * within a few frames shows nothing, and a slow one never looks frozen. Clears itself when the pathname changes.
 * It also registers a no-op touchstart listener: iOS Safari only applies `:active` (the press states) when the page
 * has one.
 */
export function NavFeedback() {
  const pathname = usePathname();
  const [state, setState] = useState({ pathname, pending: false });
  if (state.pathname !== pathname) setState({ pathname, pending: false });
  const { pending } = state;

  useEffect(() => {
    const start = () => setState((s) => (s.pending ? s : { ...s, pending: true }));
    // next/link calls preventDefault when it takes over a click; a link to another path means a page change.
    const onClick = (e: MouseEvent) => {
      if (!e.defaultPrevented) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement)) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      if (a.origin !== location.origin || a.pathname === location.pathname) return;
      start();
    };
    const noop = () => {};
    document.addEventListener("click", onClick);
    document.addEventListener(NAV_EVENT, start);
    document.addEventListener("touchstart", noop, { passive: true });
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener(NAV_EVENT, start);
      document.removeEventListener("touchstart", noop);
    };
  }, []);

  useEffect(() => {
    if (!pending) return;
    document.documentElement.setAttribute("data-navigating", "");
    const giveUp = setTimeout(() => setState((s) => ({ ...s, pending: false })), GIVE_UP_MS);
    return () => {
      document.documentElement.removeAttribute("data-navigating");
      clearTimeout(giveUp);
    };
  }, [pending]);

  if (!pending) return null;
  return (
    <div
      aria-hidden
      style={{ pointerEvents: "none" }}
      className="absolute inset-x-0 top-0 z-[60] h-[3px] overflow-hidden opacity-0 animate-nav-bar-in"
    >
      <div className="h-full origin-left bg-go animate-nav-progress" />
    </div>
  );
}
