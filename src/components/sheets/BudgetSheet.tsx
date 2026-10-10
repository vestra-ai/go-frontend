"use client";

import { useEffect, useRef } from "react";
import { Eyebrow } from "@/components/common/Eyebrow";
import { InfoNote } from "@/components/common/InfoNote";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { budgetSheet as copy } from "@/data/seed/copy";
import { SAVED_CLOSE_MS } from "@/data/timing";
import { kFormat } from "@/lib/format";
import { BudgetRangeSlider } from "./BudgetRangeSlider";

type BudgetSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whole rupees per person. */
  amount: number;
  saved: boolean;
  /** The save is on its way. */
  pending?: boolean;
  /** Moving the thumb (the caller drops `saved`). */
  onChange: (amount: number) => void;
  /** Writes the budget; resolves true once the Server took it. */
  onSave: () => Promise<boolean>;
};

/**
 * The group's budget sheet: one amount per person for everyone (CONTRACT-APP §4.4). Save shows "Saved ✓" for
 * SAVED_CLOSE_MS, then the sheet closes itself.
 */
export function BudgetSheet({ open, onOpenChange, amount, saved, pending = false, onChange, onSave }: BudgetSheetProps) {
  const closeTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  // Moving the slider again (saved → false) or closing the sheet by hand cancels the pending auto-close.
  useEffect(() => {
    if (!saved || !open) window.clearTimeout(closeTimer.current);
  }, [saved, open]);

  async function save() {
    if (pending) return;
    const ok = await onSave();
    window.clearTimeout(closeTimer.current);
    if (ok) closeTimer.current = window.setTimeout(() => onOpenChange(false), SAVED_CLOSE_MS);
  }

  return (
    // Design height 458 (top 454 on the 912 frame); BottomSheet clamps it to frame − 96.
    <BottomSheet open={open} onOpenChange={onOpenChange} top={454} aria-label={copy.label}>
      <SheetBody className="gap-3 pb-[120px]">
        <SheetHeader title={copy.title} subtitle={copy.sub} />

        <Card variant="outline" radius="2xl" className="flex flex-col gap-2.5 px-4 pt-[18px] pb-3.5">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <span className="text-32 font-bold tracking-title tabular-nums">{kFormat(amount)}</span>
          <BudgetRangeSlider value={[amount]} onValueChange={([next]) => onChange(next)} />
          <div className="flex justify-between text-13 font-semibold tracking-caption text-muted">
            <span>{copy.minLabel}</span>
            <span>{copy.maxLabel}</span>
          </div>
        </Card>

        <InfoNote>{copy.note}</InfoNote>
      </SheetBody>

      <SheetFooter>
        {saved ? (
          // Design 18/500 on success-soft; tapping it does nothing.
          <Button type="button" variant="success-soft" size="xl" weight="medium" className="w-full">
            {copy.saved}
          </Button>
        ) : (
          <Button type="button" variant="primary" size="xl" className="w-full" aria-busy={pending} disabled={pending} onClick={save}>
            {copy.save}
          </Button>
        )}
      </SheetFooter>
    </BottomSheet>
  );
}
