import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const paddingClass = {
  /** Settings / pending / next-up lists. */
  rows: "px-3.5",
  /** Done / past-trip lists. */
  tight: "px-3.5 py-0.5",
} as const

type ListCardProps = React.ComponentProps<typeof Card> & {
  padding?: keyof typeof paddingClass
}

/** A Card (shadow, radius 22 by default) holding ListRow/KVRow children; rows draw their own dividers. */
function ListCard({ padding = "rows", className, ...props }: ListCardProps) {
  return (
    <Card
      data-slot="list-card"
      className={cn("flex flex-col", paddingClass[padding], className)}
      {...props}
    />
  )
}

export { ListCard }
