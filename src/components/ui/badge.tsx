import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"
import { LiveDot } from "@/components/common/LiveDot"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full whitespace-nowrap",
  {
    variants: {
      variant: {
        "success-soft": "bg-success-soft text-success-ink",
        peach: "bg-go-soft text-go",
        neutral: "bg-surface-2 text-muted",
        amber: "bg-amber-soft text-amber-ink",
        navy: "bg-ink text-white",
        white: "border border-line bg-white text-ink",
        terracotta: "bg-go text-white",
        price: "bg-surface-3 text-ink tabular-nums",
        "price-selected": "bg-success text-white tabular-nums",
        glass: "bg-white/94 text-ink",
      },
      size: {
        xs: "h-5 px-[7px] text-11 font-bold",
        "2xs": "h-[22px] px-2 text-11 font-bold tracking-badge",
        sm: "h-[22px] px-2 text-12 font-bold",
        count: "h-6 min-w-6 px-[7px] text-13 font-bold tabular-nums",
        "price-sm": "h-[26px] px-[10px] text-13 font-bold tabular-nums",
        md: "h-7 px-[10px] text-13 font-semibold tracking-caption",
        "md-bold": "h-[26px] px-[9px] text-12 font-bold",
        rating: "h-[30px] px-[10px] text-14 font-bold",
        lg: "h-8 px-3 text-15 font-semibold",
        xl: "h-9 px-3 text-14 font-semibold",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  size = "sm",
  live = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Renders a leading pulsing LiveDot (7px). */
    live?: boolean
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {live && <LiveDot size={7} pulse />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Badge, badgeVariants }
