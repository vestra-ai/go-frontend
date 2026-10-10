// Web check-in strings. The check-in itself (flight, passenger, seat map, boarding pass) is the Server's `CheckinState`
// (state/checkinView.ts).

export const CHECKIN_COPY = {
  // K1 trip-home card (P3-10 CheckinCard)
  card: {
    title: "Web check-in is open",
    badge: "NEW",
    companion: (name: string) => `${name} is on the same flight. Check in now and Go will try to seat you together.`,
    cta: "Check in now",
  },
  // J3 flights-row preview link (P3-10 CheckinPreviewLink)
  preview: {
    emoji: "🎫",
    title: (when: string) => `Web check-in opens ${when}`,
    sub: "Go tells you in the trip chat when it opens",
    cta: "Preview",
  },
  steps: ["1 · Details", "2 · Seat", "3 · Boarding pass"],
  details: {
    title: (flight: string) => (flight ? `Web check-in · ${flight}` : "Web check-in"),
    sub: (date: string) => (date ? `${date} · takes under a minute` : "Takes under a minute"),
    passengerSub: "Adult · name as on your ID",
    close: "Close",
    mobileLabel: "Mobile for flight alerts",
    bagsLabel: "Bags",
    digiYatraTitle: "Use DigiYatra at the airport",
    digiYatraSub: (airport: string) => (airport ? `Face-based entry at ${airport}` : "Face-based entry at the airport"),
    declarationTitle: "I’m not carrying restricted items",
    declarationSub: "Power banks go in your cabin bag, not check-in",
    goNote: (friend: string | null) =>
      friend
        ? `Go filled this in from your booking. Next, pick a seat. Go looks for one next to ${friend}.`
        : "Go filled this in from your booking. Next, pick a seat.",
    cta: "Continue to seats",
    failed: "Couldn’t save that. Try again.",
  },
  seat: {
    title: "Pick your seat",
    noteNextTo: (seat: string, friend: string) => `${seat} is free, right next to ${friend}.`,
    noteNextToTail: " Tap any free seat to change.",
    noteFree: (seat: string) => `${seat} is free.`,
    noteFreeTail: (friend: string | null) => (friend ? ` Not next to ${friend}. Tap any free seat to change.` : " Tap any free seat to change."),
    noteNone: "Tap a free seat to pick it.",
    front: "FRONT OF PLANE",
    legend: { free: "Free", paid: "Paid", taken: "Taken", you: "You" },
    aria: {
      seat: (id: string) => `Seat ${id}`,
      taken: ", taken",
      paid: (price: string) => (price ? `, ${price}` : ", paid"),
      free: ", free",
      friend: (id: string, name: string) => `Seat ${id}, ${name}`,
    },
    takenToast: (id: string) => `${id} is taken. Pick a free seat.`,
    // A paid seat is a payment (CONTRACT-APP §4.12): the vault pays first, then Go sets the seat.
    paidToast: (id: string, price: string) => `Seat ${id} costs ${price}. Go posts the payment in the trip chat.`,
    cta: (seat: string) => (seat ? `Check in with seat ${seat}` : "Pick a seat"),
    working: "Go is finishing your check-in. The boarding pass shows up here in a moment.",
    failed: "Couldn’t check you in. Try again.",
  },
  pass: {
    title: "Boarding pass",
    back: "Back",
    shareLabel: "Share boarding pass",
    successNextTo: (seat: string, friend: string) => `You’re checked in. Seat ${seat}, next to ${friend}.`,
    success: (seat: string) => (seat ? `You’re checked in. Seat ${seat}.` : "You’re checked in."),
    working: "Go is finishing your check-in with the airline…",
    notReady: "Your boarding pass isn’t ready yet.",
    fields: {
      passenger: "PASSENGER",
      date: "DATE",
      boarding: "BOARDING",
      departs: "DEPARTS",
      seat: "SEAT",
      gate: "GATE",
      zone: "ZONE",
      seq: "SEQ",
    },
    qrLabel: "Boarding pass QR code",
    digiYatra: "🙂 DigiYatra on",
    digiYatraHelp: "Show this at security if DigiYatra isn’t working.",
    goNote: (friend: string | null, friendSeat: string | null) =>
      friend && friendSeat
        ? `I’ll tell you in the trip chat when the gate is announced. ${friend}’s in ${friendSeat}.`
        : "I’ll tell you in the trip chat when the gate is announced.",
    download: "Open ticket",
  },
} as const;
