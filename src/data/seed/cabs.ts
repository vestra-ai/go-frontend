import type { CabOption, TripType } from "@/data/types";

// Cab sheet: the static parts (car filters, copy). The cars themselves come from Go's cab `options` card.

export const CAB_FILTERS: { id: "all" | CabOption["kind"]; emoji?: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sedan", emoji: "🚗", label: "Sedan" },
  { id: "suv", emoji: "🚙", label: "SUV" },
];

export const CAB_COPY = {
  sub: (both: boolean) => (both ? "Book one way or both." : "Go books the ride you pick."),
  filterLabel: "Filter cars",
  info: "Go tracks your flight and tells the driver if you land late.",
  countLine: (n: number) => `${n} options`,
  cta: (trip: TripType, price: string) => `Book ${trip === "round" ? "both rides" : "one way"} · ${price}`,
} as const;
