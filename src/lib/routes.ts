// Route & cab sheet derivations (F-travel.md §1.3 "lib/routes.ts"): exactly the design's DCLogic.
// Pure helpers: no React, no store. Copy comes from the seeds.
import { CAB_COPY, CAB_OPTIONS } from "@/data/seed/cabs";
import { LEG_CODES, ROUTE_COPY, ROUTE_FILTERS, ROUTE_OPTIONS, TIME_SLOTS } from "@/data/seed/routes";
import type { CabOption, RouteFilter, RouteMode, RouteOption, SlotId, TripType } from "@/data/types";
import { inr } from "@/lib/format";

export interface RouteQuery {
  trip: TripType;
  mode: RouteMode;
  filt: string;
  on: SlotId[];
  ret: SlotId[];
}

/** Leg codes per mode: flight `["BLR → GOX","GOX → BLR"]`, train/bus `["BLR → GOA","GOA → BLR"]`. */
export function legCodes(mode: RouteMode): [string, string] {
  return LEG_CODES[mode];
}

/** The mode's filter chips. */
export function filtersFor(mode: RouteMode): RouteFilter[] {
  return ROUTE_FILTERS[mode];
}

/** No slots = any time; otherwise the hour falls in a selected half-open slot [from, to). */
function inSlots(h: number, list: SlotId[]): boolean {
  return list.length === 0 || TIME_SLOTS.some((slot) => list.includes(slot.id) && slot.from <= h && h < slot.to);
}

/** How many options "Cheapest" keeps. */
const CHEAPEST_COUNT = 3;

function okFilt(o: RouteOption, mode: RouteMode, filt: string): boolean {
  // A filter this mode doesn't offer (e.g. one left in the persisted store) behaves like "All".
  if (filt === "all" || !ROUTE_FILTERS[mode].some((f) => f.id === filt)) return true;
  if (mode !== "flight") return o.kind === filt;
  if (filt === "nonstop") return o.kind !== "stop"; // the mixed-airline f1 counts as nonstop (as designed)
  return true; // cheapest: narrowed and re-ordered by price in visibleRoutes
}

export function matchRoute(o: RouteOption, q: RouteQuery): boolean {
  return (
    (q.trip === "round" || !o.roundOnly) &&
    okFilt(o, q.mode, q.filt) &&
    inSlots(o.legs[0].h, q.on) &&
    (q.trip === "oneway" || inSlots(o.legs[1].h, q.ret))
  );
}

/**
 * Matching options in seed order (flight: f1 f2 f3 f6 f7 f4 f5 f8).
 * "Cheapest" instead keeps the lowest few fares among the matches (after the time slots), cheapest first.
 */
export function visibleRoutes(q: RouteQuery): RouteOption[] {
  const matches = ROUTE_OPTIONS[q.mode].filter((o) => matchRoute(o, q));
  if (q.mode !== "flight" || q.filt !== "cheapest") return matches;
  return matches.sort((a, b) => priceOf(a, q.trip) - priceOf(b, q.trip)).slice(0, CHEAPEST_COUNT);
}

/** The picked option if visible, else the first visible one, else null. Silent: `pick` itself is unchanged. */
export function chosen(shown: RouteOption[], pick: string | null): RouteOption | null {
  return shown.find((o) => o.id === pick) ?? shown[0] ?? null;
}

export function priceOf(o: RouteOption, trip: TripType): number {
  return trip === "round" ? o.round : o.one;
}

/** "Any time" · one slot's range ("6 pm – 12 am") · "n time slots". */
export function slotText(list: SlotId[]): string {
  if (list.length === 0) return ROUTE_COPY.anyTime;
  if (list.length === 1) return TIME_SLOTS.find((slot) => slot.id === list[0])?.range ?? ROUTE_COPY.anyTime;
  return ROUTE_COPY.slots(list.length);
}

/** "1 option" · "2 options" · "8 options · scroll for more" (always rendered, so 0 gives "0 options"). */
export function countLine(n: number): string {
  return ROUTE_COPY.countLine(n);
}

export function nTime(q: Pick<RouteQuery, "trip" | "on" | "ret">): number {
  return q.on.length + (q.trip === "round" ? q.ret.length : 0);
}

/** "🕘 Time" · "🕘 Time · N". */
export function timeChipLabel(n: number): string {
  return n > 0 ? ROUTE_COPY.timeChipCount(n) : ROUTE_COPY.timeChip;
}

/** "Book round trip · ₹7,840" · "Book one way · ₹3,960" · "No options match". */
export function ctaLabel(c: RouteOption | null, trip: TripType): string {
  return c ? ROUTE_COPY.cta(trip, inr(priceOf(c, trip))) : ROUTE_COPY.noMatch;
}

/** Options the time-sheet drafts would show, with the current trip, mode and filter. */
export function previewCount(q: RouteQuery, draft: { on: SlotId[]; ret: SlotId[] }): number {
  return visibleRoutes({ ...q, on: draft.on, ret: draft.ret }).length;
}

/** "Show N options" · "Show 1 option" · "No options in these slots". */
export function applyLabel(n: number): string {
  return ROUTE_COPY.time.apply(n);
}

export function visibleCabs(filt: "all" | CabOption["kind"]): CabOption[] {
  return filt === "all" ? CAB_OPTIONS : CAB_OPTIONS.filter((c) => c.kind === filt);
}

/** The picked cab if visible, else the first visible one. Silent: `pick` itself is unchanged. */
export function chosenCab(shown: CabOption[], pick: string): CabOption {
  return shown.find((c) => c.id === pick) ?? shown[0];
}

export function cabCountLine(n: number): string {
  return CAB_COPY.countLine(n);
}

/** "Book both rides · ₹3,200" · "Book one way · ₹1,600". */
export function cabCtaLabel(c: CabOption, trip: TripType): string {
  return CAB_COPY.cta(trip, inr(trip === "round" ? c.round : c.one));
}
