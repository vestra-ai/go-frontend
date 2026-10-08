"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Whether the hero has scrolled off the top of the screen, for the compact trip header. Observes a sentinel at the
 * hero's bottom edge, so it only reacts when that edge crosses the top: nothing runs per scroll frame (a scroll
 * listener that re-rendered the shell was the jerk on iOS), and the header is either fully shown or fully hidden,
 * never half-faded over the hero.
 *
 * `animate` is false until the first crossing after mount, so a restored scroll position (Back) starts with the
 * header already in place instead of sliding in.
 */
export function useCollapsingHeader() {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState({ collapsed: false, animate: false });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    let first = true;
    const observer = new IntersectionObserver(([entry]) => {
      const collapsed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      setState((s) => (first || s.collapsed !== collapsed ? { collapsed, animate: !first } : s));
      first = false;
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, ...state };
}
