"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Separator as SeparatorPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// Orientation is a cva key (not a data-[orientation] variant) so callers can
// override widths/colours with plain classes, e.g. `border-t-2 border-line`.
const separatorVariants = cva("shrink-0", {
  variants: {
    variant: {
      /** 1px hairline. */
      line: "bg-line",
      /** 1.5px dashed (ticket tear lines, stub edges). */
      dashed: "border-dashed border-line-2",
    },
    orientation: {
      horizontal: "w-full",
      vertical: "self-stretch",
    },
  },
  compoundVariants: [
    { variant: "line", orientation: "horizontal", className: "h-px" },
    { variant: "line", orientation: "vertical", className: "w-px" },
    { variant: "dashed", orientation: "horizontal", className: "border-t-[1.5px]" },
    { variant: "dashed", orientation: "vertical", className: "border-l-[1.5px]" },
  ],
  defaultVariants: { variant: "line", orientation: "horizontal" },
})

function Separator({
  className,
  variant,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> &
  Omit<VariantProps<typeof separatorVariants>, "orientation">) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(separatorVariants({ variant, orientation }), className)}
      {...props}
    />
  )
}

export { Separator, separatorVariants }
