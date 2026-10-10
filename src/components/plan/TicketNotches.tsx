/**
 * The two semicircle cuts where a ticket's stub tears off (top and bottom, on the dashed line). They sit in a layer
 * clipped to the card, so each is a bite out of its own ticket: a circle left to stick out would show in the gap
 * between two stacked tickets and merge with its neighbour's. Place inside the card (`relative`, rounded); `stubWidth`
 * is the stub's width in px (the dashed line is its left edge).
 */
export function TicketNotches({ stubWidth }: { stubWidth: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute -inset-px overflow-hidden rounded-[inherit]">
      <span className="absolute inset-y-px right-px" style={{ width: stubWidth }}>
        <span className="absolute -left-[9px] -top-[9px] size-4 rounded-full bg-canvas" />
        <span className="absolute -bottom-[9px] -left-[9px] size-4 rounded-full bg-canvas" />
      </span>
    </span>
  );
}
