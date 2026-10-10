"use client";

import { useState } from "react";
import { InfoNote } from "@/components/common/InfoNote";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { CAB_COPY, CAB_FILTERS } from "@/data/seed/cabs";
import { ROUTE_COPY, TRIP_TYPES } from "@/data/seed/routes";
import type { CabOption, TripType } from "@/data/types";
import { cabCountLine, cabCtaLabel, chosenCab, visibleCabs } from "@/lib/routes";
import type { CabCardModel } from "@/state/optionView";
import { CabOptionRow } from "./CabOptionRow";
import { LegSummaryCard } from "./LegSummaryCard";
import { OptionListCard } from "./OptionListCard";

type CabSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The cabs Go found (an `options` card with `option_kind: "cab"`), kept by the caller while the sheet animates out. */
  card: CabCardModel | null;
  /** "Book": the card's per-option action with the picked cab and the one way / both rides choice. */
  onBook: (optionId: string, trip: TripType) => void;
  /** The tap is on its way. */
  pending?: boolean;
};

type CabFilter = "all" | CabOption["kind"];

/** The cab picker: trip / car filter / pick (reset on every open), then the card's own action. The CTA shows the total only. */
export function CabSheet({ open, onOpenChange, card, onBook, pending = false }: CabSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={110}>
      {card && open && <CabPicker key={card.cardId} card={card} onBook={onBook} pending={pending} />}
    </BottomSheet>
  );
}

function CabPicker({ card, onBook, pending }: { card: CabCardModel; onBook: CabSheetProps["onBook"]; pending: boolean }) {
  // Both rides only when the card prices the way back.
  const both = card.legs.length > 1 && card.options.some((o) => o.round > 0);
  const [trip, setTrip] = useState<TripType>(both ? "round" : "oneway");
  const [filt, setFilt] = useState<CabFilter>("all");
  const [pick, setPick] = useState<string | null>(null);

  const kinds = new Set(card.options.map((o) => o.kind));
  const shown = visibleCabs(card.options, filt);
  const chosen = chosenCab(shown, pick);
  const legs = trip === "round" ? card.legs : card.legs.slice(0, 1);

  return (
    <>
      <SheetBody>
        <SheetHeader title={card.title} subtitle={CAB_COPY.sub(both)} closeLabel={ROUTE_COPY.close} />
        {both && (
          <SegmentedControl variant="contained" aria-label={ROUTE_COPY.tripTypeLabel} value={trip} onValueChange={(v) => setTrip(v as TripType)}>
            {TRIP_TYPES.map((t) => (
              <SegmentedControlItem key={t.id} value={t.id}>
                {t.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
        {legs.length > 0 && <LegSummaryCard legs={legs} />}
        {kinds.size > 1 && (
          <div role="group" aria-label={CAB_COPY.filterLabel} className="flex gap-1.5">
            {CAB_FILTERS.map((f) => (
              <Chip key={f.id} size="lg" pressed={filt === f.id} onClick={() => setFilt(f.id)}>
                {/* One flex child keeps the design's "🚗 Sedan" spacing; the emoji is hidden from AT. */}
                <span>
                  {f.emoji && <span aria-hidden>{f.emoji} </span>}
                  {f.label}
                </span>
              </Chip>
            ))}
          </div>
        )}
        <span className="px-1 text-13 font-semibold text-muted">{cabCountLine(shown.length)}</span>
        <OptionListCard>
          {shown.map((o) => (
            <CabOptionRow key={o.id} option={o} trip={trip} selected={chosen?.id === o.id} onSelect={() => setPick(o.id)} />
          ))}
        </OptionListCard>
        <InfoNote>{CAB_COPY.info}</InfoNote>
      </SheetBody>
      {card.action && chosen && (
        <SheetFooter>
          <Button type="button" variant="primary" size="xl" className="w-full" disabled={pending} aria-busy={pending} onClick={() => onBook(chosen.id, trip)}>
            {cabCtaLabel(chosen, trip)}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
