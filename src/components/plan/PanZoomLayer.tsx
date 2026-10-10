"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const MAX_SCALE = 3;
const DOUBLE_TAP_SCALE = 2;
const DRAG_THRESHOLD = 4; // px a pointer must travel before a press becomes a pan (so taps on pins still select)
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 24; // px
const BUTTON_ZOOM = 1.6; // step of the +/− buttons

interface Transform {
  s: number;
  x: number;
  y: number;
}

/** How much extra content the layer has past each edge, as fractions of its width / height. */
export interface Bleed {
  x: number;
  y: number;
}

/** The resting view: zoom `s`, with the point (fx, fy) (fractions of the layer) centred in the viewport. */
export interface HomeView {
  s: number;
  fx: number;
  fy: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Pan limits: the viewport must stay inside the content, which extends `bleed` past each edge of the layer.
const rangeX = (s: number, w: number, b: Bleed): [number, number] => [w - s * w * (1 + b.x), s * w * b.x];
const rangeY = (s: number, h: number, b: Bleed): [number, number] => [h - s * h * (1 + b.y), s * h * b.y];

function homeOf(home: HomeView, w: number, h: number, bleed: Bleed): Transform {
  const { s } = home;
  return {
    s,
    x: clamp(w / 2 - home.fx * w * s, ...rangeX(s, w, bleed)),
    y: clamp(h / 2 - home.fy * h * s, ...rangeY(s, h, bleed)),
  };
}
const isHome = (t: Transform, home: HomeView) => t.s <= home.s + 0.001;

/** Keeps the scaled layer covering the viewport. At the resting zoom nothing can move: it is always the centred view. */
function constrain(t: Transform, w: number, h: number, home: HomeView, bleed: Bleed): Transform {
  const s = clamp(t.s, home.s, MAX_SCALE);
  if (s <= home.s + 0.001) return homeOf(home, w, h, bleed);
  return { s, x: clamp(t.x, ...rangeX(s, w, bleed)), y: clamp(t.y, ...rangeY(s, h, bleed)) };
}

/** Zoom to `s` keeping the point (px, py) of the viewport fixed under the finger / cursor. */
function zoomAt(
  t: Transform,
  s: number,
  px: number,
  py: number,
  w: number,
  h: number,
  home: HomeView,
  bleed: Bleed,
): Transform {
  const next = clamp(s, home.s, MAX_SCALE);
  const k = next / t.s;
  return constrain({ s: next, x: px - (px - t.x) * k, y: py - (py - t.y) * k }, w, h, home, bleed);
}

interface PanZoomLayerProps {
  /** The map art and its tap targets: one layer, so everything pans and zooms together. */
  children: ReactNode;
  /** The centred resting view (also the zoomed-out limit). Changing `homeKey` re-centres it. */
  home: HomeView;
  bleed: Bleed;
  homeKey: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  /** A tap on the bare map (not on a pin, a route or a control). */
  onBackgroundTap?: () => void;
  className?: string;
}

/**
 * Drag to pan, pinch / double-tap / Ctrl-or-⌘ + wheel / the +/− buttons to zoom (up to 3×). Zoomed in, the layer claims
 * every touch (`touch-action: none`); at the resting view (nothing to pan) it leaves vertical swipes to the browser
 * (`pan-y`), so the page scrolls natively and the map never traps or fights it. The layer is clipped by its parent.
 */
export function PanZoomLayer({ children, home, bleed, homeKey, zoomInLabel, zoomOutLabel, onBackgroundTap, className }: PanZoomLayerProps) {
  const surface = useRef<HTMLDivElement>(null);
  // Re-centred before first paint (the real size is only known once mounted), so this start value never shows.
  const [t, setT] = useState<Transform>({ s: home.s, x: 0, y: 0 });
  // Mirror of `t` for handlers that fire faster than renders (every change goes through `apply`).
  const tRef = useRef<Transform>({ s: home.s, x: 0, y: 0 });
  // Gestures follow the fingers 1:1; programmatic moves (double-tap, reset) glide.
  const [gliding, setGliding] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef({ x: 0, y: 0 });
  const panning = useRef(false);
  const moved = useRef(false);
  const lastTap = useRef({ time: 0, x: 0, y: 0 });

  const size = useCallback(() => {
    const r = surface.current?.getBoundingClientRect();
    return { w: r?.width ?? 0, h: r?.height ?? 0, left: r?.left ?? 0, top: r?.top ?? 0 };
  }, []);

  const apply = useCallback((next: Transform) => {
    tRef.current = next;
    setT(next);
  }, []);

  // Centre on mount, whenever the map changes (`homeKey`), and when the card is resized.
  useLayoutEffect(() => {
    const { w, h } = size();
    /* eslint-disable react-hooks/set-state-in-effect -- the centred view needs the measured size, so it can only be set after layout */
    setGliding(false);
    apply(homeOf(home, w, h, bleed));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [homeKey, home, bleed, apply, size]);
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const { w, h } = size();
      apply(isHome(tRef.current, home) ? homeOf(home, w, h, bleed) : constrain(tRef.current, w, h, home, bleed));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [home, bleed, apply, size]);

  // Ctrl/⌘ + wheel (also a trackpad pinch) zooms at the cursor; a plain wheel keeps scrolling the page.
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const { w, h, left, top } = size();
      setGliding(false);
      apply(zoomAt(tRef.current, tRef.current.s * Math.exp(-e.deltaY * 0.01), e.clientX - left, e.clientY - top, w, h, home, bleed));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [apply, size, home, bleed]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (pointers.current.size === 0) {
      moved.current = false;
      panning.current = false;
      start.current = { x: e.clientX, y: e.clientY };
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) moved.current = true; // a pinch never ends in a pin tap
  };

