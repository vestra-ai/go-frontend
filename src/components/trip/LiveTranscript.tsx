import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/common/Eyebrow";
import { LiveDot } from "@/components/common/LiveDot";
import { CALL_COPY } from "@/data/seed/calls";
import type { TranscriptLine } from "@/data/types";
import { cn } from "@/lib/utils";
import { TranscriptBubble } from "./TranscriptBubble";

const copy = CALL_COPY.listen;

type LiveTranscriptProps = Omit<React.ComponentProps<typeof Card>, "children"> & {
  lines: TranscriptLine[];
  /** Vendor name: speaker label of vendor lines and the "{who} is speaking" footer. */
  who: string;
};

/**
 * Listen-in sheet transcript card: eyebrow, bubbles, pulsing "{who} is speaking" footer (§1.4).
 * The bubbles are the sheet's only scroll region; it follows new lines unless the viewer scrolled up to read.
 */
export function LiveTranscript({ lines, who, className, ...props }: LiveTranscriptProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const following = useRef(true);

  useEffect(() => {
    const el = scroller.current;
    if (el && following.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  // Opening (or resizing under the details accordion) lands on the latest line.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return (
    <Card
      variant="outline"
      radius="2xl"
      data-slot="live-transcript"
      className={cn("flex min-h-0 flex-col gap-2.5 p-3.5", className)}
      {...props}
    >
      <Eyebrow tone="muted">{copy.transcript}</Eyebrow>
      <div
        ref={scroller}
        role="log"
        aria-label={copy.transcript}
        onScroll={(e) => {
          const el = e.currentTarget;
          following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain scrollbar-none"
      >
        {lines.map((line, i) => (
          <TranscriptBubble key={i} speaker={line.speaker} name={line.speaker === "go" ? copy.goName : who} text={line.text} />
        ))}
      </div>
      <p className="flex shrink-0 items-center gap-1.5 text-13 text-muted">
        <LiveDot size={8} pulse />
        {copy.speaking(who)}
      </p>
    </Card>
  );
}
