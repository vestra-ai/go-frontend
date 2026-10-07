"use client";

import { useState, type ReactNode } from "react";
import { FrameContext } from "@/components/shell/FrameContext";

// The transform makes the frame the containing block for every position:fixed
// descendant, so headers, sheets, toasts and portals never escape the column.
export function AppFrame({ children }: { children: ReactNode }) {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);

  return (
    <div
      id="app-frame"
      ref={setFrame}
      data-vaul-drawer-wrapper=""
      className="relative mx-auto h-full w-full max-w-[450px] transform-gpu overflow-hidden bg-canvas"
    >
      <FrameContext value={frame}>{children}</FrameContext>
    </div>
  );
}
