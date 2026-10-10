import { cn } from "@/lib/utils";

type ReactionChipProps = {
  /** One emoji, or a few side by side (a message's summary: its most used). */
  emoji: string | string[];
  /** Shown after the emoji; left out when unset. */
  count?: number;
  /** I picked this emoji: the chip takes my bubble's tint. */
  mine?: boolean;
  /** Card-anchored variant (booked ticket): positioned by the caller; no border, 700 weight, bubble shadow, 15px emoji slot. */
  floating?: boolean;
  /** Accessible name for a chip that summarises several reactions ("❤️ 3, 😂 2"). */
  label?: string;
  className?: string;
};

export function ReactionChip({ emoji, count, mine = false, floating = false, label, className }: ReactionChipProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-[3px] rounded-full border px-2 py-0.5 text-13 font-semibold tabular-nums",
        mine ? "border-mine-line bg-mine" : "border-line bg-white",
        floating && "absolute border-0 font-bold tracking-caption shadow-bubble",
        className,
      )}
    >
      {Array.isArray(emoji) ? (
        <span aria-hidden className="flex gap-0.5">
          {emoji.map((e) => (
            <span key={e}>{e}</span>
          ))}
        </span>
      ) : (
        <span aria-hidden className={cn(floating && "flex w-[15px] shrink-0 justify-center leading-none")}>
          {emoji}
        </span>
      )}
      {count}
    </span>
  );
}
