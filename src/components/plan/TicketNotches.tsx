import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Radius of a ticket's cut, in px. */
const CUT = 8;

/**
 * A ticket's shadow, for the element around a `TicketBody`. The body is masked, and a mask takes a `box-shadow` away
 * with it: a `drop-shadow` filter on the parent follows the cut shape instead, so the shadow dips into each cut.
 */
export const TICKET_SHADOW = {
  /** Bookings tab (`--shadow-float-sm`). */
  sm: "drop-shadow-[0_8px_24px_rgb(11_27_63/0.06)]",
  /** In the room (`--shadow-float`). */
  md: "drop-shadow-[0_8px_24px_rgb(11_27_63/0.08)]",
} as const;

/** Cuts the two semicircles out of the card itself, centred on its top and bottom edge where the stub tears off. */
function cutMask(stubWidth: number): CSSProperties {
  // The mask is laid over the border box; the stub sits inside the card's 1px border.
  const x = `calc(100% - ${stubWidth + 1}px)`;
  const hole = (y: string) => `radial-gradient(circle ${CUT}px at ${x} ${y}, transparent ${CUT - 0.5}px, #000 ${CUT}px)`;
  return { maskImage: `${hole("0")}, ${hole("100%")}`, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
}

/**
 * The outline of the two cuts: the card's own border, carried round each semicircle. Each is a ring a little wider than
 * its cut, whose outer half the mask takes away. Place inside a `TicketBody`; `stubWidth` is the stub's width in px
 * (the dashed line is its left edge).
 */
export function TicketNotches({ stubWidth }: { stubWidth: number }) {
  const ring = "absolute rounded-full border border-line-2";
  const box = { width: CUT * 2 + 2, height: CUT * 2 + 2, right: stubWidth - CUT - 1 };
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className={ring} style={{ ...box, top: -CUT - 2 }} />
      <span className={ring} style={{ ...box, bottom: -CUT - 2 }} />
    </span>
  );
}

type TicketBodyProps = ComponentProps<"div"> & {
  /** The torn stub's width in px: the cuts sit on its left edge. */
  stubWidth: number;
};

/**
 * The white card of a ticket with its two semicircle cuts. They are real cuts: whatever is behind the ticket shows
 * through them, and the shadow follows them. Put it inside an element that carries `TICKET_SHADOW`.
 */
export function TicketBody({ stubWidth, className, style, children, ...props }: TicketBodyProps) {
  return (
    <div
      className={cn("relative flex items-stretch rounded-5xl border border-line bg-white", className)}
      style={{ ...cutMask(stubWidth), ...style }}
      {...props}
    >
      {children}
      <TicketNotches stubWidth={stubWidth} />
    </div>
  );
}
