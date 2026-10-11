import type { Booking as ApiBooking, BookingDocument, Id, Journey } from "@/api/contract";
import { PRIVATE_COPY } from "@/data/seed/bookings";
import type { Booking, BookingFileRef, DetailRow, PrivateDetails, TicketDoc, User } from "@/data/types";
import { daysBetween, formatClock, formatDate, formatDay, formatDayClock, formatDayStamp, monthShort, wallTime, weekdayShort } from "@/lib/dates";
import { inr } from "@/lib/format";
import { fromMinor, placePhoto, userOf } from "@/state/view";

// Contract `Booking` → the ticket-stub card, the detail rows and the ticket viewer's fields (CONTRACT-APP §4.10).

const KIND_EMOJI: Record<ApiBooking["kind"], string> = {
  stay: "🏡",
  flight: "✈️",
  train: "🚆",
  bus: "🚌",
  cab: "🚕",
  table: "🍽️",
  activity: "🎟️",
  other: "🧾",
};
const KIND_LABEL: Record<ApiBooking["kind"], string> = {
  stay: "STAY",
  flight: "FLIGHT",
  train: "TRAIN",
  bus: "BUS",
  cab: "CAB",
  table: "TABLE",
  activity: "ACTIVITY",
  other: "BOOKING",
};

export const bookingEmoji = (kind: ApiBooking["kind"]): string => KIND_EMOJI[kind] ?? KIND_EMOJI.other;

