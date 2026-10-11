"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { Reply } from "@/components/icons/generated";

/** Sideways travel before the swipe takes the gesture. The long-press lets go at 8, so the two never run together. */
const START = 10;
/** Pulled this far at release: a reply. */
const TRIGGER = 56;
/** The bubbles stop following here. */
const MAX = 84;
/** A swipe from the screen's left edge is the browser's Back on iOS: it is left alone. */
const EDGE = 24;

type Drag = { id: number; x: number; y: number; on: boolean; pull: number };

/**
 * Swipe a message's bubbles to the right to reply to it, as in WhatsApp: the bubbles follow the finger, a reply arrow
 * comes in on the left, and letting go past the arrow opens the reply tray. Touch only. The row keeps its vertical
 * scroll (`touch-action: pan-y`): a drag that starts up or down is the page's and never reaches here.
 *
 * The pull is written straight to the two elements' styles, so a swipe renders nothing.
 */
export function SwipeToReply({ onReply, children }: { onReply(): void; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const drag = useRef<Drag | null>(null);
  // A swipe ended on this press: the click the browser sends after it (on a quote, a photo) is not a tap.
  const swiped = useRef(false);

  const draw = (pull: number, settle: boolean) => {
    const c = content.current;
    const a = arrow.current;
    if (!c || !a) return;
    const transition = settle ? "translate 220ms var(--ease-out), opacity 220ms ease-out, scale 220ms ease-out" : "none";
    c.style.transition = transition;
    c.style.translate = pull ? `${pull}px` : "";
    const shown = Math.min(1, pull / TRIGGER);
    a.style.transition = transition;
    a.style.opacity = String(shown);
    a.style.scale = String(0.6 + 0.4 * shown);
    a.toggleAttribute("data-armed", pull >= TRIGGER);
  };

  const end = (e: PointerEvent, reply: boolean) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (!d.on) return;
    draw(0, true);
    if (reply && d.pull >= TRIGGER) onReply();
  };

  return (
    <div
      className="relative touch-pan-y"
      onPointerDown={(e) => {
        swiped.current = false;
        drag.current = null;
        if (e.pointerType !== "touch" || !e.isPrimary || e.clientX < EDGE) return;
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, on: false, pull: 0 };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || e.pointerId !== d.id) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.on) {
          // Up, down or to the left: not a reply swipe.
          if (Math.abs(dy) > START || dx < -START) return void (drag.current = null);
          if (dx < START || dx < Math.abs(dy) * 1.5) return;
          d.on = true;
          swiped.current = true;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // The pointer is already gone: the moves that still arrive are enough.
          }
        }
        const raw = Math.max(0, dx - START);
        // Past the arrow the bubbles drag behind the finger, then stop.
        const pull = raw <= TRIGGER ? raw : Math.min(MAX, TRIGGER + (raw - TRIGGER) * 0.35);
        if (pull >= TRIGGER && d.pull < TRIGGER) navigator.vibrate?.(8);
        d.pull = pull;
        draw(pull, false);
      }}
      onPointerUp={(e) => end(e, true)}
      onPointerCancel={(e) => end(e, false)}
      onClickCapture={(e) => {
        if (!swiped.current) return;
        swiped.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <span
        ref={arrow}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink/8 text-muted opacity-0 data-armed:bg-ink data-armed:text-white"
      >
        <Reply className="size-4" />
      </span>
      {/* The row's own column, moved here with its bubbles. */}
      <div ref={content} className="flex flex-col gap-2.5">
        {children}
      </div>
    </div>
  );
}
