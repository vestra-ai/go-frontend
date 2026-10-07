import Link from "next/link";
import { EmojiTile } from "@/components/common/EmojiTile";
import { X } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MapCard } from "@/data/types";
import { MAP_COPY } from "@/data/seed/map";

/** A spot's card with the audience's `me` overrides already applied. */
export type ResolvedMapCard = Omit<MapCard, "me">;

export interface MapDetailCardProps {
  card: ResolvedMapCard;
  onClose: () => void;
  /** Non-link CTAs: the Goa drill-down and the Directions toast. */
  onAction: () => void;
}

/**
 * Detail card docked to the bottom of the map. Not keyed by spot, so switching pins swaps the content in place
 * and only the first open plays the enter transition.
 */
export function MapDetailCard({ card, onClose, onAction }: MapDetailCardProps) {
  // DESIGN-ASSUMPTION (L-itinerary-map.md §1.6 #7): the CTA overrides Button primary's font-medium to 13/600.
  const cta = "shrink-0 text-13 font-semibold";

  return (
    <Card
      radius="xl"
      role="dialog"
      aria-label={card.title}
      // Tailwind v4 moves elements with the `translate` property, so that is what the enter transition animates.
      className="absolute inset-x-2.5 bottom-2.5 z-3 flex flex-col gap-2.5 bg-white p-3 shadow-pop transition-[opacity,translate] duration-220 ease-[var(--ease-out)] starting:translate-y-1.5 starting:opacity-0"
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
