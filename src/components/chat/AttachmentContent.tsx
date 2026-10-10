"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@/components/icons/generated";
import { chat } from "@/data/seed/copy";
import type { Attachment } from "@/data/types";
import { formatBytes, formatClock } from "@/lib/media";
import { cn } from "@/lib/utils";

const copy = chat.attachment;

/** Padding for a bubble whose body is a photo: the image sits 4px inside the rounded corners. */
export const photoBubbleClass = "p-1";

/** Body of one of my bubbles that carries a photo, a PDF or a voice note (the bubble itself comes from `Bubble`). */
export function AttachmentContent({ attachment, onOpen }: { attachment: Attachment; onOpen?: () => void }) {
  switch (attachment.kind) {
    case "image":
      return (
        <button
          type="button"
          aria-label={copy.openPhoto}
          onClick={onOpen}
          className="block cursor-pointer rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-ink/25 active:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing for next/image to optimise */}
          <img
            src={attachment.src}
            alt={copy.photo}
            width={attachment.width}
            height={attachment.height}
            style={{ aspectRatio: `${attachment.width} / ${attachment.height}` }}
            className="block max-h-72 w-60 max-w-full rounded-[22px] object-cover"
          />
        </button>
      );
    case "file":
      return <FileRow name={attachment.name} size={attachment.size} onOpen={onOpen} />;
    case "voice":
      return <VoiceNote seconds={attachment.seconds} src={attachment.src} />;
  }
}

function FileRow({ name, size, onOpen }: { name: string; size: number; onOpen?: () => void }) {
  return (
    <button
      type="button"
      aria-label={copy.openFile(name)}
      onClick={onOpen}
      className="flex w-56 max-w-full cursor-pointer items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ink/25 active:opacity-80"
    >
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/70 text-20 leading-none">
        📄
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-15 font-semibold">{name}</span>
        <span className="text-13 text-muted">{copy.fileSub(formatBytes(size))}</span>
      </span>
    </button>
  );
}

function VoiceNote({ seconds, src }: { seconds: number; src?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  useEffect(() => {
    const el = audio.current;
    return () => el?.pause();
  }, []);

  function toggle() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setPlaying(false));
    else el.pause();
  }

  return (
    <div className="flex w-52 max-w-full items-center gap-3">
      <button
        type="button"
        disabled={!src}
        aria-label={playing ? copy.pause : copy.play}
        onClick={toggle}
        className={cn(
          "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-ink text-white outline-none focus-visible:ring-2 focus-visible:ring-ink/25",
          !src && "cursor-default opacity-40",
        )}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <span aria-hidden className="h-1 flex-1 overflow-hidden rounded-full bg-ink/15">
        <span className="block h-full rounded-full bg-ink" style={{ width: `${progress * 100}%` }} />
      </span>
      <span className="text-13 tabular-nums text-muted">{formatClock(seconds)}</span>
      {src && (
        <audio
          ref={audio}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
          }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            // MediaRecorder blobs often report an infinite duration, so progress runs against the recorded length.
            setProgress(Math.min(el.currentTime / Math.max(seconds, 1), 1));
          }}
        />
      )}
    </div>
  );
}
