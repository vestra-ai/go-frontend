import Link from "next/link";
import { GlassIconButton } from "@/components/common/GlassIconButton";
import { ArrowLeft } from "@/components/icons/generated";
import { FadeDock } from "@/components/shell/FadeDock";
import { Screen } from "@/components/shell/Screen";
import { StickyDock } from "@/components/shell/StickyDock";
import { tripHome as copy } from "@/data/seed/copy";
import type { TripId } from "@/data/types";
import { SKELETON_BAR_ON_PHOTO, SKELETON_FILL } from "@/lib/skeleton";
import { cn } from "@/lib/utils";
import { TripBodySkeleton } from "./TripBodySkeletons";
import { tripBodyClass } from "./TripShell";
import { TripTabs, type TripTab } from "./TripTabs";

/** The hero at its real height, with bars where the title, the two meta lines and the crew go. Back works from the start. */
function HeroSkeleton() {
  return (
    <div className={cn("relative h-[236px] shrink-0 overflow-hidden", SKELETON_FILL)}>
      <GlassIconButton asChild label="Back" icon={<ArrowLeft className="size-5" />} className="absolute left-3.5 top-safe-hero">
        <Link href="/home" />
      </GlassIconButton>
      <span aria-hidden className="absolute right-3.5 top-safe-hero size-10 rounded-full bg-white/60" />
      <div aria-hidden className="absolute inset-x-5 bottom-[42px] flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex text-40 font-bold tracking-display">
            <span className={SKELETON_BAR_ON_PHOTO}>Trip name</span>
          </span>
          <div className="mt-1 flex flex-col gap-0.5">
            <span className="flex text-15 font-medium leading-[1.35] whitespace-nowrap">
              <span className={SKELETON_BAR_ON_PHOTO}>Fri 6 Nov – Sun 8 Nov</span>
            </span>
            <span className="flex text-15 font-medium leading-[1.35] whitespace-nowrap">
              <span className={SKELETON_BAR_ON_PHOTO}>In 26 days</span>
            </span>
          </div>
        </div>
        <span className="mb-0.5 h-7 w-[72px] shrink-0 rounded-full bg-white/60" />
      </div>
    </div>
  );
}

/**
 * What a trip tab draws while the session is read and `GET /trips/:id` is on its way (a refresh used to show an empty
 * canvas): the hero, the real tab bar (the tab and the trip are in the URL), the tab's own layout under it
 * (`TripBodySkeleton`), and the Chat button's place. Same containers as `TripShell`, so the real page lands where this one stands.
 */
export function TripSkeleton({ tripId, active }: { tripId: TripId; active: TripTab }) {
  return (
    <Screen>
      <span role="status" className="sr-only">
        {copy.loading}
      </span>
      <HeroSkeleton />
      <TripTabs tripId={tripId} active={active} variant="hero" className="relative z-[2] mx-4 -mt-[26px]" />
      <div className={cn(tripBodyClass, "pt-4")}>
        <TripBodySkeleton active={active} />
      </div>
      <StickyDock>
        <FadeDock variant="fade" aria-hidden className="h-[120px]" />
        <span aria-hidden className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] left-1/2 z-[3] h-[58px] w-44 -translate-x-1/2 rounded-full bg-line-2" />
      </StickyDock>
    </Screen>
  );
}
