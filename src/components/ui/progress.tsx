"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// The bar is sized by width (not shadcn's translateX) so `animate` can run the
// design's scaleX fill from the left edge.
function Progress({
  className,
  value,
  animate = false,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  /** Plays `animate-fill` (scaleX 0.15 → 1, 1400ms after 500ms). */
  animate?: boolean
}) {
  const pct = Math.min(100, Math.max(0, value ?? 0))
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("relative h-1 w-full overflow-hidden rounded-full bg-success-soft", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full origin-left rounded-full bg-success", animate && "animate-fill")}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
