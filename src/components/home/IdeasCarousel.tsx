import { IdeaCard } from "@/components/home/IdeaCard";
import type { Idea } from "@/data/types";

/** Horizontal snap row of idea cards; every card links to `href`. */
export function IdeasCarousel({ ideas, href }: { ideas: Idea[]; href: string }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto overscroll-x-contain px-4 pt-0.5 pb-2 scrollbar-none">
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} href={href} />
      ))}
    </div>
  );
}
