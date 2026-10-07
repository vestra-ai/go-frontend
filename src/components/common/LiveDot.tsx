import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const liveDotVariants = cva("inline-block shrink-0 rounded-full bg-success", {
  variants: {
    size: {
      7: "size-[7px]",
      8: "size-2",
      10: "size-2.5",
    },
    pulse: {
      true: "animate-live",
      false: "",
    },
  },
  defaultVariants: { size: 8, pulse: true },
})

type LiveDotProps = Omit<React.ComponentProps<"span">, "children"> & {
  size?: 7 | 8 | 10
  pulse?: boolean
} & Omit<VariantProps<typeof liveDotVariants>, "size" | "pulse">

function LiveDot({ size = 8, pulse = true, className, ...props }: LiveDotProps) {
  return (
    <span
      aria-hidden
      data-slot="live-dot"
      className={cn(liveDotVariants({ size, pulse }), className)}
      {...props}
    />
  )
}

export { LiveDot, liveDotVariants }
