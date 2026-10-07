import { cn } from "@/lib/utils";

type ReactionChipProps = {
  emoji: string;
  count: number;
  /** Card-anchored variant: absolutely positioned by the caller, taller, with shadow. */
  floating?: boolean;
  className?: string;
};

export function ReactionChip({ emoji, count, floating = false, className }: ReactionChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[3px] rounded-full border border-line bg-white px-2 py-0.5 text-13 font-semibold tabular-nums",
        floating && "absolute h-[26px] gap-1 px-[9px] font-bold shadow-chip",
        className,
      )}
    >
      <span aria-hidden>{emoji}</span>
      {count}
    </span>
  );
}
