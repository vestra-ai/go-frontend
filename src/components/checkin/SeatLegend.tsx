import { CHECKIN_COPY } from "@/data/seed/checkin";
import { cn } from "@/lib/utils";

const legend = CHECKIN_COPY.seat.legend;

const items = [
  { label: legend.free, swatch: "border-[1.5px] border-line-2 bg-white" },
  { label: legend.paid, swatch: "border-[1.5px] border-go-line bg-go-note" },
  { label: legend.taken, swatch: "bg-line" },
  { label: legend.friend, swatch: "border-2 border-info bg-info-tint-2" },
  { label: legend.you, swatch: "bg-black" },
];

export function SeatLegend({ className }: { className?: string }) {
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
