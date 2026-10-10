import { IdeaCard, IdeaCardPlaceholder } from "@/components/home/IdeaCard";
import type { Idea } from "@/data/types";

const rowClass =
  "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto overscroll-x-contain px-4 pt-0.5 pb-2 scrollbar-none";

/** Horizontal snap row of idea cards; each card links to its own `hrefFor(idea)`. */
export function IdeasCarousel({ ideas, hrefFor }: { ideas: Idea[]; hrefFor: (idea: Idea) => string }) {
  return (
    <div className={rowClass}>
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} href={hrefFor(idea)} />
      ))}
    </div>
  );
}

/** The same row with static placeholder cards, while the ideas are being fetched. */
export function IdeasCarouselPlaceholder({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy className={rowClass}>
      {Array.from({ length: count }, (_, i) => (
        <IdeaCardPlaceholder key={i} />
      ))}
    </div>
  );
}
