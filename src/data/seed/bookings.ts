// Bookings tab, "Just for you" sheet and ticket viewer strings. The bookings themselves come from the Server
// (state/bookingView.ts).

export const PRIVATE_COPY = {
  title: "Just for you",
  sub: "🔒 Only you can see this. The group got the summary.",
  /** Any other booking (a stay, a journey booked for several people): nothing about it is mine alone. */
  sharedTitle: (stay: boolean) => (stay ? "Your stay" : "Your booking"),
  sharedSub: (people: number) => (people > 1 ? `👥 Booked for ${people} of you. Everyone on it can see this.` : "Booked for you."),
  seat: "SEAT",
  boards: "DEPARTS",
  pnr: "PNR",
  checkIn: "CHECK-IN",
  checkOut: "CHECK-OUT",
  nights: "NIGHTS",
  openTicket: "Open ticket PDF",
  openVoucher: "Open voucher PDF",
  openReturn: "Open the return ticket PDF",
  openFile: (name: string) => `Open ${name}`,
  file: (size: string) => `PDF · ${size}`,
  onItsWay: "Ticket PDF on its way…",
} as const;

// Bookings page + ticket viewer strings.
export const BOOKINGS_COPY = {
  title: "Booked",
  count: (n: number) => `${n} ${n === 1 ? "booking" : "bookings"}`,
  tickets: (n: number) => (n === 1 ? "TICKET" : "TICKETS"),
  booked: "BOOKED",
  viewer: {
    close: "Close",
    download: "Download",
    share: "Share",
    fileLine: (fileName: string, pages: number) => `${fileName} · ${pages} ${pages === 1 ? "page" : "pages"}`,
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
