// Wire shapes of the App ↔ Server contract, rev 4 (docs/CONTRACT-APP.md) plus the changes of 11 Oct 2026
// (docs/changes_app.md), on top of the Server ↔ Go objects (llms-full.txt 1.0.0 plus the 1.1 additions). Field names
// are snake_case exactly as sent. In answers null and missing mean the same thing (§1.3), so optional fields are typed
// `?` and read with `??`. Unknown fields, frame types and card kinds are ignored (§1.1).

export type Id = string;
/** ISO 8601 with an offset. */
export type Iso = string;
/** `YYYY-MM-DD`. */
export type DateOnly = string;
export type Currency = string;

export type Category = "stay" | "food" | "getting_around" | "activities" | "other";

// ---------------------------------------------------------------------------
// People, places, journeys
// ---------------------------------------------------------------------------

/** `former`: the person left the trip or deleted their account, and is no longer in `TripView.people` (§4.6). */
export type Actor = { kind: "person"; person_id: Id; former?: boolean | null } | { kind: "go" } | { kind: "system" };

export interface Person {
  person_id: Id;
  name: string;
  photo_url?: string | null;
  role: "organizer" | "member";
  joined_at: Iso;
  from_city?: string | null;
  earliest_leave?: string | null;
  know: string[];
  has_upi: boolean;
  go_paused: boolean;
}

export interface PersonLite {
  person_id: Id;
  name: string;
  photo_url?: string | null;
}

export interface Photo {
  url: string;
  label?: string | null;
}

export interface Place {
  name: string;
  place_id?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  photo_url?: string | null;
  photos?: Photo[] | null;
  timezone?: string | null;
}

export interface JourneyStop {
  name: string;
  code?: string | null;
}

export interface Journey {
  mode: "flight" | "train" | "bus" | "cab";
  origin: JourneyStop;
  destination: JourneyStop;
  depart_at: Iso;
  arrive_at: Iso;
  carrier_name?: string | null;
  carrier_code?: string | null;
  number?: string | null;
  logo_url?: string | null;
  stops?: number | null;
}

// ---------------------------------------------------------------------------
// Who I am (§4.1)
// ---------------------------------------------------------------------------

/** `photo_url`, `from_city` and `upi_id_masked` are always sent: a string, or `null` for "not set" (§2). */
export interface Me {
  person_id: Id;
  name: string;
  email: string | null;
  photo_url?: string | null;
  auth_provider: string | null;
  from_city?: string | null;
  has_upi: boolean;
  upi_id_masked?: string | null;
  counts: { active_trips: number; past_trips: number };
  created_at: Iso;
  /** On PATCH /me and PUT/DELETE /me/upi only. */
  seq?: number | null;
}

export interface VaultLink {
  url: string;
  expires_at: Iso;
}

// ---------------------------------------------------------------------------
// Home (§4.2)
// ---------------------------------------------------------------------------

export type TripStatus = "planning" | "booked" | "on_trip" | "over";
export type TripStage = "new" | "deciding" | "planned";
export interface DateRange {
  start: DateOnly;
  end: DateOnly;
}

export type Attention =
  | { kind: "needs_you"; count: number }
  | { kind: "all_set" }
  | { kind: "collecting" }
  | { kind: "task"; label: string };

export interface TripSummary {
  trip_id: Id;
  title: string;
  status: TripStatus;
  stage: TripStage;
  destination?: Place | null;
  dates?: DateRange | null;
  photo_url?: string | null;
  budget_per_person_minor?: number | null;
  people_preview: PersonLite[];
  people_count: number;
  attention: Attention;
  last_activity_at: Iso;
}

export interface Owed {
  trip_id: Id;
  trip_title: string;
  to: PersonLite;
  amount_minor: number;
  currency: Currency;
}

export interface PastTripSummary {
  trip_id: Id;
  title: string;
  photo_url?: string | null;
  dates?: DateRange | null;
  people_count: number;
  all_settled: boolean;
}

export interface Idea {
  idea_id: string;
  name: string;
  tag: string;
  travel: { mode: "flight" | "car" | "train" | "bus"; duration_minutes: number };
  /** The first of `photos` when there are any. */
  image_url?: string | null;
  /** Up to 12; Go fills them in over time, so an idea may have none. */
  photos?: Photo[] | null;
  /** Months 1–12. */
  best_months?: number[] | null;
  destination_hint: string;
}

