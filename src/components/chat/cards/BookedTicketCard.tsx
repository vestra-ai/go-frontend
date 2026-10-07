import { CheckBadge } from "@/components/common/CheckBadge";
import { ReactionChip } from "@/components/common/ReactionChip";
import { cn } from "@/lib/utils";

export type BookedTicketCardProps = {
  img: string;
  /** 'Villa Sol' */
  imgAlt: string;
  /** 'STAY · BOOKED' */
  eyebrow: string;
  /** 'Villa Sol' */
  title: string;
  /** 'Fri 6 → Mon 9' */
  dates: string;
  /** '3 NIGHTS' */
  stub: string;
  reaction?: { emoji: string; count: number };
  showReaction: boolean;
  /** Pops the reaction chip in when it appears (live E15 sequence); otherwise it renders static. */
  animate?: boolean;
};

/** E15 "STAY · BOOKED" ticket: photo, green-ruled details, dashed stub with notches and a check. No booking reference. */
export function BookedTicketCard({
  img,
  imgAlt,
  eyebrow,
  title,
  dates,
  stub,
  reaction,
  showReaction,
  animate = false,
}: BookedTicketCardProps) {
  return (
    <div className="relative flex h-[104px] items-stretch rounded-5xl border border-line bg-white shadow-float">
      <div className="w-[104px] shrink-0 overflow-hidden rounded-l-5xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, cover */}
        <img src={img} alt={imgAlt} className="size-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-0.5 border-l-[3px] border-success px-3.5 py-3">
        <span className="text-11 font-bold tracking-eyebrow text-success-ink">{eyebrow}</span>
        <span className="text-20 leading-[1.2] font-semibold tracking-h3">{title}</span>
        <span className="text-14 tracking-sm text-muted">{dates}</span>
      </div>
      <div className="relative flex w-[84px] flex-col items-center justify-center gap-1.5 border-l-[1.5px] border-dashed border-line-2">
        <span aria-hidden className="absolute -top-[9px] -left-[9px] size-4 rounded-full bg-canvas" />
        <span aria-hidden className="absolute -bottom-[9px] -left-[9px] size-4 rounded-full bg-canvas" />
        <CheckBadge size={30} />
        <span className="text-11 font-bold tracking-eyebrow text-muted">{stub}</span>
      </div>
      {showReaction && reaction && (
        <ReactionChip
          floating
          emoji={reaction.emoji}
          count={reaction.count}
          className={cn("-bottom-2.5 left-2.5 shadow-bubble", animate && "motion-safe:animate-[popIn_380ms_var(--ease-out)_both]")}
        />
      )}
    </div>
  );
}
