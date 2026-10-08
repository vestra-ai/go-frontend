"use client";

import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, Plus } from "@/components/icons/generated";
import { FilterChips, type TransactionFilter } from "@/components/money/FilterChips";
import { TransactionGroup } from "@/components/money/TransactionGroup";
import { FadeDock } from "@/components/shell/FadeDock";
import { StickyDock } from "@/components/shell/StickyDock";
import { Screen } from "@/components/shell/Screen";
import { Button } from "@/components/ui/button";
import { MONEY_COPY } from "@/data/seed/money";
import { TRIP_IDS } from "@/data/seed/trips";
import type { Transaction, TripId } from "@/data/types";
import { useHydrated, useMoney } from "@/store";

const T = MONEY_COPY.transactions;

const matches: Record<TransactionFilter, (t: Transaction) => boolean> = {
  all: () => true,
  booking: (t) => t.kind === "booking",
  payback: (t) => t.kind === "payback",
  mine: (t) => t.mine,
};

/** Filtered rows grouped by date label, in store order (newest first). */
function groupByDate(rows: Transaction[]) {
  const groups: { label: string; rows: Transaction[] }[] = [];
  for (const t of rows) {
    const last = groups[groups.length - 1];
    if (last?.label === t.dateLabel) last.rows.push(t);
    else groups.push({ label: t.dateLabel, rows: [t] });
  }
  return groups;
}

export default function TransactionsPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense>
      <TransactionsView />
    </Suspense>
  );
}

function TransactionsView() {
  const { tripId } = useParams<{ tripId: TripId }>();
  const hydrated = useHydrated();
  if (!TRIP_IDS.includes(tripId)) notFound();
  return hydrated ? <Transactions tripId={tripId} /> : null;
}

function Transactions({ tripId }: { tripId: TripId }) {
  const fromMe = useSearchParams().get("scope") === "me";
  const { transactions } = useMoney(tripId, "everyone");
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const groups = groupByDate(transactions.filter(matches[filter]));
  // DESIGN-ASSUMPTION (M-bookings-money.md §1.8 #7): back returns to the scope you came from.
  const backHref = `/trips/${tripId}/expenses${fromMe ? "?scope=me" : ""}`;

  return (
    <Screen>
      <header className="sticky top-0 z-30 flex shrink-0 flex-col gap-2.5 bg-white pb-3 pt-safe-hero shadow-[0_1px_0_rgb(11_27_63/0.05)]">
        <div className="flex items-center gap-1.5 px-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref} aria-label="Back">
              <ArrowLeft className="size-[22px]" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-20 font-bold tracking-h3">{T.title}</h1>
            <p className="text-13 tracking-caption text-muted">{T.sub}</p>
          </div>
        </div>
        <FilterChips value={filter} onChange={setFilter} count={transactions.length} />
      </header>
      <div className="flex flex-col gap-2 px-4 pb-[120px] pt-3">
        {groups.length === 0 ? (
          <p className="px-4 py-[30px] text-center text-13 text-muted">{T.empty}</p>
        ) : (
          groups.map((g) => <TransactionGroup key={g.label} label={g.label} rows={g.rows} />)
        )}
      </div>
      <StickyDock>
        <FadeDock variant="gradient" className="px-4 pt-[30px]">
          <Button variant="primary" size="xl" asChild className="w-full gap-2">
            <Link href={`/trips/${tripId}/expenses?scope=me&sheet=record`}>
              <Plus className="size-[18px]" />
              {T.record}
            </Link>
          </Button>
        </FadeDock>
      </StickyDock>
    </Screen>
  );
}
