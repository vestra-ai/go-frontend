import type { MapCard, MapSpot, SpotKey } from "@/data/types";

// Geometry is owned by P1-6 (seed/mapArt.ts); this module re-exports it and never edits it.
export * from "@/data/seed/mapArt";
import { BLEED_X, BLEED_Y, type MapAudience } from "@/data/seed/mapArt";

// Spot aria-labels (L-itinerary-map.md §1.4).
export const MAP_NAMES: Record<SpotKey, string> = {
  blr: "Bengaluru route",
  bom: "Mumbai route",
  pnq: "Pune route",
  goa: "Goa",
};

const spot = (key: SpotKey, x: number, y: number, audience: MapSpot["audience"], photo?: string): MapSpot => ({
  key,
  x,
  y,
  audience,
  label: MAP_NAMES[key],
  ...(photo !== undefined && { photo }),
});

// Hit targets in viewBox units (388×480), DOM order, shared by "Getting there" and "Coming back" (same geography).
// Keys repeat (avatar + route badge) so both ring together.
// Visible = audience === 'both' || audience === scope: everyone 8, me 3.
export const MAP_SPOTS: MapSpot[] = [
  spot("goa", 114, 226, "both"),
  // Two travellers = two avatars (Aarav 266, Arjun 284), each with its own ring when selected.
  spot("blr", 266, 330, "everyone", "blr0"),
  spot("blr", 284, 330, "everyone", "blr1"),
  spot("blr", 266, 330, "me", "blr0"),
  spot("blr", 201, 262, "both"),
  spot("bom", 76, 84, "everyone", "bom0"),
  spot("bom", 74, 161, "everyone"),
  spot("pnq", 115, 106, "everyone", "pnq0"),
  spot("pnq", 133, 167, "everyone"),
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
    button: "See the way back",
    action: { kind: "back" },
    me: { sub: "Fri 6 – Mon 9 Nov · your stay", line: "You check in Fri 11 pm" },
  },
};

// "Coming back" cards: the return leg of each route, Mon 9 Nov.
export const MAP_BACK_CARDS: Record<SpotKey, MapCard> = {
  blr: {
    icon: "✈️",
    title: "You + Arjun · back to Bengaluru",
    sub: "IndiGo 6E 6142 · Mon 4:10 pm → 5:25 pm",
    line: "From Mopa Airport (GOX) · 🚕 about 50 min from the villa",
    button: "Flight details",
    action: { kind: "href", href: "/trips/goa?open=fly" },
    me: { title: "Your flight back to Bengaluru", line: "From Mopa Airport (GOX) · with Arjun" },
  },
  bom: {
    icon: "🚆",
    title: "Rahul · back to Mumbai",
    sub: "Train from Thivim · Mon 9:40 pm",
    line: "🚕 about 30 min from the villa to Thivim",
    button: "Message Rahul",
    action: { kind: "href", href: "/trips/goa/chat" },
  },
  pnq: {
    icon: "🚌",
    title: "Priya · back to Pune",
    sub: "AC sleeper from Mapusa · Mon 8:30 pm",
    line: "🚕 about 20 min from the villa to Mapusa",
    button: "Message Priya",
    action: { kind: "href", href: "/trips/goa/chat" },
  },
  goa: {
    icon: "🏡",
    title: "Goa · Villa Sol, Anjuna",
    sub: "Check out Mon 9 Nov · 11 am · all 4 of you",
    line: "Last one leaves Mon 9:40 pm",
    button: "Directions",
    action: { kind: "toast", text: "Opens directions to Villa Sol in Google Maps" },
    me: { sub: "Check out Mon 9 Nov · 11 am · your stay", line: "Your flight leaves Mon 4:10 pm" },
  },
};

// Resting view of the map: the cities, routes and labels centred in the card (the art itself leans to the upper left),
// no zoom. The art is drawn past its edges (BLEED_*), so shifting it shows no seam. Fractions are of the 388×480 art;
// each audience centres its own content sideways. Vertically the art already sits clear of the detail card docked at
// the bottom, so it stays where it was.
export const MAP_HOME: Record<MapAudience, { s: number; fx: number; fy: number }> = {
  everyone: { s: 1, fx: 163 / 388, fy: 0.5 },
  me: { s: 1, fx: 176 / 388, fy: 0.5 },
};
export const MAP_BLEED = { x: BLEED_X / 388, y: BLEED_Y / 480 };

export const MAP_COPY = {
  hint: "Tap a pin or a dotted route",
  areaLabel: "Map area",
  areas: { trip: "Getting there", back: "Coming back" },
  // The one plain word beside each journey icon in the switch.
  areaWord: { trip: "Onward", back: "Return" },
  close: "Close",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
} as const;
