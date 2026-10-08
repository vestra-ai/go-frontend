"use client"

import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control"
import { scopeToggle } from "@/data/seed/copy"

export type ScopeValue = "everyone" | "me"

type ScopeToggleProps = Omit<
  React.ComponentProps<typeof SegmentedControl>,
  "value" | "onValueChange" | "variant" | "role" | "defaultValue"
> & {
  value: ScopeValue
  onValueChange: (value: ScopeValue) => void
}

/** Everyone / Just me tablist; `aria-label` defaults to "Whose plan" (Expenses passes "Whose view"). */
function ScopeToggle({
  value,
  onValueChange,
  "aria-label": ariaLabel = scopeToggle.label,
  ...props
}: ScopeToggleProps) {
  return (
    <SegmentedControl
      variant="contained"
      role="tablist"
      aria-label={ariaLabel}
      value={value}
      onValueChange={(v) => onValueChange(v as ScopeValue)}
      {...props}
    >
      <SegmentedControlItem value="everyone">{scopeToggle.everyone}</SegmentedControlItem>
      <SegmentedControlItem value="me">{scopeToggle.me}</SegmentedControlItem>
    </SegmentedControl>
  )
}

export { ScopeToggle }
