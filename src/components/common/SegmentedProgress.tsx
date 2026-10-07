import { cn } from "@/lib/utils"

const sizes = {
  /** Booking card: 22×5 pills, 5px apart; empty = track-empty. */
  booking: { track: "gap-[5px]", segment: "h-[5px] w-[22px]", empty: "bg-track-empty" },
  /** Steps: full-width 4px bars, 6px apart; empty = line-2. */
  steps: { track: "gap-1.5", segment: "h-1 flex-1", empty: "bg-line-2" },
  /** Trip-home status: full-width 6px bars, 4px apart; empty = line. */
  status: { track: "gap-1", segment: "h-1.5 flex-1", empty: "bg-line" },
} as const

const toneClass = {
  success: "bg-success",
  ink: "bg-ink",
} as const

type SegmentedProgressProps = Omit<React.ComponentProps<"div">, "children"> & {
  segments: number
  filled: number
  size?: keyof typeof sizes
  /** Filled-segment colour. */
  tone?: keyof typeof toneClass
  /** Accessible summary ("0 of 5 decided"); without it the bar is decorative. */
  label?: string
  /** Extra classes per segment index, e.g. a slower fill transition on the last one. */
  segmentClassName?: (index: number) => string | undefined
}

function SegmentedProgress({
  segments,
  filled,
  size = "steps",
  tone = "success",
  label,
  segmentClassName,
  className,
  ...props
}: SegmentedProgressProps) {
  const s = sizes[size]
  return (
    <div
      data-slot="segmented-progress"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("flex", s.track, className)}
      {...props}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={cn(
            "block rounded-full transition-colors duration-200",
            s.segment,
            i < filled ? toneClass[tone] : s.empty,
            segmentClassName?.(i)
          )}
        />
      ))}
    </div>
  )
}

export { SegmentedProgress }
