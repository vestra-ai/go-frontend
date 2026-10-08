"use client";

import { useState, type ReactNode } from "react";
import { FrameContext } from "@/components/shell/FrameContext";

type AppFrameProps = {
  children: ReactNode;
  /** Rendered inside the overlay layer (toaster). */
  overlay?: ReactNode;
};

// The page column is plain document flow (no overflow, no transform), so the body scrolls and `sticky` works.
// Overlays (sheets, menus, tooltips, toasts) portal into a separate fixed layer pinned to the same 450px column:
// its transform makes it the containing block for every `position:fixed`/`absolute` descendant, so they never
// escape the column on wide screens, and the layer itself lets taps through to the page.
export function AppFrame({ children, overlay }: AppFrameProps) {
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);

  return (
    <FrameContext value={layer}>
      <div
        id="app-frame"
        data-vaul-drawer-wrapper=""
        className="relative mx-auto min-h-dvh w-full max-w-[450px] overflow-x-clip bg-canvas"
      >
        {children}
      </div>
      <div
        id="overlay-layer"
        ref={setLayer}
        className="pointer-events-none fixed inset-y-0 left-1/2 z-50 w-full max-w-[450px] -translate-x-1/2 transform-gpu *:pointer-events-auto"
      >
        {overlay}
      </div>
    </FrameContext>
  );
}
