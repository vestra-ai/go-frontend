import type {
  AddBooking,
  Booking,
  CardActionBody,
  CardActionResult,
  CardInRoom,
  CatchUp,
  CheckinState,
  City,
  Config,
  CreateTripBody,
  Day,
  Decision,
  Expense,
  ForgetResult,
  Home,
  Id,
  Idea,
  InviteAccepted,
  InvitePreview,
  JoinAnswers,
  LiveTicket,
  Mandate,
  Me,
  Message,
  MessagesPage,
  MoneyView,
  MyTripAnswers,
  NeedsYouItem,
  OptionDetailsFull,
  PatchCheckinBody,
  PatchTripBody,
  Person,
  PersonPage,
  PostMessageBody,
  RecordLine,
  Settlement,
  SettlementMethod,
  TransactionFilter,
  TransactionsPage,
  Transfer,
  TripInclude,
  TripInvite,
  TripView,
  UploadRequest,
  UploadTicket,
  VaultLink,
} from "@/api/contract";
import { http, requestBlob, type RequestOptions } from "@/api/http";

// Every route of CONTRACT-APP Appendix C (71), one function each, in the document's order. Paths are under /app/v1.
// Bodies carry exactly the fields the route names: the Server refuses unknown ones with 422 (§1.3).

const seg = encodeURIComponent;
const trip = (tripId: Id) => `/trips/${seg(tripId)}`;

/** Options a caller may pass through: a key to reuse for a retried press, a signal to cancel. */
type CallOpts = Pick<RequestOptions, "idempotencyKey" | "signal">;

