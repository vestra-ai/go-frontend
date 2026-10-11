import Link from "next/link";
import { ArrowLeft } from "@/components/icons/generated";
import { FadeDock } from "@/components/shell/FadeDock";
import { usePageInResume } from "@/components/shell/PageTransition";
import { Screen } from "@/components/shell/Screen";
import { StickyDock } from "@/components/shell/StickyDock";
import { Button } from "@/components/ui/button";
import { chat as copy } from "@/data/seed/copy";
import type { TripId } from "@/data/types";
import { SKELETON_BAR } from "@/lib/skeleton";
import { chatHeaderClass, chatTitleClass } from "./ChatHeader";

// The five fact chips' widths (where, when, stay, budget, from), roughly what they measure with their usual labels.
const CHIP_WIDTHS = [88, 96, 82, 104, 84];

/** The pinned header: Back works from the start; the trip's name, crew, two actions and the fact chips are placeholders. */
function HeaderSkeleton({ tripId }: { tripId: TripId }) {
  return (
    <header className={chatHeaderClass}>
      <div className="flex items-center gap-1 pr-2 pl-3">
        <Button asChild variant="ghost" size="icon-xs" className="text-black">
          <Link href={`/trips/${tripId}`} aria-label={copy.header.back}>
            <ArrowLeft className="size-[22px]" strokeWidth={2} />
          </Link>
        </Button>
        <div aria-hidden className={chatTitleClass}>
          <span className="size-9 shrink-0 rounded-full bg-line" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-16 leading-[1.25] font-semibold tracking-body">
              <span className={SKELETON_BAR}>Goa with the crew</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-[18px] w-[57px] shrink-0 rounded-full bg-line" />
              <span className="text-13">
                <span className={SKELETON_BAR}>4 in the trip</span>
              </span>
            </span>
          </span>
        </div>
        <div aria-hidden className="flex shrink-0">
          {[0, 1].map((i) => (
            <span key={i} className="grid size-9 place-items-center">
              <span className="size-5 rounded-md bg-line" />
            </span>
          ))}
        </div>
      </div>
      <div aria-hidden className="mt-3.5 flex gap-2 overflow-hidden px-5">
        {CHIP_WIDTHS.map((width, i) => (
          <span key={i} className="h-9 shrink-0 rounded-full bg-line" style={{ width }} />
        ))}
      </div>
    </header>
  );
}

/** A message from someone else: their avatar, then a white bubble with the name over the text. */
function IncomingSkeleton({ name, text }: { name: string; text: string }) {
  return (
    <div className="flex items-end gap-2">
      <span className="size-[30px] shrink-0 rounded-full bg-line-2" />
      <div className="flex max-w-[72%] flex-col items-start">
        <div className="flex flex-col gap-0.5 rounded-5xl rounded-bl-none bg-white px-3.5 pt-2 pb-2.5 shadow-bubble wrap-anywhere">
          <span className="text-13 leading-[1.35] font-semibold tracking-caption">
            <span className={SKELETON_BAR}>{name}</span>
          </span>
          <div className="text-16 leading-[1.4] tracking-body">
            <span className={SKELETON_BAR}>{text}</span>
          </div>
        </div>
        <div className="h-2 w-full shrink-0" />
      </div>
    </div>
  );
}

/** One of mine: right-aligned, no avatar or name. Just the grey bubble: the text stays, invisible, so it is sized like the real one. */
function OutgoingSkeleton({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[78%] flex-col items-end">
        <div className="flex flex-col gap-1 rounded-5xl rounded-br-none bg-line-2 px-3.5 py-2.5 wrap-anywhere">
          <div className="text-16 leading-[1.4] tracking-body">
            <span className="text-transparent select-none">{text}</span>
          </div>
        </div>
        <div className="h-2 w-full shrink-0" />
      </div>
    </div>
  );
}

/** The composer's dock: the + button, the message pill and the mic, at their real sizes. */
function ComposerSkeleton() {
  const resume = usePageInResume();
  return (
    <StickyDock>
      <FadeDock variant="gradient" aria-hidden>
        <div ref={resume} className="relative flex items-center gap-2.5 px-4 pt-6 [[data-own]_&]:animate-page-in">
          <span className="size-12 shrink-0 rounded-full bg-white shadow-btn" />
          <span className="h-12 min-w-0 flex-1 rounded-full bg-white" />
          <span className="size-12 shrink-0 rounded-full bg-line-2" />
        </div>
      </FadeDock>
    </StickyDock>
  );
}

/**
 * What the trip chat draws while the session, the trip and then the room's first page are read (a refresh used to show
 * an empty canvas): the pinned header, a thread of placeholder bubbles resting on the composer (the room opens at its
 * newest messages), and the composer's dock. It is exactly one viewport tall and clipped, so a short phone never
 * scrolls a skeleton. Same containers and text styles as the real thread, so the room lands where this one stands.
 * Like the room, the thread and the composer slide up with the page while the header holds still.
 */
export function ChatSkeleton({ tripId }: { tripId: TripId }) {
  const resume = usePageInResume();
  return (
    <Screen>
      <div className="flex h-dvh flex-col overflow-hidden">
        <span role="status" className="sr-only">
          {copy.loading}
        </span>
        <HeaderSkeleton tripId={tripId} />
        <div
          ref={resume}
          aria-hidden
          className="flex flex-1 flex-col justify-end gap-2.5 overflow-hidden px-4 pt-4 pb-24 [[data-own]_&]:animate-page-in"
        >
          <IncomingSkeleton name="Priya" text="Anyone up for a long weekend somewhere warm?" />
          <OutgoingSkeleton text="I am in, checking dates now" />
          <IncomingSkeleton name="Go" text="Found a few stays that fit everyone’s budget and the dates" />
          <OutgoingSkeleton text="Perfect" />
          <IncomingSkeleton name="Meher" text="Booking the flights tonight, will share the tickets here" />
        </div>
        <ComposerSkeleton />
      </div>
    </Screen>
  );
}
