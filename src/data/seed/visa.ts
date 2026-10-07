import type { VisaMember, VisaStatus } from "@/data/types";

// G2/G3 (G-bali.md §1.2). Roster kept as designed (You/Rahul/Priya/Arjun), see G-bali.md §1.7 #11.
export const baliVisa = {
  tripId: "bali",
  emoji: "🛂",
  title: "Indonesia e-VOA",
  due: "due 10 Dec",
  members: [
    { userId: "aarav", sub: "Passport, photo", status: "not-yet" },
    { userId: "rahul", sub: "Submitted yesterday", status: "sent" },
    { userId: "priya", sub: "Started, not sent", status: "started" },
    { userId: "arjun", sub: "Submitted today", status: "sent" },
  ] satisfies readonly VisaMember[],
  youSentSub: "Submitted today", // DESIGN-ASSUMPTION: You row sub after sendVisa()
  you: "You",
  statusLabel: { "not-yet": "Not yet", sent: "Sent ✓", started: "Started" } satisfies Record<VisaStatus, string>,
  sheet: {
    title: "Your visa details",
    sub: "Go applies for your Indonesia e-VOA. Takes about 3 minutes.",
    uploads: [
      { key: "passport", title: "Passport page", sub: "Photo or PDF", toast: "Passport page added ✓" },
      { key: "photo", title: "Your photo", sub: "Plain background", toast: "Photo added ✓" },
    ],
    fields: [
      { key: "name", caption: "FULL NAME, AS ON PASSPORT", placeholder: "e.g. Aarav Shah" },
      { key: "passport", caption: "PASSPORT NUMBER", placeholder: "e.g. Z1234567" },
      { key: "dob", caption: "DATE OF BIRTH", placeholder: "DD / MM / YYYY" },
      { key: "expiry", caption: "PASSPORT EXPIRY", placeholder: "DD / MM / YYYY" },
    ],
    hint: "Passport must be valid at least 6 months after you land.",
    returnFlight: { emoji: "✈️", title: "Return flight", sub: "Added from your bookings · Mon 28 Dec" },
    cta: "Send to Go",
    trust: "Only you and Go see this. The group sees “sent”.",
  },
} as const;
