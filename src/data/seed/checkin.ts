import { assets } from "@/lib/assets";
import type { CheckIn, Seat, SeatCol } from "@/data/types";

// K1–K4 (K-checkin.md §1.3–1.5). Aisle between C and D. Paid = row <= 13 and not taken (₹450).
const ROWS = [12, 13, 14, 15, 16, 17, 18];
const COLS: SeatCol[] = ["A", "B", "C", "D", "E", "F"];
const PAID_ROWS = [12, 13];
const FRIEND_SEAT = "14B";
export const TAKEN_SEATS = [
  "12A", "12C", "12D", "13B", "13E", "13F", "14C", "14E", "15A",
  "15F", "16B", "16C", "16D", "17A", "17E", "18C", "18D", "18F",
];

const SEATS: Seat[] = ROWS.flatMap((row) =>
  COLS.map((col): Seat => {
    const id = `${row}${col}`;
    const state = id === FRIEND_SEAT ? "friend" : TAKEN_SEATS.includes(id) ? "taken" : PAID_ROWS.includes(row) ? "paid" : "free";
    return { id, row, col, state };
  }),
);

export const CHECKIN: CheckIn = {
  flight: "6E 5313",
  date: "Fri 6 Nov",
  logo: assets.indigo.src,
  route: { from: "BLR", fromTime: "8:40p", fromSub: "Bengaluru T1", to: "GOX", toTime: "9:55p", toSub: "Goa · Mopa" },
  passRoute: { fromSub: "Bengaluru · T1", toSub: "Goa · Mopa" },
  passenger: { name: "Aarav Shah", sub: "Adult · name as on your ID", mobile: "+91 98••• ••210", bags: "7 kg cabin · 15 kg check-in" },
  digiYatra: true,
  declaration: true,
  seat: "14A",
  friendId: "arjun",
  friendSeat: FRIEND_SEAT,
  nextToFriend: ["14A", "14C"],
  seatPrice: "₹450",
  paidRows: PAID_ROWS,
  rows: ROWS,
  cols: COLS,
  seats: SEATS,
  pass: {
    passenger: "AARAV SHAH",
    boarding: "8:00 pm",
    departs: "8:40 pm",
    gate: "At airport",
    zone: "2",
    seq: "087",
    // 25×25 decorative bitmap (row = y, col = x, '#' = dark), 299 modules, identical to the design SVG.
    qr: [
    "#######..#####.#..#######",
    "#.....#..#..#.....#.....#",
    "#.###.#..##...##..#.###.#",
    "#.###.#.#..######.#.###.#",
    "#.###.#.....###.#.#.###.#",
    "#.....#..##.###...#.....#",
    "#######..###.#..#.#######",
    "............##.##........",
    "##.#..####.##...####..###",
    ".#.###...##.###..##..#...",
    "##..##.#..#.#..#......##.",
    "..#.#.###.#...#.#.###...#",
    ".###.#..##......##..##...",
    "....##..#..#.....###.#...",
    ".##...###......#..##....#",
    ".#..####...##...#....####",
    ".........##.....###..#...",
    ".........#...#####..##.##",
    "#######.####.#.###..#.#.#",
    "#.....#.#..#####.....#.#.",
    "#.###.#.###...###.#.#..##",
    "#.###.#.#.#.#.....##.###.",
    "#.###.#.#.#.#..##.##.##..",
    "#.....#..#.....#.#...#.##",
    "#######.#....#..##..##...",
    ],
  },
};

export const CHECKIN_DEFAULTS = { status: "not-open", digiYatra: true, declaration: true, seat: "14A" } as const;

export const CHECKIN_COPY = {
  // K1 trip-home card (P3-10 CheckinCard)
  card: {
    title: "Web check-in is open",
    badge: "NEW",
    sub: "6E 5313 · Fri 8:40 pm · closes 1 hr before",
    companion: "Arjun is on the same flight. Check in now and Go will try to seat you together.",
    cta: "Check in now",
  },
  // J3 flights-row preview link (P3-10 CheckinPreviewLink)
  preview: {
    emoji: "🎫",
    title: "Web check-in opens Wed 4 Nov",
    sub: "Go pings you and tries to seat you with Arjun",
    cta: "Preview",
  },
  steps: ["1 · Details", "2 · Seat", "3 · Boarding pass"],
  details: {
    title: "Web check-in · 6E 5313",
    sub: "Fri 6 Nov · takes under a minute",
    close: "Close",
    mobileLabel: "Mobile for flight alerts",
    bagsLabel: "Bags",
    digiYatraTitle: "Use DigiYatra at the airport",
    digiYatraSub: "Face-based entry at Bengaluru T1",
    declarationTitle: "I’m not carrying restricted items",
    declarationSub: "Power banks go in your cabin bag, not check-in",
    goNote: "Go filled this in from your booking. Next, pick a seat. Go has one saved next to Arjun.",
    cta: "Continue to seats",
  },
  seat: {
    title: "Pick your seat",
    sub: "6E 5313 · Bengaluru → Goa · Fri 8:40 pm",
    noteNextTo: (seat: string) => `${seat} is free, right next to Arjun.`,
    noteNextToTail: " I’ve picked it. Tap any free seat to change.",
    noteFree: (seat: string) => `${seat} is free.`, // DESIGN-ASSUMPTION: non-adjacent copy (K-checkin.md §1.7 #2)
    noteFreeTail: " Not next to Arjun. Tap any free seat to change.",
    front: "FRONT OF PLANE",
    legend: { free: "Free", paid: "₹450", taken: "Taken", friend: "Arjun", you: "You" },
    aria: {
      seat: (id: string) => `Seat ${id}`,
      taken: ", taken",
      paid: ", ₹450",
      free: ", free",
      friend: (id: string) => `Seat ${id}, Arjun`,
    },
    takenToast: (id: string) => `${id} is taken. Pick a free seat.`,
    cta: (seat: string, paid: boolean) => `Check in with seat ${seat}${paid ? " · ₹450" : " · free"}`,
  },
  pass: {
    title: "Boarding pass",
    back: "Back",
    shareLabel: "Share boarding pass",
    shareToast: "Boarding pass shared to Goa crew",
    successNextTo: (seat: string) => `You’re checked in. Seat ${seat}, next to Arjun.`,
    success: (seat: string) => `You’re checked in. Seat ${seat}.`, // DESIGN-ASSUMPTION: non-adjacent copy
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
    goNote: "I’ll ping you when the gate is announced and when boarding starts. Arjun’s in 14B.",
    wallet: "Save to wallet",
    walletToast: "Boarding pass added to your wallet",
    download: "Download",
  },
} as const;
