import type { Booking, Decision, Id, MoneyView, TripView } from "@/api/contract";
import { board as copy } from "@/data/seed/copy";
import type { User } from "@/data/types";
import { formatDay, wallTime } from "@/lib/dates";
import { kFormat } from "@/lib/format";
import { isTravel, routeLine } from "@/state/bookingView";
import { voteShape } from "@/state/optionView";
import { fromMinor, illustrationFor, placePhoto, toTripDates, userOf } from "@/state/view";

// The Trip board (CONTRACT-APP §4.4, §4.8): where the trip stands, read from the trip itself. Nothing is edited here:
// a row's button asks Go in the room, opens the group budget, or opens the vote.

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
      /** The open stay vote: its card is where the vote is cast. */
      decisionId: Id;
      options: { id: string; name: string; img: string; votes: number }[];
    };
export interface BoardReminder {
  eyebrow: string;
  value: string;
  sub: string;
  cta: string;
  target: "travel";
}
export type BoardSpend = { kind: "empty" } | { kind: "filled"; stay: number; travel: number; budget: number; left: number };
export interface BoardModel {
  subtitle: string;
  rows: BoardRowModel[];
  reminder?: BoardReminder;
  spend: BoardSpend;
}

const row = (key: BoardTarget, emoji: string, eyebrow: string, value: string, sub: string, trailing: BoardTrailing): BoardRowModel => ({
  kind: "row",
  key,
  emoji,
  eyebrow,
  value,
  sub,
  trailing,
});
const CHANGE: BoardTrailing = { kind: "change" };

