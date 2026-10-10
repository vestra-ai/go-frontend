import { assets } from "@/lib/assets";
import type { UserId } from "@/data/types";

// Every UI string not tied to a seed record, verbatim from the design (curly apostrophes kept).
// Templated strings are functions; amounts arrive pre-formatted so this module has no formatting dependency.

// Shared chrome: the design's sheet backdrop label.
export const sheet = { backdropLabel: "Close sheet", close: "Close" } as const;

// ---------------------------------------------------------------------------
// A · Welcome, Home, Profile (A-onboarding.md §1.3–1.4)
// ---------------------------------------------------------------------------

export const welcome = {
  // Editable prop in the design; the first option is the default (the others are stored but unused).
  headlines: [
    "Group trips shouldn’t fall on one friend.",
    "Why is it always one friend planning the trip?",
    "Group trips are fun. Planning them alone isn’t.",
    "Everyone’s coming. Someone’s stuck planning.",
    "One friend shouldn’t have to plan the whole trip.",
  ],
  subline: "Go reads your group chat and sorts the stays, rides, food and money, so everyone just enjoys the trip.",
  orbit: [
    { label: "Manali", img: assets.illustrations.manali.src, alt: "Manali snowy cottage" },
    { label: "Kerala", img: assets.illustrations.kerala.src, alt: "Kerala houseboat" },
    { label: "Jaipur", img: assets.illustrations.jaipur.src, alt: "Jaipur pink palace" },
    { label: "Gokarna", img: assets.illustrations.gokarna.src, alt: "Gokarna beach hut" },
    { label: "Udaipur", img: assets.illustrations.udaipur.src, alt: "Udaipur lake palace" },
    { label: "Ladakh", img: assets.illustrations.ladakh.src, alt: "Ladakh monastery" },
  ],
  mascot: { src: assets.goMascot.src, alt: "Go, a waving traveller holding a map" },
  pills: {
    progress: { label: "Comparing 24 stays", value: 62 },
    done: { label: "Cabs sorted for 6" },
  },
  features: [
    { emoji: "🗳️", label: "Quick group polls" },
    { emoji: "🏡", label: "Stays found & booked" },
    { emoji: "💸", label: "Splits sorted" },
  ],
  cta: "Continue with Google",
  legal: { prefix: "By continuing you agree to our ", terms: "Terms", joiner: " and ", privacy: "Privacy Policy" },
  toasts: {
    terms: "Opens Go’s terms in your browser",
    privacy: "Opens Go’s privacy policy in your browser",
  },
} as const;

export const home = {
  eyebrowZero: "Welcome to Go",
  eyebrowBack: "Welcome back",
  title: "Your trips",
  profileLabel: "Your profile",
  hero: {
    title: "Start your first group trip",
    body: "Pick a place, add your crew. Go chases dates, budget and bookings.",
    cta: "Create a trip",
  },
  ideasTitle: "Ideas for your crew",
  ideasMeta: (city: string) => `From ${city}`,
  askGo: { title: "Not sure where? Ask Go", sub: "Go suggests places from everyone’s answers" },
  invitesTitle: "Invites",
  invitesMeta: (n: number) => `${n} new`,
  accept: "Accept",
  decline: "Decline",
  tripsTitle: "Your trips",
  tripsMeta: (n: number) => `${n} active`,
  pastTitle: "Past trips",
  fab: "New trip",
  toasts: { decline: "Invite declined. Priya won’t be told." },
} as const;

export const profile = {
  title: "Profile",
  back: "Back",
  provider: "Signed in with Google",
  rows: {
    from: { emoji: "🛫", title: "Travelling from", sub: (city: string) => `${city} · used for your tickets` },
    trips: { emoji: "🧳", title: "Your trips", sub: "1 active · 2 past · 1 invite" }, // literal (PLAN §12.1 #3)
    payment: { emoji: "💳", title: "Payment methods", sub: "UPI · HDFC card ••4821" },
    notifications: { emoji: "🔔", title: "Trip notifications", sub: "Polls, bookings, Go’s calls" },
  },
  signOut: "Sign out",
  toasts: {
    from: "Change it from the From chip in any trip chat",
    payment: "Payment methods open here in the real app",
  },
} as const;

