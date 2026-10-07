import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

import { CheckBadge } from "@/components/common/CheckBadge"

const chipVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border whitespace-nowrap select-none transition-[scale,transform,box-shadow,background-color,border-color,color] duration-160 ease-out active:scale-[0.97] disabled:pointer-events-none",
  {
    // Key order matters: `variant` comes after `size` so e.g. `active` (600) overrides `md` (500).
    variants: {
      size: {
        xs: "h-9 px-3 text-13 font-semibold",
        sm: "h-[34px] px-3 text-13 font-semibold",
        md: "h-9 gap-[5px] px-[14px] text-14 font-medium tracking-sm",
        lg: "h-10 px-[14px] text-14 font-semibold",
        xl: "h-[42px] gap-2 px-[14px] text-14 font-semibold",
      },
      variant: {
        // Pressed (`aria-pressed`, or a Radix Toggle's `data-state=on`) swaps outline -> solid.
        outline:
          "border-line-2 bg-white text-ink active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)] aria-pressed:border-black aria-pressed:bg-black aria-pressed:text-white aria-pressed:active:shadow-[inset_0_0_0_999px_rgb(255_255_255/0.18)] data-[state=on]:border-black data-[state=on]:bg-black data-[state=on]:text-white data-[state=on]:active:shadow-[inset_0_0_0_999px_rgb(255_255_255/0.18)]",
        solid:
          "border-black bg-black text-white active:shadow-[inset_0_0_0_999px_rgb(255_255_255/0.18)]",
        dashed:
          "border-dashed border-faint bg-white text-ink active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]",
        active: "border-black bg-white font-semibold text-ink ring-1 ring-black",
        success: "border-success-soft bg-success-soft text-success-ink",
        plain: "cursor-default border-line bg-white text-ink active:scale-100",
      },
    },
    defaultVariants: {
      size: "lg",
      variant: "outline",
    },
  }
)

type ChipProps = React.ComponentProps<"button"> &
  VariantProps<typeof chipVariants> & {
    asChild?: boolean
    /** Leading emoji: a 14px glyph in a 16px slot, aria-hidden. */
    emoji?: React.ReactNode
    /** Sets `aria-pressed`; the outline variant renders solid black while pressed. */
    pressed?: boolean
    /** Trailing 16px green check badge (fact chip "set" state). */
    check?: boolean
  }

/** Pill chip. Renders a `<button>`, a `<span>` for `variant="plain"`, or its single child with `asChild`. */
function Chip({
  className,
  size = "lg",
  variant = "outline",
  asChild = false,
  emoji,
  pressed,
  check = false,
  children,
  ...props
}: ChipProps) {
  const Comp: React.ElementType = asChild
    ? Slot.Root
    : variant === "plain"
      ? "span"
      : "button"

  return (
    <Comp
      data-slot="chip"
      data-variant={variant}
      data-size={size}
      aria-pressed={pressed}
      {...(Comp === "button" && { type: "button" })}
      className={cn(chipVariants({ size, variant, className }))}
      {...props}
    >
      {emoji != null && (
        <span
          aria-hidden="true"
          className="flex w-4 shrink-0 justify-center text-14 leading-none"
        >
          {emoji}
        </span>
      )}
      <Slot.Slottable>{children}</Slot.Slottable>
      {check && <CheckBadge size={16} />}
    </Comp>
  )
}

export { Chip, chipVariants }
export type { ChipProps }
