"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { splitMentions } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { useMentionHandles } from "./RoomContext";

type MentionInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "ref" | "shape"> & {
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Both have the 16px side padding the copy of the text is placed by. */
  shape: "pill" | "pill-grey";
};

/** About half a second of frames. */
const FOLLOW_FRAMES = 30;

/**
 * A message input that draws "@Go" and the "@Name" of anyone in the trip in the Go accent, as the sent bubble will.
 *
 * An `<input>` cannot style part of its text. While the text names someone, the input's own text is transparent (its
 * caret, selection and placeholder stay) and a copy with the names coloured is drawn over it and scrolled with it. The
 * names are thickened with a stroke, not a heavier weight: wider letters would walk the copy away from the caret.
 */
export function MentionInput({ value, inputRef, className, ...props }: MentionInputProps) {
  const parts = splitMentions(value, useMentionHandles());
  const tagged = parts.some((part) => typeof part !== "string");
  const copy = useRef<HTMLSpanElement>(null);

  // A text longer than the input scrolls sideways inside it: the copy follows.
  useEffect(() => {
    const input = inputRef.current;
    if (!tagged || !input) return;
    // The input scrolls to its caret some frames after the value or the caret changed, and iOS says so with no event:
    // the copy is placed on each frame for a short while after anything that can move the text.
    let frame = 0;
    let left = 0;
    const place = () => {
      if (copy.current) copy.current.style.transform = `translateX(${-input.scrollLeft}px)`;
      frame = --left > 0 ? requestAnimationFrame(place) : 0;
    };
    const sync = () => {
      left = FOLLOW_FRAMES;
      if (!frame) place();
    };
    sync();
    const events = ["scroll", "focus", "blur"] as const;
    for (const event of events) input.addEventListener(event, sync, { passive: true });
    document.addEventListener("selectionchange", sync);
    return () => {
      cancelAnimationFrame(frame);
      for (const event of events) input.removeEventListener(event, sync);
      document.removeEventListener("selectionchange", sync);
    };
  }, [tagged, value, inputRef]);

  return (
    <span className="relative block">
      <Input
        ref={inputRef}
        value={value}
        // No fade on the text colour: it would show through the copy while it goes.
        className={cn("transition-[border-color,box-shadow]", tagged && "text-transparent caret-ink", className)}
        {...props}
      />
      {tagged && (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-4 left-4 flex items-center overflow-hidden text-16 tracking-body whitespace-pre text-ink">
          <span ref={copy} className="shrink-0">
            {parts.map((part, i) =>
              typeof part === "string" ? (
                part
              ) : (
                <span key={i} className="text-go [-webkit-text-stroke:0.4px_currentColor]">
                  {part.mention}
                </span>
              ),
            )}
          </span>
        </span>
      )}
    </span>
  );
}
