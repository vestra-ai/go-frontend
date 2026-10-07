import { HorizontalRail } from "@/components/chat/HorizontalRail";
import { ShowMoreTile } from "@/components/chat/ShowMoreTile";
import { CountdownMeta } from "@/components/common/CountdownMeta";
import type { PlaceOption, UserId } from "@/data/types";
import { PlaceCard } from "./PlaceCard";

type PlacePollRailProps = {
  places: PlaceOption[];
  vote: PlaceOption["id"] | null;
  /** 'aarav' */
  me: UserId;
  /** 'Voting closes in 3 hrs' */
  countdown: string;
  /** 'Show more places' / 'Go has 6 more' */
  more: { title: string; sub: string };
  onVote: (id: PlaceOption["id"] | null) => void;
  onDetails: (id: PlaceOption["id"]) => void;
  onMore: () => void;
};

/** E1 place poll: snapping rail of PlaceCards + ShowMoreTile, then the countdown (E-deciding.md §1.3). */
export function PlacePollRail({ places, vote, me, countdown, more, onVote, onDetails, onMore }: PlacePollRailProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <HorizontalRail>
        {places.map((place) => {
          const mine = vote === place.id;
          return (
            <PlaceCard
              key={place.id}
              place={place}
              voters={mine ? [...place.voters, me] : place.voters}
              mine={mine}
              onDetails={() => onDetails(place.id)}
              // Re-tapping your card un-votes; another card moves the vote.
              onVote={() => onVote(mine ? null : place.id)}
            />
          );
        })}
        <ShowMoreTile title={more.title} sub={more.sub} onPress={onMore} />
      </HorizontalRail>
      <div className="ml-[38px] flex">
        <CountdownMeta text={countdown} />
      </div>
    </div>
  );
}
