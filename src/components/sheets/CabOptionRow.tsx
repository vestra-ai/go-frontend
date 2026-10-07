import { EmojiTile } from "@/components/common/EmojiTile";
import { Badge } from "@/components/ui/badge";
import type { CabOption, TripType } from "@/data/types";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

type CabOptionRowProps = {
  option: CabOption;
  trip: TripType;
  selected: boolean;
  onSelect: () => void;
};

/** One cab option: 48×44 emoji tile, title + meta, price pill (round or one-way total). */
export function CabOptionRow({ option, trip, selected, onSelect }: CabOptionRowProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn("flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-3 text-left", selected && "bg-success-tint")}
    >
      <EmojiTile emoji={option.emoji} size={48} shape="rounded-xl" className="h-11 text-22" />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-15 font-semibold">{option.title}</span>
        <span className="text-13 leading-[1.35] tracking-caption text-muted">{option.meta}</span>
      </span>
      <Badge size="xl" variant={selected ? "price-selected" : "price"}>
        {inr(trip === "round" ? option.round : option.one)}
      </Badge>
    </button>
  );
}