  // The +/− buttons zoom about the centre of the view.
  const zoomBy = (factor: number) => {
    const { w, h } = size();
    setGliding(true);
    apply(zoomAt(tRef.current, tRef.current.s * factor, w / 2, h / 2, w, h, home, bleed));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const { w, h, left, top } = size();
    const cur = { x: e.clientX, y: e.clientY };

    if (pointers.current.size === 1) {
      if (!panning.current) {
        if (Math.hypot(cur.x - start.current.x, cur.y - start.current.y) < DRAG_THRESHOLD) return;
        panning.current = true;
        moved.current = true;
        // Keep receiving moves when the finger leaves a pin or the card; clicks on pins are cancelled via `moved`.
        if (!isHome(tRef.current, home)) {
          try {
            surface.current?.setPointerCapture(e.pointerId);
          } catch {
            // The pointer already ended: nothing to capture.
          }
        }
      }
      pointers.current.set(e.pointerId, cur);
      if (!isHome(tRef.current, home)) {
        setGliding(false);
        const { s, x, y } = tRef.current;
        apply(constrain({ s, x: x + cur.x - prev.x, y: y + cur.y - prev.y }, w, h, home, bleed));
      }
      // At the resting view there is nothing to pan: a vertical swipe is the browser's (touch-action: pan-y below).
      return;
    }

    // Two fingers: scale by the change in their distance, follow the change in their midpoint.
    const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)?.[1];
    pointers.current.set(e.pointerId, cur);
    if (!other) return;
    const dist = Math.hypot(cur.x - other.x, cur.y - other.y);
    const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
    if (prevDist === 0) return;
    const mid = { x: (cur.x + other.x) / 2 - left, y: (cur.y + other.y) / 2 - top };
    const prevMid = { x: (prev.x + other.x) / 2 - left, y: (prev.y + other.y) / 2 - top };
    setGliding(false);
    const zoomed = zoomAt(tRef.current, tRef.current.s * (dist / prevDist), mid.x, mid.y, w, h, home, bleed);
    apply(constrain({ ...zoomed, x: zoomed.x + mid.x - prevMid.x, y: zoomed.y + mid.y - prevMid.y }, w, h, home, bleed));
  };

  const endPointer = (e: React.PointerEvent, cancelled: boolean) => {
    if (!pointers.current.delete(e.pointerId)) return;
    try {
      if (surface.current?.hasPointerCapture(e.pointerId)) surface.current.releasePointerCapture(e.pointerId);
    } catch {
      // Released already.
    }
    if (pointers.current.size > 0) return;

    // A still press that is not a pan / pinch: two in quick succession toggle zoom around the tap.
    if (cancelled || moved.current) return;
    const now = e.timeStamp;
    const near = Math.hypot(e.clientX - lastTap.current.x, e.clientY - lastTap.current.y) < DOUBLE_TAP_SLOP;
    if (now - lastTap.current.time < DOUBLE_TAP_MS && near) {
      const { w, h, left, top } = size();
      setGliding(true);
      apply(
        isHome(tRef.current, home)
          ? zoomAt(tRef.current, DOUBLE_TAP_SCALE, e.clientX - left, e.clientY - top, w, h, home, bleed)
          : homeOf(home, w, h, bleed),
      );
      lastTap.current = { time: 0, x: 0, y: 0 };
    } else {
      lastTap.current = { time: now, x: e.clientX, y: e.clientY };
    }
  };

  const zoomed = !isHome(t, home);

  return (
    <div
      ref={surface}
      data-slot="pan-zoom-layer"
      className={cn("absolute inset-0 overflow-hidden", className)}
      // Zoomed in, the map owns every touch (pan, pinch). At the resting view there is nothing to pan, so the browser
      // keeps vertical swipes (native scroll and momentum, no fight with the map); pinch and horizontal moves still
      // reach the map. The value is read when a touch starts, so it takes effect from the next gesture.
      style={{ touchAction: zoomed ? "none" : "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endPointer(e, false)}
      onPointerCancel={(e) => endPointer(e, true)}
      // A drag or pinch that ends over a pin must not select it.
      onClickCapture={(e) => {
        if (moved.current) {
          e.stopPropagation();
          e.preventDefault();
          moved.current = false;
        }
      }}
      // Pins and the zoom buttons are buttons, and tappable routes stop their own click; anything else is the bare map.
      onClick={(e) => {
        if (!(e.target as Element).closest("button")) onBackgroundTap?.();
      }}
    >
      <div
        className={cn("absolute inset-0 origin-top-left", gliding && "transition-transform duration-220 ease-[var(--ease-out)] motion-reduce:transition-none")}
        style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})` }}
      >
        {children}
      </div>
      {/* Presses on the buttons are theirs alone: no pan, pinch or double-tap on the layer underneath. */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onPointerCancel={(e) => e.stopPropagation()}
        className="absolute top-2.5 right-2.5 z-2 flex flex-col overflow-hidden rounded-full bg-white/92 shadow-[0_2px_10px_rgb(11_27_63/0.12)]"
      >
        <ZoomButton label={zoomInLabel} disabled={t.s >= MAX_SCALE} onPress={() => zoomBy(BUTTON_ZOOM)}>
          <path d="M7 1v12M1 7h12" />
        </ZoomButton>
        <ZoomButton label={zoomOutLabel} disabled={!zoomed} onPress={() => zoomBy(1 / BUTTON_ZOOM)}>
          <path d="M1 7h12" />
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
      className="grid size-[34px] cursor-pointer place-items-center text-ink outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ink/25 disabled:cursor-default disabled:opacity-35"
    >
      <svg viewBox="0 0 14 14" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
