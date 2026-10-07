import { Avatar } from "@/components/ui/avatar";
import { polls as copy } from "@/data/seed/copy";
import type { User } from "@/data/types";
import { cn } from "@/lib/utils";

type PollFooterProps = {
  /** e.g. '3 of 4 voted' */
  countLabel: string;
  me: User;
  voted: boolean;
};

/** Poll footer row: "N of 4 voted" on the left, your avatar + "You voted" / "yet to vote" on the right. */
export function PollFooter({ countLabel, me, voted }: PollFooterProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-1.5 pb-0.5 text-13 leading-[1.35] tracking-caption">
      <span className="text-muted tabular-nums">{countLabel}</span>
      <span className="flex items-center gap-1.5">
        <Avatar size={20} src={me.avatar} name={me.firstName} initials={me.initials} tone={me.tone} />
        <span className={cn("font-semibold", voted ? "text-success-ink" : "text-ink")}>
          {voted ? copy.youVoted : copy.yetToVote}
        </span>
      </span>
    </div>
  );
}
