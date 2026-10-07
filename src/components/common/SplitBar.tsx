import { cn } from "@/lib/utils"

type SplitBarProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** `pct` is a 0-100 width; `color` is a background class (e.g. "bg-stay"). */
  segments: { pct: number; color: string }[]
  /** Accessible summary; the bar is an image. */
  label: string
  /** Grey track behind the segments (expenses-me and board; none for expenses-everyone). */
  track?: boolean
}

/** Stacked spend bar: separated rounded segments, 3px apart. */
function SplitBar({ segments, label, track = false, className, ...props }: SplitBarProps) {
  return (
    <div
      data-slot="split-bar"
      role="img"
      aria-label={label}
      className={cn("my-0.5 flex h-3 gap-[3px] overflow-hidden rounded-full", track && "bg-line", className)}
      {...props}
    >
      {segments.map((s, i) => (
        <span key={i} className={cn("min-w-0 rounded-full", s.color)} style={{ width: `${s.pct}%` }} />
      ))}
    </div>
  )
}

export { SplitBar }
