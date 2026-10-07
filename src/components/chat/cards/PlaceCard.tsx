import { AvatarStack } from "@/components/common/AvatarStack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { polls as copy } from "@/data/seed/copy";
import type { PlaceOption, UserId } from "@/data/types";
import { userStackAvatar } from "@/lib/avatars";
import { cn } from "@/lib/utils";

type PlaceCardProps = {
  place: PlaceOption;
  /** Seed voters, plus 'aarav' last when `mine`. */
  voters: UserId[];
  mine: boolean;
  onDetails: () => void;
  onVote: () => void;
};

/** 236px place card in the E1 rail: illustration on a tint, price pill, why line, tally, Details / Vote (E-deciding.md §1.3). */
export function PlaceCard({ place, voters, mine, onDetails, onVote }: PlaceCardProps) {
  return (
    <Card
      variant="float"
      radius="xl"
      role="group"
      aria-label={place.name}
      className="flex w-[236px] shrink-0 snap-start flex-col overflow-hidden"
    >
      <div className={cn("relative flex h-[132px] items-center justify-center", place.tint)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={place.img} alt={place.name} className="size-24" />
        <Badge variant="glass" size="md-bold" className="absolute top-2.5 left-2.5 px-2.5 text-13 tabular-nums">
          {place.est}
        </Badge>
      </div>
      <div className="flex flex-col gap-1 px-3 pt-2.5 pb-3">
        <span className="text-16 leading-[1.3] font-semibold tracking-body">{place.name}</span>
        <span className="text-13 tracking-caption text-muted">{place.meta}</span>
        <span className="text-13 font-semibold text-success-ink">{place.why}</span>
        <div className="flex items-center gap-1.5 text-13 font-semibold text-ink">
          {voters.length > 0 && (
            <AvatarStack avatars={voters.map(userStackAvatar)} size={20} overlap={6} ring="white" max={3} />
          )}
          {copy.votes(voters.length)}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={onDetails}>
            {copy.details}
          </Button>
          {/* Design weight is 600 on both fills, over the filled variants' font-medium. */}
          <Button
            type="button"
            variant={mine ? "success" : "primary"}
            size="sm"
            weight="semibold"
            className="flex-1"
            aria-pressed={mine}
            onClick={onVote}
          >
            {mine ? copy.voted : copy.vote}
          </Button>
        </div>
      </div>
    </Card>
  );
}
