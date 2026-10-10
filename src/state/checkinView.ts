import type { Booking, CheckinState } from "@/api/contract";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { CheckIn, Seat, User } from "@/data/types";
import { formatClock, formatDay, wallTime } from "@/lib/dates";
import { inr } from "@/lib/format";
import { httpUrl } from "@/state/bookingView";
import { fromMinor } from "@/state/view";

// `CheckinState` (CONTRACT-APP §4.12) → what the check-in sheets and the boarding pass draw. Go performs the check-in
// on the airline's site; the Server keeps a copy of what Go found.

const STATUS = { not_open: "not-open", open: "open", working: "working", done: "done", failed: "failed", closed: "closed" } as const;

const text = (value: unknown): string => (typeof value === "string" ? value : typeof value === "number" ? String(value) : "");

/** `boarding_pass` is free-form (whatever the airline gave Go): read the fields the pass card has a slot for. */
function toPass(pass: Record<string, unknown> | null, fallback: { passenger: string; departs: string }): CheckIn["pass"] {
  if (!pass) return null;
  const qr = Array.isArray(pass.qr) && pass.qr.every((row) => typeof row === "string") ? (pass.qr as string[]) : null;
  return {
    passenger: text(pass.passenger) || text(pass.passenger_name) || fallback.passenger.toUpperCase(),
    boarding: text(pass.boarding) || text(pass.boarding_time),
    departs: text(pass.departs) || text(pass.departure_time) || fallback.departs,
    gate: text(pass.gate),
    zone: text(pass.zone),
    seq: text(pass.seq) || text(pass.sequence),
    qr,
  };
}

export function toCheckIn(state: CheckinState, booking: Booking | undefined, me: User): CheckIn {
  const j = booking?.journey;
  const origin = state.flight?.origin;
  const destination = state.flight?.destination;
  const depart = j ? wallTime(j.depart_at) : null;
  const arrive = j ? wallTime(j.arrive_at) : null;
  const map = state.seat_map;
  const columns = map?.columns ?? [];
  const aisle = map?.aisle_after ? columns.indexOf(map.aisle_after) + 1 : Math.ceil(columns.length / 2);
  const seats: Seat[] = (map?.seats ?? []).map((s) => ({
    id: s.id,
    row: s.row ?? Number.parseInt(s.id, 10),
    col: s.col ?? s.id.replace(/^\d+/, ""),
    state: s.state === "companion" ? "friend" : s.state,
    ...(s.price_minor ? { price: inr(fromMinor(s.price_minor)) } : {}),
  }));
  const rows = map?.rows?.length ? map.rows : [...new Set(seats.map((s) => s.row))].sort((a, b) => a - b);
  const departs = origin?.time ?? (depart ? formatClock(depart) : "");
  const name = state.passenger?.name ?? me.name;

  return {
    flight: state.flight?.number ?? j?.number ?? "",
    date: state.flight?.date ?? (depart ? formatDay(depart) : ""),
    logo: httpUrl(state.flight?.logo_url) ?? httpUrl(j?.logo_url) ?? "",
    route: {
      from: origin?.code ?? j?.origin.code ?? "",
      fromTime: departs,
      fromSub: origin?.name ?? j?.origin.name ?? "",
      to: destination?.code ?? j?.destination.code ?? "",
      toTime: destination?.time ?? (arrive ? formatClock(arrive) : ""),
      toSub: destination?.name ?? j?.destination.name ?? "",
    },
    passRoute: { fromSub: origin?.name ?? j?.origin.name ?? "", toSub: destination?.name ?? j?.destination.name ?? "" },
    passenger: {
      name,
      sub: CHECKIN_COPY.details.passengerSub,
      mobile: state.passenger?.mobile_masked ?? "",
      bags: state.passenger?.bags ?? "",
    },
    digiYatra: state.digi_yatra ?? false,
    declaration: state.declaration ?? false,
    seat: state.seat ?? "",
    status: STATUS[state.status] ?? "closed",
    friendId: state.companion?.person_id ?? null,
    friendSeat: state.companion?.seat ?? "",
    nextToFriend: state.companion?.next_to_seats ?? [],
    colsLeft: columns.slice(0, aisle),
    colsRight: columns.slice(aisle),
    rows,
    frontLabel: map?.front_label ?? CHECKIN_COPY.seat.front,
    seats,
    pass: toPass(state.boarding_pass, { passenger: name, departs }),
  };
}
