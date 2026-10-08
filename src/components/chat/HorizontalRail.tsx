import { cn } from "@/lib/utils";

// Rails bleed through the page's 16px side padding (`-mx-4`) so cards slide in from the left screen edge and out of the
// right one; the padding comes back as inner `px`, and `scroll-px` makes the first card's snap-start position the
// padded one, so mandatory snapping never swallows the lead-in on mount.
const railClass = {
  /** Chat rails: first card on the bubble column (16 page padding + 38 avatar column = 54px in). */
  chat: "-mx-4 pr-4 pl-[54px] scroll-pl-[54px] pt-1 pb-2.5",
  /** Trip-home call carousel (J-triphome-calls.md §1.2 C.3). */
  inset: "-mx-4 px-4 pt-0.5 pb-1.5",
} as const;

type HorizontalRailProps = React.ComponentProps<"div"> & {
  inset?: boolean;
};

/** Horizontal snap scroller for place/stay cards and the call carousel. Children set `snap-start` + `shrink-0`. */
export function HorizontalRail({ inset = false, className, ...props }: HorizontalRailProps) {
  return (
    <div
      className={cn(
        "flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto overscroll-x-contain scrollbar-none",
        railClass[inset ? "inset" : "chat"],
        className,
      )}
      {...props}
    />
  );
}
