"use client";

import { createContext, useContext } from "react";

/** The fixed overlay layer (#overlay-layer, 450px column). Pass it as `container` to portals so overlays stay inside the column. */
export const FrameContext = createContext<HTMLElement | null>(null);

export function useFrame() {
  return useContext(FrameContext);
}
