"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { errorMessage } from "@/api/http";
import { ArrowLeft, Plus } from "@/components/icons/generated";
import { FilterChips, type TransactionFilter } from "@/components/money/FilterChips";
import { TransactionGroup } from "@/components/money/TransactionGroup";
import { FadeDock } from "@/components/shell/FadeDock";
import { StickyDock } from "@/components/shell/StickyDock";
import { Screen } from "@/components/shell/Screen";
import { RecordPaymentSheet } from "@/components/sheets/RecordPaymentSheet";
import { recordTargetFor, useRecordSheet } from "@/components/sheets/useRecordTarget";
import { Button } from "@/components/ui/button";
import { MONEY_COPY } from "@/data/seed/money";
import type { Transaction, TripId } from "@/data/types";
import { toastGo } from "@/lib/toast";
import { loadMoney, loadMoreTransactions, loadTransactions, useTripGate } from "@/state";
import { toTransactionRow } from "@/state/moneyView";
import { usersById } from "@/state/view";

const T = MONEY_COPY.transactions;

/** Rows grouped by date label, in the Server's order (newest first). */
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
  const { tripId } = useParams<{ tripId: TripId }>();
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={<Screen>{null}</Screen>}>
      <Transactions key={tripId} tripId={tripId} />
    </Suspense>
  );
}

/**
 * Transactions page (CONTRACT-APP §4.9): `GET …/transactions?filter=`, newest first, paged by an opaque cursor. The
 * Server filters; `total_count` counts every row whatever the filter (the "All 7" chip).
 */
function Transactions({ tripId }: { tripId: TripId }) {
  const fromMe = useSearchParams().get("scope") === "me";
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const record = useRecordSheet();
  const data = useTripGate(tripId);
  const ready = data !== null;

  useEffect(() => {
    if (!ready) return;
    void loadTransactions(tripId, filter).catch(() => {});
  }, [ready, tripId, filter]);
  useEffect(() => {
    if (ready) void loadMoney(tripId).catch(() => {});
  }, [ready, tripId]);

  if (!data?.view) return <Screen>{null}</Screen>;
  const { view } = data;
  const list = data.transactions[filter];
  const total = list?.totalCount ?? data.transactions.all?.totalCount ?? 0;
  const users = usersById(view.people);
  const groups = groupByDate((list?.items ?? []).map((tx) => toTransactionRow(tx, view.bookings)));
  // Back returns to the scope you came from.
  const backHref = `/trips/${tripId}/expenses${fromMe ? "?scope=me" : ""}`;

  const openRecord = () => {
    // The sheet records a payback for a debt of mine; without one there is nobody to pay.
    const owe = data.money?.me.i_owe[0];
    if (owe) record.show(recordTargetFor(view, owe));
    else toastGo(MONEY_COPY.recordSheet.nobody);
  };

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
        <FilterChips value={filter} onChange={setFilter} count={total} />
      </header>
      <div className="flex flex-col gap-2 px-4 pb-[120px] pt-3 [[data-own]_&]:animate-page-in">
        {!list ? null : groups.length === 0 ? (
          <p className="px-4 py-[30px] text-center text-13 text-muted">{T.empty}</p>
        ) : (
          groups.map((g) => (
            <TransactionGroup key={g.label} label={g.label} rows={g.rows} users={users} meId={view.me.person.person_id} />
          ))
        )}
        {list?.nextCursor && (
          <Button
            variant="white"
            size="base"
            className="w-full shadow-card"
            aria-busy={list.loading}
            disabled={list.loading}
            onClick={() => void loadMoreTransactions(tripId, filter).catch((err) => toastGo(errorMessage(err)))}
          >
            {T.more}
          </Button>
        )}
      </div>
      <StickyDock>
        <FadeDock variant="gradient" className="px-4 pt-[30px] [[data-own]_&]:animate-page-in">
          <Button variant="primary" size="xl" className="w-full gap-2" onClick={openRecord}>
            <Plus className="size-[18px]" />
            {T.record}
          </Button>
        </FadeDock>
      </StickyDock>
      <RecordPaymentSheet open={record.open} onOpenChange={record.onOpenChange} target={record.target} />
    </Screen>
  );
}
