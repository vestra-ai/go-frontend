import Link from "next/link";
import { AvatarStack } from "@/components/common/AvatarStack";
import { Eyebrow } from "@/components/common/Eyebrow";
import { ProgressiveBlur } from "@/components/common/ProgressiveBlur";
import { ReactionChip } from "@/components/common/ReactionChip";
import { WaxSeal } from "@/components/icons/custom/WaxSeal";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PlanDay, UserId } from "@/data/types";
import { assets } from "@/lib/assets";
import { InChatCard } from "../InChatCard";
import { DayStrip } from "./DayStrip";

type PlanCardProps = {
  eyebrow: string;
  place: { emoji: string; label: string };
  dates: { emoji: string; label: string };
  countdown: { emoji: string; label: string };
  hero: { src: string; alt: string };
  seal: { ring: string; month: string; days: string };
  memberIds: UserId[];
  days: PlanDay[];
  footer: { label: string; cta: string; href: string };
  reaction?: { emoji: string; count: number };
};

/** F8 "Go's final plan": hero with wax seal, day strip, "Made by Go" footer (F-travel.md §1.4). */
export function PlanCard({ eyebrow, place, dates, countdown, hero, seal, memberIds, days, footer, reaction }: PlanCardProps) {
  return (
    <div className="relative">
      <InChatCard right={22}>
        {/* #C9D6E2 has no token (placeholder behind the hero photo). */}
        <div className="relative h-[176px] bg-[#C9D6E2]">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo */}
          <img src={hero.src} alt={hero.alt} className="size-full object-cover" />
          <ProgressiveBlur layers="hero" />
          <div className="absolute inset-0 bg-linear-to-b from-ink/0 from-45% via-ink/20 via-65% to-ink/55" />
          <WaxSeal {...seal} className="absolute top-1 right-1 size-[92px] -rotate-12 overflow-visible" />
          <div className="absolute inset-x-4 bottom-3.5 flex flex-col gap-0.5 text-white">
            <Eyebrow tone="white" className="opacity-90">
              {eyebrow}
            </Eyebrow>
            <div className="flex items-center gap-1 text-34 leading-[1.05] font-bold tracking-title">
              <span aria-hidden className="w-6 text-24">
                {place.emoji}
              </span>
              {place.label}
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                {[dates, countdown].map((line) => (
                  <span key={line.label} className="flex gap-1.5 text-14 leading-[1.35] font-medium tracking-sm whitespace-nowrap">
                    <span aria-hidden className="w-[18px] text-14">
                      {line.emoji}
                    </span>
                    {line.label}
                  </span>
                ))}
              </div>
              <AvatarStack
                size={22}
                overlap={8}
                ring="white-thin"
                className="pl-[7px]"
                avatars={memberIds.map((id) => ({ name: assets.avatars[id].alt, src: assets.avatars[id].src }))}
              />
            </div>
          </div>
        </div>
        <DayStrip days={days} />
        <div className="flex items-center gap-2 pt-3 pr-3 pb-3.5 pl-3.5">
          <Avatar kind="go" size={22} src={assets.goAvatar.src} name="Go" />
          <span className="flex-1 text-13 font-medium text-muted">{footer.label}</span>
          <Button asChild variant="tint" size="sm">
            <Link href={footer.href}>{footer.cta}</Link>
          </Button>
        </div>
      </InChatCard>
      {reaction && (
        <ReactionChip
          floating
          emoji={reaction.emoji}
          count={reaction.count}
          className="-bottom-3.5 left-[52px] h-[26px] px-[9px] text-13 shadow-chip"
        />
      )}
    </div>
  );
}
