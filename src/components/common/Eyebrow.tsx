import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 11/700 caption with eyebrow tracking. Copy is typed in uppercase (no text-transform).
const eyebrowVariants = cva("font-bold tracking-eyebrow", {
  variants: {
    tone: {
      muted: "text-muted",
      go: "text-go",
      white: "text-white",
    },
    size: {
      11: "text-11",
      12: "text-12",
    },
  },
  defaultVariants: { tone: "muted", size: 11 },
})

type EyebrowProps = React.ComponentProps<"span"> & VariantProps<typeof eyebrowVariants>

function Eyebrow({ tone, size, className, ...props }: EyebrowProps) {
  return (
    <span
      data-slot="eyebrow"
      className={cn("block", eyebrowVariants({ tone, size }), className)}
      {...props}
    />
  )
}

export { Eyebrow, eyebrowVariants }
