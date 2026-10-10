// Domain model for the Go prototype (plans/PLAN.md §9.1, refined by the "Data bindings" of plans/screens/*.md).
// Pure types only: no React, no store. Class-name fields hold full Tailwind literals so the source scan finds them.

export type Id = string;

// ---------------------------------------------------------------------------
// People, trips, invites
// ---------------------------------------------------------------------------

export type UserId = "aarav" | "rahul" | "priya" | "arjun" | "kabir";
export type UserTone = "amber" | "info" | "success" | "go" | "peach";

export interface User {
  id: UserId;
  name: string;
  firstName: string;
  initials: string;
  tone: UserTone;
  city: string;
  cityCode: string;
  email?: string;
  avatar?: string;
}

export type TripId = "goa" | "college" | "bali";
export type TripStage = "new" | "deciding" | "planned";

export interface TripDates {
  label: string; // long form, invite card: "Diwali · Fri 6 – Mon 9 Nov"
  short: string; // hero meta / chat subtitle: "Diwali · 6–9 Nov"
  chip: string; // fact chip: "Nov 6–9"
  range: string; // trip home hero / collapsed header: "Fri 6 – Mon 9 Nov"
  countdown: string; // literal "in 34 days" (PLAN §12.1 #4)
}

// A-onboarding.md §1.8: one label set per trip, used for every stage. The status line is live (selectTripCardStatus).
export interface TripHomeCard {
  coverTitle: string;
  coverSub: string;
}

export interface Trip {
  id: TripId;
  name: string;
  destination?: string;
  emoji: string; // share-sheet recent-row avatar
  dates?: TripDates;
  cover?: { src: string; alt: string }; // App-home TripCard / invite card photo; absent → gradient / illustration
  hero?: { src: string; alt: string }; // trip home + invite skeleton hero photo; absent → bg-sunset fallback
  illustration?: string; // trip avatar (chat header, share link card)
  tint: "amber" | "info";
  tintClass: string; // e.g. "bg-amber-soft"
  memberIds: UserId[];
  organizerId: UserId;
  inviteCode: string;
  inviteUrl: string; // without scheme: "go.vestra.ai/t/goa-k7q"
  whatsappGroup: string;
  stage: TripStage;
  budgetLabel?: string; // "₹21.8k" | "₹55k"
  fromCity?: string;
  homeCard: TripHomeCard;
}

export interface Idea {
  id: string;
  name: string;
  tag: string;
  travelEmoji: string;
  travel: string;
  tintClass: string;
  img: string;
}

export interface PastTrip {
  id: string;
  title: string;
  sub: string;
  tintClass: string;
  img: string;
}

export interface Invite {
  code: string;
  tripId: TripId;
  inviterId: UserId;
  joinedCount: number;
  memberIds: UserId[]; // invite-card stack order
  whenYouJoin: string[]; // "<emoji> <text>", split at the first space
  cardSub: string; // App-home invite card sub line
  membersLine: string; // App-home invite card member line
}

// ---------------------------------------------------------------------------
// Chat shell (C-chat-kickoff.md §1.2, §1.4, §1.6)
// ---------------------------------------------------------------------------

export type AvatarSpec = { kind: "go" } | { kind: "user"; src?: string; initials: string; tone: User["tone"] };
export type FrameRect = { top: number; left: number; width: number; height: number }; // px, relative to #app-frame (page coordinates)
export type AttachItem = "photo" | "pdf";
export type ComposerMode = null | "longpress" | "reply" | "askGo";
export type BubbleMaxWidth = 64 | 70 | 72 | 76 | 78 | 80;

export interface CityRef {
  id: string; // CIT ids (blr…); searched cities: lower-cased name (+ "|state" from the live search)
  name: string;
  region?: string;
}
export type Vibe = "beach" | "hills" | "city" | "any";
export type Spend = "lt15" | "15to25" | "gt25";
export interface QuickStartAnswers {
  vibe: Vibe | null;
  spend: Spend | null;
}
export type QuickStartState = "pending" | "done" | "dismissed";

