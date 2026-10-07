import { SectionHeader } from "@/components/common/SectionHeader";
import { AskGoRow } from "@/components/home/AskGoRow";
import { HeroCard } from "@/components/home/HeroCard";
import { IdeasCarousel } from "@/components/home/IdeasCarousel";
import { home as copy } from "@/data/seed/copy";
import { IDEAS } from "@/data/seed/ideas";
import { assets } from "@/lib/assets";

const NEW_TRIP = "/trips/new";

/** A4: first-run Home body (no trips yet). */
export function HomeZeroView({ city }: { city: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none">
      <div className="flex flex-col gap-2.5 px-4 pt-4 pb-10">
        <HeroCard
          title={copy.hero.title}
          body={copy.hero.body}
          ctaLabel={copy.hero.cta}
          ctaHref={NEW_TRIP}
          mascot={{ src: assets.goMascot.src, alt: assets.goMascot.alt }}
        />
        <SectionHeader title={copy.ideasTitle} meta={copy.ideasMeta(city)} className="mt-3.5" />
        <IdeasCarousel ideas={IDEAS} href={NEW_TRIP} />
        <AskGoRow title={copy.askGo.title} sub={copy.askGo.sub} href={NEW_TRIP} />
      </div>
    </div>
  );
}
