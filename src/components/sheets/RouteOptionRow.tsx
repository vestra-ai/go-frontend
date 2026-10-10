import { Stopwatch } from "@/components/icons/generated";
import { Badge } from "@/components/ui/badge";
import { ROUTE_MODES } from "@/data/seed/routes";
import type { RouteLeg, RouteOption, TripType } from "@/data/types";
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

/** Leading carrier wordmark (when the option has one) or the mode's icon: same tile size so every row starts on one edge. */
function CarrierTile({ leg, modeEmoji }: { leg: RouteLeg; modeEmoji: string }) {
  if (leg.logoUrl)
    return (
      <span className="grid h-[30px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[9px] border border-line bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- the carrier's wordmark from Go's option */}
        <img src={leg.logoUrl} alt={leg.carrierName ?? ""} className="h-auto max-h-5 w-10 object-contain" />
      </span>
    );
  return (
    <span className="grid h-[30px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-surface-2 text-16">
      <span aria-hidden>{modeEmoji}</span>
    </span>
  );
}

/**
 * One route option, left to right: carrier logo · times + details · price.
 * The leg codes live in the sheet header; on a round trip the day sits under the logo to tell the legs apart.
 * A highlight line (tag) is shown only when it says something the legs don't.
 */
export function RouteOptionRow({ option, trip, selected, onSelect }: RouteOptionRowProps) {
  const round = trip === "round";
  const legs = round ? option.legs : option.legs.slice(0, 1);
  const modeEmoji = ROUTE_MODES.find((m) => m.id === option.mode)?.emoji ?? "";
  // Train/bus have no carrier, so their tag ("AC 3-tier · overnight") is the title; flights only highlight the notable ones.
  const showTag = option.mode !== "flight" || !option.quiet;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 px-3.5 py-3.5 text-left active:scale-[0.985]",
        selected && "bg-success-tint",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-2.5">
        {showTag && (
          <span className={cn("text-11 font-bold tracking-tag uppercase", tagTone[option.kind] ?? "text-muted")}>
            {option.tag}
          </span>
        )}
        {legs.map((leg) => (
          <span key={leg.code} className="flex w-full items-center gap-3">
            <span className="flex w-[52px] shrink-0 flex-col items-center gap-1">
              <CarrierTile leg={leg} modeEmoji={modeEmoji} />
              {round && <span className="text-11 font-semibold whitespace-nowrap text-muted">{leg.day}</span>}
            </span>
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
      </span>
      <Badge size="price-sm" variant={selected ? "price-selected" : "price"}>
        {inr(priceOf(option, trip))}
      </Badge>
    </button>
  );
}
