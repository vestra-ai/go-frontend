import type { TranscriptLine } from "@/data/types";
import { cn } from "@/lib/utils";

type TranscriptBubbleProps = Omit<React.ComponentProps<"div">, "children"> & {
  speaker: TranscriptLine["speaker"];
  /** Speaker label: "Go" or the vendor's name. */
  name: string;
  text: string;
};

/** One live-transcript line: speaker label over a bubble (Go right on go-soft, vendor left on surface-2). */
export function TranscriptBubble({ speaker, name, text, className, ...props }: TranscriptBubbleProps) {
  const go = speaker === "go";
  return (
    <div
      data-slot="transcript-bubble"
      className={cn("flex flex-col gap-0.5", go ? "items-end" : "items-start", className)}
      {...props}
    >
      <span className="text-12 font-bold text-muted">{name}</span>
      <p
        className={cn(
          "max-w-[82%] rounded-3xl px-3 py-2 text-15 leading-[1.4]",
          go ? "bg-go-soft" : "bg-surface-2",
        )}
      >
        {text}
      </p>
    </div>
  );
}
