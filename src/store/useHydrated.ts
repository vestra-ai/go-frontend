"use client";

import { useSyncExternalStore } from "react";
import { useStore } from "@/store/store";

const noop = () => {};

const subscribe = (onChange: () => void) => useStore.persist?.onFinishHydration(onChange) ?? noop;
const getSnapshot = () => useStore.persist?.hasHydrated() ?? false;
const getServerSnapshot = () => false;

/**
 * True once the persisted store has been read from localStorage. Always false on the server and during hydration,
 * so pages render their skeleton first and never mismatch the server HTML (PLAN §9.4).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
