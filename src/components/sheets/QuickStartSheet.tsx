"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/common/Eyebrow";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { quickStart as copy } from "@/data/seed/copy";
import type { CityRef, QuickStartAnswers, Spend, Vibe } from "@/data/types";
import { ChoiceChipGroup } from "./ChoiceChipGroup";
import { CityPicker } from "./CityPicker";

type QuickStartSheetProps = {
  open: boolean;
  /** First open: {vibe:'beach', spend:null} + Bengaluru. */
  initial: { answers: QuickStartAnswers; from: CityRef | null };
  /** ?q= opens the sheet in search mode. */
  initialQuery?: string | null;
  onDone: (answers: QuickStartAnswers, from: CityRef | null) => void;
  /** Not now, X, scrim, drag-down, Back. */
  onDismiss: () => void;
};

// Sheet tops on the 912px design artboard: collapsed 384 (h 528), search open 96.
const TOP_COLLAPSED = 384;
const TOP_SEARCH = 96;

export function QuickStartSheet({ open, initial, initialQuery, onDone, onDismiss }: QuickStartSheetProps) {
  const [vibe, setVibe] = useState<Vibe | null>(initial.answers.vibe);
  const [spend, setSpend] = useState<Spend | null>(initial.answers.spend);
  const [from, setFrom] = useState<CityRef | null>(initial.from);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery));
  const [query, setQuery] = useState(initialQuery ?? "");

  // Draft restarts from `initial` each time the sheet opens; nothing is written before Done.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setVibe(initial.answers.vibe);
      setSpend(initial.answers.spend);
      setFrom(initial.from);
      setSearchOpen(Boolean(initialQuery));
      setQuery(initialQuery ?? "");
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
      }}
      top={searchOpen ? TOP_SEARCH : TOP_COLLAPSED}
      aria-label={copy.label}
    >
      <SheetBody className="pb-[150px]">
        <SheetHeader title={copy.title} subtitle={copy.sub} closeLabel={copy.close} />
        <ChoiceChipGroup
          label={copy.vibeLabel}
          options={copy.vibes}
          value={vibe}
          onChange={setVibe}
          allowDeselect
        />
        <ChoiceChipGroup
          label={copy.spendLabel}
          options={copy.spends}
          value={spend}
          onChange={setSpend}
          allowDeselect
        />
        <div role="group" aria-label={copy.fromGroupLabel} className="flex flex-col gap-2">
          <div className="flex justify-between px-1">
            <Eyebrow>{copy.fromLabel}</Eyebrow>
            <span className="text-12 font-semibold text-muted">{copy.fromNote}</span>
          </div>
          <CityPicker
            value={from}
            onChange={setFrom}
            allowDeselect
            searchOpen={searchOpen}
            onSearchOpenChange={setSearchOpen}
            query={query}
            onQueryChange={setQuery}
          />
        </div>
        <p className="px-1 text-13 tracking-caption text-muted">{copy.footnote}</p>
      </SheetBody>
      <SheetFooter>
        <Button variant="primary" size="xl" onClick={() => onDone({ vibe, spend }, from)}>
          {copy.done}
        </Button>
        <Button variant="link" size="base" onClick={onDismiss}>
          {copy.notNow}
        </Button>
      </SheetFooter>
    </BottomSheet>
  );
}
