import { stageAt } from "@/data/scenario/engine";
import { chat as chatCopy } from "@/data/seed/copy";
import { BUDGET_RANGE } from "@/data/seed/money";
import { GO_REPLY_MS } from "@/data/timing";
import type {
  Attachment,
  CityRef,
  DateOption,
  PlaceOption,
  QuickStartAnswers,
  RouteMode,
  SlotId,
  StageId,
  Stay,
  TravelSelection,
  TripId,
  TripType,
  TriggerId,
  VisaFieldKey,
  VisaUploadKey,
} from "@/data/types";
import { advance, applyRouteBooking, claimBooking, completeBooking, ensureStage } from "@/store/logic";
import type { RouteState } from "@/store/state";
import { schedule } from "@/store/timers";
import type { SliceCreator } from "@/store/types";

export interface SendOptions {
  quote?: { author: string; text: string };
  mention?: boolean;
  ack?: boolean; // default true: one Go ack GO_REPLY_MS after the last send of a burst
}

// Every chat action is scoped to a trip (C-chat-kickoff.md §1.5, E-deciding.md §1.6, F-travel.md §1.3, G-bali.md §1.4).
export interface ChatActions {
  /** Moves to `next.to` when the current stage accepts `trigger` (`pay` accepts stay-claimed and stay-paid). */
  advance(tripId: TripId, trigger: TriggerId): void;
  /** Forward-only fast-forward with every earlier stage's default completion, no timers. */
  ensureStage(tripId: TripId, id: StageId): void;

  completeQuickStart(tripId: TripId, answers: QuickStartAnswers, from: CityRef | null): void;
  dismissQuickStart(tripId: TripId): void;
  setFromCity(tripId: TripId, city: CityRef): void;

  send(tripId: TripId, text: string, opts?: SendOptions): void;
  /** Sends a photo / PDF / voice note as my message; Go acks it like a text. */
  sendAttachment(tripId: TripId, attachment: Attachment): void;
  react(tripId: TripId, msgId: string, emoji: string): void;

  votePlace(tripId: TripId, id: PlaceOption["id"] | null): void;
  /** Re-voting the current option clears it; always clears `flexible`. */
  voteDate(tripId: TripId, id: DateOption["id"] | null): void;
  setFlexible(tripId: TripId): void;
  setBudget(tripId: TripId, lo: number, hi: number): void;
  saveBudget(tripId: TripId): void;
  voteStay(tripId: TripId, id: Stay["id"] | null): void;
  claimBooking(tripId: TripId): void;
  /** You pay in the sheet: claimed by you + paid, then straight to `book` (no pill). */
  payBooking(tripId: TripId): void;
  completeBooking(tripId: TripId): void;

  setRoute(tripId: TripId, patch: Partial<Omit<RouteState, "draft" | "booked">>): void;
  setRouteTrip(tripId: TripId, trip: TripType): void;
  setRouteMode(tripId: TripId, mode: RouteMode): void;
  setRouteFilter(tripId: TripId, filt: string): void;
  pickRoute(tripId: TripId, id: string): void;
  clearRouteFilters(tripId: TripId): void;
  openTimeSheet(tripId: TripId): void;
  toggleDraftSlot(tripId: TripId, leg: "on" | "ret", id: SlotId): void;
  clearDraftSlots(tripId: TripId): void;
  closeTimeSheet(tripId: TripId): void;
  applyTimeSlots(tripId: TripId): void;
  /** Books (first time: bookings + transaction), then `route-booked` while at stage `travel`. */
  bookRoute(tripId: TripId, sel: TravelSelection): void;
  bookCab(tripId: TripId, sel: TravelSelection): void;
  markPrivateViewed(tripId: TripId): void;

  setVisaUpload(tripId: TripId, key: VisaUploadKey): void;
  setVisaField(tripId: TripId, key: VisaFieldKey, value: string): void;
  sendVisa(tripId: TripId): void;
}

// Mine and the Go ack use the 78% max width (C-chat-kickoff.md §1.7 #2).
const SENT_MAX_WIDTH = 78;

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

type SetState = Parameters<SliceCreator<ChatActions>>[0];

/** Each send re-arms the timer, so a burst gets one Go ack, tagged with the stage of the message it answers. */
function armAck(set: SetState, tripId: TripId, stage: StageId) {
  schedule(`ack:${tripId}`, GO_REPLY_MS, () =>
    set((s) => {
      const c = s.chat[tripId];
      c.seq += 1;
      c.sent.push({ id: `${tripId}-sent-${c.seq}`, stage, author: "go", kind: "text", text: chatCopy.goAck, maxWidth: SENT_MAX_WIDTH });
    }),
  );
}

