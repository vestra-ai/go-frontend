import { assets } from "@/lib/assets";
import type { ChipKey, ChipState, ScenarioStage, UserId } from "@/data/types";

// Goa chat script (PLAN §9.3; C-chat-kickoff.md §1.3, E-deciding.md §1.2, F-travel.md §1.2).
// Text: "\n" = line break, "**x**" = bold. Message ids are stable (presets and deep links use them, e.g. dt-arjun).

const TWO: UserId[] = ["aarav", "rahul"];
const FOUR: UserId[] = ["aarav", "rahul", "priya", "arjun"]; // Kabir never in the stack (PLAN §12.1 #1)

const unset = (label: string): ChipState => ({ label, state: "unset" });
const set = (label: string): ChipState => ({ label, state: "set" });

type Chips = Record<ChipKey, ChipState>;

// From chip: "From?" until a city is saved; from `places` on it falls back to the seed city (selector uses fromCity).
const KICKOFF_CHIPS: Chips = {
  where: unset("Where?"),
  when: unset("When?"),
  stay: unset("Stay?"),
  budget: unset("Budget?"),
  from: unset("From?"),
};
const PLACES_CHIPS: Chips = { ...KICKOFF_CHIPS, from: set("Bengaluru") };
const PLACE_SET_CHIPS: Chips = { ...PLACES_CHIPS, where: set("Goa") };
// DESIGN-ASSUMPTION (E-deciding.md §1.7 #11): budget chip is active for the whole stage while unsaved.
const BUDGET_CHIPS: Chips = { ...PLACE_SET_CHIPS, when: set("Nov 6–9"), budget: { label: "Budget?", state: "unset", active: true } };
const STAYS_CHIPS: Chips = { ...BUDGET_CHIPS, budget: set("₹21.8k") };
const STAY_SET_CHIPS: Chips = { ...STAYS_CHIPS, stay: set("Villa Sol") };

// Budget chip once `budget.saved` (during the `budget` stage itself the selector swaps to this).
export const BUDGET_SAVED_CHIP: ChipState = set("₹21.8k");

const SUBTITLE_DIWALI = "Diwali · 6–9 Nov";

