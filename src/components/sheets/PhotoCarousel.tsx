"use client";

import { useState } from "react";
import { Photo } from "@/components/common/Photo";
import { staySheet as copy } from "@/data/seed/copy";
import type { StayPhoto } from "@/data/types";
import { cn } from "@/lib/utils";
import { PhotoViewer } from "./PhotoViewer";
import { PhotoArrows, PhotoDots, snapTrackClass, useSnapTrack } from "./photoTrack";

type PhotoCarouselProps = {
  photos: StayPhoto[];
  /** The place's name: the group's label, and the alt of a photo with no label of its own. */
  name: string;
  className?: string;
};

/**
 * A place's photos, one at a time, in the box its single cover photo had. It never moves by itself: a swipe on a touch
 * screen (a native snap scroller), the previous / next buttons where there is a mouse. The dots say which photo is on,
 * and a photo Go labelled ("Swimming pool") wears its label in the top corner. A tap opens the photo full screen
 * (`PhotoViewer`), which leaves the carousel on the photo it was closed at.
 */
export function PhotoCarousel({ photos, name, className }: PhotoCarouselProps) {
  const { track, at, onScroll, go } = useSnapTrack(photos.length);
  const [viewing, setViewing] = useState(false);
  const label = photos[at]?.label;

  return (
    <div role="group" aria-roledescription="carousel" aria-label={copy.photos.label(name)} className={cn("relative overflow-hidden rounded-5xl bg-skeleton", className)}>
      <div ref={track} className={cn(snapTrackClass, "h-full")} onScroll={onScroll}>
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            aria-label={copy.photos.open(i + 1, photos.length)}
            className="h-full w-full shrink-0 cursor-zoom-in snap-center snap-always"
            onClick={() => setViewing(true)}
          >
            <Photo
              src={photo.src}
              alt={photo.label ?? name}
              sizes="(min-width: 450px) 418px, 100vw"
              // The photo on screen and the one after it: the next swipe lands on a photo that is already there.
              loading={i <= at + 1 ? "eager" : "lazy"}
              draggable={false}
              className="h-full w-full object-cover text-transparent"
            />
          </button>
        ))}
      </div>

      {label && (
        // Keyed by the photo, so each one's label fades in. The photo's alt already says it.
        <span
          key={at}
          aria-hidden
          className="pointer-events-none absolute top-2.5 left-2.5 max-w-[calc(100%-20px)] animate-fade-in truncate rounded-full bg-ink/60 px-2.5 py-1 text-12 font-semibold text-white opacity-0 backdrop-blur-[12px]"
        >
          {label}
        </span>
      )}
      <PhotoArrows at={at} count={photos.length} onGo={go} />
      <PhotoDots at={at} count={photos.length} className="absolute bottom-2 left-1/2 -translate-x-1/2" />
      <span className="sr-only" aria-live="polite">
        {copy.photos.count(at + 1, photos.length)}
      </span>

      <PhotoViewer open={viewing} onOpenChange={setViewing} photos={photos} name={name} start={at} onAt={(to) => go(to, false)} />
    </div>
  );
}
