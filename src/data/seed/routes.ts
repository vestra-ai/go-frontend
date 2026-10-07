import type { RouteFilter, RouteMode, RouteOption, TimeSlot, TripType } from "@/data/types";

// F2/F3 route sheet (F-travel.md §1.6). Values copied from the design's DCLogic `ALL` table;
// flight order is the rendered order (f1 f2 f3 f6 f7 f4 f5 f8). `h` = departure hour for slot filtering.
export const ROUTE_OPTIONS: Record<RouteMode, RouteOption[]> = {
  flight: [
    { id: "f1", mode: "flight", kind: "mix", tag: "Best timing · mixed airlines", one: 3960, round: 7840, roundOnly: true,
      legs: [
        { code: "BLR → GOX", day: "Fri 6", time: "8:40 pm → 9:55 pm", meta: "IndiGo · nonstop · 1h 15m", h: 20, carrier: "indigo" },
        { code: "GOX → BLR", day: "Mon 9", time: "5:30 pm → 6:40 pm", meta: "Air India · nonstop · 1h 10m", h: 17, carrier: "airindia" },
      ] },
    { id: "f2", mode: "flight", kind: "nonstop", tag: "Same airline", one: 3960, round: 8060,
      legs: [
        { code: "BLR → GOX", day: "Fri 6", time: "8:40 pm → 9:55 pm", meta: "IndiGo · nonstop · 1h 15m", h: 20, carrier: "indigo" },
        { code: "GOX → BLR", day: "Mon 9", time: "4:10 pm → 5:25 pm", meta: "IndiGo · nonstop · 1h 15m", h: 16, carrier: "indigo" },
      ] },
    { id: "f3", mode: "flight", kind: "nonstop", tag: "Same airline", one: 4180, round: 8450,
      legs: [
        { code: "BLR → GOX", day: "Fri 6", time: "9:20 pm → 10:45 pm", meta: "Air India · nonstop · 1h 25m", h: 21, carrier: "airindia" },
        { code: "GOX → BLR", day: "Mon 9", time: "5:30 pm → 6:40 pm", meta: "Air India · nonstop · 1h 10m", h: 17, carrier: "airindia" },
      ] },
    { id: "f6", mode: "flight", kind: "nonstop", tag: "Morning out · same airline", one: 3450, round: 6900,
      legs: [
        { code: "BLR → GOX", day: "Fri 6", time: "6:05 am → 7:20 am", meta: "IndiGo · nonstop · 1h 15m", h: 6, carrier: "indigo" },
        { code: "GOX → BLR", day: "Mon 9", time: "1:05 pm → 2:20 pm", meta: "IndiGo · nonstop · 1h 15m", h: 13, carrier: "indigo" },
      ] },
    { id: "f7", mode: "flight", kind: "nonstop", tag: "Same airline", one: 3700, round: 7500,
      legs: [
        { code: "BLR → GOX", day: "Fri 6", time: "12:30 pm → 1:45 pm", meta: "Air India · nonstop · 1h 15m", h: 12, carrier: "airindia" },
        { code: "GOX → BLR", day: "Mon 9", time: "9:30 pm → 10:45 pm", meta: "Air India · nonstop · 1h 15m", h: 21, carrier: "airindia" },
      ] },
    { id: "f4", mode: "flight", kind: "stop", tag: "Cheaper · 1 stop going", one: 2880, round: 6840,
      legs: [
        { code: "BLR → GOX", day: "Fri 6", time: "6:50 pm → 11:35 pm", meta: "IndiGo · 1 stop · 4h 45m", stop: "Change in Hyderabad · 1h 40m wait", h: 18, carrier: "indigo" },
        { code: "GOX → BLR", day: "Mon 9", time: "4:10 pm → 5:25 pm", meta: "IndiGo · nonstop · 1h 15m", h: 16, carrier: "indigo" },
      ] },
    { id: "f5", mode: "flight", kind: "stop", tag: "1 stop both ways", one: 3300, round: 7200,
      legs: [
        { code: "BLR → GOX", day: "Fri 6", time: "7:15 pm → 11:50 pm", meta: "Air India · 1 stop · 4h 35m", stop: "Change in Mumbai · 1h 50m wait", h: 19, carrier: "airindia" },
        { code: "GOX → BLR", day: "Mon 9", time: "2:00 pm → 6:55 pm", meta: "Air India · 1 stop · 4h 55m", stop: "Change in Mumbai · 2h 10m wait", h: 14, carrier: "airindia" },
      ] },
    { id: "f8", mode: "flight", kind: "stop", tag: "Cheapest · overnight stop", one: 2600, round: 6100,
      legs: [
        { code: "BLR → GOX", day: "Fri 6", time: "2:10 am → 7:40 am", meta: "IndiGo · 1 stop · 5h 30m", stop: "Change in Hyderabad · 2h wait", h: 2, carrier: "indigo" },
        { code: "GOX → BLR", day: "Mon 9", time: "10:10 pm → 11:25 pm", meta: "IndiGo · nonstop · 1h 15m", h: 22, carrier: "indigo" },
      ] },
  ],
  train: [
    { id: "t1", mode: "train", kind: "3A", tag: "AC 3-tier · overnight", one: 1450, round: 2900,
      legs: [
        { code: "BLR → GOA", day: "Fri 6", time: "8:00 pm → 10:05 am +1", meta: "Overnight express · 14h · Madgaon", h: 20 },
        { code: "GOA → BLR", day: "Mon 9", time: "4:15 pm → 6:40 am +1", meta: "Overnight express · 14h 25m · Bengaluru", h: 16 },
      ] },
    { id: "t2", mode: "train", kind: "2A", tag: "AC 2-tier · overnight", one: 2080, round: 4160,
      legs: [
        { code: "BLR → GOA", day: "Fri 6", time: "8:00 pm → 10:05 am +1", meta: "Overnight express · 14h · Madgaon", h: 20 },
        { code: "GOA → BLR", day: "Mon 9", time: "4:15 pm → 6:40 am +1", meta: "Overnight express · 14h 25m · Bengaluru", h: 16 },
      ] },
    { id: "t3", mode: "train", kind: "SL", tag: "Sleeper · overnight", one: 560, round: 1120,
      legs: [
        { code: "BLR → GOA", day: "Fri 6", time: "8:00 pm → 10:05 am +1", meta: "Overnight express · 14h · Madgaon", h: 20 },
        { code: "GOA → BLR", day: "Mon 9", time: "4:15 pm → 6:40 am +1", meta: "Overnight express · 14h 25m · Bengaluru", h: 16 },
      ] },
    { id: "t4", mode: "train", kind: "3A", tag: "AC 3-tier · daytime", one: 1390, round: 2780,
      legs: [
        { code: "BLR → GOA", day: "Fri 6", time: "6:30 am → 8:50 pm", meta: "Day train · 14h 20m · Madgaon", h: 6 },
        { code: "GOA → BLR", day: "Mon 9", time: "7:20 am → 9:45 pm", meta: "Day train · 14h 25m · Bengaluru", h: 7 },
      ] },
  ],
  bus: [
    { id: "b1", mode: "bus", kind: "sleeper", tag: "AC sleeper · Mapusa", one: 1350, round: 2700,
      legs: [
        { code: "BLR → GOA", day: "Fri 6", time: "9:00 pm → 9:30 am +1", meta: "12h 30m · drops at Mapusa", h: 21 },
        { code: "GOA → BLR", day: "Mon 9", time: "8:30 pm → 8:45 am +1", meta: "12h 15m · Mapusa to Bengaluru", h: 20 },
      ] },
    { id: "b2", mode: "bus", kind: "sleeper", tag: "AC sleeper · Panjim", one: 1180, round: 2360,
      legs: [
        { code: "BLR → GOA", day: "Fri 6", time: "10:30 pm → 10:30 am +1", meta: "12h · drops at Panjim", h: 22 },
        { code: "GOA → BLR", day: "Mon 9", time: "9:00 pm → 9:15 am +1", meta: "12h 15m · Panjim to Bengaluru", h: 21 },
      ] },
    { id: "b3", mode: "bus", kind: "seater", tag: "AC seater · Panjim", one: 950, round: 1900,
      legs: [
        { code: "BLR → GOA", day: "Fri 6", time: "1:00 pm → 1:30 am +1", meta: "12h 30m · drops at Panjim", h: 13 },
        { code: "GOA → BLR", day: "Mon 9", time: "12:30 pm → 12:45 am +1", meta: "12h 15m · Panjim to Bengaluru", h: 12 },
      ] },
    { id: "b4", mode: "bus", kind: "sleeper", tag: "Non-AC sleeper · Mapusa", one: 850, round: 1700,
      legs: [
        { code: "BLR → GOA", day: "Fri 6", time: "7:30 pm → 8:00 am +1", meta: "12h 30m · drops at Mapusa", h: 19 },
        { code: "GOA → BLR", day: "Mon 9", time: "6:30 pm → 7:00 am +1", meta: "12h 30m · Mapusa to Bengaluru", h: 18 },
      ] },
  ],};

