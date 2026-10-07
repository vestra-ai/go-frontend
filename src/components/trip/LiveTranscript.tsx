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

/** Listen-in sheet transcript card: eyebrow, bubbles, pulsing "{who} is speaking" footer (§1.4). */
export function LiveTranscript({ lines, who, className, ...props }: LiveTranscriptProps) {
  return (
    <Card
      variant="outline"
      radius="2xl"
      data-slot="live-transcript"
      className={cn("flex flex-col gap-2.5 p-3.5", className)}
      {...props}
    >
      <Eyebrow tone="muted">{copy.transcript}</Eyebrow>
      {lines.map((line, i) => (
        <TranscriptBubble key={i} speaker={line.speaker} name={line.speaker === "go" ? copy.goName : who} text={line.text} />
      ))}
      <p className="flex items-center gap-1.5 text-13 text-muted">
        <LiveDot size={8} pulse />
        {copy.speaking(who)}
      </p>
    </Card>
  );
}