export interface Home {
  me: PersonLite;
  trips: TripSummary[];
  past_trips: PastTripSummary[];
  owes: Owed[];
  /** Every open item of mine across my active trips: at most 50 listed, `total` is the real count. */
  needs_you?: { items: HomeNeedsYouItem[]; total: number } | null;
  seq_hint: number;
}

// ---------------------------------------------------------------------------
// Invites (§4.3)
// ---------------------------------------------------------------------------

export interface InvitePreview {
  code: string;
  state: "pending" | "already_member" | "expired" | "revoked";
  trip: { trip_id: Id; title: string; destination?: Place | null; dates?: DateRange | null; photo_url?: string | null };
  inviter: PersonLite;
  people_preview: PersonLite[];
  joined_count: number;
}

export interface JoinAnswers {
  from_city?: string | null;
  earliest_leave?: string | null;
  know?: string[];
  vibe?: "beach" | "hills" | "city" | "any";
}

export interface InviteAccepted {
  trip_id: Id;
  seq: number;
  landing: "chat" | "trip_home";
}

// ---------------------------------------------------------------------------
// Votes, mandate, record (§4.8)
// ---------------------------------------------------------------------------

/** What an option shows when opened (1.1 A1). Every field is optional: show what is there. */
export interface OptionDetails {
  gallery_urls?: string[] | null;
  caption?: string | null;
  why?: string[] | null;
  costs?: Array<{ label: string; emoji?: string | null; amount_minor: number; currency?: Currency | null }> | null;
  total_minor?: number | null;
  amenities?: string[] | null;
  activities?: string[] | null;
  facts?: Array<{ label: string; value: string }> | null;
  cancellation?: string | null;
  rating?: number | null;
  review_count?: number | null;
  go_note?: string | null;
}

/**
 * `GET …/cards/:card_id/options/:option_id/details` (§4.7): everything the card's `details` has, plus what Go collected
 * about the place. Every field is optional. `rooms`, `policies`, `reviews` and `nearby` are also sent; this build does
 * not read them.
 */
export interface OptionDetailsFull extends OptionDetails {
  address?: string | null;
  map?: { lat: number; lng: number } | null;
  check_in?: string | null;
  check_out?: string | null;
  property_type?: string | null;
  stars?: number | null;
  url?: string | null;
  /** `false`: Go is still collecting. Show it, and ask again the next time Details opens. */
  complete?: boolean | null;
}

export interface RoomType {
  room_type_id: Id;
  label: string;
  sleeps: number;
  /** Per room for the whole stay. */
  price_minor: number;
  photos?: Photo[] | null;
}

export interface DecisionOption {
  label: string;
  image_url?: string | null;
  price_minor?: number | null;
  currency?: Currency | null;
  option_ref?: string | null;
  note?: string | null;
  details?: OptionDetails | null;
  photos?: Photo[] | null;
  /** Per person for the whole stay (rev 4). */
  price_min_minor?: number | null;
  price_max_minor?: number | null;
  room_types?: RoomType[] | null;
}

export interface Mandate {
  choice_index: number;
  cap_minor: number;
  currency: Currency;
  refundable_only: boolean;
  payer_person_id: Id;
  set_at: Iso;
  confirmed_at?: Iso | null;
  declined_at?: Iso | null;
}

export type MyVote = { option_index: number } | { flexible: true } | null;

export interface Decision {
  decision_id: Id;
  question: string;
  kind: "choice" | "yesno";
  anonymous: boolean;
  status: "open" | "closed" | "cancelled";
  opened_by_person_id?: Id | null;
  options: DecisionOption[];
  closes_at?: Iso | null;
  voted: number;
  of: number;
  tally: number[];
  /** Left out when the vote is anonymous. */
  votes?: Array<{ person_id: Id; option_index: number }> | null;
  result_index?: number | null;
  mandate?: Mandate | null;
  opened_at: Iso;
  closed_at?: Iso | null;
  /** App reads only: a vote about cancelling a booking. */
  cancels_booking_id?: Id | null;
  flexible_count?: number | null;
  /** On the single-vote routes. */
  my_vote?: MyVote;
}

export interface Proof {
  message_id: Id;
  person_id?: Id | null;
}

export interface RecordLine {
  line_id: Id;
  kind: "decided" | "agreed" | "open" | "doing" | "booked";
  text: string;
  status: "active" | "done" | "undone";
  proof: Proof[];
  person_ids: Id[];
  due_at?: Iso | null;
  decision_id?: Id | null;
  booking_id?: Id | null;
  source: "go" | "person" | "vote" | "booking";
  created_at: Iso;
  updated_at: Iso;
}

