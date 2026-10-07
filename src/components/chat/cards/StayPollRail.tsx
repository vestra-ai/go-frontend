import { HorizontalRail } from "@/components/chat/HorizontalRail";
import { ShowMoreTile } from "@/components/chat/ShowMoreTile";
import type { Stay, UserId } from "@/data/types";
import { StayCard } from "./StayCard";

type StayPollRailProps = {
  stays: Stay[];
  vote: Stay["id"] | null;
  /** 'aarav' — appended to the voters of the card you voted for. */
  me: UserId;
  /** 'Show 5 more' / 'Same dates, same budget' */
  more: { title: string; sub: string };
  /** `voteStay`: re-tapping your card un-votes (null). */
  onVote: (id: Stay["id"] | null) => void;
  onDetails: (id: Stay["id"]) => void;
  onMore: () => void;
};

/** E8 stay poll: snap rail of StayCards closed by the dashed "Show 5 more" tile. No countdown. */
export function StayPollRail({ stays, vote, me, more, onVote, onDetails, onMore }: StayPollRailProps) {
  return (
    <HorizontalRail>
      {stays.map((stay) => {
        const mine = vote === stay.id;
        return (
          <StayCard
            key={stay.id}
            stay={stay}
            voters={mine ? [...stay.voters, me] : stay.voters}
            mine={mine}
            onDetails={() => onDetails(stay.id)}
            onVote={() => onVote(mine ? null : stay.id)}
          />
        );
      })}
      <ShowMoreTile title={more.title} sub={more.sub} onPress={onMore} />
    </HorizontalRail>
  );
}
