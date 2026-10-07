import { cn } from "@/lib/utils"

type KVRowProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  value: React.ReactNode
  size?: 14
}

/** Label (muted) / value (600, right) row. A hairline separates it from a preceding row. */
function KVRow({ label, value, size = 14, className, ...props }: KVRowProps) {
  return (
    <div
      data-slot="kv-row"
      data-row=""
      data-size={size}
      className={cn(
        "flex items-center justify-between gap-3 py-2.5 text-14 [[data-row]+&]:border-t [[data-row]+&]:border-line",
        className
      )}
      {...props}
    >
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  )
}

export { KVRow }
