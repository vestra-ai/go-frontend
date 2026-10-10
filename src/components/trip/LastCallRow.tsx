import { Play } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { CheckBadge } from "@/components/common/CheckBadge";
import { CALL_COPY } from "@/data/seed/calls";
import { cn } from "@/lib/utils";

type LastCallRowProps = {
  /** The business Go called. */
  who: string;
  /** What came of it (the ended call card's `outcome`). */
  outcome: string;
  /** "Recording" opens the Recording sheet. Absent when the call has no recording, or calls are switched off. */
  onRecording?: () => void;
  className?: string;
};

/** "Last call · Villa Sol · late check-in confirmed for 11 pm" + Recording pill, as a soft card inside the open row. */
export function LastCallRow({ who, outcome, onRecording, className }: LastCallRowProps) {
  const text = outcome.charAt(0).toLowerCase() + outcome.slice(1);
  return (
    <div data-slot="last-call-row" className={cn("flex items-center gap-2.5 rounded-2xl bg-canvas p-3", className)}>
      <CheckBadge size={22} />
      <p className="flex-1 text-14 leading-[1.35]">
        <strong className="font-semibold">{CALL_COPY.lastCall.prefix(who)}</strong> · {text}
      </p>
      {onRecording && (
        <Button variant="tint" size="xs" className="gap-[5px]" onClick={onRecording}>
          <Play className="size-[11px]" />
          {CALL_COPY.lastCall.recording}
        </Button>
      )}
    </div>
  );
}
