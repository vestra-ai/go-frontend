"use client";

import { useState } from "react";
import { InfoNote } from "@/components/common/InfoNote";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { CAB_COPY, CAB_FILTERS, DEFAULT_CAB_ID } from "@/data/seed/cabs";
import { ROUTE_COPY, TRIP_TYPES } from "@/data/seed/routes";
import type { CabOption, TripId, TripType } from "@/data/types";
import { cabCountLine, cabCtaLabel, chosenCab, visibleCabs } from "@/lib/routes";
import { useStore } from "@/store";
import { CabOptionRow } from "./CabOptionRow";
import { LegSummaryCard } from "./LegSummaryCard";
import { OptionListCard } from "./OptionListCard";

type CabSheetProps = {
  tripId: TripId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CabFilter = "all" | CabOption["kind"];

// DESIGN-ASSUMPTION (PLAN §12.1 #13): no per-person split, seat picker or headcount; the CTA shows the total only.
/** F5 airport cab to Villa Sol: local trip / car filter / pick (reset on every open), then `bookCab`. */
export function CabSheet({ tripId, open, onOpenChange }: CabSheetProps) {
  const [trip, setTrip] = useState<TripType>("round");
  const [filt, setFilt] = useState<CabFilter>("all");
  const [pick, setPick] = useState(DEFAULT_CAB_ID);

  // Every open starts from the design default: Round trip · All · s1.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTrip("round");
      setFilt("all");
      setPick(DEFAULT_CAB_ID);
    }
  }

  const shown = visibleCabs(filt);
  const chosen = chosenCab(shown, pick);
  const legs = trip === "round" ? [CAB_COPY.pickup, CAB_COPY.drop] : [CAB_COPY.pickup];

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={110}>
      <SheetBody>
        <SheetHeader title={CAB_COPY.title} subtitle={CAB_COPY.sub} closeLabel={ROUTE_COPY.close} />

        <SegmentedControl
          variant="contained"
          aria-label={ROUTE_COPY.tripTypeLabel}
          value={trip}
          onValueChange={(v) => setTrip(v as TripType)}
        >
          {TRIP_TYPES.map((t) => (
            <SegmentedControlItem key={t.id} value={t.id}>
              {t.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>

        <LegSummaryCard legs={legs} />

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

        <span className="px-1 text-13 font-semibold text-muted">{cabCountLine(shown.length)}</span>

        <OptionListCard>
          {shown.map((o) => (
            <CabOptionRow key={o.id} option={o} trip={trip} selected={chosen.id === o.id} onSelect={() => setPick(o.id)} />
          ))}
        </OptionListCard>

        <InfoNote>{CAB_COPY.info}</InfoNote>
      </SheetBody>

      <SheetFooter>
        <Button
          type="button"
          variant="primary"
          size="xl"
          className="w-full"
          onClick={() => {
            useStore.getState().bookCab(tripId, { optionId: chosen.id, trip });
            onOpenChange(false);
          }}
        >
          {cabCtaLabel(chosen, trip)}
        </Button>
      </SheetFooter>
    </BottomSheet>
  );
}
