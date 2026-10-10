"use client";

import { useEffect, useRef, useState } from "react";
import { errorMessage } from "@/api/http";
import { toastGo } from "@/lib/toast";
import { Download } from "@/components/icons/generated";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/common/Eyebrow";
import { CALL_COPY, RECORDING_RATES } from "@/data/seed/calls";
import type { TripId } from "@/data/types";
import { formatClock, formatDay } from "@/lib/dates";
import { isHttpUrl } from "@/lib/links";
import { shareCallRecording } from "@/state";
import type { CallModel } from "@/state/homeView";
import { OutcomeBanner } from "./OutcomeBanner";
import { RecordingPlayer } from "./RecordingPlayer";
import { TranscriptRow } from "./TranscriptRow";

const copy = CALL_COPY.recording;

type RecordingSheetProps = {
  tripId: TripId;
  /** The ended call (kept by the caller while the sheet animates out). */
  call: CallModel | null;
  open: boolean;
  onOpenChange(open: boolean): void;
};

/** "2:48" */
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
/** "2 min 48 s" */
const spoken = (seconds: number) => (seconds >= 60 ? `${Math.floor(seconds / 60)} min ${Math.floor(seconds % 60)} s` : `${Math.floor(seconds)} s`);

/** The outcome's first sentence is the headline; the rest is the detail line. */
function splitOutcome(outcome: string): { headline: string; body: string } {
  const m = /^(.+?[.!?])\s+(.+)$/.exec(outcome.trim());
  return m ? { headline: m[1].replace(/[.]$/, ""), body: m[2] } : { headline: outcome.trim(), body: "" };
}

/**
 * "Call with {who}": the ended `call` card as the call's record (CONTRACT-APP §4.11): its outcome, the recording Go
 * kept (`recording_url`, a signed link that expires), the transcript, and "Share in group chat".
 */
export function RecordingSheet({ tripId, call, open, onOpenChange }: RecordingSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={0} minTop={48} aria-label={call ? copy.label(call.who) : undefined}>
      {call && <Recording key={call.cardId} tripId={tripId} call={call} open={open} />}
    </BottomSheet>
  );
}

function Recording({ tripId, call, open }: { tripId: TripId; call: CallModel; open: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<(typeof RECORDING_RATES)[number]>(1);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(call.card.duration_s ?? 0);
  const [sharing, setSharing] = useState(false);

  const url = call.card.recording_url && isHttpUrl(call.card.recording_url) ? call.card.recording_url : null;
  const ended = call.card.ended_at ? new Date(call.card.ended_at) : null;
  const when = ended ? `${formatDay(ended)}, ${formatClock(ended)}` : "";
  const outcome = splitOutcome(call.outcome ?? "");

  // Closing the sheet stops the playback.
  useEffect(() => {
    if (!open) audio.current?.pause();
  }, [open]);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => toastGo(copy.playFailed));
    else el.pause();
  };

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      // The Server copies the recording into the room itself; the bytes never pass through the phone.
      await shareCallRecording(tripId, call.cardId);
      toastGo(copy.shared);
    } catch (err) {
      toastGo(errorMessage(err, copy.shareFailed));
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      {/* No page scroll: the transcript takes the leftover height and is the only thing that scrolls. The footer sits in
          the flow below it (not the usual absolute dock over a reserved padding), so the transcript always ends above
          the buttons whatever the footer's height (the home-indicator inset on iPhones). */}
      <SheetBody className="overflow-hidden pb-0 [@media(max-height:720px)]:gap-2">
        <SheetHeader title={copy.label(call.who)} subtitle={copy.meta(when, length > 0 ? spoken(length) : "")} />
        <OutcomeBanner headline={outcome.headline} body={outcome.body} />
        {url && (
          <>
            <audio
              ref={audio}
              src={url}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                if (Number.isFinite(e.currentTarget.duration)) setLength(e.currentTarget.duration);
              }}
            />
            <RecordingPlayer
              playing={playing}
              rate={rate}
              elapsed={clock(position)}
              total={clock(length)}
              progress={length > 0 ? position / length : 0}
              onToggle={toggle}
              onSpeed={() => {
                const next = RECORDING_RATES[(RECORDING_RATES.indexOf(rate) + 1) % RECORDING_RATES.length];
                setRate(next);
                if (audio.current) audio.current.playbackRate = next;
              }}
            />
          </>
        )}
        <Card variant="outline" radius="2xl" className="flex min-h-[120px] flex-1 shrink! flex-col px-4 py-2">
          <Eyebrow tone="muted" className="shrink-0 py-1.5">
            {copy.transcript}
          </Eyebrow>
          <div className="relative -mx-2.5 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2.5 scrollbar-none">
            {(call.card.transcript ?? []).map((line, i) => (
              <TranscriptRow
                key={i}
                t={String(i + 1)}
                speaker={line.who === "go" ? "go" : "vendor"}
                name={line.who === "go" ? CALL_COPY.listen.goName : call.who}
                text={line.text}
              />
            ))}
          </div>
        </Card>
      </SheetBody>
      <SheetFooter className="relative shrink-0 pt-3">
        <div className="flex gap-2">
          <Button variant="primary" size="lg" className="flex-1 px-[18px]" aria-busy={sharing} disabled={sharing} onClick={share}>
            {copy.share}
          </Button>
          {url && (
            <Button asChild variant="secondary" size="lg" className="shrink-0 gap-1.5 px-[18px]">
              <a href={url} target="_blank" rel="noopener noreferrer" download>
                <Download className="size-[18px]" />
                {copy.save}
              </a>
            </Button>
          )}
        </div>
      </SheetFooter>
    </>
  );
}
