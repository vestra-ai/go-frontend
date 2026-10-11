import Link from "next/link";
import { DashedAvatar } from "@/components/common/DashedAvatar";
import { SuggestionsPlaceholder } from "@/components/home/SuggestionsPlaceholder";
import { ArrowLeft } from "@/components/icons/generated";
import { FadeDock } from "@/components/shell/FadeDock";
import { Screen } from "@/components/shell/Screen";
import { StickyDock } from "@/components/shell/StickyDock";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { crew as copy } from "@/data/seed/copy";
import { SKELETON_BAR, SKELETON_BAR_ON_CANVAS, SKELETON_FILL } from "@/lib/skeleton";
import { cn } from "@/lib/utils";

/**
 * What "Who's coming" draws while the session and the trip are read (a refresh; from Home the trip is already in the
 * store and the page opens populated): the page as it stands for a trip nobody has joined yet, with bars where the
 * trip's name and link go. Back works from the start. Same containers and text styles as the real page, so nothing
 * moves when it arrives.
 */
export function CrewSkeleton() {
  return (
    <Screen>
      <span role="status" className="sr-only">
        {copy.loading}
      </span>
      <div className="sticky top-0 z-30 shrink-0 bg-canvas pt-safe">
        <div className="flex h-11 items-center gap-3 pr-6 pl-[18px]">
          <Button asChild variant="ghost" size="icon" className="-ml-1.5">
            <Link href="/home" aria-label={copy.back}>
              <ArrowLeft className="size-[22px] text-ink" strokeWidth={2} />
            </Link>
          </Button>
          <div className="flex-1" />
          <span aria-hidden className="text-15">
            <span className={SKELETON_BAR_ON_CANVAS}>{copy.skip}</span>
          </span>
        </div>
      </div>

      <div aria-hidden className="px-4 pb-[200px]">
        <div className="mx-1 mt-2 text-34 leading-[1.12] font-semibold tracking-title">
          <span className={SKELETON_BAR_ON_CANVAS}>{copy.title("Goa")}</span>
        </div>
        <div className="mx-1 mt-1.5 text-16 leading-[1.35] tracking-body">
          <span className={SKELETON_BAR_ON_CANVAS}>{copy.subEmpty}</span>
        </div>

        <Card variant="shadow" radius="4xl" className="mt-[22px] flex flex-col items-center gap-3.5 px-5 pt-7 pb-[22px] text-center">
          <div className="flex pl-3.5 *:-ml-3.5">
            <span className={cn("size-[52px] shrink-0 rounded-full ring-[3px] ring-white", SKELETON_FILL)} />
            {[0, 1, 2].map((i) => (
              <DashedAvatar key={i} size={52} />
            ))}
          </div>
          <div className="text-20 leading-[1.3] font-semibold tracking-h3">
            <span className={SKELETON_BAR}>{copy.cardTitleEmpty}</span>
          </div>
          <div className="max-w-[290px] text-15 leading-[1.4]">
            <span className={SKELETON_BAR}>{copy.cardBodyEmpty("your trip")}</span>
          </div>
          <span className="mt-1 h-[52px] self-stretch rounded-full bg-surface-2" />
          <span className={cn("h-[52px] self-stretch rounded-full", SKELETON_FILL)} />
        </Card>

        <div className="mt-3.5">
          <SuggestionsPlaceholder />
        </div>
      </div>

      <StickyDock>
        <FadeDock variant="blur" aria-hidden className="gap-2.5 px-4 pt-[70px]">
          <span className={cn("h-14 w-full rounded-full", SKELETON_FILL)} />
          <p className="text-center text-13">
            <span className={SKELETON_BAR_ON_CANVAS}>{copy.helper}</span>
          </p>
        </FadeDock>
      </StickyDock>
    </Screen>
  );
}
