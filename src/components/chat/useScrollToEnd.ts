import { useEffect, useRef } from "react";
import { SCROLL_DELAY_MS } from "@/data/timing";

/**
 * Keeps the message list pinned to its end sentinel (C-chat-kickoff.md §1.2).
 * First run jumps to the end with no animation; every later change of `deps`
 * (P3-9 passes `[messages.length, bottomPadding]`) smooth-scrolls after `SCROLL_DELAY_MS`.
 */
export function useScrollToEnd(anchorRef: React.RefObject<HTMLElement | null>, deps: readonly unknown[]): void {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      anchorRef.current?.scrollIntoView({ block: "end" });
      return;
    }
    const t = window.setTimeout(() => {
      try {
        anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      } catch {
        // Older engines reject the options object; staying put is fine.
      }
    }, SCROLL_DELAY_MS);
    return () => window.clearTimeout(t);
    // The caller owns the dependency list (spec signature).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
