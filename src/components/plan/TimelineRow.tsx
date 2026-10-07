import { EmojiTile } from "@/components/common/EmojiTile";

export interface TimelineRowProps {
  time: string;
  emoji: string;
  title: string;
  sub: string;
  /** Everyone: avatar stack of who is in it; Just me: scope badge. */
  trailing: React.ReactNode;
  /** Dotted line down to the next row (not on the last visible row of the day). */
  connector: boolean;
}

/** Time · emoji tile · title/sub · trailing, with an optional dotted connector to the next row. */
export function TimelineRow({ time, emoji, title, sub, trailing, connector }: TimelineRowProps) {
  return (
    <div className="relative flex items-center gap-2.5 py-2">
      {/* Kept as designed (L-itinerary-map.md §1.6 #9): the connector sits 9px left of the tile's centre. */}
      {connector ? (
        <span
          aria-hidden
          className="absolute -bottom-1.5 left-[69px] top-[46px] w-0.5 bg-[repeating-linear-gradient(180deg,var(--color-line-2)_0_3px,transparent_3px_6px)]"
        />
      ) : null}
      <span className="w-12 shrink-0 text-right text-13 font-semibold tabular-nums">{time}</span>
      <EmojiTile emoji={emoji} size={40} shape="circle" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-15 font-semibold leading-[1.3]">{title}</span>
        <span className="truncate text-13 tracking-caption text-muted">{sub}</span>
      </div>
      {trailing}
    </div>
  );
}
