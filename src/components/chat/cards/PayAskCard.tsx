import { InChatCard } from "@/components/chat/InChatCard";
import { CheckBadge } from "@/components/common/CheckBadge";
import { LiveDot } from "@/components/common/LiveDot";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/data/types";
import { splitEmoji } from "@/lib/emoji";

export type PayAskCardProps = {
  /** Cover photo (the stay, the thing being booked). Without one the card starts at the title. */
  img?: string;
  imgAlt?: string;
  /** "👤 ONE PERSON BOOKS FOR ALL": a leading emoji stays text, hidden from screen readers. */
  badge: string;
  title: string;
  /** '₹54,200' · 'Up to ₹55,000' */
  total: string;
  sub: string;
  /** The green reassurance line ("Free cancellation until 1 Nov"). */
  assurance?: { title: string; sub: string };
  /**
   * `open`: the buttons, for the one who may act (who books, the payer's "Yes, book it", the payer's pay button).
   * `claimed`: the row saying who has it ("Rahul is booking for all 4").
   */
  state: "open" | "claimed";
  cta?: { label: string; onPress: () => void; pending?: boolean };
  secondary?: { label: string; onPress: () => void };
  helper?: string;
  booker?: { user?: User; title: string; sub: string; live?: boolean };
};

/**
 * The booking ask in the room, in its three lives: "One person books for all" (a `notice` with a `claim` action),
 * "Yes, book it?" (the `mandate`, the Server's own buttons, payer only) and the payment waiting for its payer (the
 * `pay` card, whose button is the payment: Go books at once and the card reads paid, CONTRACT-APP §4.7).
 */
export function PayAskCard({ img, imgAlt, badge, title, total, sub, assurance, state, cta, secondary, helper, booker }: PayAskCardProps) {
  const tag = splitEmoji(badge);
  const badgeNode = (
    <Badge variant="white" size="md-bold" className={img ? "absolute top-3 left-3 gap-1 border-0 px-2.5 tracking-badge" : "gap-1 self-start px-2.5 tracking-badge"}>
      {tag.emoji && <span aria-hidden>{tag.emoji}</span>}
      {tag.label}
    </Badge>
  );
  return (
    <InChatCard right={16}>
      {img && (
        <div className="relative h-[120px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- the option's own photo, cover */}
          <img src={img} alt={imgAlt ?? ""} className="size-full object-cover" />
          {badgeNode}
        </div>
      )}
      <div className="flex flex-col gap-2.5 px-4 pt-3 pb-4">
        {!img && badgeNode}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-20 font-semibold tracking-h3">{title}</span>
          <span className="text-18 font-bold whitespace-nowrap tabular-nums">{total}</span>
        </div>
        {sub && <p className="text-13 leading-[1.35] tracking-caption text-muted">{sub}</p>}
        <div className="flex flex-col gap-1 rounded-4xl bg-success-soft p-1">
          {assurance && (
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <CheckBadge size={28} />
              <div className="flex flex-col gap-px">
                <span className="text-15 font-bold text-success-ink">{assurance.title}</span>
                {assurance.sub && <span className="text-13 text-success-ink">{assurance.sub}</span>}
              </div>
            </div>
          )}
          {state === "open" && cta ? (
            <>
              <Button type="button" variant="primary" size="md" className="w-full" aria-busy={cta.pending} disabled={cta.pending} onClick={cta.onPress}>
                {cta.label}
              </Button>
              {secondary && (
                <Button type="button" variant="link" className="h-10 w-full text-15" onClick={secondary.onPress}>
                  {secondary.label}
                </Button>
              )}
              {helper && <p className="px-1.5 pb-1 text-center text-13 leading-[1.35] text-success-ink">{helper}</p>}
            </>
          ) : booker ? (
            // No lock icon, as designed: the missing CTA and the live dot say it is taken.
            <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 transition-opacity duration-220 starting:opacity-0">
              {booker.user && (
                <Avatar size={32} src={booker.user.avatar} name={booker.user.name} initials={booker.user.initials} tone={booker.user.tone} />
              )}
              <div className="flex flex-1 flex-col gap-px">
                <span className="text-15 font-bold">{booker.title}</span>
                {booker.sub && <span className="text-13 leading-[1.35] tracking-caption text-muted">{booker.sub}</span>}
              </div>
              {booker.live !== false && <LiveDot size={10} pulse />}
            </div>
          ) : null}
        </div>
      </div>
    </InChatCard>
  );
}
