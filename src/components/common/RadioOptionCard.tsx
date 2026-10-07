"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { EmojiTile, type EmojiTileShape, type EmojiTileTint } from "@/components/common/EmojiTile"
import { RadioGroupItem, type radioIndicatorVariants } from "@/components/ui/radio-group"
import type { VariantProps } from "class-variance-authority"

type RadioOptionCardProps = Omit<React.ComponentProps<typeof RadioGroupItem>, "title" | "children"> &
  VariantProps<typeof radioIndicatorVariants> & {
    title: React.ReactNode
    sub?: React.ReactNode
    /** Emoji for the leading 36px EmojiTile (rendered aria-hidden). */
    emoji?: string
    /** Tile background (EmojiTile `tint`). Default surface-2. */
    emojiTint?: EmojiTileTint
    /** Tile shape. Default rounded-xl; the pay sheet's method tiles are circles. */
    emojiShape?: Extract<EmojiTileShape, "rounded-xl" | "circle">
  }

/** Must be rendered inside <RadioGroup>. */
function RadioOptionCard({
  title,
  sub,
  emoji,
  emojiTint = "surface-2",
  emojiShape = "rounded-xl",
  id,
  variant,
  className,
  ...props
}: RadioOptionCardProps) {
  const autoId = React.useId()
  const itemId = id ?? autoId

  return (
    <label
      htmlFor={itemId}
      data-slot="radio-option-card"
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-4xl border border-line bg-white p-[14px_16px] has-[[data-state=checked]]:border-[1.5px] has-[[data-state=checked]]:border-ink has-[[data-state=checked]]:p-[13.5px_15.5px]",
        className
      )}
    >
      {emoji && <EmojiTile emoji={emoji} size={36} shape={emojiShape} tint={emojiTint} />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-15 font-semibold tracking-sub text-ink">{title}</span>
        {sub && <span className="text-13 tracking-caption text-muted">{sub}</span>}
      </span>
      <RadioGroupItem id={itemId} variant={variant} {...props} />
    </label>
  )
}

export { RadioOptionCard }
export type { RadioOptionCardProps }
