"use client";

import { useEffect, useRef, useState } from "react";
import { live } from "@/api/live";
import { chat as chatCopy } from "@/data/seed/copy";
import type { AttachItem, ComposerMode, TripId } from "@/data/types";
import { mentionedIds, type MentionHandle } from "@/lib/mentions";
import { toastGo } from "@/lib/toast";
import { sendMessage } from "@/state";
import type { RoomMessage } from "@/state/roomView";
import { useVoiceRecorder } from "./useVoiceRecorder";

// Composer state machine: default composer (draft, voice note, attach menu), the long-press overlay, and the reply /
// ask-Go trays. The mode and its message are component state (never in the URL). Sending is
// `POST …/messages` (CONTRACT-APP §4.6); files go to storage first (§4.5).

// Message list bottom padding per mode.
const PADDING = { none: 96, longpress: 96, reply: 150, askGo: 190 } as const;

/** §4.5: at most 25 MB per file. */
const MAX_FILE_MB = 25;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const AUDIO_TYPES = new Set(["audio/mp4", "audio/mpeg", "audio/webm", "audio/ogg"]);

/** A photo's pixel size, when the browser can decode it (HEIC often cannot: the upload takes null). */
async function photoSize(file: Blob): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

export interface ComposerModes {
  mode: ComposerMode;
  /** The message (a member's, mine or Go's) the overlay / tray is about (null when `mode` is null). */
  target: RoomMessage | null;
  bottomPadding: 96 | 150 | 190;
  draft: string;
  setDraft(value: string): void;
  /** Writes the draft for the person (a Board row's ask): the composer then takes the focus, caret after the words. */
  prefill(text: string): void;
  /** How many times `prefill` has run. */
  prefills: number;
  trayDraft: string;
  setTrayDraft(value: string): void;
  recording: boolean;
  /** Whole seconds into the current voice note. */
  recordingSeconds: number;
  /** Drops the recording without sending it. */
  cancelRecording(): void;
  attachOpen: boolean;
  setMode(mode: ComposerMode, msgId?: string): void;
  sendDraft(text: string): void;
  mic(): void;
  onAttachOpenChange(open: boolean): void;
  /** A photo or PDF picked from the + menu: sent as my message. */
  attachFile(item: AttachItem, file: File): Promise<void>;
  sendTray(text: string): void;
}

/** What the long-press actions apply to: a stored message of a person (mine included) or of Go, not deleted. */
const isActionable = (m: RoomMessage) => (m.author.kind === "person" || m.author.kind === "go") && !m.deleted && !m.sending;

