import { DashedNoteRow } from "@/components/trip/DashedNoteRow";
import { CategoryTile } from "@/components/trip/CategoryTile";
import { GoStatusCard } from "@/components/trip/GoStatusCard";
import { ZeroAmount } from "@/components/trip/ZeroAmount";
import { ScopeToggle, type ScopeValue } from "@/components/common/ScopeToggle";
import { SectionHeader } from "@/components/common/SectionHeader";
import { planZero } from "@/data/seed/copy";
import type { TripId, User } from "@/data/types";

// DESIGN-ASSUMPTION (I-plan-empty.md §1.6 #13): `college` has no chat scenario, so its links go to the bare chat route.
const chatHref = (tripId: TripId, query?: string) =>
  tripId === "college" || !query ? `/trips/${tripId}/chat` : `/trips/${tripId}/chat?${query}`;

const copy = planZero.expenses;

type ExpensesZeroProps = {
  tripId: TripId;
  scope: ScopeValue;
  onScopeChange: (scope: ScopeValue) => void;
  me: User;
  others: User[];
};

/** Expenses tab with no spend: scope toggle, zero headline, category tiles, empty settle-up and transactions. */
export function ExpensesZero({ tripId, scope, onScopeChange, me, others }: ExpensesZeroProps) {
  const everyone = scope === "everyone";
  return (
    <>
      <ScopeToggle aria-label="Whose view" value={scope} onValueChange={onScopeChange} others={others} me={me} />
      <div className="flex flex-col gap-2.5">
        <ZeroAmount amount={copy.zero} caption={everyone ? copy.everyoneCaption : copy.meCaption} />
        <div className="grid grid-cols-2 gap-2.5">
          {copy.categories.map((c) => (
            <CategoryTile key={c.key} tone={c.key} emoji={c.emoji} label={c.label} amount={copy.zero} zero />
          ))}
        </div>
        {everyone ? (
          <p className="px-1 text-13 text-muted">{copy.footnote}</p>
        ) : (
          <GoStatusCard
            title={copy.budget.title}
            sub={copy.budget.sub}
            cta={{ label: copy.budget.cta, href: chatHref(tripId, "stage=budget&sheet=budget") }}
          />
        )}
      </div>
      <SectionHeader className="mt-2.5" title={copy.settle.title} />
      <DashedNoteRow emoji={copy.settle.emoji} title={copy.settle.rowTitle} sub={copy.settle.rowSub} />
      <SectionHeader className="mt-2.5" title={copy.tx.title} />
      <DashedNoteRow emoji={copy.tx.emoji} title={copy.tx.rowTitle} sub={copy.tx.rowSub} />
    </>
  );
}
