import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MONEY_COPY } from "@/data/seed/money";
import { SESSION_USER_ID, USERS } from "@/data/seed/users";
import type { Transaction, User } from "@/data/types";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

type TransactionRowProps = {
  tx: Transaction;
  /** Right-hand date label (Expenses card); the Transactions page groups by date instead. */
  showDate: boolean;
  /** First row of its card: no top hairline. */
  first: boolean;
};

const avatarOf = (u: User, size: 20 | 40, ring?: "white") => (
  <Avatar size={size} ring={ring} name={u.name} src={u.avatar} tone={u.tone} />
);

/** One payment or booking: payer avatar with a payee / merchant badge, title, method pill, note, amount. */
export function TransactionRow({ tx, showDate, first }: TransactionRowProps) {
  const payer = USERS[tx.payerId];
  const who = payer.id === SESSION_USER_ID ? MONEY_COPY.you : payer.firstName;
  const toName = tx.to.kind === "user" ? USERS[tx.to.id].firstName : tx.to.name;

  return (
    <div className={cn("flex items-start gap-3 py-3", !first && "border-t border-line")}>
      <div className="relative size-10 shrink-0">
        {avatarOf(payer, 40)}
        <span className="absolute -right-1 -bottom-1">
          {tx.to.kind === "user" ? (
            avatarOf(USERS[tx.to.id], 20, "white")
          ) : tx.to.img ? (
            // eslint-disable-next-line @next/next/no-img-element -- design photo, 20px badge
            <img src={tx.to.img} alt="" className="size-5 rounded-full object-cover ring-2 ring-white" />
          ) : (
            <span className="box-border flex size-5 items-center justify-center rounded-full border-2 border-white bg-surface-2 text-[10px] leading-none">
              <span aria-hidden>{tx.to.emoji}</span>
            </span>
          )}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-15 font-semibold leading-[1.3]">{`${who} ${tx.verb} ${toName}`}</span>
        <div className="flex flex-wrap items-center gap-1.5 text-13 text-muted">
          <Badge variant="neutral" size="sm" className="text-ink">
            {tx.method}
          </Badge>
          {tx.note && <span>{`“${tx.note}”`}</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-15 font-bold tabular-nums">{inr(tx.amount)}</span>
        {showDate && <span className="text-13 text-muted">{tx.dateLabel}</span>}
      </div>
    </div>
  );
}
