const DAY_MS = 86_400_000;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** Parses "YYYY-MM-DD" as a local calendar day (no timezone drift). */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY_MS);
}

/** "Fri 6 Nov" */
export function formatDay(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "Fri 6 – Mon 9 Nov" (same month) or "Tue 30 Dec – Fri 2 Jan". */
export function formatDayRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const head = sameMonth ? `${WEEKDAYS[start.getDay()]} ${start.getDate()}` : formatDay(start);
  return `${head} – ${formatDay(end)}`;
}

/** "just now" · "2m ago" · "3h ago" · "5d ago", from an ISO time. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / 1000));
  if (!Number.isFinite(seconds) || seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

/**
 * The clock a time was written in. Contract times carry an offset (`2026-11-06T18:10:00+05:30`); a departure is read
 * in that local time, wherever the phone is. A time written in UTC (`Z`) has no local clock of its own, so it is
 * shown in the phone's.
 */
export function wallTime(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})$/.exec(iso);
  if (!m || m[7] === "Z" || /^[+-]00:?00$/.test(m[7])) return new Date(iso);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
}

/** "8:40 pm" · "11 am" */
export function formatClock(date: Date): string {
  const h = date.getHours();
  const min = date.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${min === 0 ? "" : `:${String(min).padStart(2, "0")}`} ${h < 12 ? "am" : "pm"}`;
}

/** "HH:MM" (an itinerary time of day) → "8:40 pm". Anything else is returned as it came. */
export function formatHHMM(time: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  return m ? formatClock(new Date(2000, 0, 1, Number(m[1]), Number(m[2]))) : time;
}

/** "Fri 6 Nov · 8:40 pm" */
export const formatDayClock = (date: Date): string => `${formatDay(date)} · ${formatClock(date)}`;

/** "FRI 6" */
export const formatDayStamp = (date: Date): string => `${WEEKDAYS[date.getDay()].toUpperCase()} ${date.getDate()}`;

/** "Fri 6" */
export const formatDayShort = (date: Date): string => `${WEEKDAYS[date.getDay()]} ${date.getDate()}`;

/** "12 Oct 2026" */
export const formatDate = (date: Date): string => `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

export const weekdayShort = (date: Date): string => WEEKDAYS[date.getDay()];
export const monthShort = (date: Date): string => MONTHS[date.getMonth()];
