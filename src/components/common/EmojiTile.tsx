import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const emojiTileVariants = cva("inline-flex shrink-0 items-center justify-center", {
  variants: {
    shape: {
      circle: "rounded-full",
      "rounded-xl": "rounded-xl",
      "rounded-2xl": "rounded-2xl",
    },
    tint: {
      "surface-2": "bg-surface-2",
      white: "bg-white",
      "go-soft": "bg-go-soft",
      "amber-soft": "bg-amber-soft",
      "info-tint": "bg-info-tint",
      "success-soft": "bg-success-soft",
      "peach-tint": "bg-peach-tint",
      "peach-tint-2": "bg-peach-tint-2",
      "stay-soft": "bg-stay-soft",
      "travel-soft": "bg-travel-soft",
    },
  },
  defaultVariants: { shape: "circle", tint: "surface-2" },
})

// Tile diameter -> emoji glyph size (roughly 0.45x, matching the design's 36 -> 16, 40 -> 18).
const sizeMap = {
  34: "size-[34px] text-15",
  36: "size-9 text-16",
  40: "size-10 text-18",
  44: "size-11 text-20",
  48: "size-12 text-22",
  52: "size-[52px] text-24",
  56: "size-14 text-26",
  64: "size-16 text-30",
} as const

type EmojiTileTint = NonNullable<VariantProps<typeof emojiTileVariants>["tint"]>
type EmojiTileShape = NonNullable<VariantProps<typeof emojiTileVariants>["shape"]>

type EmojiTileProps = Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof emojiTileVariants> & {
    emoji: string
    size?: keyof typeof sizeMap
  }

function EmojiTile({ emoji, size = 36, shape, tint, className, ...props }: EmojiTileProps) {
  return (
    <span
      data-slot="emoji-tile"
      className={cn(emojiTileVariants({ shape, tint }), sizeMap[size], className)}
      {...props}
    >
      <span aria-hidden className="leading-none">
        {emoji}
      </span>
    </span>
  )
}

export { EmojiTile, emojiTileVariants }
export type { EmojiTileTint, EmojiTileShape }