/** "closes in 2 hrs" · "closes in 20 min" · "" */
export function closesIn(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "";
  const minutes = Math.round((Date.parse(iso) - now.getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  if (minutes < 60) return `closes in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `closes in ${hours} ${hours === 1 ? "hr" : "hrs"}`;
  return `closes in ${Math.round(hours / 24)} days`;
}

const KIND_WORD: Record<string, string> = { flight: "Flight", train: "Train", bus: "Bus", cab: "Cab" };

export function buildBoard(view: TripView, money: MoneyView | null, users: Record<Id, User>, now: Date = new Date()): BoardModel {
  const R = copy.rows;
  const meId = view.me.person.person_id;
  const confirmed = view.bookings.filter((b) => b.status === "confirmed");

  // Where, when
  const where = view.destination
    ? row("where", R.where.emoji, R.where.eyebrow, view.destination.name, R.where.decidedSub, CHANGE)
    : row("where", R.where.emoji, R.where.eyebrow, R.where.notSet.value, R.where.notSet.sub, { kind: "ask", label: R.where.notSet.ask });
  const dates = view.dates ? toTripDates(view.dates, now) : null;
  const when = dates
    ? row("when", R.when.emoji, R.when.eyebrow, dates.range, R.when.decidedSub(dates.countdown), CHANGE)
    : row("when", R.when.emoji, R.when.eyebrow, R.when.notSet.value, R.when.notSet.sub, { kind: "ask", label: R.when.notSet.ask });

  // Stay: booked, else an open stay vote, else the winner of a closed one, else nothing yet.
  const stayBooking = confirmed.find((b) => b.kind === "stay");
  const stayVotes = view.decisions.filter((d) => !d.cancels_booking_id && voteShape(d) === "stay");
  const openVote = stayVotes.find((d) => d.status === "open");
  const wonVote = stayVotes.find((d): d is Decision & { result_index: number } => d.status === "closed" && d.result_index != null);
  let stay: BoardRowModel;
  if (stayBooking) {
    const payer = stayBooking.payer_person_id === meId ? "you" : userOf(users, stayBooking.payer_person_id).firstName;
    stay = row("stay", R.stay.emoji, R.stay.eyebrow, stayBooking.title, R.stay.bookedSub(payer), { kind: "status", tone: "success", label: R.stay.status });
  } else if (openVote) {
    stay = {
      kind: "poll",
      key: "stay",
      emoji: R.stay.emoji,
      eyebrow: R.stay.voteOpen.eyebrow,
      value: R.stay.voteOpen.value(openVote.options.length),
      sub: R.stay.voteOpen.sub(openVote.voted, openVote.of, closesIn(openVote.closes_at, now)),
      cta: R.stay.voteOpen.cta,
      decisionId: openVote.decision_id,
      options: openVote.options.slice(0, 3).map((o, i) => ({
        id: String(i),
        name: o.label,
        img: o.image_url ?? o.photos?.[0]?.url ?? illustrationFor(`${openVote.decision_id}:${i}`, o.label),
        votes: openVote.tally[i] ?? 0,
      })),
    };
  } else if (wonVote) {
    stay = row("stay", R.stay.emoji, R.stay.eyebrow, wonVote.options[wonVote.result_index]?.label ?? "", R.stay.decidedSub, CHANGE);
  } else {
    stay = row("stay", R.stay.emoji, R.stay.eyebrow, R.stay.notSet.value, R.stay.notSet.sub, { kind: "ask", label: R.stay.notSet.ask });
  }

  // The group's one budget per person (§4.4).
  const budgetMinor = view.budget?.per_person_minor ?? null;
  const budgetCopy = budgetMinor ? R.budget.decided(kFormat(fromMinor(budgetMinor))) : null;
  const budget = budgetCopy
    ? row("budget", R.budget.emoji, R.budget.eyebrow, budgetCopy.value, budgetCopy.sub, CHANGE)
    : row("budget", R.budget.emoji, R.budget.eyebrow, R.budget.notSet.value, R.budget.notSet.sub, { kind: "ask", label: R.budget.notSet.ask });

  // My own travel: bookings that cover me. A way there with no way back is "1 of 2".
  const mine: Booking[] = confirmed.filter((b) => isTravel(b) && b.kind !== "cab" && b.journey && b.for_person_ids.includes(meId));
  const out = mine[0];
  const hasReturn = mine.some((b) => b.return_journey) || mine.length > 1;
  let travel: BoardRowModel;
  let reminder: BoardReminder | undefined;
  if (!out?.journey) {
    travel = row("travel", R.travel.emoji, R.travel.eyebrow, R.travel.notSet.value, R.travel.notSet.sub, { kind: "ask", label: R.travel.notSet.ask });
  } else if (hasReturn) {
    travel = row("travel", R.travel.emoji, R.travel.eyebrow, R.travel.booked.value, R.travel.booked.sub(routeLine(out.journey).replace("→", "⇄")), {
      kind: "status",
      tone: "success",
      label: R.travel.booked.status,
    });
  } else {
    const route = [routeLine(out.journey), out.journey.number].filter(Boolean).join(" · ");
    travel = row("travel", R.travel.emoji, R.travel.eyebrow, R.travel.partial.value(KIND_WORD[out.kind] ?? "Trip"), R.travel.partial.sub(route), {
      kind: "status",
      tone: "amber",
      label: R.travel.partial.status,
    });
    const end = view.dates ? formatDay(wallTime(`${view.dates.end}T12:00:00+00:00`)) : "";
    reminder = { eyebrow: copy.reminder.eyebrow, value: copy.reminder.value(end), sub: copy.reminder.sub, cta: copy.reminder.cta, target: "travel" };
  }

  const rows = [where, when, stay, budget, travel];
  const allNotSet = rows.every((r) => r.kind === "row" && r.trailing.kind === "ask");
  const subtitle = allNotSet
    ? copy.subtitles.empty
    : view.destination && view.dates && (stayBooking || wonVote)
      ? copy.subtitles.settled
      : copy.subtitles.polling;

  // My share of what was spent against the group's budget per person; empty until there is a budget (and the money read).
  let spend: BoardSpend = { kind: "empty" };
  if (budgetMinor && money) {
    const of = (category: string) => fromMinor(money.me.by_category.find((c) => c.category === category)?.amount_minor ?? 0);
    const total = fromMinor(money.me.spent_minor);
    const stayAmount = of("stay");
    const cap = fromMinor(budgetMinor);
    spend = { kind: "filled", stay: stayAmount, travel: Math.max(0, total - stayAmount), budget: cap, left: Math.max(0, cap - total) };
  }

  return { subtitle, rows, ...(reminder ? { reminder } : {}), spend };
}

/** The destination photo for places that have one (the board's poll thumbnails fall back to illustrations). */
export const boardPhoto = placePhoto;
