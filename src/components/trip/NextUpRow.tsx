import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmojiTile } from "@/components/common/EmojiTile"
import { cn } from "@/lib/utils"

type NextUpRowProps = Omit<React.ComponentProps<"div">, "title"> & {
  emoji: string
  title: string
  sub: string
  action: { label: string; href: string }
}

/** One "Next up" row; place inside `ListCard padding="rows"` (divider from the second row on). */
function NextUpRow({ emoji, title, sub, action, className, ...props }: NextUpRowProps) {
  return (
    <div
      data-slot="next-up-row"
      className={cn("flex items-center gap-3 py-3 not-first:border-t not-first:border-line", className)}
      {...props}
    >
      <EmojiTile emoji={emoji} size={40} shape="circle" tint="surface-2" />
      <div className="min-w-0 flex-1">
        <div className="text-16 leading-[1.3] font-semibold tracking-body">{title}</div>
        <div className="text-13 tracking-caption text-muted">{sub}</div>
      </div>
      <Button variant="tint" size="xs" asChild className="px-3.5 tracking-sm">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </div>
  )
}

export { NextUpRow }
