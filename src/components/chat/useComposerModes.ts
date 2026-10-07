"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { attachSends, chat as chatCopy } from "@/data/seed/copy";
import { GO_REPLY_MS } from "@/data/timing";
import type { AttachItem, ComposerMode, StageId, TripId, UserId } from "@/data/types";
import { useStore, type ChatMessage } from "@/store";
import { writeChatQuery } from "./useChatSheets";

// Composer state machine (C-chat-kickoff.md §1.2 "State machine", §1.5): default composer (draft, voice note,
// attach menu), the long-press overlay, and the reply / ask-Go trays. `?mode=longpress|reply|askGo&msg=<id>`
// mirrors the mode via replaceState (PLAN §8).

const MODES: readonly Exclude<ComposerMode, null>[] = ["longpress", "reply", "askGo"];

// Message list bottom padding per mode (C-chat-kickoff.md §1.2 MessageList).
const PADDING = { none: 96, longpress: 96, reply: 150, askGo: 190 } as const;

// The stage where a reply / ask-Go send also fires `dates-asked` (C-chat-kickoff.md §1.3).
const DATES_TALK: StageId = "dates-talk";

/** Member messages only: any author that is a user other than you. */
function isMemberMessage(m: ChatMessage, me: UserId): boolean {
  return m.author !== "go" && m.author !== "system" && m.author !== me && m.kind === "text";
}

function trayInitial(mode: ComposerMode, target: ChatMessage | null): string {
  return mode === "reply" ? (target?.replyDraft ?? "") : "";
}

export interface ComposerModes {
  mode: ComposerMode;
  /** The member message the overlay / tray is about (null when `mode` is null). */
  target: ChatMessage | null;
  bottomPadding: 96 | 150 | 190;
  draft: string;
  setDraft(value: string): void;
  trayDraft: string;
  setTrayDraft(value: string): void;
  recording: boolean;
  attachOpen: boolean;
  setMode(mode: ComposerMode, msgId?: string): void;
  sendDraft(text: string): void;
  mic(): void;
  onAttachOpenChange(open: boolean): void;
  attach(item: AttachItem): void;
  sendTray(text: string): void;
}

export function useComposerModes(tripId: TripId, stageId: StageId, messages: ChatMessage[]): ComposerModes {
  const params = useSearchParams();
  const me = useStore((s) => s.session.userId);
  const users = useStore((s) => s.trips.members);

  const rawMode = params.get("mode");
  const msgId = params.get("msg");
  const candidate = MODES.find((m) => m === rawMode) ?? null;
  const target = candidate ? (messages.find((m) => m.id === msgId && isMemberMessage(m, me)) ?? null) : null;
  const mode: ComposerMode = target ? candidate : null;

  // An unknown mode or a target that isn't a visible member message is dropped from the URL.
  const invalid = rawMode !== null && mode === null;
  useEffect(() => {
    if (!invalid) return;
    writeChatQuery((p) => {
      p.delete("mode");
      p.delete("msg");
    });
  }, [invalid]);

  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  // The tray draft restarts whenever the tray opens on a message (reply: the seed draft; ask Go: empty).
  const trayKey = mode === "reply" || mode === "askGo" ? `${mode}:${target?.id}` : null;
  const [tray, setTray] = useState(() => ({ key: trayKey, value: trayInitial(mode, target) }));
  if (tray.key !== trayKey) setTray({ key: trayKey, value: trayInitial(mode, target) });

  // Reply in `dates-talk`: advance after the Go ack; cleared on unmount.
  const advanceTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  function setMode(next: ComposerMode, id?: string) {
    writeChatQuery((p) => {
      if (next && id) {
        p.set("mode", next);
        p.set("msg", id);
      } else {
        p.delete("mode");
        p.delete("msg");
      }
    });
  }

  function sendDraft(text: string) {
    useStore.getState().send(tripId, text);
    setDraft("");
  }

  function mic() {
    if (recording) {
      setRecording(false);
      useStore.getState().send(tripId, chatCopy.composer.voiceNote);
      return;
    }
    setRecording(true);
    setAttachOpen(false);
  }

  function onAttachOpenChange(open: boolean) {
    setAttachOpen(open);
    if (open) setRecording(false); // opening the menu ends the recording without sending
  }

  function attach(item: AttachItem) {
    const sends = tripId === "bali" ? attachSends.bali : attachSends.goa;
    const index = chatCopy.attach.findIndex((row) => row.id === item);
    setAttachOpen(false);
    if (index >= 0) useStore.getState().send(tripId, sends[index]);
  }

  function sendTray(text: string) {
    if (!target || (mode !== "reply" && mode !== "askGo")) return;
    const store = useStore.getState();
    const author = users[target.author as UserId].firstName;
    const quote = { author, text: target.text ?? "" };
    const datesTalk = stageId === DATES_TALK;

    if (mode === "reply") {
      if (!text) return; // an empty reply does nothing
      store.send(tripId, text, { quote });
      setMode(null);
      // Bubble at t0, Go ack at +GO_REPLY_MS, then the dates poll (the stage reveal adds GO_TYPING_MS → ~+1800).
      if (datesTalk) {
        window.clearTimeout(advanceTimer.current);
        advanceTimer.current = window.setTimeout(() => useStore.getState().advance(tripId, "dates-asked"), GO_REPLY_MS);
      }
      return;
    }

    // Ask Go: DESIGN-ASSUMPTION (C-chat-kickoff.md §1.7 #10) the question is posted (mention + quote). In
    // `dates-talk` it advances (even with an empty draft) and skips the generic ack; elsewhere it gets the ack.
    if (text) store.send(tripId, text, { mention: true, quote, ack: !datesTalk });
    setMode(null);
    if (datesTalk) store.advance(tripId, "dates-asked"); // the stage reveal adds GO_TYPING_MS
  }

  return {
    mode,
    target,
    bottomPadding: PADDING[mode ?? "none"],
    draft,
    setDraft,
    trayDraft: tray.value,
    setTrayDraft: (value) => setTray({ key: trayKey, value }),
    recording,
    attachOpen,
    setMode,
    sendDraft,
    mic,
    onAttachOpenChange,
    attach,
    sendTray,
  };
}