// ---------------------------------------------------------------------------
// Bookings, itinerary (§4.10)
// ---------------------------------------------------------------------------

export type BookingKind = "stay" | "flight" | "train" | "bus" | "cab" | "table" | "activity" | "other";

export interface BookingDocument {
  document_id: Id;
  name: string;
  mime: string;
  size_bytes: number;
  pages?: number | null;
  visibility: "covered" | "group";
  /**
   * A signed link to the file, valid 1 hour and minted on each read: open, download or share it directly, never store
   * it. When it is absent or has run out, `GET …/documents/:document_id` answers a fresh one.
   */
  url?: string | null;
}

export interface Booking {
  booking_id: Id;
  kind: BookingKind;
  status: "confirmed" | "cancelled";
  title: string;
  vendor: string;
  ref: string;
  amount_minor: number;
  currency: Currency;
  payer_person_id: Id;
  for_person_ids: Id[];
  refundable_until?: Iso | null;
  starts_at?: Iso | null;
  ends_at?: Iso | null;
  journey?: Journey | null;
  return_journey?: Journey | null;
  place?: Place | null;
  image_url?: string | null;
  decision_id?: Id | null;
  approval_id?: Id | null;
  added_by_person_id?: Id | null;
  created_at: Iso;
  details?: Array<{ label: string; value: string }> | null;
  /** Covered people only (§1.7). */
  passengers?: Array<{ person_id: Id; seat?: string | null; pnr?: string | null }> | null;
  /** Covered people only. Empty right after Go books: the file lands a moment later, with `trip_changed kinds:["booking"]`. */
  documents?: BookingDocument[] | null;
}

export interface AddBooking {
  kind: BookingKind;
  title: string;
  vendor: string;
  ref: string;
  amount_minor: number;
  payer_person_id: Id;
  for_person_ids: Id[];
  refundable_until?: Iso;
  starts_at?: Iso;
  ends_at?: Iso;
  journey?: Journey;
  return_journey?: Journey;
  details?: Array<{ label: string; value: string }>;
  passengers?: Array<{ person_id: Id; seat?: string; pnr?: string }>;
  place?: Place;
  image_url?: string;
  decision_id?: Id;
}

export interface ItineraryItem {
  item_id?: Id | null;
  /** Local time at the destination, `HH:MM`. */
  time?: string | null;
  title: string;
  category: Category;
  place?: Place | null;
  booking_id?: Id | null;
  status: "booked" | "planned" | "idea";
  note?: string | null;
  person_ids?: Id[] | null;
  audience?: "group" | "shared" | "private" | null;
}

export interface Day {
  date: DateOnly;
  title?: string | null;
  items: ItineraryItem[];
  image_url?: string | null;
}

// ---------------------------------------------------------------------------
// Money (§4.9)
// ---------------------------------------------------------------------------

export interface Expense {
  expense_id: Id;
  paid_by_person_id: Id;
  amount_minor: number;
  currency: Currency;
  note: string;
  category: Category;
  split_person_ids: Id[];
  booking_id?: Id | null;
  added_by_person_id?: Id | null;
  created_at: Iso;
}

export interface Transfer {
  from_person_id: Id;
  to_person_id: Id;
  amount_minor: number;
  currency: Currency;
}

export interface CategoryAmount {
  category: Category;
  amount_minor: number;
}

export interface Money {
  currency: Currency;
  plan_minor?: number | null;
  spent_minor: number;
  by_category: CategoryAmount[];
  transfers: Transfer[];
}

export interface MoneyView extends Money {
  me: { spent_minor: number; by_category: CategoryAmount[]; owed_to_me: Transfer[]; i_owe: Transfer[] };
  seq: number;
}

export type SettlementMethod = "upi" | "cash" | "bank_transfer" | "other";

export interface Settlement {
  settlement_id: Id;
  from_person_id: Id;
  to_person_id: Id;
  amount_minor: number;
  currency: Currency;
  method: SettlementMethod;
  note?: string | null;
  created_at: Iso;
}

export type TransactionFilter = "all" | "booking" | "payback" | "mine";

