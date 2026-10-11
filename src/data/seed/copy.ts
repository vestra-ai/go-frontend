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
  loading: "Loading your trips",
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
  pastEmpty: { emoji: "🧳", title: "No past trips yet", sub: "Trips that are over will show up here" },
  pastPeople: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
  pastSettled: "all settled",
  owesTitle: "You owe",
  owes: (name: string, amount: string) => `${name} · ${amount}`,
  fab: "New trip",
} as const;

export const profile = {
  title: "Profile",
  back: "Back",
  provider: (provider: string | null) => (provider === "google" ? "Signed in with Google" : provider === "email" ? "Signed in with email" : "Signed in"),
  rows: {
    from: { emoji: "🛫", title: "Travelling from", sub: (city: string | null) => (city ? `${city} · used for your tickets` : "Not set · used for your tickets") },
    trips: { emoji: "🧳", title: "Your trips", sub: (active: number, past: number) => `${active} active · ${past} past` },
    payment: {
      emoji: "💳",
      title: "Payment methods",
      sub: (upi: string | null) => (upi ? `UPI ${upi} · cards in Go’s vault` : "Cards live in Go’s vault"),
    },
  },
  signOut: "Sign out",
  toasts: {
    fromSaved: "Saved. New trips start from here.",
    failed: "Couldn’t save that. Try again.",
    vaultFailed: "Couldn’t open Go’s vault. Try again.",
  },
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
  joinLabel: (ago: string) => `Joined via link · ${ago}`,
  createFailed: "Couldn’t start the trip. Try again.",
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
  // "<emoji> <text>", split at the first space.
  whenYouJoinRows: ["💬 You’re added to the trip chat", "📅 Go asks your dates and where you’re travelling from", "🔒 Your tickets stay private to you"],
  accept: "Accept & join",
  joining: "Joining…",
  gone: "This invite link no longer works. Ask for a new one.",
  failed: "Couldn’t join the trip. Try again.",
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
  loading: "Loading the chat",
  header: { back: "Back", board: "Trip board", share: "Share trip invite" },
  chipEmoji: { where: "📍", when: "📅", stay: "🏡", budget: "💰", from: "🛫" },
  /** A fact chip that has no value yet asks its question. */
  chipUnset: { where: "Where?", when: "When?", stay: "Stay?", budget: "Budget?", from: "From?" },
  /** The header's second line: the dates once set, else who is in. */
  subtitle: { people: (n: number) => (n === 1 ? "Just you so far" : `${n} in the trip`) },
  earlier: "Show earlier messages",
  /** The floating button while the reader is up the thread and newer messages came in. */
  newMessages: (n: number) => (n === 1 ? "1 new message" : n > 99 ? "99+ new messages" : `${n} new messages`),
  goThinking: "Go is thinking",
  mention: { label: "Mention someone" },
  composer: {
    srLabel: "Message",
    placeholder: "Message, or @Go",
    add: "Add",
    send: "Send",
    stopAndSend: "Stop and send voice note",
    voice: "Voice message",
    recording: "Recording voice note",
    recordingHint: "Recording…",
    cancelRecording: "Cancel recording",
    micDenied: "Allow microphone access to send a voice note",
    micUnavailable: "Voice notes aren’t supported on this device",
    photoFailed: "Couldn’t read that photo",
    fileTooBig: (mb: number) => `That file is over ${mb} MB`,
    fileType: "Photos and PDFs only",
    voiceType: "This phone records a format Go can’t take yet",
  },
  attachment: {
    photo: "Photo",
    openPhoto: "Open photo",
    openFile: (name: string) => `Open ${name}`,
    photoSub: (width: number, height: number) => `${width} × ${height}`,
    photoSaved: "Photo saved",
    photoFile: "photo.jpg",
    fileSub: (size: string) => `PDF · ${size}`,
    fileSaved: "File saved",
    fileGone: "This file can’t be shown here. Use Save to open it.",
    viewerLabel: (title: string) => `${title} preview`,
    pdf: "PDF",
    play: "Play voice note",
    pause: "Pause voice note",
    voice: "Voice note",
  },
  attach: [
    { id: "photo", emoji: "📷", label: "Photo" },
    { id: "pdf", emoji: "📄", label: "Ticket or PDF" },
  ],
  longPress: {
    reactions: ["❤️", "😂", "🔥", "👍", "😮", "🙏"],
    react: (emoji: string) => `React ${emoji}`,
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
    /** The same two for my own message, and the name the reply line uses for me. */
    askGoAboutMine: "Ask Go about your message",
    askGoAboutGo: "Ask Go about this message",
    yourself: "yourself",
    askGoPlaceholder: "Ask Go anything about this",
    cancel: "Cancel",
  },
  toasts: {
    reactFailed: "Couldn’t save your reaction. Try again.",
    copied: "Message copied",
  },
} as const;

