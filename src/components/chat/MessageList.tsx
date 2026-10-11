import type { ReactNode, RefObject } from "react";
import { usePageInResume } from "@/components/shell/PageTransition";
import { cn } from "@/lib/utils";

// Bottom padding matches the composer in front of the list: default 96, reply tray 150, ask-Go tray 190. The composer
// is taller than that over a tall bottom inset (`pb-safe`), and the padding grows with it (`--dock-rise`).
const padClass = {
  96: "pb-[calc(96px+var(--dock-rise))]",
  150: "pb-[calc(150px+var(--dock-rise))]",
  190: "pb-[calc(190px+var(--dock-rise))]",
} as const;

// DESIGN-ASSUMPTION: the sentinel sits above the bottom padding, so `scrollIntoView({block:'end'})` alone
// would leave the last message under the composer (the design's bug). A matching scroll margin scrolls past it.
const endMarginClass = {
  96: "scroll-mb-[calc(96px+var(--dock-rise))]",
  150: "scroll-mb-[calc(150px+var(--dock-rise))]",
  190: "scroll-mb-[calc(190px+var(--dock-rise))]",
} as const;

type MessageListProps = {
  bottomPadding: keyof typeof padClass;
  /** End sentinel; pass the same ref to `useThreadFollow`. */
  anchorRef: RefObject<HTMLSpanElement | null>;
  /** Slide up with the page (default). Off when the thread replaces the skeleton in place. */
  slideIn?: boolean;
  children: ReactNode;
};

/** The chat thread, in the document flow (the body scrolls). No date separators, timestamps or receipts (as designed); the only typing row is Go's (`GoThinking`). */
export function MessageList({ bottomPadding, anchorRef, slideIn = true, children }: MessageListProps) {
  const resume = usePageInResume();
  return (
    <div
      ref={resume}
      className={cn(
        "flex flex-1 flex-col gap-2.5 px-4 pt-4",
        slideIn && "[[data-own]_&]:animate-page-in", // the page slide-up, minus the pinned header
        padClass[bottomPadding],
      )}
    >
      {children}
      <span ref={anchorRef} data-chat-end="" className={cn("block h-px", endMarginClass[bottomPadding])} />
    </div>
  );
}