export interface Transaction {
  transaction_id: Id;
  kind: "booking" | "payback";
  occurred_at: Iso;
  payer_person_id: Id;
  verb: "paid" | "booked_with";
  to: { kind: "person"; person_id: Id } | { kind: "merchant"; name: string };
  amount_minor: number;
  currency: Currency;
  method?: SettlementMethod | "card" | null;
  note?: string | null;
  mine: boolean;
  expense_id?: Id | null;
  booking_id?: Id | null;
  settlement_id?: Id | null;
}

export interface TransactionsPage {
  items: Transaction[];
  total_count: number;
  next_cursor: string | null;
}

// ---------------------------------------------------------------------------
// Messages and cards (§4.6, §4.7, §5)
// ---------------------------------------------------------------------------

export type Attachment =
  | { kind: "photo"; url: string; width?: number | null; height?: number | null; caption?: string | null; upload_id?: Id | null }
  | {
      kind: "file";
      url: string;
      name: string;
      mime: string;
      size_bytes: number;
      duration_s?: number | null;
      caption?: string | null;
      upload_id?: Id | null;
    }
  | { kind: "location"; lat: number; lng: number; name?: string | null; address?: string | null };

export interface Reaction {
  emoji: string;
  /** Absent = Go's reaction. */
  person_id?: Id | null;
  /** By someone who has left the trip. */
  former?: boolean | null;
}

export interface CardAction {
  action_id: string;
  label: string;
  style: "primary" | "secondary";
  only_for_person_ids?: Id[] | null;
  per_option?: boolean | null;
}

interface CardBase {
  card_id: Id;
  fallback_text: string;
  for_person_ids?: Id[] | null;
}

export interface Option {
  option_id: Id;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  price_minor?: number | null;
  currency?: Currency | null;
  price_note?: string | null;
  highlights: string[];
  journey?: Journey | null;
  return_journey?: Journey | null;
  price_oneway_minor?: number | null;
  price_round_minor?: number | null;
  place?: Place | null;
  rating?: number | null;
  refundable_until?: Iso | null;
  details?: OptionDetails | null;
  photos?: Photo[] | null;
  price_min_minor?: number | null;
  price_max_minor?: number | null;
  room_types?: RoomType[] | null;
  /** The option's own page: a small link inside its details, not a button. */
  url?: string | null;
}

// Record cards: an id; drawn from the Server's own rows.
export interface VoteCard extends CardBase {
  kind: "vote";
  decision_id: Id;
}
export interface MandateCard extends CardBase {
  kind: "mandate";
  decision_id: Id;
}
export interface TicketCard extends CardBase {
  kind: "ticket";
  booking_id: Id;
}
export interface ExpenseCard extends CardBase {
  kind: "expense";
  expense_id: Id;
}
export interface SettleUpCard extends CardBase {
  kind: "settle_up";
}
export interface DayCard extends CardBase {
  kind: "day";
  date: DateOnly;
}
export interface PlanCard extends CardBase {
  kind: "plan";
}
export interface BudgetCard extends CardBase {
  kind: "budget";
}

