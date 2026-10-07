import { cn } from "@/lib/utils";

// scroll-px-4 makes the first card's snap-start position the padded one, so
// mandatory snapping never swallows the 16px lead-in on mount.
const railClass = {
  /** Chat rails: left edge on the bubble column (38px in), bleeding to the right frame edge. */
  chat: "-mr-4 ml-[22px] px-4 pt-1 pb-2.5",
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
