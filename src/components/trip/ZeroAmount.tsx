import { cn } from "@/lib/utils"

type ZeroAmountProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Pre-formatted, e.g. inr(0). */
  amount: string
  caption: string
}

/** Greyed 44px amount with a caption (zero-spend headline). */
function ZeroAmount({ amount, caption, className, ...props }: ZeroAmountProps) {
  return (
    <div
      data-slot="zero-amount"
      className={cn("flex items-start justify-between gap-3 pt-1 pl-1", className)}
      {...props}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-44 leading-[1.05] font-bold tracking-display text-faint tabular-nums">{amount}</span>
        <span className="text-15 text-muted tabular-nums">{caption}</span>
      </div>
    </div>
  )
}

export { ZeroAmount }
