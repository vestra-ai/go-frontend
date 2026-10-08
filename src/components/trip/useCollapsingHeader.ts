"use client";

import { useEffect, useState } from "react";

const START = 110; // scrollY where the compact header begins to fade in
const RANGE = 90; // …and the scroll distance over which it does

/**
 * 0 → 1 in 0.05 steps as the hero scrolls away. A page too short to scroll past START never shows the compact header
 * (the hero is still on screen), and one that can only scroll a little further finishes the fade at its bottom edge,
 * so the header is never left stuck half-transparent over the hero.
 */
export const collapseProgress = (scrollTop: number, maxScroll = Infinity) => {
  if (maxScroll < START) return 0;
  const end = Math.min(START + RANGE, maxScroll);
  return Math.round(Math.min(Math.max((scrollTop - (end - RANGE)) / RANGE, 0), 1) * 20) / 20;
};

/** Collapse progress of the trip header, driven by the document scroll (the body is the page's only scroller). */
export function useCollapsingHeader(): number {
  const [hp, setHp] = useState(0);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setHp(collapseProgress(window.scrollY, max));
    };
    update(); // restored scroll position after a back navigation
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return hp;
}