export const api = {
  // -- §3 the live connection ------------------------------------------------
  liveTicket: (deviceId?: string) => http.post<LiveTicket>("/live/ticket", { body: deviceId ? { device_id: deviceId } : {} }),

  // -- §4.1 Me ---------------------------------------------------------------
  me: (o?: CallOpts) => http.get<Me>("/me", o),
  /** At least one field. `photo_url: null` / `from_city: null` clear; never `photo_url` together with `photo_upload_id`. */
  patchMe: (body: { name?: string; photo_upload_id?: Id; photo_url?: string | null; from_city?: string | null }) =>
    http.patch<Me>("/me", { body }),
  putUpi: (upiId: string) => http.put<Me>("/me/upi", { body: { upi_id: upiId } }),
  deleteUpi: () => http.delete<Me>("/me/upi"),
  /**
   * Open the answer's `url` at once (never ahead of time): links expire after 5 minutes. `display: "embedded"` is for
   * `start: "home"` only (422 otherwise) and gives a page to frame inside the app; every other start opens in the browser.
   */
  vaultLink: (body: {
    start?: "home" | "add_card" | "add_login" | "add_documents";
    display?: "embedded";
    context?: { trip_id: Id; purpose: "visa" };
  } = {}) => http.post<VaultLink>("/me/vault-link", { body }),
  deleteMe: () => http.delete<void>("/me", { body: { confirm: true } }),

  // -- §4.2 Home -------------------------------------------------------------
  home: (o?: CallOpts) => http.get<Home>("/home", o),
  ideas: (q: { from_city?: string; limit?: number } = {}, o?: CallOpts) =>
    http.get<{ items: Idea[]; from_city: string | null }>("/discover/ideas", { ...o, query: q }),

  // -- §4.3 Invites ----------------------------------------------------------
  /** Public; a valid token, when there is one, personalises `state`. Read-only. */
  invite: (code: string, o?: CallOpts) => http.get<InvitePreview>(`/invites/${seg(code)}`, { ...o, auth: "optional" }),
  acceptInvite: (code: string, joinAnswers?: JoinAnswers, o?: CallOpts) =>
    http.post<InviteAccepted>(`/invites/${seg(code)}/accept`, { ...o, body: joinAnswers ? { join_answers: joinAnswers } : {} }),

  // -- §4.4 Trips ------------------------------------------------------------
  createTrip: (body: CreateTripBody = {}, o?: CallOpts) => http.post<TripView>("/trips", { ...o, body }),
  trip: (tripId: Id, include?: TripInclude[], o?: CallOpts) =>
    http.get<TripView>(trip(tripId), { ...o, query: { include: include?.join(",") } }),
  /** At least one field. Answers `{ seq: null }` when nothing differed. */
  patchTrip: (tripId: Id, body: PatchTripBody) => http.patch<{ seq: number | null }>(trip(tripId), { body }),
  tripInvite: (tripId: Id, o?: CallOpts) => http.get<TripInvite>(`${trip(tripId)}/invite`, o),
  rotateInvite: (tripId: Id) => http.post<TripInvite>(`${trip(tripId)}/invite/rotate`),
  myAnswers: (tripId: Id, o?: CallOpts) => http.get<MyTripAnswers>(`${trip(tripId)}/me`, o),
  /** At least one field. Answers my own `Person` plus `seq` (null when nothing changed). */
  putJoinAnswers: (tripId: Id, body: JoinAnswers) =>
    http.put<Person & { seq: number | null }>(`${trip(tripId)}/me/join-answers`, { body }),
  pauseGo: (tripId: Id, paused: boolean) =>
    http.patch<Person & { seq: number | null }>(`${trip(tripId)}/me`, { body: { go_paused: paused } }),
  leaveTrip: (tripId: Id) => http.post<void>(`${trip(tripId)}/leave`),
  /** Marks the room read up to a change number (never moves back). An empty body only notes the visit. */
  markRead: (tripId: Id, body: { up_to_seq?: number; message_id?: Id } = {}) =>
    http.post<void>(`${trip(tripId)}/read`, { body }),

  // -- §4.5 Uploads ----------------------------------------------------------
  createUpload: (body: UploadRequest) => http.post<UploadTicket>("/uploads", { body }),

  // -- §4.6 The room ---------------------------------------------------------
  /** History mode: the newest page, or the page before `before_seq`. Sorted by `seq` ascending. */
  messagesHistory: (tripId: Id, q: { before_seq?: number; limit?: number } = {}, o?: CallOpts) =>
    http.get<MessagesPage>(`${trip(tripId)}/messages`, { ...o, query: q }),
  /** Changes mode: posted or changed after `after_seq`. Sorted by `updated_seq` ascending. */
  messagesChanges: (tripId: Id, afterSeq: number, limit?: number, o?: CallOpts) =>
    http.get<MessagesPage>(`${trip(tripId)}/messages`, { ...o, query: { after_seq: afterSeq, limit } }),
  /** `client_message_id` makes a repeat return the same stored message, so it doubles as the retry key. */
  postMessage: (tripId: Id, body: PostMessageBody) =>
    http.post<Message>(`${trip(tripId)}/messages`, { body, idempotencyKey: body.client_message_id }),
  editMessage: (tripId: Id, messageId: Id, text: string) =>
    http.patch<Message>(`${trip(tripId)}/messages/${seg(messageId)}`, { body: { text } }),
  deleteMessage: (tripId: Id, messageId: Id) => http.delete<Message>(`${trip(tripId)}/messages/${seg(messageId)}`),
  /** One reaction per person per message: a new emoji replaces the old one, `null` takes it back. */
  react: (tripId: Id, messageId: Id, emoji: string | null) =>
    http.put<Message>(`${trip(tripId)}/messages/${seg(messageId)}/reaction`, { body: { emoji } }),
  /** `undefined` (204) when not away long enough, when Go has nothing to say, or when Go did not answer in time. */
  catchUp: (tripId: Id, o?: CallOpts) => http.get<CatchUp | undefined>(`${trip(tripId)}/catch-up`, o),

  // -- §4.7 Go's cards -------------------------------------------------------
  /** Go's answer is passed through; a timeout is `{ result: "refused" }`, never an HTTP error. Do not retry on your own. */
  cardAction: (tripId: Id, cardId: Id, body: CardActionBody) =>
    http.post<CardActionResult>(`${trip(tripId)}/cards/${seg(cardId)}/actions`, { body, idempotencyKey: body.press_id }),
  /**
   * What a person sees on opening an option's Details. 404 when the card or option is not mine to see; 429 above 10
   * lookups a minute per person per trip.
   */
  optionDetails: (tripId: Id, cardId: Id, optionId: Id, o?: CallOpts) =>
    http.get<OptionDetailsFull>(`${trip(tripId)}/cards/${seg(cardId)}/options/${seg(optionId)}/details`, o),

  // -- §4.8 Votes, mandate, record --------------------------------------------
  decision: (tripId: Id, decisionId: Id, o?: CallOpts) =>
    http.get<Decision>(`${trip(tripId)}/decisions/${seg(decisionId)}`, o),
  openDecision: (
    tripId: Id,
    body: {
      client_id: string;
      question: string;
      kind: "choice" | "yesno";
      anonymous: boolean;
      options: Array<{ label: string; image_url?: string; price_minor?: number; note?: string }>;
      closes_at?: string;
    },
  ) => http.post<{ decision: Decision; message: Message }>(`${trip(tripId)}/decisions`, { body, idempotencyKey: body.client_id }),
  vote: (tripId: Id, decisionId: Id, body: { option_index: number } | { flexible: true }) =>
    http.put<Decision>(`${trip(tripId)}/decisions/${seg(decisionId)}/vote`, { body }),
  /** Needs `features.vote_retract` (409 otherwise). */
  retractVote: (tripId: Id, decisionId: Id) => http.delete<Decision>(`${trip(tripId)}/decisions/${seg(decisionId)}/vote`),
  closeDecision: (tripId: Id, decisionId: Id) => http.post<Decision>(`${trip(tripId)}/decisions/${seg(decisionId)}/close`),
  cancelDecision: (tripId: Id, decisionId: Id) => http.post<Decision>(`${trip(tripId)}/decisions/${seg(decisionId)}/cancel`),
  /** "Yes, book it": the payer only. The payment itself happens on Go's vault page, never in the app. */
  confirmMandate: (tripId: Id, decisionId: Id) =>
    http.post<Mandate>(`${trip(tripId)}/decisions/${seg(decisionId)}/mandate/confirm`),
  declineMandate: (tripId: Id, decisionId: Id) =>
    http.post<Mandate>(`${trip(tripId)}/decisions/${seg(decisionId)}/mandate/decline`),
  record: (tripId: Id, includeUndone = false, o?: CallOpts) =>
    http.get<{ lines: RecordLine[]; seq: number }>(`${trip(tripId)}/record`, {
      ...o,
      query: { include_undone: includeUndone ? true : undefined },
    }),
  undoLine: (tripId: Id, lineId: Id) => http.post<RecordLine>(`${trip(tripId)}/record/${seg(lineId)}/undo`),
  redoLine: (tripId: Id, lineId: Id) => http.post<RecordLine>(`${trip(tripId)}/record/${seg(lineId)}/redo`),

  // -- §4.9 Money ------------------------------------------------------------
  money: (tripId: Id, o?: CallOpts) => http.get<MoneyView>(`${trip(tripId)}/money`, o),
  transactions: (tripId: Id, q: { filter?: TransactionFilter; limit?: number; before?: string } = {}, o?: CallOpts) =>
    http.get<TransactionsPage>(`${trip(tripId)}/transactions`, { ...o, query: q }),
  expenses: (tripId: Id, o?: CallOpts) => http.get<{ items: Expense[]; seq: number }>(`${trip(tripId)}/expenses`, o),
  addExpense: (
    tripId: Id,
    body: {
      amount_minor: number;
      note: string;
      category: Expense["category"];
      split_person_ids: Id[];
      booking_id?: Id;
      paid_by_person_id?: Id;
    },
    o?: CallOpts,
  ) => http.post<Expense & { seq: number }>(`${trip(tripId)}/expenses`, { ...o, body }),
  /** "Fix split": the person responsible only (§4.9). */
  fixSplit: (tripId: Id, expenseId: Id, body: { split_person_ids: Id[]; note?: string }) =>
    http.patch<Expense & { seq: number }>(`${trip(tripId)}/expenses/${seg(expenseId)}`, { body }),
  removeExpense: (tripId: Id, expenseId: Id) => http.delete<{ seq: number }>(`${trip(tripId)}/expenses/${seg(expenseId)}`),
  /** "Record a payment": counts at once and for good. */
  recordSettlement: (
    tripId: Id,
    body: { to_person_id: Id; amount_minor: number; currency: string; method: SettlementMethod; note?: string },
    o?: CallOpts,
  ) =>
    http.post<{ settlement: Settlement; transfers: Transfer[]; seq: number }>(`${trip(tripId)}/settlements`, { ...o, body }),
  /** 409 when the payee has no UPI id: offer Record a payment instead. */
  payLink: (tripId: Id, body: { to_person_id: Id; amount_minor: number }) =>
    http.post<{ upi_uri: string; expires_at: string }>(`${trip(tripId)}/transfers/pay-link`, { body }),

  // -- §4.10 Bookings, documents, itinerary -----------------------------------
  bookings: (tripId: Id, o?: CallOpts) => http.get<{ items: Booking[]; seq: number }>(`${trip(tripId)}/bookings`, o),
  booking: (tripId: Id, bookingId: Id, o?: CallOpts) => http.get<Booking>(`${trip(tripId)}/bookings/${seg(bookingId)}`, o),
  /** The file's bytes, through the Server's redirect to a signed link (valid 10 minutes). Covered people only. */
  bookingDocument: (tripId: Id, bookingId: Id, documentId: Id, signal?: AbortSignal) =>
    requestBlob(`${trip(tripId)}/bookings/${seg(bookingId)}/documents/${seg(documentId)}`, signal),
  /** No body key at all: pass `idempotencyKey` per press, or a retry adds a second booking (§1.4). */
  addBooking: (tripId: Id, body: AddBooking, o: CallOpts & { idempotencyKey: string }) =>
    http.post<Booking & { seq: number }>(`${trip(tripId)}/bookings`, { ...o, body }),
  /** At least one field; `null` clears a time. */
  patchBooking: (
    tripId: Id,
    bookingId: Id,
    body: { ref?: string; refundable_until?: string | null; starts_at?: string | null; ends_at?: string | null },
  ) => http.patch<{ seq: number | null }>(`${trip(tripId)}/bookings/${seg(bookingId)}`, { body }),
  cancelVote: (tripId: Id, bookingId: Id, o: CallOpts & { idempotencyKey: string }) =>
    http.post<{ decision_id: Id; seq: number }>(`${trip(tripId)}/bookings/${seg(bookingId)}/cancel-vote`, { ...o, body: {} }),
  itinerary: (tripId: Id, scope: "everyone" | "me" = "everyone", o?: CallOpts) =>
    http.get<{ days: Day[]; seq: number }>(`${trip(tripId)}/itinerary`, { ...o, query: { scope } }),

  // -- §4.11 Trip home -------------------------------------------------------
  /** The latest version of each card in the room, newest first, at most 100. `kind` and `state` are comma lists. */
  cards: (tripId: Id, q: { kind: string; state?: string }, o?: CallOpts) =>
    http.get<{ items: CardInRoom[] }>(`${trip(tripId)}/cards`, { ...o, query: q }),
  /** Shares an ended call's recording in the room. Needs `features.calls` (409 otherwise). */
  shareCard: (tripId: Id, cardId: Id) => http.post<Message>(`${trip(tripId)}/cards/${seg(cardId)}/share`),
  needsYou: (tripId: Id, o?: CallOpts) =>
    http.get<{ items: NeedsYouItem[]; seq: number }>(`${trip(tripId)}/needs-you`, o),

  // -- §4.12 Web check-in (features.checkin; 404 with the flag off) -----------
  checkin: (tripId: Id, bookingId: Id, o?: CallOpts) =>
    http.get<CheckinState>(`${trip(tripId)}/bookings/${seg(bookingId)}/checkin`, o),
  /** At least one field. A paid seat answers `payment_required: true` and is not set. */
  patchCheckin: (tripId: Id, bookingId: Id, body: PatchCheckinBody) =>
    http.patch<CheckinState>(`${trip(tripId)}/bookings/${seg(bookingId)}/checkin`, { body }),
  /** `done` with the boarding pass, or `working` (read the check-in again for the pass). */
  completeCheckin: (tripId: Id, bookingId: Id, o: CallOpts & { idempotencyKey: string }) =>
    http.post<CheckinState>(`${trip(tripId)}/bookings/${seg(bookingId)}/checkin/complete`, { ...o, body: {} }),

  // -- §4.13 The You screen ----------------------------------------------------
  whatGoKnows: (o?: CallOpts) => http.get<PersonPage>("/me/go", o),
  setCarryOver: (carryOver: boolean) => http.patch<{ ok: true }>("/me/go", { body: { carry_over: carryOver } }),
  deleteFact: (factId: Id) => http.delete<{ ok: true }>(`/me/go/facts/${seg(factId)}`),
  /** With `tripId`: that trip; without: everywhere. Never reports success when Go failed. */
  forgetMe: (tripId?: Id) => http.delete<ForgetResult>("/me/go", { query: { trip_id: tripId } }),

  // -- §4.14 Places, config, health --------------------------------------------
  /** `q` under two characters returns the top list. 5 requests a second per person. */
  cities: (q: string, o?: CallOpts) => http.get<{ items: City[] }>("/places/cities", { ...o, query: { q, country: "IN" } }),
  topCities: (o?: CallOpts) => http.get<{ items: City[] }>("/places/cities/top", { ...o, query: { country: "IN" } }),
  config: (o?: CallOpts) => http.get<Config>("/config", { ...o, auth: "none" }),
  health: (o?: CallOpts) => http.get<{ ok: boolean; go: boolean | null }>("/health", { ...o, auth: "none" }),
};

/** Step 1 of §4.5: PUT the bytes to the signed URL with exactly the returned headers. No Authorization: it is Supabase Storage. */
export async function putUpload(ticket: UploadTicket, bytes: Blob, signal?: AbortSignal): Promise<void> {
  const res = await fetch(ticket.upload_url, { method: "PUT", headers: ticket.headers, body: bytes, signal, credentials: "omit" });
  if (!res.ok) throw new Error(`upload failed (${res.status})`);
}
