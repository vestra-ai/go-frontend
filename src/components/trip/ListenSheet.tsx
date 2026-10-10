"use client";

import { useState } from "react";
import { Phone } from "@/components/icons/generated";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { CALL_COPY } from "@/data/seed/calls";
import type { DetailRow } from "@/data/types";
import { splitEmoji } from "@/lib/emoji";
import { cn } from "@/lib/utils";
import type { CallModel } from "@/state/homeView";
import { BookingDetailsAccordion } from "./BookingDetailsAccordion";
import { CallHeroCard } from "./CallHeroCard";
import { LiveTranscript } from "./LiveTranscript";

const copy = CALL_COPY.listen;

// "🔇 Mute" → aria-hidden emoji + label.
function EmojiLabel({ text }: { text: string }) {
  const { emoji, label } = splitEmoji(text);
  return (
    <>
      <span aria-hidden>{emoji}</span> {label}
    </>
  );
}

// The mute toggle is an icon button in the hero card: emoji glyph + accessible label from the copy.
const muteLabel = {
  mute: splitEmoji(copy.mute).label,
  muteEmoji: splitEmoji(copy.mute).emoji,
  unmute: splitEmoji(copy.unmute).label,
  unmuteEmoji: splitEmoji(copy.unmute).emoji,
};

type ListenSheetProps = {
  /** The live `call` card (kept by the caller while the sheet animates out). */
  call: CallModel | null;
  /** The booking this call is about, when there is one. */
  details?: DetailRow[] | null;
  open: boolean;
  onOpenChange(open: boolean): void;
  /** "End call": the card action `stop`. */
  onEnd(): void;
  /** "Take over" / the mute control: those live on Go's listen-in page (the card action `listen`, CONTRACT-APP §4.11). */
  onGoPage(): void;
};

/**
 * "Listening in": hero, the call's lines so far, booking details, take over / end. Not mounted today: Listen in opens
 * Go's own page, which carries the audio, mute, take over and hand back. This sheet draws what the card itself says.
 */
export function ListenSheet({ call, details, open, onOpenChange, onEnd, onGoPage }: ListenSheetProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Fresh state each time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDetailsOpen(false);
  }

  if (!call) return null;
  const { who } = call;
  const muted = false;
  const takenOver = false;
  const lines = (call.card.transcript ?? (call.card.last_line ? [call.card.last_line] : [])).map((line) => ({
    speaker: line.who === "go" ? ("go" as const) : ("vendor" as const),
    text: line.text,
  }));

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={0} minTop={48} aria-label={copy.title}>
      {/* No page scroll: the transcript takes the leftover height and is the only thing that scrolls. The footer sits in
          the flow below it (not the usual absolute dock over a reserved padding), so the transcript always ends above
          the buttons whatever the footer's height: the home-indicator inset on iPhones, a wrapped note line. */}
      <SheetBody className="gap-3 overflow-hidden pb-0 [@media(max-height:720px)]:gap-2">
        <SheetHeader title={copy.title} subtitle={copy.sub} closeLabel={copy.close} />
        {details && (
          // Reserves the collapsed height; the expanded card grows downward over the call card and transcript instead of squeezing them.
          <div className="relative h-[46px] [@media(max-height:720px)]:h-[42px]">
            <BookingDetailsAccordion
              className={cn("absolute inset-x-0 top-0 z-10", detailsOpen && "shadow-sheet")}
              who={who}
              rows={details}
              open={detailsOpen}
              onToggle={() => setDetailsOpen((v) => !v)}
            />
          </div>
        )}
        <CallHeroCard
          who={who}
          emoji="📞"
          tint="bg-amber-soft"
          startedAt={call.startedAt ?? 0}
          action={
            <button
              type="button"
              aria-pressed={muted}
              aria-label={muted ? muteLabel.unmute : muteLabel.mute}
              onClick={onGoPage}
              className={cn(
                "grid size-9 cursor-pointer place-items-center rounded-full text-16 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/50",
                muted ? "bg-white/90" : "bg-white/15 hover:bg-white/25",
              )}
            >
              <span aria-hidden>{muted ? muteLabel.unmuteEmoji : muteLabel.muteEmoji}</span>
            </button>
          }
        />
        <LiveTranscript lines={lines} who={who} className="min-h-[120px] flex-1 shrink!" />
      </SheetBody>
      <SheetFooter className="relative shrink-0 pt-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={takenOver ? "success-ink" : "primary"}
            size="lg"
            className="flex-1 text-15 font-semibold"
            aria-pressed={takenOver}
            onClick={onGoPage}
          >
            <EmojiLabel text={takenOver ? copy.handBack : copy.takeOver} />
          </Button>
          <Button
            type="button"
            variant="danger"
            size="lg"
            className="flex-1 gap-1.5 font-semibold"
            onClick={() => {
              onEnd();
              onOpenChange(false);
            }}
          >
            <Phone className="size-[18px]" />
            {copy.end}
          </Button>
        </div>
        <p className="text-center text-13 leading-[1.35] text-muted">
          {takenOver ? copy.noteTakenOver(who) : muted ? copy.noteMuted(who) : copy.noteDefault()}
        </p>
      </SheetFooter>
    </BottomSheet>
  );
}
