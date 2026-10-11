"use client";

import { useEffect, useState } from "react";

/** Whether a time is less than `ms` old, turning false by itself once it no longer is. One time per mount: key the component by it. */
export function useRecent(iso: string, ms: number): boolean {
  const [recent, setRecent] = useState(() => Date.parse(iso) + ms > Date.now());
  useEffect(() => {
    const left = Date.parse(iso) + ms - Date.now();
    if (!(left > 0)) return;
    const timer = window.setTimeout(() => setRecent(false), left);
    return () => window.clearTimeout(timer);
  }, [iso, ms]);
  return recent;
}
