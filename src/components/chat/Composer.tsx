"use client";

import { useRef } from "react";
import { Plus } from "@/components/icons/generated";
import { FadeDock } from "@/components/shell/FadeDock";
import { StickyDock } from "@/components/shell/StickyDock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chat as copy } from "@/data/seed/copy";
import type { AttachItem } from "@/data/types";
import { AttachMenu } from "./AttachMenu";
import { MicSendButton } from "./MicSendButton";
import { RecordingBar } from "./RecordingBar";

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
  recordingSeconds: number;
  /** The recording bar's cancel button (or Escape): drops the recording without sending. */
  onCancelRecording(): void;
  /** A photo or PDF chosen in the picker the + menu opened. */
  onAttachFile(item: AttachItem, file: File): void;
};

// File picker per menu row; the menu closes first, then the native picker opens.
const ACCEPT: Record<AttachItem, string> = { photo: "image/*", pdf: "application/pdf" };

/** Default composer: + (attach), white pill input, mic/send. 96px tall with a 24px safe area. */
export function Composer({
  value,
  onChange,
  onSend,
  recording,
  recordingSeconds,
  onCancelRecording,
  onMic,
  attachOpen,
  onAttachOpenChange,
  onAttachFile,
}: ComposerProps) {
  const draft = value.trim();
  const photoInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const inputs: Record<AttachItem, React.RefObject<HTMLInputElement | null>> = { photo: photoInput, pdf: pdfInput };

  function pick(item: AttachItem) {
    inputs[item].current?.click();
  }

  function picked(item: AttachItem, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // the same file can be picked again
    if (file) onAttachFile(item, file);
  }

  function press() {
    if (draft) onSend(draft);
    else onMic();
  }

  return (
    <StickyDock>
      <FadeDock variant="gradient">
        <div className="relative flex items-center gap-2.5 px-4 pt-6 [[data-own]_&]:animate-page-in">
          {recording ? (
            <RecordingBar seconds={recordingSeconds} onCancel={onCancelRecording} onSend={onMic} />
          ) : (
            <>
              <AttachMenu open={attachOpen} onOpenChange={onAttachOpenChange} onPick={pick}>
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
              {(Object.keys(ACCEPT) as AttachItem[]).map((item) => (
                <input
                  key={item}
                  ref={inputs[item]}
                  type="file"
                  accept={ACCEPT[item]}
                  hidden
                  tabIndex={-1}
                  aria-hidden
                  onChange={(e) => picked(item, e)}
                />
              ))}
              <MicSendButton hasDraft={draft.length > 0} recording={recording} onPress={press} />
            </>
          )}
        </div>
      </FadeDock>
    </StickyDock>
  );
}
