import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { SectionHeader } from "@/components/common/SectionHeader";
import { HomeHeader, homeBodyClass } from "@/components/home/HomeHeader";
import { Screen } from "@/components/shell/Screen";
import { Card } from "@/components/ui/card";
import { home as copy } from "@/data/seed/copy";
import { SKELETON_BAR, SKELETON_BAR_ON_CANVAS, SKELETON_FILL } from "@/lib/skeleton";
import { cn } from "@/lib/utils";

/** A trip card: the cover with its title and crew, then the name and status. */
function TripCardSkeleton() {
  return (
    <Card variant="shadow" radius="3xl" className="flex flex-col overflow-hidden">
      <span className={cn("relative block h-32", SKELETON_FILL)}>
        <span className="absolute bottom-3 left-3.5 flex flex-col gap-1.5">
          <span className="h-6 w-36 rounded-md bg-white/60" />
          <span className="h-3.5 w-48 rounded-md bg-white/60" />
        </span>
        <span className="absolute right-3 bottom-3 size-[26px] rounded-full bg-white/60" />
      </span>
      <span className="flex items-center gap-2.5 px-3.5 py-3">
        <span className="flex flex-1 flex-col gap-px">
          <span className="text-16 leading-[1.3] font-semibold tracking-body">
            <span className={SKELETON_BAR}>Trip name here</span>
          </span>
          <span className="text-13 tracking-caption">
            <span className={SKELETON_BAR}>1 thing pending on you</span>
          </span>
        </span>
      </span>
    </Card>
  );
}

/**
 * What Home draws while the session is read and `GET /home` is on its way (a refresh used to show an empty canvas): the
 * returning layout (title row, two trip cards, past trips) with static bars where the data goes. Same containers and
 * text styles as the real page, so nothing moves when it arrives.
 */
export function HomeSkeleton() {
  return (
    <Screen>
      <span role="status" className="sr-only">
        {copy.loading}
      </span>
      <div aria-hidden>
        <HomeHeader
          eyebrow={<span className={SKELETON_BAR_ON_CANVAS}>{copy.eyebrowBack}</span>}
          avatar={
            <span className="flex size-11 items-center justify-center rounded-full">
              <span className={cn("size-10 rounded-full", SKELETON_FILL)} />
            </span>
          }
        />
        <div className={homeBodyClass}>
          <SectionHeader title={copy.tripsTitle} meta={<span className={SKELETON_BAR_ON_CANVAS}>{copy.tripsMeta(2)}</span>} />
          <TripCardSkeleton />
          <TripCardSkeleton />
          <SectionHeader title={copy.pastTitle} className="mt-3.5" />
          <ListCard padding="tight">
            <ListRow
              dense
              leading={<span className="size-11 shrink-0 rounded-xl bg-line" />}
              title={<span className={SKELETON_BAR}>Past trip name</span>}
              sub={<span className={SKELETON_BAR}>Aug 2026 · 5 people</span>}
            />
          </ListCard>
        </div>
      </div>
    </Screen>
  );
}
