"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/common/Eyebrow";
import { AudioBars } from "@/components/icons/custom/AudioBars";
import { CALL_COPY } from "@/data/seed/calls";
import { assets } from "@/lib/assets";
import { splitEmoji } from "@/lib/emoji";
import { cn } from "@/lib/utils";
import type { LiveCall } from "@/store/selectors";
import { useElapsed } from "./useElapsed";

const copy = CALL_COPY.card;
const listen = splitEmoji(copy.listen); // "🎧 Listen in"

type LiveCallCardProps = Omit<React.ComponentProps<typeof Card>, "children"> & {
  call: LiveCall;
  /** `full`: the only call, full width. `slide`: a 330px carousel slide. */
  layout: "full" | "slide";
  /** "🎧 Listen in" → `?sheet=listen&call={id}`. */
  onListen(): void;
  /** "End call" → `endCall(id)` (no outcome). */
  onEnd(): void;
};

/** Go's live vendor call: ticking LIVE timer, what Go is asking, waving bars, Listen in / End call (§1.2 C.4). */
export function LiveCallCard({ call, layout, onListen, onEnd, className, ...props }: LiveCallCardProps) {
  const clock = useElapsed(call.startedAt);

  return (
    <Card
      radius="2xl"
      data-slot="live-call-card"
      className={cn(
        "flex flex-col gap-3 p-4",
        layout === "full" ? "w-full" : "w-[330px] shrink-0 snap-start",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative size-10 shrink-0">
          <span aria-hidden className="absolute inset-0 animate-live rounded-full" />
          <Avatar size={40} kind="go" src={assets.goAvatar.src} />
          <span
            aria-hidden
            className={cn(
              "absolute -right-1 -bottom-1 grid size-[22px] place-items-center rounded-full border-2 border-white text-11 leading-none",
              call.bg,
            )}
          >
            {call.emoji}
          </span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          {/* gap 6px as in the design (P-Home.dc.html); the spec's gap-2 reads 8px */}
          <span className="flex items-center gap-1.5 text-16 leading-[1.3] font-semibold tracking-body">
            {copy.title(call.who)}
            <Badge variant="success-soft" size="sm" className="tabular-nums">
              {copy.live(clock)}
            </Badge>
          </span>
          <span className="text-13 tracking-caption text-muted">{call.phone}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 px-3 py-2.5">
        <Eyebrow tone="muted">{copy.askingFor}</Eyebrow>
        <span className="text-15 font-semibold">{call.asking}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <AudioBars className="shrink-0" />
        <p className="flex-1 text-14 leading-[1.35] text-muted italic">{call.line}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="46" weight="semibold" className="flex-1 gap-1" onClick={onListen}>
          <span aria-hidden>{listen.emoji}</span>
          {listen.label}
        </Button>
        <Button variant="danger-soft" size="46" onClick={onEnd}>
          {copy.end}
        </Button>
      </div>
    </Card>
  );
}
