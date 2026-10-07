import { cn } from "@/lib/utils";

type ReactionChipProps = {
  emoji: string;
  count: number;
  /** Card-anchored variant (booked ticket): positioned by the caller; no border, 700 weight, bubble shadow, 15px emoji slot. */
  floating?: boolean;
  className?: string;
};

export function ReactionChip({ emoji, count, floating = false, className }: ReactionChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[3px] rounded-full border border-line bg-white px-2 py-0.5 text-13 font-semibold tabular-nums",
        floating && "absolute border-0 font-bold tracking-caption shadow-bubble",
        className,
      )}
    >
      <span aria-hidden className={cn(floating && "flex w-[15px] shrink-0 justify-center leading-none")}>
        {emoji}
      </span>
      {count}
    </span>
  );
}
