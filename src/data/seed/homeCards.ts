import type { TripHomeCard, TripId } from "@/data/types";

// App-home trip cards (A-onboarding.md §1.3). One label set per trip, shown at every stage (PLAN §12.1 #2).
export const HOME_CARDS: Record<TripId, TripHomeCard> = {
  goa: {
    coverTitle: "📍 Goa",
    coverSub: "Fri 6 – Mon 9 Nov · in 34 days",
    status: "2 things pending on you",
    statusTone: "go",
  },
  college: {
    coverTitle: "New trip",
    coverSub: "Where and when not decided yet",
    status: "Go is collecting everyone’s answers",
    statusTone: "muted",
  },
  // DESIGN-ASSUMPTION: no artboard shows an accepted Bali trip card; copy follows the Goa card's pattern.
  bali: {
    coverTitle: "📍 Bali",
    coverSub: "Fri 25 – Mon 28 Dec · in 83 days",
    status: "Visa details pending on you",
    statusTone: "go",
  },
};
