"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, X } from "@/components/icons/generated";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import { cards } from "@/data/seed/copy";
import { cn } from "@/lib/utils";

const copy = cards.page;

/** What Go's page posts to the app when it is finished with (the login was detected). */
const ENDED = "vestra:ended";

type GoPageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The page to frame, exactly as Go sent it (kept by the caller while the sheet animates out). */
  url: string | null;
  title: string;
};

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

/**
 * A page Go answered a tap with, framed full height in the viewer chrome: the "Log in to ixigo" card's login view
 * (contract 1.3). It is never opened in a new tab. The sheet closes when the page posts `{ type: "vestra:ended" }`;
 * the caller also closes it when Go replaces the card ("Logged in").
 */
export function GoPageSheet({ open, onOpenChange, url, title }: GoPageSheetProps) {
  const host = url ? hostOf(url) : "";
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} inset={0} grabber={false} aria-label={title}>
      {url && (
        <div className="flex min-h-0 flex-1 flex-col bg-viewer">
          <div className="flex shrink-0 items-center gap-2 bg-white px-3 pt-safe-hero pb-2.5 shadow-[0_1px_0_rgb(11_27_63/0.06)]">
            <Button type="button" variant="ghost" size="icon" aria-label={BOOKINGS_COPY.viewer.close} onClick={() => onOpenChange(false)}>
              <X className="size-[22px]" strokeWidth={2} />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col gap-px">
              <h1 className="truncate text-16 font-semibold leading-[1.3] tracking-body">{title}</h1>
              {host && (
                <span className="flex items-center gap-1 text-13 tracking-caption text-muted">
                  <Lock className="size-[12px] shrink-0" />
                  <span className="truncate">{host}</span>
                </span>
              )}
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            <p className="absolute inset-0 m-auto h-fit text-center text-15 text-muted">{copy.opening}</p>
            {/* Only mounted while the sheet is open, so closing it leaves the page at once. */}
            {open && <PageFrame key={url} url={url} title={title} onEnded={() => onOpenChange(false)} />}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function PageFrame({ url, title, onEnded }: { url: string; title: string; onEnded: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const ended = useRef(onEnded);
  useEffect(() => {
    ended.current = onEnded;
  });

  useEffect(() => {
    // Only this frame's own page may end it: a message from any other window is not listened to.
    const onMessage = (event: MessageEvent) => {
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      const data: unknown = event.data;
      if (typeof data === "object" && data !== null && (data as { type?: unknown }).type === ENDED) ended.current();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frame}
      src={url}
      title={title}
      // A page to sign in on: its scripts, its own origin and its forms. No pop-ups, and it cannot take the app elsewhere.
      sandbox="allow-scripts allow-same-origin allow-forms"
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      className={cn("absolute inset-0 size-full border-0 bg-white transition-opacity duration-220", loaded ? "opacity-100" : "opacity-0")}
    />
  );
}
