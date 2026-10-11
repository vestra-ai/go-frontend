"use client";

import { useState } from "react";
import { MapPin } from "@/components/icons/generated";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { polls, staySheet as copy } from "@/data/seed/copy";
import type { Stay } from "@/data/types";
import { AmenityChips } from "./AmenityChips";
import { FactRows } from "./FactRows";
import { OptionLinks } from "./OptionLinks";
import { PhotoCarousel } from "./PhotoCarousel";

type StayDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stay: Stay | null;
  /** 'Go checked it’s free for 6–9 Nov and fits everyone’s budget.' */
  subtitle: string;
  /** 'Fri 6 → Mon 9 Nov · 3 nights' */
  dates: string;
  /** The footer button: votes for the stay, or presses an options card's own action. Absent: nothing to press. */
  onVote?: (id: Stay["id"]) => void;
  /** The button's words when it is not a vote ("I'll take this"). */
  actionLabel?: string;
  /** This option is my pick in the open vote: the button says "Voted ✓" instead of offering the vote again. */
  voted?: boolean;
};

/** E9–E11 stay details sheet (48px below the top of the screen): hero, location + rating, amenities, facts, "Vote for {name}". */
export function StayDetailsSheet({ open, onOpenChange, stay, subtitle, dates, onVote, actionLabel, voted = false }: StayDetailsSheetProps) {
  // Keep the last stay on screen while the sheet animates closed (the parent clears `stay` with the query).
  const [lastStay, setLastStay] = useState(stay);
  if (stay && stay !== lastStay) setLastStay(stay);
  const shown = stay ?? lastStay;
  if (!shown) return null;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} inset={48} aria-label={shown.name}>
      <SheetBody className="gap-3 pb-[120px]">
        <SheetHeader title={shown.name} subtitle={subtitle} />
        {shown.photos.length > 1 ? (
          // Keyed by its first photo: another stay's gallery opens on its cover.
          <PhotoCarousel key={shown.photos[0].src} photos={shown.photos} name={shown.name} className="h-[190px]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, cover
          <img src={shown.img} alt={shown.name} className="h-[190px] w-full rounded-5xl bg-skeleton object-cover text-transparent" />
        )}
        {/* The name is the sheet's title, so it is not said again here: where it is on the left, its rating on the right. */}
        {(shown.areaLong || shown.rating) && (
          <div className="flex items-center justify-between gap-2.5">
            {shown.areaLong && (
              <span className="flex min-w-0 items-center gap-1 text-13 text-muted">
                <MapPin className="size-[13px] shrink-0" />
                <span className="truncate">{shown.areaLong}</span>
              </span>
            )}
            {shown.rating && (
              <Badge variant="white" size="rating" className="ml-auto shrink-0 gap-1">
                ★ {shown.rating}
                {shown.reviews && <span className="font-medium text-muted">· {shown.reviews}</span>}
              </Badge>
            )}
          </div>
        )}
        <AmenityChips items={shown.amenities} />
        <FactRows
          rows={[
            { label: copy.facts.dates, value: dates },
            { label: copy.facts.total, value: shown.totalFor4 },
            { label: copy.facts.share, value: shown.yourShare },
            { label: copy.facts.cancellation, value: shown.cancellation },
            // What Go collected about the place, when the Details read has answered.
            ...(shown.extras?.facts ?? []),
          ].filter((row) => row.value)}
        />
        <OptionLinks extras={shown.extras} />
      </SheetBody>
      <SheetFooter>
        {voted ? (
          // The card's green "Voted ✓"; tapping it does nothing.
          <Button type="button" variant="success" size="xl" className="w-full" aria-pressed>
            {polls.voted}
          </Button>
        ) : (
          onVote && (
            <Button type="button" variant="primary" size="xl" className="w-full" onClick={() => onVote(shown.id)}>
              {/* A long name is cut with an ellipsis inside the button, not spilled past its ends. */}
              <span className="truncate">{actionLabel ?? polls.voteFor(shown.name)}</span>
            </Button>
          )
        )}
      </SheetFooter>
    </BottomSheet>
  );
}
