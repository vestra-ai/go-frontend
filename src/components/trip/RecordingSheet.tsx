"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toastGo } from "@/lib/toast";
import { Download } from "@/components/icons/generated";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/common/Eyebrow";
import { CALL_COPY, RECORDING_RATES, VENDOR_CALLS, recordingFor } from "@/data/seed/calls";
import { toasts } from "@/data/seed/copy";
import type { TripId, VendorId } from "@/data/types";
import { useHydrated, useStore } from "@/store";
import { OutcomeBanner } from "./OutcomeBanner";
import { RecordingPlayer } from "./RecordingPlayer";
import { TranscriptRow } from "./TranscriptRow";

const copy = CALL_COPY.recording;

type RecordingSheetProps = {
  callId: VendorId;
  open: boolean;
  onOpenChange(open: boolean): void;
  /** Defaults to the one populated trip. */
  tripId?: TripId;
};

/** J7 "Call with {who}": outcome, static player, transcript, share / save (J-triphome-calls.md §1.4). */
export function RecordingSheet({ callId, open, onOpenChange, tripId = "goa" }: RecordingSheetProps) {
  const hydrated = useHydrated();
  const lastCall = useStore((s) => s.home[tripId].lastCall);
  const { playing, rate } = useStore((s) => s.home[tripId].recording);
  const setRecording = useStore((s) => s.setRecording);

  const matches = lastCall?.vendor === callId;

  // Not the last call: close ourselves.
  useEffect(() => {
    if (open && hydrated && !matches) onOpenChange(false);
  }, [open, hydrated, matches, onOpenChange]);

  if (!lastCall || !matches) return null;
  const who = VENDOR_CALLS[callId].who;
  const rec = recordingFor(callId, lastCall.asking);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={110} aria-label={rec.title}>
      <SheetBody>
        <SheetHeader title={rec.title} subtitle={rec.meta} />
        <OutcomeBanner headline={rec.outcome.headline} body={rec.outcome.body} />
        <RecordingPlayer
          playing={playing}
          rate={rate}
          elapsed={copy.elapsed}
          total={copy.total}
          onToggle={() => setRecording(tripId, { playing: !playing })}
          onSpeed={() => {
            const next = RECORDING_RATES[(RECORDING_RATES.indexOf(rate) + 1) % RECORDING_RATES.length];
            setRecording(tripId, { rate: next });
          }}
        />
        <Card variant="outline" radius="2xl" className="flex flex-col px-4 py-2">
          <Eyebrow tone="muted" className="py-1.5">
            {copy.transcript}
          </Eyebrow>
          {rec.transcript.map((line) => (
            <TranscriptRow
              key={line.t}
              t={line.t}
              speaker={line.speaker}
              name={line.speaker === "go" ? CALL_COPY.listen.goName : who}
              text={line.text}
              current={line.current}
            />
          ))}
        </Card>
      </SheetBody>
      <SheetFooter>
        <div className="flex gap-2">
          <Button asChild variant="primary" size="lg" className="flex-1 px-[18px]">
            <Link href={`/trips/${tripId}/chat`}>{copy.share}</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="shrink-0 gap-1.5 px-[18px]"
            onClick={() => toastGo(toasts.saved)}
          >
            <Download className="size-[18px]" />
            {copy.save}
          </Button>
        </div>
      </SheetFooter>
    </BottomSheet>
  );
}
