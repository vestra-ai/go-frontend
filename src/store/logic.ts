import { SCENARIOS, stageAt, stageIndexOf, transitionFor } from "@/data/scenario/engine";
import { FLIGHT_BOOKING_ID, STAY_BOOKING_ID } from "@/data/seed/bookings";
import { VENDOR_CALLS } from "@/data/seed/calls";
import { DEFAULT_CITY } from "@/data/seed/cities";
import { INVITES } from "@/data/seed/invites";
import { MONEY_COPY, SETTLEMENTS, TRANSACTIONS, TX_ROUTE_BOOKING_ID, TX_STAY_BOOKING_ID } from "@/data/seed/money";
import { PAST_TRIPS } from "@/data/seed/pastTrips";
import { SEED_ROUTE_ID } from "@/data/seed/routes";
import { TRIPS } from "@/data/seed/trips";
import type { ActiveCall, StageId, TravelSelection, TripId, TriggerId, UserId, VendorId } from "@/data/types";
import type { GoData, RecordedPayment } from "@/store/state";

// Draft mutators shared by the slices and applyPreset. Each takes an immer draft (or a plain object being built)
// and never schedules timers, so ensureStage/applyPreset stay synchronous and deterministic (PLAN §9.3).

const clone = <T>(value: T): T => structuredClone(value);

const TRAVEL_BACK_BOOKING_ID = "travel-back";
const RECORDED_TX_PREFIX = "tx-rec-";

// Which seed transactions each booking reveals (M-bookings-money.md §1.7 leaves this to P2-2; all 7 exist at `plan`).
// Stay: Rahul's Villa Sol booking plus the two villa-share paybacks that make You→Rahul ₹5,800 / Arjun settled true.
// Travel: your IndiGo booking plus the crew's own bookings ("Rahul and Priya added theirs").
const STAY_TX_IDS = [TX_STAY_BOOKING_ID, "tx2", "tx1"];
const ROUTE_TX_IDS = [TX_ROUTE_BOOKING_ID, "tx5", "tx4", "tx3"];

export function seedCall(vendor: VendorId, asking: string = VENDOR_CALLS[vendor].defaultAsk): ActiveCall {
  // DESIGN-ASSUMPTION (J-triphome-calls.md §1.7 #4): LIVE timers tick from a seeded startedAt (villa shows ~01:12).
  return { id: vendor, vendor, asking, startedAt: Date.now() - VENDOR_CALLS[vendor].elapsedS * 1000 };
}

// ---------------------------------------------------------------------------
// Scenario position
// ---------------------------------------------------------------------------

function enterStage(d: GoData, tripId: TripId, index: number) {
  const stages = SCENARIOS[tripId];
  const stage = stages[index];
  d.chat[tripId].stageIndex = index;
  const trip = d.trips.trips[tripId];
  if (trip) trip.stage = stage.setsTripPlanned ? "planned" : index === 0 && stages.length > 1 ? "new" : "deciding";
  // Entering `plan` makes the trip home J1: one live villa call (J-triphome-calls.md §1.3 "Seeding").
  if (stage.setsTripPlanned) d.home[tripId].calls = [seedCall("villa")];
}

/** Moves to `next.to` when the current stage accepts `trigger`; returns whether it moved. */
export function advance(d: GoData, tripId: TripId, trigger: TriggerId): boolean {
  const stage = stageAt(tripId, d.chat[tripId].stageIndex);
  const next = transitionFor(stage, trigger);
  if (!next) return false;
  const to = stageIndexOf(tripId, next.to);
  if (to < 0) return false;
  if (trigger === "booking-done") completeBooking(d, tripId); // idempotent (E-deciding.md §1.2 `book` pill)
  enterStage(d, tripId, to);
  return true;
}

