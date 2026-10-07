import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

// Padding is left to callers. Radius names follow PLAN §7.1 (lg 18 · xl 20 · 2xl 22 · 3xl 24 · 4xl 28).
const cardVariants = cva("text-ink", {
  variants: {
    variant: {
      shadow: "bg-white shadow-card",
      outline: "border border-line bg-white",
      float: "border border-line bg-white shadow-float",
      "float-sm": "border border-line bg-white shadow-float-sm",
      dashed: "border-[1.5px] border-dashed border-line-2 bg-transparent",
      tint: "bg-go-note",
      glass: "border border-white bg-white/86 shadow-glass backdrop-blur-[10px]",
      navy: "bg-ink text-white",
    },
    radius: {
      lg: "rounded-4xl",
      xl: "rounded-5xl",
      "2xl": "rounded-6xl",
      "3xl": "rounded-7xl",
      "4xl": "rounded-8xl",
    },
  },
  defaultVariants: { variant: "shadow", radius: "2xl" },
})

function Card({
  className,
  variant,
  radius,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="card"
      data-variant={variant ?? "shadow"}
      className={cn(cardVariants({ variant, radius }), className)}
      {...props}
    />
  )
}

export { Card, cardVariants }
