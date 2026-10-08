// Seed sanity check: prints the counts the P2-1 task expects and fails on any mismatch.
// Run: pnpm dlx tsx scripts/check-seed.ts   (tsx resolves the @/* alias from tsconfig.json)
import { PRESETS } from "@/data/presets";
import { SCENARIOS } from "@/data/scenario/engine";
import { BOOKINGS } from "@/data/seed/bookings";
import { CAB_OPTIONS } from "@/data/seed/cabs";
import { CALL_CHIPS, VENDOR_CALLS } from "@/data/seed/calls";
import { CHECKIN } from "@/data/seed/checkin";
import { CIT, MORE, searchCities } from "@/data/seed/cities";
import { planZero } from "@/data/seed/copy";
import { DATE_OPTIONS } from "@/data/seed/dates";
import { IDEAS } from "@/data/seed/ideas";
import { INVITES } from "@/data/seed/invites";
import { ITINERARY } from "@/data/seed/itinerary";
import { MAP_BACK_CARDS, MAP_CARDS, MAP_SPOTS } from "@/data/seed/map";
import { SETTLEMENTS, SPEND, TRANSACTIONS } from "@/data/seed/money";
import { PAST_TRIPS } from "@/data/seed/pastTrips";
import { PLACES } from "@/data/seed/places";
import { ALL_ROUTES, ROUTE_OPTIONS, TIME_SLOTS } from "@/data/seed/routes";
import { STAYS } from "@/data/seed/stays";
import { TRIPS } from "@/data/seed/trips";
import { USERS } from "@/data/seed/users";
import { baliVisa } from "@/data/seed/visa";
import type { RouteMode, RouteOption, SlotId, TripType } from "@/data/types";

const failures: string[] = [];

function count(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  if (!ok) failures.push(`${label}: expected ${expected}, got ${actual}`);
  console.log(`${ok ? "ok  " : "FAIL"} ${label.padEnd(44)} ${actual}`);
}

function check(label: string, ok: boolean) {
  if (!ok) failures.push(label);
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
}

const unique = (xs: string[]) => new Set(xs).size === xs.length;

// Presets ---------------------------------------------------------------------
count("presets", PRESETS.length, 72);
check("preset ids unique", unique(PRESETS.map((p) => p.id)));
check("preset hrefs are app routes", PRESETS.every((p) => p.href.startsWith("/")));

// Money -------------------------------------------------------------------------
count("transactions", TRANSACTIONS.length, 7);
count("settlements", SETTLEMENTS.length, 3);
const bookingsTx = TRANSACTIONS.filter((t) => t.kind === "booking");
const stayTx = bookingsTx.filter((t) => t.to.kind === "merchant" && t.to.name === "Villa Sol");
count("crew stay spend", stayTx.reduce((s, t) => s + t.amount, 0), SPEND.crew.stay);
count("crew travel spend", bookingsTx.reduce((s, t) => s + t.amount, 0) - SPEND.crew.stay, SPEND.crew.travel);
count("crew total", SPEND.crew.stay + SPEND.crew.travel, 64920);
count("my total", SPEND.me.stay + SPEND.me.travel, 18860);
count("my budget left", SPEND.budget - SPEND.me.stay - SPEND.me.travel, 2940);
count("mine rows", TRANSACTIONS.filter((t) => t.mine).length, 3);
count("payback rows", TRANSACTIONS.filter((t) => t.kind === "payback").length, 2);
count("transaction date groups", new Set(TRANSACTIONS.map((t) => t.dateLabel)).size, 5);

// Routes (worked examples from F-travel.md §1.3, using the design's DCLogic rules) --------
count("routes", ALL_ROUTES.length, 16);
check("flight 8 · train 4 · bus 4", [ROUTE_OPTIONS.flight.length, ROUTE_OPTIONS.train.length, ROUTE_OPTIONS.bus.length].join(" ") === "8 4 4");
count("time slots", TIME_SLOTS.length, 4);
const inSlots = (h: number, list: SlotId[]) =>
  list.length === 0 || list.some((id) => TIME_SLOTS.some((s) => s.id === id && s.from <= h && h < s.to));
const okFilt = (o: RouteOption, filt: string) =>
  filt === "all" ||
  (o.mode === "flight" ? (filt === "nonstop" ? o.kind !== "stop" : o.kind === filt) : o.kind === filt);
const shown = (trip: TripType, mode: RouteMode, filt: string, on: SlotId[] = [], ret: SlotId[] = []) =>
  ROUTE_OPTIONS[mode]
    .filter(
      (o) =>
        (trip === "round" || !o.roundOnly) &&
        okFilt(o, filt) &&
        inSlots(o.legs[0].h, on) &&
        (trip === "oneway" || inSlots(o.legs[1].h, ret)),
    )
    .map((o) => o.id)
    .join(" ");
