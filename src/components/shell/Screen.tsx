import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const bgClass = {
  canvas: "bg-canvas",
  surface: "bg-surface",
  viewer: "bg-viewer",
} as const;

type ScreenProps = {
  bg?: keyof typeof bgClass;
  children: ReactNode;
};

// The page's `main` landmark: one Screen per rendered route; sheets portal to the overlay layer as dialogs.
// It is at least one viewport tall and grows with its content, so the document (body) is the only page scroller.
// Headers are `sticky top-0`, bottom docks go in a <StickyDock>.
export function Screen({ bg = "canvas", children }: ScreenProps) {
  return <main className={cn("relative flex min-h-dvh flex-col", bgClass[bg])}>{children}</main>;
}
