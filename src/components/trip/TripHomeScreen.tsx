"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { errorMessage } from "@/api/http";
import { CheckinSheet } from "@/components/checkin/CheckinSheet";
import { SectionHeader } from "@/components/common/SectionHeader";
import { BudgetSheet } from "@/components/sheets/BudgetSheet";
import { RecordPaymentSheet } from "@/components/sheets/RecordPaymentSheet";
import { useGroupBudget } from "@/components/sheets/useGroupBudget";
import { recordTargetFor } from "@/components/sheets/useRecordTarget";
import { CALL_COPY } from "@/data/seed/calls";
import { tripHome as copy } from "@/data/seed/copy";
import type { TripId } from "@/data/types";
import { openIn, preopenTab } from "@/lib/links";
import { dropQueryParams } from "@/lib/query";
import { toastGo } from "@/lib/toast";
import { loadCalls, loadNeedsYou, sendMessage, tapCard, useGo, useTripGate } from "@/state";
import { httpUrl } from "@/state/bookingView";
import { buildDone, toPendingRow, type CallModel, type DoneRowModel, type PendingRowModel } from "@/state/homeView";
import { usersById } from "@/state/view";
import { AllSetCard } from "./AllSetCard";
import { CheckinCard } from "./CheckinCard";
import { DoneList, type AskDraft } from "./DoneList";
import { TripHomeZero } from "./empty/TripHomeZero";
import { PendingCard } from "./PendingCard";
import { RecordingSheet } from "./RecordingSheet";
import { useTripShellActions } from "./TripShell";
import { useTripHomeSheets } from "./useTripHomeSheets";

// "🧳 Extra baggage" → "Extra baggage" (strip the leading emoji/spaces).
const LEADING_NON_LETTERS = new RegExp("^[^\\p{L}]+", "u");

/**
 * Trip home (`/trips/[tripId]`, CONTRACT-APP §4.11): the zero state until the Server calls the trip `planned`, then
 * "Pending on you" (the needs-you list), and "Done" (bookings, the record, Go's calls with their recordings).
 */
