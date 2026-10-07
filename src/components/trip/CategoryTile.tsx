import { Card } from "@/components/ui/card"
import { EmojiTile } from "@/components/common/EmojiTile"
import { cn } from "@/lib/utils"

const tones = {
  stay: { tint: "stay-soft", dot: "bg-stay" },
  travel: { tint: "travel-soft", dot: "bg-travel" },
} as const

type CategoryTileProps = Omit<React.ComponentProps<typeof Card>, "children"> & {
  tone: keyof typeof tones
  emoji: string
  label: string
  /** Pre-formatted, e.g. inr(43200). */
  amount: string
  /** Greys the amount (zero state). */
  zero?: boolean
}

/** Stay / Travel spend tile: emoji, amount, and a coloured legend dot with the label. */
function CategoryTile({ tone, emoji, label, amount, zero = false, className, ...props }: CategoryTileProps) {
  const t = tones[tone]
  return (
    <Card
      radius="lg"
      data-slot="category-tile"
      className={cn("flex items-center gap-2.5 p-3", className)}
      {...props}
    >
      <EmojiTile emoji={emoji} size={48} shape="rounded-xl" tint={t.tint} />
      <div className="flex flex-col gap-px">
        <span className={cn("text-18 font-semibold tabular-nums", zero && "text-faint")}>{amount}</span>
        <span className="flex items-center gap-1.5 text-13 text-muted">
          <span aria-hidden className={cn("size-2 rounded-full", t.dot)} />
          {label}
        </span>
      </div>
    </Card>
  )
}

export { CategoryTile }
