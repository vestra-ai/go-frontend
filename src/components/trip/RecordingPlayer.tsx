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
  /** 0–1 of the recording played: how many waveform bars are filled. */
  progress: number;
  onToggle(): void;
  /** Cycles 1× → 1.5× → 2× → 1×. */
  onSpeed(): void;
};

/** Recording player: play/pause, the waveform filling as it plays, elapsed / speed / total. The audio element is the caller's. */
const BARS = [...RECORDING_WAVEFORM.played, ...RECORDING_WAVEFORM.unplayed];

export function RecordingPlayer({ playing, rate, elapsed, total, progress, onToggle, onSpeed, className, ...props }: RecordingPlayerProps) {
  const played = Math.round(Math.min(Math.max(progress, 0), 1) * BARS.length);
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
          {BARS.map((h, i) => (
            <span key={i} className={cn("w-[3px] shrink-0 rounded-full", i < played ? "bg-go" : "bg-wave-idle")} style={{ height: h }} />
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
