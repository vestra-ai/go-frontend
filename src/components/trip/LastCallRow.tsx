import { Play } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { CheckBadge } from "@/components/common/CheckBadge";
import { CALL_COPY, VENDOR_CALLS, recordingFor } from "@/data/seed/calls";
import type { LastCall } from "@/data/types";
import { cn } from "@/lib/utils";

type LastCallRowProps = {
  lastCall: LastCall;
  /** "Recording" → `?sheet=recording&call={lastCall.vendor}`. */
  onRecording(): void;
  className?: string;
};

/** "Last call · Villa Sol · late check-in confirmed for 11 pm" + Recording pill, below the pending card on trip home (§1.2 D.4). */
export function LastCallRow({ lastCall, onRecording, className }: LastCallRowProps) {
  const who = VENDOR_CALLS[lastCall.vendor].who;
  const headline = recordingFor(lastCall.vendor, lastCall.asking).outcome.headline;
  const outcome = headline.charAt(0).toLowerCase() + headline.slice(1);

  return (
    <div data-slot="last-call-row" className={cn("flex items-center gap-2.5 border-t border-line pt-2.5", className)}>
      <CheckBadge size={22} />
      <p className="flex-1 text-14 leading-[1.35]">
        <strong className="font-semibold">{CALL_COPY.lastCall.prefix(who)}</strong> · {outcome}
      </p>
      <Button variant="tint" size="xs" className="gap-[5px]" onClick={onRecording}>
        <Play className="size-[11px]" />
        {CALL_COPY.lastCall.recording}
      </Button>
    </div>
  );
}