// ---------------------------------------------------------------------------
// Scenario (PLAN §9.3)
// ---------------------------------------------------------------------------

export type StageId =
  | "kickoff"
  | "places"
  | "dates-talk"
  | "dates-poll"
  | "budget"
  | "stays"
  | "pay"
  | "book"
  | "travel"
  | "route-confirm"
  | "private"
  | "plan"
  | "visa";

export type Author = UserId | "go" | "system";

export type TriggerId =
  | "place-asked"
  | "place-voted"
  | "dates-asked"
  | "dates-answered"
  | "budget-saved"
  | "stay-voted"
  | "stay-claimed"
  | "stay-paid"
  | "booking-done"
  | "route-booked"
  | "cab-booked"
  | "lands-asked"
  | "private-viewed"
  | "plan-asked"
  | "visa-sent";

export type ChipKey = "where" | "when" | "stay" | "budget" | "from";

export interface ChipState {
  label: string; // the ✓ is the chip's CheckBadge, never part of the label
  state: "unset" | "set";
  active?: boolean; // budget chip through the whole `budget` stage until saved
}

export type CardKind =
  | "quick-replies"
  | "go-nudge"
  | "place-poll"
  | "dates-poll"
  | "budget-ask"
  | "stay-poll"
  | "pay-ask"
  | "booking-progress"
  | "travel-ask"
  | "progress-pill"
  | "who-lands"
  | "private-teaser"
  | "plan"
  | "visa-ask"
  | "visa-status";

export interface GoAskPayload {
  text: string; // "\n" = line break
  cta: string;
  caption: string;
}

export interface WhoLandsRow {
  userId: UserId;
  name: string;
  mode: string;
  lands: string;
  booked: boolean;
}

export interface PlanDay {
  n: number;
  weekday: string;
  caption: string;
  img: string;
}

export interface Reaction {
  emoji: string;
  count: number;
}

export interface CardPayloads {
  "quick-replies": { eyebrow: string; chips: string[] };
  "go-nudge": { label: string };
  "place-poll": { placeIds: PlaceOption["id"][]; countdown: string; more: { title: string; sub: string } };
  "dates-poll": {
    title: string;
    countdown: string;
    dateIds: DateOption["id"][];
    flexible: { off: string; on: string };
    of: number;
  };
  "budget-ask": GoAskPayload;
  "stay-poll": { stayIds: Stay["id"][]; more: { title: string; sub: string } };
  "pay-ask": {
    stayId: Stay["id"];
    badge: string;
    total: string;
    sub: string;
    assurance: { title: string; sub: string };
    cta: string;
    helper: string;
    booker: { title: string; sub: string };
  };
  "booking-progress": {
    stayId: Stay["id"];
    title: string;
    watch: string;
    url: string;
    line: string;
    lineSub: string;
    cardLabel: string;
    amount: string;
    paying: string;
    paid: string;
    ticket: { eyebrow: string; title: string; dates: string; stub: string; reaction: Reaction };
    late: { text: string; maxWidth: 64 };
    receipt: { label: string; title: string; payer: UserId; amount: string; split: string; cta: string; href: string };
  };
  "travel-ask": GoAskPayload;
  "progress-pill": { text: string };
  "who-lands": {
    title: string;
    status: string;
    rows: WhoLandsRow[];
    suggestion: { emoji: string; text: string; cta: string };
  };
  "private-teaser": { label: string; lines: string[]; cta: string };
  plan: {
    eyebrow: string;
    place: { emoji: string; label: string };
    dates: { emoji: string; label: string };
    countdown: { emoji: string; label: string };
    hero: { src: string; alt: string };
    seal: { ring: string; month: string; days: string };
    memberIds: UserId[];
    days: PlanDay[];
    footer: { label: string; cta: string; href: string };
    reaction?: Reaction; // floating chip under the card
  };
  "visa-ask": GoAskPayload;
  "visa-status": { tripId: TripId }; // rows come from seed/visa.ts + store
}