export const GOA_SCENARIO: ScenarioStage[] = [
  {
    id: "kickoff",
    subtitle: "Just created · 2 joined",
    memberIds: TWO,
    // C1 follows its artboard ("Rahul joined"), not PLAN §9.3's single subtitle.
    headerByQuickStart: {
      pending: { subtitle: "Rahul joined", memberIds: TWO },
      done: { subtitle: "Just created · 2 joined", memberIds: TWO },
      dismissed: { subtitle: "Rahul and Priya joined", memberIds: ["aarav", "rahul", "priya"] },
    },
    chips: KICKOFF_CHIPS,
    messages: [
      // Unchanged in C3 even though Priya joined, as designed.
      { id: "ko-sys", stage: "kickoff", author: "system", kind: "system", text: "Trip created · Rahul joined" },
      {
        id: "ko-go-open",
        stage: "kickoff",
        author: "go",
        kind: "text",
        text: "What’s the plan, crew? 🌴\nWhere are we thinking of going?",
        maxWidth: 76,
      },
      {
        id: "ko-quick",
        stage: "kickoff",
        author: "go",
        kind: "card",
        card: { kind: "quick-replies", payload: { eyebrow: "TAP TO REPLY", chips: ["🏖️ Beach", "⛰️ Mountains", "🤷 Not sure, suggest some"] } },
        showIf: "qs-done",
        live: true,
      },
      { id: "ko-priya", stage: "kickoff", author: "priya", kind: "text", text: "goa for diwali?? 🌴", maxWidth: 72, showIf: "qs-dismissed" },
      {
        id: "ko-nudge",
        stage: "kickoff",
        author: "go",
        kind: "card",
        card: { kind: "go-nudge", payload: { label: "Go suggests places from the chat" } },
        showIf: "qs-dismissed",
        live: true,
      },
    ],
    // Any reply chip or the nudge; no bubble is posted (as designed).
    next: [{ to: "places", trigger: "place-asked" }],
  },
  {
    id: "places",
    subtitle: "Picking a place",
    memberIds: FOUR,
    chips: PLACES_CHIPS,
    messages: [
      { id: "pl-priya", stage: "places", author: "priya", kind: "text", text: "beach pls 🌴 diwali works", maxWidth: 72 },
      { id: "pl-rahul", stage: "places", author: "rahul", kind: "text", text: "anything under 25k", maxWidth: 72 },
      {
        id: "pl-go",
        stage: "places",
        author: "go",
        kind: "text",
        text: "3 places fit beach + Diwali + under ₹25k each, from Bengaluru. Vote right on the card 👇",
        maxWidth: 72,
      },
      {
        id: "pl-poll",
        stage: "places",
        author: "go",
        kind: "card",
        card: {
          kind: "place-poll",
          payload: {
            placeIds: ["goa", "gokarna", "udaipur"],
            countdown: "Voting closes in 3 hrs",
            more: { title: "Show more places", sub: "Go has 6 more" },
          },
        },
      },
      {
        id: "pl-arjun",
        stage: "places",
        author: "arjun",
        kind: "text",
        text: "udaipur looks sick ngl",
        reaction: { emoji: "🔥", count: 2 },
        maxWidth: 72,
      },
    ],
    next: [{ to: "dates-talk", trigger: "place-voted", pill: { label: "Goa won the vote · pick dates next", ready: "place-vote" } }],
  },
  {
    id: "dates-talk",
    subtitle: "Goa · picking dates",
    memberIds: FOUR,
    chips: PLACE_SET_CHIPS,
    messages: [
      { id: "dt-priya", stage: "dates-talk", author: "priya", kind: "text", text: "diwali weekend? 🪔", maxWidth: 72 },
      { id: "dt-kabir", stage: "dates-talk", author: "kabir", kind: "text", text: "christmas i’m at home in kochi", maxWidth: 72 },
      {
        id: "dt-arjun",
        stage: "dates-talk",
        author: "arjun",
        kind: "text",
        text: "in, but only after 6pm fri 😭",
        maxWidth: 72,
        replyDraft: "works if we leave fri night",
        askGoSuggestions: ["Flights after 6 pm Fri?", "Can we leave Sat morning?", "Sum up everyone’s dates"],
      },
    ],
    // Reply / Ask-Go sends also fire `dates-asked` (no pill). DESIGN-ASSUMPTION: the fallback nudge pill is a PLAN addition.
    next: [{ to: "dates-poll", trigger: "dates-asked", pill: { label: "Go checked everyone’s calendars", ready: "dates-nudge" } }],
  },
  {
    id: "dates-poll",
    subtitle: "Goa · picking dates",
    memberIds: FOUR,
    chips: PLACE_SET_CHIPS,
    messages: [
      {
        id: "dp-go",
        stage: "dates-poll",
        author: "go",
        kind: "text",
        text: "Got it. I checked everyone’s calendars and leave. Here’s what works 👇",
        maxWidth: 72,
      },
      {
        id: "dp-poll",
        stage: "dates-poll",
        author: "go",
        kind: "card",
        card: {
          kind: "dates-poll",
          payload: {
            title: "Final call: which weekend?",
            countdown: "5 hrs left",
            dateIds: ["diwali", "xmas", "rday"],
            flexible: { off: "I’m flexible, any of these work", on: "You’re flexible · any of these work" },
            of: 4,
          },
        },
      },
    ],
    next: [{ to: "budget", trigger: "dates-answered", pill: { label: "Diwali weekend won · budgets next", ready: "date-vote-or-flexible" } }],
  },
  {
    id: "budget",
    subtitle: SUBTITLE_DIWALI,
    memberIds: FOUR,
    chips: BUDGET_CHIPS,
    messages: [
      { id: "bu-sys", stage: "budget", author: "system", kind: "system", text: "Diwali won · Fri 6 – Mon 9 Nov" },
      {
        id: "bu-ask",
        stage: "budget",
        author: "go",
        kind: "card",
        maxWidth: 80,
        card: {
          kind: "budget-ask",
          payload: {
            text: "Next up, money 💰\nWhat can you spend per person, all-in? Only I see your number.\n\n@Aarav please set this",
            cta: "Add my budget",
            caption: "Only you and Go see what you add",
          },
        },
      },
      { id: "bu-added", stage: "budget", author: "system", kind: "system", text: "Rahul and Priya added theirs" },
    ],
    // The pill renders inside BudgetSheet; a tap closes the sheet, then advance('budget-saved').
    next: [{ to: "stays", trigger: "budget-saved", pill: { label: "Saved · see the stays Go found", ready: "budget-saved", inSheet: "budget" } }],
  },
  {
    id: "stays",
    subtitle: SUBTITLE_DIWALI,
    memberIds: FOUR,
    chips: STAYS_CHIPS,
    messages: [
      { id: "st-sys", stage: "stays", author: "system", kind: "system", text: "Budget set: ₹21.8k each" },
      {
        id: "st-me",
        stage: "stays",
        author: "aarav",
        kind: "text",
        mention: true,
        text: "find us a villa near anjuna, pool would be nice",
        maxWidth: 80,
      },
      {
        id: "st-go",
        stage: "stays",
        author: "go",
        kind: "text",
        text: "Found 3 pool villas for 6–9 Nov, all under your ₹21.8k each. Vote on the one you like 👉",
        maxWidth: 72,
      },
      {
        id: "st-poll",
        stage: "stays",
        author: "go",
        kind: "card",
        card: { kind: "stay-poll", payload: { stayIds: ["sol", "azul", "palms"], more: { title: "Show 5 more", sub: "Same dates, same budget" } } },
      },
      { id: "st-priya", stage: "stays", author: "priya", kind: "text", text: "casa azul is so cute 😍", maxWidth: 72 },
    ],
    next: [{ to: "pay", trigger: "stay-voted", pill: { label: "Villa Sol won · book it", ready: "stay-vote" } }],
  },
  {
    id: "pay",
    subtitle: SUBTITLE_DIWALI,
    memberIds: FOUR,
    chips: STAY_SET_CHIPS,
    messages: [
      { id: "pa-sys", stage: "pay", author: "system", kind: "system", text: "Villa Sol won · 3 votes" },
      {
        id: "pa-go",
        stage: "pay",
        author: "go",
        kind: "text",
        text: "Villa Sol is free for your dates 🎉\nOnly **one** of you needs to book. I’ll split it 4 ways right after.",
        maxWidth: 72,
      },
      {
        id: "pa-card",
        stage: "pay",
        author: "go",
        kind: "card",
        card: {
          kind: "pay-ask",
          payload: {
            stayId: "sol",
            badge: "👤 ONE PERSON BOOKS FOR ALL",
            total: "₹43,200",
            sub: "3 nights · 4 guests · works out to ₹10,800 each",
            assurance: { title: "Free cancellation till 1 Nov", sub: "Full refund if plans change" },
            cta: "I’ll book for all 4 · ₹43,200",
            helper: "Only one person taps this. It locks for everyone else once you do.",
            booker: { title: "Rahul is booking for all 4", sub: "You don’t need to do anything. Go adds your share to Settle up." },
          },
        },
      },
      {
        id: "pa-rahul",
        stage: "pay",
        author: "rahul",
        kind: "text",
        text: "on it, using my card 🙌",
        maxWidth: 72,
        showIf: "booking-claimed-by-rahul",
      },
    ],
    // Two ways out: Rahul claims (pill) or you pay in the sheet (direct, no pill).
    next: [
      { to: "book", trigger: "stay-claimed", pill: { label: "Watch Rahul book it", ready: "claimed-by-rahul" } },
      { to: "book", trigger: "stay-paid" },
    ],
  },
  {
    id: "book",
    subtitle: SUBTITLE_DIWALI,
    memberIds: FOUR,
    chips: STAY_SET_CHIPS,
    messages: [
      { id: "bk-sys", stage: "book", author: "system", kind: "system", text: "Budget set: ₹21.8k each · Go will track spends" },
      {
        id: "bk-go",
        stage: "book",
        author: "go",
        kind: "text",
        text: "Villa Sol fits: ₹43,200\nfor 3 nights, ₹10.8k each.\nShall I book it now?",
        maxWidth: 64,
      },
      { id: "bk-rahul", stage: "book", author: "rahul", kind: "text", text: "yes book it, on my card 🙌", maxWidth: 70 },
      {
        id: "bk-progress",
        stage: "book",
        author: "go",
        kind: "card",
        card: {
          kind: "booking-progress",
          payload: {
            stayId: "sol",
            title: "Booking Villa Sol",
            watch: "Watch",
            url: "villasolgoa.com/checkout",
            line: "3 nights · 4 guests",
            lineSub: "Free cancellation till 1 Nov",
            // DESIGN-ASSUMPTION (PLAN §12.1 #7): reads Rahul's card whoever paid.
            cardLabel: "Rahul’s card ••4821",
            amount: "₹43,200",
            paying: "Paying · cap ₹45,000",
            paid: "Paid ₹43,200 ✓",
            ticket: { eyebrow: "STAY · BOOKED", title: "Villa Sol", dates: "Fri 6 → Mon 9", stub: "3 NIGHTS", reaction: { emoji: "🎉", count: 4 } },
            late: { text: "Villa’s on Rahul’s card.\nSplit 4 ways 👇", maxWidth: 64 },
            receipt: {
              label: "ADDED TO TRIP MONEY",
              title: "Villa Sol · 3 nights",
              payer: "rahul",
              amount: "₹43,200",
              split: "₹10,800 each · split 4 ways",
              cta: "Fix split",
              href: "/trips/goa/expenses",
            },
          },
        },
      },
    ],
    // Shows on entry, as designed. Tap: completeBooking() (idempotent), then advance('booking-done').
    next: [{ to: "travel", trigger: "booking-done", pill: { label: "Next · how everyone gets there", ready: "entry" } }],
  },
  {
    id: "travel",
    subtitle: SUBTITLE_DIWALI,
    memberIds: FOUR,
    chips: STAY_SET_CHIPS,
    messages: [
      { id: "travel-arjun", stage: "travel", author: "arjun", kind: "text", text: "how are we all getting there?", maxWidth: 72 },
      {
        id: "travel-ask",
        stage: "travel",
        author: "go",
        kind: "card",
        maxWidth: 80,
        card: {
          kind: "travel-ask",
          payload: {
            // DESIGN-ASSUMPTION (F-travel.md §1.7 #5): F1's copy; F2's "Add your travel…" is drift.
            text: "Everyone picks their own way in ✈️🚆🚌\nAdd where you’re coming from and I’ll find options just for you. The crew only sees when you land.",
            cta: "Add my travel details",
            caption: "Only you and Go see what you add",
          },
        },
      },
      {
        id: "travel-progress",
        stage: "travel",
        author: "system",
        kind: "card",
        card: { kind: "progress-pill", payload: { text: "Rahul and Priya added theirs" } },
      },
    ],
    // RouteSheet "Book …" → bookRoute → route-booked (no pill).
    next: [{ to: "route-confirm", trigger: "route-booked" }],
  },
  {
    id: "route-confirm",
    subtitle: SUBTITLE_DIWALI,
    memberIds: FOUR,
    chips: STAY_SET_CHIPS,
    messages: [
      // DESIGN-ASSUMPTION (PLAN §12.1 #12): literal seed text whatever route was booked.
      { id: "rc-me", stage: "route-confirm", author: "aarav", kind: "text", text: "booked mine ✈️ lands 9:55 fri", maxWidth: 80 },
      {
        id: "rc-go",
        stage: "route-confirm",
        author: "go",
        kind: "text",
        text: "Got it. That’s the last one in 🎉 Here’s when everyone reaches Goa:",
        maxWidth: 72,
      },
      {
        id: "rc-who-lands",
        stage: "route-confirm",
        author: "go",
        kind: "card",
        card: {
          kind: "who-lands",
          payload: {
            title: "Who lands when",
            status: "Everyone’s booked",
            rows: [
              { userId: "aarav", name: "You", mode: "✈️ Flight · Mopa", lands: "Fri 9:55p", booked: true },
              { userId: "arjun", name: "Arjun", mode: "✈️ Flight · Mopa", lands: "Fri 9:55p", booked: true },
              { userId: "priya", name: "Priya", mode: "🚌 Bus · Mapusa", lands: "Sat 9:15a", booked: true },
              { userId: "rahul", name: "Rahul", mode: "🚆 Train · Thivim", lands: "Sat 10:30a", booked: true },
            ],
            suggestion: { emoji: "🚕", text: "You and Arjun land together. Share a cab?", cta: "Book" },
          },
        },
      },
      {
        id: "rc-arjun",
        stage: "route-confirm",
        author: "arjun",
        kind: "text",
        text: "same flight 🤝",
        reaction: { emoji: "🙌", count: 2 },
        maxWidth: 72,
      },
    ],
    // DESIGN-ASSUMPTION: PLAN §9.1 has no trigger for this pill; `lands-asked` is added. Shows on entry (design pNext:true).
    next: [{ to: "private", trigger: "lands-asked", pill: { label: "Next · Priya asks when everyone lands", ready: "entry" } }],
  },
  {
    id: "private",
    subtitle: SUBTITLE_DIWALI,
    memberIds: FOUR,
    chips: STAY_SET_CHIPS,
    messages: [
      { id: "pv-priya", stage: "private", author: "priya", kind: "text", text: "what time do we all reach?", maxWidth: 72 },
      {
        id: "pv-me",
        stage: "private",
        author: "aarav",
        kind: "text",
        mention: true,
        text: "when’s my flight and what do i owe?",
        maxWidth: 80,
      },
      {
        id: "pv-go",
        stage: "private",
        author: "go",
        kind: "text",
        text: "Sent you your flight and money details privately 🔒\nFor everyone: you all land between **9:55 pm Fri** and **10:30 am Sat**.",
        maxWidth: 76,
      },
      {
        id: "pv-teaser",
        stage: "private",
        author: "go",
        kind: "card",
        card: {
          kind: "private-teaser",
          // Literal design copy; differs from the money seed's ₹5,800 (F-travel.md §1.7 #7).
          payload: { label: "ONLY YOU CAN SEE THIS", lines: ["6E 5313 · Seat 14A · PNR K7QX2M", "You owe Rahul ₹12,900"], cta: "View my details" },
        },
      },
      { id: "pv-rahul", stage: "private", author: "rahul", kind: "text", text: "nice, i’ll wait up with beers 🍻", maxWidth: 72 },
    ],
    // Not gated on private-viewed; shows on entry (design pNext:true).
    next: [{ to: "plan", trigger: "plan-asked", pill: { label: "Next · Go’s final plan", ready: "entry" } }],
  },
  {
    id: "plan",
    subtitle: SUBTITLE_DIWALI,
    memberIds: FOUR,
    chips: STAY_SET_CHIPS,
    messages: [
      { id: "plan-me", stage: "plan", author: "aarav", kind: "text", mention: true, text: "can you sort the whole plan?", maxWidth: 70 },
      // Straight apostrophe, as designed.
      { id: "plan-go", stage: "plan", author: "go", kind: "text", text: "Here's your Goa.\nPool villa, scooters,\neveryone in by Friday night.", maxWidth: 64 },
      {
        id: "plan-card",
        stage: "plan",
        author: "go",
        kind: "card",
        card: {
          kind: "plan",
          payload: {
            eyebrow: "THE PLAN",
            place: { emoji: "📍", label: "Goa" },
            dates: { emoji: "📅", label: "Fri 6 – Mon 9 Nov" },
            countdown: { emoji: "⏳", label: "in 34 days" },
            hero: { src: assets.photos.goaSunset.src, alt: "Palm silhouette against a Goa sunset over the sea" },
            seal: { ring: "GOA ✦ INDIA ✦ GOA ✦ INDIA ✦", month: "NOV", days: "6–9" },
            memberIds: FOUR,
            days: [
              { n: 1, weekday: "FRI", caption: "Everyone lands", img: assets.photos.dayFri.src },
              { n: 2, weekday: "SAT", caption: "Scooters & sunset", img: assets.photos.daySat.src },
              { n: 3, weekday: "SUN", caption: "Scuba, then open", img: assets.photos.daySun.src },
              { n: 4, weekday: "MON", caption: "Panjim, then home", img: assets.photos.dayMon.src },
            ],
            footer: { label: "Made by Go", cta: "Open", href: "/trips/goa" },
            reaction: { emoji: "🔥", count: 4 },
          },
        },
      },
      { id: "plan-rahul", stage: "plan", author: "rahul", kind: "text", text: "GOOO 😭", maxWidth: 70 },
    ],
    next: [],
    setsTripPlanned: true,
  },
];

// Board-sheet stamp seed (H-board.md §1.5): built by P1-6, unused while PlanCard renders WaxSeal.
export const BOARD_STAMP = { ring: "GOA · INDIA · GOA · INDIA ·", line1: "NOV 6–9", line2: "2026" } as const;
