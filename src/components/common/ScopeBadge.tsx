import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const scopes = {
  mine: { variant: "navy", label: "MINE" },
  shared: { variant: "peach", label: "SHARED" },
  group: { variant: "neutral", label: "GROUP" },
} as const

type ScopeBadgeProps = Omit<React.ComponentProps<typeof Badge>, "variant" | "size" | "children"> & {
  scope: keyof typeof scopes
}

/** MINE / SHARED / GROUP tag on an itinerary row. */
function ScopeBadge({ scope, className, ...props }: ScopeBadgeProps) {
  const s = scopes[scope]
  return (
    <Badge variant={s.variant} size="2xs" className={cn("shrink-0", className)} {...props}>
      {s.label}
    </Badge>
  )
}

export { ScopeBadge }
