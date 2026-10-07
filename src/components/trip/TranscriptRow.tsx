import type { TranscriptLine } from "@/data/types";
import { cn } from "@/lib/utils";

type TranscriptRowProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Timestamp, "0:14". */
  t: string;
  speaker: TranscriptLine["speaker"];
  /** Speaker label: "Go" or the vendor's name. */
  name: string;
  text: string;
  /** The line being played: highlighted. */
  current?: boolean;
};

/** One timestamped line of the recording transcript (§1.4). */
export function TranscriptRow({ t, speaker, name, text, current, className, ...props }: TranscriptRowProps) {
  return (
    <div
      data-slot="transcript-row"
      className={cn("flex gap-2.5 py-2", current && "-mx-2.5 rounded-xl bg-go-note px-2.5", className)}
      {...props}
    >
      <span className="w-9 shrink-0 pt-0.5 text-12 font-semibold text-muted tabular-nums">{t}</span>
      <div className="flex flex-col gap-px">
        <span className={cn("text-12 font-bold", speaker === "go" ? "text-go" : "text-muted")}>{name}</span>
        <p className="text-15 leading-[1.4]">{text}</p>
      </div>
    </div>
  );
}
