import type { PaymentMethod } from "@/data/types";

// Expenses, transactions and the record-a-payment sheet: static parts and copy. The money itself is the Server's
// (state/moneyView.ts).

// The group budget slider: ₹5k to ₹60k per person in ₹1k steps; `start` is where it opens before any budget is set.
export const BUDGET_RANGE = { min: 5000, max: 60000, step: 1000, start: 20000 } as const;

export const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Cash", "Bank transfer", "Other"]; // record sheet chips, UPI default

// Strings take pre-formatted amounts (lib/format.ts `inr`) so this module stays dependency-free.
export const MONEY_COPY = {
  scopeLabel: "Whose view",
  everyoneCaption: "spent by the crew",
  meCaption: (left: string, budget: string) => `${left} left of your ${budget}`,
  meCaptionNoBudget: "your spend so far",
  stay: "Stay",
  travel: "Travel",
  editBudget: "Edit budget",
  other: "Other",
  meFootnote: "Each amount is your share of what the group split. The budget is the group’s, per person.",
  barAriaEveryone: (stay: string, travel: string) => `Stay ${stay}, travel ${travel}`,
  barAriaMe: (pct: number) => `${pct}% of your budget used`,
  settleTitle: "Settle up",
  settleMetaOne: (firstName: string) => `Everyone pays ${firstName} back`,
  settleMetaMany: (n: number) => `${n} payments to square up`,
  allSquare: { emoji: "🤝", title: "All square", sub: "Shared bills get split here as they come in" },
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
    more: "Show earlier",
    record: "Record a payment",
  },
  recordSheet: {
    title: "Record a payment",
    sub: "For money you sent outside Go, like UPI or cash. Nothing is charged here.",
    you: "You",
    currency: "₹",
    amountLabel: "Amount",
    settles: (firstName: string) => `Settles you up with ${firstName}`,
    left: (amount: string) => `${amount} still left to settle`,
    paidVia: "PAID VIA",
    paidViaLabel: "Paid via",
    noteLabel: "NOTE (OPTIONAL)",
    notePlaceholder: "e.g. villa + groceries",
    cta: (amount: string) => `Record ₹${amount}`,
    helper: (firstName: string) => `Counts right away. ${firstName} sees it in the trip chat.`,
    recorded: (firstName: string) => `Recorded · ${firstName} sees it in the trip chat`,
    failed: "Couldn’t record the payment. Try again.",
    nobody: "You don’t owe anyone right now.",
  },
} as const;
