import { Pause, Play } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CALL_COPY, RECORDING_WAVEFORM } from "@/data/seed/calls";
import { cn } from "@/lib/utils";

const copy = CALL_COPY.recording;

type RecordingPlayerProps = Omit<React.ComponentProps<typeof Card>, "children"> & {
  playing: boolean;
  rate: number;
  elapsed: string;
  total: string;
  onToggle(): void;
  /** Cycles 1× → 1.5× → 2× → 1×. */
  onSpeed(): void;
};

/** Static recording player: play/pause, fixed waveform, elapsed / speed / total. No audio, no scrubbing (§1.7 #8). */
export function RecordingPlayer({ playing, rate, elapsed, total, onToggle, onSpeed, className, ...props }: RecordingPlayerProps) {
  return (
    <Card
      variant="outline"
      radius="2xl"
      data-slot="recording-player"
      className={cn("flex flex-col gap-3 px-4 py-3.5", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="icon-lg"
          className="size-[52px]"
          aria-label={playing ? copy.pause : copy.play}
          onClick={onToggle}
        >
          {playing ? <Pause className="size-5" strokeWidth={3} /> : <Play className="size-5" />}
        </Button>
        <div aria-hidden className="flex h-8 flex-1 items-center gap-[3px] overflow-hidden">
          {RECORDING_WAVEFORM.played.map((h, i) => (
            <span key={`p${i}`} className="w-[3px] shrink-0 rounded-full bg-go" style={{ height: h }} />
          ))}
          {RECORDING_WAVEFORM.unplayed.map((h, i) => (
            <span key={`u${i}`} className="w-[3px] shrink-0 rounded-full bg-wave-idle" style={{ height: h }} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-13 text-muted tabular-nums">
        <span>{elapsed}</span>
        <Button variant="soft" className="h-7 px-2.5 text-13 font-bold text-ink" onClick={onSpeed}>
          {copy.rate(rate)}
        </Button>
        <span>{total}</span>
      </div>
    </Card>
  );
}
