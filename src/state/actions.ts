import type {
  AddBooking,
  Booking,
  CardActionResult,
  CheckinState,
  CreateTripBody,
  Decision,
  Expense,
  Id,
  InviteAccepted,
  JoinAnswers,
  Message,
  MyVote,
  PatchCheckinBody,
  PatchTripBody,
  PostMessageBody,
  SettlementMethod,
  TransactionFilter,
  TripChangeKind,
  TripView,
  UploadRequest,
} from "@/api/contract";
import { api, putUpload } from "@/api/endpoints";
import { errorMessage, isApiError, newKey } from "@/api/http";
import {
  advanceSeq,
  emptyTrip,
  markSynced,
  tripDraft,
  upsertMessage,
  useGo,
  type OutgoingAttachment,
  type OutgoingMessage,
  type TripData,
} from "@/state/store";

// Every read and write the screens make (CONTRACT-APP §4). A read copies the answer into the store; a write sends,
// then applies the Server's own answer (never a guess), and the live `trip_changed` frame re-reads the rest. Writes
// reject with `ApiError`: the caller shows `errorMessage(err)` and lets the person tap again.

const set = useGo.setState;
const get = useGo.getState;

/** One request per key at a time: a second caller gets the first one's promise. */
const inFlight = new Map<string, Promise<unknown>>();
function once<T>(key: string, run: () => Promise<T>): Promise<T> {
  const running = inFlight.get(key) as Promise<T> | undefined;
  if (running) return running;
  const started = run().finally(() => inFlight.delete(key));
  inFlight.set(key, started);
  return started;
}

/** Every trip read returns the `seq` it matches (§1.6): never let a slower, older answer replace a newer one. */
const resourceSeq = new Map<string, number>();
function isFresh(tripId: Id, resource: string, seq: number): boolean {
  const key = `${tripId}|${resource}`;
  if ((resourceSeq.get(key) ?? -1) > seq) return false;
  resourceSeq.set(key, seq);
  return true;
}

function bumpSeq(t: TripData, seq: number | null | undefined) {
  if (typeof seq === "number" && seq > t.seq) t.seq = seq;
}

export function forgetCaches() {
  inFlight.clear();
  resourceSeq.clear();
  blobs.clear();
  uploadIds.clear();
  voteLanes.clear();
}

// ---------------------------------------------------------------------------
// Boot, me, home
// ---------------------------------------------------------------------------

/** Public; read at boot. §7 says what each flag hides. */
export const loadConfig = () =>
  once("config", async () => {
    const config = await api.config();
    set({ config });
    return config;
  });

export const loadMe = () =>
  once("me", async () => {
    const me = await api.me();
    set({ me });
    return me;
  });

export const loadHome = () =>
  once("home", async () => {
    if (get().homeLoad === "idle") set({ homeLoad: "loading" });
    try {
      const home = await api.home();
      set({ home, homeLoad: "ready" });
      return home;
    } catch (err) {
      if (!get().home) set({ homeLoad: "error" });
      throw err;
    }
  });

export const loadIdeas = (fromCity?: string) =>
  once(`ideas|${fromCity ?? ""}`, async () => {
    const res = await api.ideas(fromCity ? { from_city: fromCity } : {});
    set({ ideas: { items: res.items, fromCity: res.from_city } });
    return res;
  });

export async function updateMe(body: Parameters<typeof api.patchMe>[0]) {
  const me = await api.patchMe(body);
  set({ me });
  return me;
}

export async function saveUpi(upiId: string) {
  const me = await api.putUpi(upiId);
  set({ me });
  return me;
}

export async function removeUpi() {
  const me = await api.deleteUpi();
  set({ me });
  return me;
}

// ---------------------------------------------------------------------------
// One trip
// ---------------------------------------------------------------------------

function applyView(tripId: Id, view: TripView) {
  if (!isFresh(tripId, "view", view.seq)) return;
  set((s) => {
    const t = tripDraft(s, tripId);
    t.view = view;
    t.viewLoad = "ready";
    t.forbidden = false;
    bumpSeq(t, view.seq);
  });
}

