"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Chip } from "@/components/ui/chip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type FilterChipRowProps = {
  options: { value: string; label: React.ReactNode }[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  "aria-label"?: string
  /** Rendered after the chips, inside the scroll row (e.g. the route sheet's time chip). */
  trailing?: React.ReactNode
  /**
   * `toggle` (default): a Radix single-select ToggleGroup. `pressed`: a `role="group"` row of `Chip size="lg"`
   * buttons with `aria-pressed`, 6px apart (route sheet).
   */
  mode?: "toggle" | "pressed"
}

/** Single-select horizontal scroll row of filter chips (route filters, cab filters, transactions). */
function FilterChipRow({
  options,
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel,
  trailing,
  mode = "toggle",
}: FilterChipRowProps) {
  if (mode === "pressed") {
    return (
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn("flex gap-1.5 overflow-x-auto px-4 scrollbar-none", className)}
      >
        {options.map((o) => (
          <Chip
            key={o.value}
            size="lg"
            pressed={value === o.value}
            onClick={() => onValueChange(o.value)}
            className="transition-colors duration-160"
          >
            {o.label}
          </Chip>
        ))}
        {trailing}
      </div>
    )
  }

  return (
    <ToggleGroup
      type="single"
      variant="chip"
      aria-label={ariaLabel}
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next)
      }}
      className={cn(
        "scrollbar-none flex-nowrap overflow-x-auto px-4",
        className
      )}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value}>
          {o.label}
        </ToggleGroupItem>
      ))}
      {trailing}
    </ToggleGroup>
  )
}

export { FilterChipRow }
