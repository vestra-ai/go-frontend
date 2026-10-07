import { cn } from "@/lib/utils"

/** Static white placeholder block (no shimmer); size it with className. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("rounded-6xl bg-white", className)}
      {...props}
    />
  )
}

export { Skeleton }
