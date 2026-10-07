import type { TripId } from "@/data/types";
import type { ChatTripData, GoData, HomeTripData } from "@/store/state";

// persist config (PLAN §9.4): key `go-proto-v1`, version 1. `partialize` drops transient UI, drafts and passport
// fields; `merge` deep-merges what was saved over a fresh initial state so dropped fields come back at defaults.

export const STORE_KEY = "go-proto-v1";
export const STORE_VERSION = 1;

const mapTrips = <T, U>(record: Record<TripId, T>, fn: (value: T) => U): Record<TripId, U> =>
  Object.fromEntries(Object.entries(record).map(([id, value]) => [id, fn(value as T)])) as Record<TripId, U>;

function persistedChat(c: ChatTripData) {
  const { trip, mode, filt, pick, on, ret, booked } = c.route; // route.draft (TimeSheet) is transient
  return {
    ...c,
    route: { trip, mode, filt, pick, on, ret, booked },
    visa: { uploads: c.visa.uploads, sent: c.visa.sent }, // visa.fields never reach localStorage (G-bali.md §1.4)
  };
}

// openRow, askForm (chips + drafts), listen and recording are transient (J-triphome-calls.md §1.3).
function persistedHome({ calls, lastCall, resolved, checkin, daysToGo }: HomeTripData) {
  return { calls, lastCall, resolved, checkin, daysToGo };
}

export function partialize(s: GoData) {
  return {
    session: s.session,
    // members/invites are static seeds; joinRun is transient (a reload drops pending joins, B-crew.md §1.3).
    trips: { trips: s.trips.trips, inbox: s.trips.inbox, pastTrips: s.trips.pastTrips, bookings: s.trips.bookings },
    chat: mapTrips(s.chat, persistedChat),
    home: mapTrips(s.home, persistedHome),
    money: s.money,
  };
}

export type PersistedGo = ReturnType<typeof partialize>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function deepMerge(base: unknown, over: unknown): unknown {
  if (over === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(over)) return over;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(over)) out[key] = deepMerge(base[key], value);
  return out;
}

export function merge<T extends GoData>(persisted: unknown, current: T): T {
  return isPlainObject(persisted) ? (deepMerge(current, persisted) as T) : current;
}
