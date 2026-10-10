import type { Booking, Id, MoneyView as ApiMoney, Transaction as ApiTransaction, Transfer } from "@/api/contract";
import { MONEY_COPY } from "@/data/seed/money";
import type { PaymentMethod, Settlement, Transaction, User } from "@/data/types";
import { daysBetween, monthShort } from "@/lib/dates";
import { inr } from "@/lib/format";
import { bookingEmoji } from "@/state/bookingView";
import { fromMinor, userOf } from "@/state/view";

// Contract money (CONTRACT-APP §4.9) → what the Expenses tab, the Transactions page and the Board draw. Every amount
// leaves the Server in minor units; the components take whole rupees.

export type Scope = "everyone" | "me";

const METHOD: Record<NonNullable<ApiTransaction["method"]>, PaymentMethod> = {
  upi: "UPI",
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
  other: "Other",
};
export const METHOD_TO_API = { UPI: "upi", Cash: "cash", "Bank transfer": "bank_transfer", Other: "other" } as const;

/** "Today" · "16 Oct" */
function dateLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  if (daysBetween(date, now) === 0) return MONEY_COPY.todayLabel;
  return `${date.getDate()} ${monthShort(date)}`;
}

export function toTransactionRow(tx: ApiTransaction, bookings: Booking[], now: Date = new Date()): Transaction {
  const booking = tx.booking_id ? bookings.find((b) => b.booking_id === tx.booking_id) : undefined;
  return {
    id: tx.transaction_id,
    date: tx.occurred_at,
    dateLabel: dateLabel(tx.occurred_at, now),
    payerId: tx.payer_person_id,
    verb: tx.verb === "booked_with" ? "booked with" : "paid",
    to:
      tx.to.kind === "person"
        ? { kind: "user", id: tx.to.person_id }
        : { kind: "merchant", name: tx.to.name, emoji: booking ? bookingEmoji(booking.kind) : "🧾" },
    amount: fromMinor(tx.amount_minor),
    ...(tx.method ? { method: METHOD[tx.method] ?? "Other" } : {}),
    note: tx.note ?? "",
    kind: tx.kind,
    mine: tx.mine,
  };
}

export const toSettlement = (t: Transfer): Settlement => ({
  fromId: t.from_person_id,
  toId: t.to_person_id,
  amount: fromMinor(t.amount_minor),
  status: "open",
});

export interface SpendSegment {
  key: "stay" | "travel" | "other";
  amount: number;
  pct: number;
}

export interface MoneyViewModel {
  total: number;
  caption: string;
  bar: { track: boolean; segments: SpendSegment[]; aria: string };
  tiles: { stay: number; travel: number; other: number };
  footnote: string | null;
  showEditBudget: boolean;
  settlements: Settlement[];
  settleMeta: string;
}

const pct1 = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

/**
 * The spend summary for one scope. Both views come from the one `GET …/money` answer: "Everyone" from the trip's
 * totals, "Just me" from `me` (my share of each expense by its equal split). The budget is the group's one amount per
 * person (§4.4); with none set, "Just me" shows the plain total.
 */
export function buildMoneyView(money: ApiMoney, scope: Scope, budgetMinor: number | null | undefined, users: Record<Id, User>): MoneyViewModel {
  const source = scope === "me" ? money.me : money;
  const of = (category: string) => fromMinor(source.by_category.find((c) => c.category === category)?.amount_minor ?? 0);
  const total = fromMinor(source.spent_minor);
  const stay = of("stay");
  const travel = of("getting_around");
  // Food, activities and anything else: one tile, so the three always add up to the total.
  const other = Math.max(0, Math.round((total - stay - travel) * 100) / 100);
  const tiles = { stay, travel, other };

  const payees = new Set(money.transfers.map((t) => t.to_person_id));
  const settleMeta =
    money.transfers.length === 0
      ? ""
      : payees.size === 1
        ? MONEY_COPY.settleMetaOne(userOf(users, [...payees][0]).firstName)
        : MONEY_COPY.settleMetaMany(money.transfers.length);
  const settlements = money.transfers.map(toSettlement);

  const budget = scope === "me" && budgetMinor ? fromMinor(budgetMinor) : null;
  const whole = budget ?? total;
  const segments: SpendSegment[] = (["stay", "travel", "other"] as const)
    .map((key) => ({ key, amount: tiles[key], pct: pct1(tiles[key], whole) }))
    .filter((s) => s.amount > 0);

  if (scope === "everyone") {
    return {
      total,
      caption: MONEY_COPY.everyoneCaption,
      bar: { track: false, segments, aria: MONEY_COPY.barAriaEveryone(inr(stay), inr(travel)) },
      tiles,
      footnote: null,
      showEditBudget: false,
      settlements,
      settleMeta,
    };
  }
  return {
    total,
    caption: budget ? MONEY_COPY.meCaption(inr(Math.max(0, budget - total)), inr(budget)) : MONEY_COPY.meCaptionNoBudget,
    bar: {
      track: true,
      segments,
      aria: budget ? MONEY_COPY.barAriaMe(Math.floor((total / budget) * 100)) : MONEY_COPY.barAriaEveryone(inr(stay), inr(travel)),
    },
    tiles,
    footnote: MONEY_COPY.meFootnote,
    showEditBudget: true,
    settlements,
    settleMeta,
  };
}