// Canned attach-menu sends, in AttachMenu row order (photo, pdf, location, poll).
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
  fromLabel: "TRAVELLING FROM?",
  fromGroupLabel: "Travelling from",
  fromNote: "Your crew sees this",
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
  // The starting city is visible to the group (CONTRACT-APP §1.7).
  privacy: "Your crew and Go see this. Go uses it for your flights, trains and buses.",
  save: "Save",
  failed: "Couldn’t save that. Try again.",
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
  flexible: { off: "I’m flexible, any of these work", on: "You’re flexible · any of these work" },
  /** "3 hrs left" / "Voting closes in 3 hrs" come from `closes_at`; a closed vote says how it ended. */
  left: (text: string) => `${text} left`,
  closesIn: (text: string) => `Voting closes in ${text}`,
  won: (label: string) => `${label} won`,
  /** Next to the winning option's tally: "3 votes · won". */
  wonTag: "won",
  closed: "Vote closed",
  cancelled: "Vote called off",
  failed: "Couldn’t save your vote. Try again.",
  /** Read by assistive tech while a vote's card waits for its options. */
  loading: "Loading the vote",
} as const;

// Words the app adds around Go's cards and the Server's record cards (CONTRACT-APP §5). What a card itself says
// (titles, bodies, button labels) is always the card's own.
export const cards = {
  checked: (ago: string) => `checked ${ago}`,
  options: { count: (n: number) => `${n} ${n === 1 ? "option" : "options"}`, see: "See options", pending: "Sending…" },
  mandate: {
    badge: "✅ READY TO BOOK",
    upTo: (amount: string) => `Up to ${amount}`,
    refundable: { title: "Refundable only", sub: "Go books only what can be cancelled" },
    yes: "Yes, book it",
    notNow: "Not now",
    helper: "Only you see these buttons. The payment itself is confirmed on Go’s vault page.",
    waiting: (name: string) => ({ title: `${name} pays`, sub: "Waiting for their go-ahead" }),
    confirmed: (name: string) => ({ title: `${name} said yes`, sub: "Go is booking it" }),
    declined: (name: string) => ({ title: `${name} said not now`, sub: "" }),
    failed: "Couldn’t save that. Try again.",
  },
  pay: {
    badge: "💳 PAYMENT",
    freeCancel: (until: string) => `Free cancellation until ${until}`,
    expires: (when: string) => `Expires ${when}`,
    helper: "Approve opens Go’s vault page. You confirm there, never in the app.",
    waiting: (name: string) => `Waiting for ${name}`,
    state: { paid: "Paid", declined: "Declined", expired: "Expired", failed: "Payment failed", cancelled: "Cancelled" },
  },
  claim: { badge: "👤 ONE PERSON BOOKS FOR ALL" },
  ticket: { booked: (kind: string) => `${kind} · BOOKED`, cancelled: (kind: string) => `${kind} · CANCELLED`, nights: (n: number) => `${n} ${n === 1 ? "NIGHT" : "NIGHTS"}`, stub: "BOOKED" },
  expense: {
    label: "ADDED TO TRIP MONEY",
    split: (each: string, n: number) => (n === 1 ? `${each} · not split` : `${each} each · split ${n} ways`),
    cta: "Open",
    removed: "This expense was removed.",
  },
  settle: { title: "To square up", allSquare: "Everyone is square." },
  budget: { eyebrow: "THE MONEY SO FAR" },
  plan: { eyebrow: "THE PLAN", made: "Made by Go", open: "Open", day: (n: number) => `Day ${n}` },
  working: {
    running: "Working…",
    needsYou: "Needs you",
    done: "Done",
    failed: "Stopped",
    step: (i: number, n: number) => `Step ${i} of ${n}`,
    watch: "Watch live",
    open: (title: string) => `Open Go’s screen: ${title}`,
    live: "Live",
    screen: "Go’s screen, live",
    picture: "The page Go was on",
    empty: "Go hasn’t sent a picture of this page.",
    steps: "STEPS",
    stepState: { todo: "To do", doing: "Now", done: "Done", failed: "Didn’t work" },
  },
  page: { opening: "Opening…" },
  login: { done: "Logged in" },
  call: { failed: (who: string) => `Go couldn’t reach ${who}.` },
  checklist: { due: (day: string) => `due ${day}`, emoji: "📋", suggestion: "💡" },
  message: { deleted: "Message deleted", sendFailed: "Not sent. Tap to try again.", sending: "Sending…" },
} as const;

