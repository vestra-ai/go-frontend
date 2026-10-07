import type { PlanDay } from "@/data/types";

type DayStripProps = { days: PlanDay[] };

/** Four photo tiles with DAY n / weekday labels and a caption under each (F-travel.md §1.4). */
export function DayStrip({ days }: DayStripProps) {
  return (
    <div className="grid grid-cols-4 gap-2 px-3 pt-3 pb-1">
      {days.map((day) => (
        <div key={day.n} className="flex flex-col gap-1.5">
          <div className="relative h-[62px] overflow-hidden rounded-xl bg-frame-bg">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo */}
            <img src={day.img} alt="" className="size-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-b from-black/0 from-30% to-black/60" />
            <div className="absolute bottom-1.5 left-2 flex flex-col gap-0.5 leading-none text-white">
              <span className="text-9 font-bold tracking-eyebrow opacity-85">DAY {day.n}</span>
              <span className="text-11 font-bold tracking-eyebrow">{day.weekday}</span>
            </div>
          </div>
          <span className="text-12 leading-[1.3] tracking-[0.01em] text-balance text-muted">{day.caption}</span>
        </div>
      ))}
    </div>
  );
}
