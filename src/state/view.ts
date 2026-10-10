import type { DateRange, Id, Person, PersonLite, Place, TripStage, TripSummary, TripView } from "@/api/contract";
import type { Trip, TripDates, User, UserTone } from "@/data/types";
import { assets } from "@/lib/assets";
import { daysBetween, formatDayRange, parseDay } from "@/lib/dates";
import { kFormat } from "@/lib/format";

// The adapter at the edge: contract objects in, the view models the components already draw out. Labels the design
// shows ("Fri 6 – Mon 9 Nov", "in 34 days", "₹21.8k") are computed here from the data, never stored. Money leaves
// the Server in minor units (paise); the components take whole rupees.

/** `amount_minor` → whole currency units (₹54,200 is 5420000). */
export const fromMinor = (minor: number): number => minor / 100;
export const toMinor = (amount: number): number => Math.round(amount * 100);

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const TONES: UserTone[] = ["amber", "info", "success", "go", "peach"];

/** A stable small number from an opaque id (ids are never parsed, only hashed for a colour or a picture). */
function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** The avatar's fallback colour is the client's, derived from the id: it is not data. */
export const toneFor = (personId: Id): UserTone => TONES[hash(personId) % TONES.length];

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export const firstNameOf = (name: string): string => name.trim().split(/\s+/)[0] || name;

export function toUser(person: Person | PersonLite, extra: { email?: string | null } = {}): User {
  const fromCity = "from_city" in person ? (person.from_city ?? "") : "";
  return {
    id: person.person_id,
    name: person.name,
    firstName: firstNameOf(person.name),
    initials: initialsOf(person.name),
    tone: toneFor(person.person_id),
    city: fromCity,
    cityCode: "",
    ...(extra.email ? { email: extra.email } : {}),
    ...(person.photo_url ? { avatar: person.photo_url } : {}),
  };
}

/** Someone the app holds no row for (they left the trip): a name-less stand-in, so a row never crashes. */
export function unknownUser(personId: Id): User {
  return { id: personId, name: "Former member", firstName: "Former member", initials: "?", tone: "info", city: "", cityCode: "" };
}

export function usersById(people: Array<Person | PersonLite>): Record<Id, User> {
  return Object.fromEntries(people.map((p) => [p.person_id, toUser(p)]));
}

/** Looks a person up, falling back to the stand-in. */
export const userOf = (users: Record<Id, User>, personId: Id): User => users[personId] ?? unknownUser(personId);

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "in 34 days" · "tomorrow" · "today" · "on now" · "ended". */
export function countdownTo(dates: DateRange, now: Date = new Date()): string {
  const toStart = daysBetween(now, parseDay(dates.start));
  if (toStart > 1) return `in ${toStart} days`;
  if (toStart === 1) return "tomorrow";
  if (toStart === 0) return "today";
  return daysBetween(now, parseDay(dates.end)) >= 0 ? "on now" : "ended";
}

