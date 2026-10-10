import { useEffect, useMemo, useRef } from "react";
import { LONG_PRESS_MS } from "@/data/timing";

type LongPressOptions = {
  /** Hold time before it fires. Default `LONG_PRESS_MS` (500). */
  ms?: number;
  /** Movement (px) from the press point that cancels it, so a scroll never fires. Default 8. */
  moveTolerance?: number;
};

export type LongPressHandlers = {
  onPointerDown: React.PointerEventHandler;
  onPointerMove: React.PointerEventHandler;
  onPointerUp: React.PointerEventHandler;
  onPointerCancel: React.PointerEventHandler;
  onPointerLeave: React.PointerEventHandler;
  onContextMenu: React.MouseEventHandler;
  onKeyDown: React.KeyboardEventHandler;
};

type Press = { timer: number; x: number; y: number; stopScrollWatch: () => void };

function endPress(press: React.RefObject<Press | null>) {
  const p = press.current;
  if (!p) return;
  window.clearTimeout(p.timer);
  p.stopScrollWatch();
  press.current = null;
}

/**
 * Long-press gesture for member and own bubbles (C-chat-kickoff.md §1.2). Spread the result onto the pressable element.
 * Fires `onLongPress(element)` after `ms`; up, cancel, leave, a move over `moveTolerance` or any scroll clears it.
 * Enter / Space fire immediately (keyboard path). The native context menu is suppressed.
 */
export function useLongPress(onLongPress: (target: HTMLElement) => void, opts?: LongPressOptions): LongPressHandlers {
  const ms = opts?.ms ?? LONG_PRESS_MS;
  const tolerance = opts?.moveTolerance ?? 8;

  const callback = useRef(onLongPress);
  useEffect(() => {
    callback.current = onLongPress;
  });

  const press = useRef<Press | null>(null);
  useEffect(() => () => endPress(press), []);

  return useMemo<LongPressHandlers>(() => {
    const cancel = () => endPress(press);

    return {
      onPointerDown(e) {
        if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
        endPress(press);
        const target = e.currentTarget as HTMLElement;
        // A wheel / programmatic scroll during the hold cancels too (touch scrolls already fire pointercancel).
        const onScroll = () => endPress(press);
        document.addEventListener("scroll", onScroll, { capture: true, passive: true });
        press.current = {
          x: e.clientX,
          y: e.clientY,
          stopScrollWatch: () => document.removeEventListener("scroll", onScroll, { capture: true }),
          timer: window.setTimeout(() => {
            endPress(press);
            callback.current(target);
          }, ms),
        };
      },
      onPointerMove(e) {
        const p = press.current;
        if (!p || !e.isPrimary) return;
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > tolerance) endPress(press);
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      onContextMenu(e) {
        e.preventDefault();
      },
      onKeyDown(e) {
        if ((e.key !== "Enter" && e.key !== " ") || e.repeat) return;
        e.preventDefault();
        endPress(press);
        callback.current(e.currentTarget as HTMLElement);
      },
    };
  }, [ms, tolerance]);
}