// Prototype-only copy (PLAN §9.6), not design copy.
export const prototype = {
  title: "Prototype controls",
  meta: "Not in the real app",
  reset: { emoji: "🔄", title: "Reset demo", sub: "Clears saved progress and signs out" },
  jump: { emoji: "🧭", title: "Jump to artboard", sub: "Pick one of 72 design states" },
} as const;

// ---------------------------------------------------------------------------
// B · Who's coming, invite, share sheet (B-crew.md §1.3–1.5)
// ---------------------------------------------------------------------------

export const crew = {
  title: (destination: string) => `Who’s coming to ${destination}?`,
  subEmpty: "Just you so far. Share the link and your crew lands here.",
  subJoined: "Drop the link in your group chat. Whoever taps it shows up here.",
  cardTitleEmpty: "No one’s in yet",
  cardBodyEmpty: (crewName: string) => `Everyone who taps your link joins ${crewName}. You’ll see them here as they come in.`,
  cardBodyJoined: (crewName: string) => `Share again anytime. Whoever taps the link joins ${crewName}.`,
  linkLabel: "Invite link",
  copy: "Copy",
  cta: "Share in WhatsApp group",
  suggestions: { title: "Suggestions show up later", sub: "After your first trip, Go suggests people you’ve travelled with" },
  listTitle: (crewName: string, n: number) => `${crewName} · ${n} in`,
  listMeta: "Updates live",
  you: "You",
  organizer: "Organizer",
  joinLabel: { rahul: "Joined via link · 2m ago", priya: "Joined via link · just now" } as Partial<Record<UserId, string>>,
  next: "Next",
  nextJoined: "Next · open trip chat",
  helper: "Go can share the link for you from the trip chat",
  skip: "Skip",
  back: "Back",
} as const;

export const invite = {
  title: (inviter: string) => `${inviter} invited you`,
  sub: "Join the trip to plan it together with Go.",
  joined: (n: number) => `${n} joined`,
  whenYouJoin: "WHEN YOU JOIN",
  accept: "Accept & join",
  notNow: "Not now",
  close: "Close",
} as const;

export const share = {
  dialogLabel: "Share trip invite",
  title: (crewName: string) => `Join ${crewName} on Go`,
  copy: "Copy",
  recentSub: "WhatsApp group · recent",
  targets: [
    { id: "whatsapp", label: "WhatsApp" },
    { id: "messages", emoji: "💬", label: "Messages" },
    { id: "gmail", emoji: "✉️", label: "Gmail" },
    { id: "copy-link", emoji: "🔗", label: "Copy link" },
    { id: "more", glyph: "⋯", label: "More" },
  ],
  toasts: {
    copied: "Invite link copied",
    messages: "Opens Messages with the link filled in",
    gmail: "Opens Gmail with the link filled in",
    more: "Opens your phone’s share menu",
  },
} as const;

// ---------------------------------------------------------------------------
// C/D · Chat shell, quick start, From sheet, message actions (C-chat-kickoff.md §1.6)
// ---------------------------------------------------------------------------

export const chat = {
  goName: "Go",
  goAck: "Got it 👍 I’ll factor that into the plan.",
  header: { back: "Back", board: "Trip board", share: "Share trip invite" },
  chipEmoji: { where: "📍", when: "📅", stay: "🏡", budget: "💰", from: "🛫" },
  composer: {
    srLabel: "Message",
    placeholder: "Message, or @Go",
    add: "Add",
    send: "Send",
    stopAndSend: "Stop and send voice note",
    voice: "Voice message",
    recording: "Recording… tap the mic to send",
    voiceNote: "🎤 Voice note · 0:06",
  },
  attach: [
    { id: "photo", emoji: "📷", label: "Photo" },
    { id: "pdf", emoji: "📄", label: "Ticket or PDF" },
    { id: "location", emoji: "📍", label: "Location" },
    { id: "poll", emoji: "🗳️", label: "Poll" },
  ],
  longPress: {
    reactions: ["❤️", "😂", "🔥", "👍", "😮", "🙏"],
    react: (emoji: string) => `React ${emoji}`,
    more: "More reactions",
    reply: "Reply",
    askGo: "Ask Go",
    copy: "Copy",
    dialogLabel: "Message actions",
    close: "Close",
  },
  tray: {
    replyingTo: (name: string) => `Replying to ${name}`,
    replyPlaceholder: (name: string) => `Reply to ${name}`,
    askGoAbout: (name: string) => `Ask Go about ${name}’s message`,
    askGoPlaceholder: "Ask Go anything about this",
    cancel: "Cancel",
  },
  toasts: {
    reacted: (emoji: string, name: string) => `You reacted ${emoji} to ${name}`,
    emojiKeyboard: "Your full emoji keyboard opens here",
    copied: "Message copied",
  },
} as const;