// Default completion of one stage (E-deciding.md §1.6 ensureStage; F-travel.md §1.3). Fills only unset values;
// never books the cab, sets privateViewed or touches visa. Returns the trigger that leaves the stage.
function completeStageDefaults(d: GoData, tripId: TripId, stage: StageId): TriggerId | null {
  const c = d.chat[tripId];
  switch (stage) {
    case "kickoff":
      // DESIGN-ASSUMPTION: a dismissed quick start stays dismissed (only `pending` is unset), so C3's history survives.
      if (c.quickStart === "pending") c.quickStart = "done";
      c.fromCity ??= clone(DEFAULT_CITY);
      return "place-asked";
    case "places":
      c.placeVote ??= "goa";
      return "place-voted";
    case "dates-talk":
      return "dates-asked";
    case "dates-poll":
      if (c.dateVote === null && !c.flexible) c.dateVote = "diwali";
      return "dates-answered";
    case "budget":
      c.budget.saved = true;
      return "budget-saved";
    case "stays":
      c.stayVote ??= "sol";
      return "stay-voted";
    case "pay":
      claimBooking(d, tripId);
      return c.stayBooking.paid ? "stay-paid" : "stay-claimed";
    case "book":
      completeBooking(d, tripId);
      return "booking-done";
    case "travel":
      if (!c.route.booked) applyRouteBooking(d, tripId, { optionId: SEED_ROUTE_ID, trip: "round" });
      return "route-booked";
    case "route-confirm":
      return "lands-asked";
    case "private":
      return "plan-asked";
    default:
      return null;
  }
}

/** Fast-forwards (never backwards) to `id`, applying every earlier stage's default completion without timers. */
export function ensureStage(d: GoData, tripId: TripId, id: StageId) {
  const target = stageIndexOf(tripId, id);
  if (target < 0) return;
  for (let guard = 0; d.chat[tripId].stageIndex < target && guard < SCENARIOS[tripId].length; guard++) {
    const index = d.chat[tripId].stageIndex;
    const trigger = completeStageDefaults(d, tripId, SCENARIOS[tripId][index].id);
    if (trigger) advance(d, tripId, trigger);
    if (d.chat[tripId].stageIndex === index) enterStage(d, tripId, index + 1);
  }
}

// ---------------------------------------------------------------------------
// Bookings & money side effects
// ---------------------------------------------------------------------------

function addBooking(d: GoData, tripId: TripId, bookingId: string) {
  const list = (d.trips.bookings[tripId] ??= []);
  if (!list.includes(bookingId)) list.push(bookingId);
}

/** Adds seed transactions by id, keeping recorded paybacks on top and seed rows in seed (newest-first) order. */
export function revealTransactions(d: GoData, ids: string[]) {
  const have = new Set(d.money.transactions.map((t) => t.id));
  ids.forEach((id) => have.add(id));
  const recorded = d.money.transactions.filter((t) => t.id.startsWith(RECORDED_TX_PREFIX));
  d.money.transactions = [...recorded, ...TRANSACTIONS.filter((t) => have.has(t.id)).map(clone)];
}

/** E13: Rahul claims the open booking. `claimed` is terminal. */
export function claimBooking(d: GoData, tripId: TripId) {
  const booking = d.chat[tripId].stayBooking;
  if (booking.status !== "open") return;
  booking.status = "claimed";
  booking.by = "rahul";
}

/** Idempotent (E-deciding.md §1.2 `book`): stay booking, Villa Sol transaction(s) and the seeded settlements. */
export function completeBooking(d: GoData, tripId: TripId) {
  const booking = d.chat[tripId].stayBooking;
  if (booking.done) return;
  booking.done = true;
  addBooking(d, tripId, STAY_BOOKING_ID);
  revealTransactions(d, STAY_TX_IDS);
  // DESIGN-ASSUMPTION (PLAN §12.1 #7): seed literals whoever paid.
  if (d.money.settlements.length === 0) d.money.settlements = clone(SETTLEMENTS);
}

