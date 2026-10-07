"use client";

import { useSyncExternalStore } from "react";

// One shared 1s clock for every live-call timer, so a call card and the Listen sheet hero always read the same
// "mm:ss" (J-triphome-calls.md §1.3, §1.7 #4). `now` is 0 while nothing is subscribed; the next read restarts it.
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  timer ??= setInterval(() => {
    now = Date.now();
    listeners.forEach((l) => l());
  }, 1000);
  return () => {
    listeners.delete(onChange);
    if (listeners.size > 0) return;
    clearInterval(timer);
    timer = undefined;
    now = 0;
  };
}

const getSnapshot = () => (now ||= Date.now());
const getServerSnapshot = () => 0;

const pad = (n: number) => String(n).padStart(2, "0");

/** "mm:ss" since `startedAt` (epoch ms), ticking every second. Renders "00:00" on the server. */
export function useElapsed(startedAt: number): string {
  const t = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const s = t === 0 ? 0 : Math.max(0, Math.floor((t - startedAt) / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