// Canned attach-menu sends, in AttachMenu row order (photo, pdf, location, poll).
export const attachSends = {
  goa: ["📷 Photo · Goa packing list", "📄 Shared a PDF · IndiGo e-ticket", "📍 Shared location · Anjuna", "🗳️ Poll · Scuba on Sunday? Yes / No"],
  // DESIGN-ASSUMPTION (G-bali.md §1.7 #3): only the Goa nouns are swapped.
  bali: ["📷 Photo · Bali packing list", "📄 Shared a PDF · IndiGo e-ticket", "📍 Shared location · Denpasar", "🗳️ Poll · Scuba on Sunday? Yes / No"],
} as const;

export const quickStart = {
  label: "Quick start",
  title: "Quick start",
  sub: "Help Go plan for the crew. Takes 10 seconds.",
  close: "Close",
  vibeLabel: "WHAT VIBE?",
  vibes: [
    { id: "beach", label: "🏖️ Beach" },
    { id: "hills", label: "⛰️ Hills" },
    { id: "city", label: "🏙️ City" },
    { id: "any", label: "🤷 Surprise us" },
  ],
  spendLabel: "YOUR BUDGET?",
  spends: [
    { id: "lt15", label: "Under ₹15k" },
    { id: "15to25", label: "₹15–25k" },
    { id: "gt25", label: "₹25k+" },
  ],
  fromLabel: "TRAVELLING FROM?",
  fromGroupLabel: "Travelling from",
  fromNote: "🔒 Just for your tickets",
  footnote: "Skip anything. You can set where you’re travelling from anytime with the From chip up top.",
  done: "Done",
  notNow: "Not now",
} as const;

export const fromSheet = {
  label: "Travelling from",
  title: "Travelling from",
  sub: "Where will you start your trip?",
  close: "Close",
  cityLabel: "YOUR CITY",
  privacy: "Only you and Go see this. Go uses it for your flights, trains and buses.",
  save: "Save",
} as const;

export const cityPicker = {
  other: "Other city",
  pickedPrefix: "📍 ",
  changeLabel: (name: string) => `${name}, change city`, // new
  clearLabel: "Clear city", // new
  searchLabel: "Search a city",
  placeholder: "Search a city, state or country",
  clear: "Clear search", // new
  empty: "No matches. Try a nearby bigger city.",
  keepTyping: "Keep typing to search all cities.", // new
  topHeading: "TOP CITIES IN INDIA", // new
  searching: "Searching…", // new
  offline: "Can’t reach city search right now. Showing saved cities.", // new
  cancel: "Cancel", // new
} as const;

// ---------------------------------------------------------------------------
// E · Deciding together (E-deciding.md §1.3–1.6)
// ---------------------------------------------------------------------------

export const polls = {
  votes: (n: number) => (n === 0 ? "No votes yet" : n === 1 ? "1 vote" : `${n} votes`),
  dateVotes: (n: number) => (n === 0 ? "No votes" : n === 1 ? "1 vote" : `${n} votes`),
  details: "Details",
  vote: "Vote",
  voted: "Voted ✓",
  voteFor: (name: string) => `Vote for ${name}`,
  datesLabel: "Vote for a weekend",
  votedCount: (n: number, of: number) => `${n} of ${of} voted`,
  youVoted: "You voted",
  yetToVote: "yet to vote",
} as const;

export const placeSheet = {
  why: "WHY GO PICKED IT",
  cost: "ROUGH COST EACH",
  about: "About",
  activities: "THINGS THE CREW CAN DO",
  backToAll: "Back to all 3",
} as const;

export const budgetSheet = {
  label: "Your budget range",
  title: "Your budget range",
  sub: "Drag to set a minimum and a maximum.",
  eyebrow: "YOUR BUDGET",
  minLabel: "₹5k",
  maxLabel: "₹60k",
  thumbs: { min: "Minimum", max: "Maximum" },
  note: "Go aims for the low end and never goes past your max. Only you see this.",
  save: "Save my range",
  saved: "Saved privately ✓",
} as const;

