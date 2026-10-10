import type { Booking, CallCard, CardInRoom, Id, NeedsYouItem, RecordLine, TripView } from "@/api/contract";
import { CALL_CHIPS } from "@/data/seed/calls";
import { tripHome } from "@/data/seed/copy";
import type { ChipOption, User } from "@/data/types";
import { formatDayShort, wallTime } from "@/lib/dates";
import { kFormat } from "@/lib/format";
import { bookingEmoji, isTravel, routeLine } from "@/state/bookingView";
import { fromMinor, userOf } from "@/state/view";

// Trip home (CONTRACT-APP §4.11): "Pending on you" is the Server's needs-you list; "Done" is what the trip itself
// says is settled (bookings, the record, the budget); Go's calls are the room's `call` cards.

export interface CallModel {
  cardId: Id;
  who: string;
  asking: string;
  state: CallCard["state"];
  startedAt: number | null;
  outcome: string | null;
  card: CallCard;
  canStop: boolean;
  canListen: boolean;
}

const isCall = (c: CardInRoom): c is CardInRoom & { card: CallCard } => c.card.kind === "call";

export function toCall(card: CallCard): CallModel {
  const actions = card.actions ?? [];
  return {
    cardId: card.card_id,
    who: card.business,
    asking: card.goal,
    state: card.state,
    startedAt: card.started_at ? Date.parse(card.started_at) : null,
    outcome: card.outcome ?? null,
    card,
    canStop: actions.some((a) => a.action_id === "stop"),
    canListen: actions.some((a) => a.action_id === "listen"),
  };
}

export interface DoneRowModel {
  key: string;
  emoji: string;
  title: string;
  sub: string;
  /** Opens to "Ask Go to call …" (and the live / last call with that business). */
  expand?: {
    who: string;
    chips: ChipOption[];
    live?: CallModel;
    last?: CallModel;
    bookingId?: Id;
  };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** A call is about a booking when Go's `business` and the booking's vendor / title / place name the same thing. */
function callMatches(call: CallModel, b: Booking): boolean {
  const business = norm(call.who);
  if (!business) return false;
  return [b.vendor, b.title, b.place?.name ?? ""].map(norm).some((name) => name !== "" && (name.includes(business) || business.includes(name)));
}

function bookingSub(b: Booking, users: Record<Id, User>, meId: Id): string {
  if (b.journey) return b.return_journey ? `${routeLine(b.journey).replace("→", "⇄")} · ${tripHome.done.bothWays}` : routeLine(b.journey);
  const payer = b.payer_person_id === meId ? "you" : userOf(users, b.payer_person_id).firstName;
  if (b.starts_at && b.ends_at) return `${formatDayShort(wallTime(b.starts_at))} → ${formatDayShort(wallTime(b.ends_at))} · ${tripHome.done.paidBy(payer)}`;
  return b.amount_minor > 0 ? tripHome.done.paidBy(payer) : b.vendor;
}

const LINE_EMOJI: Record<RecordLine["kind"], string> = { decided: "🗳️", agreed: "🤝", open: "✅", doing: "✅", booked: "🎟️" };

export function buildDone(view: TripView, calls: CardInRoom[] | null, users: Record<Id, User>): DoneRowModel[] {
  const meId = view.me.person.person_id;
  const all = (calls ?? []).filter(isCall).map((c) => toCall(c.card));
  const live = all.filter((c) => c.state === "dialing" || c.state === "talking");
  const ended = all.filter((c) => c.state === "ended" && c.outcome);
  const used = new Set<Id>();
  const take = (list: CallModel[], b: Booking) => {
    const hit = list.find((c) => !used.has(c.cardId) && callMatches(c, b));
    if (hit) used.add(hit.cardId);
    return hit;
  };

  const rows: DoneRowModel[] = [];
  const bookings = view.bookings.filter((b) => b.status === "confirmed");
  for (const b of bookings) {
    rows.push({
      key: b.booking_id,
      emoji: bookingEmoji(b.kind),
      title: tripHome.done.booked(b.title),
      sub: bookingSub(b, users, meId),
      expand: {
        who: b.vendor,
        chips: CALL_CHIPS[b.kind === "stay" ? "stay" : isTravel(b) ? "fly" : "main"],
        live: take(live, b),
        last: take(ended, b),
        bookingId: b.booking_id,
      },
    });
  }
  // Calls about nothing booked (a restaurant, a cab desk) still show: live ones first, then the latest that ended.
  const loose = [...live.filter((c) => !used.has(c.cardId)), ...ended.filter((c) => !used.has(c.cardId)).slice(0, 1)];
  const callRows: DoneRowModel[] = loose.map((c) => ({
    key: `call:${c.cardId}`,
    emoji: "📞",
    title: tripHome.done.call(c.who),
    sub: c.asking,
    expand: { who: c.who, chips: CALL_CHIPS.main, ...(c.state === "ended" ? { last: c } : { live: c }) },
  }));

  const shown = new Set(bookings.map((b) => b.booking_id));
  const lines = view.record
    .filter((l) => l.status !== "undone" && (l.kind === "decided" || l.kind === "agreed" || l.status === "done") && !(l.booking_id && shown.has(l.booking_id)))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((l): DoneRowModel => ({ key: `line:${l.line_id}`, emoji: LINE_EMOJI[l.kind] ?? "✅", title: l.text, sub: tripHome.done.lineSub[l.kind] ?? "" }));

  const extra: DoneRowModel[] = [];
  const owesNobody = !view.money.transfers.some((t) => t.from_person_id === meId);
  if (owesNobody && view.expenses.length > 0) extra.push({ key: "settled", ...tripHome.done.settled });
  const budget = view.budget?.per_person_minor;
  if (budget) extra.push({ key: "budget", emoji: tripHome.done.budget.emoji, title: tripHome.done.budget.title, sub: tripHome.done.budget.sub(kFormat(fromMinor(budget))) });

  return [...callRows, ...rows, ...lines, ...extra];
}

export type PendingLeading = { kind: "avatar"; user: User } | { kind: "emoji"; emoji: string };

export interface PendingRowModel {
  key: string;
  item: NeedsYouItem;
  leading: PendingLeading;
  title: string;
  sub: string;
  cta: string;
}

const KIND_EMOJI: Record<NeedsYouItem["kind"], string> = {
  vote: "🗳️",
  mandate: "✅",
  card: "🔔",
  record_line: "📝",
  settle_up: "🤝",
  checkin: "🛫",
};
const KIND_CTA: Record<NeedsYouItem["kind"], string> = {
  vote: "Vote",
  mandate: "Open",
  card: "Open",
  record_line: "Open",
  settle_up: "Record",
  checkin: "Check in",
};

/** Titles, subtitles and button labels are the Server's own words; only the picture is chosen here. */
export function toPendingRow(item: NeedsYouItem, users: Record<Id, User>): PendingRowModel {
  const payee = item.kind === "settle_up" && item.target.transfer ? userOf(users, item.target.transfer.to_person_id) : null;
  return {
    key: item.item_id,
    item,
    leading: payee ? { kind: "avatar", user: payee } : { kind: "emoji", emoji: KIND_EMOJI[item.kind] ?? "🔔" },
    title: item.title,
    sub: item.subtitle ?? "",
    cta: item.cta_label ?? KIND_CTA[item.kind] ?? "Open",
  };
}
