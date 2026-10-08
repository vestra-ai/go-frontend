"use client";

import { notFound } from "next/navigation";
import { CheckinSheet } from "@/components/checkin/CheckinSheet";
import { SectionHeader } from "@/components/common/SectionHeader";
import { MOCK_LAST_CALL } from "@/data/seed/calls";
import { CHECKIN } from "@/data/seed/checkin";
import { tripHome as copy } from "@/data/seed/copy";
import type { TripId } from "@/data/types";
import { useDone, useLiveCalls, usePending, useStore, useTripHomeMode } from "@/store";
import { AllSetCard } from "./AllSetCard";
import { CheckinCard } from "./CheckinCard";
import { DoneList } from "./DoneList";
import { TripHomeZero } from "./empty/TripHomeZero";
import { ListenSheet } from "./ListenSheet";
import { PendingCard } from "./PendingCard";
import { RecordingSheet } from "./RecordingSheet";
import { TripShell } from "./TripShell";
import { useTripHomeSheets } from "./useTripHomeSheets";
import { useTripShellProps } from "./useTripShellProps";

/**
 * Trip home (`/trips/[tripId]`): I1 zero state, or the populated J1–J7 / K1 page with Go’s live calls, the ask form,
 * the Done accordion (where each booking row asks Go to call) and the Listen / Recording / check-in sheets (J-triphome-calls.md §1.2, K-checkin.md §1.1).
 */
export function TripHomeScreen({ tripId }: { tripId: TripId }) {
  const shell = useTripShellProps(tripId, "home");
  const populated = useTripHomeMode(tripId) === "populated";
  const sheets = useTripHomeSheets(tripId, { populated });

  const pending = usePending(tripId);
  const done = useDone(tripId);
  const calls = useLiveCalls(tripId);
  const openRow = useStore((s) => s.home[tripId].openRow);
  const askForm = useStore((s) => s.home[tripId].askForm);
  // Mock call history until real history exists: the Stay card always has a recording to open.
  const pastCall = useStore((s) => s.home[tripId].lastCall) ?? MOCK_LAST_CALL;
  const users = useStore((s) => s.trips.members);
  const userId = useStore((s) => s.session.userId);
  // The You→X settlement drives the settle-up row's avatar (Rahul).
  const owedTo = useStore((s) => s.money.settlements.find((x) => x.fromId === s.session.userId)?.toId);
  const { startCall, endCall, setChip, setDraft, previewCheckin } = useStore.getState();
  if (!shell) notFound();

  const allSet = pending.length === 0;

  const onPreviewCheckin = () => {
    previewCheckin(tripId);
    sheets.toggleRow(null);
    window.scrollTo({ top: 0 });
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

            <SectionHeader
              data-anchor="done"
              className="mt-2"
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
              pastCall={pastCall}
              onRecording={sheets.openRecording}
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
          <CheckinSheet
            tripId={tripId}
            step={sheets.checkinStep}
            onClose={sheets.close}
            onContinue={sheets.continueCheckin}
          />
        </>
      )}
    </>
  );
}
