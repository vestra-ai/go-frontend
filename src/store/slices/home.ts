import { VENDOR_CALLS } from "@/data/seed/calls";
import { CHECKIN } from "@/data/seed/checkin";
import type { AskKey, TripId, VendorId } from "@/data/types";
import { DAYS_TO_GO_CHECKIN, type HomeTripData, type OpenRow } from "@/store/state";
import type { SliceCreator } from "@/store/types";

// Trip home calls + check-in (J-triphome-calls.md §1.3, K-checkin.md §1.5). Scoped per trip like the chat actions.
export interface HomeActions {
  /** Asks from the form/options group `key` (draft, else chip label, else the vendor default). One live call per vendor. */
  startCall(tripId: TripId, vendor: VendorId, key: AskKey): void;
  /** `withOutcome` (Listen sheet "End call" only) records lastCall and marks the vendor resolved. */
  endCall(tripId: TripId, id: VendorId, opts?: { withOutcome?: boolean }): void;
  toggleRow(tripId: TripId, row: OpenRow): void;
  /** Single-select per group; tapping the selected chip clears it. */
  setChip(tripId: TripId, key: AskKey, label: string | null): void;
  setDraft(tripId: TripId, key: AskKey, text: string): void;
  openForm(tripId: TripId): void;
  setListen(tripId: TripId, patch: Partial<HomeTripData["listen"]>): void;
  setRecording(tripId: TripId, patch: Partial<HomeTripData["recording"]>): void;
  /** K1: check-in opens and the hero reads "in 2 days". */
  previewCheckin(tripId: TripId): void;
  setDigiYatra(tripId: TripId, on: boolean): void;
  setDeclaration(tripId: TripId, on: boolean): void;
  /** Ignored for taken seats and the friend's seat. */
  setSeat(tripId: TripId, id: string): void;
  completeCheckin(tripId: TripId): void;
}

// "🧳 Extra baggage" → "Extra baggage" (strip the leading emoji/spaces).
const LEADING_NON_LETTERS = new RegExp("^[^\\p{L}]+", "u");

export const createHomeSlice: SliceCreator<HomeActions> = (set) => ({
  startCall: (tripId, vendor, key) =>
    set((s) => {
      const h = s.home[tripId];
      const chip = h.askForm.chips[key];
      const text = h.askForm.drafts[key].trim() || (chip ? chip.replace(LEADING_NON_LETTERS, "") : "");
      const asking = text || VENDOR_CALLS[vendor].defaultAsk;
      const live = h.calls.find((c) => c.vendor === vendor);
      if (live) live.asking = asking; // dedupe: never a second card; silent update (as designed)
      else h.calls.push({ id: vendor, vendor, asking, startedAt: Date.now() });
      h.askForm.drafts[key] = "";
      h.askForm.chips[key] = null;
      h.askForm.open = false;
    }),
  endCall: (tripId, id, opts) =>
    set((s) => {
      const h = s.home[tripId];
      const call = h.calls.find((c) => c.id === id);
      if (!call) return;
      h.calls = h.calls.filter((c) => c.id !== id);
      if (!opts?.withOutcome) return;
      h.lastCall = { vendor: call.vendor, asking: call.asking, endedAt: Date.now() };
      if (!h.resolved.includes(call.vendor)) h.resolved.push(call.vendor);
    }),
  toggleRow: (tripId, row) =>
    set((s) => {
      const h = s.home[tripId];
      h.openRow = row === null || h.openRow === row ? null : row;
    }),
  setChip: (tripId, key, label) =>
    set((s) => {
      const chips = s.home[tripId].askForm.chips;
      chips[key] = chips[key] === label ? null : label;
    }),
  setDraft: (tripId, key, text) =>
    set((s) => {
      s.home[tripId].askForm.drafts[key] = text;
    }),
  openForm: (tripId) =>
    set((s) => {
      s.home[tripId].askForm.open = true;
    }),
  setListen: (tripId, patch) =>
    set((s) => {
      Object.assign(s.home[tripId].listen, patch);
    }),
  setRecording: (tripId, patch) =>
    set((s) => {
      Object.assign(s.home[tripId].recording, patch);
    }),
  previewCheckin: (tripId) =>
    set((s) => {
      const h = s.home[tripId];
      if (h.checkin.status === "not-open") h.checkin.status = "open";
      h.daysToGo = DAYS_TO_GO_CHECKIN;
    }),
  setDigiYatra: (tripId, on) =>
    set((s) => {
      s.home[tripId].checkin.digiYatra = on;
    }),
  setDeclaration: (tripId, on) =>
    set((s) => {
      s.home[tripId].checkin.declaration = on;
    }),
  setSeat: (tripId, id) =>
    set((s) => {
      const seat = CHECKIN.seats.find((x) => x.id === id);
      if (!seat || seat.state === "taken" || seat.state === "friend") return;
      s.home[tripId].checkin.seat = id;
    }),
  completeCheckin: (tripId) =>
    set((s) => {
      s.home[tripId].checkin.status = "done";
    }),
});
