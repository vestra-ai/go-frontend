import { CheckBadge } from "@/components/common/CheckBadge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MONEY_COPY } from "@/data/seed/money";
import type { Settlement, User } from "@/data/types";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { userOf } from "@/state/view";

type SettleRowProps = {
  settlement: Settlement;
  /** Everyone in the trip, by person id. */
  users: Record<string, User>;
  /** Your own debt: shows "Record". Other people's debts have no button (there is no Nudge, CONTRACT-APP §6). */
  isYou: boolean;
  /** "Record" tapped (opens the record-payment sheet). */
  onRecord: () => void;
};

const avatarOf = (u: User) => <Avatar size={36} name={u.name} src={u.avatar} tone={u.tone} />;

/** Settle-up row: payer → payee arrow with the amount and an action, or an "is settled up" line. */
export function SettleRow({ settlement, users, isYou, onRecord }: SettleRowProps) {
  const from = userOf(users, settlement.fromId);
  const to = userOf(users, settlement.toId);
  const rowClass = "flex items-center gap-2.5 py-3 not-first:border-t not-first:border-line";

  if (settlement.status === "settled") {
    return (
      <div className={rowClass}>
        {avatarOf(from)}
        <span className="flex-1 text-15 font-semibold">{isYou ? MONEY_COPY.youSettled : MONEY_COPY.settled(from.firstName)}</span>
        <CheckBadge size={24} />
      </div>
    );
  }

  return (
    <div className={rowClass}>
      {avatarOf(from)}
      <div aria-hidden className="relative h-0.5 flex-1 bg-line-2">
        <span
          className={cn(
            "absolute -top-[22px] left-1/2 -translate-x-1/2 text-16 font-bold whitespace-nowrap tabular-nums",
            isYou ? "text-go" : "text-ink",
          )}
        >
          {inr(settlement.amount)}
        </span>
        <span className="absolute -top-1 -right-0.5 border-y-[5px] border-l-[7px] border-y-transparent border-l-line-2" />
      </div>
      {avatarOf(to)}
      <div className="flex w-[92px] justify-end">
        {isYou && (
          <Button variant="primary" className="h-[34px] px-[18px] text-13" onClick={onRecord}>
            {MONEY_COPY.record}
          </Button>
        )}
      </div>
    </div>
  );
}
