"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ScopeToggle, type ScopeValue } from "@/components/common/ScopeToggle";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ChevronRight } from "@/components/icons/generated";
import { SettleRow } from "@/components/money/SettleRow";
import { SpendSummary } from "@/components/money/SpendSummary";
import { TransactionRow } from "@/components/money/TransactionRow";
import { BudgetSheet } from "@/components/sheets/BudgetSheet";
import { RecordPaymentSheet } from "@/components/sheets/RecordPaymentSheet";
import { useGroupBudget } from "@/components/sheets/useGroupBudget";
import { recordTargetFor, useRecordSheet } from "@/components/sheets/useRecordTarget";
import { DashedNoteRow } from "@/components/trip/DashedNoteRow";
import { ExpensesZero } from "@/components/trip/empty/ExpensesZero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MONEY_COPY } from "@/data/seed/money";
import type { TripId } from "@/data/types";
import { loadMoney, loadTransactions, useTripGate } from "@/state";
import { buildMoneyView, toTransactionRow } from "@/state/moneyView";
import { usersById } from "@/state/view";

const parseScope = (v: string | null): ScopeValue => (v === "me" ? "me" : "everyone");

export default function ExpensesPage() {
  const { tripId } = useParams<{ tripId: TripId }>();
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={null}>
      <Expenses key={tripId} tripId={tripId} />
    </Suspense>
  );
}

/**
 * Expenses tab (CONTRACT-APP §4.9): `GET …/money` carries both the "Everyone" and the "Just me" view; the rows under it
 * are the first page of `GET …/transactions`. An expense counts when it is added and a payback when it is recorded.
 */
function Expenses({ tripId }: { tripId: TripId }) {
  const params = useSearchParams();
  // The scope is local state seeded from the URL; re-seeded when a link changes it (the tab link resets the scope).
  const [scope, setScope] = useState<ScopeValue>(parseScope(params.get("scope")));
  const [seenScope, setSeenScope] = useState(params.get("scope"));
  if (seenScope !== params.get("scope")) {
    setSeenScope(params.get("scope"));
    setScope(parseScope(params.get("scope")));
  }
  const [budgetOpen, setBudgetOpen] = useState(false);
  const record = useRecordSheet();
  const budget = useGroupBudget(tripId);
  const data = useTripGate(tripId);
  const ready = data !== null;
  const filter = scope === "me" ? "mine" : "all";

  useEffect(() => {
    if (!ready) return;
    void loadMoney(tripId).catch(() => {});
    void loadTransactions(tripId, "all").catch(() => {});
  }, [ready, tripId]);
  useEffect(() => {
    if (ready && filter === "mine") void loadTransactions(tripId, "mine").catch(() => {});
  }, [ready, tripId, filter]);

  if (!data?.view || !data.money || !data.transactions.all) return null;
  const { view, money } = data;
  const all = data.transactions.all;

  const changeScope = (next: ScopeValue) => {
    setScope(next);
    // history.replaceState only: no navigation, no new history entry (Next mirrors it into useSearchParams).
    const q = new URLSearchParams(window.location.search);
    q.set("scope", next);
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${q}`);
  };
  const openBudget = () => {
    budget.reset();
    setBudgetOpen(true);
  };

  const users = usersById(view.people);
  const meId = view.me.person.person_id;
  const model = buildMoneyView(money, scope, view.budget?.per_person_minor, users);
  const rows = ((scope === "me" ? data.transactions.mine : all)?.items ?? []).slice(0, 5).map((tx) => toTransactionRow(tx, view.bookings));
  // Zero until the first expense or payback exists.
  const zero = all.totalCount === 0;

  return (
    <>
      {zero ? (
        <ExpensesZero scope={scope} onScopeChange={changeScope} budgetSet={budget.isSet} onSetBudget={openBudget} />
      ) : (
        <>
          <ScopeToggle aria-label={MONEY_COPY.scopeLabel} value={scope} onValueChange={changeScope} />
          <SpendSummary view={model} onEditBudget={openBudget} />
          <SectionHeader title={MONEY_COPY.settleTitle} meta={model.settleMeta || undefined} className="mt-2" />
          {model.settlements.length === 0 ? (
            <DashedNoteRow emoji={MONEY_COPY.allSquare.emoji} title={MONEY_COPY.allSquare.title} sub={MONEY_COPY.allSquare.sub} />
          ) : (
            <Card variant="shadow" radius="2xl" className="px-3.5 pt-1.5 pb-0.5">
              {money.transfers.map((transfer, i) => (
                <SettleRow
                  key={`${transfer.from_person_id}|${transfer.to_person_id}`}
                  settlement={model.settlements[i]}
                  users={users}
                  isYou={transfer.from_person_id === meId}
                  onRecord={() => record.show(recordTargetFor(view, transfer))}
                />
              ))}
            </Card>
          )}
          <SectionHeader title={MONEY_COPY.txTitle} meta={MONEY_COPY.txMeta} className="mt-2" />
          {rows.length > 0 && (
            <Card variant="shadow" radius="2xl" className="px-3.5 py-0.5">
              {rows.map((tx, i) => (
                <TransactionRow key={tx.id} tx={tx} users={users} meId={meId} showDate first={i === 0} />
              ))}
            </Card>
          )}
          <Button variant="white" size="base" asChild className="w-full gap-1.5 shadow-card">
            <Link href={`/trips/${tripId}/expenses/transactions?scope=${scope}`}>
              {scope === "me" ? MONEY_COPY.seeEveryone : MONEY_COPY.seeAll(all.totalCount)}
              <ChevronRight className="size-[15px]" strokeWidth={2.4} />
            </Link>
          </Button>
        </>
      )}
      <RecordPaymentSheet open={record.open} onOpenChange={record.onOpenChange} target={record.target} />
      <BudgetSheet open={budgetOpen} onOpenChange={setBudgetOpen} {...budget} />
    </>
  );
}