/** First booking creates the IndiGo bookings + transactions; a re-book only overwrites `route.booked` (F-travel.md §1.2). */
export function applyRouteBooking(d: GoData, tripId: TripId, sel: TravelSelection) {
  const route = d.chat[tripId].route;
  const first = !route.booked;
  route.booked = { optionId: sel.optionId, trip: sel.trip };
  route.draft = null;
  if (!first) return;
  // DESIGN-ASSUMPTION (PLAN §12.1 #12): always the IndiGo f2 itinerary and ₹8,060, whatever was picked.
  addBooking(d, tripId, FLIGHT_BOOKING_ID);
  if (sel.trip === "round") addBooking(d, tripId, TRAVEL_BACK_BOOKING_ID);
  revealTransactions(d, ROUTE_TX_IDS);
}

/** M7 (M-bookings-money.md §1.6): prepend a payback and reduce the You→Rahul settlement. */
export function recordPayment(d: GoData, payment: RecordedPayment) {
  d.money.recorded.push({ ...payment });
  d.money.transactions.unshift({
    id: `${RECORDED_TX_PREFIX}${d.money.recorded.length}`,
    date: "today", // not used for grouping
    dateLabel: MONEY_COPY.todayLabel,
    payerId: d.session.userId,
    verb: "paid",
    to: { kind: "user", id: "rahul" },
    amount: payment.amount,
    method: payment.via,
    note: payment.note,
    kind: "payback",
    mine: true,
  });
  const owed = d.money.settlements.find((s) => s.fromId === d.session.userId && s.toId === "rahul");
  if (!owed) return;
  owed.amount = Math.max(0, owed.amount - payment.amount);
  owed.status = owed.amount === 0 ? "settled" : "open";
}

/** J6/J7 preset: You→Rahul settled without adding a transaction. */
export function settleYou(d: GoData) {
  const owed = d.money.settlements.find((s) => s.fromId === d.session.userId && s.toId === "rahul");
  if (!owed) return;
  owed.amount = 0;
  owed.status = "settled";
}

// ---------------------------------------------------------------------------
// Trips, joins, invites
// ---------------------------------------------------------------------------

/** Idempotent (B-crew.md §1.3): Goa draft with just you, plus the A6 extras (PLAN §12.1 #3). */
export function createDraftGoa(d: GoData) {
  if (d.trips.trips.goa) return;
  d.trips.trips.goa = clone(TRIPS.goa);
  d.trips.trips.college ??= clone(TRIPS.college);
  d.trips.trips.bali ??= clone(TRIPS.bali);
  const baliCode = TRIPS.bali.inviteCode;
  const baliJoined = d.trips.trips.bali.memberIds.includes(d.session.userId);
  if (!baliJoined && !d.trips.inbox.includes(baliCode)) d.trips.inbox.push(baliCode);
  if (d.trips.pastTrips.length === 0) d.trips.pastTrips = clone(PAST_TRIPS);
}

/** One simulated join on the Goa draft (order aarav, rahul, priya; skips ids already there). */
export function joinGoa(d: GoData, userId: UserId) {
  const goa = d.trips.trips.goa;
  if (goa && !goa.memberIds.includes(userId)) goa.memberIds.push(userId);
}

export const JOINERS: UserId[] = ["rahul", "priya"];

/** B7/G1 Accept: member of the trip, invite leaves App home, Bali chat sits at `visa` (G-bali.md §1.5). */
export function acceptInvite(d: GoData, code: string) {
  const invite = INVITES[code];
  if (!invite) return;
  const trip = (d.trips.trips[invite.tripId] ??= clone(TRIPS[invite.tripId]));
  if (!trip.memberIds.includes(d.session.userId)) trip.memberIds.push(d.session.userId);
  d.trips.inbox = d.trips.inbox.filter((c) => c !== code);
  if (invite.tripId === "bali") ensureStage(d, "bali", "visa");
}
