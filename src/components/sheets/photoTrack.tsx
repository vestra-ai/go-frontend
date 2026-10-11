"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ChevronRight } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { staySheet as copy } from "@/data/seed/copy";
import { scrollBehavior } from "@/lib/motion";
import { cn } from "@/lib/utils";

// What the photo carousel and its full-screen viewer share: a row of photos, one per screenful, that snaps; the
// previous / next buttons for a mouse; the dots.

/** The classes of the row `useSnapTrack` drives. Its children are `shrink-0 snap-center snap-always` and as wide as it. */
export const snapTrackClass = "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-none";

/**
 * A snap row's state: which photo is on (read from its scroll position), and `go` to show another.
 * @param start The photo the row opens on. Only its first value counts.
 * @param onChange Called when a scroll brings another photo on.
 */
export function useSnapTrack(count: number, start = 0, onChange?: (at: number) => void) {
  const track = useRef<HTMLDivElement>(null);
  const [first] = useState(start);
  const [at, setAt] = useState(first);
  // Before first paint, so the row is never seen on its first photo on the way to another.
  useLayoutEffect(() => {
    const el = track.current;
    if (el && first > 0) el.scrollLeft = first * el.clientWidth;
  }, [first]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    const next = Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth)));
    if (next === at) return;
    setAt(next);
    onChange?.(next);
  };

  const go = useCallback((to: number, animated = true) => {
    const el = track.current;
    if (el) el.scrollTo({ left: to * el.clientWidth, behavior: animated ? scrollBehavior() : "instant" });
  }, []);

  return { track, at, onScroll, go };
}

type PhotoArrowsProps = { at: number; count: number; onGo(to: number): void };

/** Previous / next over the photo, where there is a mouse (it cannot swipe). Hidden at the ends. */
export function PhotoArrows({ at, count, onGo }: PhotoArrowsProps) {
  return ([-1, 1] as const).map((step) => (
    <Button
      key={step}
      type="button"
      variant="glass"
      size="icon-2xs"
      aria-label={step < 0 ? copy.photos.prev : copy.photos.next}
      disabled={step < 0 ? at === 0 : at === count - 1}
      // Darker than the glass button is elsewhere: it has to show on a bright photo too.
      className={cn("absolute top-1/2 hidden -translate-y-1/2 bg-ink/60 disabled:invisible pointer-fine:flex", step < 0 ? "left-2" : "right-2")}
      onClick={() => onGo(at + step)}
    >
      <ChevronRight className={cn("size-4", step < 0 && "rotate-180")} strokeWidth={2.4} />
    </Button>
  ));
}

/** One dot per photo, the one on screen lit. Decoration: the count is said in words next to it. */
export function PhotoDots({ at, count, className }: { at: number; count: number; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none flex gap-1 rounded-full bg-ink/60 px-2 py-1.5 backdrop-blur-[12px]", className)}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={cn("size-1.5 rounded-full transition-colors", i === at ? "bg-white" : "bg-white/45")} />
      ))}
    </div>
  );
}
