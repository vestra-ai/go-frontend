"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/shell/BottomSheet";
import type { TripId } from "@/data/types";
import { CheckinDetailsStep } from "./CheckinDetailsStep";
import { CheckinSeatStep } from "./CheckinSeatStep";

type CheckinStep = "details" | "seat";

type CheckinSheetProps = {
  tripId: TripId;
  /** The step the URL asks for; null = closed. */
  step: CheckinStep | null;
  /** X / scrim / drag / Escape on either step: close the whole check-in (the check-in state is kept). */
  onClose: () => void;
  /** "Continue to seats". */
  onContinue: () => void;
};

/**
 * Web check-in steps 1 and 2 in ONE sheet: moving between them swaps the content in place (it slides up as the new
 * step), the sheet itself never closes and reopens. The step content is remembered while the sheet animates out.
 * Dismissing it, from either step, closes the check-in; browser Back steps seat → details (each step is a history entry).
 */
export function CheckinSheet({ tripId, step, onClose, onContinue }: CheckinSheetProps) {
  // `shown` outlives `step` (null once closed) so the sheet keeps its content while it slides away; `swapped` is
  // true only for a step change inside an open sheet, not for the first open.
  const [state, setState] = useState<{ shown: CheckinStep; open: boolean; swapped: boolean }>({
    shown: step ?? "details",
    open: step !== null,
    swapped: false,
  });
  if (step !== null && (!state.open || step !== state.shown)) {
    setState({ shown: step, open: true, swapped: state.open });
  } else if (step === null && state.open) {
    setState({ ...state, open: false });
  }

  // Checking in completes the flow: keep the sheet up until the pass route replaces the page.
  const [leaving, setLeaving] = useState(false);

  return (
    <BottomSheet
      inset={48}
      open={step !== null || leaving}
      onOpenChange={(open) => !open && !leaving && onClose()}
    >
      {state.shown === "details" ? (
        <CheckinDetailsStep tripId={tripId} onContinue={onContinue} swapped={state.swapped} />
      ) : (
        <CheckinSeatStep tripId={tripId} onLeave={() => setLeaving(true)} swapped={state.swapped} />
      )}
    </BottomSheet>
  );
}
