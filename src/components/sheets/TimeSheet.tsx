"use client";

import { Eyebrow } from "@/components/common/Eyebrow";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ROUTE_COPY, TIME_SLOTS } from "@/data/seed/routes";
import type { SlotId, TripType } from "@/data/types";
import { applyLabel } from "@/lib/routes";

type Leg = "on" | "ret";

type TimeSheetProps = {
  open: boolean;
  trip: TripType;
  codes: [string, string];
  /** The day each leg leaves ("Fri 6"), for the eyebrows. */
  days: [string, string];
  draft: { on: SlotId[]; ret: SlotId[] };
  /** Options the drafts would show (`previewCount`). */
  preview: number;
  onToggle: (leg: Leg, id: SlotId) => void;
  /** Empties both drafts; the sheet stays open and nothing is applied. */
  onClear: () => void;
  onApply: () => void;
  /** X, backdrop, drag: drafts discarded. */
  onClose: () => void;
};

function SlotGrid({ leg, selected, onToggle }: { leg: Leg; selected: SlotId[]; onToggle: TimeSheetProps["onToggle"] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {TIME_SLOTS.map((slot) => (
        <Toggle
          key={slot.id}
          variant="tile"
          pressed={selected.includes(slot.id)}
          onPressedChange={() => onToggle(leg, slot.id)}
        >
          <span aria-hidden className="text-18">
            {slot.emoji}
          </span>
          <span className="text-15 font-semibold">{slot.name}</span>
          <span className="text-13 opacity-75">{slot.range}</span>
        </Toggle>
      ))}
    </div>
  );
}

/** F3 "Preferred times": nested over the route sheet (which stays put), onward + return slot grids. */
export function TimeSheet({ open, trip, codes, days, draft, preview, onToggle, onClear, onApply, onClose }: TimeSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      nested
      maxHeight={760}
    >
      <SheetBody className="gap-3.5 pb-[130px]">
        <SheetHeader title={ROUTE_COPY.time.title} subtitle={ROUTE_COPY.time.sub} closeLabel={ROUTE_COPY.close} />
        <Eyebrow className="px-1">{ROUTE_COPY.time.onwardEyebrow(codes[0], days[0])}</Eyebrow>
        <SlotGrid leg="on" selected={draft.on} onToggle={onToggle} />
        {trip === "round" && (
          <div className="flex flex-col gap-3.5">
            <Eyebrow className="px-1">{ROUTE_COPY.time.returnEyebrow(codes[1], days[1])}</Eyebrow>
            <SlotGrid leg="ret" selected={draft.ret} onToggle={onToggle} />
          </div>
        )}
      </SheetBody>
      <SheetFooter className="flex-row gap-2 pt-[30px]">
        <Button
          type="button"
          variant="secondary"
          size="xl"
          className="px-[22px] text-16 font-semibold tracking-body"
          onClick={onClear}
        >
          {ROUTE_COPY.time.clear}
        </Button>
        <Button type="button" variant="primary" size="xl" className="flex-1 text-17" onClick={onApply}>
          {applyLabel(preview)}
        </Button>
      </SheetFooter>
    </BottomSheet>
  );
}
