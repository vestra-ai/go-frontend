import { cn } from "@/lib/utils"
import { Check } from "@/components/icons/generated"

// Design size map: badge diameter -> check glyph size + stroke width.
const sizeMap = {
  14: { box: "size-[14px]", check: "size-2", stroke: 4 },
  16: { box: "size-4", check: "size-[9px]", stroke: 4 },
  18: { box: "size-[18px]", check: "size-[11px]", stroke: 3.5 },
  22: { box: "size-[22px]", check: "size-3", stroke: 4 },
  24: { box: "size-6", check: "size-[13px]", stroke: 4 },
  28: { box: "size-7", check: "size-[15px]", stroke: 4 },
  30: { box: "size-[30px]", check: "size-4", stroke: 4 },
} as const

type CheckBadgeProps = Omit<React.ComponentProps<"span">, "children"> & {
  size?: keyof typeof sizeMap
}

function CheckBadge({ size = 22, className, ...props }: CheckBadgeProps) {
  const s = sizeMap[size]
  return (
    <span
      aria-hidden
      data-slot="check-badge"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-success text-white",
        s.box,
        className
      )}
      {...props}
    >
      <Check className={s.check} strokeWidth={s.stroke} />
    </span>
  )
}

export { CheckBadge }