export const createChatSlice: SliceCreator<ChatActions> = (set, get) => ({
  advance: (tripId, trigger) =>
    set((s) => {
      advance(s, tripId, trigger);
    }),
  ensureStage: (tripId, id) =>
    set((s) => {
      ensureStage(s, tripId, id);
    }),

  completeQuickStart: (tripId, answers, from) =>
    set((s) => {
      const c = s.chat[tripId];
      c.quickStart = "done";
      c.quickStartAnswers = { ...answers };
      c.fromCity = from ? { ...from } : null;
    }),
  dismissQuickStart: (tripId) =>
    set((s) => {
      s.chat[tripId].quickStart = "dismissed";
    }),
  setFromCity: (tripId, city) =>
    set((s) => {
      s.chat[tripId].fromCity = { ...city };
    }),

  send: (tripId, text, opts = {}) => {
    const body = text.trim();
    if (!body) return;
    const stage = stageAt(tripId, get().chat[tripId].stageIndex).id;
    set((s) => {
      const c = s.chat[tripId];
      c.seq += 1;
      c.sent.push({
        id: `${tripId}-sent-${c.seq}`,
        stage,
        author: s.session.userId,
        kind: "text",
        text: body,
        maxWidth: SENT_MAX_WIDTH,
        ...(opts.mention ? { mention: true } : {}),
        ...(opts.quote ? { quote: { ...opts.quote } } : {}),
      });
    });
    if (opts.ack === false) return;
    armAck(set, tripId, stage);
  },
  sendAttachment: (tripId, attachment) => {
    const stage = stageAt(tripId, get().chat[tripId].stageIndex).id;
    set((s) => {
      const c = s.chat[tripId];
      c.seq += 1;
      c.sent.push({
        id: `${tripId}-sent-${c.seq}`,
        stage,
        author: s.session.userId,
        kind: "text",
        attachment: { ...attachment },
        maxWidth: SENT_MAX_WIDTH,
      });
    });
    armAck(set, tripId, stage);
  },
  react: (tripId, msgId, emoji) =>
    set((s) => {
      s.chat[tripId].reactions[msgId] = emoji;
    }),

  votePlace: (tripId, id) =>
    set((s) => {
      s.chat[tripId].placeVote = id;
    }),
  voteDate: (tripId, id) =>
    set((s) => {
      const c = s.chat[tripId];
      c.dateVote = id !== null && c.dateVote === id ? null : id;
      c.flexible = false;
    }),
  setFlexible: (tripId) =>
    set((s) => {
      const c = s.chat[tripId];
      c.flexible = !c.flexible;
      c.dateVote = null;
    }),
  setBudget: (tripId, lo, hi) =>
    set((s) => {
      const { min, max, step } = BUDGET_RANGE;
      const nextHi = clamp(hi, min + step, max);
      s.chat[tripId].budget = { lo: clamp(lo, min, nextHi - step), hi: nextHi, saved: false };
    }),
  saveBudget: (tripId) =>
    set((s) => {
      s.chat[tripId].budget.saved = true;
    }),
  voteStay: (tripId, id) =>
    set((s) => {
      s.chat[tripId].stayVote = id;
    }),
  claimBooking: (tripId) =>
    set((s) => {
      claimBooking(s, tripId);
    }),
  payBooking: (tripId) =>
    set((s) => {
      const booking = s.chat[tripId].stayBooking;
      booking.status = "claimed";
      booking.by = s.session.userId;
      booking.paid = true;
      advance(s, tripId, "stay-paid");
    }),
  completeBooking: (tripId) =>
    set((s) => {
      completeBooking(s, tripId);
    }),

  setRoute: (tripId, patch) =>
    set((s) => {
      Object.assign(s.chat[tripId].route, patch);
    }),
  setRouteTrip: (tripId, trip) =>
    set((s) => {
      const route = s.chat[tripId].route;
      route.trip = trip;
    }),
  setRouteMode: (tripId, mode) =>
    set((s) => {
      const route = s.chat[tripId].route;
      route.mode = mode;
      route.filt = "all";
      route.pick = null;
    }),
  setRouteFilter: (tripId, filt) =>
    set((s) => {
      s.chat[tripId].route.filt = filt;
    }),
  pickRoute: (tripId, id) =>
    set((s) => {
      s.chat[tripId].route.pick = id;
    }),
  clearRouteFilters: (tripId) =>
    set((s) => {
      const route = s.chat[tripId].route;
      route.filt = "all";
      route.on = [];
      route.ret = [];
    }),
  openTimeSheet: (tripId) =>
    set((s) => {
      const route = s.chat[tripId].route;
      route.draft = { on: [...route.on], ret: [...route.ret] };
    }),
  toggleDraftSlot: (tripId, leg, id) =>
    set((s) => {
      const route = s.chat[tripId].route;
      const draft = (route.draft ??= { on: [...route.on], ret: [...route.ret] });
      draft[leg] = draft[leg].includes(id) ? draft[leg].filter((x) => x !== id) : [...draft[leg], id].sort();
    }),
  clearDraftSlots: (tripId) =>
    set((s) => {
      s.chat[tripId].route.draft = { on: [], ret: [] };
    }),
  closeTimeSheet: (tripId) =>
    set((s) => {
      s.chat[tripId].route.draft = null;
    }),
  applyTimeSlots: (tripId) =>
    set((s) => {
      const route = s.chat[tripId].route;
      if (!route.draft) return;
      route.on = [...route.draft.on];
      route.ret = [...route.draft.ret];
      route.pick = null;
      route.draft = null;
    }),
  bookRoute: (tripId, sel) =>
    set((s) => {
      applyRouteBooking(s, tripId, sel);
      if (stageAt(tripId, s.chat[tripId].stageIndex).id === "travel") advance(s, tripId, "route-booked");
    }),
  bookCab: (tripId, sel) =>
    set((s) => {
      s.chat[tripId].cab.booked = { optionId: sel.optionId, trip: sel.trip }; // `cab-booked`: no stage change
    }),
  markPrivateViewed: (tripId) =>
    set((s) => {
      s.chat[tripId].privateViewed = true; // `private-viewed`: no stage change
    }),

  setVisaUpload: (tripId, key) =>
    set((s) => {
      s.chat[tripId].visa.uploads[key] = true; // one-way
    }),
  setVisaField: (tripId, key, value) =>
    set((s) => {
      s.chat[tripId].visa.fields[key] = value;
    }),
  sendVisa: (tripId) =>
    set((s) => {
      s.chat[tripId].visa.sent = true;
      advance(s, tripId, "visa-sent"); // no-op: `visa` is terminal
    }),
});
