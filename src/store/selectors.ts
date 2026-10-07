import { CHIP_ORDER, headerFor, pillFor, seedMessagesByStage, stageAt } from "@/data/scenario/engine";
import { BUDGET_SAVED_CHIP } from "@/data/scenario/goa";
import { BOOKINGS } from "@/data/seed/bookings";
import { VENDOR_CALLS } from "@/data/seed/calls";
import { board as boardCopy, chat as chatCopy, planZero, tripHome } from "@/data/seed/copy";
import { ITINERARY, ITINERARY_DAYS } from "@/data/seed/itinerary";
import { MONEY_COPY, MY_BUDGET_INR, MY_STAY_SHARE_INR } from "@/data/seed/money";
import { ALL_ROUTES } from "@/data/seed/routes";
import { STAYS } from "@/data/seed/stays";
import { TRIP_IDS } from "@/data/seed/trips";
import { CREW_OF_4 } from "@/data/seed/users";
import { baliVisa } from "@/data/seed/visa";
import type {
  ChipKey,
  ChipState,
  Invite,
  ItineraryDay,
  ItineraryItem,
  Message,
  PillReady,
  ScenarioStage,
  Settlement,
  StageHeader,
  StageId,
  Stay,
  TicketDoc,
  Transaction,
  Trip,
  TripId,
  TriggerId,
  User,
  UserId,
  VendorCall,
  VisaMember,
} from "@/data/types";
import { inr } from "@/lib/format";
import type { ChatTripData, GoData, MoneyData } from "@/store/state";

// Derived state (PLAN §9.4 `derived`). Every selector is pure `(state, ...args)` and memoised on the store slices it
// reads (immer keeps untouched slices referentially stable), so `useStore((s) => selectX(s, id))` never loops in
// zustand 5. Hooks wrapping them live in ./hooks.ts.

type Inputs = readonly unknown[];

function memo<A extends unknown[], I extends Inputs, R>(
  pick: (s: GoData, ...args: A) => I,
  compute: (inputs: I, ...args: A) => R,
): (s: GoData, ...args: A) => R {
  const cache = new Map<string, { inputs: I; result: R }>();
  return (s, ...args) => {
    const key = args.join("|");
    const inputs = pick(s, ...args);
    const hit = cache.get(key);
    if (hit && hit.inputs.length === inputs.length && hit.inputs.every((v, i) => Object.is(v, inputs[i]))) return hit.result;
    const result = compute(inputs, ...args);
    cache.set(key, { inputs, result });
    return result;
  };
}

export type Scope = "everyone" | "me";

const MONEY_TRIP: TripId = "goa"; // the only trip with money in the design
const ME_SPLIT = CREW_OF_4.length; // "split 4 ways" (PLAN §12.1 #1)
const VILLA_SOL = STAYS[0].name;

// ---------------------------------------------------------------------------
// Plain lookups (stable references, no memo needed)
// ---------------------------------------------------------------------------

export const selectSession = (s: GoData) => s.session;
export const selectTrip = (s: GoData, tripId: TripId): Trip | undefined => s.trips.trips[tripId];
export const selectChat = (s: GoData, tripId: TripId): ChatTripData => s.chat[tripId];
export const selectHome = (s: GoData, tripId: TripId) => s.home[tripId];
export const selectStage = (s: GoData, tripId: TripId): ScenarioStage => stageAt(tripId, s.chat[tripId].stageIndex);

/** `'zero'` until the trip's chat reaches `plan` (I-plan-empty.md §1.4; college always zero). */
export const selectTripHomeMode = (s: GoData, tripId: TripId): "zero" | "populated" =>
  s.trips.trips[tripId]?.stage === "planned" ? "populated" : "zero";

/** Ticket viewer lookup: seed data, not stage-gated (M-bookings-money.md §1.7). */
export const selectTicket = (_s: GoData, _tripId: TripId, bookingId: string): TicketDoc | null =>
  BOOKINGS.find((b) => b.id === bookingId)?.ticket ?? null;

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChipView extends ChipState {
  key: ChipKey;
  emoji: string;
}

function chipsFor(tripId: TripId, c: ChatTripData): ChipView[] {
  const stage = stageAt(tripId, c.stageIndex);
  return CHIP_ORDER.map((key) => {
    let chip: ChipState = stage.chips[key];
    if (key === "from" && c.fromCity) chip = { label: c.fromCity.name, state: "set" };
    // The budget chip is `active` through the whole budget stage until saved (E-deciding.md §1.7 #11).
    if (key === "budget" && stage.id === "budget" && c.budget.saved) chip = BUDGET_SAVED_CHIP;
    return { key, emoji: chatCopy.chipEmoji[key], ...chip };
  });
}

