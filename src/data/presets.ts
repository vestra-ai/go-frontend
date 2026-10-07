import type {
  BudgetRange,
  CheckinStatus,
  CityRef,
  DateOption,
  PlaceOption,
  QuickStartAnswers,
  QuickStartState,
  RouteMode,
  SlotId,
  StageId,
  Stay,
  StayBookingState,
  TravelSelection,
  TripId,
  TripType,
  VendorId,
  VisaUploadKey,
} from "@/data/types";

// One entry per artboard of the 72-artboard Prototype page (PLAN §9.4 `demo`, §9.6).
// Ids, titles, target hrefs and declarative state descriptors taken from each spec's §1.1.
// `applyPreset(id)` (src/store/presets.ts) starts from the initial store every time (deterministic whatever came
// before), then applies, in order: signedIn → trips (goa, bali) → ensureStage(tripId) → chat → home → money /
// cabBooked, and returns `href`. Unlisted fields keep their initial or fast-forwarded values. The chat patch lands
// after ensureStage, so it can undo a default completion (e.g. E1 placeVote null).

export type PresetGroup = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M";

export type PresetId =
  | "A1" | "A4" | "A5" | "A6" | "A7"
  | "B1" | "B2" | "B6" | "B7"
  | "C1" | "C2" | "C3" | "C4" | "C5"
  | "D1" | "D2" | "D3"
  | "E1" | "E2" | "E3" | "E4" | "E5" | "E6" | "E7" | "E8" | "E9" | "E10" | "E11" | "E12" | "E13" | "E14" | "E15"
  | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8"
  | "G1" | "G2" | "G3"
  | "H1" | "H2" | "H3"
  | "I1" | "I2" | "I3" | "I4" | "I5"
  | "J1" | "J2" | "J3" | "J4" | "J5" | "J6" | "J7"
  | "K1" | "K2" | "K3" | "K4"
  | "L1" | "L2" | "L3"
  | "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7";

export interface PresetChatPatch {
  quickStart?: QuickStartState;
  quickStartAnswers?: QuickStartAnswers;
  fromCity?: CityRef | null;
  placeVote?: PlaceOption["id"] | null;
  dateVote?: DateOption["id"] | null;
  flexible?: boolean;
  budget?: BudgetRange;
  stayVote?: Stay["id"] | null;
  stayBooking?: StayBookingState;
  route?: {
    trip?: TripType;
    mode?: RouteMode;
    filt?: string;
    pick?: string | null;
    on?: SlotId[];
    ret?: SlotId[];
    draft?: { on: SlotId[]; ret: SlotId[] } | null;
    booked?: TravelSelection;
  };
  privateViewed?: boolean;
  visa?: { uploads: Record<VisaUploadKey, boolean>; sent: boolean };
}

export interface PresetHomePatch {
  calls?: VendorId[]; // each seeded with startedAt = now − VENDOR_CALLS[v].elapsedS × 1000, asking = defaultAsk
  lastCall?: VendorId | null;
  resolved?: VendorId[];
  checkin?: { status?: CheckinStatus; digiYatra?: boolean; declaration?: boolean; seat?: string };
  daysToGo?: string;
  openRow?: "stay" | "fly" | null; // mirrors the href's `?open=` (J2–J4) so the store matches the artboard
}

export interface PresetState {
  signedIn: boolean;
  // absent = no trips (A4) · draft = Goa with memberIds ['aarav'] · crew = Rahul + Priya joined.
  // Whenever Goa exists, createDraftGoa's extras exist too (College gang, Bali invite, past trips; PLAN §12.1 #3).
  goa: "absent" | "draft" | "crew";
  baliAccepted?: boolean; // acceptInvite('bali-x9m') → chat.bali at stage `visa`
  tripId?: TripId; // trip whose chat/home slices the patches below apply to
  ensureStage?: StageId; // fast-forward with default completions, no timers (PLAN §9.3)
  chat?: PresetChatPatch;
  home?: PresetHomePatch;
  money?: { youSettled?: true }; // You→Rahul settlement settled (J6/J7)
  cabBooked?: boolean; // chat.cab.booked set (J6/J7 all-set)
}

export interface Preset {
  id: PresetId;
  group: PresetGroup;
  title: string; // canvas title without the id prefix; the select label is `${id} · ${title}`
  href: string; // route + query applyPreset returns
  state: PresetState;
}

const preset = (id: PresetId, title: string, href: string, state: PresetState): Preset => ({
  id,
  group: id[0] as PresetGroup,
  title,
  href,
  state,
});

// Shared descriptors ---------------------------------------------------------

