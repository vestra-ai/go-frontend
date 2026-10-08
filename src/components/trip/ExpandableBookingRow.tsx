"use client";

import { useId, useRef } from "react";
import { ChevronDown } from "@/components/icons/generated";
import { Badge } from "@/components/ui/badge";
import { CheckBadge } from "@/components/common/CheckBadge";
import { EmojiTile } from "@/components/common/EmojiTile";
import { CALL_COPY } from "@/data/seed/calls";
import { cn } from "@/lib/utils";

type ExpandableBookingRowProps = {
  emoji: string;
  title: string;
  sub: string;
  /** Go is on a call with this booking's vendor: "On a call" badge. */
  live: boolean;
  open: boolean;
  onToggle(): void;
  /** Body shown while open (live panel or call options, preview link, details). */
  children: React.ReactNode;
};

/**
 * Accordion done row (Stay / Flights) for DoneList; a hairline separates it from a preceding row (§1.2 E.1).
 * Open, the body is indented under the row's icon beside a thin dashed rail, so it is clear which content belongs to
 * the row. It expands and collapses with a height + fade transition.
 */
export function ExpandableBookingRow({ emoji, title, sub, live, open, onToggle, children }: ExpandableBookingRowProps) {
  const bodyId = useId();
  const rowRef = useRef<HTMLDivElement>(null);
  // Set by a tap on the header, so only a row the user just expanded scrolls itself into view. A row opened by a
  // deep link (`?open=`) plays the same expand transition but must leave the scroll alone.
  const tapped = useRef(false);
  return (
    <div
      ref={rowRef}
      data-slot="expandable-booking-row"
      data-row=""
      // Scroll margins keep the row clear of the collapsing header above and the chat dock below when it scrolls in.
      className="scroll-mt-[calc(env(safe-area-inset-top,0px)+100px)] scroll-mb-[132px] [[data-row]+&]:border-t [[data-row]+&]:border-line"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => {
          tapped.current = true;
          onToggle();
        }}
        className="flex w-full cursor-pointer items-center gap-2.5 py-[11px] text-left text-ink"
      >
        <span className="relative shrink-0">
          <EmojiTile emoji={emoji} size={36} shape="circle" tint="surface-2" />
          <CheckBadge size={16} className="absolute -right-[3px] -bottom-[3px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="text-15 font-semibold text-muted">{title}</span>
          <span className="text-13 tracking-caption text-muted">{sub}</span>
        </span>
        {live && (
          <Badge variant="success-soft" size="md-bold" live className="gap-[5px]">
            {CALL_COPY.panel.badge}
          </Badge>
        )}
        <ChevronDown
          className={cn("size-[18px] shrink-0 text-muted transition-transform duration-200", open && "rotate-180")}
          strokeWidth={2.4}
        />
      </button>
      {/* Always mounted so the height can animate both ways (0fr ↔ 1fr); `inert` keeps the closed body out of focus and AT. */}
      <div
        id={bodyId}
        inert={!open}
        // Once a row the user tapped open has finished growing, bring the whole row into view (it may extend below the fold).
        onTransitionEnd={(e) => {
          if (e.target !== e.currentTarget || e.propertyName !== "grid-template-rows") return;
          const byUser = tapped.current;
          tapped.current = false;
          if (open && byUser) rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out)] motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        {/* The negative margin / padding pair keeps focus rings from being clipped by the overflow. */}
        <div className="-mx-1 min-h-0 overflow-hidden px-1">
          <div className="pt-0.5 pb-3.5">
            {/* A thin dashed rail under the icon's centre (the icon is 36px wide) ties the content to its row. A CSS dashed
                border can't set dash length or gap, so the rail is a gradient: 5px dashes, 7px gaps. */}
            <div className="relative ml-[17px] flex flex-col gap-2 pl-3.5">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-[1.5px] bg-[repeating-linear-gradient(to_bottom,var(--color-line-2)_0_5px,transparent_5px_12px)]"
              />
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
