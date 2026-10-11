"use client";

import { useEffect } from "react";

const SCROLLS = /auto|scroll/;

/** Something between the finger and the page that scrolls on its own (a sheet's body, a rail, a text box): the drag is its. */
function insideScroller(target: EventTarget | null): boolean {
  for (let el = target instanceof Element ? target : null; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(el);
    if (SCROLLS.test(overflowY) && el.scrollHeight > el.clientHeight) return true;
    if (SCROLLS.test(overflowX) && el.scrollWidth > el.clientWidth) return true;
  }
  return false;
}

/**
 * Holds the page at its ends on browsers that ignore `overscroll-behavior` on the root (globals.css). iOS Chrome is
 * one: it drags the whole page past its end, sticky docks included, and shows what is behind it. A drag that starts
 * with the page already at an end and pulls further that way is refused before the browser starts to scroll (the
 * only moment it can be). A drag that starts mid-page is the browser's from then on, so one that runs past the end
 * still bounces there.
 *
 * It keeps out of the way when in doubt: a second finger, a zoomed page, the keyboard up (the page then moves inside
 * the layout viewport) and anything that scrolls on its own are all left alone.
 */
export function OverscrollGuard() {
  useEffect(() => {
    // What the drag in progress may be refused for; null once it is decided, or when it is not the guard's.
    let drag: { x: number; y: number; atTop: boolean; atEnd: boolean } | null = null;
    let refusing = false;

    const onStart = (e: TouchEvent) => {
      refusing = false;
      drag = null;
      const touch = e.touches[0];
      const vv = window.visualViewport;
      if (e.touches.length !== 1 || !touch) return;
      if (vv && (vv.scale > 1.01 || vv.height < window.innerHeight * 0.8)) return;
      if (insideScroller(e.target)) return;
      const root = document.documentElement;
      // The shortest reading of the viewport: an end is only called when every reading agrees the page is there.
      const view = Math.min(window.innerHeight, root.clientHeight, vv?.height ?? Infinity);
      const y = window.scrollY;
      drag = { x: touch.clientX, y: touch.clientY, atTop: y <= 0, atEnd: y >= root.scrollHeight - view - 1 };
    };

    const onMove = (e: TouchEvent) => {
      if (refusing) {
        if (e.cancelable) e.preventDefault();
        return;
      }
      const touch = e.touches[0];
      if (!drag || !touch) return;
      const dx = touch.clientX - drag.x;
      const dy = touch.clientY - drag.y;
      if (dx === 0 && dy === 0) return;
      const { atTop, atEnd } = drag;
      drag = null;
      if (e.touches.length !== 1 || !e.cancelable || Math.abs(dx) >= Math.abs(dy)) return;
      if ((dy > 0 && atTop) || (dy < 0 && atEnd)) {
        refusing = true;
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
    };
  }, []);

  return null;
}