check("round flight all = f1 f2 f3 f6 f7 f4 f5 f8", shown("round", "flight", "all") === "f1 f2 f3 f6 f7 f4 f5 f8");
check("oneway flight all = 7, f2 first", shown("oneway", "flight", "all") === "f2 f3 f6 f7 f4 f5 f8");
check("round flight nonstop = 5", shown("round", "flight", "nonstop") === "f1 f2 f3 f6 f7");
check("round flight stop = f4 f5 f8", shown("round", "flight", "stop") === "f4 f5 f8");
check("round flight mix = f1", shown("round", "flight", "mix") === "f1");
check("round flight evening = f1 f2 f3 f4 f5", shown("round", "flight", "all", ["s3"]) === "f1 f2 f3 f4 f5");
check("round flight morning/afternoon = f6", shown("round", "flight", "all", ["s1"], ["s2"]) === "f6");
check("oneway flight morning+evening = 5", shown("oneway", "flight", "all", ["s1", "s3"]).split(" ").length === 5);
check("train 3A = t1 t4, 2A = t2, SL = t3", shown("round", "train", "3A") === "t1 t4" && shown("round", "train", "2A") === "t2" && shown("round", "train", "SL") === "t3");
check("bus sleeper = 3, seater = b3", shown("round", "bus", "sleeper").split(" ").length === 3 && shown("round", "bus", "seater") === "b3");
check("bus early morning = none", shown("round", "bus", "all", ["s0"]) === "");
const f1 = ROUTE_OPTIONS.flight[0];
const f2 = ROUTE_OPTIONS.flight[1];
check("f1 round ₹7,840 · f2 one ₹3,960 / round ₹8,060", f1.round === 7840 && f2.one === 3960 && f2.round === 8060);
count("cabs", CAB_OPTIONS.length, 5);
count("cab sedans", CAB_OPTIONS.filter((c) => c.kind === "sedan").length, 3);

// Itinerary & map -----------------------------------------------------------
count("itinerary items", ITINERARY.length, 12);
const perDay = (rows: { day: string }[]) => ["fri", "sat", "sun", "mon"].map((d) => rows.filter((r) => r.day === d).length).join("/");
check("everyone rows per day 3/3/1/5", perDay(ITINERARY) === "3/3/1/5");
const justMe = ITINERARY.filter((i) => i.mine !== null);
count("just-me rows", justMe.length, 8);
check("just-me rows per day 3/1/1/3", perDay(justMe) === "3/1/1/3");
count("map spots", MAP_SPOTS.length, 9);
const visible = (scope: string) => MAP_SPOTS.filter((s) => s.audience === "both" || s.audience === scope).length;
check("visible spots everyone 8 · me 3 (shared by Getting there and Coming back)", [visible("everyone"), visible("me")].join(" ") === "8 3");
count("map cards", Object.keys(MAP_CARDS).length, 4);
count("map back cards", Object.keys(MAP_BACK_CARDS).length, 4);

// Scenario --------------------------------------------------------------------
count("goa stages", SCENARIOS.goa.length, 12);
count("bali stages", SCENARIOS.bali.length, 1);
count("college stages", SCENARIOS.college.length, 1);
for (const [tripId, stages] of Object.entries(SCENARIOS)) {
  const ids = stages.map((s) => s.id);
  const msgIds = stages.flatMap((s) => s.messages.map((m) => m.id));
  check(`${tripId}: message ids unique`, unique(msgIds));
  check(`${tripId}: every message tagged with its stage`, stages.every((s) => s.messages.every((m) => m.stage === s.id)));
  check(`${tripId}: every next.to exists`, stages.every((s) => s.next.every((n) => ids.includes(n.to))));
}
count("goa seed messages", SCENARIOS.goa.reduce((n, s) => n + s.messages.length, 0), 47);

// Decisions, people, trips --------------------------------------------------
count("places", PLACES.length, 3);
count("date options", DATE_OPTIONS.length, 3);
count("stays", STAYS.length, 3);
count("users", Object.keys(USERS).length, 5);
count("trips", Object.keys(TRIPS).length, 3);
count("invites", Object.keys(INVITES).length, 2);
count("ideas", IDEAS.length, 6);
count("past trips", PAST_TRIPS.length, 2);
count("cities (CIT)", CIT.length, 8);
count("cities (MORE)", MORE.length, 15);
check('"Ind" → Indore Indapur Indi Imphal Kochi Kozhikode', searchCities("Ind").map((c) => c.name).join(" ") === "Indore Indapur Indi Imphal Kochi Kozhikode");
count("next-up rows (I1)", planZero.home.nextUp.length, 5);

// Bookings, calls, check-in, visa --------------------------------------------
count("bookings", BOOKINGS.length, 3);
count("vendor calls", Object.keys(VENDOR_CALLS).length, 3);
check("call chips stay 6 · fly 6 · main 4", [CALL_CHIPS.stay.length, CALL_CHIPS.fly.length, CALL_CHIPS.main.length].join(" ") === "6 6 4");
count("seats", CHECKIN.seats.length, 42);
count("taken seats", CHECKIN.seats.filter((s) => s.state === "taken").length, 18);
count("paid free seats", CHECKIN.seats.filter((s) => s.state === "paid").length, 6);
count("free seats", CHECKIN.seats.filter((s) => s.state === "free").length, 17);
check("QR is 25 × 25", CHECKIN.pass.qr.length === 25 && CHECKIN.pass.qr.every((r) => r.length === 25));
count("QR dark modules", CHECKIN.pass.qr.join("").split("").filter((c) => c === "#").length, 299);
count("visa members", baliVisa.members.length, 4);

console.log(failures.length ? `\n${failures.length} check(s) failed` : "\nall seed checks passed");
if (failures.length) process.exit(1);
