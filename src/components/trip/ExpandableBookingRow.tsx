"use client";

import { useId } from "react";
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

/** Accordion done row (Stay / Flights) for DoneList; a hairline separates it from a preceding row (§1.2 E.1). */
export function ExpandableBookingRow({ emoji, title, sub, live, open, onToggle, children }: ExpandableBookingRowProps) {
  const bodyId = useId();
  return (
    <div
      data-slot="expandable-booking-row"
      data-row=""
      className="[[data-row]+&]:border-t [[data-row]+&]:border-line"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? bodyId : undefined}
        onClick={onToggle}
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
      {open && (
        <div
          id={bodyId}
          className="flex flex-col gap-2.5 pt-0.5 pb-3.5 transition-[opacity,translate] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0"
        >
          {children}
        </div>
      )}
    </div>
  );
}
