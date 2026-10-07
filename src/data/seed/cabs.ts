import type { CabOption, TripType } from "@/data/types";

// F5 cab sheet (F-travel.md §1.3 / Part 2). Default pick s1; CTA shows the total only (PLAN §12.1 #13).
export const CAB_OPTIONS: CabOption[] = [
  { id: "s1", kind: "sedan", emoji: "🚗", title: "Sedan · app cab", meta: "Up to 4 · driver waits 45 min after landing", one: 1600, round: 3200 },
  { id: "s2", kind: "sedan", emoji: "🚕", title: "Sedan · airport taxi counter", meta: "Prepaid at arrivals · no waiting fee", one: 1800, round: 3600 },
  { id: "s3", kind: "sedan", emoji: "🏡", title: "Villa pickup", meta: "Villa Sol’s own driver · meets you at the gate", one: 2000, round: 4000 },
  { id: "u1", kind: "suv", emoji: "🚙", title: "SUV · app cab", meta: "Up to 6 · room for big bags", one: 2100, round: 4200 },
  { id: "u2", kind: "suv", emoji: "🚕", title: "SUV · airport taxi counter", meta: "Prepaid at arrivals", one: 2400, round: 4800 },
];

export const CAB_FILTERS: { id: "all" | CabOption["kind"]; emoji?: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sedan", emoji: "🚗", label: "Sedan" },
  { id: "suv", emoji: "🚙", label: "SUV" },
];

export const DEFAULT_CAB_ID = "s1";

export const CAB_COPY = {
  title: "Cab to Villa Sol",
  sub: "Fri 6 Nov pickup, Mon 9 Nov drop. Book one way or both.",
  pickup: { eyebrow: "PICKUP · FRI 6 NOV", value: "Mopa Airport → Villa Sol", meta: "when you land" },
  drop: { eyebrow: "DROP · MON 9 NOV", value: "Villa Sol → Mopa Airport", meta: "1:30 pm" },
  filterLabel: "Filter cars",
  info: "Go tracks your flight and tells the driver if you land late.",
  countLine: (n: number) => `${n} options`,
  cta: (trip: TripType, price: string) => `Book ${trip === "round" ? "both rides" : "one way"} · ${price}`,
} as const;