export const staySheet = {
  subtitle: "Go checked it’s free for 6–9 Nov and fits everyone’s budget.",
  dates: "Fri 6 → Mon 9 Nov · 3 nights",
  facts: { dates: "Dates", total: "Total for 4", share: "Your share", cancellation: "Cancellation" },
} as const;

export const paySheet = {
  label: "Book Villa Sol",
  title: "Book Villa Sol",
  sub: "One person pays the villa. Go splits it in Settle up.",
  summary: { title: "Villa Sol · 3 nights", sub: "Fri 6 → Mon 9 Nov · 4 guests", amount: "₹43,200" },
  payWith: "PAY WITH",
  payWithLabel: "Pay with",
  // DESIGN-ASSUMPTION (PLAN §12.1 #7): Rahul's instruments shown to you as yours, as designed.
  methods: [
    { id: "upi", emoji: "⚡", title: "UPI", sub: "rahul@okhdfc", tint: "bg-success-soft" },
    { id: "card", emoji: "💳", title: "Card", sub: "Visa •• 4821", tint: "bg-surface-2" },
  ],
  split: { text: "You pay the villa directly. Go adds ₹10,800 each to Settle up.", members: ["aarav", "rahul", "priya", "arjun"] as UserId[] },
  cta: "Pay ₹43,200 & book",
  trust: "Paid straight to Villa Sol · free cancellation till 1 Nov",
  cardImgAlt: "Villa Sol pool",
  receiptPayerAlt: "Paid by Rahul",
} as const;

// ---------------------------------------------------------------------------
// H · Trip board (H-board.md §1.2–1.3)
// ---------------------------------------------------------------------------

export const board = {
  title: "Trip board",
  close: "Close",
  subtitles: {
    empty: "Nothing’s locked yet. Tap any item and Go gets it moving.",
    polling: "Polls run only on where, when and stay.",
    settled: "Go keeps this current from your chat.",
  },
  change: "Change",
  rows: {
    where: {
      emoji: "📍",
      notSet: { eyebrow: "WHERE", value: "Not decided", sub: "Go suggests places from everyone’s answers", ask: "Ask Go" },
      decided: { eyebrow: "WHERE", value: "Goa", sub: "All four agreed in the chat" },
    },
    when: {
      emoji: "📅",
      notSet: { eyebrow: "WHEN", value: "Not set", sub: "No dates shared yet", ask: "Find dates" },
      decided: { eyebrow: "WHEN", value: "Fri 6 – Mon 9 Nov", sub: "Diwali weekend" },
    },
    stay: {
      emoji: "🏡",
      notSet: { eyebrow: "STAY", value: "Not booked", sub: "Needs a place and dates first", ask: "Ask Go" },
      voteOpen: {
        eyebrow: "STAY · VOTE OPEN",
        value: "3 villas in the running",
        sub: (voted: number) => `${voted} of 4 voted · closes in 2 hrs`,
        cta: "Vote",
        option: (name: string, votes: number) => `${name} · ${votes}`,
      },
      // DESIGN-ASSUMPTION (H-board.md ⚑): state not drawn in H1–H3.
      decided: { eyebrow: "STAY", value: "Villa Sol, Anjuna", sub: "Won the vote · booking next" },
      booked: { eyebrow: "STAY", value: "Villa Sol, Anjuna", sub: "Booked by Rahul · ₹10.8k each", status: "Booked" },
    },
    budget: {
      emoji: "💰",
      notSet: { eyebrow: "YOUR BUDGET", value: "Not set", sub: "Only you see it", ask: "Set" },
      decided: { eyebrow: "YOUR BUDGET", value: "₹21.8k, all-in", sub: "Only you see this" },
    },
    travel: {
      emoji: "🧳",
      notSet: { eyebrow: "YOUR TRAVEL", value: "Not added", sub: "Each person picks their own way in", ask: "Find routes" },
      partial: { eyebrow: "YOUR TRAVEL", value: "Flight there booked", sub: "BLR → GOX · 6E 5313 · return not booked", status: "1 of 2" },
      // DESIGN-ASSUMPTION (H-board.md ⚑): borrowed from the J1 flights row.
      booked: { eyebrow: "YOUR TRAVEL", value: "Your flights booked", sub: "BLR ⇄ GOX · both ways", status: "Booked" },
    },
  },
  reminder: {
    eyebrow: "GO · YOUR RETURN ISN’T BOOKED",
    value: "Book your way back on Mon 9 Nov",
    sub: "You’re in on Fri. Evening flights back are filling up.",
    cta: "Find return",
  },
  spend: {
    eyebrow: "YOUR SPEND VS YOUR BUDGET",
    empty: "Shows up once you set your budget. Only you see it.",
    emptyAria: "No budget yet",
    of: (budget: string) => ` of ${budget}`,
    stay: "Stay",
    travel: "Travel",
    left: (left: string) => `${left} left`,
    aria: (stay: string, travel: string, left: string) => `Stay ${stay}, travel ${travel}, ${left} left`,
  },
} as const;

