import { CheckBadge } from "@/components/common/CheckBadge";
import { ReactionChip } from "@/components/common/ReactionChip";
import { BookingMedia } from "@/components/plan/BookingMedia";
import { TICKET_SHADOW, TicketBody } from "@/components/plan/TicketNotches";
import type { Booking } from "@/data/types";
import { cn } from "@/lib/utils";

const ACCENT = { info: "border-info", success: "border-success" } as const;

/** The stub's width in px; the cuts are placed from it. */
const STUB_WIDTH = 76;

export type BookedTicketCardProps = {
  /** The booking's photo, else the carrier's wordmark, else its kind's emoji on a tint: as on the Bookings tab. */
  media: Booking["media"];
  /** The rule beside it, as on the Bookings tab: green for a stay, blue for a journey. */
  accent?: Booking["accent"];
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
  /** The whole ticket is then a button: it opens the booking's own sheet, with its e-ticket or hotel voucher. */
  open?: { label: string; onPress: () => void };
};

/**
 * E15 "STAY · BOOKED" ticket: photo, green-ruled details, dashed stub with notches and a check. No booking reference.
 * A real hotel's name is long: it takes two lines at most, and the ticket grows with it instead of spilling over. The
 * photo and the stub are a little narrower than drawn (88 and 76, for 104 and 84), so the words have room on a 375 phone.
 */
export function BookedTicketCard({
  media,
  accent = "success",
  eyebrow,
  title,
  dates,
  stub,
  reaction,
  showReaction,
  animate = false,
  open,
}: BookedTicketCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-5xl",
        TICKET_SHADOW.md,
        open && "transition-transform duration-[160ms] ease-[var(--ease-out)] has-[button:active]:scale-[0.985]",
      )}
    >
      <TicketBody stubWidth={STUB_WIDTH} className={cn("min-h-[104px]", open && "has-[>button:active]:bg-surface-pressed")}>
        <BookingMedia media={media} className="w-[88px]" />
        <div className={cn("flex min-w-0 flex-1 flex-col justify-center gap-0.5 border-l-[3px] px-3 py-3", ACCENT[accent])}>
          <span className="text-11 font-bold tracking-eyebrow text-success-ink">{eyebrow}</span>
          <span className="line-clamp-2 text-20 leading-[1.2] font-semibold tracking-h3">{title}</span>
          <span className="line-clamp-2 text-14 tracking-sm text-muted">{dates}</span>
        </div>
        <div style={{ width: STUB_WIDTH }} className="flex shrink-0 flex-col items-center justify-center gap-1.5 border-l-[1.5px] border-dashed border-line-2">
          <CheckBadge size={30} strokeWidth={3.2} />
          <span className="text-11 font-bold tracking-eyebrow text-muted">{stub}</span>
        </div>
        {open && (
          // Over the whole ticket, so the photo, the words and the stub all open it.
          <button
            type="button"
            aria-label={open.label}
            onClick={open.onPress}
            className="absolute inset-0 cursor-pointer rounded-5xl outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
          />
        )}
      </TicketBody>
      {showReaction && reaction && (
        <ReactionChip
          floating
          emoji={reaction.emoji}
          count={reaction.count}
          className={cn("-bottom-2.5 left-2.5", animate && "motion-safe:animate-[popIn_380ms_var(--ease-out)_both]")}
        />
      )}
    </div>
  );
}
