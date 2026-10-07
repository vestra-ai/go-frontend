import { CHECKIN_DEFAULTS } from "@/data/seed/checkin";
import { INVITES } from "@/data/seed/invites";
import { BUDGET_RANGE } from "@/data/seed/money";
import { TRIPS, TRIP_IDS } from "@/data/seed/trips";
import { SESSION_USER_ID, USERS } from "@/data/seed/users";
import type {
  ActiveCall,
  AskKey,
  BudgetRange,
  CheckinStatus,
  CityRef,
  DateOption,
  Invite,
  LastCall,
  Message,
  PastTrip,
  PaymentMethod,
  PlaceOption,
  QuickStartAnswers,
  QuickStartState,
  RouteMode,
  Settlement,
  SlotId,
  Stay,
  StayBookingState,
  Transaction,
  TravelSelection,
  Trip,
  TripId,
  TripType,
  User,
  UserId,
  VendorId,
  VisaFieldKey,
  VisaUploadKey,
} from "@/data/types";

// Serializable store data (PLAN §9.4). Actions live in ./slices; transient fields are listed in ./persist.ts.

// ---------------------------------------------------------------------------
// session
// ---------------------------------------------------------------------------

export interface SessionData {
  signedIn: boolean;
  userId: UserId;
  notifications: boolean;
}

// ---------------------------------------------------------------------------
// trips
// ---------------------------------------------------------------------------

export type JoinRun = "idle" | "running" | "done";

export interface TripsData {
  trips: Partial<Record<TripId, Trip>>; // absent until created (A4 has none)
  members: Record<UserId, User>; // static seed
  invites: Record<string, Invite>; // both codes always readable (B-crew.md §1.3); static seed
  inbox: string[]; // invite codes listed on App home until accepted (A6: ['bali-x9m'])
  pastTrips: PastTrip[];
  bookings: Partial<Record<TripId, string[]>>; // booking ids from seed/bookings.ts, in creation order
  joinRun: JoinRun; // simulateJoins run status; transient
}

// ---------------------------------------------------------------------------
// chat (per trip)
// ---------------------------------------------------------------------------

export interface RouteState {
  trip: TripType;
  mode: RouteMode;
  filt: string;
  pick: string | null;
  on: SlotId[];
  ret: SlotId[];
  draft: { on: SlotId[]; ret: SlotId[] } | null; // TimeSheet open when non-null; transient
  booked?: TravelSelection;
}

export interface VisaState {
  uploads: Record<VisaUploadKey, boolean>;
  fields: Record<VisaFieldKey, string>; // transient: never written to localStorage
  sent: boolean;
}

export interface ChatTripData {
  stageIndex: number;
  quickStart: QuickStartState;
  quickStartAnswers: QuickStartAnswers;
  fromCity: CityRef | null;
  sent: Message[]; // user sends + Go acks, each tagged with the stage it was sent in
  seq: number; // id counter for `sent`
  reactions: Record<string, string>; // msgId → emoji (your reaction)
  placeVote: PlaceOption["id"] | null;
  dateVote: DateOption["id"] | null;
  flexible: boolean;
  budget: BudgetRange;
  stayVote: Stay["id"] | null;
  stayBooking: StayBookingState;
  route: RouteState;
  cab: { booked?: TravelSelection };
  privateViewed: boolean;
  visa: VisaState;
}

// ---------------------------------------------------------------------------
// home (per trip; J-triphome-calls.md §1.3, K-checkin.md §1.5)
// ---------------------------------------------------------------------------

export type OpenRow = "stay" | "fly" | null;
export type RecordingRate = 1 | 1.5 | 2;

export interface CheckinState {
  status: CheckinStatus;
  digiYatra: boolean;
  declaration: boolean;
  seat: string;
}

export interface HomeTripData {
  calls: ActiveCall[];
  lastCall: LastCall | null;
  resolved: VendorId[];
  openRow: OpenRow; // transient
  askForm: { open: boolean; chips: Record<AskKey, string | null>; drafts: Record<AskKey, string> }; // transient
  listen: { muted: boolean; takenOver: boolean; detailsOpen: boolean }; // transient
  recording: { playing: boolean; rate: RecordingRate }; // transient
  checkin: CheckinState;
  daysToGo: string;
}

// ---------------------------------------------------------------------------
// money (goa; M-bookings-money.md §1.6–1.7)
// ---------------------------------------------------------------------------

export interface RecordedPayment {
  amount: number;
  via: PaymentMethod;
  note: string;
}

export interface MoneyData {
  transactions: Transaction[]; // newest first; recorded paybacks on top, then seed rows in seed order
  settlements: Settlement[];
  recorded: RecordedPayment[];
}

// ---------------------------------------------------------------------------
// whole store data
// ---------------------------------------------------------------------------

export interface GoData {
  session: SessionData;
  trips: TripsData;
  chat: Record<TripId, ChatTripData>;
  home: Record<TripId, HomeTripData>;
  money: MoneyData;
}

// Literal hero countdown once web check-in opens (PLAN §12.1 #4; K-checkin.md §1.5). Same literal as presets.ts K_OPEN.
export const DAYS_TO_GO_CHECKIN = "in 2 days";

const clone = <T>(value: T): T => structuredClone(value);

export function initialChat(): ChatTripData {
  return {
    stageIndex: 0,
    quickStart: "pending",
    quickStartAnswers: { vibe: "beach", spend: null }, // C1 first open (C-chat-kickoff.md §1.4)
    fromCity: null,
    sent: [],
    seq: 0,
    reactions: {},
    placeVote: null,
    dateVote: null,
    flexible: false,
    budget: { lo: BUDGET_RANGE.lo, hi: BUDGET_RANGE.hi, saved: false },
    stayVote: null,
    stayBooking: { status: "open", paid: false, done: false },
    route: { trip: "round", mode: "flight", filt: "all", pick: null, on: [], ret: [], draft: null },
    cab: {},
    privateViewed: false,
    visa: {
      uploads: { passport: false, photo: false },
      fields: { name: "", passport: "", dob: "", expiry: "" },
      sent: false,
    },
  };
}

export function initialHome(tripId: TripId): HomeTripData {
  return {
    calls: [],
    lastCall: null,
    resolved: [],
    openRow: null,
    askForm: {
      open: false,
      chips: { main: null, stay: null, fly: null },
      drafts: { main: "", stay: "", fly: "" },
    },
    listen: { muted: false, takenOver: false, detailsOpen: false },
    recording: { playing: false, rate: 1 },
    checkin: { ...CHECKIN_DEFAULTS },
    daysToGo: TRIPS[tripId].dates?.countdown ?? "",
  };
}

const perTrip = <T>(make: (tripId: TripId) => T): Record<TripId, T> =>
  Object.fromEntries(TRIP_IDS.map((id) => [id, make(id)])) as Record<TripId, T>;

// Fresh demo: signed out, no trips (A1 → A4 after sign-in; PLAN §12.1 #3).
export function createInitialData(): GoData {
  return {
    session: { signedIn: false, userId: SESSION_USER_ID, notifications: true },
    trips: {
      trips: {},
      members: clone(USERS),
      invites: clone(INVITES),
      inbox: [],
      pastTrips: [],
      bookings: {},
      joinRun: "idle",
    },
    chat: perTrip(() => initialChat()),
    home: perTrip((id) => initialHome(id)),
    money: { transactions: [], settlements: [], recorded: [] },
  };
}
