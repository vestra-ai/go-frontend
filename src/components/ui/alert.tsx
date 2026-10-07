import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Static notes (privacy, Go notes, outcome banners) — not live alerts, so role="note".
const noteVariants = cva(
  "flex items-center gap-2.5 rounded-4xl px-3.5 py-3 text-14 leading-[1.4]",
  {
    variants: {
      variant: {
        peach: "bg-go-note text-ink",
        green: "bg-success-soft text-success-ink",
        outline: "border border-line bg-white text-ink",
        navy: "bg-ink text-white",
      },
    },
    defaultVariants: { variant: "peach" },
  }
)

type NoteProps = React.ComponentProps<"div"> &
  VariantProps<typeof noteVariants> & {
    /** Leading slot: Lock 16, Go avatar 28, CheckBadge… */
    icon?: React.ReactNode
    /** Trailing slot, e.g. a friend's 28px avatar. */
    trailing?: React.ReactNode
  }

function Note({ className, variant, icon, trailing, children, ...props }: NoteProps) {
  return (
    <div
      data-slot="note"
      role="note"
      className={cn(noteVariants({ variant }), className)}
      {...props}
    >
      {icon}
      <div className="min-w-0 flex-1">{children}</div>
      {trailing}
    </div>
  )
}

export { Note, noteVariants }
