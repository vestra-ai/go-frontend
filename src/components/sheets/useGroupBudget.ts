"use client";

import { useState } from "react";
import { errorMessage } from "@/api/http";
import { budgetSheet as copy } from "@/data/seed/copy";
import { BUDGET_RANGE } from "@/data/seed/money";
import { toastGo } from "@/lib/toast";
import { patchTrip, useGo } from "@/state";
import { fromMinor, toMinor } from "@/state/view";

const clamp = (n: number) => Math.min(Math.max(Math.round(n / BUDGET_RANGE.step) * BUDGET_RANGE.step, BUDGET_RANGE.min), BUDGET_RANGE.max);

/**
 * The BudgetSheet's state for one trip: the group's one budget per person (CONTRACT-APP §4.4), which any member sets
 * with `PATCH /trips/:trip { budget_per_person_minor }`. Spread the result into <BudgetSheet>.
 */
export function useGroupBudget(tripId: string) {
  const current = useGo((s) => s.trips[tripId]?.view?.budget?.per_person_minor ?? null);
  const [draft, setDraft] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const amount = draft ?? (current ? clamp(fromMinor(current)) : BUDGET_RANGE.start);

  return {
    amount,
    /** Whether the trip has a budget at all. */
    isSet: current !== null,
    saved,
    pending,
    onChange: (next: number) => {
      setDraft(clamp(next));
      setSaved(false);
    },
    onSave: async () => {
      setPending(true);
      try {
        await patchTrip(tripId, { budget_per_person_minor: toMinor(amount) });
        setSaved(true);
        return true;
      } catch (err) {
        toastGo(errorMessage(err, copy.failed));
        return false;
      } finally {
        setPending(false);
      }
    },
    /** Call when the sheet opens: start again from the trip's value. */
    reset: () => {
      setDraft(null);
      setSaved(false);
    },
  };
}