export const loadTrip = (tripId: Id) =>
  once(`trip|${tripId}`, async () => {
    set((s) => {
      const t = tripDraft(s, tripId);
      if (t.viewLoad === "idle" || t.viewLoad === "error") t.viewLoad = "loading";
    });
    try {
      const view = await api.trip(tripId);
      applyView(tripId, view);
      return view;
    } catch (err) {
      set((s) => {
        const t = tripDraft(s, tripId);
        // 403 is both "not a member" and "no such trip" (§1.2): either way there is nothing to show.
        if (isApiError(err) && (err.status === 403 || err.status === 404)) {
          s.trips[tripId] = { ...emptyTrip(), forbidden: true, viewLoad: "error" };
        } else if (!t.view) t.viewLoad = "error";
      });
      throw err;
    }
  });

export async function createTrip(body: CreateTripBody = {}, idempotencyKey?: string): Promise<TripView> {
  const view = await api.createTrip(body, { idempotencyKey });
  applyView(view.trip_id, view);
  void loadHome().catch(() => {});
  return view;
}

export async function patchTrip(tripId: Id, body: PatchTripBody) {
  const res = await api.patchTrip(tripId, body);
  await loadTrip(tripId);
  return res;
}

export async function acceptInvite(code: string, answers?: JoinAnswers): Promise<InviteAccepted> {
  const res = await api.acceptInvite(code, answers);
  void loadHome().catch(() => {});
  return res;
}

export async function saveJoinAnswers(tripId: Id, answers: JoinAnswers) {
  const person = await api.putJoinAnswers(tripId, answers);
  const { seq, ...me } = person;
  set((s) => {
    const t = tripDraft(s, tripId);
    if (!t.view) return;
    t.view.me.person = me;
    const at = t.view.people.findIndex((p) => p.person_id === me.person_id);
    if (at >= 0) t.view.people[at] = me;
    bumpSeq(t, seq);
  });
  return person;
}

export async function setGoPaused(tripId: Id, paused: boolean) {
  const person = await api.pauseGo(tripId, paused);
  const { seq, ...me } = person;
  set((s) => {
    const t = tripDraft(s, tripId);
    if (t.view) t.view.me.person = me;
    bumpSeq(t, seq);
  });
  return person;
}

export async function leaveTrip(tripId: Id) {
  await api.leaveTrip(tripId);
  set((s) => {
    delete s.trips[tripId];
  });
  void loadHome().catch(() => {});
}

export async function rotateInvite(tripId: Id) {
  const invite = await api.rotateInvite(tripId);
  set((s) => {
    const t = tripDraft(s, tripId);
    if (t.view) t.view.invite_url = invite.invite_url;
  });
  return invite;
}

export const loadNeedsYou = (tripId: Id) =>
  once(`needs|${tripId}`, async () => {
    const res = await api.needsYou(tripId);
    if (isFresh(tripId, "needs", res.seq)) {
      set((s) => {
        const t = tripDraft(s, tripId);
        t.needsYou = res.items;
        if (t.view) t.view.needs_you_count = res.items.length;
      });
    }
    return res.items;
  });

export const loadBookings = (tripId: Id) =>
  once(`bookings|${tripId}`, async () => {
    const res = await api.bookings(tripId);
    if (isFresh(tripId, "bookings", res.seq)) set((s) => void (tripDraft(s, tripId).bookings = res.items));
    return res.items;
  });

export const loadItinerary = (tripId: Id, scope: "everyone" | "me") =>
  once(`itinerary|${tripId}|${scope}`, async () => {
    const res = await api.itinerary(tripId, scope);
    if (isFresh(tripId, `itinerary-${scope}`, res.seq)) set((s) => void (tripDraft(s, tripId).itinerary[scope] = res.days));
    return res.days;
  });