// Go cards: everything to show, plus `actions`.
export type OptionKind = "stay" | "flight" | "train" | "bus" | "cab" | "place" | "food" | "activity";
export interface OptionsCard extends CardBase {
  kind: "options";
  title: string;
  option_kind: OptionKind | (string & {});
  checked_at: Iso;
  options: Option[];
  /**
   * The vote these options are in: each option is the decision option whose `option_ref` is its `option_id`, and that
   * one's place in `Decision.options` is the `option_index` to vote with (§4.7).
   */
  decision_id?: Id | null;
  actions?: CardAction[] | null;
}
export interface WorkingCard extends CardBase {
  kind: "working";
  task_id: Id;
  title: string;
  state: "running" | "needs_you" | "done" | "failed";
  steps: Array<{ text: string; state: "todo" | "doing" | "done" | "failed" }>;
  /** The latest picture of the page Go is on; at `done` the final one. */
  screenshot_url?: string | null;
  /** 1.3: the address of that page. */
  page_url?: string | null;
  /**
   * 1.3: a live, view-only stream of Go's screen, to frame while the card is `running` or `needs_you`. Its access token
   * is in the `#fragment`: pass the link on exactly as it came. Go puts a fresh one on the card before the old one runs
   * out (15 minutes at most) and sends `null` once the task is `done` or `failed`.
   */
  live_url?: string | null;
  updated_at: Iso;
  actions?: CardAction[] | null;
}
export interface CallLine {
  who: "go" | "them";
  text: string;
}
export interface CallCard extends CardBase {
  kind: "call";
  call_id: Id;
  business: string;
  goal: string;
  state: "dialing" | "talking" | "ended" | "failed";
  started_at?: Iso | null;
  ended_at?: Iso | null;
  last_line?: CallLine | null;
  outcome?: string | null;
  transcript?: CallLine[] | null;
  recording_url?: string | null;
  duration_s?: number | null;
  actions?: CardAction[] | null;
}
export interface PayCard extends CardBase {
  kind: "pay";
  approval_id: Id;
  payer_person_id: Id;
  amount_minor: number;
  currency: Currency;
  merchant: string;
  purpose: string;
  refundable_until?: Iso | null;
  expires_at: Iso;
  state: "waiting" | "paid" | "declined" | "expired" | "failed";
  actions?: CardAction[] | null;
}
export interface NoticeCard extends CardBase {
  kind: "notice";
  tone: "info" | "heads_up";
  title: string;
  body: string;
  image_url?: string | null;
  source?: { name: string; url?: string | null } | null;
  checked_at?: Iso | null;
  deadline_at?: Iso | null;
  actions?: CardAction[] | null;
}
export interface ChecklistRow {
  person_id: Id;
  status: "todo" | "started" | "done" | "info";
  label?: string | null;
  sub?: string | null;
}
export interface ChecklistCard extends CardBase {
  kind: "checklist";
  title: string;
  subtitle?: string | null;
  due_at?: DateOnly | null;
  rows: ChecklistRow[];
  suggestion?: { text: string; cta?: { action_id: string; label: string } | null } | null;
  actions?: CardAction[] | null;
}
export interface RoomsCard extends CardBase {
  kind: "rooms";
  title: string;
  option_id?: Id | null;
  arrangements: Array<{
    arrangement_id: Id;
    label?: string | null;
    rooms: Array<{ room_type_id: Id; label: string; person_ids: Id[]; price_minor: number }>;
    total_minor: number;
    per_person: Array<{ person_id: Id; amount_minor: number }>;
  }>;
  actions?: CardAction[] | null;
}

export type KnownCard =
  | VoteCard
  | MandateCard
  | TicketCard
  | ExpenseCard
  | SettleUpCard
  | DayCard
  | PlanCard
  | BudgetCard
  | OptionsCard
  | WorkingCard
  | CallCard
  | PayCard
  | NoticeCard
  | ChecklistCard
  | RoomsCard;

/** A kind this build does not know: draw `fallback_text` (§5). */
export interface UnknownCard extends CardBase {
  kind: string;
}

export type Card = KnownCard | UnknownCard;
export type GoCard = OptionsCard | WorkingCard | CallCard | PayCard | NoticeCard | ChecklistCard | RoomsCard;

const KNOWN_CARD_KINDS = new Set<string>([
  "vote",
  "mandate",
  "ticket",
  "expense",
  "settle_up",
  "day",
  "plan",
  "budget",
  "options",
  "working",
  "call",
  "pay",
  "notice",
  "checklist",
  "rooms",
]);

export function isKnownCard(card: Card): card is KnownCard {
  return KNOWN_CARD_KINDS.has(card.kind);
}

export interface QuickReply {
  label: string;
  text?: string | null;
}

export interface Ledger {
  kind: "expense_added" | "expense_changed" | "expense_removed" | "payback";
  expense_id?: Id | null;
  settlement_id?: Id | null;
}

export interface Message {
  message_id: Id;
  seq: number;
  updated_seq: number;
  author: Actor;
  text?: string | null;
  attachments: Attachment[];
  reply_to?: Id | null;
  about_message_id?: Id | null;
  mentions_go: boolean;
  mentions: Id[];
  reactions: Reaction[];
  card?: Card | null;
  withheld: boolean;
  deleted: boolean;
  edited_at?: Iso | null;
  sent_at: Iso;
  quick_replies?: QuickReply[] | null;
  /** On a money line (a system message), app reads only. */
  ledger?: Ledger | null;
  /** One of Go's messages that only these people receive (§1.7): I am always in the list when I hold the message. */
  visible_to_person_ids?: Id[] | null;
}

export interface MessagesPage {
  messages: Message[];
  has_more: boolean;
  seq: number;
}

export interface PostMessageBody {
  client_message_id: string;
  text?: string;
  attachments?: Array<{ upload_id: Id; caption?: string } | Extract<Attachment, { kind: "location" }>>;
  reply_to?: Id;
  about_message_id?: Id;
  mentions?: Id[];
}

