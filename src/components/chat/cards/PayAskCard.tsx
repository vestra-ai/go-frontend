import { InChatCard } from "@/components/chat/InChatCard";
import { CheckBadge } from "@/components/common/CheckBadge";
import { LiveDot } from "@/components/common/LiveDot";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { paySheet } from "@/data/seed/copy";
import type { Stay, User } from "@/data/types";
import { splitEmoji } from "@/lib/emoji";

type PayAskCardProps = {
  stay: Stay;
  /** `stayBooking.status`: open (E12) shows the CTA, claimed (E13) the booker row. */
  state: "open" | "claimed";
  /** Required when state==='claimed' (Rahul). */
  booker?: User;
  copy: {
    badge: string;
    total: string;
    sub: string;
    assurance: { title: string; sub: string };
    cta: string;
    helper: string;
    booker: { title: string; sub: string };
  };
  /** Opens the pay sheet. */
  onClaim: () => void;
};

/** E12/E13 "one person books for all" card: villa photo, total, green panel with the CTA or the live booker row. */
export function PayAskCard({ stay, state, booker, copy, onClaim }: PayAskCardProps) {
  // "👤 ONE PERSON BOOKS FOR ALL": the leading emoji stays text, hidden from screen readers.
  const badge = splitEmoji(copy.badge);

  return (
    <InChatCard right={16}>
      <div className="relative h-[120px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, cover */}
        <img src={stay.img} alt={paySheet.cardImgAlt} className="size-full object-cover" />
        <Badge variant="white" size="md-bold" className="absolute top-3 left-3 gap-1 border-0 px-2.5 tracking-badge">
          {badge.emoji && <span aria-hidden>{badge.emoji}</span>}
          {badge.label}
        </Badge>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-3 pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-20 font-semibold tracking-h3">{stay.name}</span>
          <span className="text-18 font-bold tabular-nums">{copy.total}</span>
        </div>
        <p className="text-13 leading-[1.35] tracking-caption text-muted">{copy.sub}</p>
        <div className="flex flex-col gap-1 rounded-4xl bg-success-soft p-1">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <CheckBadge size={28} />
            <div className="flex flex-col gap-px">
              <span className="text-15 font-bold text-success-ink">{copy.assurance.title}</span>
              <span className="text-13 text-success-ink">{copy.assurance.sub}</span>
            </div>
          </div>
          {state === "open" ? (
            <>
              <Button type="button" variant="primary" size="md" className="w-full" onClick={onClaim}>
                {copy.cta}
              </Button>
              <p className="px-1.5 pb-1 text-center text-13 leading-[1.35] text-success-ink">{copy.helper}</p>
            </>
          ) : (
            // No lock icon, as designed: the missing CTA and the live dot say it is taken.
            <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 transition-opacity duration-220 starting:opacity-0">
              {booker && (
                <Avatar size={32} src={booker.avatar} name={booker.name} initials={booker.initials} tone={booker.tone} />
              )}
              <div className="flex flex-1 flex-col gap-px">
                <span className="text-15 font-bold">{copy.booker.title}</span>
                <span className="text-13 leading-[1.35] tracking-caption text-muted">{copy.booker.sub}</span>
              </div>
              <LiveDot size={10} pulse />
            </div>
          )}
        </div>
      </div>
    </InChatCard>
  );
}
