import Link from "next/link"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SegmentedProgress } from "@/components/common/SegmentedProgress"
import { cn } from "@/lib/utils"

type GoStatusCardProps = Omit<React.ComponentProps<typeof Card>, "title" | "children"> & {
  title: string
  sub: string
  progress?: { filled: number; total: number; label: string }
  cta?: { label: string; href: string }
}

/** Go avatar + title/sub, with an optional decided-progress bar or a full-width CTA. */
function GoStatusCard({ title, sub, progress, cta, className, ...props }: GoStatusCardProps) {
  return (
    <Card
      radius="2xl"
      data-slot="go-status-card"
      className={cn("flex flex-col gap-3 p-4", className)}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <Avatar size={36} kind="go" />
        <div className="flex flex-col gap-px">
          <span className="text-16 leading-[1.3] font-semibold tracking-body">{title}</span>
          <span className="text-13 tracking-caption text-muted">{sub}</span>
        </div>
      </div>
      {progress && (
        <div className="flex flex-col gap-1.5">
          <SegmentedProgress
            segments={progress.total}
            filled={progress.filled}
            size="status"
            label={progress.label}
          />
          <span className="text-13 text-muted">{progress.label}</span>
        </div>
      )}
      {cta && (
        <Button variant="primary" size="lg" asChild className="w-full px-[18px]">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      )}
    </Card>
  )
}

export { GoStatusCard }