export const selectChips = memo(
  (s, tripId: TripId) => [s.chat[tripId]] as const,
  ([c], tripId) => chipsFor(tripId, c),
);

/** Header subtitle + stack: the current stage's, keyed by quickStart in kickoff (C-chat-kickoff.md §1.3). */
export const selectChatHeader = memo(
  (s, tripId: TripId) => [s.chat[tripId].stageIndex, s.chat[tripId].quickStart] as const,
  ([index, quickStart], tripId): StageHeader => headerFor(stageAt(tripId, index), quickStart),
);
export const selectHeader = selectChatHeader; // PLAN §9.4 name

export interface ChatMessage extends Message {
  myReaction?: string; // your reaction (D1), already merged into `reaction`
}

/** Seed messages of stages 0..stageIndex (showIf/live applied) with sends interleaved per stage (C-chat-kickoff.md §1.3). */
export const selectMessages = memo(
  (s, tripId: TripId) => [s.chat[tripId]] as const,
  ([c], tripId): ChatMessage[] => {
    const withReaction = (m: Message): ChatMessage => {
      const mine = c.reactions[m.id];
      if (!mine) return m;
      const count = m.reaction?.emoji === mine ? m.reaction.count + 1 : 1;
      return { ...m, reaction: { emoji: mine, count }, myReaction: mine };
    };
    const groups = seedMessagesByStage(tripId, c.stageIndex, { quickStart: c.quickStart, stayBooking: c.stayBooking });
    return groups.flatMap((g) => [...g.messages, ...c.sent.filter((m) => m.stage === g.stage)].map(withReaction));
  },
);

export interface NextPill {
  label: string;
  trigger: TriggerId;
  to: StageId;
  ready: PillReady; // 'dates-nudge': show after DATES_NUDGE_MS with no composer mode (P3-9 timer)
  inSheet?: "budget"; // rendered inside BudgetSheet
}

function pillReady(ready: PillReady, c: ChatTripData): boolean {
  switch (ready) {
    case "place-vote":
      return c.placeVote !== null;
    case "date-vote-or-flexible":
      return c.dateVote !== null || c.flexible;
    case "budget-saved":
      return c.budget.saved;
    case "stay-vote":
      return c.stayVote !== null;
    case "claimed-by-rahul":
      return c.stayBooking.status === "claimed" && c.stayBooking.by === "rahul";
    default:
      return true; // 'entry', and 'dates-nudge' (timer-gated by the page)
  }
}

export const selectNextPill = memo(
  (s, tripId: TripId) => [s.chat[tripId]] as const,
  ([c], tripId): NextPill | null => {
    const next = pillFor(stageAt(tripId, c.stageIndex));
    if (!next?.pill || !pillReady(next.pill.ready, c)) return null;
    return { label: next.pill.label, trigger: next.trigger, to: next.to, ready: next.pill.ready, inSheet: next.pill.inSheet };
  },
);

// ---------------------------------------------------------------------------
// Board (H-board.md §1.3)
// ---------------------------------------------------------------------------

export type BoardTarget = "where" | "when" | "stay" | "budget" | "travel";
export type BoardTrailing =
  | { kind: "ask"; label: string }
  | { kind: "change" }
  | { kind: "status"; tone: "success" | "amber"; label: string };
export type BoardRowModel =
  | { kind: "row"; key: BoardTarget; emoji: string; eyebrow: string; value: string; sub: string; trailing: BoardTrailing }
  | {
      kind: "poll";
      key: "stay";
      emoji: string;
      eyebrow: string;
      value: string;
      sub: string;
      cta: string;
      options: { id: Stay["id"]; name: string; img: string; votes: number }[];
    };
export interface BoardReminder {
  eyebrow: string;
  value: string;
  sub: string;
  cta: string;
  target: "travel";
}
export type BoardSpend =
  | { kind: "empty" }
  | { kind: "filled"; stay: number; travel: number; budget: number; left: number };
export interface BoardModel {
  subtitle: string;
  rows: BoardRowModel[];
  reminder?: BoardReminder;
  spend: BoardSpend;
}

type RowCopy = { eyebrow: string; value: string; sub: string };
const row = (key: BoardTarget, emoji: string, copy: RowCopy, trailing: BoardTrailing): BoardRowModel => ({
  kind: "row",
  key,
  emoji,
  eyebrow: copy.eyebrow,
  value: copy.value,
  sub: copy.sub,
  trailing,
});
const CHANGE: BoardTrailing = { kind: "change" };

