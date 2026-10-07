"use client";

import { useCallback, useState } from "react";

/** 0 below 110px, 1 from 200px, in 0.05 steps. */
export const collapseProgress = (scrollTop: number) =>
  Math.round(Math.min(Math.max((scrollTop - 110) / 90, 0), 1) * 20) / 20;

export function useCollapsingHeader(): { hp: number; onScroll: React.UIEventHandler<HTMLElement> } {
  const [hp, setHp] = useState(0);
  const onScroll = useCallback<React.UIEventHandler<HTMLElement>>((e) => {
    setHp(collapseProgress(e.currentTarget.scrollTop));
  }, []);
  return { hp, onScroll };
}
