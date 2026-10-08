"use client";

import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ScopeToggle, type ScopeValue } from "@/components/common/ScopeToggle";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ChevronRight } from "@/components/icons/generated";
import { SettleRow } from "@/components/money/SettleRow";
import { SpendSummary } from "@/components/money/SpendSummary";
import { TransactionRow } from "@/components/money/TransactionRow";
import { RecordPaymentSheet } from "@/components/sheets/RecordPaymentSheet";
import { ExpensesZero } from "@/components/trip/empty/ExpensesZero";
import { TripShell } from "@/components/trip/TripShell";
import { useTripShellProps } from "@/components/trip/useTripShellProps";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MONEY_COPY } from "@/data/seed/money";
import { SESSION_USER_ID } from "@/data/seed/users";
import { TRIP_IDS } from "@/data/seed/trips";
import type { TripId } from "@/data/types";
import { useHydrated, useMoney } from "@/store";

const parseScope = (v: string | null): ScopeValue => (v === "me" ? "me" : "everyone");

export default function ExpensesPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense>
      <ExpensesView />
    </Suspense>
  );
}

function ExpensesView() {
  const { tripId } = useParams<{ tripId: TripId }>();
  const hydrated = useHydrated();
  if (!TRIP_IDS.includes(tripId)) notFound();
  return hydrated ? <Expenses tripId={tripId} /> : null;
}

function Expenses({ tripId }: { tripId: TripId }) {
  const params = useSearchParams();
  const urlKey = `${params.get("scope")}|${params.get("sheet")}`;
  // Local state seeded from the URL (PLAN §12.1 #19); re-seeded when a link changes the query (the tab link resets the scope).
  const [scope, setScope] = useState<ScopeValue>(parseScope(params.get("scope")));
  const [sheetOpen, setSheetOpen] = useState(params.get("sheet") === "record");
  const [seenKey, setSeenKey] = useState(urlKey);
  if (seenKey !== urlKey) {
    setSeenKey(urlKey);
    setScope(parseScope(params.get("scope")));
    setSheetOpen(params.get("sheet") === "record");
  }

  const shell = useTripShellProps(tripId, "expenses");
  const money = useMoney(tripId, scope);
  if (!shell) notFound();

  // history.replaceState only: no navigation, no new history entry (Next mirrors it into useSearchParams).
  const syncUrl = (patch: { scope?: ScopeValue; sheet?: "record" | null }) => {
    const q = new URLSearchParams(window.location.search);
    if (patch.scope) q.set("scope", patch.scope);
    if (patch.sheet === null) q.delete("sheet");
    else if (patch.sheet) q.set("sheet", patch.sheet);
    const qs = q.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  };
  const changeScope = (next: ScopeValue) => {
    setScope(next);
    syncUrl({ scope: next });
  };
  const changeSheet = (open: boolean) => {
    setSheetOpen(open);
    syncUrl({ sheet: open ? "record" : null });
  };

  // Zero until the first transaction exists (PLAN §12.1 #23).
  const zero = money.transactions.length === 0;

  const toggle = (
    <ScopeToggle aria-label={MONEY_COPY.scopeLabel} value={scope} onValueChange={changeScope} />
  );

  return (
    <>
      <TripShell {...shell}>
        {zero ? (
          <ExpensesZero tripId={tripId} scope={scope} onScopeChange={changeScope} />
        ) : (
          <>
            {toggle}
            <SpendSummary tripId={tripId} view={money} />
            <SectionHeader title={MONEY_COPY.settleTitle} meta={MONEY_COPY.settleMeta} className="mt-2" />
            <Card variant="shadow" radius="2xl" className="px-3.5 pt-1.5 pb-0.5">
              {money.settlements.map((s) => (
                <SettleRow
                  key={s.fromId}
                  settlement={s}
                  isYou={s.fromId === SESSION_USER_ID}
                  onRecord={() => changeSheet(true)}
                />
              ))}
            </Card>
            <SectionHeader title={MONEY_COPY.txTitle} meta={MONEY_COPY.txMeta} className="mt-2" />
            <Card variant="shadow" radius="2xl" className="px-3.5 py-0.5">
              {money.rows.map((tx, i) => (
                <TransactionRow key={tx.id} tx={tx} showDate first={i === 0} />
              ))}
            </Card>
            <Button variant="white" size="base" asChild className="w-full gap-1.5 shadow-card">
              <Link href={`/trips/${tripId}/expenses/transactions?scope=${scope}`}>
                {money.seeAll}
                <ChevronRight className="size-[15px]" strokeWidth={2.4} />
              </Link>
            </Button>
          </>
        )}
      </TripShell>
      <RecordPaymentSheet open={sheetOpen} onOpenChange={changeSheet} />
    </>
  );
}