function boardFor(tripId: TripId, c: ChatTripData): BoardModel {
  const R = boardCopy.rows;
  const chips = Object.fromEntries(chipsFor(tripId, c).map((chip) => [chip.key, chip])) as Record<ChipKey, ChipView>;
  const stage = stageAt(tripId, c.stageIndex);
  const booked = c.route.booked;

  const whereSet = chips.where.state === "set";
  const whenSet = chips.when.state === "set";
  const stayBooked = c.stayBooking.done;
  const stayDecided = chips.stay.state === "set";
  const stayVoting = !stayBooked && !stayDecided && stage.id === "stays";

  let stay: BoardRowModel;
  if (stayBooked) stay = row("stay", R.stay.emoji, R.stay.booked, { kind: "status", tone: "success", label: R.stay.booked.status });
  else if (stayDecided) stay = row("stay", R.stay.emoji, R.stay.decided, CHANGE); // DESIGN-ASSUMPTION: state not drawn
  else if (stayVoting) {
    const voted = new Set(STAYS.flatMap((x) => x.voters)).size + (c.stayVote ? 1 : 0);
    stay = {
      kind: "poll",
      key: "stay",
      emoji: R.stay.emoji,
      eyebrow: R.stay.voteOpen.eyebrow,
      value: R.stay.voteOpen.value,
      sub: R.stay.voteOpen.sub(voted),
      cta: R.stay.voteOpen.cta,
      options: STAYS.map((x) => ({ id: x.id, name: x.name, img: x.img, votes: x.voters.length + (c.stayVote === x.id ? 1 : 0) })),
    };
  } else stay = row("stay", R.stay.emoji, R.stay.notSet, { kind: "ask", label: R.stay.notSet.ask });

  let travel: BoardRowModel;
  if (booked?.trip === "round") travel = row("travel", R.travel.emoji, R.travel.booked, { kind: "status", tone: "success", label: R.travel.booked.status });
  else if (booked?.trip === "oneway") travel = row("travel", R.travel.emoji, R.travel.partial, { kind: "status", tone: "amber", label: R.travel.partial.status });
  else travel = row("travel", R.travel.emoji, R.travel.notSet, { kind: "ask", label: R.travel.notSet.ask });

  const rows: BoardRowModel[] = [
    whereSet ? row("where", R.where.emoji, R.where.decided, CHANGE) : row("where", R.where.emoji, R.where.notSet, { kind: "ask", label: R.where.notSet.ask }),
    whenSet ? row("when", R.when.emoji, R.when.decided, CHANGE) : row("when", R.when.emoji, R.when.notSet, { kind: "ask", label: R.when.notSet.ask }),
    stay,
    c.budget.saved ? row("budget", R.budget.emoji, R.budget.decided, CHANGE) : row("budget", R.budget.emoji, R.budget.notSet, { kind: "ask", label: R.budget.notSet.ask }),
    travel,
  ];

  const allNotSet = rows.every((r) => r.kind === "row" && r.trailing.kind === "ask");
  const subtitle = allNotSet
    ? boardCopy.subtitles.empty
    : whereSet && whenSet && (stayDecided || stayBooked)
      ? boardCopy.subtitles.settled
      : boardCopy.subtitles.polling;

  let spend: BoardSpend = { kind: "empty" };
  if (c.budget.saved) {
    const option = booked ? ALL_ROUTES.find((o) => o.id === booked.optionId) : undefined;
    const stayAmount = stayBooked ? MY_STAY_SHARE_INR : 0;
    const travelAmount = option && booked ? (booked.trip === "oneway" ? option.one : option.round) : 0;
    spend = { kind: "filled", stay: stayAmount, travel: travelAmount, budget: MY_BUDGET_INR, left: MY_BUDGET_INR - stayAmount - travelAmount };
  }

  const reminder: BoardReminder | undefined = booked?.trip === "oneway" ? { ...boardCopy.reminder, target: "travel" } : undefined;
  return { subtitle, rows, ...(reminder ? { reminder } : {}), spend };
}

export const selectBoard = memo(
  (s, tripId: TripId) => [s.chat[tripId]] as const,
  ([c], tripId) => boardFor(tripId, c),
);

// ---------------------------------------------------------------------------
// Trip home (J-triphome-calls.md §1.3, §1.6; K-checkin.md §1.5)
// ---------------------------------------------------------------------------

export type PendingItem = { kind: "checkin" } | { kind: "settle" } | { kind: "cab" };

const yourSettlement = (settlements: Settlement[]) => settlements.find((x) => x.fromId === "aarav" && x.toId === "rahul");

