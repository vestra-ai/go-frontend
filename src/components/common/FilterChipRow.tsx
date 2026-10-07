"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type FilterChipRowProps = {
  options: { value: string; label: React.ReactNode }[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  "aria-label"?: string
}

/** Single-select horizontal scroll row of filter chips (route filters, cab filters, transactions). */
function FilterChipRow({
  options,
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel,
}: FilterChipRowProps) {
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
    </ToggleGroup>
  )
}

export { FilterChipRow }
