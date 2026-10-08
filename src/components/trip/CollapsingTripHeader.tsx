import Link from "next/link";
import { ArrowLeft, Share } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import type { TripId } from "@/data/types";
import { TripTabs, type TripTab } from "./TripTabs";

type CollapsingTripHeaderProps = {
  /** The hero has scrolled away (useCollapsingHeader). */
  collapsed: boolean;
  /** Slide between the two states; false for the state the page opened in. */
  animate: boolean;
  tripId: TripId;
  active: TripTab;
  title: string;
  sub: string;
  onShare: () => void;
};

/**
 * Compact header that slides in, opaque, once the hero has scrolled off the top. `sticky top-0` on a zero-height rail
 * at the start of the page: the header floats over the content without taking any space in the flow. Hidden it sits
 * fully above the screen (its shadow included) and is `invisible`, so it takes no focus and shows nothing.
 */
export function CollapsingTripHeader({ collapsed, animate, tripId, active, title, sub, onShare }: CollapsingTripHeaderProps) {
  return (
    <div className="sticky top-0 z-30 h-0 w-full shrink-0">
      <div
        inert={!collapsed}
        className={`absolute inset-x-0 top-0 flex flex-col gap-2 bg-white px-3 pb-2.5 pt-safe-hero shadow-header-2 ease-out ${animate ? "transition-[transform,visibility] duration-[220ms]" : ""} ${collapsed ? "translate-y-0" : "invisible -translate-y-[calc(100%+24px)]"}`}
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
    </div>
  );
}
