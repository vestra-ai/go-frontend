import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eyebrow } from "@/components/common/Eyebrow"
import { cn } from "@/lib/utils"

type TicketStubPlaceholderProps = Omit<React.ComponentProps<"div">, "title"> & {
  emoji: string
  eyebrow: string
  title: string
  action: { label: string; href: string }
}

/** Dashed empty booking slot: emoji stub, eyebrow + title, dashed-divided action. */
function TicketStubPlaceholder({ emoji, eyebrow, title, action, className, ...props }: TicketStubPlaceholderProps) {
  return (
    <div
      data-slot="ticket-stub-placeholder"
      className={cn(
        "relative flex h-[88px] items-stretch rounded-5xl border-[1.5px] border-dashed border-line-2 bg-white",
        className
      )}
      {...props}
    >
      <span aria-hidden className="grid w-[84px] shrink-0 place-items-center rounded-l-5xl bg-canvas text-[28px]">
        {emoji}
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3.5 py-3">
        <Eyebrow tone="muted" className="leading-[1.35]">
          {eyebrow}
        </Eyebrow>
        <span className="text-18 leading-[1.25] font-semibold tracking-h4">{title}</span>
      </div>
      <div className="grid w-24 shrink-0 place-items-center border-l-[1.5px] border-dashed border-line-2">
        <Button variant="tint" size="xs" asChild className="px-3.5 tracking-sm">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      </div>
    </div>
  )
}

export { TicketStubPlaceholder }
