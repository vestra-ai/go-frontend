"use client";

import { useEffect, useState } from "react";
import { Phone } from "@/components/icons/generated";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { CALL_COPY, liveTranscriptFor } from "@/data/seed/calls";
import { FLIGHT_DETAILS, STAY_DETAILS } from "@/data/seed/bookings";
import type { TripId, VendorId } from "@/data/types";
import { splitEmoji } from "@/lib/emoji";
import { cn } from "@/lib/utils";
import { useHydrated, useLiveCalls, useStore } from "@/store";
import type { LiveCall } from "@/store/selectors";
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
  callId: VendorId;
  open: boolean;
  onOpenChange(open: boolean): void;
  /** Defaults to the one populated trip. */
  tripId?: TripId;
};

/** J5 "Listening in": hero (with mute), live transcript, booking details, take over / end (J-triphome-calls.md §1.4). */
export function ListenSheet({ callId, open, onOpenChange, tripId = "goa" }: ListenSheetProps) {
  const hydrated = useHydrated();
  const live = useLiveCalls(tripId).find((c) => c.id === callId);
  const { muted, takenOver, detailsOpen } = useStore((s) => s.home[tripId].listen);
  const setListen = useStore((s) => s.setListen);
  const endCall = useStore((s) => s.endCall);

  // Keep the last call on screen while the sheet animates closed after "End call".
  const [lastCall, setLastCall] = useState<LiveCall | undefined>(live);
  if (live && live !== lastCall) setLastCall(live);
  const call = live ?? lastCall;

  // Fresh state each time the sheet opens.
  useEffect(() => {
    if (open) setListen(tripId, { muted: false, takenOver: false, detailsOpen: false });
  }, [open, tripId, setListen]);

  // Not a live call: close ourselves.
  useEffect(() => {
    if (open && hydrated && !live) onOpenChange(false);
  }, [open, hydrated, live, onOpenChange]);

  if (!call) return null;
  const { who } = call;
  const details = call.id === "villa" ? STAY_DETAILS : call.id === "indigo" ? FLIGHT_DETAILS : null;

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
              onToggle={() => setListen(tripId, { detailsOpen: !detailsOpen })}
            />
          </div>
        )}
        <CallHeroCard
          who={who}
          emoji={call.emoji}
          tint={call.bg}
          startedAt={call.startedAt}
          action={
            <button
              type="button"
              aria-pressed={muted}
              aria-label={muted ? muteLabel.unmute : muteLabel.mute}
              onClick={() => setListen(tripId, { muted: !muted })}
              className={cn(
                "grid size-9 cursor-pointer place-items-center rounded-full text-16 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/50",
                muted ? "bg-white/90" : "bg-white/15 hover:bg-white/25",
              )}
            >
              <span aria-hidden>{muted ? muteLabel.unmuteEmoji : muteLabel.muteEmoji}</span>
            </button>
          }
        />
        <LiveTranscript lines={liveTranscriptFor(call.id, call.asking)} who={who} className="min-h-[120px] flex-1 shrink!" />
      </SheetBody>
      <SheetFooter className="relative shrink-0 pt-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={takenOver ? "success-ink" : "primary"}
            size="lg"
            className="flex-1 text-15 font-semibold"
            aria-pressed={takenOver}
            onClick={() => setListen(tripId, { takenOver: !takenOver })}
          >
            <EmojiLabel text={takenOver ? copy.handBack : copy.takeOver} />
          </Button>
          <Button
            type="button"
            variant="danger"
            size="lg"
            className="flex-1 gap-1.5 font-semibold"
            onClick={() => {
              endCall(tripId, call.id, { withOutcome: true });
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
