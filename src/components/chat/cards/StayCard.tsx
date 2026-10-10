import { AvatarStack } from "@/components/common/AvatarStack";
import { MapPin } from "@/components/icons/generated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { polls as copy } from "@/data/seed/copy";
import { useRoomUsers } from "@/components/chat/RoomContext";
import { stackAvatar } from "@/lib/avatars";
import type { Stay, UserId } from "@/data/types";
import { splitEmoji } from "@/lib/emoji";

type StayCardProps = {
  stay: Stay;
  /** Seed voters, plus 'aarav' last when `mine`. */
  voters: UserId[];
  mine: boolean;
  onDetails: () => void;
  onVote: () => void;
  /** The button's words when this is not a vote (an options card's own action). */
  voteLabel?: string;
  votedLabel?: string;
  /** No tally line (an options card has no votes). */
  hideVotes?: boolean;
  /** The vote is closed, or a tap is on its way. */
  disabled?: boolean;
};

/** 236px stay poll card in the E8 rail: photo with price/rating pill, area, tags, voters, Details / Vote. */
export function StayCard({ stay, voters, mine, onDetails, onVote, voteLabel, votedLabel, hideVotes = false, disabled = false }: StayCardProps) {
  const userOf = useRoomUsers();
  // Seed tags lead with an emoji ("🏊 Private pool · 3 rooms"); it stays text, hidden from screen readers.
  const tag = splitEmoji(stay.tags);

  return (
    <Card variant="float" radius="xl" className="flex w-[236px] shrink-0 snap-start flex-col overflow-hidden">
      <div className="relative h-[132px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, cover */}
        <img src={stay.img} alt={stay.name} className="size-full object-cover" />
        <Badge variant="glass" size="md-bold" className="absolute top-2.5 left-2.5 gap-1.5 px-2.5 text-13 tabular-nums">
          {stay.priceLabel}
          {stay.priceLabel && stay.rating && <span aria-hidden className="h-3 w-px bg-line-2" />}
          {stay.rating && (
            <>
              <span className="text-amber">★</span>
              {stay.rating}
            </>
          )}
        </Badge>
      </div>
      <div className="flex flex-col gap-1 px-3 pt-2.5 pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-16 leading-[1.3] font-semibold tracking-body">{stay.name}</span>
          <span className="text-13 tracking-caption text-muted">{stay.reviews}</span>
        </div>
        <span className="flex items-center gap-1 text-13 text-muted">
          <MapPin className="size-[13px] shrink-0" />
          {stay.area}
        </span>
        <span className="text-13 text-muted">
          <span aria-hidden>{tag.emoji}</span> {tag.label}
        </span>
        <div className="flex items-center gap-1.5 text-13 font-semibold text-ink">
          {voters.length > 0 && (
            <AvatarStack
              avatars={voters.map((id) => stackAvatar(userOf(id)))}
              size={20}
              overlap={6}
              ring="white"
              max={3}
            />
          )}
          {!hideVotes && copy.votes(voters.length)}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={onDetails}>
            {copy.details}
          </Button>
          {/* Design weight is 600, over the filled variants' 500. The atom already fades its fill over 160ms. */}
          <Button
            type="button"
            variant={mine ? "success" : "primary"}
            size="sm"
            weight="semibold"
            aria-pressed={mine}
            className="flex-1"
            disabled={disabled}
            onClick={onVote}
          >
            {mine ? (votedLabel ?? copy.voted) : (voteLabel ?? copy.vote)}
          </Button>
        </div>
      </div>
    </Card>
  );
}
