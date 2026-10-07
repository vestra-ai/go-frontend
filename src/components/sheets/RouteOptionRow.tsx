import Image from "next/image";
import { Stopwatch } from "@/components/icons/generated";
import { Badge } from "@/components/ui/badge";
import { ROUTE_MODES } from "@/data/seed/routes";
import type { RouteLeg, RouteOption, TripType } from "@/data/types";
import { assets } from "@/lib/assets";
import { inr } from "@/lib/format";
import { priceOf } from "@/lib/routes";
import { cn } from "@/lib/utils";

type RouteOptionRowProps = {
  option: RouteOption;
  trip: TripType;
  selected: boolean;
  onSelect: () => void;
};

// Static maps: never build class names from template strings.
const tagTone: Record<string, string> = { mix: "text-info", stop: "text-go" };

function CarrierTile({ leg, modeEmoji }: { leg: RouteLeg; modeEmoji: string }) {
  if (leg.carrier === "indigo")
    return (
      <span className="grid h-[30px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-indigo">
        <Image src={assets.indigo.src} alt={assets.indigo.alt} width={assets.indigo.width} height={assets.indigo.height} className="h-auto w-10" />
      </span>
    );
  if (leg.carrier === "airindia")
    return (
      <span className="grid h-[30px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[9px] border border-line bg-white">
        <Image src={assets.airIndia.src} alt={assets.airIndia.alt} width={assets.airIndia.width} height={assets.airIndia.height} className="h-auto w-[34px]" />
      </span>
    );
  return (
    <span className="grid h-[30px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-surface-2 text-16">
      <span aria-hidden>{modeEmoji}</span>
    </span>
  );
}

/** One route option: tag + price pill, then the onward leg (and the return leg when round trip). */
export function RouteOptionRow({ option, trip, selected, onSelect }: RouteOptionRowProps) {
  const legs = trip === "round" ? option.legs : option.legs.slice(0, 1);
  const modeEmoji = ROUTE_MODES.find((m) => m.id === option.mode)?.emoji ?? "";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-2 px-3.5 py-3 text-left active:scale-[0.985]",
        selected && "bg-success-tint",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2.5">
        <span className={cn("text-11 font-bold tracking-tag uppercase", tagTone[option.kind] ?? "text-muted")}>
          {option.tag}
        </span>
        <Badge size="lg" variant={selected ? "price-selected" : "price"}>
          {inr(priceOf(option, trip))}
        </Badge>
      </span>
      {legs.map((leg) => (
        <span key={leg.code} className="flex w-full items-center gap-2.5">
          <span className="flex w-16 shrink-0 flex-col">
            <span className="text-12 font-bold whitespace-nowrap text-ink">{leg.code}</span>
            <span className="text-11 font-semibold text-muted">{leg.day}</span>
          </span>
          <CarrierTile leg={leg} modeEmoji={modeEmoji} />
          <span className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="text-15 font-semibold tabular-nums">{leg.time}</span>
            <span className="text-13 tracking-caption text-muted">{leg.meta}</span>
            {leg.stop && (
              <span className="flex items-center gap-1 text-12 font-semibold text-go">
                <Stopwatch className="size-3 shrink-0" strokeWidth={2.2} />
                {leg.stop}
              </span>
            )}
          </span>
        </span>
      ))}
    </button>
  );
}
