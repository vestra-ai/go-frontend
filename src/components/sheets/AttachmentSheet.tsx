"use client";

import { useState } from "react";
import { Download, Share, X } from "@/components/icons/generated";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { ShareInviteSheet } from "@/components/shell/ShareInviteSheet";
import { StickyDock } from "@/components/shell/StickyDock";
import { Button } from "@/components/ui/button";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import { chat } from "@/data/seed/copy";
import type { Attachment, TripId } from "@/data/types";
import { formatBytes } from "@/lib/media";
import { inviteLink } from "@/lib/share";
import { toastGo } from "@/lib/toast";
import { useStore } from "@/store";
import { selectTrip } from "@/store/selectors";

const viewer = BOOKINGS_COPY.viewer;
const copy = chat.attachment;

type Viewable = Extract<Attachment, { kind: "image" | "file" }>;

type AttachmentSheetProps = {
  tripId: TripId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kept by the caller while the sheet animates out. */
  attachment: Viewable | null;
};

function describe(a: Viewable) {
  return a.kind === "image"
    ? { title: copy.photo, sub: copy.photoSub(a.width, a.height), fileName: copy.photoFile, emoji: "📷", saved: copy.photoSaved }
    : { title: a.name, sub: copy.fileSub(formatBytes(a.size)), fileName: a.name, emoji: "📄", saved: copy.fileSaved };
}

/** A photo or PDF I sent, in the same viewer chrome as the e-ticket (toolbar, Save / Share bar), full screen. */
export function AttachmentSheet({ tripId, open, onOpenChange, attachment }: AttachmentSheetProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const trip = useStore((s) => selectTrip(s, tripId));
  const info = attachment ? describe(attachment) : null;
  const src = attachment?.src;

  function save() {
    if (!src || !info) return;
    const link = document.createElement("a");
    link.href = src;
    link.download = info.fileName;
    link.click();
    toastGo(info.saved);
  }

  return (
    // Not draggable: a drag never fights the document, and there is no grab bar over the toolbar.
    <BottomSheet open={open} onOpenChange={onOpenChange} inset={0} draggable={false} aria-label={info?.title}>
      {attachment && info && (
        <div className="flex min-h-0 flex-1 flex-col bg-viewer">
          <div className="flex shrink-0 items-center gap-2 bg-white px-3 pt-safe-hero pb-2.5 shadow-[0_1px_0_rgb(11_27_63/0.06)]">
            <Button type="button" variant="ghost" size="icon" aria-label={viewer.close} onClick={() => onOpenChange(false)}>
              <X className="size-[22px]" strokeWidth={2} />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col gap-px">
              <h1 className="truncate text-16 font-semibold leading-[1.3] tracking-body">{info.title}</h1>
              <span className="truncate text-13 tracking-caption text-muted">{info.sub}</span>
            </div>
            <Button variant="ghost" size="icon" aria-label={viewer.download} disabled={!src} onClick={save}>
              <Download className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={viewer.share} onClick={() => setShareOpen(true)}>
              <Share className="size-5" />
            </Button>
          </div>

          {attachment.kind === "image" ? (
            <div className="flex min-h-0 flex-1 items-center justify-center p-3 pb-[120px]">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing for next/image to optimise */}
              <img
                src={attachment.src}
                alt={copy.photo}
                className="max-h-full max-w-full rounded-lg object-contain shadow-[0_2px_6px_rgb(0_0_0/0.12)]"
              />
            </div>
          ) : src ? (
            // The browser's own PDF viewer, over the object URL made when the file was picked.
            <iframe src={src} title={copy.viewerLabel(info.title)} className="min-h-0 w-full flex-1 border-0 bg-white pb-[100px]" />
          ) : (
            <p className="m-auto max-w-[260px] px-4 pb-[120px] text-center text-15 leading-[1.4] text-muted">{copy.fileGone}</p>
          )}

          <StickyDock>
            <div className="absolute inset-x-0 bottom-0 flex gap-2.5 bg-white px-4 pb-[max(28px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-1px_0_rgb(11_27_63/0.06)]">
              <Button variant="secondary" size="md" className="flex-1 gap-1.5 px-3.5 text-15 tracking-sm" disabled={!src} onClick={save}>
                <Download className="size-[18px]" />
                {viewer.save}
              </Button>
              <Button variant="primary" size="md" className="flex-1 gap-2 text-15" onClick={() => setShareOpen(true)}>
                <Share className="size-[18px]" />
                {viewer.share}
              </Button>
            </div>
          </StickyDock>
          {trip && (
            <ShareInviteSheet
              trip={trip}
              open={shareOpen}
              onOpenChange={setShareOpen}
              nested
              // The link is a mock: the prototype has no file hosting.
              file={{ title: info.title, sub: info.sub, url: `${inviteLink(trip)}/files/${info.fileName}`, emoji: info.emoji }}
            />
          )}
        </div>
      )}
    </BottomSheet>
  );
}
