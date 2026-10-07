import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Press washes from the design: black fills lighten, light fills (#F2F2F2/#F4F5F7/#F6EAE6/#FFF/transparent) darken.
const pressOnDark = "active:shadow-[inset_0_0_0_999px_rgb(255_255_255/0.18)]"
const pressOnLight = "active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full whitespace-nowrap select-none transition-[scale,transform,box-shadow,background-color,opacity] duration-160 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:bg-line-2 disabled:text-faint-2 aria-disabled:pointer-events-none aria-disabled:bg-line-2 aria-disabled:text-faint-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    // Key order matters: `weight` comes after `variant` so tailwind-merge lets it override the variant's weight.
    variants: {
      variant: {
        primary: `bg-black font-medium text-white ${pressOnDark}`,
        secondary: `bg-surface-3 font-semibold text-ink ${pressOnLight}`,
        soft: `bg-surface-2 font-semibold text-ink ${pressOnLight}`,
        tint: `bg-go-soft font-semibold text-go ${pressOnLight}`,
        outline: `border border-line-2 bg-white font-semibold text-ink ${pressOnLight}`,
        "danger-outline": `border border-line-2 bg-white font-semibold text-danger ${pressOnLight}`,
        "danger-soft": "bg-danger-soft font-semibold text-danger",
        danger: "bg-danger font-medium text-white",
        success: "bg-success font-medium text-white",
        "success-ink": "bg-success-ink font-medium text-white",
        "success-soft": "bg-success-soft font-semibold text-success-ink",
        navy: "bg-ink font-medium text-white",
        glass: "bg-ink/35 font-semibold text-white backdrop-blur-[12px]",
        white: `bg-white font-semibold text-ink shadow-btn ${pressOnLight}`,
        ghost:
          "bg-transparent font-semibold active:opacity-60 disabled:bg-transparent aria-disabled:bg-transparent",
        link: "bg-transparent font-semibold text-go active:opacity-60 disabled:bg-transparent aria-disabled:bg-transparent",
        dashed: `border-[1.5px] border-dashed border-line-2 bg-transparent font-semibold text-ink ${pressOnLight}`,
      },
      size: {
        xl: "h-14 px-[18px] text-18 tracking-h4",
        lg: "h-[52px] px-[18px] text-16 tracking-h4",
        md: "h-[50px] px-[18px] text-16 tracking-h4",
        base: "h-11 px-4 text-15",
        sm: "h-9 gap-1.5 px-[14px] text-14 tracking-sm",
        xs: "h-8 gap-1.5 px-3 text-13",
        "2xs": "h-[30px] gap-1.5 px-[10px] text-13",
        "48": "h-12 px-[18px] text-15",
        "46": "h-[46px] px-[18px] text-15",
        "42": "h-[42px] px-[14px] text-14",
        "40": "h-10 px-[14px] text-14",
        "38": "h-[38px] px-[14px] text-14",
        "34": "h-[34px] px-[18px] text-14",
        icon: "size-11",
        "icon-lg": "size-12",
        "icon-sm": "size-10",
        "icon-xs": "size-9",
        "icon-2xs": "size-8",
      },
      weight: {
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "base",
    },
  }
)

/**
 * Pill button. `asChild` merges onto one child, e.g. `<Button asChild><Link href="/x">Go</Link></Button>`.
 * Icon-only sizes (`icon`, `icon-lg`, `icon-sm`, `icon-xs`, `icon-2xs`) have no text: pass `aria-label`.
 */
function Button({
  className,
  variant = "primary",
  size = "base",
  weight,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, weight, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
