import { assets } from "@/lib/assets";
import type { Booking, DetailRow, PrivateDetails, TicketDoc } from "@/data/types";

// DESIGN-ASSUMPTION (PLAN §12.1 #12): every booking, the private sheet and check-in show the IndiGo f2
// itinerary (6E 5313 out, 6E 6142 back, PNR K7QX2M) whatever route was picked.

// DESIGN-ASSUMPTION (PLAN §12.1 #16): passenger reads "Aarav Shah" (design literal "[YOUR NAME]"); 24h times kept.
export const TICKET_DOC: TicketDoc = {
  title: "IndiGo e-ticket",
  fileName: "6E5313-K7QX2M.pdf",
  pages: 2,
  pnr: "K7QX2M",
  booked: "12 Oct 2026",
  passenger: "Aarav Shah",
  seat: "14A",
  flight: "6E 5313 · Economy",
  from: { code: "BLR", place: "Bengaluru T1", time: "Fri 6 Nov, 20:40" },
  to: { code: "GOX", place: "Goa, Mopa", time: "Fri 6 Nov, 21:55" },
};

// Trip-home done-row details (J-triphome-calls.md §1.6), also the Listen sheet's booking details.
export const STAY_DETAILS: DetailRow[] = [
  { label: "Check in", value: "Fri 6 Nov · from 2 pm" },
  { label: "Check out", value: "Mon 9 Nov · by 11 am" },
  { label: "Guests", value: "4 · you, Rahul, Priya, Arjun" },
  { label: "Address", value: "Anjuna, North Goa" },
  { label: "Paid by", value: "Rahul · your share ₹10,800" },
  { label: "Booking ref", value: "VS-24816" },
];

export const FLIGHT_DETAILS: DetailRow[] = [
  { label: "Onward", value: "Fri 6 Nov · 6E 5313 · 8:40 pm" },
  { label: "Return", value: "Mon 9 Nov · 6E 6142 · 4:10 pm" },
  { label: "PNR", value: "K7QX2M" },
  { label: "Bags", value: "7 kg cabin · 15 kg check-in" },
  { label: "Paid", value: "₹8,060 · by you" },
];

export const FLIGHT_BOOKING_ID = "travel-out"; // K4 "Download" + F7 "Open ticket PDF" target
export const STAY_BOOKING_ID = "stay";

// M1 cards in seed order (M-bookings-money.md §1.7). Both travel cards open the same K7QX2M PDF, as designed.
export const BOOKINGS: Booking[] = [
  {
    id: "travel-out",
    type: "travel-out",
    eyebrow: "FRI 6 · GETTING THERE",
    title: "Everyone to Goa",
    sub: "2 flights · 1 train · 1 bus",
    memberIds: ["aarav", "rahul", "priya", "arjun"],
    media: { kind: "logo", src: assets.indigo.src, bg: "indigo" },
    accent: "info",
    stub: { kind: "count", n: 4 },
    href: "/trips/goa/bookings/travel-out/ticket",
    details: FLIGHT_DETAILS,
    pnr: "K7QX2M",
    ticket: TICKET_DOC,
  },
  {
    id: "stay",
    type: "stay",
    eyebrow: "FRI 6 → MON 9",
    title: "Villa Sol",
    sub: "Anjuna · 3 nights · late check-in",
    memberIds: ["aarav", "rahul", "priya", "arjun"],
    media: { kind: "photo", src: assets.photos.villaSol.src, bg: "none" },
    accent: "success",
    stub: { kind: "booked" },
    href: "/trips/goa?open=stay",
    details: STAY_DETAILS,
  },
  {
    // Kept as designed: "1 flight" with 3 avatars although Arjun also flies home (M-bookings-money.md §1.8 #14).
    id: "travel-back",
    type: "travel-back",
    eyebrow: "MON 9 · GETTING BACK",
    title: "Everyone home",
    sub: "1 flight · 1 train · 1 bus",
    memberIds: ["aarav", "rahul", "priya"],
    media: { kind: "emoji", emoji: "🛬", bg: "stay-tint" },
    accent: "info",
    stub: { kind: "count", n: 3 },
    href: "/trips/goa/bookings/travel-back/ticket",
    details: FLIGHT_DETAILS,
    pnr: "K7QX2M",
    ticket: TICKET_DOC,
  },
];

export const PRIVATE_DETAILS: PrivateDetails = {
  airline: { name: "IndiGo", logo: assets.indigo.src },
  flight: "6E 5313",
  from: { code: "BLR", time: "Fri 8:40 pm" },
  to: { code: "GOX", time: "9:55 pm" },
  seat: "14A",
  boards: "8:05",
  pnr: "K7QX2M",
  bookingId: FLIGHT_BOOKING_ID,
  ret: { emoji: "🛬", title: "Return · Mon 9 Nov", sub: "6E 6142 · GOX 4:10 pm → BLR 5:25 pm" },
};

export const PRIVATE_COPY = {
  title: "Just for you",
  sub: "🔒 Only you can see this. The group got the summary.",
  seat: "SEAT",
  boards: "BOARDS",
  pnr: "PNR",
  openTicket: "Open ticket PDF",
} as const;

// Bookings page + ticket viewer strings (M-bookings-money.md §1.2–1.3).
export const BOOKINGS_COPY = {
  title: "Booked",
  count: (n: number) => `${n} bookings`,
  tickets: "TICKETS",
  booked: "BOOKED",
  viewer: {
    close: "Close",
    download: "Download",
    share: "Share",
    fileLine: (fileName: string, pages: number) => `${fileName} · ${pages} pages`,
    header: "E-TICKET / ITINERARY",
    pnr: "PNR:",
    bookedOn: "Booked:",
    passenger: "Passenger:",
    seat: "Seat:",
    fare: "Fare summary",
    save: "Save",
    page: (current: number, total: number) => `${current} / ${total}`,
    pageLabel: (current: number, total: number) => `Page ${current} of ${total}`,
  },
} as const;