export function toTripDates(dates: DateRange, now: Date = new Date()): TripDates {
  const start = parseDay(dates.start);
  const end = parseDay(dates.end);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const range = formatDayRange(start, end);
  const m1 = MONTHS[start.getMonth()];
  const m2 = MONTHS[end.getMonth()];
  return {
    label: range,
    short: sameMonth ? `${start.getDate()}–${end.getDate()} ${m1}` : `${start.getDate()} ${m1} – ${end.getDate()} ${m2}`,
    chip: sameMonth ? `${m1} ${start.getDate()}–${end.getDate()}` : `${m1} ${start.getDate()} – ${m2} ${end.getDate()}`,
    range,
    countdown: countdownTo(dates, now),
  };
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

type Illustration = keyof typeof assets.illustrations;
const ILLUSTRATIONS = Object.keys(assets.illustrations) as Illustration[];
const TINTS: Array<Pick<Trip, "tint" | "tintClass">> = [
  { tint: "amber", tintClass: "bg-amber-soft" },
  { tint: "info", tintClass: "bg-info-tint" },
];

/**
 * The trip's avatar is the client's (the Server sends one photo, `photo_url`): the illustration of a place we have a
 * drawing for, else a stable pick by trip id.
 */
export function illustrationFor(tripId: Id, placeName?: string | null): string {
  const name = (placeName ?? "").toLowerCase();
  const match = name ? ILLUSTRATIONS.find((key) => name.includes(key)) : undefined;
  return assets.illustrations[match ?? ILLUSTRATIONS[hash(tripId) % ILLUSTRATIONS.length]].src;
}

const LEADING_EMOJI = /^(\p{Extended_Pictographic}️?)/u;
const TRAILING_EMOJI = /(\p{Extended_Pictographic}️?)\s*$/u;

/** "Goa 🌴" → "🌴": the title's own emoji, for the share sheet's round tile. */
const titleEmoji = (title: string): string => TRAILING_EMOJI.exec(title)?.[1] ?? LEADING_EMOJI.exec(title)?.[1] ?? "🧳";

/** `https://go.example/invite/8fK2xQ` → `go.example/invite/8fK2xQ` (what the link field shows). */
export const displayUrl = (url: string): string => url.replace(/^https?:\/\//, "");

/** The destination's cover photo: `photo_url`, else the first of `photos` (§2 TripSummary). */
export const placePhoto = (place?: Place | null): string | undefined => place?.photo_url ?? place?.photos?.[0]?.url ?? undefined;

interface TripCore {
  trip_id: Id;
  title: string;
  stage: TripStage;
  destination?: Place | null;
  dates?: DateRange | null;
  photo?: string;
  memberIds: Id[];
  organizerId: Id;
  inviteUrl?: string;
  budgetPerPersonMinor?: number | null;
  fromCity?: string | null;
}

function buildTrip(c: TripCore, now: Date): Trip {
  const dates = c.dates ? toTripDates(c.dates, now) : undefined;
  const place = c.destination?.name;
  const photo = c.photo ? { src: c.photo, alt: place ?? c.title } : undefined;
  const coverSub = dates
    ? `${dates.range} · ${dates.countdown}`
    : place
      ? "Dates not decided yet"
      : "Where and when not decided yet";
  return {
    id: c.trip_id,
    name: c.title,
    ...(place ? { destination: place } : {}),
    emoji: titleEmoji(c.title),
    ...(dates ? { dates } : {}),
    ...(photo ? { cover: photo, hero: photo } : {}),
    illustration: illustrationFor(c.trip_id, place ?? c.title),
    ...TINTS[hash(c.trip_id) % TINTS.length],
    memberIds: c.memberIds,
    organizerId: c.organizerId,
    inviteCode: "",
    inviteUrl: c.inviteUrl ? displayUrl(c.inviteUrl) : "",
    ...(c.inviteUrl ? { inviteHref: c.inviteUrl } : {}),
    whatsappGroup: c.title,
    stage: c.stage,
    ...(c.budgetPerPersonMinor ? { budgetLabel: kFormat(fromMinor(c.budgetPerPersonMinor)) } : {}),
    ...(c.fromCity ? { fromCity: c.fromCity } : {}),
    homeCard: { coverTitle: place ? `📍 ${place}` : "New trip", coverSub },
  };
}

export function tripFromView(view: TripView, now: Date = new Date()): Trip {
  return buildTrip(
    {
      trip_id: view.trip_id,
      title: view.title,
      stage: view.stage,
      destination: view.destination,
      dates: view.dates,
      photo: placePhoto(view.destination),
      memberIds: view.people.map((p) => p.person_id),
      organizerId: view.organizer_person_id,
      inviteUrl: view.invite_url,
      budgetPerPersonMinor: view.budget?.per_person_minor,
      fromCity: view.me.person.from_city,
    },
    now,
  );
}

export function tripFromSummary(summary: TripSummary, now: Date = new Date()): Trip {
  return buildTrip(
    {
      trip_id: summary.trip_id,
      title: summary.title,
      stage: summary.stage,
      destination: summary.destination,
      dates: summary.dates,
      photo: summary.photo_url ?? placePhoto(summary.destination),
      memberIds: summary.people_preview.map((p) => p.person_id),
      // `people_preview` is organizer first (§2).
      organizerId: summary.people_preview[0]?.person_id ?? "",
      budgetPerPersonMinor: summary.budget_per_person_minor,
    },
    now,
  );
}
