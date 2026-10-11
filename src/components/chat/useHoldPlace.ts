import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Keeps what is on screen where it is when rows are added above it (a page of earlier messages). Call the returned
 * `hold` just before the rows go in: the commit that draws them puts the page back as far from its end as it was.
 *
 * The place is taken at that moment and not when the page was asked for: the reader goes on scrolling while it is on
 * its way, and would be thrown back to where they were when the request left.
 */
export function useHoldPlace(): () => void {
  const fromEnd = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (fromEnd.current === null) return;
    window.scrollTo(0, document.documentElement.scrollHeight - fromEnd.current);
    fromEnd.current = null;
  });
  return useCallback(() => {
    fromEnd.current = document.documentElement.scrollHeight - window.scrollY;
  }, []);
}
