"use client";

import { useEffect, useRef, useState } from "react";
import { HorizontalRail } from "@/components/chat/HorizontalRail";
import type { VendorId } from "@/data/types";
import type { LiveCall } from "@/store/selectors";
import { AddCallTile } from "./AddCallTile";
import { CarouselDots } from "./CarouselDots";
import { LiveCallCard } from "./LiveCallCard";

const VISIBLE = 0.6;

type CallCarouselProps = {
  /** Two or more live calls, in start order (one call renders a full-width LiveCallCard instead). */
  calls: LiveCall[];
  onListen(id: VendorId): void;
  onEnd(id: VendorId): void;
  /** Add tile → `openForm()`. */
  onAdd(): void;
};

/**
 * Snap carousel of 330px call slides plus the add tile, with dots that follow the snapped slide
 * (DESIGN-ASSUMPTION, J-triphome-calls.md §1.7 #2: the design's dots are static at 0).
 */
export function CallCarousel({ calls, onListen, onEnd, onAdd }: CallCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const ids = calls.map((c) => c.id).join(",");

  // Back to the first dot whenever the call list changes; the observer below then reports the real slide.
  const [seenIds, setSeenIds] = useState(ids);
  if (seenIds !== ids) {
    setSeenIds(ids);
    setActive(0);
  }

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const slides = Array.from(rail.children);
    const shown = new Map<Element, number>(); // slides at least 60% in view → last ratio
    const io = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | undefined;
        for (const e of entries) {
          if (e.intersectionRatio < VISIBLE) {
            shown.delete(e.target);
            continue;
          }
          shown.set(e.target, e.intersectionRatio);
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        // Highest-ratio entry wins; if this batch only reports slides leaving, fall back to what is still in view.
        const target = best?.target ?? [...shown].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (target) setActive(slides.indexOf(target));
      },
      { root: rail, threshold: VISIBLE },
    );
    slides.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);

  return (
    <div data-slot="call-carousel" className="flex flex-col gap-2">
      <HorizontalRail inset ref={railRef}>
        {calls.map((call) => (
          <LiveCallCard
            key={call.id}
            call={call}
            layout="slide"
            onListen={() => onListen(call.id)}
            onEnd={() => onEnd(call.id)}
          />
        ))}
        <AddCallTile onPress={onAdd} />
      </HorizontalRail>
      <CarouselDots count={calls.length + 1} active={active} />
    </div>
  );
}