export const ALL_ROUTES: RouteOption[] = [...ROUTE_OPTIONS.flight, ...ROUTE_OPTIONS.train, ...ROUTE_OPTIONS.bus];

// `mix` is hidden for one-way trips (filtersFor in lib/routes.ts).
export const ROUTE_FILTERS: Record<RouteMode, RouteFilter[]> = {
  flight: [
    { id: "all", label: "All" },
    { id: "nonstop", label: "Nonstop" },
    { id: "stop", label: "With a stop" },
    { id: "mix", label: "Mix airlines" },
  ],
  train: [
    { id: "all", label: "All" },
    { id: "3A", label: "AC 3-tier" },
    { id: "2A", label: "AC 2-tier" },
    { id: "SL", label: "Sleeper" },
  ],
  bus: [
    { id: "all", label: "All" },
    { id: "sleeper", label: "Sleeper" },
    { id: "seater", label: "Seater" },
  ],
};

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

export const LEG_CODES: Record<RouteMode, [string, string]> = {
  flight: ["BLR → GOX", "GOX → BLR"],
  train: ["BLR → GOA", "GOA → BLR"],
  bus: ["BLR → GOA", "GOA → BLR"],
};

export const ROUTE_COPY = {
  title: { round: "BLR ⇄ GOA", oneway: "BLR → GOA" },
  sub: { round: "Fri 6 Nov → Mon 9 Nov · just you", oneway: "Fri 6 Nov · one way · just you" },
  close: "Close",
  tripTypeLabel: "Trip type",
  modeLabel: "How you’re travelling",
  filterLabel: "Filter options",
  onwardEyebrow: "ONWARD · FRI 6 NOV",
  returnEyebrow: "RETURN · MON 9 NOV",
  anyTime: "Any time",
  slots: (n: number) => `${n} time slots`,
  timeChip: "🕘 Time",
  timeChipCount: (n: number) => `🕘 Time · ${n}`,
  countLine: (n: number) => `${n}${n === 1 ? " option" : " options"}${n > 2 ? " · scroll for more" : ""}`,
  cta: (trip: TripType, price: string) => `Book ${trip === "round" ? "round trip" : "one way"} · ${price}`,
  privacy: "Only you see these. Go shares just your arrival time with the group.",
  emptyTitle: "Nothing matches these filters",
  clearFilters: "Clear filters",
  noMatch: "No options match",
  time: {
    title: "Preferred times",
    sub: "Pick one or more. Go shows trips leaving in them.",
    onwardEyebrow: (code: string) => `ONWARD · ${code} · FRI 6 NOV`,
    returnEyebrow: (code: string) => `RETURN · ${code} · MON 9 NOV`,
    clear: "Clear",
    apply: (n: number) => (n > 0 ? `Show ${n} ${n === 1 ? "option" : "options"}` : "No options in these slots"),
    none: "No options in these slots",
  },
} as const;

// Default selection and the IndiGo itinerary every booking/check-in shows (PLAN §12.1 #12).
export const DEFAULT_ROUTE_ID = "f1";
export const SEED_ROUTE_ID = "f2"; // ensureStage('route-confirm') books { optionId: 'f2', trip: 'round' }
