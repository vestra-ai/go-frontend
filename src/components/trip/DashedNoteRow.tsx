import { Card } from "@/components/ui/card"
import { EmojiTile } from "@/components/common/EmojiTile"
import { cn } from "@/lib/utils"

type DashedNoteRowProps = Omit<React.ComponentProps<typeof Card>, "title" | "children"> & {
  emoji: string
  title: string
  sub: string
}

/** Dashed "nothing here yet" row (Settle up, Transactions). */
function DashedNoteRow({ emoji, title, sub, className, ...props }: DashedNoteRowProps) {
  return (
    <Card
      variant="dashed"
      radius="2xl"
      data-slot="dashed-note-row"
      className={cn("flex items-center gap-3 p-4", className)}
      {...props}
    >
      <EmojiTile emoji={emoji} size={40} shape="circle" tint="white" />
      <div className="min-w-0">
        <div className="text-15 font-semibold">{title}</div>
        <div className="text-13 text-muted">{sub}</div>
      </div>
    </Card>
  )
}

export { DashedNoteRow }