/** Ordered: check-in (open), settle-up (until any payment is recorded), airport cab (until booked). */
export const selectPending = memo(
  (s, tripId: TripId) =>
    [s.home[tripId].checkin.status, s.chat[tripId].cab.booked, s.money.settlements, s.money.recorded.length] as const,
  ([checkin, cabBooked, settlements, recorded], tripId): PendingItem[] => {
    const items: PendingItem[] = [];
    if (checkin === "open") items.push({ kind: "checkin" });
    const owed = tripId === MONEY_TRIP ? yourSettlement(settlements) : undefined;
    if (owed?.status === "open" && recorded === 0) items.push({ kind: "settle" });
    if (!cabBooked) items.push({ kind: "cab" });
    return items;
  },
);

export interface DoneRow {
  key: "stay" | "fly" | "cab" | "settled" | "budget" | "dates";
  emoji: string;
  title: string;
  sub: string;
  expandable?: "stay" | "fly";
}

export const selectDone = memo(
  (s, tripId: TripId) => [s.home[tripId].resolved, s.home[tripId].checkin, s.chat[tripId].cab.booked, s.money.settlements] as const,
  ([resolved, checkin, cabBooked, settlements], tripId): DoneRow[] => {
    const D = tripHome.done;
    const flySub = resolved.includes("indigo")
      ? D.fly.subResolved
      : checkin.status === "done"
        ? D.fly.subCheckedIn(checkin.seat) // optional deviation (K-checkin.md §1.5)
        : D.fly.sub;
    const rows: DoneRow[] = [
      { key: "stay", emoji: D.stay.emoji, title: D.stay.title, sub: resolved.includes("villa") ? D.stay.subResolved : D.stay.sub, expandable: "stay" },
      { key: "fly", emoji: D.fly.emoji, title: D.fly.title, sub: flySub, expandable: "fly" },
    ];
    if (cabBooked) rows.push({ key: "cab", ...D.cab });
    if (tripId === MONEY_TRIP && yourSettlement(settlements)?.status === "settled") rows.push({ key: "settled", ...D.settled });
    rows.push({ key: "budget", ...D.budget }, { key: "dates", ...D.dates });
    return rows;
  },
);

export interface LiveCall extends VendorCall {
  asking: string;
  startedAt: number;
}

export const selectLiveCalls = memo(
  (s, tripId: TripId) => [s.home[tripId].calls] as const,
  ([calls]): LiveCall[] => calls.map((c) => ({ ...VENDOR_CALLS[c.vendor], asking: c.asking, startedAt: c.startedAt })),
);

/** goa/bali: the current stage's header stack; college: its own members (I-plan-empty.md §1.4). */
export const selectTripMembers = memo(
  (s, tripId: TripId) => [s.trips.trips[tripId], s.chat[tripId].stageIndex, s.chat[tripId].quickStart, s.trips.members] as const,
  ([trip, index, quickStart, members], tripId): User[] => {
    const ids = tripId === "college" ? (trip?.memberIds ?? []) : headerFor(stageAt(tripId, index), quickStart).memberIds;
    return ids.map((id) => members[id]);
  },
);

/** Chat FAB preview: zero trips use the kickoff line; populated ones switch on whether anything is pending. */
export const selectChatPreview = memo(
  (s, tripId: TripId) => [selectTripHomeMode(s, tripId), selectPending(s, tripId)] as const,
  ([mode, pending]): { text: string; unread: number } => {
    if (mode === "zero") return { text: planZero.chatPreview.text, unread: planZero.chatPreview.unread };
    const fab = pending.length === 0 ? tripHome.fab.allSet : tripHome.fab.busy;
    return { text: fab.preview, unread: fab.unread };
  },
);

// ---------------------------------------------------------------------------
// Home / trips
// ---------------------------------------------------------------------------

/** Trips you are a member of, in seed order (A-onboarding.md §1.1 `activeTrips`). Empty → A4. */
export const selectMyTrips = memo(
  (s) => [s.trips.trips, s.session.userId] as const,
  ([trips, userId]): Trip[] => TRIP_IDS.flatMap((id) => (trips[id]?.memberIds.includes(userId) ? [trips[id]] : [])),
);

/** Invites listed on App home: in the inbox and not yet joined. */
export const selectPendingInvites = memo(
  (s) => [s.trips.inbox, s.trips.invites, s.trips.trips, s.session.userId] as const,
  ([inbox, invites, trips, userId]): Invite[] =>
    inbox.flatMap((code) => {
      const invite = invites[code];
      return invite && !trips[invite.tripId]?.memberIds.includes(userId) ? [invite] : [];
    }),
);

// ---------------------------------------------------------------------------
// Plan tabs
// ---------------------------------------------------------------------------

