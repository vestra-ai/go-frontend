import type { RouteFilter, RouteMode, TimeSlot, TripType } from "@/data/types";

// Route sheet: the static parts (how you travel, quick filters, time-of-day slots, copy). The options themselves come
// from Go's `options` cards (state/optionView.ts).

export const ROUTE_FILTERS: Record<RouteMode, RouteFilter[]> = {
  flight: [
    { id: "all", label: "All" },
    { id: "nonstop", label: "Nonstop" },
    { id: "cheapest", label: "Cheapest" },
  ],
  train: [
    { id: "all", label: "All" },
    { id: "cheapest", label: "Cheapest" },
  ],
  bus: [
    { id: "all", label: "All" },
    { id: "cheapest", label: "Cheapest" },
  ],
};

// Half-open hour ranges [from, to): an option is in a slot when its leg leaves inside it.
export const TIME_SLOTS: TimeSlot[] = [
  { id: "s0", emoji: "🌙", name: "Early morning", range: "12 am – 6 am", from: 0, to: 6 },
  { id: "s1", emoji: "🌅", name: "Morning", range: "6 am – 12 pm", from: 6, to: 12 },
  { id: "s2", emoji: "☀️", name: "Afternoon", range: "12 pm – 6 pm", from: 12, to: 18 },
  { id: "s3", emoji: "🌆", name: "Evening", range: "6 pm – 12 am", from: 18, to: 24 },
];

export const ROUTE_MODES: { id: RouteMode; emoji: string; label: string }[] = [
  { id: "flight", emoji: "✈️", label: "Flight" },
  { id: "train", emoji: "🚆", label: "Train" },
  { id: "bus", emoji: "🚌", label: "Bus" },
];

export const TRIP_TYPES: { id: TripType; label: string }[] = [
  { id: "oneway", label: "One way" },
  { id: "round", label: "Round trip" },
];

export const ROUTE_COPY = {
  /** "BLR ⇄ GOX" · "BLR → GOX", from the first option's onward leg. */
  title: (code: string, trip: TripType) => (trip === "round" ? code.replace("→", "⇄") : code),
  sub: (onward: string, back: string | null, trip: TripType) =>
    trip === "round" && back ? `${onward} → ${back} · just you` : `${onward} · one way · just you`,
  close: "Close",
  tripTypeLabel: "Trip type",
  modeLabel: "How you’re travelling",
  filterLabel: "Filter options",
  anyTime: "Any time",
  slots: (n: number) => `${n} time slots`,
  timeChip: "🕘 Time",
  timeChipCount: (n: number) => `🕘 Time · ${n}`,
  countLine: (n: number) => `${n}${n === 1 ? " option" : " options"}`,
  cta: (trip: TripType, price: string) => `Book ${trip === "round" ? "round trip" : "one way"} · ${price}`,
  privacy: "Go books what you pick and shares your arrival time with the group.",
  booked: "Sent to Go. Watch the trip chat.",
  failed: "Couldn’t reach Go. Try again.",
  emptyTitle: "Nothing matches these filters",
  clearFilters: "Clear filters",
  noMatch: "No options match",
  time: {
    title: "Preferred times",
    sub: "Pick one or more. Go shows trips leaving in them.",
    onwardEyebrow: (code: string, day: string) => ["ONWARD", code, day.toUpperCase()].filter(Boolean).join(" · "),
    returnEyebrow: (code: string, day: string) => ["RETURN", code, day.toUpperCase()].filter(Boolean).join(" · "),
    clear: "Clear",
    apply: (n: number) => (n > 0 ? `Show ${n} ${n === 1 ? "option" : "options"}` : "No options in these slots"),
    none: "No options in these slots",
  },
} as const;
