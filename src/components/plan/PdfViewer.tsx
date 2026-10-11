"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Share, X } from "@/components/icons/generated";
import { PageCounterPill } from "@/components/plan/PageCounterPill";
import { PdfDocument, PdfPageSkeleton } from "@/components/plan/PdfDocument";
import { PdfPage } from "@/components/plan/PdfPage";
import { StickyDock } from "@/components/shell/StickyDock";
import { Button } from "@/components/ui/button";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import type { TicketDoc, TripId } from "@/data/types";
import { api } from "@/api/endpoints";
import { errorMessage } from "@/api/http";
import { toastGo } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/state";

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

/** A document that is a picture (a booking's file is a PDF or an image, CONTRACT-APP §4.10). */
function ImagePage({ file, alt }: { file: File; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the object URL lives exactly as long as this effect
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (!src) return <PdfPageSkeleton />;
  return (
    <div data-pdf-page className="w-full">
      {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL, nothing for next/image to optimise */}
      <img src={src} alt={alt} className="block w-full bg-white shadow-page" />
    </div>
  );
}

/**
 * Ticket viewer: sticky toolbar, the file's own pages in the document flow with a live page counter, sticky Save/Share
 * bar. The pages are the stored PDF itself (the e-ticket, the hotel voucher). The page drawn from the booking's fields
 * stands in only when there is no file to read, or it cannot be read. Give it the document's id as `key`: it holds one file.
 */
export function PdfViewer({ tripId, ticket, onClose }: PdfViewerProps) {
  const embedded = onClose !== undefined;
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(1);
  const [busy, setBusy] = useState(false);
  const raf = useRef(0);

  const { bookingId, documentId, fileName, mime } = ticket;
  const hasFile = Boolean(bookingId && documentId);
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState(false);
  /** The file's own page count once it is open; the booking's until then. */
  const [filePages, setFilePages] = useState<number | null>(null);
  const total = filePages ?? ticket.pages;
  const unreadable = useCallback(() => setFailed(true), []);
  // Every read of the booking mints a new signed link (valid 1 hour): the latest one is used, and never kept.
  const link = useRef(ticket.url);
  useEffect(() => {
    link.current = ticket.url;
  }, [ticket.url]);

  const toFile = useCallback((blob: Blob) => new File([blob], fileName, { type: mime ?? blob.type }), [fileName, mime]);

  // The stored file (covered people only): from the booking's signed link, else through the Server's redirect to a fresh one.
  useEffect(() => {
    if (!bookingId || !documentId) return;
    const ctrl = new AbortController();
    api
      .bookingDocument(tripId, bookingId, documentId, { url: link.current, signal: ctrl.signal })
      .then((blob) => setFile(toFile(blob)))
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      });
    return () => ctrl.abort();
  }, [tripId, bookingId, documentId, toFile]);

  /** For Save and Share: the file on screen, or a new read when it could not be shown. */
  async function fetchFile(): Promise<File | null> {
    if (file) return file;
    if (!bookingId || !documentId) return null;
    return toFile(await api.bookingDocument(tripId, bookingId, documentId, { url: link.current }));
  }

  async function run(job: (file: File) => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      const file = await fetchFile();
      if (file) await job(file);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) toastGo(errorMessage(err, copy.failed));
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    run(async (file) => {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toastGo(copy.saved);
    });

  // Share: the phone's own share menu with the file when it can; else "Share to the group", a normal message with the
  // file attached (CONTRACT-APP §4.10).
  const share = () =>
    run(async (file) => {
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: ticket.title });
        return;
      }
      sendMessage(tripId, {
        file: {
          blob: file,
          attachment: { kind: "file", name: file.name, mime: file.type || "application/pdf", sizeBytes: file.size, previewUrl: "" },
        },
      });
      toastGo(copy.sharedInChat);
    });

  const update = useCallback(() => {
    // Embedded: the viewer's own region scrolls and the "viewport" is its box; otherwise the page does.
    const box = embedded ? scrollRef.current : null;
    const scrollTop = box ? box.scrollTop : window.scrollY;
    const height = box ? box.clientHeight : window.innerHeight;
    const scrollHeight = box ? box.scrollHeight : document.documentElement.scrollHeight;
    if (scrollTop + height >= scrollHeight - 4) {
      setCurrent(total);
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
  }, [embedded, total]);

  useEffect(() => {
    const target: HTMLElement | Window = (embedded ? scrollRef.current : null) ?? window;
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

  const toolbar = (
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
        <span className="truncate text-13 tracking-caption text-muted">{copy.fileLine(ticket.fileName, total)}</span>
      </div>
      <Button variant="ghost" size="icon" aria-label={copy.download} aria-busy={busy} onClick={save}>
        <Download className="size-5" />
      </Button>
      <Button variant="ghost" size="icon" aria-label={copy.share} aria-busy={busy} onClick={share}>
        <Share className="size-5" />
      </Button>
    </div>
  );
  const content = (
    <>
      <div ref={pagesRef} aria-busy={hasFile && !file && !failed} className="flex flex-col items-center gap-4 px-3 pb-[120px] pt-5">
        {failed || !hasFile ? (
          <>
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
          </>
        ) : !file ? (
          <PdfPageSkeleton />
        ) : file.type.startsWith("image/") ? (
          <ImagePage file={file} alt={ticket.title} />
        ) : (
          <PdfDocument file={file} onPages={setFilePages} onFailed={unreadable} />
        )}
      </div>
      <StickyDock>
        <PageCounterPill current={Math.min(current, total)} total={total} />
        <div className="absolute inset-x-0 bottom-0 flex gap-2.5 bg-white px-4 pb-[max(28px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-1px_0_rgb(11_27_63/0.06)]">
          <Button variant="secondary" size="md" className="flex-1 gap-1.5 px-3.5 text-15 tracking-sm" aria-busy={busy} onClick={save}>
            <Download className="size-[18px]" />
            {copy.save}
          </Button>
          <Button variant="primary" size="md" className="flex-1 gap-2 text-15" aria-busy={busy} onClick={share}>
            <Share className="size-[18px]" />
            {copy.share}
          </Button>
        </div>
      </StickyDock>
    </>
  );

  // Embedded: the toolbar stays outside the scroll region, so a swipe down on it always drags the sheet, wherever the
  // pages are scrolled to.
  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-8xl bg-viewer">
        {toolbar}
        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scrollbar-none">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-viewer">
      {toolbar}
      {content}
    </div>
  );
}
