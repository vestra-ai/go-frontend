import Link from "next/link"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmojiTile } from "@/components/common/EmojiTile"
import { cn } from "@/lib/utils"

type EmptyHeroCardProps = Omit<React.ComponentProps<typeof Card>, "title" | "children"> & {
  emoji: string
  title: string
  body: string
  primary: { label: string; href: string; goAvatar?: boolean }
  secondary?: { label: string; href: string }
}

/** Centred empty state: emoji tile, title, body, a primary CTA and an optional tint secondary. */
function EmptyHeroCard({ emoji, title, body, primary, secondary, className, ...props }: EmptyHeroCardProps) {
  return (
    <Card
      radius="4xl"
      data-slot="empty-hero-card"
      className={cn("flex flex-col items-center gap-3 px-5 pt-[26px] pb-5 text-center", className)}
      {...props}
    >
      <EmojiTile emoji={emoji} size={64} shape="circle" tint="go-soft" />
      <div className="flex flex-col gap-1">
        <h2 className="text-20 leading-[1.3] font-semibold tracking-h3">{title}</h2>
        <p className="max-w-[300px] text-15 leading-[1.4] text-pretty text-muted">{body}</p>
      </div>
      <Button variant="primary" size="lg" asChild className="mt-1 w-full gap-2 self-stretch px-[18px]">
        <Link href={primary.href}>
          {primary.goAvatar && <Avatar size={26} kind="go" />}
          {primary.label}
        </Link>
      </Button>
      {secondary && (
        <Button variant="tint" size="base" asChild className="h-12 w-full self-stretch px-3.5 tracking-sm">
          <Link href={secondary.href}>{secondary.label}</Link>
        </Button>
      )}
    </Card>
  )
}

export { EmptyHeroCard }
