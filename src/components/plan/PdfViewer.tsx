"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Share, X } from "@/components/icons/generated";
import { PageCounterPill } from "@/components/plan/PageCounterPill";
import { PdfPage } from "@/components/plan/PdfPage";
import { ShareInviteSheet } from "@/components/shell/ShareInviteSheet";
import { StickyDock } from "@/components/shell/StickyDock";
import { Button } from "@/components/ui/button";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import type { TicketDoc, TripId } from "@/data/types";
import { toastGo } from "@/lib/toast";
import { inviteLink } from "@/lib/share";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { selectTrip } from "@/store/selectors";

const copy = BOOKINGS_COPY.viewer;

type PdfViewerProps = {
  tripId: TripId;
  ticket: TicketDoc;
  /**
   * Set when the viewer lives in a sheet over another screen (the chat): it scrolls inside its own region instead of
   * the page, and the close button calls this instead of linking to the bookings list.
   */
  onClose?: () => void;
};

/** Ticket PDF viewer: sticky toolbar, pages in the document flow with a live page counter, sticky Save/Share bar. */
export function PdfViewer({ tripId, ticket, onClose }: PdfViewerProps) {
  const embedded = onClose !== undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(1);
  // Both Share buttons open the same share sheet the trip pages use.
  const [shareOpen, setShareOpen] = useState(false);
  const trip = useStore((s) => selectTrip(s, tripId));
  const raf = useRef(0);

  const update = useCallback(() => {
    // Embedded: the viewer's own region scrolls and the "viewport" is its box; otherwise the page does.
    const box = embedded ? rootRef.current : null;
    const scrollTop = box ? box.scrollTop : window.scrollY;
    const height = box ? box.clientHeight : window.innerHeight;
    const scrollHeight = box ? box.scrollHeight : document.documentElement.scrollHeight;
    if (scrollTop + height >= scrollHeight - 4) {
      setCurrent(ticket.pages);
      return;
    }
    const top = box ? box.getBoundingClientRect().top : 0;
    const mid = top + height / 2;
    const pages = Array.from(pagesRef.current?.querySelectorAll<HTMLElement>("[data-pdf-page]") ?? []);
    const hit = pages.findIndex((p) => {
      const r = p.getBoundingClientRect();
      return r.top <= mid && mid <= r.bottom;
    });
    if (hit >= 0) setCurrent(hit + 1);
  }, [embedded, ticket.pages]);

  useEffect(() => {
    const target: HTMLElement | Window = (embedded ? rootRef.current : null) ?? window;
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(update);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, [embedded, update]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex flex-1 flex-col bg-viewer",
        embedded && "min-h-0 overflow-y-auto overscroll-contain rounded-t-8xl scrollbar-none",
      )}
    >
      <div
        className={cn(
          "sticky top-0 z-30 flex shrink-0 items-center gap-2 bg-white px-3 pb-2.5 shadow-[0_1px_0_rgb(11_27_63/0.06)]",
          embedded ? "pt-3" : "pt-safe-hero",
        )}
      >
        {onClose ? (
          <Button type="button" variant="ghost" size="icon" aria-label={copy.close} onClick={onClose}>
            <X className="size-[22px]" strokeWidth={2} />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/trips/${tripId}/bookings`} aria-label={copy.close}>
              <X className="size-[22px]" strokeWidth={2} />
            </Link>
          </Button>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <h1 className="truncate text-16 font-semibold leading-[1.3] tracking-body">{ticket.title}</h1>
          <span className="truncate text-13 tracking-caption text-muted">{copy.fileLine(ticket.fileName, ticket.pages)}</span>
        </div>
        <Button variant="ghost" size="icon" aria-label={copy.download} onClick={() => toastGo("Ticket PDF downloaded")}>
          <Download className="size-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={copy.share} onClick={() => setShareOpen(true)}>
          <Share className="size-5" />
        </Button>
      </div>
      <div ref={pagesRef} className="flex flex-col items-center gap-4 px-3 pb-[120px] pt-5">
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
      <StickyDock>
        <PageCounterPill current={current} total={ticket.pages} />
        <div className="absolute inset-x-0 bottom-0 flex gap-2.5 bg-white px-4 pb-[max(28px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-1px_0_rgb(11_27_63/0.06)]">
          <Button variant="secondary" size="md" className="flex-1 gap-1.5 px-3.5 text-15 tracking-sm" onClick={() => toastGo("Saved to your phone")}>
            <Download className="size-[18px]" />
            {copy.save}
          </Button>
          <Button variant="primary" size="md" className="flex-1 gap-2 text-15" onClick={() => setShareOpen(true)}>
            <Share className="size-[18px]" />
            {copy.share}
          </Button>
        </div>
      </StickyDock>
      {/* Stacks above the ticket sheet when the viewer is embedded in the chat. */}
      {trip && (
        <ShareInviteSheet
          trip={trip}
          open={shareOpen}
          onOpenChange={setShareOpen}
          nested={embedded}
          // The top card shows this ticket, and every action sends it. (The link is a mock: the prototype has no file hosting.)
          file={{
            title: ticket.title,
            sub: copy.fileLine(ticket.fileName, ticket.pages),
            url: `${inviteLink(trip)}/files/${ticket.fileName}`,
            emoji: "📄",
          }}
        />
      )}
    </div>
  );
}
