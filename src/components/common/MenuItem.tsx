import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Menu row styles, shared by ui/dropdown-menu items. Rows after the first get a hairline.
// Kept in this server-safe module (ui/dropdown-menu is "use client").
const menuItemVariants = cva(
  "flex w-full cursor-pointer items-center text-left text-ink outline-none select-none transition-[transform,box-shadow,opacity,background-color] duration-160 ease-out [[data-slot=menu-item]+&]:border-t [[data-slot=menu-item]+&]:border-line focus-visible:bg-surface-pressed focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-inset data-[highlighted]:bg-surface-pressed data-[disabled]:pointer-events-none data-[disabled]:opacity-50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Attach menu: 48 tall, 15/600, leading 18px emoji/icon. */
        menu: "h-12 gap-3 px-3.5 text-15 font-semibold active:scale-[0.97] active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]",
        /** Long-press menu: 52 tall, 16/500, label left, muted icon right. */
        wide: "h-[52px] justify-between gap-3 px-4 text-16 font-medium active:scale-[0.97] active:opacity-60",
      },
    },
    defaultVariants: { variant: "menu" },
  }
)

type MenuItemProps = Omit<React.ComponentProps<"button">, "children"> &
  VariantProps<typeof menuItemVariants> & {
    label: React.ReactNode
    /** `menu`: leading slot (a string renders as an 18px emoji). `wide`: trailing slot, muted. */
    icon?: React.ReactNode
  }

/**
 * A plain `<button>` menu row. Inside a DropdownMenu use
 * `<DropdownMenuItem asChild><MenuItem … /></DropdownMenuItem>`.
 */
function MenuItem({ label, icon, variant = "menu", className, ...props }: MenuItemProps) {
  const glyph =
    typeof icon === "string" ? (
      <span aria-hidden className="text-18 leading-none">
        {icon}
      </span>
    ) : (
      icon
    )

  return (
    <button
      type="button"
      className={cn(menuItemVariants({ variant }), className)}
      {...props}
      data-slot="menu-item"
    >
      {variant === "wide" ? (
        <>
          {label}
          {glyph && <span className="flex text-muted">{glyph}</span>}
        </>
      ) : (
        <>
          {glyph}
          {label}
        </>
      )}
    </button>
  )
}

export { MenuItem, menuItemVariants }
