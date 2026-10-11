import { useState } from "react";
import { Spinner } from "@/components/icons/custom/Spinner";
import { Card } from "@/components/ui/card";
import type { Idea } from "@/data/types";
import { SKELETON_BAR, SKELETON_FILL } from "@/lib/skeleton";
import { cn } from "@/lib/utils";

/** Row-press classes shared with TripCard. */
export const rowPress =
  "transition-[transform,background-color] duration-160 ease-(--ease-out) active:scale-[0.985] active:bg-surface-pressed";

/**
 * The card's top: the destination's photo filling it, else its illustration small on the tint (also when the photo
 * fails). While the trip for this idea is being created, a spinner sits over it on a light wash.
 */
function IdeaMedia({ idea, pending }: { idea: Idea; pending: boolean }) {
  const [failed, setFailed] = useState(false);
  const photo = failed ? undefined : idea.photo;
  return (
    <span className={cn("relative flex h-[104px] items-center justify-center", idea.tintClass)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the Server's photo link, or an SVG illustration */}
      <img
        src={photo ?? idea.img}
        alt=""
        onError={photo ? () => setFailed(true) : undefined}
        className={photo ? "size-full object-cover" : "size-[76px]"}
      />
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Spinner className="size-6 border-ink/15 border-t-ink border-r-ink" />
        </span>
      )}
    </span>
  );
}

/** One destination idea: its photo (or a tinted illustration) over name, tag and travel time. Tapping it starts a trip there. */
export function IdeaCard({ idea, onPick, pending = false }: { idea: Idea; onPick(): void; pending?: boolean }) {
  return (
    <Card
      asChild
      variant="shadow"
      radius="xl"
      className={cn("flex w-[150px] shrink-0 cursor-pointer snap-start flex-col overflow-hidden text-left", rowPress)}
    >
      <button type="button" aria-busy={pending} onClick={onPick}>
        <IdeaMedia idea={idea} pending={pending} />
        <span className="flex flex-col gap-0.5 px-3 pt-2.5 pb-3">
          <span className="text-16 leading-[1.3] font-semibold tracking-body">{idea.name}</span>
          <span className="text-13 tracking-caption text-muted">{idea.tag}</span>
          <span className="text-13 tracking-caption text-muted">
            <span aria-hidden>{idea.travelEmoji}</span> {idea.travel}
          </span>
        </span>
      </button>
    </Card>
  );
}

/**
 * A static stand-in for an idea card while the ideas are on their way (no shimmer). It is the real card's markup with
 * its text made transparent and painted as bars, so it is exactly as tall as a loaded card and nothing moves when the
 * real ones arrive.
 */
export function IdeaCardPlaceholder() {
  const bar = SKELETON_BAR;
  return (
    <Card variant="shadow" radius="xl" aria-hidden className="flex w-[150px] shrink-0 snap-start flex-col overflow-hidden">
      <span className={cn("flex h-[104px] items-center justify-center", SKELETON_FILL)}>
        <span className="size-[76px] rounded-3xl bg-white/50" />
      </span>
      <span className="flex flex-col gap-0.5 px-3 pt-2.5 pb-3">
        <span className="text-16 leading-[1.3] font-semibold tracking-body">
          <span className={bar}>Destination</span>
        </span>
        <span className="text-13 tracking-caption">
          <span className={bar}>Short tagline</span>
        </span>
        <span className="text-13 tracking-caption">
          <span className={bar}>0h travel</span>
        </span>
      </span>
    </Card>
  );
}
