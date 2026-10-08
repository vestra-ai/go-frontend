"use client";

import { Plus } from "@/components/icons/generated";
import { FadeDock } from "@/components/shell/FadeDock";
import { StickyDock } from "@/components/shell/StickyDock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chat as copy } from "@/data/seed/copy";
import type { AttachItem } from "@/data/types";
import { AttachMenu } from "./AttachMenu";
import { MicSendButton } from "./MicSendButton";
import { RecordingPill } from "./RecordingPill";

type ComposerProps = {
  value: string;
  onChange(v: string): void;
  /** Trimmed, non-empty: MicSend press or Enter with a draft. */
  onSend(text: string): void;
  recording: boolean;
  /** MicSend press with an empty draft (start, or stop and send the voice note). */
  onMic(): void;
  attachOpen: boolean;
  onAttachOpenChange(open: boolean): void;
  onAttach(item: AttachItem): void;
};

/** Default composer: + (attach), white pill input, mic/send. 96px tall with a 24px safe area. */
export function Composer({ value, onChange, onSend, recording, onMic, attachOpen, onAttachOpenChange, onAttach }: ComposerProps) {
  const draft = value.trim();

  function press() {
    if (draft) onSend(draft);
    else onMic();
  }

  return (
    <StickyDock>
      <FadeDock variant="gradient">
        <div className="relative flex items-center gap-2.5 px-4 pt-6 [[data-own]_&]:animate-page-in">
          <AttachMenu open={attachOpen} onOpenChange={onAttachOpenChange} onPick={onAttach}>
            <Button type="button" variant="white" size="icon-lg" aria-label={copy.composer.add} aria-expanded={attachOpen}>
              <Plus className="size-5" />
            </Button>
          </AttachMenu>
          <label htmlFor="msg" className="min-w-0 flex-1">
            <span className="sr-only">{copy.composer.srLabel}</span>
            <Input
              id="msg"
              type="text"
              shape="pill"
              autoComplete="off"
              enterKeyHint="send"
              placeholder={copy.composer.placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                if (draft) onSend(draft);
              }}
            />
          </label>
          <MicSendButton hasDraft={draft.length > 0} recording={recording} onPress={press} />
          {recording && <RecordingPill />}
        </div>
      </FadeDock>
    </StickyDock>
  );
}
