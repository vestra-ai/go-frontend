"use client";

import { useCallback } from "react";
import { NextStepPill } from "@/components/chat/NextStepPill";
import { Eyebrow } from "@/components/common/Eyebrow";
import { InfoNote } from "@/components/common/InfoNote";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { budgetSheet as copy } from "@/data/seed/copy";
import { kFormat } from "@/lib/format";
import { BudgetRangeSlider } from "./BudgetRangeSlider";

type BudgetSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lo: number;
  hi: number;
  saved: boolean;
  /** setBudget (the store clamps and sets saved=false) */
  onChange: (lo: number, hi: number) => void;
  /** saveBudget */
  onSave: () => void;
  /** Non-null once saved: "Saved · see the stays Go found" (the caller closes the sheet, then advances). */
  next: { label: string; onPress: () => void } | null;
};

/** E7 private min–max budget sheet with the in-sheet next-step pill (E-deciding.md §1.3). */
export function BudgetSheet({ open, onOpenChange, lo, hi, saved, onChange, onSave, next }: BudgetSheetProps) {
  // The pill would sit under the footer gradient: when it mounts (after saving, or when the sheet opens saved),
  // scroll the body (its wrapper's parent) to the end. Stable, so re-renders don't scroll again.
  const revealPill = useCallback((wrapper: HTMLDivElement | null) => {
    const body = wrapper?.parentElement;
    if (!body) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    body.scrollTo({ top: body.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, []);

  return (
    // Design height 458 (top 454 on the 912 frame); BottomSheet clamps it to frame − 96.
    <BottomSheet open={open} onOpenChange={onOpenChange} top={454} aria-label={copy.label}>
      <SheetBody className="gap-3 pb-[120px]">
        <SheetHeader title={copy.title} subtitle={copy.sub} />

        <Card variant="outline" radius="2xl" className="flex flex-col gap-2.5 px-4 pt-[18px] pb-3.5">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <span className="text-32 font-bold tracking-title tabular-nums">{`${kFormat(lo)} – ${kFormat(hi)}`}</span>
          <BudgetRangeSlider value={[lo, hi]} onValueChange={([l, h]) => onChange(l, h)} />
          <div className="flex justify-between text-13 font-semibold tracking-caption text-muted">
            <span>{copy.minLabel}</span>
            <span>{copy.maxLabel}</span>
          </div>
        </Card>

        <InfoNote>{copy.note}</InfoNote>

        {next && (
          <div ref={revealPill} className="flex flex-col">
            <NextStepPill label={next.label} onPress={next.onPress} />
          </div>
        )}
      </SheetBody>

      <SheetFooter>
        {saved ? (
          // Design 18/500 on success-soft; tapping it does nothing.
          <Button type="button" variant="success-soft" size="xl" weight="medium" className="w-full">
            {copy.saved}
          </Button>
        ) : (
          <Button type="button" variant="primary" size="xl" className="w-full" onClick={onSave}>
            {copy.save}
          </Button>
        )}
      </SheetFooter>
    </BottomSheet>
  );
}
