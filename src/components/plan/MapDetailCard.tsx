"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { EmojiTile } from "@/components/common/EmojiTile";
import { X } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MapCard } from "@/data/types";
import { MAP_COPY } from "@/data/seed/map";
import { scrollBehavior } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** A spot's card with the audience's `me` overrides already applied. */
export type ResolvedMapCard = Omit<MapCard, "me">;

export interface MapDetailCardProps {
  card: ResolvedMapCard;
  /** false while the card animates out (the parent unmounts it a moment later): inert and invisible. */
  open: boolean;
  /** Bumped by each tap on a spot (0 = none yet): the card scrolls itself into view, so it is not left below the fold. */
  revealKey: number;
  onClose: () => void;
  /** Non-link CTAs: the Goa drill-down and the Directions toast. */
  onAction: () => void;
}

/**
 * Detail card docked to the bottom of the map. It slides up and fades in on the first open and slides down and fades
 * out on close. Not keyed by spot, so switching pins swaps the content in place without replaying either.
 */
export function MapDetailCard({ card, open, revealKey, onClose, onAction }: MapDetailCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  // The map is taller than the screen at the top of the page, so the card docked to its bottom starts off-screen.
  // Scrolls the least that shows it all, clear of the compact header and the chat button (scroll-mt / scroll-mb below).
  useEffect(() => {
    if (revealKey > 0) ref.current?.scrollIntoView({ block: "nearest", behavior: scrollBehavior() });
  }, [revealKey]);

  // DESIGN-ASSUMPTION (L-itinerary-map.md §1.6 #7): the CTA overrides Button primary's font-medium to 13/600.
  const cta = "shrink-0 text-13 font-semibold";

  return (
    <Card
      ref={ref}
      radius="xl"
      role="dialog"
      aria-label={card.title}
      inert={!open}
      // Tailwind v4 moves elements with the `translate` property, so that is what the transitions animate: `starting:`
      // is the enter (first mount), the closed classes the exit (the card stays mounted until it has finished).
      className={cn("absolute inset-x-2.5 bottom-2.5 z-3 scroll-mt-[calc(env(safe-area-inset-top,0px)+130px)] scroll-mb-[140px] flex flex-col gap-2.5 bg-white p-3 shadow-pop transition-[opacity,translate] duration-260 ease-[var(--ease-out)] starting:translate-y-4 starting:opacity-0", !open && "pointer-events-none translate-y-3 opacity-0")}
    >
      <div className="flex items-center gap-2.5">
        {/* DESIGN-ASSUMPTION (L-itinerary-map.md §1.6 #4): emoji tile only, no image, as designed. */}
        <EmojiTile emoji={card.icon} size={40} shape="rounded-xl" className="text-[19px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <div className="text-16 font-semibold leading-[1.25] tracking-body">{card.title}</div>
          <div className="text-13 tracking-caption text-muted">{card.sub}</div>
        </div>
        <Button variant="soft" size="icon-2xs" aria-label={MAP_COPY.close} onClick={onClose} className="self-start text-ink">
          <X className="size-3.5" strokeWidth={2.4} />
        </Button>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1 text-13 font-semibold leading-[1.35] text-ink">{card.line}</div>
        {card.action.kind === "href" ? (
          <Button variant="primary" size="sm" asChild className={cta}>
            <Link href={card.action.href}>{card.button}</Link>
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={onAction} className={cta}>
            {card.button}
          </Button>
        )}
      </div>
    </Card>
  );
}
