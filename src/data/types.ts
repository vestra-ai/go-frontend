// View models: the shapes the components draw. They are built from the Server's contract objects (src/api/contract.ts)
// by the adapters in src/state/*View.ts, so labels the design shows are computed there, never stored.
// Pure types only: no React, no store. Class-name fields hold full Tailwind literals so the source scan finds them.

export type Id = string;

// ---------------------------------------------------------------------------
// People, trips, invites
// ---------------------------------------------------------------------------

export type UserId = string; // a `person_id`: opaque, never parsed (CONTRACT-APP §1.3)
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

export type TripId = string; // a `trip_id`: opaque, never parsed
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
  inviteUrl: string; // without scheme, as the link field shows it: "go.example/invite/8fK2xQ"
  inviteHref?: string; // the Server's `invite_url`, exactly as sent (what is shared and copied)
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
  /** The illustration for this place, drawn small on the tint. */
  img: string;
  /** The destination's own photo (an http(s) link the Server sent): fills the card's top instead of `img`. */
  photo?: string;
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

// ---------------------------------------------------------------------------
// Chat rows and cards
// ---------------------------------------------------------------------------

export type ChipKey = "where" | "when" | "stay" | "budget" | "from";

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

/** What a message carries besides text, as the bubble draws it: a photo, a file, a voice note (state/roomView.ts). */
export type Attachment =
  | { kind: "image"; src: string; width: number; height: number }
  | { kind: "file"; name: string; size: number; src?: string; mime?: string }
  | { kind: "voice"; seconds: number; src?: string };

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

/** What Go collected about an option beyond its card (CONTRACT-APP §4.7): extra facts, where it is, its own page. */
export interface OptionExtras {
  facts: { label: string; value: string }[];
  /** Opens the place on a map. */
  mapHref?: string;
  /** The option's own page: "View on ixigo". */
  link?: { label: string; href: string };
}

export interface PlaceOption {
  id: string; // the option's index in its vote, or an options card's `option_id`
  /** `img` is a real photo (covers the tile) rather than a centred illustration. */
  photo?: boolean;
  name: string;
  meta: string;
  est: string;
  why: string;
  img: string;
  tint: string;
  voters: UserId[];
  /** The tally when the voters are not named (an anonymous vote). */
  votes?: number;
  details: PlaceDetails;
  extras?: OptionExtras;
}

export interface DateOption {
  id: string;
  name: string;
  /** Calendar tile ("NOV" / "6–9"): only when the option's label reads as dates. */
  month?: string;
  range?: string;
  meta: string;
  fit: string;
  fitTone: "success" | "go" | "muted";
  voters: UserId[];
}

/** One photo of a place's gallery. `label`: what it shows ("Deluxe room"), when Go said. */
export interface StayPhoto {
  src: string;
  label?: string;
}

export interface Stay {
  id: string;
  name: string;
  area: string;
  areaLong: string;
  priceLabel: string;
  rating: string;
  reviews: string;
  tags: string;
  img: string;
  /** The gallery, cover first. Empty when the place has no photo of its own (`img` is then an illustration). */
  photos: StayPhoto[];
  amenities: string[];
  dates: string;
  totalFor4: string;
  yourShare: string;
  cancellation: string;
  voters: UserId[];
  /** The tally when the voters are not named (an anonymous vote). */
  votes?: number;
  extras?: OptionExtras;
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
  /** The carrier's wordmark from the option, when Go sent one. */
  logoUrl?: string;
  carrierName?: string;
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
  /** Onward, then the return when the option has one. */
  legs: RouteLeg[];
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
  /**
   * The stored file behind it, for Download / Save / Share: fetched from `url` (the signed link the booking was last
   * read with, valid 1 hour), else through `GET …/bookings/:id/documents/:document_id`.
   */
  bookingId?: Id;
  documentId?: Id;
  url?: string;
  mime?: string;
  /** The carrier's wordmark, when the booking has one. */
  logoUrl?: string;
  carrier?: string;
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
  media: { kind: "logo" | "photo" | "emoji"; src?: string; alt?: string; emoji?: string; bg: "indigo" | "stay-tint" | "none" };
  accent: "info" | "success";
  stub: { kind: "count"; n: number } | { kind: "booked" };
  href: string;
  details: DetailRow[];
  pnr?: string;
  ticket?: TicketDoc;
}

// F7 just-for-me sheet (F-travel.md §1.4).
/** One file of a booking in its sheet: which document, and what its button says. */
export interface BookingFileRef {
  documentId: Id;
  label: string;
}

/** My own view of one booking: a journey's onward leg (with the way back under it), or a stay. */
export interface PrivateDetails {
  /** The carrier and its wordmark; for a stay, the hotel's name and no logo. */
  airline: { name: string; logo: string };
  /** "6E 5313"; for a stay, the booking reference. */
  flight: string;
  /** "BLR" / "Fri 8:40 pm"; for a stay, "1 Nov" / "Sun". */
  from: { code: string; time: string };
  to: { code: string; time: string };
  /** The three facts under the route: seat, departs and PNR for a journey; check-in, check-out and nights for a stay. */
  cells: { label: string; value: string }[];
  bookingId: string;
  /** This leg's own file (its e-ticket, the stay's voucher), when the booking carries one for me. */
  file?: BookingFileRef;
  /** The way back, when the booking has one, with its own e-ticket. */
  ret?: { emoji: string; title: string; sub: string; file?: BookingFileRef };
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

export type AskKey = "main" | "stay" | "fly";

export interface TranscriptLine {
  speaker: "go" | "vendor";
  text: string;
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
  method?: PaymentMethod; // absent when the Server knows none (an expense added by hand)
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

// ---------------------------------------------------------------------------
// Check-in (K-checkin.md §1.5)
// ---------------------------------------------------------------------------

export type SeatCol = string; // the airline's own column letters (`seat_map.columns`)

export interface Seat {
  id: string;
  row: number;
  col: SeatCol;
  state: "free" | "paid" | "taken" | "friend";
  /** Pre-formatted price of a paid seat: "₹450". */
  price?: string;
}

export type CheckinStatus = "not-open" | "open" | "working" | "done" | "failed" | "closed";

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
  status: CheckinStatus;
  /** The friend on the same booking, when there is one. */
  friendId: UserId | null;
  friendSeat: string;
  nextToFriend: string[];
  /** Columns left and right of the aisle, in the airline's order. */
  colsLeft: SeatCol[];
  colsRight: SeatCol[];
  rows: number[];
  frontLabel: string;
  seats: Seat[];
  /** Null until the check-in is done. `qr` is drawn only when the pass carries a bitmap. */
  pass: { passenger: string; boarding: string; departs: string; gate: string; zone: string; seq: string; qr: string[] | null } | null;
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