export const placeSheet = {
  why: "WHY GO PICKED IT",
  cost: "ROUGH COST EACH",
  about: "About",
  activities: "THINGS THE CREW CAN DO",
  backToAll: "Back to all options",
  /** "Priya and Rahul voted for Goa" */
  votersLine: (names: string[], place: string) =>
    `${names.length <= 2 ? names.join(" and ") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`} voted for ${place}`,
} as const;

// The group's one budget per person (CONTRACT-APP §4.4): nobody has a private one.
export const budgetSheet = {
  label: "Budget per person",
  title: "Budget per person",
  sub: "Drag to set one amount for the whole group.",
  eyebrow: "PER PERSON",
  minLabel: "₹5k",
  maxLabel: "₹60k",
  thumbs: { min: "Budget per person", max: "Maximum" },
  note: "One budget for everyone in the trip. Anyone can change it, and Go plans within it.",
  save: "Save budget",
  saved: "Saved ✓",
  failed: "Couldn’t save the budget. Try again.",
} as const;

export const staySheet = {
  subtitle: "What Go found for your dates.",
  facts: { dates: "Dates", total: "Total", share: "Each", cancellation: "Cancellation" },
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
      eyebrow: "WHERE",
      notSet: { value: "Not decided", sub: "Go suggests places from everyone’s answers", ask: "Ask Go" },
      decidedSub: "Set for the trip",
    },
    when: {
      emoji: "📅",
      eyebrow: "WHEN",
      notSet: { value: "Not set", sub: "No dates shared yet", ask: "Find dates" },
      decidedSub: (countdown: string) => countdown,
    },
    stay: {
      emoji: "🏡",
      eyebrow: "STAY",
      notSet: { value: "Not booked", sub: "Needs a place and dates first", ask: "Ask Go" },
      voteOpen: {
        eyebrow: "STAY · VOTE OPEN",
        value: (n: number) => `${n} ${n === 1 ? "stay" : "stays"} in the running`,
        sub: (voted: number, of: number, closes: string) => [`${voted} of ${of} voted`, closes].filter(Boolean).join(" · "),
        cta: "Vote",
      },
      decidedSub: "Won the vote · booking next",
      bookedSub: (payer: string) => `Booked by ${payer}`,
      status: "Booked",
    },
    budget: {
      emoji: "💰",
      eyebrow: "BUDGET PER PERSON",
      notSet: { value: "Not set", sub: "One amount for the whole group", ask: "Set" },
      decided: (amount: string) => ({ value: `${amount} each`, sub: "The group’s budget · anyone can change it" }),
    },
    travel: {
      emoji: "🧳",
      eyebrow: "YOUR TRAVEL",
      notSet: { value: "Not added", sub: "Each person picks their own way in", ask: "Find routes" },
      partial: { value: (kind: string) => `${kind} there booked`, sub: (route: string) => `${route} · return not booked`, status: "1 of 2" },
      booked: { value: "Your travel is booked", sub: (route: string) => `${route} · both ways`, status: "Booked" },
    },
  },
  reminder: {
    eyebrow: "GO · YOUR RETURN ISN’T BOOKED",
    value: (day: string) => (day ? `Book your way back on ${day}` : "Book your way back"),
    sub: "You’re booked on the way there. The return is still open.",
    cta: "Find return",
  },
  /** What a row's "Ask Go" / "Change" puts in the composer: the ask is a normal message mentioning Go. */
  asks: {
    where: "@Go suggest some places for us",
    when: "@Go find dates that work for everyone",
    stay: "@Go find us a stay",
    travel: "@Go find me ways to get there",
    changeWhere: "@Go we’d like to change the place",
    changeWhen: "@Go we’d like to change the dates",
    changeStay: "@Go we’d like to look at other stays",
    returnTrip: "@Go find me a way back",
  },
  spend: {
    eyebrow: "YOUR SPEND VS THE BUDGET",
    empty: "Shows up once the group sets a budget.",
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
  chatPreviewEmpty: "Start the trip chat",
  home: {
    statusTitle: "Nothing’s decided yet",
    statusTitleSome: "Planning in progress",
    statusSub: "Go fills this page as your crew chats",
    decided: (d: number, t: number) => `${d} of ${t} decided`,
    nextUpTitle: "Next up",
    open: (n: number) => `${n} open`,
    nextUp: [
      { key: "where", emoji: "📍", title: "Pick a place", sub: "Go suggests places from everyone’s answers", action: "Ask Go" },
      { key: "when", emoji: "📅", title: "Pick dates", sub: "Go finds a weekend that fits everyone", action: "Ask Go" },
      { key: "stay", emoji: "🏡", title: "Find a stay", sub: "Unlocks once place and dates are set", action: "Ask Go" },
      { key: "budget", emoji: "💰", title: "Set the budget", sub: "One amount per person · Go plans within it", action: "Set" },
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
    budget: { title: "Set the budget", sub: "One amount per person for the whole group. Go plans within it.", cta: "Set the budget" },
    settle: { title: "Settle up", emoji: "🤝", rowTitle: "All square", rowSub: "Shared bills get split here as they come in" },
    tx: { title: "Transactions", emoji: "🧾", rowTitle: "No payments yet", rowSub: "Every booking and payback shows here, for everyone" },
  },
} as const;

// ---------------------------------------------------------------------------
// J · Populated trip home (J-triphome-calls.md §1.2, §1.6)
// ---------------------------------------------------------------------------

export const tripHome = {
  loading: "Loading your trip",
  pendingTitle: "Pending on you",
  pendingMeta: (n: number) => `${n} left`,
  allSet: { title: "You’re all set", sub: "Nothing pending on you. Go pings you if plans change." },
  callsTitle: "Go’s calls",
  callCount: (n: number) => (n === 1 ? "1 live" : `${n} live · swipe`),
  doneTitle: "Done",
  doneLabel: (n: number, allSet: boolean) => (allSet ? `All ${n}` : `${n} done`),
  done: {
    booked: (title: string) => `${title} booked`,
    call: (who: string) => `Go’s call with ${who}`,
    paidBy: (who: string) => `paid by ${who}`,
    bothWays: "both ways",
    lineSub: { decided: "Decided by vote", agreed: "Agreed in the chat", open: "Done", doing: "Done", booked: "Booked" },
    settled: { emoji: "🤝", title: "Settled up", sub: "You owe nobody right now" },
    budget: { emoji: "💰", title: "Budget set", sub: (amount: string) => `${amount} per person · for the whole group` },
  },
  asked: (who: string) => `Asked Go to call ${who}. Watch the trip chat.`,
  askFailed: "Couldn’t reach the trip chat. Try again.",
} as const;

// ---------------------------------------------------------------------------
// L · Itinerary toggles (L-itinerary-map.md §1.4)
// ---------------------------------------------------------------------------

export const scopeToggle = { label: "Whose plan", everyone: "Everyone", me: "Just me" } as const;
export const viewToggle = { label: "View", list: "List view", map: "Map view" } as const;


export const copy = {
  sheet,
  welcome,
  home,
  profile,
  crew,
  invite,
  share,
  chat,
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
} as const;
