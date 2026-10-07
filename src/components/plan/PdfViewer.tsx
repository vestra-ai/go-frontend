"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Share, X } from "@/components/icons/generated";
import { PageCounterPill } from "@/components/plan/PageCounterPill";
import { PdfPage } from "@/components/plan/PdfPage";
import { Button } from "@/components/ui/button";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import type { TicketDoc, TripId } from "@/data/types";
import { toastGo } from "@/lib/toast";

const copy = BOOKINGS_COPY.viewer;

/** Ticket PDF viewer: toolbar, scrolling pages with a live page counter, Save/Share bar. */
export function PdfViewer({ tripId, ticket }: { tripId: TripId; ticket: TicketDoc }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(1);
  const raf = useRef(0);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
      setCurrent(ticket.pages);
      return;
    }
    const rect = el.getBoundingClientRect();
    const mid = rect.top + el.clientHeight / 2;
    const pages = Array.from(el.querySelectorAll<HTMLElement>("[data-pdf-page]"));
    const hit = pages.findIndex((p) => {
      const r = p.getBoundingClientRect();
      return r.top <= mid && mid <= r.bottom;
    });
    if (hit >= 0) setCurrent(hit + 1);
  }, [ticket.pages]);

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(update);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div className="relative flex h-full flex-col bg-viewer">
      <div className="flex shrink-0 items-center gap-2 bg-white px-3 pb-2.5 pt-safe shadow-[0_1px_0_rgb(11_27_63/0.06)]">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/trips/${tripId}/bookings`} aria-label={copy.close}>
            <X className="size-[22px]" strokeWidth={2} />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <h1 className="truncate text-16 font-semibold leading-[1.3] tracking-body">{ticket.title}</h1>
          <span className="truncate text-13 tracking-caption text-muted">{copy.fileLine(ticket.fileName, ticket.pages)}</span>
        </div>
        <Button variant="ghost" size="icon" aria-label={copy.download} onClick={() => toastGo("Ticket PDF downloaded")}>
          <Download className="size-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={copy.share} onClick={() => toastGo("Ticket shared to Goa crew")}>
          <Share className="size-5" />
        </Button>
      </div>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-3 pb-[120px] pt-5 scrollbar-none"
      >
        <div data-pdf-page className="flex w-full justify-center">
          <PdfPage ticket={ticket} />
        </div>
        <div
          data-pdf-page
          aria-hidden
          className="flex h-[120px] w-full max-w-[360px] flex-col gap-1.5 bg-white p-[22px] font-sans shadow-[0_2px_6px_rgb(0_0_0/0.12)]"
        >
          {["80%", "70%", "76%"].map((w) => (
            <span key={w} className="block h-2.5 rounded-xs bg-skeleton" style={{ width: w }} />
          ))}
        </div>
      </div>
      <PageCounterPill current={current} total={ticket.pages} />
      <div className="absolute inset-x-0 bottom-0 flex gap-2.5 bg-white px-4 pb-[max(28px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-1px_0_rgb(11_27_63/0.06)]">
        <Button variant="secondary" size="md" className="flex-1 gap-1.5 px-3.5 text-15 tracking-sm" onClick={() => toastGo("Saved to your phone")}>
          <Download className="size-[18px]" />
          {copy.save}
        </Button>
        <Button variant="primary" size="md" className="flex-1 gap-2 text-15" onClick={() => toastGo("Ticket shared to Goa crew")}>
          <Share className="size-[18px]" />
          {copy.share}
        </Button>
      </div>
    </div>
  );
}