export interface CatchUp {
  summary?: string | null;
  items: Array<{
    kind: "decided" | "booked" | "needs_you" | "open" | "news";
    text: string;
    image_url?: string | null;
    message_id?: Id | null;
  }>;
}

export interface CardActionBody {
  action_id: string;
  option_id?: Id;
  press_id: string;
  payload?: { trip: "oneway" | "round" };
}

export type CardActionResult =
  | { result: "done"; toast?: string | null }
  | { result: "open"; url: string; expires_at?: Iso | null }
  | { result: "refused"; toast?: string | null };

export interface CardInRoom {
  message_id: Id;
  card: Card;
  posted_at: Iso;
}

// ---------------------------------------------------------------------------
// One trip (§4.4)
// ---------------------------------------------------------------------------

export interface BudgetSummary {
  lowest?: { min_minor: number; max_minor?: number | null; currency: Currency } | null;
  answered: number;
  of: number;
  /** The group's one budget per person; absent when none is set. The only member the app reads. */
  per_person_minor?: number | null;
}

export interface TripSnapshot {
  trip_id: Id;
  seq: number;
  title: string;
  status: TripStatus;
  created_at: Iso;
  organizer_person_id: Id;
  invite_url: string;
  destination?: Place | null;
  dates?: DateRange | null;
  vibe: string[];
  stay?: string | null;
  budget: BudgetSummary;
  people: Person[];
  decisions: Decision[];
  bookings: Booking[];
  expenses: Expense[];
  money: Money;
  itinerary: Day[];
  record: RecordLine[];
}

export type ChatParticipant = { kind: "go" } | { kind: "person"; person_id: Id };

export interface TripView extends TripSnapshot {
  stage: TripStage;
  me: { person: Person; last_read_seq: number; unread_count: number };
  chat: {
    unread_count: number;
    last_message?: { message_id: Id; author: Actor; text_preview: string; sent_at: Iso } | null;
    participants_preview: ChatParticipant[];
  };
  needs_you_count: number;
  can: { invite: boolean; manage_trip: boolean };
}

export type TripInclude = "people" | "decisions" | "bookings" | "expenses" | "money" | "itinerary" | "record";

export interface CreateTripBody {
  title?: string;
  destination_hint?: string;
  dates?: DateRange;
  from_city?: string;
  destination?: Place;
  vibe?: string[];
  stay?: string;
  plan_minor?: number;
  currency?: Currency;
}

export interface PatchTripBody {
  title?: string;
  dates?: DateRange;
  status?: TripStatus;
  itinerary?: Day[];
  /** `null` clears the group's budget. */
  budget_per_person_minor?: number | null;
}

export interface TripInvite {
  invite_url: string;
  code: string;
}

export interface MyTripAnswers {
  from_city?: string | null;
  earliest_leave?: string | null;
  know: string[];
  role: "organizer" | "member";
  go_paused: boolean;
}

// ---------------------------------------------------------------------------
// Needs you (§4.11)
// ---------------------------------------------------------------------------

export interface NeedsYouItem {
  item_id: string;
  kind: "vote" | "mandate" | "card" | "record_line" | "settle_up" | "checkin";
  title: string;
  subtitle?: string | null;
  cta_label?: string | null;
  since: Iso;
  target: {
    message_id?: Id | null;
    card_id?: string | null;
    decision_id?: Id | null;
    line_id?: Id | null;
    booking_id?: Id | null;
    transfer?: { to_person_id: Id; amount_minor: number; currency: Currency } | null;
    cancels_booking_id?: Id | null;
  };
}

/** An item of `Home.needs_you`: the same item, with the trip it belongs to. */
export interface HomeNeedsYouItem extends NeedsYouItem {
  trip_id: Id;
  trip_title: string;
}

// ---------------------------------------------------------------------------
// Uploads (§4.5)
// ---------------------------------------------------------------------------

export interface UploadRequest {
  purpose: "chat_attachment" | "profile_photo";
  kind: "photo" | "file" | "audio";
  mime: string;
  name: string;
  size_bytes: number;
  width?: number | null;
  height?: number | null;
  duration_s?: number | null;
}

export interface UploadTicket {
  upload_id: Id;
  upload_url: string;
  headers: Record<string, string>;
  expires_at: Iso;
  max_size_bytes: number;
}

