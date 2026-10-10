"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A recording shorter than this is a mis-tap and is dropped instead of sent. */
const MIN_SECONDS = 1;
/** A voice note stops (and is sent by the caller) after this long. */
export const MAX_SECONDS = 120;

export type VoiceClip = { blob: Blob; seconds: number };
export type StartResult = "started" | "denied" | "unsupported";

export interface VoiceRecorder {
  recording: boolean;
  /** Whole seconds since the recording started. */
  seconds: number;
  start(): Promise<StartResult>;
  /** Stops and resolves the clip (null when it was too short or nothing was recorded). */
  stop(): Promise<VoiceClip | null>;
  /** Stops and throws the audio away. */
  cancel(): void;
}

/** Microphone recording with `MediaRecorder`. Releases the mic on stop, cancel and unmount. */
export function useVoiceRecorder(onLimit?: () => void): VoiceRecorder {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const tick = useRef<number | undefined>(undefined);
  const onLimitRef = useRef(onLimit);
  useEffect(() => {
    onLimitRef.current = onLimit;
  });

  const release = useCallback(() => {
    window.clearInterval(tick.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    recorder.current = null;
    setRecording(false);
    setSeconds(0);
  }, []);

  const start = useCallback(async (): Promise<StartResult> => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) return "unsupported";
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return "denied";
    }
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(media);
    } catch {
      media.getTracks().forEach((t) => t.stop());
      return "unsupported";
    }
    chunks.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    stream.current = media;
    recorder.current = rec;
    startedAt.current = Date.now();
    try {
      rec.start();
    } catch {
      release();
      return "unsupported";
    }
    setRecording(true);
    setSeconds(0);
    tick.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS) onLimitRef.current?.();
    }, 250);
    return "started";
  }, [release]);

  const stop = useCallback((): Promise<VoiceClip | null> => {
    const rec = recorder.current;
    if (!rec) return Promise.resolve(null);
    const elapsed = (Date.now() - startedAt.current) / 1000;
    return new Promise((resolve) => {
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        chunks.current = [];
        release();
        resolve(elapsed >= MIN_SECONDS && blob.size > 0 ? { blob, seconds: Math.round(elapsed) } : null);
      };
      if (rec.state !== "inactive") rec.stop();
      else rec.onstop?.(new Event("stop"));
    });
  }, [release]);

  const cancel = useCallback(() => {
    const rec = recorder.current;
    if (rec) {
      rec.ondataavailable = null;
      rec.onstop = null;
      if (rec.state !== "inactive") rec.stop();
    }
    chunks.current = [];
    release();
  }, [release]);

  useEffect(() => cancel, [cancel]);

  return { recording, seconds, start, stop, cancel };
}
