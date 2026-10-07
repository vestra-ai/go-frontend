"use client"

import { List, Map as MapIcon } from "@/components/icons/generated"
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control"
import { viewToggle } from "@/data/seed/copy"

export type ViewMode = "list" | "map"

type ViewToggleProps = Omit<
  React.ComponentProps<typeof SegmentedControl>,
  "value" | "onValueChange" | "variant" | "role" | "defaultValue"
> & {
  value: ViewMode
  onValueChange: (value: ViewMode) => void
}

/** List / map icon switch (radiogroup). */
function ViewToggle({ value, onValueChange, "aria-label": ariaLabel = viewToggle.label, ...props }: ViewToggleProps) {
  return (
    <SegmentedControl
      variant="icon"
      aria-label={ariaLabel}
      value={value}
      onValueChange={(v) => onValueChange(v as ViewMode)}
      {...props}
    >
      <SegmentedControlItem value="list" aria-label={viewToggle.list}>
        <List className="size-[18px]" strokeWidth={2} />
      </SegmentedControlItem>
      <SegmentedControlItem value="map" aria-label={viewToggle.map}>
        <MapIcon className="size-[18px]" strokeWidth={2} />
      </SegmentedControlItem>
    </SegmentedControl>
  )
}

export { ViewToggle }
