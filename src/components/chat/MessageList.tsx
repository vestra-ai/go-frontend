import type { ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils";

// Bottom padding matches the composer in front of the list: default 96, reply tray 150, ask-Go tray 190.
const padClass = {
  96: "pb-24",
  150: "pb-[150px]",
  190: "pb-[190px]",
} as const;

// DESIGN-ASSUMPTION: the sentinel sits above the bottom padding, so `scrollIntoView({block:'end'})` alone
// would leave the last message under the composer (the design's bug). A matching scroll margin scrolls past it.
const endMarginClass = {
  96: "scroll-mb-24",
  150: "scroll-mb-[150px]",
  190: "scroll-mb-[190px]",
} as const;

type MessageListProps = {
  bottomPadding: keyof typeof padClass;
  /** End sentinel; pass the same ref to `useScrollToEnd`. */
  anchorRef: RefObject<HTMLSpanElement | null>;
  children: ReactNode;
};

/** The chat thread, in the document flow (the body scrolls). No date separators, timestamps, receipts or typing rows (as designed). */
export function MessageList({ bottomPadding, anchorRef, children }: MessageListProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-2.5 px-4 pt-4", padClass[bottomPadding])}>
      {children}
      <span ref={anchorRef} data-chat-end="" className={cn("block h-px", endMarginClass[bottomPadding])} />
    </div>
  );
}
