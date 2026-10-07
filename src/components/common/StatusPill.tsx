import { Badge } from "@/components/ui/badge"

// Palette by status: success = done/sent/booked, amber = partial, peach = not yet, neutral = started/idle.
const statusVariant = {
  success: "success-soft",
  amber: "amber",
  peach: "peach",
  neutral: "neutral",
} as const

type StatusPillProps = Omit<React.ComponentProps<typeof Badge>, "variant" | "size" | "asChild"> & {
  status: keyof typeof statusVariant
}

function StatusPill({ status, ...props }: StatusPillProps) {
  return <Badge data-slot="status-pill" variant={statusVariant[status]} size="md" {...props} />
}

export { StatusPill }