// ---------------------------------------------------------------------------
// Web check-in (§4.12)
// ---------------------------------------------------------------------------

export interface CheckinSeat {
  id: string;
  row?: number | null;
  col?: string | null;
  state: "free" | "paid" | "taken" | "companion";
  price_minor?: number | null;
  currency?: Currency | null;
}

export interface CheckinStop {
  name: string;
  code: string;
  time: string;
}

export interface CheckinState {
  status: "not_open" | "open" | "working" | "done" | "failed" | "closed";
  opens_at?: Iso | null;
  closes_at?: Iso | null;
  flight?: {
    number?: string | null;
    carrier_name?: string | null;
    logo_url?: string | null;
    date?: string | null;
    origin?: CheckinStop | null;
    destination?: CheckinStop | null;
  } | null;
  passenger?: { name?: string | null; mobile_masked?: string | null; bags?: string | null } | null;
  digi_yatra?: boolean | null;
  declaration?: boolean | null;
  seat?: string | null;
  companion?: { person_id: Id; seat?: string | null; next_to_seats?: string[] | null } | null;
  seat_map?: {
    front_label?: string | null;
    columns?: string[] | null;
    aisle_after?: string | null;
    rows?: number[] | null;
    seats?: CheckinSeat[] | null;
  } | null;
  boarding_pass: Record<string, unknown> | null;
  /** On PATCH only, for a paid seat. */
  payment_required?: true;
  seat_price?: { amount_minor: number; currency: Currency } | null;
}

export interface PatchCheckinBody {
  digi_yatra?: boolean;
  declaration?: boolean;
  seat?: string;
  mobile?: string;
}

// ---------------------------------------------------------------------------
// The You screen (§4.13)
// ---------------------------------------------------------------------------

export interface Fact {
  fact_id: Id;
  topic: string;
  text: string;
  trip_id: Id;
  message_id?: Id | null;
  said_at: Iso;
}

export interface PersonPage {
  person_id: Id;
  carry_over: boolean;
  facts: Fact[];
}

export interface ForgetResult {
  deleted_facts: number;
  remaining_facts: number;
}

// ---------------------------------------------------------------------------
// Places, config, health (§4.14)
// ---------------------------------------------------------------------------

export interface City {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  population: number;
}

export interface Features {
  checkin: boolean;
  visa: boolean;
  calls: boolean;
  vote_retract: boolean;
  vote_flexible: boolean;
  claim: boolean;
}

export interface Config {
  contract: string;
  min_client_version: string;
  currency_default: Currency;
  features: Features;
}

// ---------------------------------------------------------------------------
// The live connection (§3)
// ---------------------------------------------------------------------------

export type TripChangeKind =
  | "trip"
  | "people"
  | "decision"
  | "mandate"
  | "record"
  | "booking"
  | "expense"
  | "settlement"
  | "itinerary"
  | "budget";

export type TypingWho = { kind: "go" } | { kind: "person"; person_id: Id };

export type ServerFrame =
  | { type: "hello"; person_id: Id; server_time: Iso; heartbeat_seconds: number }
  | { type: "message"; trip_id: Id; message: Message }
  | { type: "card"; trip_id: Id; message_id: Id; card: Card }
  | { type: "typing"; trip_id: Id; who: TypingWho; on: boolean; until?: Iso | null }
  | { type: "trip_changed"; trip_id: Id; seq: number; kinds?: TripChangeKind[] | null }
  | { type: "home_changed" }
  | { type: "resync"; trip_id: Id }
  | { type: "error"; trip_id: Id; code: "forbidden" | "too_many_trips" | (string & {}) }
  | { type: "ping" };

export type ClientFrame =
  | { type: "subscribe"; trips: Array<{ trip_id: Id; since_seq: number }> }
  | { type: "unsubscribe"; trip_ids: Id[] }
  | { type: "typing"; trip_id: Id; on: boolean }
  | { type: "pong" };

export interface LiveTicket {
  ticket: string;
  expires_at: Iso;
}

// ---------------------------------------------------------------------------
// Errors (§1.5)
// ---------------------------------------------------------------------------

export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "invalid"
  | "upgrade_required"
  | "rate_limited"
  | "internal"
  | "go_unavailable"
  | "unavailable";

export interface ErrorBody {
  error: {
    code: ErrorCode | (string & {});
    message: string;
    field?: string | null;
    retry_after_seconds?: number | null;
    request_id?: string | null;
  };
}