const GOA_CREW = { signedIn: true, goa: "crew", tripId: "goa" } as const;
const KICKOFF_CHAT: PresetChatPatch = {
  quickStart: "pending",
  quickStartAnswers: { vibe: "beach", spend: null },
  fromCity: null,
};
const BENGALURU: CityRef = { id: "blr", name: "Bengaluru" };
const PLANNED: PresetState = { ...GOA_CREW, ensureStage: "plan" };
const HOME_IDLE: PresetHomePatch = { calls: [], lastCall: null, resolved: [], checkin: { status: "not-open" }, daysToGo: "in 34 days" };
const J6_STATE: PresetState = {
  ...PLANNED,
  home: { ...HOME_IDLE, lastCall: "villa", resolved: ["villa", "indigo"] },
  money: { youSettled: true },
  cabBooked: true,
};
const K_OPEN: PresetHomePatch = { ...HOME_IDLE, checkin: { status: "open", digiYatra: true, declaration: true, seat: "14A" }, daysToGo: "in 2 days" };
const A6_STATE: PresetState = { signedIn: true, goa: "crew", tripId: "goa", ensureStage: "plan" };
const BALI_PENDING: PresetState = { ...A6_STATE, baliAccepted: false };
const BALI_VISA: PresetState = {
  signedIn: true,
  goa: "crew",
  baliAccepted: true,
  tripId: "bali",
  ensureStage: "visa",
  chat: { visa: { uploads: { passport: false, photo: false }, sent: false } },
};
const E1_STATE: PresetState = { ...GOA_CREW, ensureStage: "places", chat: { placeVote: null } };
const E6_STATE: PresetState = { ...GOA_CREW, ensureStage: "budget", chat: { budget: { lo: 15000, hi: 25000, saved: false } } };
const E8_STATE: PresetState = { ...GOA_CREW, ensureStage: "stays", chat: { stayVote: null } };
const E12_STATE: PresetState = { ...GOA_CREW, ensureStage: "pay", chat: { stayBooking: { status: "open", paid: false, done: false } } };
const D_STATE: PresetState = { ...GOA_CREW, ensureStage: "dates-talk" }; // sent [], reactions {} (initial store)
const C3_STATE: PresetState = { ...GOA_CREW, chat: { ...KICKOFF_CHAT, quickStart: "dismissed" } };
const F2_ROUTE: PresetChatPatch["route"] = { trip: "round", mode: "flight", filt: "all", pick: null, on: [], ret: [], draft: null };
const I_STATE: PresetState = { ...GOA_CREW, chat: KICKOFF_CHAT };
const M_STATE: PresetState = PLANNED; // money = seed after ensureStage('plan'), nothing recorded

const CHAT = "/trips/goa/chat";
const HOME = "/trips/goa";

