"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Toggle as TogglePrimitive } from "radix-ui"

import { chipVariants } from "@/components/ui/chip"

const toggleVariants = cva(
  "group/toggle inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap outline-none transition-[background-color,color,border-color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Chip lg outline: pressed (data-[state=on]) swaps to the green selected tint
        chip: chipVariants({ variant: "outline", size: "lg" }),
        tile: "flex-col items-start justify-start gap-0.5 rounded-3xl border border-line-2 bg-white p-3 text-left text-ink data-[state=on]:border-success data-[state=on]:bg-success-tint",
        upload:
          "h-28 flex-col gap-1.5 rounded-4xl border-[1.5px] border-dashed border-line-3 bg-white text-ink data-[state=on]:border-success data-[state=on]:bg-success-tint",
        seat: "size-10 rounded-xl p-0 text-11 font-bold",
      },
      seatState: {
        free: "",
        paid: "",
        taken: "",
        selected: "",
        friend: "",
      },
    },
    compoundVariants: [
      {
        variant: "seat",
        seatState: "free",
        className: "border-[1.5px] border-line-2 bg-white text-faint",
      },
      {
        variant: "seat",
        seatState: "paid",
        className: "border-[1.5px] border-go-line bg-go-note text-go",
      },
      {
        variant: "seat",
        seatState: "taken",
        className: "cursor-not-allowed bg-line text-line-4",
      },
      {
        variant: "seat",
        seatState: "selected",
        className: "bg-black text-white",
      },
      {
        variant: "seat",
        seatState: "friend",
        className: "border-2 border-info bg-info-tint-2",
      },
    ],
    defaultVariants: {
      variant: "chip",
    },
  }
)

type ToggleProps = React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>

function Toggle({
  className,
  variant = "chip",
  seatState,
  ...props
}: ToggleProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-variant={variant}
      className={cn(
        toggleVariants({
          variant,
          seatState: variant === "seat" ? (seatState ?? "free") : undefined,
        }),
        className
      )}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