export const loadMoney = (tripId: Id) =>
  once(`money|${tripId}`, async () => {
    const money = await api.money(tripId);
    if (isFresh(tripId, "money", money.seq)) set((s) => void (tripDraft(s, tripId).money = money));
    return money;
  });

/** First page of a filter (replaces what is held). The list has no `seq`: it is simply the latest answer. */
export const loadTransactions = (tripId: Id, filter: TransactionFilter = "all") =>
  once(`tx|${tripId}|${filter}`, async () => {
    const page = await api.transactions(tripId, { filter });
    set((s) => {
      tripDraft(s, tripId).transactions[filter] = {
        items: page.items,
        totalCount: page.total_count,
        nextCursor: page.next_cursor,
        loading: false,
      };
    });
    return page;
  });

export async function loadMoreTransactions(tripId: Id, filter: TransactionFilter) {
  const list = get().trips[tripId]?.transactions[filter];
  if (!list?.nextCursor || list.loading) return;
  const before = list.nextCursor;
  set((s) => {
    const l = tripDraft(s, tripId).transactions[filter];
    if (l) l.loading = true;
  });
  try {
    const page = await api.transactions(tripId, { filter, before });
    set((s) => {
      const l = tripDraft(s, tripId).transactions[filter];
      // The first page was re-read meanwhile (a `trip_changed`): this cursor belongs to the old list.
      if (!l || l.nextCursor !== before) return;
      const have = new Set(l.items.map((t) => t.transaction_id));
      l.items.push(...page.items.filter((t) => !have.has(t.transaction_id)));
      l.totalCount = page.total_count;
      l.nextCursor = page.next_cursor;
      l.loading = false;
    });
  } catch (err) {
    set((s) => {
      const l = tripDraft(s, tripId).transactions[filter];
      if (l) l.loading = false;
    });
    throw err;
  }
}

/** Trip home's "Go's calls": live ones, plus the latest ended one for the recording row (§4.11). */
export const loadCalls = (tripId: Id) =>
  once(`calls|${tripId}`, async () => {
    const res = await api.cards(tripId, { kind: "call" });
    set((s) => void (tripDraft(s, tripId).calls = res.items));
    return res.items;
  });

/**
 * Re-reads what the app holds of a trip after a `trip_changed` (§3.1): the trip itself always, and each loaded part
 * the frame's `kinds` hint names (all of them when there is no hint).
 */
export async function refreshTrip(tripId: Id, kinds?: TripChangeKind[] | null, minSeq?: number): Promise<void> {
  const round = () => {
    const t = get().trips[tripId];
    if (!t) return Promise.resolve([]);
    const touches = (...names: TripChangeKind[]) => !kinds || kinds.length === 0 || names.some((k) => kinds.includes(k));
    const jobs: Promise<unknown>[] = [loadTrip(tripId)];
    if (t.needsYou) jobs.push(loadNeedsYou(tripId));
    if (t.bookings && touches("booking")) jobs.push(loadBookings(tripId));
    if (t.money && touches("expense", "settlement", "booking", "budget", "people")) jobs.push(loadMoney(tripId));
    if (touches("expense", "settlement", "booking")) {
      for (const filter of Object.keys(t.transactions) as TransactionFilter[]) jobs.push(loadTransactions(tripId, filter));
    }
    if (touches("itinerary", "booking")) {
      if (t.itinerary.everyone) jobs.push(loadItinerary(tripId, "everyone"));
      if (t.itinerary.me) jobs.push(loadItinerary(tripId, "me"));
    }
    return Promise.allSettled(jobs);
  };
  await round();
  // A read that was already on its way when the change landed answers with the trip as it was before. Every answer
  // says which change number it matches (§1.6): when the trip's is older than the change that asked for this, read again.
  const seen = get().trips[tripId]?.view?.seq ?? 0;
  if (minSeq !== undefined && seen > 0 && seen < minSeq) await round();
}

// ---------------------------------------------------------------------------
// The room (§4.6)
// ---------------------------------------------------------------------------

const HISTORY_PAGE = 50;