/** Booked cards in seed order; empty until the first booking (PLAN §12.1 #23: data-driven zero state). */
export const selectBookings = memo(
  (s, tripId: TripId) => [s.trips.bookings[tripId]] as const,
  ([ids]) => BOOKINGS.filter((b) => ids?.includes(b.id) ?? false),
);

export interface ItineraryDayView {
  day: ItineraryDay;
  label: string;
  rows: ItineraryItem[];
}

/** `mine` applied for "Just me", hidden rows and empty days dropped (L-itinerary-map.md §1.4). */
export const selectItinerary = memo<[TripId, Scope], readonly [], ItineraryDayView[]>(
  () => [] as const,
  (_inputs, tripId, scope) => {
    if (tripId !== "goa") return [];
    return ITINERARY_DAYS.map(({ key, label }) => ({
      day: key,
      label,
      rows: ITINERARY.filter((item) => item.day === key).flatMap((item) => {
        if (scope === "everyone") return [item];
        if (item.mine === null) return [];
        return [{ ...item, ...item.mine }];
      }),
    })).filter((d) => d.rows.length > 0);
  },
);

export interface MoneyView {
  total: number;
  caption: string;
  bar: { track: boolean; stayPct: number; travelPct: number | null; aria: string };
  tiles: { stay: number; travel: number };
  footnote: string | null;
  showEditBudget: boolean;
  settlements: Settlement[];
  rows: Transaction[];
  seeAll: string;
  transactions: Transaction[]; // every row (Transactions page, "All n")
}

const pct1 = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);
const isStay = (t: Transaction) => t.to.kind === "merchant" && t.to.name === VILLA_SOL;
const sum = (rows: Transaction[]) => rows.reduce((n, t) => n + t.amount, 0);

/** M4/M5 view (M-bookings-money.md §1.7); totals come from the revealed booking transactions. */
export const selectMoney = memo<[TripId, Scope], readonly [MoneyData | null, UserId], MoneyView>(
  (s, tripId) => [tripId === MONEY_TRIP ? s.money : null, s.session.userId] as const,
  ([money, userId], _tripId, scope) => {
    const transactions = money?.transactions ?? [];
    const settlements = money?.settlements ?? [];
    const bookings = transactions.filter((t) => t.kind === "booking");
    const crewStay = sum(bookings.filter(isStay));
    const crewTravel = sum(bookings.filter((t) => !isStay(t)));
    if (scope === "everyone") {
      return {
        total: crewStay + crewTravel,
        caption: MONEY_COPY.everyoneCaption,
        bar: { track: false, stayPct: pct1(crewStay, crewStay + crewTravel), travelPct: null, aria: MONEY_COPY.barAriaEveryone(inr(crewStay), inr(crewTravel)) },
        tiles: { stay: crewStay, travel: crewTravel },
        footnote: null,
        showEditBudget: false,
        settlements,
        rows: transactions.slice(0, 5),
        seeAll: MONEY_COPY.seeAll(transactions.length),
        transactions,
      };
    }
    const budget = MY_BUDGET_INR;
    const meStay = Math.round(crewStay / ME_SPLIT);
    const meTravel = sum(bookings.filter((t) => !isStay(t) && t.payerId === userId));
    const total = meStay + meTravel;
    return {
      total,
      caption: MONEY_COPY.meCaption(inr(budget - total), inr(budget)),
      bar: { track: true, stayPct: pct1(meStay, budget), travelPct: pct1(meTravel, budget), aria: MONEY_COPY.barAriaMe(Math.floor((total / budget) * 100)) },
      tiles: { stay: meStay, travel: meTravel },
      footnote: MONEY_COPY.meFootnote,
      showEditBudget: true,
      settlements,
      rows: transactions.filter((t) => t.mine),
      seeAll: MONEY_COPY.seeEveryone,
      transactions,
    };
  },
);

// ---------------------------------------------------------------------------
// Bali visa (G-bali.md §1.3)
// ---------------------------------------------------------------------------

export interface VisaRow {
  user: User;
  isYou: boolean;
  sub: string;
  status: VisaMember["status"];
}

export const selectVisaRows = memo(
  (s, tripId: TripId) => [s.chat[tripId].visa.sent, s.trips.members, s.session.userId] as const,
  ([sent, members, userId]): VisaRow[] =>
    baliVisa.members.map((m) => {
      const isYou = m.userId === userId;
      return isYou && sent
        ? { user: members[m.userId], isYou, sub: baliVisa.youSentSub, status: "sent" }
        : { user: members[m.userId], isYou, sub: m.sub, status: m.status };
    }),
);
