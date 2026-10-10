import { InChatCard } from "@/components/chat/InChatCard";
import { CountdownMeta } from "@/components/common/CountdownMeta";
import { RadioGroup } from "@/components/ui/radio-group";
import { polls as copy } from "@/data/seed/copy";
import type { DateOption, User } from "@/data/types";
import { FlexibleButton } from "./FlexibleButton";
import { PollFooter } from "./PollFooter";
import { PollOptionRow } from "./PollOptionRow";

type DatesPollCardProps = {
  /** 'Final call: which weekend?' */
  title: string;
  /** '5 hrs left'; absent once the vote has no closing time or is closed. */
  countdown?: string;
  options: DateOption[];
  vote: DateOption["id"] | null;
  flexible: boolean;
  me: User;
  /** How many can vote (`Decision.of`). */
  of: number;
  /** How many have voted, mine included (`Decision.voted`). */
  voted: number;
  /** Absent: "I'm flexible" is not offered (`features.vote_flexible` is off). */
  flexibleLabels?: { off: string; on: string };
  /** The vote is closed or called off: nothing can be picked. */
  closed?: boolean;
  /** voteDate */
  onVote: (id: DateOption["id"] | null) => void;
  /** setFlexible */
  onFlexible: () => void;
};

/** E5 "which weekend?" poll: single-choice rows (re-tap un-votes), "I’m flexible", tally footer (E-deciding.md §1.3). */
export function DatesPollCard({
  title,
  countdown,
  options,
  vote,
  flexible,
  me,
  of,
  voted,
  flexibleLabels,
  closed = false,
  onVote,
  onFlexible,
}: DatesPollCardProps) {

  return (
    <InChatCard className="flex flex-col gap-1 pt-3.5 pb-3">
      <div className="flex items-start justify-between gap-2 px-4 pb-1">
        <span className="text-18 leading-[1.3] font-semibold tracking-h4">{title}</span>
        {countdown && <CountdownMeta text={countdown} />}
      </div>
      <RadioGroup
        value={vote ?? ""}
        disabled={closed}
        onValueChange={(id) => onVote(id as DateOption["id"])}
        aria-label={copy.datesLabel}
        className="gap-0"
      >
        {options.map((option, i) => {
          const mine = vote === option.id;
          return (
            <PollOptionRow
              key={option.id}
              option={option}
              voters={mine ? [...option.voters, me.id] : option.voters}
              mine={mine}
              first={i === 0}
              // Radix never deselects, so the checked radio un-votes on its own click.
              onClick={mine && !closed ? () => onVote(null) : undefined}
            />
          );
        })}
      </RadioGroup>
      {flexibleLabels && !closed && <FlexibleButton pressed={flexible} labels={flexibleLabels} onPress={onFlexible} />}
      <PollFooter countLabel={copy.votedCount(voted, of)} me={me} voted={vote !== null || flexible} />
    </InChatCard>
  );
}
