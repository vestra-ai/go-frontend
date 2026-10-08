"use client";

import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import type { MapArea } from "@/data/seed/mapArt";
import { MAP_COPY } from "@/data/seed/map";

export interface MapScopeSwitchProps {
  value: MapArea;
  onChange: (value: MapArea) => void;
}

// Active segment uses the same green as the app's active chips (the selected tint with a green border), not black.
const ACTIVE_GREEN =
  "border border-transparent px-3.5 data-[state=on]:border-success data-[state=on]:bg-success-tint data-[state=on]:text-ink";

/** "Onward" / "Return" chip pinned to the map's top-left; the full names ("Getting there", "Coming back") are the labels. */
export function MapScopeSwitch({ value, onChange }: MapScopeSwitchProps) {
  return (
    <div className="absolute left-2.5 top-2.5 z-2">
      <SegmentedControl
        variant="scope"
        aria-label={MAP_COPY.areaLabel}
        value={value}
        onValueChange={(v) => onChange(v as MapArea)}
      >
        <SegmentedControlItem value="trip" aria-label={MAP_COPY.areas.trip} title={MAP_COPY.areas.trip} className={ACTIVE_GREEN}>
          {MAP_COPY.areaWord.trip}
        </SegmentedControlItem>
        <SegmentedControlItem value="back" aria-label={MAP_COPY.areas.back} title={MAP_COPY.areas.back} className={ACTIVE_GREEN}>
          {MAP_COPY.areaWord.back}
        </SegmentedControlItem>
      </SegmentedControl>
    </div>
  );
}