/** Opens the room: the newest page the first time, the changes since the held `seq` after that. */
export const loadRoom = (tripId: Id) =>
  once(`room|${tripId}`, async () => {
    const t = get().trips[tripId];
    if (t?.room === "ready") return syncMessages(tripId);
    set((s) => void (tripDraft(s, tripId).room = "loading"));
    try {
      const page = await api.messagesHistory(tripId, { limit: HISTORY_PAGE });
      set((s) => {
        const d = tripDraft(s, tripId);
        page.messages.forEach((m) => upsertMessage(d, m));
        d.hasMoreHistory = page.has_more;
        d.room = "ready";
        markSynced(d, page.seq);
      });
    } catch (err) {
      set((s) => void (tripDraft(s, tripId).room = "error"));
      throw err;
    }
  });

/** Scroll back: the page before the oldest message held. */
export async function loadOlderMessages(tripId: Id) {
  const t = get().trips[tripId];
  if (!t || !t.hasMoreHistory || t.loadingHistory || t.order.length === 0) return;
  const oldest = t.messages[t.order[0]].seq;
  set((s) => void (tripDraft(s, tripId).loadingHistory = true));
  try {
    const page = await api.messagesHistory(tripId, { before_seq: oldest, limit: HISTORY_PAGE });
    set((s) => {
      const d = tripDraft(s, tripId);
      page.messages.forEach((m) => upsertMessage(d, m));
      d.hasMoreHistory = page.has_more;
      d.loadingHistory = false;
    });
  } catch (err) {
    set((s) => void (tripDraft(s, tripId).loadingHistory = false));
    throw err;
  }
}

/** Changes mode: everything posted or changed after the `seq` the app holds: edits, deletes, reactions, replaced cards. */
export const syncMessages = (tripId: Id) =>
  once(`sync|${tripId}`, async () => {
    // From where the room is known to be complete, not from the newest change seen: a gap must be asked for again.
    let after = get().trips[tripId]?.syncedSeq ?? 0;
    for (let guard = 0; guard < 20; guard++) {
      const page = await api.messagesChanges(tripId, after);
      set((s) => {
        const d = tripDraft(s, tripId);
        page.messages.forEach((m) => upsertMessage(d, m));
        if (!page.has_more) markSynced(d, page.seq);
      });
      if (!page.has_more || page.messages.length === 0) return;
      after = page.messages[page.messages.length - 1].updated_seq;
    }
  });

/** `resync` (§3.3): what is held can no longer be trusted. Read the room and the trip again from scratch. */
export async function resyncTrip(tripId: Id) {
  const wasOpen = (get().trips[tripId]?.room ?? "idle") !== "idle";
  set((s) => {
    const d = tripDraft(s, tripId);
    d.messages = {};
    d.order = [];
    d.hasMoreHistory = false;
    d.syncedSeq = 0;
    d.room = "idle";
  });
  inFlight.delete(`room|${tripId}`);
  await Promise.allSettled([refreshTrip(tripId), wasOpen ? loadRoom(tripId) : Promise.resolve()]);
}

/** Marks the room read up to what is on screen and notes the visit (catch-up uses it). Never moves back. */
export async function markRead(tripId: Id) {
  const t = get().trips[tripId];
  if (!t) return;
  const upTo = t.order.length > 0 ? t.messages[t.order[t.order.length - 1]].seq : 0;
  set((s) => {
    const v = tripDraft(s, tripId).view;
    if (!v) return;
    v.me.unread_count = 0;
    v.chat.unread_count = 0;
    if (upTo > v.me.last_read_seq) v.me.last_read_seq = upTo;
  });
  await api.markRead(tripId, upTo > 0 ? { up_to_seq: upTo } : {});
}

export async function loadCatchUp(tripId: Id) {
  const catchUp = (await api.catchUp(tripId)) ?? null;
  set((s) => void (tripDraft(s, tripId).catchUp = catchUp));
  return catchUp;
}

export function dismissCatchUp(tripId: Id) {
  set((s) => void (tripDraft(s, tripId).catchUp = null));
}

