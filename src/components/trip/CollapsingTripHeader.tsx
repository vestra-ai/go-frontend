import Link from "next/link";
import { ArrowLeft, Share } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import type { TripId } from "@/data/types";
import { TripTabs, type TripTab } from "./TripTabs";

type CollapsingTripHeaderProps = {
  /** 0..1, stepped by useCollapsingHeader. */
  hp: number;
  tripId: TripId;
  active: TripTab;
  title: string;
  sub: string;
  onShare: () => void;
};

export function CollapsingTripHeader({ hp, tripId, active, title, sub, onShare }: CollapsingTripHeaderProps) {
  const interactive = hp > 0.6;
  return (
    <div
      inert={!interactive}
      style={{ opacity: hp, transform: `translateY(${(1 - hp) * -14}px)` }}
      className={`absolute inset-x-0 top-0 z-[4] flex flex-col gap-2 bg-white px-3 pb-2.5 pt-safe-hero shadow-header-2 transition-[opacity,transform] duration-[140ms] ease-out will-change-[opacity,transform] ${interactive ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="icon-sm" className="text-ink">
          <Link href="/home" aria-label="Back">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-17 font-bold tracking-h4 leading-[1.2]">{title}</p>
          <p className="truncate text-13 text-muted tracking-caption leading-[1.35]">{sub}</p>
        </div>
        <Button variant="ghost" size="icon-sm" className="text-ink" aria-label="Share trip" onClick={onShare}>
          <Share className="size-[18px]" />
        </Button>
      </div>
      <TripTabs tripId={tripId} active={active} variant="compact" />
    </div>
  );
}