/** `people`: everyone in the trip with their "@" handle, so a send can list who its text names (`mentions`, §4.6). */
export function useComposerModes(tripId: TripId, messages: RoomMessage[], people: MentionHandle[]): ComposerModes {
  const [active, setActive] = useState<{ mode: Exclude<ComposerMode, null>; id: string } | null>(null);

  // A target that is no longer an actionable message in the room (deleted, say) ends the mode.
  const target = active ? (messages.find((m) => m.id === active.id && isActionable(m)) ?? null) : null;
  const mode: ComposerMode = target && active ? active.mode : null;

  // One draft for both boxes: what was typed in the composer is there when the reply / ask-Go tray opens, a send from the
  // tray clears it, and cancelling the tray hands it back to the composer.
  const [draft, setDraftValue] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);

  // My typing line stops when I leave the room.
  useEffect(() => () => live.typing(tripId, false), [tripId]);

  function setDraft(value: string) {
    setDraftValue(value);
    // Fanned out to the others in the room (never to Go); the connection keeps it to one `on` per 2 s.
    live.typing(tripId, value.trim().length > 0);
  }

  const [prefills, setPrefills] = useState(0);
  function prefill(text: string) {
    setDraft(text);
    setPrefills((n) => n + 1);
  }

  function setMode(next: ComposerMode, id?: string) {
    setActive(next && id ? { mode: next, id } : null);
  }

  function sendDraft(text: string) {
    sendMessage(tripId, { text, mentions: mentionedIds(text, people) });
    setDraftValue("");
    live.typing(tripId, false);
  }

  const recorder = useVoiceRecorder(() => void sendRecording());

  // Stops the recording and sends it as a voice note (also when the length limit is hit).
  async function sendRecording() {
    const clip = await recorder.stop();
    if (!clip) return;
    const mime = clip.blob.type.split(";")[0] || "audio/webm";
    if (!AUDIO_TYPES.has(mime)) {
      toastGo(chatCopy.composer.voiceType);
      return;
    }
    const extension = mime.split("/")[1] === "mpeg" ? "mp3" : mime.split("/")[1] === "mp4" ? "m4a" : mime.split("/")[1];
    sendMessage(tripId, {
      file: {
        blob: clip.blob,
        attachment: {
          kind: "audio",
          name: `voice-note.${extension}`,
          mime,
          sizeBytes: clip.blob.size,
          previewUrl: URL.createObjectURL(clip.blob),
          durationS: clip.seconds,
        },
      },
    });
  }

  const starting = useRef(false);
  async function mic() {
    if (recorder.recording) return sendRecording();
    if (starting.current) return; // the permission prompt is still open
    starting.current = true;
    setAttachOpen(false);
    const result = await recorder.start().finally(() => {
      starting.current = false;
    });
    if (result === "denied") toastGo(chatCopy.composer.micDenied);
    else if (result === "unsupported") toastGo(chatCopy.composer.micUnavailable);
  }

  function onAttachOpenChange(open: boolean) {
    setAttachOpen(open);
    if (open) recorder.cancel(); // opening the menu ends the recording without sending
  }

  async function attachFile(item: AttachItem, file: File) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toastGo(chatCopy.composer.fileTooBig(MAX_FILE_MB));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    if (item === "photo") {
      if (!PHOTO_TYPES.has(file.type)) {
        toastGo(chatCopy.composer.photoFailed);
        return;
      }
      const size = await photoSize(file);
      sendMessage(tripId, {
        file: {
          blob: file,
          attachment: { kind: "photo", name: file.name || "photo.jpg", mime: file.type, sizeBytes: file.size, previewUrl, ...(size ?? {}) },
        },
      });
      return;
    }
    // "Ticket or PDF": a file is a PDF or an image (§4.5).
    if (file.type !== "application/pdf" && !PHOTO_TYPES.has(file.type)) {
      toastGo(chatCopy.composer.fileType);
      return;
    }
    sendMessage(tripId, {
      file: { blob: file, attachment: { kind: "file", name: file.name, mime: file.type, sizeBytes: file.size, previewUrl } },
    });
  }

  function sendTray(text: string) {
    if (!target || (mode !== "reply" && mode !== "askGo")) return;
    if (!text) return; // a message needs words (or a file)
    // Reply: `reply_to`. Ask Go about this: `about_message_id`, which makes it a message to Go even without naming it.
    const mentions = mentionedIds(text, people);
    if (mode === "reply") sendMessage(tripId, { text, replyTo: target.id, mentions });
    else sendMessage(tripId, { text, aboutMessageId: target.id, mentions });
    setDraftValue("");
    live.typing(tripId, false);
    setMode(null);
  }

  return {
    mode,
    target,
    bottomPadding: PADDING[mode ?? "none"],
    draft,
    setDraft,
    prefill,
    prefills,
    // The tray's text is the composer's: it does not announce typing (the tray may be a message to Go).
    trayDraft: draft,
    setTrayDraft: setDraftValue,
    recording: recorder.recording,
    recordingSeconds: recorder.seconds,
    cancelRecording: recorder.cancel,
    attachOpen,
    setMode,
    sendDraft,
    mic,
    onAttachOpenChange,
    attachFile,
    sendTray,
  };
}
