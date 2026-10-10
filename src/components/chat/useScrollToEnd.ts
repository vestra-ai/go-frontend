import { useEffect, useRef } from "react";
import { SCROLL_DELAY_MS } from "@/data/timing";
import { scrollBehavior } from "@/lib/motion";

/** Within this many px of the page's end counts as reading the latest messages. */
const AT_END_PX = 64;

function scrollToEnd(anchor: HTMLElement | null) {
  try {
    anchor?.scrollIntoView({ behavior: scrollBehavior(), block: "end" });
  } catch {
    // Older engines reject the options object; staying put is fine.
  }
}

/**
 * Keeps the message list pinned to its end sentinel (C-chat-kickoff.md §1.2).
 * First run jumps to the end with no animation; every later change of `deps`
 * (the newest message's key) smooth-scrolls after `SCROLL_DELAY_MS`.
 */
export function useScrollToEnd(anchorRef: React.RefObject<HTMLElement | null>, deps: readonly unknown[]): void {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      anchorRef.current?.scrollIntoView({ block: "end" });
      return;
    }
    const t = window.setTimeout(() => scrollToEnd(anchorRef.current), SCROLL_DELAY_MS);
    return () => window.clearTimeout(t);
    // The caller owns the dependency list (spec signature).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * For a change that only moves the bottom edge (the reply / ask-Go tray resizing the list's bottom padding): follows
 * it to the end only if the page was already there, so the last message stays above the tray. Anywhere else in the
 * thread the scroll position is left alone.
 */
export function useStayAtEnd(anchorRef: React.RefObject<HTMLElement | null>, key: unknown): void {
  // Tracked from scroll events, so it still holds the position from before `key` changed the page height.
  const atEnd = useRef(true);
  useEffect(() => {
    const update = () => {
      atEnd.current = document.documentElement.scrollHeight - window.scrollY - window.innerHeight <= AT_END_PX;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!atEnd.current) return;
    const t = window.setTimeout(() => scrollToEnd(anchorRef.current), SCROLL_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [anchorRef, key]);
}