// -- sending -----------------------------------------------------------------

/** The bytes of files on their way up, by `client_message_id` (blobs do not belong in the store). */
const blobs = new Map<string, Blob>();
/** The `upload_id` once the bytes are up, so a retried send does not upload twice. */
const uploadIds = new Map<string, Id>();

export interface SendInput {
  text?: string;
  file?: { blob: Blob; attachment: OutgoingAttachment };
  replyTo?: Id;
  aboutMessageId?: Id;
  /** The people the text names; the Server decides `mentions_go` itself (§4.6). */
  mentions?: Id[];
}

/** Shows my message at once as "sending", then replaces it with the stored `Message` (§3.2). */
export function sendMessage(tripId: Id, input: SendInput): string {
  const text = input.text?.trim();
  const clientId = newKey();
  if (!text && !input.file) return clientId;
  const outgoing: OutgoingMessage = {
    clientId,
    text: text || undefined,
    attachment: input.file?.attachment,
    replyTo: input.replyTo,
    aboutMessageId: input.aboutMessageId,
    mentions: input.mentions?.length ? input.mentions : undefined,
    status: "sending",
    createdAt: Date.now(),
  };
  if (input.file) blobs.set(clientId, input.file.blob);
  set((s) => void tripDraft(s, tripId).outbox.push(outgoing));
  void deliver(tripId, clientId);
  return clientId;
}

async function deliver(tripId: Id, clientId: string) {
  const out = get().trips[tripId]?.outbox.find((o) => o.clientId === clientId);
  if (!out) return;
  try {
    let uploadId = uploadIds.get(clientId);
    const blob = blobs.get(clientId);
    if (out.attachment && !uploadId) {
      if (!blob) throw new Error("the file is no longer available");
      uploadId = await uploadFile(blob, {
        purpose: "chat_attachment",
        kind: out.attachment.kind,
        mime: out.attachment.mime,
        name: out.attachment.name,
        size_bytes: out.attachment.sizeBytes,
        width: out.attachment.width ?? null,
        height: out.attachment.height ?? null,
        duration_s: out.attachment.durationS ?? null,
      });
      uploadIds.set(clientId, uploadId);
    }
    const body: PostMessageBody = { client_message_id: clientId };
    if (out.text) body.text = out.text;
    if (uploadId) body.attachments = [{ upload_id: uploadId }];
    if (out.replyTo) body.reply_to = out.replyTo;
    if (out.aboutMessageId) body.about_message_id = out.aboutMessageId;
    if (out.mentions) body.mentions = out.mentions;
    const message = await api.postMessage(tripId, body);
    set((s) => {
      const d = tripDraft(s, tripId);
      const held = d.seq;
      upsertMessage(d, message);
      advanceSeq(d, message.updated_seq, held);
      d.sentAs[message.message_id] = clientId;
      d.outbox = d.outbox.filter((o) => o.clientId !== clientId);
    });
    blobs.delete(clientId);
    uploadIds.delete(clientId);
  } catch (err) {
    set((s) => {
      const o = tripDraft(s, tripId).outbox.find((x) => x.clientId === clientId);
      if (!o) return;
      o.status = "failed";
      o.error = errorMessage(err, "Couldn’t send. Tap to try again.");
    });
  }
}

/** Same `client_message_id`, so a send that did reach the Server is not posted twice (§1.4). */
export function retrySend(tripId: Id, clientId: string) {
  set((s) => {
    const o = tripDraft(s, tripId).outbox.find((x) => x.clientId === clientId);
    if (!o) return;
    o.status = "sending";
    o.error = undefined;
  });
  void deliver(tripId, clientId);
}

export function discardSend(tripId: Id, clientId: string) {
  set((s) => {
    const d = tripDraft(s, tripId);
    d.outbox = d.outbox.filter((o) => o.clientId !== clientId);
  });
  blobs.delete(clientId);
  uploadIds.delete(clientId);
}

