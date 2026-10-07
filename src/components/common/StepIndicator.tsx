import { cn } from "@/lib/utils"

type StepIndicatorProps = Omit<React.ComponentProps<"ol">, "children"> & {
  /** 1-based; steps up to and including it are active. */
  step: number
  /** One label per step ("1 · Details", "2 · Seat", "3 · Boarding pass"). */
  labels: readonly string[]
}

/** Check-in steps: 4px bars (ink / line-2) over 12/700 labels (ink / faint). */
function StepIndicator({ step, labels, className, ...props }: StepIndicatorProps) {
  return (
    <ol data-slot="step-indicator" className={cn("flex gap-1.5 px-0.5", className)} {...props}>
      {labels.map((label, i) => {
        const active = i < step
        return (
          <li
            key={label}
            aria-current={i === step - 1 ? "step" : undefined}
            className="flex flex-1 flex-col gap-1.5"
          >
            <span className={cn("h-1 rounded-full", active ? "bg-ink" : "bg-line-2")} />
            <span className={cn("text-12 font-bold", active ? "text-ink" : "text-faint")}>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export { StepIndicator }
