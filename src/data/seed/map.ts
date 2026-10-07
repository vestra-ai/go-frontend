import type { MapCard, MapSpot, SpotKey } from "@/data/types";

// Geometry is owned by P1-6 (seed/mapArt.ts); this module re-exports it and never edits it.
export * from "@/data/seed/mapArt";

// Spot aria-labels (L-itinerary-map.md §1.4).
export const MAP_NAMES: Record<SpotKey, string> = {
  blr: "Bengaluru route",
  bom: "Mumbai route",
  pnq: "Pune route",
  goa: "Goa",
  villa: "Villa Sol",
  chapora: "Chapora Fort",
  grande: "Grande Island",
  mopa: "Mopa Airport",
  thivim: "Thivim station",
  mapusa: "Mapusa bus stand",
};

const spot = (key: SpotKey, x: number, y: number, area: MapSpot["area"], audience: MapSpot["audience"]): MapSpot => ({
  key,
  x,
  y,
  area,
  audience,
  label: MAP_NAMES[key],
});

// Hit targets in viewBox units (388×480), DOM order. Keys repeat (pin + route badge) so both ring together.
// Visible = area === current && (audience === 'both' || audience === scope): trip/everyone 7, trip/me 3, goa/everyone 11, goa/me 7.
export const MAP_SPOTS: MapSpot[] = [
  spot("goa", 114, 226, "trip", "both"),
  spot("blr", 275, 330, "trip", "everyone"),
  spot("blr", 266, 330, "trip", "me"),
  spot("blr", 201, 262, "trip", "both"),
  spot("bom", 76, 84, "trip", "everyone"),
  spot("bom", 74, 161, "trip", "everyone"),
  spot("pnq", 115, 106, "trip", "everyone"),
  spot("pnq", 133, 167, "trip", "everyone"),
  spot("chapora", 122, 158, "goa", "both"),
  spot("grande", 132, 262, "goa", "both"),
  spot("mopa", 235, 164, "goa", "both"),
  spot("thivim", 214, 197, "goa", "everyone"),
  spot("mapusa", 183, 224, "goa", "everyone"),
  spot("mopa", 322, 84, "goa", "both"),
  spot("thivim", 292, 156, "goa", "everyone"),
  spot("mapusa", 238, 218, "goa", "everyone"),
  spot("villa", 128, 214, "goa", "both"),
  spot("chapora", 100, 106, "goa", "both"),
  spot("grande", 150, 306, "goa", "both"),
];

// Resolved card = audience === 'me' ? { ...card, ...card.me } : card.
// Toasts are stored literally; they equal 'Opens directions to ' + title.split(' · ')[0] + ' in Google Maps'.
export const MAP_CARDS: Record<SpotKey, MapCard> = {
  blr: {
    icon: "✈️",
    title: "You + Arjun · from Bengaluru",
    sub: "IndiGo 6E 5313 · Fri 8:40 pm → 9:55 pm",
    line: "Back Mon 9 Nov · 6E 6142 · 4:10 pm",
    button: "Flight details",
    action: { kind: "href", href: "/trips/goa?open=fly" },
    me: { title: "Your flight from Bengaluru", line: "Back Mon 9 Nov · 6E 6142 · 4:10 pm · with Arjun" },
  },
  bom: {
    icon: "🚆",
    title: "Rahul · from Mumbai",
    sub: "Overnight train · reaches Thivim Sat 10:30 am",
    line: "Back Mon 9 Nov · 9:40 pm from Thivim",
    button: "Message Rahul",
    action: { kind: "href", href: "/trips/goa/chat" },
  },
  pnq: {
    icon: "🚌",
    title: "Priya · from Pune",
    sub: "AC sleeper · reaches Mapusa Sat 9:15 am",
    line: "Back Mon 9 Nov · 8:30 pm from Mapusa",
    button: "Message Priya",
    action: { kind: "href", href: "/trips/goa/chat" },
  },
  goa: {
    icon: "🏡",
    title: "Goa · Villa Sol, Anjuna",
    sub: "Fri 6 – Mon 9 Nov · all 4 of you",
    line: "Everyone is in by Sat 10:30 am",
    button: "See places in Goa",
    action: { kind: "goa" },
    me: { sub: "Fri 6 – Mon 9 Nov · your stay", line: "You check in Fri 11 pm" },
  },
  villa: {
    icon: "🏡",
    title: "Villa Sol · Anjuna",
    sub: "Check in Fri 6 Nov · 11 pm, late check-in confirmed",
    line: "Check out Mon 9 Nov · 11 am",
    button: "Directions",
    action: { kind: "toast", text: "Opens directions to Villa Sol in Google Maps" },
  },
  chapora: {
    icon: "🛵",
    title: "Chapora Fort",
    sub: "Sat 7 Nov · 4:00 pm · scooters and sunset",
    line: "🛵 about 15 min from the villa",
    button: "Directions",
    action: { kind: "toast", text: "Opens directions to Chapora Fort in Google Maps" },
  },
  grande: {
    icon: "🤿",
    title: "Scuba · Grande Island",
    sub: "Sun 8 Nov · 9:00 am · you + Priya",
    line: "🚤 boat out · ₹7,000 each",
    button: "Directions",
    // Kept as designed: the toast says "Scuba" (L-itinerary-map.md §1.6 #9).
    action: { kind: "toast", text: "Opens directions to Scuba in Google Maps" },
  },
  mopa: {
    icon: "✈️",
    title: "Mopa Airport (GOX)",
    sub: "You + Arjun land Fri 9:55 pm",
    line: "🚕 about 50 min to the villa",
    button: "Directions",
    action: { kind: "toast", text: "Opens directions to Mopa Airport (GOX) in Google Maps" },
    me: { sub: "You land Fri 9:55 pm, with Arjun" },
  },
  thivim: {
    icon: "🚆",
    title: "Thivim station",
    sub: "Rahul arrives Sat 10:30 am",
    line: "🚕 about 30 min to the villa",
    button: "Directions",
    action: { kind: "toast", text: "Opens directions to Thivim station in Google Maps" },
  },
  mapusa: {
    icon: "🚌",
    title: "Mapusa bus stand",
    sub: "Priya arrives Sat 9:15 am",
    line: "🚕 about 20 min to the villa",
    button: "Directions",
    action: { kind: "toast", text: "Opens directions to Mapusa bus stand in Google Maps" },
  },
};

export const MAP_COPY = {
  hint: "Tap a pin or a dotted route",
  areaLabel: "Map area",
  areas: { trip: "Getting there", goa: "In Goa" },
  close: "Close",
} as const;
