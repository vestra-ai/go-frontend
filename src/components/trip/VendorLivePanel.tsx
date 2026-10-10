import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AudioBars } from "@/components/icons/custom/AudioBars";
import { CALL_COPY } from "@/data/seed/calls";
import { assets } from "@/lib/assets";
import { splitEmoji } from "@/lib/emoji";

const copy = CALL_COPY.panel;
const listen = splitEmoji(CALL_COPY.card.listen); // "🎧 Listen in"

type VendorLivePanelProps = {
  who: string;
  asking: string;
  /** "🎧 Listen in" opens the Listen sheet for this vendor. */
  onListen(): void;
  /** "End call" → `endCall(vendor)`. */
  onEnd(): void;
};

/** Green "Go is on a call with …" panel inside an opened Stay/Flights done row (§1.2 E.1.1). */
export function VendorLivePanel({ who, asking, onListen, onEnd }: VendorLivePanelProps) {
  return (
    <div
      data-slot="vendor-live-panel"
      className="flex flex-col gap-2.5 rounded-4xl bg-success-soft px-3.5 py-3 transition-[opacity,translate] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0"
    >
      <div className="flex items-center gap-2.5">
        <span className="relative size-9 shrink-0">
          <span aria-hidden className="absolute inset-0 animate-live rounded-full" />
          <Avatar size={36} kind="go" src={assets.goAvatar.src} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="flex items-center gap-1.5 text-15 font-semibold text-success-ink">
            {copy.onCall(who)}
            <Badge variant="white" size="xs" className="border-0 text-success-ink">
              {copy.live}
            </Badge>
          </span>
          <span className="text-13 text-success-ink">{copy.asking(asking)}</span>
        </div>
      </div>
      {/* Wraps on the narrowest phones (the open row is indented): the buttons then drop under the bars. */}
      <div className="flex flex-wrap items-center gap-2">
        <AudioBars className="h-[26px] shrink-0" />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="success-ink" size="38" weight="semibold" className="gap-1" onClick={onListen}>
            <span aria-hidden>{listen.emoji}</span>
            {listen.label}
          </Button>
          <Button variant="white" size="38" className="text-danger shadow-none" onClick={onEnd}>
            {CALL_COPY.card.end}
          </Button>
        </div>
      </div>
    </div>
  );
}