export function TripHomeScreen({ tripId }: { tripId: TripId }) {
  const router = useRouter();
  const params = useSearchParams();
  const data = useTripGate(tripId);
  const { openShare } = useTripShellActions();
  const features = useGo((s) => s.config?.features);
  const sheets = useTripHomeSheets();
  const budget = useGroupBudget(tripId);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [asks, setAsks] = useState<Record<string, AskDraft | undefined>>({});
  const ready = data !== null;
  const populated = data?.view?.stage === "planned";

  useEffect(() => {
    if (!ready) return;
    void loadNeedsYou(tripId).catch(() => {});
    void loadCalls(tripId).catch(() => {});
  }, [ready, tripId]);

  // `?open=<booking>` is a one-shot deep link (the Bookings card): expand that row on arrival, then drop it from the
  // URL, so a refresh (or Back) cannot bring it back. `?checkin=<booking>` opens that flight's check-in the same way.
  const openParam = params.get("open");
  const checkinParam = params.get("checkin");
  useEffect(() => {
    if (!populated) return;
    if (openParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- applies the one-shot link, then the param is dropped
      setOpenRow(openParam);
      dropQueryParams("open");
    }
    if (checkinParam) {
      if (features?.checkin) sheets.openCheckin(checkinParam);
      dropQueryParams("checkin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot params
  }, [populated, openParam, checkinParam, features?.checkin]);

  if (!data?.view) return null;
  const { view } = data;
  const users = usersById(view.people);

  const openBudget = () => {
    budget.reset();
    sheets.openBudget();
  };

  // "Pending on you": the Server's list as it is (a check-in item only exists with `features.checkin`).
  const pending = data.needsYou ?? [];
  const checkins = pending.filter((item) => item.kind === "checkin" && item.target.booking_id);
  const rows = pending.filter((item) => item.kind !== "checkin").map((item) => toPendingRow(item, users));
  const allSet = pending.length === 0;
  const done = buildDone(view, data.calls, users);

  const act = (row: PendingRowModel) => {
    const { item } = row;
    if (item.kind === "settle_up" && item.target.transfer) {
      sheets.openRecord(recordTargetFor(view, item.target.transfer));
      return;
    }
    // A vote, a mandate, one of Go's cards, an open line: each lives in the room, at its message when there is one.
    const at = item.target.message_id ? `?focus=${encodeURIComponent(item.target.message_id)}` : "";
    router.push(`/trips/${tripId}/chat${at}`);
  };

  const setAsk = (key: string, patch: Partial<AskDraft>) =>
    setAsks((all) => ({ ...all, [key]: { chip: null, draft: "", ...all[key], ...patch } }));

  /** "Ask Go to call…" is a normal message mentioning Go (§4.11): Go answers in the room. */
  const askGoToCall = (row: DoneRowModel) => {
    if (!row.expand) return;
    const ask = asks[row.key];
    const what = ask?.draft.trim() || (ask?.chip ? ask.chip.replace(LEADING_NON_LETTERS, "") : "");
    sendMessage(tripId, { text: CALL_COPY.options.message(row.expand.who, what) });
    setAsk(row.key, { chip: null, draft: "" });
    toastGo(copy.asked(row.expand.who));
  };

  /** Card actions on a live call: `stop` ends it; `listen` answers with Go's listen-in page, opened at once. */
  const tap = async (call: CallModel, actionId: "stop" | "listen") => {
    const tab = actionId === "listen" ? preopenTab() : null;
    try {
      const result = await tapCard(tripId, call.cardId, actionId);
      if (result.result === "open") openIn(tab, result.url);
      else {
        tab?.close();
        if (result.toast) toastGo(result.toast);
      }
    } catch (err) {
      tab?.close();
      toastGo(errorMessage(err));
    }
  };

  return (
    <>
      {!populated ? (
        <TripHomeZero view={view} onInvite={openShare} onSetBudget={openBudget} />
      ) : (
        <>
          {allSet ? (
            <AllSetCard />
          ) : (
            <>
              <SectionHeader title={copy.pendingTitle} meta={copy.pendingMeta(pending.length)} />
              {checkins.map((item) => {
                const bookingId = item.target.booking_id ?? "";
                const booking = view.bookings.find((b) => b.booking_id === bookingId);
                const companionId = data.checkin[bookingId]?.companion?.person_id;
                const logo = httpUrl(booking?.journey?.logo_url);
                return (
                  <CheckinCard
                    key={item.item_id}
                    sub={item.subtitle ?? ""}
                    companion={companionId ? users[companionId] : undefined}
                    logo={logo ? { src: logo, alt: booking?.journey?.carrier_name ?? "" } : undefined}
                    onCheckIn={() => sheets.openCheckin(bookingId)}
                  />
                );
              })}
              <PendingCard rows={rows} onAct={act} />
            </>
          )}

          {done.length > 0 && (
            <>
              <SectionHeader data-anchor="done" className="mt-2" title={copy.doneTitle} meta={copy.doneLabel(done.length, allSet)} />
              <DoneList
                rows={done}
                openRow={openRow}
                onToggle={(key) => setOpenRow((current) => (current === key ? null : key))}
                asks={asks}
                // Single-select per row; tapping the selected chip clears it.
                onChip={(key, label) => setAsk(key, { chip: asks[key]?.chip === label ? null : label })}
                onDraft={(key, text) => setAsk(key, { draft: text })}
                onCall={askGoToCall}
                // Listen in and the recording are hidden while `features.calls` is off (§7).
                onListen={features?.calls ? (call) => void tap(call, "listen") : undefined}
                onEnd={(call) => void tap(call, "stop")}
                onRecording={features?.calls ? sheets.openRecording : undefined}
              />
            </>
          )}
        </>
      )}

      <RecordingSheet tripId={tripId} call={sheets.call} open={sheets.sheet === "recording"} onOpenChange={(open) => !open && sheets.close()} />
      <RecordPaymentSheet open={sheets.sheet === "record"} onOpenChange={(open) => !open && sheets.close()} target={sheets.record} />
      <BudgetSheet open={sheets.sheet === "budget"} onOpenChange={(open) => !open && sheets.close()} {...budget} />
      {features?.checkin && (
        <CheckinSheet
          tripId={tripId}
          bookingId={sheets.checkinBookingId}
          step={sheets.checkinStep}
          onClose={sheets.close}
          onContinue={sheets.continueCheckin}
        />
      )}
    </>
  );
}
