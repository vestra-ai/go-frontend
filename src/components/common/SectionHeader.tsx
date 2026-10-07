import { LiveDot } from "@/components/common/LiveDot"
import { cn } from "@/lib/utils"

type SectionHeaderProps = Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode
  /** Right-aligned 13/600 muted label ("2 active", "Updates live"). */
  meta?: React.ReactNode
  /** Pulsing 8px live dot after the title. */
  live?: boolean
}

/** 20/600 list heading with optional meta; callers set the top margin. */
function SectionHeader({ title, meta, live = false, className, ...props }: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn("flex items-baseline justify-between gap-3 px-1", className)}
      {...props}
    >
      <h2 className="flex items-center gap-2 text-20 font-semibold tracking-h3">
        {title}
        {live && <LiveDot size={8} />}
      </h2>
      {meta && (
        <span className="shrink-0 text-13 font-semibold tracking-caption text-muted">{meta}</span>
      )}
    </div>
  )
}

export { SectionHeader }
