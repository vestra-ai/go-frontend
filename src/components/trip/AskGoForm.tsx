"use client";

import { useId } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input, inputShellVariants } from "@/components/ui/input";
import { CALL_COPY } from "@/data/seed/calls";
import type { ChipOption, LastCall, VendorId } from "@/data/types";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { LastCallRow } from "./LastCallRow";

const copy = CALL_COPY.form;
const submitAt = copy.submit.indexOf(" "); // "📞 Ask Go to call" → emoji + label

type AskGoFormProps = Omit<React.ComponentProps<typeof Card>, "children"> & {
  /** `CALL_CHIPS.main`. */
  chips: ChipOption[];
  /** Selected chip label (single-select). */
  selected: string | null;
  draft: string;
  onChip(label: string): void;
  onDraft(text: string): void;
  /** "📞 Ask Go to call" → `callMain()`. */
  onSubmit(): void;
  /** `home.lastCall`: adds the last-call row with its Recording pill. */
  lastCall?: LastCall;
  /** Recording pill → `?sheet=recording&call={vendor}`. */
  onRecording(vendor: VendorId): void;
};

/** "Need something sorted?" card: Go calls the villa or the cab desk for you (§1.2 D). */
export function AskGoForm({
  chips,
  selected,
  draft,
  onChip,
  onDraft,
  onSubmit,
  lastCall,
  onRecording,
  className,
  ...props
}: AskGoFormProps) {
  const id = useId();
  return (
    <Card radius="2xl" data-slot="ask-go-form" className={cn("flex flex-col gap-3 p-4", className)} {...props}>
      <div className="flex items-center gap-2.5">
        <Avatar size={36} kind="go" src={assets.goAvatar.src} />
        <div className="flex min-w-0 flex-col gap-px">
          <span className="text-16 leading-[1.3] font-semibold tracking-body">{copy.title}</span>
          <span className="text-13 tracking-caption text-muted">{copy.sub}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <Chip key={c.label} size="xs" emoji={c.emoji} pressed={selected === c.label} onClick={() => onChip(c.label)}>
            {c.label}
          </Chip>
        ))}
      </div>
      {/* InputField's shell takes no className; the ask shape is composed here to keep the design's 8px gap. */}
      <div className={cn(inputShellVariants({ shape: "ask" }), "gap-2")}>
        <label htmlFor={id} className="sr-only">
          {copy.srLabel}
        </label>
        <Input
          id={id}
          shape="inline"
          className="text-15"
          value={draft}
          placeholder={copy.placeholder}
          onChange={(e) => onDraft(e.target.value)}
        />
        <Button variant="primary" size="40" weight="semibold" className="gap-1" onClick={onSubmit}>
          <span aria-hidden>{copy.submit.slice(0, submitAt)}</span>
          {copy.submit.slice(submitAt + 1)}
        </Button>
      </div>
      {lastCall && <LastCallRow lastCall={lastCall} onRecording={() => onRecording(lastCall.vendor)} />}
    </Card>
  );
}