export type MessageCard = { [K in CardKind]: { kind: K; payload: CardPayloads[K] } }[CardKind];

// Serializable visibility rules (replace PLAN §9.1's `visibleWhen` function).
export type MessageCondition = "qs-done" | "qs-dismissed" | "booking-claimed-by-rahul";

/**
 * What a sent message carries besides text. Photos keep a small downscaled data URL (they survive a reload); PDFs and
 * voice notes keep an object URL that only lives for this session (`persist.ts` drops it).
 */
export type Attachment =
  | { kind: "image"; src: string; width: number; height: number }
  | { kind: "file"; name: string; size: number; src?: string }
  | { kind: "voice"; seconds: number; src?: string };

export interface Message {
  id: Id;
  stage: StageId;
  author: Author;
  kind: "text" | "system" | "card";
  text?: string; // "\n" = line break, "**x**" = bold
  attachment?: Attachment; // my photo / PDF / voice note
  card?: MessageCard;
  mention?: boolean; // me only → MentionChip "Go" before the text
  quote?: { author: string; text: string };
  reaction?: Reaction;
  maxWidth?: BubbleMaxWidth;
  showIf?: MessageCondition;
  live?: true; // renders only while its stage is the current stage
  replyDraft?: string;
  askGoSuggestions?: string[];
}

// When a stage's NextStepPill becomes visible (E-deciding.md §1.6 selectNextPill).
export type PillReady =
  | "entry"
  | "place-vote"
  | "dates-nudge" // DATES_NUDGE_MS after the stage is current with no composer mode
  | "date-vote-or-flexible"
  | "budget-saved"
  | "stay-vote"
  | "claimed-by-rahul";

export interface StageNext {
  to: StageId;
  trigger: TriggerId; // advance(trigger) moves stageIndex to `to`
  pill?: { label: string; ready: PillReady; inSheet?: "budget" }; // absent = direct transition (no pill)
}

export interface StageHeader {
  subtitle: string;
  memberIds: UserId[];
}

export interface ScenarioStage {
  id: StageId;
  subtitle: string;
  memberIds: UserId[];
  headerByQuickStart?: Record<QuickStartState, StageHeader>;
  chips: Record<ChipKey, ChipState>;
  messages: Message[];
  next: StageNext[];
  setsTripPlanned?: true; // entering this stage sets trip.stage = 'planned'
}

// ---------------------------------------------------------------------------
// Decisions & polls
// ---------------------------------------------------------------------------

export type PlaceDetails =
  | {
      layout: "rich";
      subtitle: string;
      hero: { src: string; alt: string };
      caption: string;
      price: string;
      whyRows: string[];
      cost: { label: string; emoji: string; value: string }[];
      total: string;
      activities: string[];
      votersLine: string;
    }
  | {
      layout: "light";
      subtitle: string;
      tint: string;
      img: string;
      facts: { label: string; value: string }[];
      goNote: string;
    };

export interface PlaceOption {
  id: "goa" | "gokarna" | "udaipur";
  name: string;
  meta: string;
  est: string;
  why: string;
  img: string;
  tint: string;
  voters: UserId[];
  details: PlaceDetails;
}

export interface DateOption {
  id: "diwali" | "xmas" | "rday";
  name: string;
  month: string;
  range: string;
  meta: string;
  fit: string;
  fitTone: "success" | "go" | "muted";
  voters: UserId[];
}

export interface Stay {
  id: "sol" | "azul" | "palms";
  name: string;
  area: string;
  areaLong: string;
  priceLabel: string;
  rating: string;
  reviews: string;
  tags: string;
  img: string;
  amenities: string[];
  dates: string;
  totalFor4: string;
  yourShare: string;
  cancellation: string;
  voters: UserId[];
}

