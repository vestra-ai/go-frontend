"use client";

import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import type { MapArea } from "@/data/seed/mapArt";
import { MAP_COPY } from "@/data/seed/map";

export interface MapScopeSwitchProps {
  value: MapArea;
  onChange: (value: MapArea) => void;
}

/** "Getting there" / "In Goa" chip pinned to the map's top-left corner. */
export function MapScopeSwitch({ value, onChange }: MapScopeSwitchProps) {
  return (
    <div className="absolute left-2.5 top-2.5 z-2">
      <SegmentedControl
        variant="scope"
        aria-label={MAP_COPY.areaLabel}
        value={value}
        onValueChange={(v) => onChange(v as MapArea)}
      >
        <SegmentedControlItem value="trip">{MAP_COPY.areas.trip}</SegmentedControlItem>
        <SegmentedControlItem value="goa">{MAP_COPY.areas.goa}</SegmentedControlItem>
      </SegmentedControl>
    </div>
  );
}
