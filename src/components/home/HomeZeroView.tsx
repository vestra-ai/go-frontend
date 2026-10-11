"use client";

import { useEffect, useState } from "react";
import type { Idea as ApiIdea } from "@/api/contract";
import { SectionHeader } from "@/components/common/SectionHeader";
import { AskGoRow } from "@/components/home/AskGoRow";
import { HeroCard } from "@/components/home/HeroCard";
import { IdeasCarousel, IdeasCarouselPlaceholder } from "@/components/home/IdeasCarousel";
import { useStartTrip } from "@/components/home/useStartTrip";
import { home as copy } from "@/data/seed/copy";
import type { Idea } from "@/data/types";
import { assets } from "@/lib/assets";
import { loadIdeas, useGo } from "@/state";
import { httpUrl } from "@/state/bookingView";
import { illustrationFor } from "@/state/view";

const TRAVEL: Record<ApiIdea["travel"]["mode"], { emoji: string; word: string }> = {
  flight: { emoji: "✈️", word: "flight" },
  car: { emoji: "🚗", word: "drive" },
  train: { emoji: "🚆", word: "train" },
  bus: { emoji: "🚌", word: "bus" },
};
const TINTS = ["bg-amber-soft", "bg-green-tint", "bg-info-tint", "bg-peach-tint", "bg-amber-tint", "bg-peach-tint-2"] as const;

/** 150 → "2.5h", 60 → "1h", 45 → "45 min". */
function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round((minutes / 60) * 2) / 2}h`;
}

function toIdea(idea: ApiIdea, index: number): Idea {
  const travel = TRAVEL[idea.travel.mode] ?? TRAVEL.car;
  return {
    id: idea.idea_id,
    name: idea.name,
    tag: idea.tag,
    travelEmoji: travel.emoji,
    travel: `${duration(idea.travel.duration_minutes)} ${travel.word}`,
    tintClass: TINTS[index % TINTS.length],
    // `image_url` may be absent (CONTRACT-APP §4.2): the illustration is the fallback, and also what shows if the photo fails.
    img: illustrationFor(idea.idea_id, idea.name),
    ...(httpUrl(idea.image_url) ? { photo: httpUrl(idea.image_url) } : {}),
  };
}

/** First-run Home body (no trips yet). Ideas come from `GET /discover/ideas`; tapping one starts a trip with its hint. */
export function HomeZeroView({ city }: { city: string | null }) {
  const ideas = useGo((s) => s.ideas);
  const [failed, setFailed] = useState(false);
  const trip = useStartTrip();

  useEffect(() => {
    void loadIdeas().catch(() => setFailed(true));
  }, []);

  // Until the ideas are in (or the read has failed), their slot holds placeholder cards.
  const loading = ideas === null && !failed;

  const from = ideas?.fromCity ?? city;
  const hints = new Map((ideas?.items ?? []).map((idea) => [idea.idea_id, idea.destination_hint]));

  return (
    <div className="flex flex-col gap-2.5 px-4 pt-4 pb-10">
      <HeroCard
        title={copy.hero.title}
        body={copy.hero.body}
        ctaLabel={copy.hero.cta}
        onCta={() => void trip.start("hero")}
        ctaPending={trip.pending === "hero"}
        mascot={{ src: assets.goMascot.src, alt: assets.goMascot.alt }}
      />
      {(loading || (ideas && ideas.items.length > 0)) && (
        <>
          <SectionHeader title={copy.ideasTitle} meta={from ? copy.ideasMeta(from) : undefined} className="mt-3.5" />
          {ideas ? (
            <IdeasCarousel
              ideas={ideas.items.map(toIdea)}
              onPick={(idea) => void trip.start(`idea:${idea.id}`, { hint: hints.get(idea.id) ?? idea.name })}
              pendingId={trip.pending?.startsWith("idea:") ? trip.pending.slice(5) : null}
            />
          ) : (
            <IdeasCarouselPlaceholder />
          )}
        </>
      )}
      <AskGoRow
        title={copy.askGo.title}
        sub={copy.askGo.sub}
        onPress={() => void trip.start("ask", { to: "chat" })}
        pending={trip.pending === "ask"}
      />
    </div>
  );
}
