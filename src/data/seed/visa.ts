import type { VisaStatus } from "@/data/types";

// Checklist card labels (a visa, a document: who has theirs ready), and the copy of the in-app visa form. That form is
// not mounted: passport and ID data never pass through the app (CONTRACT-APP §1.7); the form is Go's vault page.
export const baliVisa = {
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
