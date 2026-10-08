import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Bottom dock rail for a Screen. A zero-height `sticky bottom-0` strip at the end of the page: anything inside it that
 * is `absolute … bottom-0` (FadeDock, FABs, action bars) rides the bottom of the viewport while the body scrolls, and
 * rests at the end of the page when the content is shorter than the screen. No scroll container, no `fixed`.
 */
export function StickyDock({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("sticky bottom-0 z-30 mt-auto h-0 w-full shrink-0", className)} {...props} />;
}
