"use client";

import { useEffect, useId, useRef } from "react";
import { Plus } from "@/components/icons/generated";
import { FadeDock } from "@/components/shell/FadeDock";
import { usePageInResume } from "@/components/shell/PageTransition";
import { StickyDock } from "@/components/shell/StickyDock";
import { Button } from "@/components/ui/button";
import { chat as copy } from "@/data/seed/copy";
import type { AttachItem } from "@/data/types";
import { focusAtEndAfterSheets } from "@/lib/focus";
import type { MentionItem } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { AttachMenu } from "./AttachMenu";
import { MentionInput } from "./MentionInput";
import { MentionSuggestions } from "./MentionSuggestions";
import { MicSendButton } from "./MicSendButton";
import { RecordingBar } from "./RecordingBar";
import { useMentionSuggest } from "./useMentionSuggest";

type ComposerProps = {
  value: string;
  onChange(v: string): void;
  /** Trimmed, non-empty: MicSend press or Enter with a draft. */
  onSend(text: string): void;
  /** Goes up each time the app writes the draft itself (a Board row's ask): the input takes the focus, caret after the words. */
  prefills?: number;
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
  /** Go and the people in the trip: what typing "@" lists. */
  mentionItems?: MentionItem[];
  /** Slide up with the page (default). Off when the composer replaces the skeleton in place. */
  slideIn?: boolean;
};

// File picker per menu row; the menu closes first, then the native picker opens.
const ACCEPT: Record<AttachItem, string> = { photo: "image/*", pdf: "application/pdf" };

/** Default composer: + (attach), white pill input, mic/send. 96px tall with a 24px safe area. */
export function Composer({
  value,
  onChange,
  onSend,
  prefills = 0,
  recording,
  recordingSeconds,
  onCancelRecording,
  onMic,
  attachOpen,
  onAttachOpenChange,
  onAttachFile,
  mentionItems,
  slideIn = true,
}: ComposerProps) {
  const draft = value.trim();
  const listId = useId();
  const resume = usePageInResume();
  const msgInput = useRef<HTMLInputElement>(null);
  const mentions = useMentionSuggest({ value, onChange, inputRef: msgInput, items: mentionItems });
  // A draft the app wrote is easy to miss: the input takes the focus with the caret after the words, and the keyboard
  // comes up once the sheet whose button wrote them has left. A passive effect, so the closing sheet has let go of its
  // focus trap; it still runs inside the tap, which is the only place iOS takes a focus from.
  const seenPrefills = useRef(prefills);
  useEffect(() => {
    if (seenPrefills.current === prefills) return;
    seenPrefills.current = prefills;
    if (msgInput.current) return focusAtEndAfterSheets(msgInput.current);
  }, [prefills]);
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
        <div ref={resume} className={cn("relative flex items-center gap-2.5 px-4 pt-6", slideIn && "[[data-own]_&]:animate-page-in")}>
          {recording ? (
            <RecordingBar seconds={recordingSeconds} onCancel={onCancelRecording} onSend={onMic} />
          ) : (
            <>
              {/* 8px above the input: the row starts 24px above it. */}
              {mentions.open && (
                <MentionSuggestions id={listId} items={mentions.matches} active={mentions.active} onPick={mentions.pick} className="inset-x-4 bottom-[calc(100%-16px)]" />
              )}
              <AttachMenu open={attachOpen} onOpenChange={onAttachOpenChange} onPick={pick}>
                <Button type="button" variant="white" size="icon-lg" aria-label={copy.composer.add} aria-expanded={attachOpen}>
                  <Plus className="size-5" />
                </Button>
              </AttachMenu>
              <label htmlFor="msg" className="min-w-0 flex-1">
                <span className="sr-only">{copy.composer.srLabel}</span>
                <MentionInput
                  inputRef={msgInput}
                  id="msg"
                  type="text"
                  shape="pill"
                  autoComplete="off"
                  enterKeyHint="send"
                  placeholder={copy.composer.placeholder}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={mentions.open}
                  aria-controls={mentions.open ? listId : undefined}
                  aria-activedescendant={mentions.open ? `${listId}-${mentions.active}` : undefined}
                  value={value}
                  {...mentions.inputProps}
                  onKeyDown={(e) => {
                    if (mentions.onKeyDown(e)) return;
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
