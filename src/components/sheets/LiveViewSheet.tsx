"use client";

import { useState } from "react";
import { CheckBadge } from "@/components/common/CheckBadge";
import { LiveDot } from "@/components/common/LiveDot";
import { Lock, X } from "@/components/icons/generated";
import { BottomSheet } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import { cards } from "@/data/seed/copy";
import { cn } from "@/lib/utils";
import type { WorkingModel } from "@/state/workingView";

const copy = cards.working;

const STATUS_TONE = { muted: "text-muted", success: "text-success-ink", danger: "text-danger" } as const;

type LiveViewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The `working` card as it is now: the sheet follows it while Go replaces it in place. */
  work: WorkingModel | null;
};

/**
 * Go's screen, full height, in the viewer chrome (contract 1.3, `WorkingCard.live_url`). While Go is at it and the card
 * carries a stream, the stream is framed over the latest picture; a fresh link from Go swaps the frame; once the task is
 * done or failed (the link comes back `null`) the frame goes and the final picture stays. All the steps sit under it,
 * with how the task stands (Live, Done, Failed) on their heading's line.
 */
export function LiveViewSheet({ open, onOpenChange, work }: LiveViewSheetProps) {
  // The frame is only mounted while the sheet is open, so closing it ends the stream at once.
  const liveUrl = open ? work?.liveUrl : undefined;
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} inset={0} grabber={false} aria-label={work?.title}>
      {work && (
        <div className="flex min-h-0 flex-1 flex-col bg-viewer">
          <div className="flex shrink-0 items-center gap-2 bg-white px-3 pt-safe-hero pb-2.5 shadow-[0_1px_0_rgb(11_27_63/0.06)]">
            <Button type="button" variant="ghost" size="icon" aria-label={BOOKINGS_COPY.viewer.close} onClick={() => onOpenChange(false)}>
              <X className="size-[22px]" strokeWidth={2} />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col gap-px pr-1">
              <h1 className="truncate text-16 font-semibold leading-[1.3] tracking-body">{work.title}</h1>
              <span className="truncate text-13 tracking-caption text-muted">{work.line}</span>
            </div>
          </div>

          {work.address && (
            <div className="flex shrink-0 items-center gap-1.5 bg-surface-2 px-4 py-[7px] text-13 text-muted">
              <Lock className="size-[13px] shrink-0" />
              <span className="truncate">{work.address}</span>
            </div>
          )}

          <div className="relative min-h-0 flex-1">
            {work.screenshot ? (
              // eslint-disable-next-line @next/next/no-img-element -- the latest picture of Go's screen, shown whole at its own size
              <img src={work.screenshot} alt={copy.picture} className="absolute inset-0 size-full object-contain" />
            ) : (
              !liveUrl && <p className="absolute inset-0 m-auto h-fit max-w-[260px] px-4 text-center text-15 leading-[1.4] text-muted">{copy.empty}</p>
            )}
            {liveUrl && <LiveFrame key={liveUrl} url={liveUrl} />}
          </div>

          <div className="flex max-h-[40%] shrink-0 flex-col gap-1 overflow-y-auto overscroll-contain bg-white px-4 pt-3.5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-1px_0_rgb(11_27_63/0.06)] scrollbar-none">
            {/* How the task stands sits here, by the steps, and not in the header's corner: there "Done" read as a button that closes the sheet. */}
            <div className="flex items-center justify-between gap-3">
              {work.steps.length > 0 && <span className="text-12 font-bold tracking-caption text-muted">{copy.steps}</span>}
              <span aria-live="polite" className={cn("ml-auto flex shrink-0 items-center gap-1.5 text-13 font-semibold", work.liveUrl ? "text-success-ink" : STATUS_TONE[work.status.tone])}>
                {work.liveUrl && <LiveDot size={8} />}
                {work.liveUrl ? copy.live : work.status.text}
              </span>
            </div>
            {work.steps.length > 0 && (
              <ol className="flex flex-col">
                {work.steps.map((step, i) => (
                  <li key={i} aria-current={step.state === "doing" ? "step" : undefined} className="flex items-start gap-2.5 py-1.5">
                    <StepMark state={step.state} />
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-15 leading-[1.35] wrap-anywhere",
                        step.state === "doing" && "font-semibold",
                        step.state === "todo" && "text-muted",
                        step.state === "failed" && "text-danger",
                      )}
                    >
                      {step.text}
                      <span className="sr-only"> ({copy.stepState[step.state] ?? step.state})</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

/**
 * One stream link in a frame, hidden until it has loaded so the latest picture shows through meanwhile. It is keyed by
 * the link: a fresh link from Go is a fresh frame, never a second entry in the Back history of this one.
 */
function LiveFrame({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <iframe
      src={url}
      title={copy.screen}
      // View-only: its scripts and its own origin (the stream's connection), and nothing else: no forms, no pop-ups, no
      // leaving the app.
      sandbox="allow-scripts allow-same-origin"
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      // Its own backdrop: once the stream is up, the older picture must not show through a see-through page.
      className={cn("absolute inset-0 size-full border-0 bg-viewer transition-opacity duration-220", loaded ? "opacity-100" : "opacity-0")}
    />
  );
}

function StepMark({ state }: { state: WorkingModel["steps"][number]["state"] }) {
  if (state === "done") return <CheckBadge size={18} className="mt-px" />;
  if (state === "failed") {
    return (
      <span aria-hidden className="mt-px inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-danger text-white">
        <X className="size-[11px]" strokeWidth={3.5} />
      </span>
    );
  }
  return (
    <span aria-hidden className={cn("mt-px inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border-2", state === "doing" ? "border-success-ring" : "border-line-3")}>
      {state === "doing" && <LiveDot size={8} />}
    </span>
  );
}