/** Render `image_url` / `logo_url` only when they are http(s) links (§4.10). */
export const httpUrl = (url?: string | null): string | undefined => (url && /^https?:\/\//i.test(url) ? url : undefined);

const stop = (s: Journey["origin"]) => s.code ?? s.name;
export const routeLine = (j: Journey): string => `${stop(j.origin)} → ${stop(j.destination)}`;

export const isTravel = (b: ApiBooking): boolean => b.kind === "flight" || b.kind === "train" || b.kind === "bus" || b.kind === "cab";

/** Whether a booking covers me: only then does it carry my passengers and documents (§1.7). */
export const coversMe = (b: ApiBooking, meId: Id): boolean => b.for_person_ids.includes(meId);

function eyebrow(b: ApiBooking): string {
  const start = b.journey ? wallTime(b.journey.depart_at) : b.starts_at ? wallTime(b.starts_at) : null;
  const end = b.ends_at ? wallTime(b.ends_at) : null;
  const label = KIND_LABEL[b.kind] ?? KIND_LABEL.other;
  let text = label;
  if (b.kind === "stay" && start && end) text = `${formatDayStamp(start)} → ${formatDayStamp(end)}`;
  else if (start) text = `${formatDayStamp(start)} · ${label}`;
  return b.status === "cancelled" ? `CANCELLED · ${text}` : text;
}

function subLine(b: ApiBooking): string {
  if (b.journey) {
    const parts = [routeLine(b.journey), b.journey.number ?? b.journey.carrier_name ?? b.vendor];
    if (b.return_journey) parts.push("return");
    return parts.filter(Boolean).join(" · ");
  }
  if (b.kind === "stay" && b.starts_at && b.ends_at) {
    const nights = daysBetween(wallTime(b.starts_at), wallTime(b.ends_at));
    const where = b.place?.address ?? b.place?.name ?? b.vendor;
    return nights > 0 ? `${where} · ${nights} ${nights === 1 ? "night" : "nights"}` : where;
  }
  return b.vendor;
}

/** The booking's own lines when Go sent them, else what the booking itself says. */
export function bookingDetails(b: ApiBooking, users: Record<Id, User>, meId: Id): DetailRow[] {
  if (b.details && b.details.length > 0) return b.details.map((d) => ({ label: d.label, value: d.value }));
  const rows: DetailRow[] = [];
  const payer = b.payer_person_id === meId ? "you" : userOf(users, b.payer_person_id).firstName;
  if (b.journey) {
    const line = (j: Journey) => [formatDay(wallTime(j.depart_at)), j.number, formatClock(wallTime(j.depart_at))].filter(Boolean).join(" · ");
    rows.push({ label: "Onward", value: line(b.journey) });
    if (b.return_journey) rows.push({ label: "Return", value: line(b.return_journey) });
  } else {
    if (b.starts_at) rows.push({ label: b.kind === "stay" ? "Check in" : "Starts", value: formatDayClock(wallTime(b.starts_at)) });
    if (b.ends_at) rows.push({ label: b.kind === "stay" ? "Check out" : "Ends", value: formatDayClock(wallTime(b.ends_at)) });
    if (b.place?.address) rows.push({ label: "Address", value: b.place.address });
  }
  rows.push({ label: b.kind === "stay" ? "Guests" : "For", value: String(b.for_person_ids.length) });
  if (b.amount_minor > 0) rows.push({ label: "Paid", value: `${inr(fromMinor(b.amount_minor))} · by ${payer}` });
  if (b.refundable_until) rows.push({ label: "Free cancellation until", value: formatDayClock(wallTime(b.refundable_until)) });
  rows.push({ label: b.journey ? "PNR" : "Booking ref", value: b.ref });
  return rows;
}

export const ticketHref = (tripId: Id, bookingId: Id) => `/trips/${tripId}/bookings/${encodeURIComponent(bookingId)}/ticket`;

/**
 * What a booking's ticket shows at its left end: its photo, else the carrier's wordmark, else the kind's emoji on a
 * tint of the colour of its rule (green for a stay, blue for everything else).
 */
export function bookingMedia(b: ApiBooking): Booking["media"] {
  const photo = httpUrl(b.image_url) ?? httpUrl(placePhoto(b.place));
  const logo = httpUrl(b.journey?.logo_url);
  return photo
    ? { kind: "photo", src: photo, bg: "none" }
    : logo
      ? { kind: "logo", src: logo, alt: b.journey?.carrier_name ?? b.vendor, bg: "none" }
      : { kind: "emoji", emoji: bookingEmoji(b.kind), bg: b.kind === "stay" ? "success-tint" : "stay-tint" };
}

/** The rule beside a ticket's graphic: green for a stay, blue for everything else. */
export const bookingAccent = (b: ApiBooking): Booking["accent"] => (b.kind === "stay" ? "success" : "info");

export function toBookingCard(b: ApiBooking, tripId: Id, users: Record<Id, User>, meId: Id): Booking {
  const documents = b.documents?.length ?? 0;
  return {
    id: b.booking_id,
    type: b.kind === "stay" ? "stay" : "flight",
    eyebrow: eyebrow(b),
    title: b.title,
    sub: subLine(b),
    memberIds: b.for_person_ids,
    media: bookingMedia(b),
    accent: bookingAccent(b),
    stub: documents > 0 ? { kind: "count", n: documents } : { kind: "booked" },
    // A booking with my ticket opens the viewer; any other opens its row on Trip home.
    href: documents > 0 ? ticketHref(tripId, b.booking_id) : `/trips/${tripId}?open=${encodeURIComponent(b.booking_id)}`,
    details: bookingDetails(b, users, meId),
    pnr: b.ref,
  };
}

/** What the ticket viewer draws for one document of a booking that covers me. */
export function toTicketDoc(b: ApiBooking, documentId: Id | undefined, me: User): TicketDoc | null {
  const doc = b.documents?.find((d) => d.document_id === documentId) ?? b.documents?.[0];
  if (!doc) return null;
  const mine = b.passengers?.find((p) => p.person_id === me.id);
  const j = b.journey;
  const start = b.starts_at ? formatDayClock(wallTime(b.starts_at)) : "";
  const end = b.ends_at ? formatDayClock(wallTime(b.ends_at)) : "";
  return {
    title: j ? `${j.carrier_name ?? b.vendor} e-ticket` : b.title,
    fileName: doc.name,
    pages: doc.pages ?? 1,
    pnr: mine?.pnr ?? b.ref,
    booked: formatDate(new Date(b.created_at)),
    passenger: me.name,
    seat: mine?.seat ?? "—",
    flight: j ? [j.number, j.carrier_name].filter(Boolean).join(" · ") : b.vendor,
    from: j
      ? { code: stop(j.origin), place: j.origin.name, time: formatDayClock(wallTime(j.depart_at)) }
      : { code: "IN", place: b.place?.name ?? b.vendor, time: start },
    to: j
      ? { code: stop(j.destination), place: j.destination.name, time: formatDayClock(wallTime(j.arrive_at)) }
      : { code: "OUT", place: b.place?.address ?? b.vendor, time: end },
    documentId: doc.document_id,
    bookingId: b.booking_id,
    ...(httpUrl(doc.url) ? { url: httpUrl(doc.url) } : {}),
    mime: doc.mime,
    carrier: j?.carrier_name ?? b.vendor,
    ...(httpUrl(j?.logo_url) ? { logoUrl: httpUrl(j?.logo_url) } : {}),
  };
}

/**
 * A journey's e-tickets, one per leg: the file named after the leg's route ("E-ticket BLR-GOX.pdf"), else the one in
 * its place (onward first).
 */
function legFiles(b: ApiBooking): { out?: BookingDocument; back?: BookingDocument } {
  const docs = b.documents ?? [];
  const named = (j?: Journey | null) => (j ? docs.find((d) => d.name.toUpperCase().includes(`${stop(j.origin)}-${stop(j.destination)}`.toUpperCase())) : undefined);
  const backNamed = named(b.return_journey);
  const out = named(b.journey) ?? docs.find((d) => d !== backNamed);
  const back = b.return_journey ? (backNamed ?? docs.find((d) => d !== out)) : undefined;
  return { out, back };
}

const fileRef = (doc: BookingDocument | undefined, label: string): { file?: BookingFileRef } => (doc ? { file: { documentId: doc.document_id, label } } : {});

/**
 * The booking's sheet, opened from its ticket in the room: my own leg of a travel booking that covers me (seat and PNR
 * only come with `GET …/bookings`), or a stay with its dates. Each leg carries its own file, and so does the stay.
 */
export function toPrivateDetails(b: ApiBooking, meId: Id): PrivateDetails | null {
  const j = b.journey;
  if (!j) {
    if (b.kind !== "stay" || !b.starts_at || !b.ends_at) return null;
    const checkIn = wallTime(b.starts_at);
    const checkOut = wallTime(b.ends_at);
    const date = (d: Date) => ({ code: `${d.getDate()} ${monthShort(d)}`, time: weekdayShort(d) });
    return {
      airline: { name: b.place?.name ?? b.title, logo: "" },
      flight: b.ref,
      from: date(checkIn),
      to: date(checkOut),
      cells: [
        { label: PRIVATE_COPY.checkIn, value: formatClock(checkIn) },
        { label: PRIVATE_COPY.checkOut, value: formatClock(checkOut) },
        { label: PRIVATE_COPY.nights, value: String(Math.max(daysBetween(checkIn, checkOut), 1)) },
      ],
      bookingId: b.booking_id,
      ...fileRef(b.documents?.[0], PRIVATE_COPY.openVoucher),
    };
  }
  const mine = b.passengers?.find((p) => p.person_id === meId);
  const depart = wallTime(j.depart_at);
  const back = b.return_journey;
  const files = legFiles(b);
  return {
    airline: { name: j.carrier_name ?? b.vendor, logo: httpUrl(j.logo_url) ?? "" },
    flight: j.number ?? "",
    from: { code: stop(j.origin), time: `${formatDay(depart).split(" ")[0]} ${formatClock(depart)}` },
    to: { code: stop(j.destination), time: formatClock(wallTime(j.arrive_at)) },
    cells: [
      { label: PRIVATE_COPY.seat, value: mine?.seat ?? "—" },
      { label: PRIVATE_COPY.boards, value: formatClock(depart) },
      { label: PRIVATE_COPY.pnr, value: mine?.pnr ?? b.ref },
    ],
    bookingId: b.booking_id,
    ...fileRef(files.out, PRIVATE_COPY.openTicket),
    ...(back
      ? {
          ret: {
            emoji: b.kind === "flight" ? "🛬" : bookingEmoji(b.kind),
            title: `Return · ${formatDay(wallTime(back.depart_at))}`,
            sub: [back.number, `${stop(back.origin)} ${formatClock(wallTime(back.depart_at))} → ${stop(back.destination)} ${formatClock(wallTime(back.arrive_at))}`]
              .filter(Boolean)
              .join(" · "),
            ...fileRef(files.back, PRIVATE_COPY.openReturn),
          },
        }
      : {}),
  };
}

/** The booking's files that its sheet shows no button for (none belongs to a leg, or to the stay): listed under it. */
export function otherFiles(b: ApiBooking, details: PrivateDetails | null): BookingDocument[] {
  const shown = new Set([details?.file?.documentId, details?.ret?.file?.documentId]);
  return (b.documents ?? []).filter((d) => !shown.has(d.document_id));
}