// ---------------------------------------------------------------------------
// I · Trip plan shell + zero states (I-plan-empty.md §1.2–1.4)
// ---------------------------------------------------------------------------

export const tripShell = {
  tablistLabel: "Trip sections",
  tabs: [
    { id: "home", label: "Home" },
    { id: "itinerary", label: "Itinerary" },
    { id: "bookings", label: "Bookings" },
    { id: "expenses", label: "Expenses" },
  ],
  back: "Back",
  share: "Share trip",
  chat: "Chat",
} as const;

export const planZero = {
  hero: { title: "New trip", where: "Where? Not decided yet", joined: (n: number) => `${n} joined` },
  chatPreview: { text: "Go: What’s the plan, crew? 🌴", unread: 1 },
  home: {
    statusTitle: "Nothing’s decided yet",
    statusSub: "Go fills this page as your crew chats",
    decided: (d: number, t: number) => `${d} of ${t} decided`,
    nextUpTitle: "Next up",
    open: (n: number) => `${n} open`,
    nextUp: [
      { key: "where", emoji: "📍", title: "Pick a place", sub: "Go suggests places from everyone’s answers", action: "Ask Go" },
      { key: "when", emoji: "📅", title: "Pick dates", sub: "Go finds a weekend that fits everyone", action: "Ask Go" },
      { key: "stay", emoji: "🏡", title: "Find a stay", sub: "Unlocks once place and dates are set", action: "Ask Go" },
      { key: "budget", emoji: "💰", title: "Set your budget", sub: "Private to you · Go plans within it", action: "Set" },
      { key: "travel", emoji: "🧳", title: "Sort your travel", sub: "Each person picks their own route", action: "Book" },
    ],
    inviteTitle: "Invite more people",
    inviteSub: "Share the trip link in your group chat",
  },
  itinerary: {
    emoji: "🗓️",
    title: "No plan yet",
    body: "Once place and dates are set, Go drafts each day from what your crew says in chat.",
    primary: "Ask Go to draft a plan",
    secondary: "Pick dates first",
  },
  bookings: {
    title: "No bookings yet",
    body: "Everything Go or your crew books lands here, tickets included.",
    stubs: [
      { key: "out", emoji: "🛫", eyebrow: "FLIGHT · TRAIN · BUS", title: "Getting there", action: "Book" },
      { key: "back", emoji: "🛬", eyebrow: "RETURN TICKET", title: "Getting back home", action: "Book" },
      { key: "stay", emoji: "🏡", eyebrow: "STAY", title: "Where you’ll sleep", action: "Ask Go" },
    ],
  },
  expenses: {
    scopes: { everyone: "Everyone", me: "Just me" },
    zero: "₹0",
    everyoneCaption: "spent by the crew so far",
    meCaption: "your spend so far",
    categories: [
      { key: "stay", emoji: "🏡", label: "Stay" },
      { key: "travel", emoji: "🧳", label: "Travel" },
    ],
    footnote: "Travel covers flights, trains and buses.",
    budget: { title: "Set your budget", sub: "Only you see it. Go plans your tickets and stay within it.", cta: "Set my budget" },
    settle: { title: "Settle up", emoji: "🤝", rowTitle: "All square", rowSub: "Shared bills get split here as they come in" },
    tx: { title: "Transactions", emoji: "🧾", rowTitle: "No payments yet", rowSub: "Every booking and payback shows here, for everyone" },
  },
} as const;

