"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input, inputShellVariants } from "@/components/ui/input";
import { Eyebrow } from "@/components/common/Eyebrow";
import { CALL_COPY } from "@/data/seed/calls";
import type { ChipOption } from "@/data/types";
import { cn } from "@/lib/utils";

const call = CALL_COPY.options.call;
const callAt = call.indexOf(" "); // "📞 Call" → emoji + label

type CallOptionsPanelProps = {
  /** "ASK GO TO CALL VILLA SOL" | "ASK GO TO CALL INDIGO". */
  eyebrow: string;
  chips: ChipOption[];
  /** Selected chip label (single-select). */
  selected: string | null;
  onChip(label: string): void;
  draft: string;
  onDraft(text: string): void;
  placeholder: string;
  /** Visually hidden input label. */
  srLabel: string;
  /** "📞 Call" → `startCall(vendor, key)`. */
  onCall(): void;
};

/** "Ask Go to call …" chips + input inside an opened Stay/Flights done row with no live call (§1.2 E.1.1). */
export function CallOptionsPanel({
  eyebrow,
  chips,
  selected,
  onChip,
  draft,
  onDraft,
  placeholder,
  srLabel,
  onCall,
}: CallOptionsPanelProps) {
  const id = useId();
  return (
    <Card variant="outline" radius="lg" data-slot="call-options-panel" className="flex flex-col gap-2.5 p-3">
      <Eyebrow tone="muted">{eyebrow}</Eyebrow>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <Chip key={c.label} size="xs" emoji={c.emoji} pressed={selected === c.label} onClick={() => onChip(c.label)}>
            {c.label}
          </Chip>
        ))}
      </div>
      {/* InputField's shell takes no className, so the ask shape is composed here at the design's 48px. */}
      <div className={cn(inputShellVariants({ shape: "ask" }), "h-12 gap-2 pr-[5px] pl-[14px]")}>
        <label htmlFor={id} className="sr-only">
          {srLabel}
        </label>
        <Input
          id={id}
          shape="inline"
          className="text-15"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => onDraft(e.target.value)}
        />
        <Button variant="primary" size="38" weight="semibold" className="gap-1" onClick={onCall}>
          <span aria-hidden>{call.slice(0, callAt)}</span>
          {call.slice(callAt + 1)}
        </Button>
      </div>
    </Card>
  );
}
