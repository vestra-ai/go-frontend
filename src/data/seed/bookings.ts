// Bookings tab, "Just for you" sheet and ticket viewer strings. The bookings themselves come from the Server
// (state/bookingView.ts).

export const PRIVATE_COPY = {
  title: "Just for you",
  sub: "🔒 Only you can see this. The group got the summary.",
  seat: "SEAT",
  boards: "DEPARTS",
  pnr: "PNR",
  openTicket: "Open ticket PDF",
} as const;

// Bookings page + ticket viewer strings.
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
    saved: "Saved to your phone",
    sharedInChat: "Shared in the trip chat",
    failed: "Couldn’t open the ticket. Try again.",
    page: (current: number, total: number) => `${current} / ${total}`,
    pageLabel: (current: number, total: number) => `Page ${current} of ${total}`,
  },
} as const;
