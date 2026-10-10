import { Avatar } from "@/components/ui/avatar";
import { ListCard } from "@/components/common/ListCard";
import type { PendingRowModel } from "@/state/homeView";
import { PendingRow } from "./PendingRow";

type PendingCardProps = Omit<React.ComponentProps<typeof ListCard>, "children"> & {
  /** The Server's needs-you items as rows (check-in is drawn by CheckinCard, not here). */
  rows: PendingRowModel[];
  /** The row's button: record a payment, open the vote, open the card. */
  onAct: (row: PendingRowModel) => void;
};

/** The rows under "Pending on you": settle-ups, votes, cards and lines waiting on me. Null when there are none. */
export function PendingCard({ rows, onAct, ...props }: PendingCardProps) {
  if (rows.length === 0) return null;
  return (
    <ListCard padding="rows" data-slot="pending-card" {...props}>
      {rows.map((row) => (
        <PendingRow
          key={row.key}
          leading={
            row.leading.kind === "avatar" ? (
              <Avatar size={40} src={row.leading.user.avatar} initials={row.leading.user.initials} tone={row.leading.user.tone} />
            ) : (
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-18 leading-none">
                {row.leading.emoji}
              </span>
            )
          }
          title={row.title}
          sub={row.sub}
          cta={{ label: row.cta, onPress: () => onAct(row) }}
        />
      ))}
    </ListCard>
  );
}
