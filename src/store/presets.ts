import { produce } from "immer";
import type { Preset, PresetChatPatch, PresetHomePatch, PresetState } from "@/data/presets";
import { DEFAULT_CAB_ID } from "@/data/seed/cabs";
import { VENDOR_CALLS } from "@/data/seed/calls";
import { TRIPS } from "@/data/seed/trips";
import { acceptInvite, createDraftGoa, ensureStage, joinGoa, JOINERS, seedCall, settleYou } from "@/store/logic";
import { createInitialData, type ChatTripData, type GoData, type HomeTripData, type RouteState } from "@/store/state";

// Turns a preset descriptor (src/data/presets.ts) into store data, in the documented order:
// signedIn → trips (goa, bali) → ensureStage(tripId) → chat → home → money / cabBooked.

function applyChatPatch(c: ChatTripData, patch: PresetChatPatch) {
  const { route, visa, ...rest } = patch;
  const fields: Partial<ChatTripData> = structuredClone(rest);
  Object.assign(c, fields);
  if (route) {
    const routePatch: Partial<RouteState> = structuredClone(route);
    Object.assign(c.route, routePatch);
  }
  if (visa) {
    c.visa.uploads = { ...visa.uploads };
    c.visa.sent = visa.sent;
  }
}

function applyHomePatch(h: HomeTripData, patch: PresetHomePatch) {
  if (patch.calls) h.calls = patch.calls.map((vendor) => seedCall(vendor));
  if (patch.lastCall !== undefined) {
    h.lastCall = patch.lastCall
      ? { vendor: patch.lastCall, asking: VENDOR_CALLS[patch.lastCall].defaultAsk, endedAt: Date.now() }
      : null;
  }
  if (patch.resolved) h.resolved = [...patch.resolved];
  if (patch.checkin) Object.assign(h.checkin, patch.checkin);
  if (patch.daysToGo !== undefined) h.daysToGo = patch.daysToGo;
  if (patch.openRow !== undefined) h.openRow = patch.openRow;
}

export function applyPresetState(d: GoData, state: PresetState) {
  d.session.signedIn = state.signedIn;

  if (state.goa !== "absent") {
    createDraftGoa(d); // Goa draft with just you + College gang, the Bali invite, past trips
    if (state.goa === "crew") {
      JOINERS.forEach((id) => joinGoa(d, id));
      d.trips.joinRun = "done";
    }
  }
  if (state.baliAccepted) acceptInvite(d, TRIPS.bali.inviteCode);

  const tripId = state.tripId;
  if (tripId) {
    if (state.ensureStage) ensureStage(d, tripId, state.ensureStage);
    if (state.chat) applyChatPatch(d.chat[tripId], state.chat);
    if (state.home) applyHomePatch(d.home[tripId], state.home);
  }

  if (state.money?.youSettled) settleYou(d);
  if (state.cabBooked) d.chat[tripId ?? "goa"].cab.booked = { optionId: DEFAULT_CAB_ID, trip: "round" };
}

/** Fresh store data for a preset (pure; `Date.now()` seeds live-call clocks). */
export function buildPresetData(preset: Preset): GoData {
  return produce(createInitialData(), (d) => {
    applyPresetState(d, preset.state);
  });
}
