"use client";

import { useEffect } from "react";
import { LiveDot } from "@/components/common/LiveDot";
import { MicSendIcon } from "@/components/icons/custom/MicSendIcon";
import { X } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { chat as copy } from "@/data/seed/copy";
import { formatClock } from "@/lib/media";

type RecordingBarProps = {
  seconds: number;
  /** Throws the recording away. */
  onCancel(): void;
  /** Stops and sends the voice note. */
  onSend(): void;
};

/**
 * The composer while a voice note is being recorded: it takes the whole row, so nothing can be typed. Cancel on the
 * left (Escape too), live timer in the middle, send on the right.
 */
export function RecordingBar({ seconds, onCancel, onSend }: RecordingBarProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="flex flex-1 items-center gap-2.5 transition-[opacity,translate] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0">
      <Button type="button" variant="white" size="icon-lg" aria-label={copy.composer.cancelRecording} onClick={onCancel}>
        <X className="size-5" strokeWidth={2} />
      </Button>
      <div
        role="status"
        aria-label={copy.composer.recording}
        className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-white px-4 text-16 tracking-body"
      >
        <LiveDot size={10} pulse className="bg-danger" />
        <span className="font-semibold tabular-nums">{formatClock(seconds)}</span>
        <span className="truncate text-muted">{copy.composer.recordingHint}</span>
      </div>
      <Button type="button" variant="primary" size="icon-lg" aria-label={copy.composer.stopAndSend} onClick={onSend}>
        <MicSendIcon hasDraft />
      </Button>
    </div>
  );
}