export interface StayBookingState {
  status: "open" | "claimed";
  by?: UserId;
  paid: boolean;
  done: boolean;
}

export interface BudgetRange {
  lo: number;
  hi: number;
  saved: boolean;
}

// ---------------------------------------------------------------------------
// Travel (F-travel.md §1.3)
// ---------------------------------------------------------------------------

export type RouteMode = "flight" | "train" | "bus";
export type TripType = "oneway" | "round";
export type SlotId = "s0" | "s1" | "s2" | "s3";

export interface RouteLeg {
  code: string;
  day: string;
  time: string;
  meta: string;
  stop?: string;
  h: number; // departure hour used for slot filtering
  carrier?: "indigo" | "airindia";
}

export interface RouteOption {
  id: string;
  mode: RouteMode;
  kind: string; // flight: mix | nonstop | stop · train: 3A | 2A | SL · bus: sleeper | seater
  tag: string;
  one: number;
  round: number;
  roundOnly?: boolean;
  /** Flight whose tag adds nothing ("Same airline"): the row hides it. */
  quiet?: boolean;
  legs: [RouteLeg, RouteLeg];
}

export interface RouteFilter {
  id: string;
  label: string;
}

export interface TimeSlot {
  id: SlotId;
  emoji: string;
  name: string;
  range: string;
  from: number;
  to: number; // half-open [from, to)
}

export interface CabOption {
  id: string;
  kind: "sedan" | "suv";
  emoji: string;
  title: string;
  meta: string;
  one: number;
  round: number;
}

export interface TravelSelection {
  optionId: string;
  trip: TripType;
}

// ---------------------------------------------------------------------------
// Trip plan: bookings, itinerary, map
// ---------------------------------------------------------------------------

export interface TicketDoc {
  title: string; // "IndiGo e-ticket"
  fileName: string;
  pages: number;
  pnr: string;
  booked: string;
  passenger: string;
  seat: string;
  flight: string; // PDF centre label "6E 5313 · Economy"
  from: { code: string; place: string; time: string };
  to: { code: string; place: string; time: string };
}

export interface DetailRow {
  label: string;
  value: string;
}

export interface Booking {
  id: Id;
  type: "travel-out" | "stay" | "travel-back" | "flight";
  eyebrow: string;
  title: string;
  sub: string;
  memberIds: UserId[];
  media: { kind: "logo" | "photo" | "emoji"; src?: string; emoji?: string; bg: "indigo" | "stay-tint" | "none" };
  accent: "info" | "success";
  stub: { kind: "count"; n: number } | { kind: "booked" };
  href: string;
  details: DetailRow[];
  pnr?: string;
  ticket?: TicketDoc;
}

// F7 just-for-me sheet (F-travel.md §1.4).
export interface PrivateDetails {
  airline: { name: string; logo: string };
  flight: string;
  from: { code: string; time: string };
  to: { code: string; time: string };
  seat: string;
  boards: string;
  pnr: string;
  bookingId: string; // the travel-out booking (ticket viewer target)
  ret: { emoji: string; title: string; sub: string };
}

export type ItineraryDay = "fri" | "sat" | "sun" | "mon";

export interface ItineraryItem {
  id: Id;
  day: ItineraryDay;
  time: string;
  emoji: string;
  title: string;
  sub: string;
  memberIds: UserId[];
  scope: "mine" | "shared" | "group";
  mine?: { time?: string; emoji?: string; title: string; sub: string } | null; // omitted = same text; null = hidden in "Just me"
}

export type SpotKey = "blr" | "bom" | "pnq" | "goa";

export interface MapSpot {
  key: SpotKey;
  x: number;
  y: number;
  audience: "everyone" | "me" | "both";
  label: string;
  /** Avatar spots: id of the map-art photo this target sits on. Its selected ring is drawn in the art, in the photo's own layer. */
  photo?: string;
}

export type MapCardAction = { kind: "href"; href: string } | { kind: "toast"; text: string } | { kind: "back" };

