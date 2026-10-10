import { Avatar } from "@/components/ui/avatar";
import { ListCard } from "@/components/common/ListCard";
import { tripHome as copy } from "@/data/seed/copy";
import type { User } from "@/data/types";
import type { PendingItem } from "@/store/selectors";
import { PendingRow } from "./PendingRow";

type PendingCardProps = Omit<React.ComponentProps<typeof ListCard>, "children"> & {
  /** `selectPending` result; `checkin` is rendered by CheckinCard, not here. */
  items: PendingItem[];
  /** The person you owe (settle-up row avatar). */
  settleWith: User;
  /** "Record" opens the record-a-payment sheet over this page. */
  onRecord: () => void;
  /** "Book" opens the airport-cab sheet over this page. */
  onBookCab: () => void;
};

/** Settle-up and airport-cab rows under "Pending on you" (J-triphome-calls.md §1.2 A.3). Null when neither is pending. */
export function PendingCard({ items, settleWith, onRecord, onBookCab, ...props }: PendingCardProps) {
  const rows = items.filter((i) => i.kind !== "checkin");
  if (rows.length === 0) return null;
  const { settle, cab } = copy.pending;

  return (
    <ListCard padding="rows" data-slot="pending-card" {...props}>
      {rows.map((item) =>
        item.kind === "settle" ? (
          <PendingRow
            key="settle"
            leading={<Avatar size={40} src={settleWith.avatar} initials={settleWith.initials} tone={settleWith.tone} />}
            title={settle.title}
            sub={settle.sub}
            cta={{ label: settle.cta, onPress: onRecord }}
          />
        ) : (
          <PendingRow
            key="cab"
            leading={
              <span aria-hidden className="relative size-10 shrink-0">
                <span className="grid size-[30px] place-items-center rounded-full bg-surface-2 text-14 leading-none">
                  {cab.emoji}
                </span>
                <span className="absolute right-0 bottom-0 grid size-6 place-items-center rounded-full bg-amber-soft text-12 leading-none">
                  {cab.badgeEmoji}
                </span>
              </span>
            }
            title={cab.title}
            sub={cab.sub}
            cta={{ label: cab.cta, onPress: onBookCab }}
          />
        ),
      )}
    </ListCard>
  );
}
