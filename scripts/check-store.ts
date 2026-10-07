// Store sanity check (P2-2): acceptance checks, persist round-trip, and all 72 presets.
// Run: pnpm dlx tsx scripts/check-store.ts   (tsx resolves the @/* alias from tsconfig.json)
import type { TripId } from "@/data/types";

// persist needs window.localStorage; Node has neither. Install a Map-backed stub before the store module loads.
const memory = new Map<string, string>();
const storageStub: Storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => void memory.set(key, String(value)),
  removeItem: (key) => void memory.delete(key),
  clear: () => memory.clear(),
  key: (index) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size;
  },
};
Object.defineProperty(globalThis, "window", { value: { localStorage: storageStub }, configurable: true, writable: true });

const failures: string[] = [];

function check(label: string, ok: boolean, detail?: unknown) {
  if (!ok) failures.push(label);
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${!ok && detail !== undefined ? `  → ${JSON.stringify(detail)}` : ""}`);
}

function eq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  check(label, ok, ok ? undefined : { actual, expected });
}

// Key-order-independent JSON, for comparing persisted snapshots.
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    return `{${entries.sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const store = await import("@/store");
  const { partialize, STORE_KEY } = await import("@/store/persist");
  const { PRESETS } = await import("@/data/presets");
  const { GO_REPLY_MS } = await import("@/data/timing");
  const { useStore } = store;
  const S = () => useStore.getState();
  const goa: TripId = "goa";
  const preset = (id: string) => S().applyPreset(id);

  // Fresh store -------------------------------------------------------------------
  console.log("\n# initial");
  eq("signed out, no trips", [S().session.signedIn, Object.keys(S().trips.trips)], [false, []]);
  eq("A4: selectMyTrips empty", store.selectMyTrips(S()).length, 0);

  // Acceptance: ensureStage('plan') -------------------------------------------------
  console.log("\n# ensureStage('plan') from a fresh Goa crew");
  S().resetDemo();
  S().createDraftGoa();
  S().createDraftGoa(); // idempotent
  S().simulateJoins({ instant: true });
  eq("crew members", S().trips.trips.goa?.memberIds, ["aarav", "rahul", "priya"]);
  S().ensureStage(goa, "plan");
  eq("stage id plan", store.selectStage(S(), goa).id, "plan");
  eq("trip.stage planned", S().trips.trips.goa?.stage, "planned");
  eq("3 bookings (seed order)", store.selectBookings(S(), goa).map((b) => b.id), ["travel-out", "stay", "travel-back"]);
  eq("7 transactions (seed order)", S().money.transactions.map((t) => t.id), ["tx1", "tx2", "tx3", "tx4", "tx5", "tx6", "tx7"]);
  eq("3 settlements", S().money.settlements.length, 3);
  eq("villa call seeded on entering plan", S().home.goa.calls.map((c) => c.vendor), ["villa"]);
  eq("defaults: votes", [S().chat.goa.placeVote, S().chat.goa.dateVote, S().chat.goa.stayVote], ["goa", "diwali", "sol"]);
  eq("defaults: route f2 round, no cab, private unviewed", [S().chat.goa.route.booked, S().chat.goa.cab.booked, S().chat.goa.privateViewed], [{ optionId: "f2", trip: "round" }, undefined, false]);
  const everyone = store.selectMoney(S(), goa, "everyone");
  const me = store.selectMoney(S(), goa, "me");
  eq("money everyone 64,920 · 66.5% · 5 rows · See all 7", [everyone.total, everyone.bar.stayPct, everyone.rows.length, everyone.seeAll], [64920, 66.5, 5, "See all 7 transactions"]);
  eq("money me 18,860 · caption · 49.5/37 · 86%", [me.total, me.caption, me.bar.stayPct, me.bar.travelPct, me.bar.aria], [18860, "₹2,940 left of your ₹21,800", 49.5, 37, "86% of your budget used"]);
  eq("money me rows tx1 tx6 tx7", me.rows.map((t) => t.id), ["tx1", "tx6", "tx7"]);
  const planned = store.selectBoard(S(), goa);
  eq("board round trip: settled subtitle, travel Booked, spend = money me", [planned.subtitle, planned.rows[4].kind === "row" && planned.rows[4].trailing, planned.spend], [
    "Go keeps this current from your chat.",
    { kind: "status", tone: "success", label: "Booked" },
    { kind: "filled", stay: 10800, travel: 8060, budget: 21800, left: 2940 },
  ]);
  check("memoised selectors return stable references", store.selectBoard(S(), goa) === planned && store.selectMessages(S(), goa) === store.selectMessages(S(), goa));
  S().ensureStage(goa, "kickoff"); // forward only
  eq("ensureStage never moves backwards", store.selectStage(S(), goa).id, "plan");

  // Acceptance: applyPreset('J4') ----------------------------------------------------
  console.log("\n# applyPreset('J4')");
  const j4 = preset("J4");
  eq("returns its href", j4, "/trips/goa?open=fly");
  eq("2 live calls (villa, indigo)", store.selectLiveCalls(S(), goa).map((c) => c.id), ["villa", "indigo"]);
  eq("fly row open", S().home.goa.openRow, "fly");
  eq("trip planned", store.selectTripHomeMode(S(), goa), "populated");
  const villa = S().home.goa.calls[0];
  check("villa clock seeded ~01:12", Math.abs(Date.now() - villa.startedAt - 72_000) < 5_000);

  // Chat flow ------------------------------------------------------------------------
  console.log("\n# chat flow");
  preset("C1");
  eq("C1 header + From chip", [store.selectChatHeader(S(), goa).subtitle, store.selectChips(S(), goa)[4].label, store.selectChips(S(), goa)[4].state], ["Rahul joined", "From?", "unset"]);
  preset("C2");
  eq("C2 header + From chip", [store.selectChatHeader(S(), goa).subtitle, store.selectChips(S(), goa)[4].label, store.selectChips(S(), goa)[4].state], ["Just created · 2 joined", "Bengaluru", "set"]);
  eq("C2 messages", store.selectMessages(S(), goa).map((m) => m.id), ["ko-sys", "ko-go-open", "ko-quick"]);
  preset("E1");
  eq("E1 no pill", store.selectNextPill(S(), goa), null);
  S().votePlace(goa, "gokarna");
  eq("vote → pill", store.selectNextPill(S(), goa)?.label, "Goa won the vote · pick dates next");
  S().advance(goa, "place-voted");
  eq("advance → dates-talk", store.selectStage(S(), goa).id, "dates-talk");
  S().send(goa, "works if we leave fri night", { quote: { author: "Arjun", text: "in, but only after 6pm fri 😭" } });
  await sleep(GO_REPLY_MS + 150);
  S().advance(goa, "dates-asked");
  const ids = store.selectMessages(S(), goa).map((m) => m.id);
  eq("reply + ack sit inside dates-talk, before the dates poll", ids.slice(ids.indexOf("dt-arjun")), ["dt-arjun", "goa-sent-1", "goa-sent-2", "dp-go", "dp-poll"]);
  eq("ack text", store.selectMessages(S(), goa).find((m) => m.id === "goa-sent-2")?.text, "Got it 👍 I’ll factor that into the plan.");
  S().react(goa, "dt-arjun", "❤️");
  eq("reaction merged", store.selectMessages(S(), goa).find((m) => m.id === "dt-arjun")?.reaction, { emoji: "❤️", count: 1 });
  S().voteDate(goa, "xmas");
  S().voteDate(goa, "xmas");
  eq("re-voting a date clears it", [S().chat.goa.dateVote, store.selectNextPill(S(), goa)], [null, null]);
  S().setFlexible(goa);
  eq("flexible → pill", store.selectNextPill(S(), goa)?.label, "Diwali weekend won · budgets next");
  S().advance(goa, "dates-answered");
  eq("budget chip active while unsaved", store.selectChips(S(), goa)[3], { key: "budget", emoji: "💰", label: "Budget?", state: "unset", active: true });
  S().setBudget(goa, 20000, 20500);
  eq("setBudget clamps lo ≤ hi − 1000", S().chat.goa.budget, { lo: 19500, hi: 20500, saved: false });
  S().saveBudget(goa);
  eq("saved → chip + in-sheet pill", [store.selectChips(S(), goa)[3].label, store.selectNextPill(S(), goa)?.inSheet], ["₹21.8k", "budget"]);

  preset("E12");
  eq("E12 booking open, no pill", [S().chat.goa.stayBooking.status, store.selectNextPill(S(), goa)], ["open", null]);
  S().claimBooking(goa);
  eq("claim → Rahul's message + pill", [store.selectMessages(S(), goa).some((m) => m.id === "pa-rahul"), store.selectNextPill(S(), goa)?.label], [true, "Watch Rahul book it"]);
  preset("E14");
  S().payBooking(goa);
  eq("payBooking → book, paid by you", [store.selectStage(S(), goa).id, S().chat.goa.stayBooking], ["book", { status: "claimed", paid: true, done: false, by: "aarav" }]);

  preset("E15");
  eq("E15 at book, not done, nothing booked yet", [store.selectStage(S(), goa).id, S().chat.goa.stayBooking.done, store.selectBookings(S(), goa).length, S().money.transactions.length], ["book", false, 0, 0]);
  eq("E15 pill on entry", store.selectNextPill(S(), goa)?.label, "Next · how everyone gets there");
  S().completeBooking(goa);
  S().completeBooking(goa); // idempotent
  eq("completeBooking → stay booking, 3 tx, settlements", [store.selectBookings(S(), goa).map((b) => b.id), S().money.transactions.length, S().money.settlements.length], [["stay"], 3, 3]);
  eq("E15 money everyone 43,200", store.selectMoney(S(), goa, "everyone").total, 43200);
  S().advance(goa, "booking-done");
  eq("→ travel", store.selectStage(S(), goa).id, "travel");

  preset("F2");
  S().setRouteTrip(goa, "oneway");
  S().openTimeSheet(goa);
  S().toggleDraftSlot(goa, "on", "s3");
  S().toggleDraftSlot(goa, "on", "s1");
  S().applyTimeSlots(goa);
  eq("time slots applied, draft closed", [S().chat.goa.route.on, S().chat.goa.route.draft], [["s1", "s3"], null]);
  S().bookRoute(goa, { optionId: "f2", trip: "oneway" });
  eq("bookRoute one way → route-confirm, 2 bookings, 7 tx", [store.selectStage(S(), goa).id, store.selectBookings(S(), goa).map((b) => b.id), S().money.transactions.length], ["route-confirm", ["travel-out", "stay"], 7]);
  S().bookCab(goa, { optionId: "s1", trip: "round" });
  eq("cab booked, no stage change", [S().chat.goa.cab.booked, store.selectStage(S(), goa).id], [{ optionId: "s1", trip: "round" }, "route-confirm"]);

  // Board ------------------------------------------------------------------------------
  console.log("\n# board");
  preset("H1");
  const h1 = store.selectBoard(S(), goa);
  eq("H1 empty subtitle + spend", [h1.subtitle, h1.spend], ["Nothing’s locked yet. Tap any item and Go gets it moving.", { kind: "empty" }]);
  preset("H2");
  const h2 = store.selectBoard(S(), goa);
  const poll = h2.rows[2];
  eq("H2 poll 3 of 4 · 2/1/0 · spend ₹0", [h2.subtitle, poll.kind === "poll" && poll.sub, poll.kind === "poll" && poll.options.map((o) => o.votes), h2.spend], [
    "Polls run only on where, when and stay.",
    "3 of 4 voted · closes in 2 hrs",
    [2, 1, 0],
    { kind: "filled", stay: 0, travel: 0, budget: 21800, left: 21800 },
  ]);
  preset("H3");
  const h3 = store.selectBoard(S(), goa);
  eq("H3 reminder + 1 of 2 + spend 14,760 / 7,040", [h3.reminder?.cta, h3.rows[4].kind === "row" && h3.rows[4].trailing, h3.spend], [
    "Find return",
    { kind: "status", tone: "amber", label: "1 of 2" },
    { kind: "filled", stay: 10800, travel: 3960, budget: 21800, left: 7040 },
  ]);

  // Trip home ------------------------------------------------------------------------
  console.log("\n# trip home");
  preset("I1");
  eq("I1 zero, 2 members, kickoff preview", [store.selectTripHomeMode(S(), goa), store.selectTripMembers(S(), goa).map((u) => u.id), store.selectChatPreview(S(), goa)], ["zero", ["aarav", "rahul"], { text: "Go: What’s the plan, crew? 🌴", unread: 1 }]);
  preset("J1");
  eq("J1 pending settle + cab · 4 done · busy FAB", [store.selectPending(S(), goa).map((p) => p.kind), store.selectDone(S(), goa).length, store.selectChatPreview(S(), goa).unread], [["settle", "cab"], 4, 3]);
  preset("J2");
  S().setChip(goa, "stay", "🌙 Late check-in");
  S().startCall(goa, "villa", "stay");
  eq("J2 call from chip", [S().home.goa.calls.map((c) => c.asking), S().home.goa.askForm.chips.stay], [["Late check-in"], null]);
  S().endCall(goa, "villa", { withOutcome: true });
  eq("end with outcome → lastCall + resolved", [S().home.goa.calls.length, S().home.goa.lastCall?.vendor, S().home.goa.resolved, store.selectDone(S(), goa)[0].sub], [0, "villa", ["villa"], "Late check-in confirmed by Go"]);
  preset("J6");
  eq("J6 all set: no pending, 6 done, all-set FAB", [store.selectPending(S(), goa).length, store.selectDone(S(), goa).map((r) => r.key), store.selectChatPreview(S(), goa)], [0, ["stay", "fly", "cab", "settled", "budget", "dates"], { text: "Rahul: see you all friday 🌴", unread: 0 }]);
  preset("K1");
  eq("K1 3 pending, in 2 days", [store.selectPending(S(), goa).map((p) => p.kind), S().home.goa.daysToGo], [["checkin", "settle", "cab"], "in 2 days"]);
  S().setSeat(goa, "14C"); // taken → ignored
  S().setSeat(goa, "14B"); // Arjun → ignored
  S().setSeat(goa, "12B"); // paid, free
  S().completeCheckin(goa);
  eq("seat rules + check-in done", [S().home.goa.checkin.seat, store.selectPending(S(), goa).map((p) => p.kind), store.selectDone(S(), goa)[1].sub], ["12B", ["settle", "cab"], "Checked in · seat 12B"]);
  preset("J1");
  S().previewCheckin(goa);
  eq("previewCheckin → open, in 2 days", [S().home.goa.checkin.status, S().home.goa.daysToGo], ["open", "in 2 days"]);

  // Money ----------------------------------------------------------------------------
  console.log("\n# money");
  preset("M7");
  S().recordPayment({ amount: 2900, via: "UPI", note: "" });
  eq("partial payment: ₹2,900 left, pending row cleared", [S().money.settlements[0], store.selectPending(S(), goa).map((p) => p.kind)], [{ fromId: "aarav", toId: "rahul", amount: 2900, status: "open" }, ["cab"]]);
  S().recordPayment({ amount: 2900, via: "Cash", note: "rest" });
  const afterPay = store.selectMoney(S(), goa, "everyone");
  eq("settled, 9 rows, recorded on top, spend unchanged", [S().money.settlements[0].status, afterPay.transactions.length, afterPay.transactions.slice(0, 3).map((t) => t.id), afterPay.total, afterPay.seeAll], ["settled", 9, ["tx-rec-2", "tx-rec-1", "tx1"], 64920, "See all 9 transactions"]);
  eq("non-money trip has no money", store.selectMoney(S(), "college", "everyone").transactions.length, 0);

  // Itinerary, home lists, Bali --------------------------------------------------------
  console.log("\n# itinerary, home, Bali");
  preset("L2");
  eq("itinerary everyone 3/3/1/5 · me 3/1/1/3", [store.selectItinerary(S(), goa, "everyone").map((d) => d.rows.length), store.selectItinerary(S(), goa, "me").map((d) => d.rows.length)], [[3, 3, 1, 5], [3, 1, 1, 3]]);
  eq("just-me row overrides", store.selectItinerary(S(), goa, "me")[0].rows[0].title, "BLR → GOX · 6E 5313");
  preset("A6");
  eq("A6 trips goa+college, invite bali, 2 past", [store.selectMyTrips(S()).map((t) => t.id), store.selectPendingInvites(S()).map((i) => i.code), S().trips.pastTrips.length], [["goa", "college"], ["bali-x9m"], 2]);
  preset("G2");
  eq("G2 Bali joined, at visa, invite gone", [store.selectMyTrips(S()).map((t) => t.id), store.selectStage(S(), "bali").id, store.selectPendingInvites(S()).length], [["goa", "college", "bali"], "visa", 0]);
  eq("G2 You not yet", store.selectVisaRows(S(), "bali")[0].status, "not-yet");
  S().setVisaUpload("bali", "passport");
  S().setVisaField("bali", "name", "Aarav Shah");
  S().sendVisa("bali");
  eq("sendVisa → Sent ✓ Submitted today", [store.selectVisaRows(S(), "bali")[0].status, store.selectVisaRows(S(), "bali")[0].sub], ["sent", "Submitted today"]);

  // Persist ----------------------------------------------------------------------------
  console.log("\n# persist");
  preset("J5");
  S().openTimeSheet(goa);
  S().toggleDraftSlot(goa, "on", "s2");
  S().setVisaField("bali", "passport", "Z1234567");
  S().setDraft(goa, "main", "keep the gate open");
  S().setChip(goa, "main", "🚕 Airport cab");
  S().setListen(goa, { muted: true });
  S().setRecording(goa, { playing: true, rate: 2 });
  S().toggleRow(goa, "stay");
  const raw = memory.get(STORE_KEY);
  check(`localStorage['${STORE_KEY}'] written`, typeof raw === "string");
  const saved = JSON.parse(raw ?? "{}");
  eq("version 1", saved.version, 1);
  eq("route.draft not persisted", "draft" in saved.state.chat.goa.route, false);
  eq("visa.fields not persisted (uploads/sent are)", [saved.state.chat.bali.visa.fields, Object.keys(saved.state.chat.bali.visa)], [undefined, ["uploads", "sent"]]);
  eq("askForm/listen/recording/openRow not persisted", ["askForm", "listen", "recording", "openRow"].filter((k) => k in saved.state.home.goa), []);
  eq("joinRun, members, invites not persisted", ["joinRun", "members", "invites"].filter((k) => k in saved.state.trips), []);
  check("passport number never written", !(raw ?? "").includes("Z1234567"));
  const snapshot = stable(partialize(S()));
  S().resetDemo();
  eq("resetDemo clears storage + state", [memory.has(STORE_KEY), S().session.signedIn, Object.keys(S().trips.trips)], [false, false, []]);
  memory.set(STORE_KEY, raw ?? "");
  await useStore.persist.rehydrate();
  check("rehydrate restores the persisted state exactly", stable(partialize(S())) === snapshot);
  eq("transient fields come back at defaults", [S().chat.goa.route.draft, S().chat.bali.visa.fields.passport, S().home.goa.askForm.drafts.main, S().home.goa.listen.muted, S().home.goa.recording.rate, S().home.goa.openRow, S().trips.members.aarav.name], [null, "", "", false, 1, null, "Aarav Shah"]);
  eq("restored J5 calls + stage", [S().home.goa.calls.map((c) => c.id), store.selectStage(S(), goa).id], [["villa"], "plan"]);

  // All presets --------------------------------------------------------------------------
  console.log("\n# all presets");
  eq("72 presets", PRESETS.length, 72);
  for (const p of PRESETS) {
    try {
      const href = preset(p.id);
      const tripId: TripId = p.state.tripId ?? "goa";
      // Touch every selector so a bad descriptor surfaces here.
      store.selectChips(S(), tripId);
      store.selectMessages(S(), tripId);
      store.selectNextPill(S(), tripId);
      store.selectChatHeader(S(), tripId);
      store.selectBoard(S(), tripId);
      store.selectPending(S(), tripId);
      store.selectDone(S(), tripId);
      store.selectTripMembers(S(), tripId);
      store.selectChatPreview(S(), tripId);
      store.selectMyTrips(S());
      store.selectPendingInvites(S());
      store.selectBookings(S(), tripId);
      store.selectMoney(S(), tripId, "me");
      store.selectVisaRows(S(), "bali");
      const ok = href === p.href;
      if (!ok) failures.push(`${p.id} href`);
      console.log(`${ok ? "ok  " : "FAIL"} ${p.id.padEnd(4)} ${href}`);
    } catch (error) {
      failures.push(`${p.id} threw`);
      console.log(`FAIL ${p.id.padEnd(4)} threw ${(error as Error).message}`);
    }
  }
  eq("unknown preset → /home", preset("Z9"), "/home");

  S().resetDemo(); // cancels any store timers so the process exits
  console.log(failures.length ? `\n${failures.length} check(s) failed:\n- ${failures.join("\n- ")}` : "\nall store checks passed");
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
