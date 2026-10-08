import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { AudioBars } from "@/components/icons/custom/AudioBars";
import { CALL_COPY } from "@/data/seed/calls";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { useElapsed } from "./useElapsed";

const copy = CALL_COPY.listen;

type CallHeroCardProps = Omit<React.ComponentProps<typeof Card>, "children"> & {
  who: string;
  emoji: string;
  /** Vendor tint class (`bg-amber-soft`, …) for the disc. */
  tint: string;
  /** Epoch ms; the same shared clock as the call card, so both read the same "mm:ss". */
  startedAt: number;
  /** Corner control (the sheet's mute toggle). */
  action?: React.ReactNode;
};

/** Navy hero of the Listen sheet: Go ↔ vendor with waving bars and the ticking elapsed time (§1.4). */
export function CallHeroCard({ who, emoji, tint, startedAt, action, className, ...props }: CallHeroCardProps) {
  const clock = useElapsed(startedAt);
  return (
    <Card
      variant="navy"
      radius="2xl"
      data-slot="call-hero-card"
      className={cn("relative flex flex-col items-center gap-3 px-4 py-[18px] [@media(max-height:720px)]:gap-1.5 [@media(max-height:720px)]:py-3", className)}
      {...props}
    >
      {action && <div className="absolute top-2.5 right-2.5">{action}</div>}
      <div className="flex items-center gap-[18px]">
        <Avatar size={52} kind="go" src={assets.goAvatar.src} />
        <AudioBars />
        <span aria-hidden className={cn("grid size-[52px] place-items-center rounded-full text-24", tint)}>
          {emoji}
        </span>
      </div>
      <span className="text-18 font-semibold">{CALL_COPY.card.title(who)}</span>
      <span className="text-13 tabular-nums opacity-75">{copy.heroSub(clock)}</span>
    </Card>
  );
}
