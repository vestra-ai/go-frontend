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

type StayDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stay: Stay | null;
  /** 'Go checked it’s free for 6–9 Nov and fits everyone’s budget.' */
  subtitle: string;
  /** 'Fri 6 → Mon 9 Nov · 3 nights' */
  dates: string;
  /** The parent votes (`voteStay(id)`) and closes the sheet. */
  onVote: (id: Stay["id"]) => void;
};

/** E9–E11 stay details sheet (top 96): hero, name + rating, amenities, facts, "Vote for {name}". */
export function StayDetailsSheet({ open, onOpenChange, stay, subtitle, dates, onVote }: StayDetailsSheetProps) {
  // Keep the last stay on screen while the sheet animates closed (the parent clears `stay` with the query).
  const [lastStay, setLastStay] = useState(stay);
  if (stay && stay !== lastStay) setLastStay(stay);
  const shown = stay ?? lastStay;
  if (!shown) return null;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={96} aria-label={shown.name}>
      <SheetBody className="gap-3 pb-[120px]">
        <SheetHeader title={shown.name} subtitle={subtitle} />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, cover */}
        <img src={shown.img} alt={shown.name} className="h-[190px] w-full rounded-5xl object-cover" />
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex flex-col gap-0.5">
            {/* Repeats the sheet title, as designed. */}
            <span className="text-22 font-semibold tracking-h2">{shown.name}</span>
            <span className="flex items-center gap-1 text-13 text-muted">
              <MapPin className="size-[13px] shrink-0" />
              {shown.areaLong}
            </span>
          </div>
          <Badge variant="white" size="rating" className="shrink-0 gap-1">
            ★ {shown.rating}
            <span className="font-medium text-muted">· {shown.reviews}</span>
          </Badge>
        </div>
        <AmenityChips items={shown.amenities} />
        <FactRows
          rows={[
            { label: copy.facts.dates, value: dates },
            { label: copy.facts.total, value: shown.totalFor4 },
            { label: copy.facts.share, value: shown.yourShare },
            { label: copy.facts.cancellation, value: shown.cancellation },
          ]}
        />
      </SheetBody>
      <SheetFooter>
        <Button type="button" variant="primary" size="xl" className="w-full" onClick={() => onVote(shown.id)}>
          {polls.voteFor(shown.name)}
        </Button>
      </SheetFooter>
    </BottomSheet>
  );
}
