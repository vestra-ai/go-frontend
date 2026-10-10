import { CHECKIN_COPY } from "@/data/seed/checkin";
import { cn } from "@/lib/utils";

const legend = CHECKIN_COPY.seat.legend;

type SeatLegendProps = {
  /** The companion's first name: their swatch only shows when there is one. */
  friend?: string;
  /** The price of a paid seat ("₹450"), when the map has any. */
  paid?: string;
  className?: string;
};

export function SeatLegend({ friend, paid, className }: SeatLegendProps) {
  const items = [
    { label: legend.free, swatch: "border-[1.5px] border-line-2 bg-white" },
    ...(paid ? [{ label: paid, swatch: "border-[1.5px] border-go-line bg-go-note" }] : []),
    { label: legend.taken, swatch: "bg-line" },
    ...(friend ? [{ label: friend, swatch: "border-2 border-info bg-info-tint-2" }] : []),
    { label: legend.you, swatch: "bg-black" },
  ];
  return (
    <ul className={cn("flex flex-wrap justify-center gap-3", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-[5px] text-13 tracking-caption text-muted">
          <span aria-hidden className={cn("size-3.5 rounded-sm", item.swatch)} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
