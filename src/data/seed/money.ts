import { assets } from "@/lib/assets";
import type { PaymentMethod, Settlement, SpendTotals, Transaction } from "@/data/types";

// M4–M7 (M-bookings-money.md §1.7). Store order, newest first; notes verbatim (curly quotes added at render).
export const TRANSACTIONS: Transaction[] = [
  {
    id: "tx1",
    date: "2026-10-16",
    dateLabel: "16 Oct",
    payerId: "aarav",
    verb: "paid",
    to: { kind: "user", id: "rahul" },
    amount: 5000,
    method: "Cash",
    note: "part of villa, rest on Friday",
    kind: "payback",
    mine: true,
  },
  {
    id: "tx2",
    date: "2026-10-15",
    dateLabel: "15 Oct",
    payerId: "arjun",
    verb: "paid",
    to: { kind: "user", id: "rahul" },
    amount: 10800,
    method: "UPI",
    note: "villa share 🏡",
    kind: "payback",
    mine: false,
  },
  {
    id: "tx3",
    date: "2026-10-14",
    dateLabel: "14 Oct",
    payerId: "priya",
    verb: "booked with",
    to: { kind: "merchant", name: "redBus", emoji: "🚌" },
    amount: 2700,
    method: "UPI",
    note: "Bus both ways",
    kind: "booking",
    mine: false,
  },
  {
    id: "tx4",
    date: "2026-10-13",
    dateLabel: "13 Oct",
    payerId: "rahul",
    verb: "booked with",
    to: { kind: "merchant", name: "IRCTC", emoji: "🚆" },
    amount: 2900,
    method: "UPI",
    note: "Train both ways",
    kind: "booking",
    mine: false,
  },
  {
    id: "tx5",
    date: "2026-10-13",
    dateLabel: "13 Oct",
    payerId: "arjun",
    verb: "booked with",
    to: { kind: "merchant", name: "IndiGo", emoji: "✈️" },
    amount: 8060,
    method: "Card",
    note: "Flights both ways",
    kind: "booking",
    mine: false,
  },
  {
    // "You booked with IndiGo ₹8,060": added by bookRoute (F-travel.md §1.2), seed amount whatever was picked.
    id: "tx6",
    date: "2026-10-12",
    dateLabel: "12 Oct",
    payerId: "aarav",
    verb: "booked with",
    to: { kind: "merchant", name: "IndiGo", emoji: "✈️" },
    amount: 8060,
    method: "UPI",
    note: "Flights both ways",
    kind: "booking",
    mine: true,
  },
  {
    // "Rahul booked with Villa Sol ₹43,200": added by completeBooking (E-deciding.md §1.2 book).
    id: "tx7",
    date: "2026-10-12",
    dateLabel: "12 Oct",
    payerId: "rahul",
    verb: "booked with",
    to: { kind: "merchant", name: "Villa Sol", img: assets.photos.villaSol.src },
    amount: 43200,
    method: "Card",
    note: "Villa Sol, 3 nights · split 4 ways",
    kind: "booking",
    mine: true,
  },
];

export const TX_ROUTE_BOOKING_ID = "tx6";
export const TX_STAY_BOOKING_ID = "tx7";

// Seed order = row order. Literals, independent of who actually paid (PLAN §12.1 #7).
export const SETTLEMENTS: Settlement[] = [
  { fromId: "aarav", toId: "rahul", amount: 5800, status: "open" },
  { fromId: "priya", toId: "rahul", amount: 10800, status: "open" },
  { fromId: "arjun", toId: "rahul", amount: 0, status: "settled" },
];

// 21,720 = 8,060 + 8,060 + 2,900 + 2,700. Budget literal per PLAN §12.1 #6.
export const SPEND: SpendTotals = {
  crew: { stay: 43200, travel: 21720 },
  me: { stay: 10800, travel: 8060 },
  budget: 21800,
};

// E7 budget slider: stored range only; chip and "₹21.8k" copy stay literal (PLAN §12.1 #6).
export const BUDGET_RANGE = { min: 5000, max: 60000, step: 1000, lo: 15000, hi: 25000 } as const;

export const MY_BUDGET_INR = 21800; // the literal "₹21.8k"
export const MY_STAY_SHARE_INR = 10800; // ₹43,200 / 4

export const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Cash", "Bank transfer", "Other"]; // record sheet chips, UPI default

// Strings take pre-formatted amounts (lib/format.ts `inr`) so this module stays dependency-free.
export const MONEY_COPY = {
  scopeLabel: "Whose view",
  everyoneCaption: "spent by the crew",
  meCaption: (left: string, budget: string) => `${left} left of your ${budget}`,
  stay: "Stay",
  travel: "Travel",
  editBudget: "Edit budget",
  meFootnote: "Stay is your share of Villa Sol. Travel is your own flights, both ways. Your budget is only visible to you.",
  barAriaEveryone: (stay: string, travel: string) => `Stay ${stay}, travel ${travel}`,
  barAriaMe: (pct: number) => `${pct}% of your budget used`,
  settleTitle: "Settle up",
  settleMeta: "Everyone pays Rahul back",
  record: "Record",
  nudge: "Nudge",
  settled: (firstName: string) => `${firstName} is settled up`,
  youSettled: "You’re settled up", // DESIGN-ASSUMPTION: new string (PLAN §12.1 #27)
  txTitle: "Transactions",
  txMeta: "Visible to everyone",
  seeAll: (n: number) => `See all ${n} transactions`,
  seeEveryone: "See everyone’s transactions",
  you: "You",
  todayLabel: "Today", // DESIGN-ASSUMPTION: date label for recorded payments
  transactions: {
    title: "Transactions",
    sub: "Every booking and payback, visible to the crew",
    filterLabel: "Filter",
    filters: { all: (n: number) => `All ${n}`, booking: "Bookings", payback: "Paybacks", mine: "Mine" },
    empty: "Nothing here yet.",
    record: "Record a payment",
  },
  recordSheet: {
    title: "Record a payment",
    sub: "For money you sent outside Go, like UPI or cash. Nothing is charged here.",
    you: "You",
    payee: "Rahul",
    currency: "₹",
    amountLabel: "Amount",
    settles: "Settles you up with Rahul",
    left: (amount: string) => `${amount} still left to settle`,
    paidVia: "PAID VIA",
    paidViaLabel: "Paid via",
    noteLabel: "NOTE (OPTIONAL)",
    notePlaceholder: "e.g. villa + groceries",
    cta: (amount: string) => `Record ₹${amount}`,
    helper: "Rahul gets a ping to confirm he got it",
  },
} as const;
