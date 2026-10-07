"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Eyebrow } from "@/components/common/Eyebrow";
import { InputField } from "@/components/common/InputField";
import { CALL_COPY } from "@/data/seed/calls";
import type { ChipOption } from "@/data/types";
import { splitEmoji } from "@/lib/emoji";

const call = splitEmoji(CALL_COPY.options.call); // "📞 Call"

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
      {/* The ask shape at the design's 48px. */}
      <InputField
        shape="ask"
        srLabel={srLabel}
        shellClassName="h-12 gap-2 pr-[5px] pl-[14px]"
        className="text-15"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => onDraft(e.target.value)}
        trailing={
          <Button variant="primary" size="38" weight="semibold" className="gap-1" onClick={onCall}>
            <span aria-hidden>{call.emoji}</span>
            {call.label}
          </Button>
        }
      />
    </Card>
  );
}
