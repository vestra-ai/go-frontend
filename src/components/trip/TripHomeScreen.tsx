"use client";

import { notFound } from "next/navigation";
import { useRef } from "react";
import { CheckinDetailsSheet } from "@/components/checkin/CheckinDetailsSheet";
import { CheckinSeatSheet } from "@/components/checkin/CheckinSeatSheet";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Plus } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { CALL_CHIPS, CALL_COPY } from "@/data/seed/calls";
import { CHECKIN } from "@/data/seed/checkin";
import { tripHome as copy } from "@/data/seed/copy";
import type { TripId } from "@/data/types";
import { useDone, useLiveCalls, usePending, useStore, useTripHomeMode } from "@/store";
import { AllSetCard } from "./AllSetCard";
import { AskGoForm } from "./AskGoForm";
import { CallCarousel } from "./CallCarousel";
import { CheckinCard } from "./CheckinCard";
import { DoneList } from "./DoneList";
import { TripHomeZero } from "./empty/TripHomeZero";
import { ListenSheet } from "./ListenSheet";
import { LiveCallCard } from "./LiveCallCard";
import { PendingCard } from "./PendingCard";
import { RecordingSheet } from "./RecordingSheet";
import { TripShell } from "./TripShell";
import { useTripHomeSheets } from "./useTripHomeSheets";
import { useTripShellProps } from "./useTripShellProps";

/** Nearest scrolling ancestor (TripShell's scroller), for "Preview" → back to the top. */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return null;
}

/**
 * Trip home (`/trips/[tripId]`): I1 zero state, or the populated J1–J7 / K1 page with Go’s live calls, the ask form,
 * the Done accordion and the Listen / Recording / check-in sheets (J-triphome-calls.md §1.2, K-checkin.md §1.1).
 */
export function TripHomeScreen({ tripId }: { tripId: TripId }) {
  const shell = useTripShellProps(tripId, "home");
  const populated = useTripHomeMode(tripId) === "populated";
  const doneRef = useRef<HTMLDivElement>(null);
  const sheets = useTripHomeSheets(tripId, { populated, doneRef });

  const pending = usePending(tripId);
  const done = useDone(tripId);
  const calls = useLiveCalls(tripId);
  const openRow = useStore((s) => s.home[tripId].openRow);
  const askForm = useStore((s) => s.home[tripId].askForm);
  const lastCall = useStore((s) => s.home[tripId].lastCall);
  const users = useStore((s) => s.trips.members);
  const userId = useStore((s) => s.session.userId);
  // The You→X settlement drives the settle-up row's avatar (Rahul).
  const owedTo = useStore((s) => s.money.settlements.find((x) => x.fromId === s.session.userId)?.toId);
  const { startCall, endCall, setChip, setDraft, openForm, previewCheckin } = useStore.getState();
  if (!shell) notFound();

  const allSet = pending.length === 0;
  const showForm = calls.length === 0 || askForm.open;

  // The main form only calls the villa or the cab desk; free text alone targets the villa (§1.3 `callMain`).
  const callMain = () => startCall(tripId, /cab/i.test(askForm.chips.main ?? "") ? "cab" : "villa", "main");

  const onPreviewCheckin = () => {
    previewCheckin(tripId);
    sheets.toggleRow(null);
    scrollParent(doneRef.current)?.scrollTo({ top: 0 });
  };

  return (
    <>
      <TripShell {...shell} shareOpen={sheets.shareOpen} onShareOpenChange={sheets.setShareOpen}>
        {!populated ? (
          <TripHomeZero tripId={tripId} onInvite={() => sheets.setShareOpen(true)} />
        ) : (
          <>
            {allSet ? (
              <AllSetCard />
            ) : (
              <>
                <SectionHeader title={copy.pendingTitle} meta={copy.pendingMeta(pending.length)} />
                {pending.some((p) => p.kind === "checkin") && (
                  <CheckinCard companion={users[CHECKIN.friendId]} onCheckIn={sheets.openCheckin} />
                )}
                <PendingCard tripId={tripId} items={pending} settleWith={users[owedTo ?? userId]} />
              </>
            )}

            {calls.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <SectionHeader live className="mt-2 items-center" title={copy.callsTitle} meta={copy.callCount(calls.length)} />
                {calls.length === 1 ? (
                  <div className="flex flex-col gap-2">
                    <LiveCallCard
                      call={calls[0]}
                      layout="full"
                      onListen={() => sheets.openListen(calls[0].id)}
                      onEnd={() => endCall(tripId, calls[0].id)}
                    />
                    <Button variant="dashed" size="base" className="w-full gap-1.5 text-14" onClick={() => openForm(tripId)}>
                      <Plus className="size-4" />
                      {CALL_COPY.card.another}
                    </Button>
                  </div>
                ) : (
                  <CallCarousel
                    calls={calls}
                    onListen={sheets.openListen}
                    onEnd={(id) => endCall(tripId, id)}
                    onAdd={() => openForm(tripId)}
                  />
                )}
              </div>
            )}

            {showForm && (
              <AskGoForm
                chips={CALL_CHIPS.main}
                selected={askForm.chips.main}
                draft={askForm.drafts.main}
                onChip={(label) => setChip(tripId, "main", label)}
                onDraft={(text) => setDraft(tripId, "main", text)}
                onSubmit={callMain}
                lastCall={lastCall ?? undefined}
                onRecording={sheets.openRecording}
              />
            )}

            <SectionHeader
              ref={doneRef}
              data-anchor="done"
              className="mt-2 scroll-mt-[160px]"
              title={copy.doneTitle}
              meta={copy.doneLabel(done.length, allSet)}
            />
            <DoneList
              rows={done}
              openRow={openRow}
              onToggle={sheets.toggleRow}
              calls={calls}
              chips={askForm.chips}
              drafts={askForm.drafts}
              onChip={(key, label) => setChip(tripId, key, label)}
              onDraft={(key, text) => setDraft(tripId, key, text)}
              onCall={(vendor, key) => startCall(tripId, vendor, key)}
              onListen={sheets.openListen}
              onEnd={(vendor) => endCall(tripId, vendor)}
              onPreviewCheckin={onPreviewCheckin}
            />
          </>
        )}
      </TripShell>

      {populated && (
        <>
          {sheets.callId && (
            <>
              <ListenSheet
                tripId={tripId}
                callId={sheets.callId}
                open={sheets.sheet === "listen"}
                onOpenChange={(open) => !open && sheets.close()}
              />
              <RecordingSheet
                tripId={tripId}
                callId={sheets.callId}
                open={sheets.sheet === "recording"}
                onOpenChange={(open) => !open && sheets.close()}
              />
            </>
          )}
          <CheckinDetailsSheet
            tripId={tripId}
            open={sheets.checkinStep === "details"}
            onClose={sheets.close}
            onContinue={sheets.continueCheckin}
          />
          <CheckinSeatSheet tripId={tripId} open={sheets.checkinStep === "seat"} onBack={sheets.backCheckin} />
        </>
      )}
    </>
  );
}