// ---------------------------------------------------------------------------
// J · Populated trip home (J-triphome-calls.md §1.2, §1.6)
// ---------------------------------------------------------------------------

export const tripHome = {
  pendingTitle: "Pending on you",
  pendingMeta: (n: number) => `${n} left`,
  pending: {
    settle: { title: "Settle up with Rahul", sub: "₹5,800 left of your villa share", cta: "Record" },
    cab: { emoji: "✈️", badgeEmoji: "🏡", title: "Airport cab to Villa Sol", sub: "Fri 9:55 pm · with Arjun", cta: "Book ₹1,600" },
  },
  allSet: { title: "You’re all set", sub: "Nothing pending on you. Go pings you if plans change." },
  callsTitle: "Go’s calls",
  callCount: (n: number) => (n === 1 ? "1 live" : `${n} live · swipe`),
  doneTitle: "Done",
  doneLabel: (n: number, allSet: boolean) => (allSet ? `All ${n}` : `${n} done`),
  done: {
    stay: { emoji: "🏡", title: "Villa Sol booked", sub: "Fri 6 → Mon 9 · paid by Rahul", subResolved: "Late check-in confirmed by Go" },
    fly: {
      emoji: "✈️",
      title: "Your flights booked",
      sub: "BLR ⇄ GOX · both ways",
      subResolved: "BLR ⇄ GOX · 15 kg extra bag added",
      subCheckedIn: (seat: string) => `Checked in · seat ${seat}`, // optional deviation (K-checkin.md §1.5)
    },
    cab: { emoji: "🚕", title: "Airport cabs booked", sub: "Fri arrival and Mon drop, with Arjun" },
    settled: { emoji: "🤝", title: "Settled up with Rahul", sub: "Rahul confirmed your payments" },
    budget: { emoji: "💰", title: "Your budget set", sub: "₹21.8k · only you see it" },
    dates: { emoji: "📅", title: "Dates locked", sub: "Diwali · Fri 6 – Mon 9 Nov" },
  },
  fab: {
    busy: { preview: "Priya: scuba’s on me 🤿", unread: 3 },
    allSet: { preview: "Rahul: see you all friday 🌴", unread: 0 },
  },
} as const;

// ---------------------------------------------------------------------------
// L · Itinerary toggles (L-itinerary-map.md §1.4)
// ---------------------------------------------------------------------------

export const scopeToggle = { label: "Whose plan", everyone: "Everyone", me: "Just me" } as const;
export const viewToggle = { label: "View", list: "List view", map: "Map view" } as const;

// ---------------------------------------------------------------------------
// G · Bali (G-bali.md §1.2)
// ---------------------------------------------------------------------------

export const baliToasts = {
  tripPage: "Bali’s trip page works like Goa’s. The Goa trip shows the full flow.",
  board: "Bali’s board works like Goa’s. Open the Goa trip to try it.",
  settled: "Bali is settled for this group. Stay and dates are next.",
} as const;

// ---------------------------------------------------------------------------
// Toasts not owned by a namespace above (E, J, M)
// ---------------------------------------------------------------------------

export const toasts = {
  morePlaces: "Go is adding 3 more places to the chat",
  moreStays: "Go is lining up 5 more villas",
  watchCheckout: "Opens Go’s live view of the checkout page",
  saved: "Saved to your phone",
  ticketDownloaded: "Ticket PDF downloaded",
  ticketShared: "Ticket shared to Goa crew",
  nudge: { priya: "Go nudged Priya about her ₹10,800 share" } as Partial<Record<UserId, string>>,
  recorded: "Recorded · Rahul gets a ping to confirm", // DESIGN-ASSUMPTION: the design shows no toast (PLAN §12.1 #17)
} as const;

export const copy = {
  sheet,
  welcome,
  home,
  profile,
  prototype,
  crew,
  invite,
  share,
  chat,
  attachSends,
  quickStart,
  fromSheet,
  cityPicker,
  polls,
  placeSheet,
  budgetSheet,
  staySheet,
  paySheet,
  board,
  tripShell,
  planZero,
  tripHome,
  scopeToggle,
  viewToggle,
  baliToasts,
  toasts,
} as const;
