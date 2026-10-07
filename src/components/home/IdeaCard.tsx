import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Idea } from "@/data/types";
import { cn } from "@/lib/utils";

/** Row-press classes shared with TripCard. */
export const rowPress =
  "transition-[transform,background-color] duration-160 ease-(--ease-out) active:scale-[0.985] active:bg-surface-pressed";

/** One destination idea: tinted illustration well over name, tag and travel time. */
export function IdeaCard({ idea, href }: { idea: Idea; href: string }) {
  return (
    <Card
      asChild
      variant="shadow"
      radius="xl"
      className={cn("flex w-[150px] shrink-0 snap-start flex-col overflow-hidden", rowPress)}
    >
      <Link href={href}>
        <span className={cn("flex h-[104px] items-center justify-center", idea.tintClass)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG illustration */}
          <img src={idea.img} alt="" className="size-[76px]" />
        </span>
        <span className="flex flex-col gap-0.5 px-3 pt-2.5 pb-3">
          <span className="text-16 leading-[1.3] font-semibold tracking-body">{idea.name}</span>
          <span className="text-13 tracking-caption text-muted">{idea.tag}</span>
          <span className="text-13 tracking-caption text-muted">
            <span aria-hidden>{idea.travelEmoji}</span> {idea.travel}
          </span>
        </span>
      </Link>
    </Card>
  );
}
