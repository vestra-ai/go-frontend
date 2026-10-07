import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Shapes style a standalone <input>. `inline` is the unstyled text field used
// inside a wrapper that carries the shape (see InputField / SearchField).
const inputVariants = cva(
  "min-w-0 text-16 tracking-body text-ink outline-none transition-colors placeholder:text-muted disabled:pointer-events-none disabled:opacity-50 [&::-webkit-search-cancel-button]:appearance-none",
  {
    variants: {
      shape: {
        pill: "h-12 w-full rounded-full bg-white px-4",
        "pill-grey": "h-12 w-full rounded-full bg-surface-2 px-4",
        field:
          "h-[52px] w-full rounded-3xl border border-line-2 bg-white px-4 focus-visible:border-ink aria-invalid:border-danger",
        search:
          "h-[52px] w-full rounded-3xl border-[1.5px] border-ink bg-white px-4",
        bare: "w-[170px] border-0 bg-transparent p-0 text-44 font-bold tracking-display tabular-nums",
        ask: "h-[52px] w-full rounded-full bg-surface-2 pl-4 pr-1.5",
        inline: "flex-1 border-0 bg-transparent p-0",
      },
    },
    defaultVariants: { shape: "field" },
  }
)

// Wrapper classes for shapes that host icons / trailing slots around an `inline` input.
const inputShellVariants = cva(
  "flex items-center gap-2.5 transition-colors focus-within:border-ink",
  {
    variants: {
      shape: {
        pill: "h-12 w-full rounded-full bg-white px-4",
        "pill-grey": "h-12 w-full rounded-full bg-surface-2 px-4",
        field: "h-[52px] w-full rounded-3xl border border-line-2 bg-white px-4",
        search: "h-[52px] w-full rounded-3xl border-[1.5px] border-ink bg-white px-4",
        bare: "w-[170px]",
        ask: "h-[52px] w-full rounded-full bg-surface-2 pl-4 pr-1.5",
      },
    },
    defaultVariants: { shape: "field" },
  }
)

type InputShape = NonNullable<VariantProps<typeof inputVariants>["shape"]>

function Input({
  className,
  type,
  shape = "field",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & { shape?: InputShape }) {
  return (
    <input
      type={type}
      data-slot="input"
      data-shape={shape}
      className={cn(inputVariants({ shape }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants, inputShellVariants }
export type { InputShape }