export const PRESETS: Preset[] = [
  // A · Sign in & app home (A-onboarding.md §1.1)
  preset("A1", "Welcome", "/", { signedIn: false, goa: "absent" }),
  preset("A4", "Home, first sign-up · ideas carousel", "/home", { signedIn: true, goa: "absent" }),
  preset("A5", "Profile · first sign-up · new", "/profile", { signedIn: true, goa: "absent" }),
  preset("A6", "App home · your trips + invites", "/home", A6_STATE),
  preset("A7", "Profile · from app home · new", "/profile", A6_STATE),

  // B · Invite crew (B-crew.md §1.1)
  preset("B1", "Who’s coming, empty", "/trips/new", { signedIn: true, goa: "draft" }),
  preset("B2", "Share sheet · invite link · new", "/trips/new?sheet=share", { signedIn: true, goa: "draft" }),
  preset("B6", "Who’s coming, link", "/trips/new?joined=2", { signedIn: true, goa: "draft" }),
  preset("B7", "Friend taps the link · join Goa crew · updated", "/invite/goa-k7q", { signedIn: true, goa: "crew" }),

  // C · Chat kickoff (C-chat-kickoff.md §1.1)
  preset("C1", "Quick start · cities in one line, Other city searches inline · updated", CHAT, { ...GOA_CREW, chat: KICKOFF_CHAT }),
  preset("C2", "Go opens · variant A", CHAT, { ...GOA_CREW, chat: { ...KICKOFF_CHAT, quickStart: "done", fromCity: BENGALURU } }),
  preset("C3", "After skipping quick start", CHAT, C3_STATE),
  preset("C4", "From sheet · cities in one line + Other city · updated", `${CHAT}?sheet=from`, C3_STATE),
  preset("C5", "From sheet · Other city expanded with search · updated", `${CHAT}?sheet=from&q=Ind`, C3_STATE),

  // D · Message actions (C-chat-kickoff.md §1.1)
  preset("D1", "Long-press · reactions and copy work · updated", `${CHAT}?mode=longpress&msg=dt-arjun`, D_STATE),
  preset("D2", "Replying · send posts the reply · updated", `${CHAT}?mode=reply&msg=dt-arjun`, D_STATE),
  preset("D3", "Ask Go · suggestions fill the box · updated", `${CHAT}?mode=askGo&msg=dt-arjun`, D_STATE),

  // E · Deciding together (E-deciding.md §1.1)
  preset("E1", "Go suggests places", CHAT, E1_STATE),
  preset("E2", "Place details", `${CHAT}?sheet=place&id=goa`, E1_STATE),
  preset("E3", "Place details · Gokarna · new", `${CHAT}?sheet=place&id=gokarna`, E1_STATE),
  preset("E4", "Place details · Udaipur · new", `${CHAT}?sheet=place&id=udaipur`, E1_STATE),
  preset("E5", "Dates poll + I’m flexible", CHAT, { ...GOA_CREW, ensureStage: "dates-poll", chat: { dateVote: null, flexible: false } }),
  preset("E6", "Budget ask", CHAT, E6_STATE),
  preset("E7", "Budget sheet · min–max slider", `${CHAT}?sheet=budget`, E6_STATE),
  preset("E8", "Go suggests stays", CHAT, E8_STATE),
  preset("E9", "Stay details · Villa Sol · new", `${CHAT}?sheet=stay&id=sol`, E8_STATE),
  preset("E10", "Stay details · Casa Azul · new", `${CHAT}?sheet=stay&id=azul`, E8_STATE),
  preset("E11", "Stay details · The Palms · new", `${CHAT}?sheet=stay&id=palms`, E8_STATE),
  preset("E12", "One person books", CHAT, E12_STATE),
  preset("E13", "Others see who’s booking", CHAT, {
    ...GOA_CREW,
    ensureStage: "pay",
    chat: { stayBooking: { status: "claimed", by: "rahul", paid: false, done: false } },
  }),
  preset("E14", "Payment sheet", `${CHAT}?sheet=pay`, E12_STATE),
  preset("E15", "Booking the stay", CHAT, {
    ...GOA_CREW,
    ensureStage: "book",
    chat: { stayBooking: { status: "claimed", by: "rahul", paid: true, done: false } },
  }),

  // F · Travel, private, plan (F-travel.md §1.1). ensureStage never books the cab or sets privateViewed.
  preset("F1", "Travel ask", CHAT, { ...GOA_CREW, ensureStage: "travel" }),
  preset("F2", "Route sheet · BLR ⇄ GOA, flight / train / bus, filters · updated", `${CHAT}?sheet=route`, {
    ...GOA_CREW,
    ensureStage: "travel",
    chat: { route: F2_ROUTE },
  }),
  preset("F3", "Preferred time slots · onward and return · new", `${CHAT}?sheet=route`, {
    ...GOA_CREW,
    ensureStage: "travel",
    chat: { route: { ...F2_ROUTE, on: ["s3"], draft: { on: ["s3"], ret: [] } } },
  }),
  preset("F4", "Who lands when · cab Book opens a sheet", CHAT, {
    ...GOA_CREW,
    ensureStage: "route-confirm",
    chat: { route: { booked: { optionId: "f2", trip: "round" } } },
  }),
  preset("F5", "Cab sheet · All / Sedan / SUV, total price · updated", `${CHAT}?sheet=cab`, { ...GOA_CREW, ensureStage: "route-confirm" }),
  preset("F6", "Private answer in group", CHAT, { ...GOA_CREW, ensureStage: "private", chat: { privateViewed: false } }),
  preset("F7", "Just-for-me sheet", `${CHAT}?sheet=private`, { ...GOA_CREW, ensureStage: "private", chat: { privateViewed: true } }),
  preset("F8", "Go’s final plan", CHAT, PLANNED),

  // G · Bali (G-bali.md §1.1)
  preset("G1", "Bali invite from app home · join · new", "/invite/bali-x9m", BALI_PENDING),
  preset("G2", "Visa ask", "/trips/bali/chat", BALI_VISA),
  preset("G3", "Visa details sheet", "/trips/bali/chat?sheet=visa", BALI_VISA),

  // H · Trip board (H-board.md §1.1). An explicit ?sheet= suppresses the QuickStart auto-open.
  preset("H1", "Board, empty", `${CHAT}?sheet=board`, { ...GOA_CREW, chat: { ...KICKOFF_CHAT, quickStart: "dismissed" } }),
  preset("H2", "Board, stay poll open", `${CHAT}?sheet=board`, E8_STATE),
  preset("H3", "Board · Go reminds you to book your return", `${CHAT}?sheet=board`, {
    ...PLANNED,
    chat: { route: { booked: { optionId: "f2", trip: "oneway" } } },
  }),

  // I · Trip plan, nothing decided (I-plan-empty.md §1.1): goa at kickoff, quick start pending
  preset("I1", "Home, empty", HOME, I_STATE),
  preset("I2", "Itinerary, empty", `${HOME}/itinerary`, I_STATE),
  preset("I3", "Bookings, empty", `${HOME}/bookings`, I_STATE),
  preset("I4", "Expenses, empty · everyone", `${HOME}/expenses?scope=everyone`, I_STATE),
  preset("I5", "Expenses, empty · just me", `${HOME}/expenses?scope=me`, I_STATE),

  // J · Trip home & calls (J-triphome-calls.md §1.1)
  preset("J1", "Home · one live call, full width · updated", HOME, { ...PLANNED, home: { ...HOME_IDLE, calls: ["villa"] } }),
  preset("J2", "Home · stay row opened · call options + details · new", `${HOME}?open=stay`, {
    ...PLANNED,
    home: { ...HOME_IDLE, openRow: "stay" },
  }),
  preset("J3", "Home · flights row opened · call options + details · new", `${HOME}?open=fly`, {
    ...PLANNED,
    home: { ...HOME_IDLE, calls: ["villa"], openRow: "fly" },
  }),
  preset("J4", "Home · tapped Call IndiGo · 2 calls, swipe · updated", `${HOME}?open=fly`, {
    ...PLANNED,
    home: { ...HOME_IDLE, calls: ["villa", "indigo"], openRow: "fly" },
  }),
  preset("J5", "Listening in · booking details, mute, take over, end · updated", `${HOME}?sheet=listen&call=villa`, {
    ...PLANNED,
    home: { ...HOME_IDLE, calls: ["villa"] },
  }),
  preset("J6", "Home · all done · last call recording", HOME, J6_STATE),
  preset("J7", "Call recording · outcome, player, transcript", `${HOME}?sheet=recording&call=villa`, J6_STATE),

  // K · Web check-in (K-checkin.md §1.1)
  preset("K1", "Home · web check-in open, 2 days before", HOME, { ...PLANNED, home: K_OPEN }),
  preset("K2", "Check-in 1 · details", `${HOME}?sheet=checkin&step=details`, { ...PLANNED, home: K_OPEN }),
  preset("K3", "Check-in 2 · seat next to Arjun", `${HOME}?sheet=checkin&step=seat`, { ...PLANNED, home: K_OPEN }),
  preset("K4", "Check-in 3 · boarding pass", `${HOME}/checkin/pass`, {
    ...PLANNED,
    home: { ...K_OPEN, checkin: { status: "done", digiYatra: true, declaration: true, seat: "14A" } },
  }),

  // L · Itinerary & map (L-itinerary-map.md §1.1)
  preset("L1", "Itinerary · everyone · full-height map, route tapped", `${HOME}/itinerary?scope=everyone&view=map&area=trip&sel=blr`, PLANNED),
  preset("L2", "Itinerary · just me · list, same map on toggle", `${HOME}/itinerary?scope=me&view=list&area=trip&sel=none`, PLANNED),
  preset("L3", "Itinerary map · In Goa · Villa Sol tapped", `${HOME}/itinerary?scope=everyone&view=map&area=goa&sel=villa`, PLANNED),

  // M · Bookings & expenses (M-bookings-money.md §1.1)
  preset("M1", "Bookings · booked only", `${HOME}/bookings`, M_STATE),
  preset("M2", "Bookings · scrolled, header collapsed", `${HOME}/bookings?collapsed=1`, M_STATE),
  preset("M3", "Ticket PDF viewer", `${HOME}/bookings/travel-out/ticket`, M_STATE),
  preset("M4", "Expenses · everyone + transactions", `${HOME}/expenses`, M_STATE),
  preset("M5", "Expenses · just me + transactions", `${HOME}/expenses?scope=me`, M_STATE),
  preset("M6", "All transactions · filters work · updated", `${HOME}/expenses/transactions`, M_STATE),
  preset("M7", "Record a payment", `${HOME}/expenses?scope=me&sheet=record`, M_STATE),
];

export const PRESET_IDS: PresetId[] = PRESETS.map((p) => p.id);

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
