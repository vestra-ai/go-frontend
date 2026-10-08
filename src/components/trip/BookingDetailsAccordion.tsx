"use client";

import { useId } from "react";
import { ChevronDown } from "@/components/icons/generated";
import { Card } from "@/components/ui/card";
import { CALL_COPY } from "@/data/seed/calls";
import type { DetailRow } from "@/data/types";
import { cn } from "@/lib/utils";
import { DetailsList } from "./DetailsList";

const copy = CALL_COPY.listen;

type BookingDetailsAccordionProps = Omit<React.ComponentProps<typeof Card>, "children" | "title"> & {
  /** Vendor name: "Booking details · {who}". */
  who: string;
  rows: DetailRow[];
  open: boolean;
  onToggle(): void;
};

/**
 * "Booking details · {who}" accordion of the Listen sheet; the body is a DetailsList (§1.4). One compact line: the
 * sheet opens it downward over the call card and transcript, so the chevron points down while closed and up once open.
 */
export function BookingDetailsAccordion({ who, rows, open, onToggle, className, ...props }: BookingDetailsAccordionProps) {
  const bodyId = useId();
  return (
    <Card
      variant="outline"
      radius="2xl"
      data-slot="booking-details-accordion"
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? bodyId : undefined}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left [@media(max-height:720px)]:py-2.5"
      >
        <span className="min-w-0 flex-1 truncate text-15 font-semibold">{copy.details(who)}</span>
        <ChevronDown
          className={cn("size-[18px] shrink-0 text-muted transition-transform duration-200", open && "rotate-180")}
          strokeWidth={2.4}
        />
      </button>
      {open && (
        <div
          id={bodyId}
          className="px-4 pb-3.5 transition-[opacity,translate] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0"
        >
          <DetailsList rows={rows} />
        </div>
      )}
    </Card>
  );
}
