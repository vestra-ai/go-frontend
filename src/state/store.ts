import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Booking,
  CardInRoom,
  CatchUp,
  CheckinState,
  Config,
  Day,
  Home,
  Id,
  Idea,
  Me,
  Message,
  MoneyView,
  MyVote,
  NeedsYouItem,
  PersonPage,
  Transaction,
  TransactionFilter,
  TripView,
  TypingWho,
} from "@/api/contract";

// What the app holds of the Server's data (CONTRACT-APP). Nothing here is the source of truth: every field is a copy
// of an answer, replaced whenever the Server says it moved (a live frame, a resume, a write's own answer). Reads and
// writes live in ./actions.ts; live frames in ./sync.ts; what the screens draw is derived in ./view.ts.

export type SessionStatus = "loading" | "signedOut" | "signedIn";
export type Load = "idle" | "loading" | "ready" | "error";

/** A file picked in the composer, on its way up (§4.5). The bytes stay outside the store (./uploads.ts). */
export interface OutgoingAttachment {
  kind: "photo" | "file" | "audio";
  name: string;
  mime: string;
  sizeBytes: number;
  /** Object URL for the "sending" bubble. */
  previewUrl: string;
  width?: number;
  height?: number;
  durationS?: number;
}

/** My message shown at once as "sending", by its `client_message_id` (§3.2). */
export interface OutgoingMessage {
  clientId: string;
  text?: string;
  attachment?: OutgoingAttachment;
  replyTo?: Id;
  aboutMessageId?: Id;
  mentionsGo?: boolean;
  status: "sending" | "failed";
  error?: string;
  createdAt: number;
  /** The stored message this became, once a live frame showed it before the POST answered: hides the duplicate. */
  echoedBy?: Id;
}

export interface TypingEntry {
  who: TypingWho;
  /** Epoch ms after which the line hides on its own. */
  until: number;
}

export interface TransactionsList {
  items: Transaction[];
  totalCount: number;
  nextCursor: string | null;
  loading: boolean;
}

export interface TripData {
  view: TripView | null;
  viewLoad: Load;
  /** 403: not in this trip, or no such trip (§1.2 gives one answer for both). */
  forbidden: boolean;
  /** The highest change number seen: a message's `updated_seq` or a `trip_changed` `seq` (§3.2). */
  seq: number;
  /**
   * The change number up to which the room is known to be complete: set by a page read, and carried forward by live
   * frames only while they arrive without a gap. Changes mode (`after_seq`) and a re-subscribe start from here, so a
   * missed stretch is always asked for again.
   */
  syncedSeq: number;

  messages: Record<Id, Message>;
  /** Message ids by `seq`, oldest first. */
  order: Id[];
  room: Load;
  hasMoreHistory: boolean;
  loadingHistory: boolean;
  outbox: OutgoingMessage[];
  /** The `client_message_id` a stored message of mine was sent as: the thread keeps that row's key, so the swap from "sending" to stored is not a new row. */
  sentAs: Record<Id, string>;
  typing: TypingEntry[];
  catchUp: CatchUp | null;

  /** My vote per decision, from the single-vote routes (the only place an anonymous vote shows mine). */
  myVotes: Record<Id, MyVote>;
  needsYou: NeedsYouItem[] | null;
  money: MoneyView | null;
  transactions: Partial<Record<TransactionFilter, TransactionsList>>;
  bookings: Booking[] | null;
  itinerary: { everyone: Day[] | null; me: Day[] | null };
  /** Latest version of each `call` card in the room, newest first (§4.11). */
  calls: CardInRoom[] | null;
  checkin: Record<Id, CheckinState>;
}

export interface GoState {
  session: SessionStatus;
  config: Config | null;
  me: Me | null;
  home: Home | null;
  homeLoad: Load;
  ideas: { items: Idea[]; fromCity: string | null } | null;
  goPage: PersonPage | null;
  trips: Record<Id, TripData>;
}

export function emptyTrip(): TripData {
  return {
    view: null,
    viewLoad: "idle",
    forbidden: false,
    seq: 0,
    syncedSeq: 0,
    messages: {},
    order: [],
    room: "idle",
    hasMoreHistory: false,
    loadingHistory: false,
    outbox: [],
    sentAs: {},
    typing: [],
    catchUp: null,
    myVotes: {},
    needsYou: null,
    money: null,
    transactions: {},
    bookings: null,
    itinerary: { everyone: null, me: null },
    calls: null,
    checkin: {},
  };
}

const initial = (): GoState => ({
  session: "loading",
  config: null,
  me: null,
  home: null,
  homeLoad: "idle",
  ideas: null,
  goPage: null,
  trips: {},
});

export const useGo = create<GoState>()(immer(() => initial()));

/** Sign-out: drop everything that belonged to the person. The public config stays. */
export function resetState(session: SessionStatus) {
  const { config } = useGo.getState();
  useGo.setState({ ...initial(), config, session }, true);
}

/** The trip's slot, created on first touch. Call inside `useGo.setState`. */
export function tripDraft(s: GoState, tripId: Id): TripData {
  return (s.trips[tripId] ??= emptyTrip());
}

/** Upsert by `message_id`, place by `seq` (§4.6), and move the trip's change number forward. */
export function upsertMessage(t: TripData, message: Message) {
  const known = t.messages[message.message_id];
  // A page read before a newer live frame must not put an older version back.
  if (known && known.updated_seq > message.updated_seq) return;
  t.messages[message.message_id] = message;
  if (!known) {
    let at = t.order.length;
    while (at > 0 && t.messages[t.order[at - 1]].seq > message.seq) at -= 1;
    t.order.splice(at, 0, message.message_id);
  }
  if (message.updated_seq > t.seq) t.seq = message.updated_seq;
}

/**
 * A change that arrived on its own (a live frame, the answer to my own write) rather than in a page: it moves the
 * trip's change number, and keeps the room "complete up to here" only when it is the very next change.
 */
export function advanceSeq(t: TripData, seq: number, heldBefore: number) {
  if (seq <= heldBefore + 1 && t.syncedSeq === heldBefore) t.syncedSeq = Math.max(t.syncedSeq, seq);
  if (seq > t.seq) t.seq = seq;
}

/** A page of messages was read: the room is complete up to the change number the page matches. */
export function markSynced(t: TripData, pageSeq: number) {
  if (pageSeq > t.syncedSeq) t.syncedSeq = pageSeq;
  if (pageSeq > t.seq) t.seq = pageSeq;
}
