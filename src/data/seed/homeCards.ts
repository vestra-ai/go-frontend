import { tripHome } from "@/data/seed/copy";
import type { TripHomeCard, TripId } from "@/data/types";

// App-home status-line templates (the cards' seed copy). App home fills them from live store state
// (selectTripCardStatus): a planned trip counts what is pending on you (the trip home's list), Bali asks for the visa
// until it is sent, any other trip is still being planned. A6 renders "2 things pending on you" for Goa.
export const HOME_CARD_STATUS = {
  pending: (n: number) => `${n} ${n === 1 ? "thing" : "things"} pending on you`,
  allSet: tripHome.allSet.title,
  collecting: "Go is collecting everyone’s answers",
  visa: "Visa details pending on you",
} as const;

// App-home trip cards (A-onboarding.md §1.3). One label set per trip (PLAN §12.1 #2).
export const HOME_CARDS: Record<TripId, TripHomeCard> = {
  goa: {
    coverTitle: "📍 Goa",
    coverSub: "Fri 6 – Mon 9 Nov · in 34 days",
  },
  college: {
    coverTitle: "New trip",
    coverSub: "Where and when not decided yet",
  },
  // DESIGN-ASSUMPTION: no artboard shows an accepted Bali trip card; copy follows the Goa card's pattern.
  bali: {
    coverTitle: "📍 Bali",
    coverSub: "Fri 25 – Mon 28 Dec · in 83 days",
  },
};