/** §4.5: ask for a signed URL, PUT the bytes with exactly the returned headers, hand back the `upload_id`. */
export async function uploadFile(blob: Blob, meta: UploadRequest): Promise<Id> {
  const ticket = await api.createUpload(meta);
  await putUpload(ticket, blob);
  return ticket.upload_id;
}

/** The stored message a write of mine answered with. */
function applyMessage(tripId: Id, message: Message) {
  set((s) => {
    const t = tripDraft(s, tripId);
    const held = t.seq;
    upsertMessage(t, message);
    advanceSeq(t, message.updated_seq, held);
  });
}

/** One reaction per person per message: a new emoji replaces mine, `null` takes it back. */
export async function react(tripId: Id, messageId: Id, emoji: string | null) {
  applyMessage(tripId, await api.react(tripId, messageId, emoji));
}

export async function editMessage(tripId: Id, messageId: Id, text: string) {
  applyMessage(tripId, await api.editMessage(tripId, messageId, text));
}

export async function deleteMessage(tripId: Id, messageId: Id) {
  applyMessage(tripId, await api.deleteMessage(tripId, messageId));
}

// ---------------------------------------------------------------------------
// Go's cards (§4.7) and the vault
// ---------------------------------------------------------------------------

/**
 * One press of a Go card button. Go's answer comes back as it is; `open` links are handled by the caller at once
 * (a `go://` route in the app, anything else in the browser). Do not retry on your own: a new press is a new `press_id`.
 */
export function tapCard(
  tripId: Id,
  cardId: Id,
  actionId: string,
  opts: { optionId?: Id; payload?: { trip: "oneway" | "round" } } = {},
): Promise<CardActionResult> {
  return api.cardAction(tripId, cardId, {
    action_id: actionId,
    press_id: newKey(),
    ...(opts.optionId ? { option_id: opts.optionId } : {}),
    ...(opts.payload ? { payload: opts.payload } : {}),
  });
}

export async function shareCallRecording(tripId: Id, cardId: Id) {
  const message = await api.shareCard(tripId, cardId);
  applyMessage(tripId, message);
  return message;
}

// ---------------------------------------------------------------------------
// Votes, mandate (§4.8)
// ---------------------------------------------------------------------------

/**
 * `takeMine`: let the decision's `my_vote` replace the pick on screen. Off while a burst of taps is still being sent, so
 * an older answer never moves my pick back from what I tapped last.
 */
function applyDecision(tripId: Id, decision: Decision, takeMine = !voteLanes.has(`${tripId}|${decision.decision_id}`)) {
  set((s) => {
    const t = tripDraft(s, tripId);
    if (takeMine && "my_vote" in decision) t.myVotes[decision.decision_id] = decision.my_vote ?? null;
    if (!t.view) return;
    const at = t.view.decisions.findIndex((d) => d.decision_id === decision.decision_id);
    if (at >= 0) t.view.decisions[at] = decision;
    else t.view.decisions.push(decision);
  });
}

/** The decision with my own vote (the only read that shows mine in an anonymous vote). */
export const loadDecision = (tripId: Id, decisionId: Id) =>
  once(`decision|${tripId}|${decisionId}`, async () => {
    const decision = await api.decision(tripId, decisionId);
    applyDecision(tripId, decision);
    return decision;
  });

/**
 * One vote request at a time per decision, in the order of the taps. A burst of taps (A, B, C) used to be three
 * requests in flight: their answers could land out of order and put the pick back on A, and the Server could end on a
 * vote that was not the last tap. Now only the latest tap is sent once the one before it is done.
 */
interface VoteLane {
  /** The last tap's number. */
  ticket: number;
  /** The requests so far, so the next one starts after them. */
  tail: Promise<void>;
  /** My vote as the Server last said it (what a refusal goes back to). */
  confirmed: MyVote | undefined;
}
const voteLanes = new Map<string, VoteLane>();

