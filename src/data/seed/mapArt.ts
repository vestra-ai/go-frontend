import type { SpotKey } from "@/data/types";

// Map geometry for GoaMap (plans/screens/L-itinerary-map.md §1.3). Paint order = array order.
export type MapArea = "trip" | "back";
export type MapAudience = "everyone" | "me";
type Aud = MapAudience | "both";
export type MapTone =
  | "map-sea"
  | "map-land"
  | "map-road"
  | "map-label"
  | "muted"
  | "faint"
  | "ink"
  | "go"
  | "info"
  | "teal"
  | "amber-2"
  | "white";
export type MapImg = "aarav" | "arjun" | "rahul" | "priya" | "goaPin" | "chapora";
export type MapEl =
  | { t: "rect"; aud: Aud; tone: MapTone }
  | { t: "shape"; aud: Aud; d: string; tone: MapTone }
  | { t: "road"; aud: Aud; d: string; w: 4 | 5 }
  | { t: "route"; aud: Aud; d: string; tone: MapTone; key: SpotKey; badge: { cx: number; cy: number; ty: number; emoji: string } }
  | { t: "hub"; aud: Aud; cx: number; cy: number; ty: number; emoji: string }
  | { t: "photo"; aud: Aud; id: string; cx: number; cy: number; r: 16 | 18 | 21; ri: 13 | 15 | 18; ring: "white" | "go"; img: MapImg }
  | { t: "dot"; aud: Aud; cx: number; cy: number }
  | { t: "label"; aud: Aud; x: number; y: number; anchor: "start" | "middle" | "end"; size: 9 | 10 | 12; tone: MapTone; text: string };

const baseEls: MapEl[] = [
  { t: "rect", aud: "both", tone: "map-sea" },
  {
    t: "shape",
    aud: "both",
    d: "M73 -120 L73 0 L71 6 L75 31 L73 63 L75 87 L79 107 L83 127 L93 168 L103 208 L111 236 L125 265 L139 293 L151 329 L163 357 L175 377 L194 410 L206 442 L214 470 L226 494 L240 620 L588 620 L588 -120 Z",
    tone: "map-land",
  },
  { t: "label", aud: "both", x: 14, y: 300, anchor: "start", size: 9, tone: "map-label", text: "ARABIAN SEA" },
  { t: "route", aud: "both", d: "M266 330 Q213 245 114 226", tone: "info", key: "blr", badge: { cx: 201, cy: 262, ty: 266, emoji: "✈️" } },
  { t: "route", aud: "everyone", d: "M76 84 Q52 167 114 226", tone: "teal", key: "bom", badge: { cx: 74, cy: 161, ty: 165, emoji: "🚆" } },
  { t: "route", aud: "everyone", d: "M115 106 Q151 167 114 226", tone: "amber-2", key: "pnq", badge: { cx: 133, cy: 167, ty: 171, emoji: "🚌" } },
  { t: "dot", aud: "me", cx: 76, cy: 84 },
  { t: "label", aud: "me", x: 76, y: 100, anchor: "middle", size: 9, tone: "faint", text: "MUMBAI" },
  { t: "dot", aud: "me", cx: 115, cy: 106 },
  { t: "label", aud: "me", x: 115, y: 122, anchor: "middle", size: 9, tone: "faint", text: "PUNE" },
  { t: "photo", aud: "both", id: "blr0", cx: 266, cy: 330, r: 16, ri: 13, ring: "white", img: "aarav" },
  { t: "photo", aud: "everyone", id: "blr1", cx: 284, cy: 330, r: 16, ri: 13, ring: "white", img: "arjun" },
  { t: "label", aud: "everyone", x: 275, y: 308, anchor: "middle", size: 10, tone: "muted", text: "BENGALURU" },
  { t: "label", aud: "me", x: 266, y: 308, anchor: "middle", size: 10, tone: "muted", text: "BENGALURU" },
  { t: "photo", aud: "everyone", id: "bom0", cx: 76, cy: 84, r: 16, ri: 13, ring: "white", img: "rahul" },
  { t: "label", aud: "everyone", x: 76, y: 114, anchor: "middle", size: 10, tone: "muted", text: "MUMBAI" },
  { t: "photo", aud: "everyone", id: "pnq0", cx: 115, cy: 106, r: 16, ri: 13, ring: "white", img: "priya" },
  { t: "label", aud: "everyone", x: 135, y: 110, anchor: "start", size: 10, tone: "muted", text: "PUNE" },
  { t: "photo", aud: "both", id: "goa", cx: 114, cy: 226, r: 21, ri: 18, ring: "go", img: "goaPin" },
  { t: "label", aud: "both", x: 140, y: 230, anchor: "start", size: 12, tone: "ink", text: "GOA" },
]; // end baseEls

// "Coming back" reuses the way-there map with every route run from Goa out to the traveller's city.
const reverseRoute = (el: Extract<MapEl, { t: "route" }>): MapEl => ({
  ...el,
  d: el.d.replace(/^M(\S+ \S+) Q(\S+ \S+) (\S+ \S+)$/, "M$3 Q$2 $1"),
});

// Each route carries its travel date beside the badge (keyed by route tone), on the side of the badge that has room.
const DATE_SPOT: Record<string, { dx: number; dy: number; anchor: "start" | "end" }> = {
  info: { dx: -18, dy: 12, anchor: "end" },
  teal: { dx: -18, dy: 0, anchor: "end" },
  "amber-2": { dx: 17, dy: 0, anchor: "start" },
};
const withDates = (els: MapEl[], date: string, flip: boolean): MapEl[] =>
  els.flatMap((el) => {
    if (el.t !== "route") return [el];
    const spot = DATE_SPOT[el.tone];
    const route = flip ? reverseRoute(el) : el;
    if (!spot) return [route];
    const label: MapEl = { t: "label", aud: el.aud, x: el.badge.cx + spot.dx, y: el.badge.ty + spot.dy, anchor: spot.anchor, size: 9, tone: el.tone, text: date };
    return [route, label];
  });

// All three travel the same day each way (the train and bus overnight on Fri 6, so they depart that day too).
// How far the art is drawn past its 388×480 viewBox on each side (viewBox units).
export const BLEED_X = 120;
export const BLEED_Y = 120;

export const MAP_ART: Record<MapArea, { ariaLabel: string; els: MapEl[] }> = {
  trip: { ariaLabel: "Map of how everyone gets to Goa", els: withDates(baseEls, "FRI 6", false) },
  back: { ariaLabel: "Map of how everyone gets back from Goa", els: withDates(baseEls, "MON 9", true) },
};
