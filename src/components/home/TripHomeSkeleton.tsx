import { ArrowLeft, Share } from "@/components/icons/generated";
import { AvatarStack } from "@/components/common/AvatarStack";
import { GlassIconButton } from "@/components/common/GlassIconButton";
import { TripTabs } from "@/components/trip/TripTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { invite as copy, tripShell } from "@/data/seed/copy";
import type { TripId, User } from "@/data/types";

type TripHomeSkeletonProps = {
  tripId: TripId;
  city: string;
  dateShort: string;
  joinedCount: number;
  members: User[];
  /** Trip photo; without it the `bg-sunset` fallback shows. */
  hero?: { src: string; alt: string };
};

/** Inert trip-home backdrop shown under the invite sheet's scrim. */
export function TripHomeSkeleton({ tripId, city, dateShort, joinedCount, members, hero }: TripHomeSkeletonProps) {
  return (
    <div inert aria-hidden className="flex flex-col">
      <div className="relative h-[250px] shrink-0 overflow-hidden bg-sunset">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, full-bleed cover
          <img src={hero.src} alt={hero.alt} className="absolute inset-0 size-full object-cover" />
        )}
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_27_63/0.22)_0%,rgb(11_27_63/0)_26%,rgb(11_27_63/0.08)_42%,rgb(11_27_63/0.4)_62%,rgb(11_27_63/0.72)_100%)]" />
        <GlassIconButton label={tripShell.back} icon={<ArrowLeft className="size-[22px]" />} className="absolute top-safe-hero left-3.5" />
        <GlassIconButton label={tripShell.share} icon={<Share className="size-5" />} className="absolute top-safe-hero right-3.5" />
        <div className="absolute inset-x-5 bottom-11 flex items-end justify-between gap-3 text-white">
          <div className="flex min-w-0 flex-col">
            <h1 className="flex items-center gap-1 text-44 leading-none font-bold tracking-display">
              <span aria-hidden className="w-[30px] text-center text-30 leading-none">
                📍
              </span>
              {city}
            </h1>
            <div className="mt-1 flex flex-col gap-0.5 text-15 font-medium tracking-sub whitespace-nowrap">
              <p className="flex gap-1.5">
                <span aria-hidden className="w-[18px] text-center">
                  📅
                </span>
                {dateShort}
              </p>
              <p className="flex gap-1.5">
                <span aria-hidden className="w-[18px] text-center">
                  👥
                </span>
                {copy.joined(joinedCount)}
              </p>
            </div>
          </div>
          <div className="pb-0.5">
            <AvatarStack
              size={28}
              overlap={8}
              ring="white"
              avatars={members.map((u) => ({ name: u.name, src: u.avatar, tone: u.tone }))}
            />
          </div>
        </div>
      </div>
      <TripTabs tripId={tripId} active="home" variant="hero" className="relative z-[2] mx-4 -mt-[26px]" />
      <div className="flex flex-col gap-2.5 px-4 pt-4 pb-[120px]">
        <Skeleton className="h-[76px]" />
        <Skeleton className="h-[210px]" />
      </div>
    </div>
  );
}
