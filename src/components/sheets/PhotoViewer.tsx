"use client";

import { useEffect, useState } from "react";
import { Photo } from "@/components/common/Photo";
import { X } from "@/components/icons/generated";
import { PanZoomLayer, type Bleed, type HomeView } from "@/components/plan/PanZoomLayer";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { staySheet as copy } from "@/data/seed/copy";
import type { StayPhoto } from "@/data/types";
import { cn } from "@/lib/utils";
import { PhotoArrows, PhotoDots, snapTrackClass, useSnapTrack } from "./photoTrack";

/** The whole photo, centred: it zooms in from there and has nothing past its edges. */
const HOME: HomeView = { s: 1, fx: 0.5, fy: 0.5 };
const NO_BLEED: Bleed = { x: 0, y: 0 };

type PhotoViewerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: StayPhoto[];
  name: string;
  /** The photo it opens on. */
  start: number;
  /** Another photo came on: the carousel underneath follows. */
  onAt(at: number): void;
};

/**
 * The carousel's photos full screen, over the sheet that opened it. Photos change as in the carousel (a swipe, the
 * previous / next buttons or the arrow keys); each one zooms up to 3× by pinch, double tap, Ctrl/⌘ + wheel or the +/−
 * buttons, and pans by drag while zoomed. A drag down closes it like any sheet, from the bars or from a photo at its
 * resting zoom; on a zoomed photo a drag is a pan (the layer tells the sheet to keep out of it).
 */
export function PhotoViewer({ open, onOpenChange, ...viewer }: PhotoViewerProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} nested inset={0} grabber={false} aria-label={copy.photos.label(viewer.name)} className="bg-black text-white">
      <Viewer {...viewer} onClose={() => onOpenChange(false)} />
    </BottomSheet>
  );
}

/** Mounted while the sheet is open, so each opening starts on `start` at the resting zoom. */
function Viewer({ photos, name, start, onAt, onClose }: Omit<PhotoViewerProps, "open" | "onOpenChange"> & { onClose(): void }) {
  // `start` follows the carousel, which follows this viewer: only its value at opening places the row.
  const { track, at, onScroll, go } = useSnapTrack(photos.length, start, onAt);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && at > 0) go(at - 1);
      else if (e.key === "ArrowRight" && at < photos.length - 1) go(at + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, go, photos.length]);

  // The +/− buttons of the photo on screen are drawn here, over the row: they stay put while the photos slide.
  const [zoomSlot, setZoomSlot] = useState<HTMLDivElement | null>(null);

  const label = photos[at]?.label;
  return (
    // `touch-none`: no pinch or double tap anywhere in the viewer zooms the page itself, and a drag down reaches the
    // sheet (which closes on it) instead of the browser. The row of photos still pans sideways: a scroller's own swipes
    // are decided from the touched element up to that scroller, no further.
    <div className="flex min-h-0 flex-1 touch-none flex-col">
      <div className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center gap-2 px-3 pt-safe-hero pb-2.5">
        <Button type="button" variant="glass" size="icon-sm" aria-label={copy.photos.close} className="bg-white/15" onClick={onClose}>
          <X className="size-5" strokeWidth={2} />
        </Button>
        <div className="flex min-w-0 flex-col items-center gap-px text-center" aria-live="polite">
          {/* The label's line is kept when a photo has none, so the count below it never moves or changes. */}
          <span className="h-5 max-w-full truncate text-15 leading-5 font-semibold">{label}</span>
          <span className="text-13 text-white/60 tabular-nums">
            <span aria-hidden>{copy.photos.at(at + 1, photos.length)}</span>
            <span className="sr-only">{copy.photos.count(at + 1, photos.length)}</span>
          </span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={track} className={cn(snapTrackClass, "h-full")} onScroll={onScroll}>
          {photos.map((photo, i) => (
            <div key={photo.src} className="relative h-full w-full shrink-0 snap-center snap-always">
              {/* `homeKey` changes when the photo leaves the screen: it is back at its resting zoom when it returns. */}
              <PanZoomLayer
                home={HOME}
                bleed={NO_BLEED}
                homeKey={`${photo.src}:${i === at}`}
                restTouchAction="pan-x"
                controls={i === at && zoomSlot ? zoomSlot : false}
                zoomInLabel={copy.photos.zoomIn}
                zoomOutLabel={copy.photos.zoomOut}
              >
                <Photo
                  src={photo.src}
                  alt={photo.label ?? name}
                  // The largest copy there is: this is the one that gets zoomed.
                  sizes="1080px"
                  loading={Math.abs(i - at) <= 1 ? "eager" : "lazy"}
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain text-transparent"
                />
              </PanZoomLayer>
            </div>
          ))}
        </div>
        <div ref={setZoomSlot} className="pointer-events-none absolute inset-0" />
        <PhotoArrows at={at} count={photos.length} onGo={go} />
      </div>

      <div className="flex shrink-0 justify-center pt-3 pb-safe">
        <PhotoDots at={at} count={photos.length} className="bg-white/15" />
      </div>
    </div>
  );
}
