import type { ReactNode, UIEventHandler } from "react";
import { cn } from "@/lib/utils";

const bgClass = {
  canvas: "bg-canvas",
  surface: "bg-surface",
  viewer: "bg-viewer",
} as const;

type ScreenProps = {
  bg?: keyof typeof bgClass;
  /** `page`: children scroll inside the frame. `none`: children own their layout and scroll regions. */
  scroll?: "page" | "none";
  onScroll?: UIEventHandler<HTMLDivElement>;
  children: ReactNode;
};

// The page's `main` landmark: one Screen per rendered route; sheets portal to the frame as dialogs.
export function Screen({ bg = "canvas", scroll = "page", onScroll, children }: ScreenProps) {
  if (scroll === "none") {
    return <main className={cn("relative flex h-full flex-col overflow-hidden", bgClass[bg])}>{children}</main>;
  }

  return (
    <main className={cn("relative flex h-full flex-col", bgClass[bg])}>
      <div onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
        {children}
      </div>
    </main>
  );
}
