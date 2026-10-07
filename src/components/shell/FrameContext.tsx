"use client";

import { createContext, useContext } from "react";

/** The #app-frame element. Pass it as `container` to portals so overlays stay inside the 450px column. */
export const FrameContext = createContext<HTMLElement | null>(null);

export function useFrame() {
  return useContext(FrameContext);
}
