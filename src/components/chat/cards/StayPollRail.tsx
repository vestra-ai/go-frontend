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
  more?: { title: string; sub?: string };
  /** An options card: the button's own words, no tallies. */
  voteLabel?: string;
  votedLabel?: string;
  hideVotes?: boolean;
  /** The vote is closed, or a tap is on its way. */
  disabled?: boolean;
  /** `voteStay`: re-tapping your card un-votes (null). */
  onVote: (id: Stay["id"] | null) => void;
  onDetails: (id: Stay["id"]) => void;
  onMore?: () => void;
};

/** E8 stay poll: snap rail of StayCards closed by the dashed "Show 5 more" tile. No countdown. */
export function StayPollRail({ stays, vote, me, more, onVote, onDetails, onMore, voteLabel, votedLabel, hideVotes, disabled }: StayPollRailProps) {
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
            voteLabel={voteLabel}
            votedLabel={votedLabel}
            hideVotes={hideVotes}
            disabled={disabled}
            onDetails={() => onDetails(stay.id)}
            onVote={() => onVote(mine ? null : stay.id)}
          />
        );
      })}
      {more && onMore && <ShowMoreTile title={more.title} sub={more.sub} onPress={onMore} />}
    </HorizontalRail>
  );
}
