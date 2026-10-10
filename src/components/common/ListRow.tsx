import Link from "next/link"
import { ChevronRight } from "@/components/icons/generated"
import { cn } from "@/lib/utils"

// Static maps: never build class names from template strings.
const padClass = {
  default: "py-3",
  dense: "py-2.5",
  /** Profile settings rows. */
  settings: "py-[13px]",
} as const

const titleSizeClass = {
  15: "text-15",
  16: "text-16 leading-[1.3] tracking-body",
} as const

type ListRowProps = {
  leading?: React.ReactNode
  title: React.ReactNode
  sub?: React.ReactNode
  /** Right slot (badge, switch, button). */
  trailing?: React.ReactNode
  /** Trailing 16px faint chevron (after `trailing`). */
  chevron?: boolean
  /** Renders a next/link row. */
  href?: string
  /** Renders a `<button>` row. */
  onClick?: React.MouseEventHandler<HTMLElement>
  /** Done rows: muted title. */
  muted?: boolean
  /** py-2.5 instead of py-3 (same as `pad="dense"`). */
  dense?: boolean
  /** Vertical padding: default py-3 · dense py-2.5 · settings py-[13px]. Wins over `dense`. */
  pad?: keyof typeof padClass
  /** Title size in px: 15 (default) or 16 (16/1.3, body tracking). */
  titleSize?: keyof typeof titleSizeClass
  className?: string
  "aria-label"?: string
}

/**
 * Leading · title/sub · trailing row for ListCard. Interactive when given `href` or
 * `onClick` (press scale + pressed background); a hairline separates it from a preceding row.
 */
function ListRow({
  leading,
  title,
  sub,
  trailing,
  chevron = false,
  href,
  onClick,
  muted = false,
  dense = false,
  pad,
  titleSize = 15,
  className,
  "aria-label": ariaLabel,
}: ListRowProps) {
  const interactive = href !== undefined || onClick !== undefined
  const classes = cn(
    "flex w-full items-center gap-3 text-left text-ink [[data-row]+&]:border-t [[data-row]+&]:border-line",
    padClass[pad ?? (dense ? "dense" : "default")],
    interactive &&
      "cursor-pointer outline-none transition-[transform,background-color] duration-160 ease-out focus-visible:bg-surface-pressed focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-inset active:scale-[0.985] active:bg-surface-pressed",
    className
  )
  const content = (
    <>
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className={cn(titleSizeClass[titleSize], "font-semibold", muted && "text-muted")}>{title}</span>
        {sub && <span className="text-13 tracking-caption text-muted">{sub}</span>}
      </span>
      {trailing}
      {chevron && <ChevronRight className="size-4 shrink-0 text-faint" strokeWidth={2.4} />}
    </>
  )

  if (href !== undefined) {
    return (
      <Link href={href} onClick={onClick} data-slot="list-row" data-row="" aria-label={ariaLabel} className={classes}>
        {content}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} data-slot="list-row" data-row="" aria-label={ariaLabel} className={classes}>
        {content}
      </button>
    )
  }
  return (
    <div data-slot="list-row" data-row="" aria-label={ariaLabel} className={classes}>
      {content}
    </div>
  )
}

export { ListRow }