export interface MapCard {
  icon: string;
  title: string;
  sub: string;
  line: string;
  button: string;
  action: MapCardAction;
  me?: Partial<Omit<MapCard, "me">>;
}

// ---------------------------------------------------------------------------
// Trip home calls (J-triphome-calls.md §1.3)
// ---------------------------------------------------------------------------

export type VendorId = "villa" | "indigo" | "cab";
export type AskKey = "main" | "stay" | "fly";

export interface TranscriptLine {
  speaker: "go" | "vendor";
  text: string;
}

export interface RecordingLine extends TranscriptLine {
  t: string;
  current?: boolean;
}

export interface CallRecording {
  title: string;
  meta: string;
  outcome: { headline: string; body: string };
  durationS: number;
  positionS: number;
  transcript: RecordingLine[];
}

export interface VendorCall {
  id: VendorId;
  who: string;
  phone: string;
  emoji: string;
  bg: string; // vendor tint class
  defaultAsk: string;
  line: string; // design quote, curly quotes included
  time: string; // seed elapsed "01:12"
  elapsedS: number; // same value in seconds (startedAt = now − elapsedS × 1000)
  transcriptLive: TranscriptLine[] | null; // null = template from asking/line (seed/calls.ts)
  recording: CallRecording | null; // null = template from asking/line (seed/calls.ts)
}

export interface ActiveCall {
  id: VendorId; // id === vendor (one live call per vendor)
  vendor: VendorId;
  asking: string;
  startedAt: number; // epoch ms
}

export interface LastCall {
  vendor: VendorId;
  asking: string;
  endedAt: number;
}

export interface ChipOption {
  emoji: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Money (M-bookings-money.md §1.7)
// ---------------------------------------------------------------------------

export type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank transfer" | "Other";

export interface Transaction {
  id: Id;
  date: string;
  dateLabel: string;
  payerId: UserId;
  verb: "paid" | "booked with";
  to: { kind: "user"; id: UserId } | { kind: "merchant"; name: string; emoji?: string; img?: string };
  amount: number;
  method: PaymentMethod;
  note: string;
  kind: "payback" | "booking";
  mine: boolean;
}

export interface Settlement {
  fromId: UserId;
  toId: UserId;
  amount: number;
  status: "open" | "settled";
}

export interface SpendTotals {
  crew: { stay: number; travel: number };
  me: { stay: number; travel: number };
  budget: number;
}

// ---------------------------------------------------------------------------
// Check-in (K-checkin.md §1.5)
// ---------------------------------------------------------------------------

export type SeatCol = "A" | "B" | "C" | "D" | "E" | "F";

export interface Seat {
  id: string;
  row: number;
  col: SeatCol;
  state: "free" | "paid" | "taken" | "friend";
}

export type CheckinStatus = "not-open" | "open" | "done";

export interface CheckIn {
  flight: string;
  date: string;
  logo: string;
  route: { from: string; fromTime: string; fromSub: string; to: string; toTime: string; toSub: string };
  passRoute: { fromSub: string; toSub: string };
  passenger: { name: string; sub: string; mobile: string; bags: string };
  digiYatra: boolean;
  declaration: boolean;
  seat: string;
  friendId: UserId;
  friendSeat: string;
  nextToFriend: string[];
  seatPrice: string;
  paidRows: number[];
  rows: number[];
  cols: SeatCol[];
  seats: Seat[];
  pass: { passenger: string; boarding: string; departs: string; gate: string; zone: string; seq: string; qr: string[] };
}

// ---------------------------------------------------------------------------
// Visa (G-bali.md §1.2)
// ---------------------------------------------------------------------------

export type VisaStatus = "not-yet" | "sent" | "started";
export type VisaUploadKey = "passport" | "photo";
export type VisaFieldKey = "name" | "passport" | "dob" | "expiry";

export interface VisaMember {
  userId: UserId;
  sub: string;
  status: VisaStatus;
}