function sendVote(tripId: Id, decisionId: Id, next: MyVote, send: () => Promise<Decision>): Promise<void> {
  const key = `${tripId}|${decisionId}`;
  const lane: VoteLane = voteLanes.get(key) ?? { ticket: 0, tail: Promise.resolve(), confirmed: get().trips[tripId]?.myVotes[decisionId] };
  voteLanes.set(key, lane);
  const mine = ++lane.ticket;
  set((s) => void (tripDraft(s, tripId).myVotes[decisionId] = next));

  const run = lane.tail.then(async () => {
    // A later tap already replaced this one before it was sent: that tap carries the answer.
    if (lane.ticket !== mine) return;
    try {
      const decision = await send();
      lane.confirmed = "my_vote" in decision ? (decision.my_vote ?? null) : next;
      applyDecision(tripId, decision, lane.ticket === mine);
    } catch (err) {
      // A tap made meanwhile is sent next and decides; only the last one puts the pick back.
      if (lane.ticket !== mine) return;
      restoreVote(tripId, decisionId, lane.confirmed);
      throw err;
    }
  });
  lane.tail = run.catch(() => {});
  void lane.tail.then(() => {
    if (lane.ticket === mine && voteLanes.get(key) === lane) voteLanes.delete(key);
  });
  return run;
}

/** Cast or move my vote. My pick shows at once and is put back if the Server refuses. */
export const castVote = (tripId: Id, decisionId: Id, vote: { option_index: number } | { flexible: true }) =>
  sendVote(tripId, decisionId, vote, () => api.vote(tripId, decisionId, vote));

/** Needs `features.vote_retract`. */
export const retractVote = (tripId: Id, decisionId: Id) =>
  sendVote(tripId, decisionId, null, () => api.retractVote(tripId, decisionId));

function restoreVote(tripId: Id, decisionId: Id, before: MyVote | undefined) {
  set((s) => {
    const votes = tripDraft(s, tripId).myVotes;
    if (before === undefined) delete votes[decisionId];
    else votes[decisionId] = before;
  });
}

export async function openPoll(tripId: Id, body: Omit<Parameters<typeof api.openDecision>[1], "client_id">) {
  const res = await api.openDecision(tripId, { ...body, client_id: newKey() });
  applyDecision(tripId, res.decision);
  applyMessage(tripId, res.message);
  return res;
}

export async function closeDecision(tripId: Id, decisionId: Id) {
  applyDecision(tripId, await api.closeDecision(tripId, decisionId));
}

export async function cancelDecision(tripId: Id, decisionId: Id) {
  applyDecision(tripId, await api.cancelDecision(tripId, decisionId));
}

/** "Yes, book it" / "Not now": the payer only. Go may then post a `pay` card; the payment itself is on the vault page. */
export async function answerMandate(tripId: Id, decisionId: Id, answer: "confirm" | "decline") {
  const mandate = answer === "confirm" ? await api.confirmMandate(tripId, decisionId) : await api.declineMandate(tripId, decisionId);
  set((s) => {
    const d = tripDraft(s, tripId).view?.decisions.find((x) => x.decision_id === decisionId);
    if (d) d.mandate = mandate;
  });
  return mandate;
}

// ---------------------------------------------------------------------------
// Money (§4.9)
// ---------------------------------------------------------------------------

function refreshMoney(tripId: Id) {
  // What I owe on the home screen moves with the trip's money (§4.2).
  if (get().home) void loadHome().catch(() => {});
  return Promise.allSettled([
    loadMoney(tripId),
    loadNeedsYou(tripId),
    ...(Object.keys(get().trips[tripId]?.transactions ?? {}) as TransactionFilter[]).map((f) => loadTransactions(tripId, f)),
  ]);
}

/** "Record a payment": counts at once and for good. */
export async function recordPayment(
  tripId: Id,
  body: { to_person_id: Id; amount_minor: number; currency: string; method: SettlementMethod; note?: string },
  idempotencyKey: string,
) {
  const res = await api.recordSettlement(tripId, body, { idempotencyKey });
  set((s) => {
    const t = tripDraft(s, tripId);
    bumpSeq(t, res.seq);
    if (t.view) t.view.money.transfers = res.transfers;
  });
  await refreshMoney(tripId);
  return res;
}

