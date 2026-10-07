"use client";

import { useEffect, useState } from "react";
import { Phone } from "@/components/icons/generated";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { CALL_COPY, liveTranscriptFor } from "@/data/seed/calls";
import { FLIGHT_DETAILS, STAY_DETAILS } from "@/data/seed/bookings";
import type { TripId, VendorId } from "@/data/types";
import { assets } from "@/lib/assets";
import { splitEmoji } from "@/lib/emoji";
import { useHydrated, useLiveCalls, useStore } from "@/store";
import type { LiveCall } from "@/store/selectors";
import { BookingDetailsAccordion } from "./BookingDetailsAccordion";
import { CallHeroCard } from "./CallHeroCard";
import { LiveTranscript } from "./LiveTranscript";

const copy = CALL_COPY.listen;

// "🔇 Mute" → aria-hidden emoji + label, as LiveCallCard does for "🎧 Listen in".
function EmojiLabel({ text }: { text: string }) {
  const { emoji, label } = splitEmoji(text);
  return (
    <>
      <span aria-hidden>{emoji}</span> {label}
    </>
  );
}

type ListenSheetProps = {
  callId: VendorId;
  open: boolean;
  onOpenChange(open: boolean): void;
  /** Defaults to the one populated trip. */
  tripId?: TripId;
};

/** J5 "Listening in": hero, live transcript, booking details, mute / take over / stop / end (J-triphome-calls.md §1.4). */
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
    <BottomSheet open={open} onOpenChange={onOpenChange} top={96} aria-label={copy.title}>
      <SheetBody className="pb-[250px]">
        <SheetHeader title={copy.title} subtitle={copy.sub} closeLabel={copy.close} />
        <CallHeroCard who={who} emoji={call.emoji} tint={call.bg} startedAt={call.startedAt} />
        <LiveTranscript lines={liveTranscriptFor(call.id, call.asking)} who={who} />
        {details && (
          <BookingDetailsAccordion
            who={who}
            media={
              call.id === "villa" ? (
                // eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, cover
                <img src={assets.photos.villaSol.src} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo">
                  {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG wordmark */}
                  <img src={assets.indigo.src} alt="" width={assets.indigo.width} height={assets.indigo.height} className="w-7" />
                </span>
              )
            }
            rows={details}
            open={detailsOpen}
            onToggle={() => setListen(tripId, { detailsOpen: !detailsOpen })}
          />
        )}
      </SheetBody>
      <SheetFooter>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1 text-15 font-semibold"
            aria-pressed={muted}
            onClick={() => setListen(tripId, { muted: !muted })}
          >
            <EmojiLabel text={muted ? copy.unmute : copy.mute} />
          </Button>
          <Button
            type="button"
            variant={takenOver ? "success-ink" : "secondary"}
            size="lg"
            className="flex-1 text-15 font-semibold"
            aria-pressed={takenOver}
            onClick={() => setListen(tripId, { takenOver: !takenOver })}
          >
            <EmojiLabel text={takenOver ? copy.handBack : copy.takeOver} />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="lg" className="flex-1 font-semibold" onClick={() => onOpenChange(false)}>
            {copy.stop}
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
          {takenOver ? copy.noteTakenOver(who) : muted ? copy.noteMuted(who) : copy.noteDefault(who)}
        </p>
      </SheetFooter>
    </BottomSheet>
  );
}