export async function addExpense(tripId: Id, body: Parameters<typeof api.addExpense>[1], idempotencyKey: string): Promise<Expense> {
  const expense = await api.addExpense(tripId, body, { idempotencyKey });
  set((s) => bumpSeq(tripDraft(s, tripId), expense.seq));
  await refreshMoney(tripId);
  return expense;
}

export async function fixSplit(tripId: Id, expenseId: Id, body: { split_person_ids: Id[]; note?: string }) {
  const expense = await api.fixSplit(tripId, expenseId, body);
  await Promise.allSettled([refreshMoney(tripId), loadTrip(tripId)]);
  return expense;
}

export async function removeExpense(tripId: Id, expenseId: Id) {
  await api.removeExpense(tripId, expenseId);
  await Promise.allSettled([refreshMoney(tripId), loadTrip(tripId)]);
}

// ---------------------------------------------------------------------------
// Bookings (§4.10), web check-in (§4.12)
// ---------------------------------------------------------------------------

export async function addBooking(tripId: Id, body: AddBooking, idempotencyKey: string): Promise<Booking> {
  const booking = await api.addBooking(tripId, body, { idempotencyKey });
  await Promise.allSettled([loadBookings(tripId), loadTrip(tripId)]);
  return booking;
}

export async function proposeCancelBooking(tripId: Id, bookingId: Id, idempotencyKey: string) {
  const res = await api.cancelVote(tripId, bookingId, { idempotencyKey });
  await loadTrip(tripId);
  return res;
}

function applyCheckin(tripId: Id, bookingId: Id, state: CheckinState) {
  // `payment_required` / `seat_price` belong to one PATCH answer, not to the stored state.
  const { payment_required: _p, seat_price: _s, ...stored } = state;
  void _p;
  void _s;
  set((s) => void (tripDraft(s, tripId).checkin[bookingId] = stored as CheckinState));
}

export const loadCheckin = (tripId: Id, bookingId: Id) =>
  once(`checkin|${tripId}|${bookingId}`, async () => {
    const state = await api.checkin(tripId, bookingId);
    applyCheckin(tripId, bookingId, state);
    return state;
  });

/** A paid seat is not set: the answer carries `payment_required` and Go posts a `pay` card. */
export async function patchCheckin(tripId: Id, bookingId: Id, body: PatchCheckinBody) {
  const state = await api.patchCheckin(tripId, bookingId, body);
  applyCheckin(tripId, bookingId, state);
  return state;
}

/** `done` with the boarding pass, or `working`: read the check-in again for the pass. */
export async function completeCheckin(tripId: Id, bookingId: Id, idempotencyKey: string) {
  const state = await api.completeCheckin(tripId, bookingId, { idempotencyKey });
  applyCheckin(tripId, bookingId, state);
  void loadNeedsYou(tripId).catch(() => {});
  return state;
}

// ---------------------------------------------------------------------------
// The You screen (§4.13)
// ---------------------------------------------------------------------------

export async function loadGoPage() {
  const goPage = await api.whatGoKnows();
  set({ goPage });
  return goPage;
}

export async function setCarryOver(on: boolean) {
  await api.setCarryOver(on);
  set((s) => {
    if (s.goPage) s.goPage.carry_over = on;
  });
}

export async function deleteFact(factId: Id) {
  try {
    await api.deleteFact(factId);
  } catch (err) {
    // 404: Go has no such fact any more. Remove it from the screen all the same.
    if (!(isApiError(err) && err.status === 404)) throw err;
  }
  set((s) => {
    if (s.goPage) s.goPage.facts = s.goPage.facts.filter((f) => f.fact_id !== factId);
  });
}

export async function forgetMe(tripId?: Id) {
  const res = await api.forgetMe(tripId);
  set((s) => {
    if (s.goPage) s.goPage.facts = tripId ? s.goPage.facts.filter((f) => f.trip_id !== tripId) : [];
  });
  return res;
}
