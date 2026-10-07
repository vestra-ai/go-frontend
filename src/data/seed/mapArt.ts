// Map geometry for GoaMap (plans/screens/L-itinerary-map.md §1.3). Paint order = array order.
export type MapArea = "trip" | "goa";
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
  | { t: "route"; aud: Aud; d: string; tone: MapTone; badge: { cx: number; cy: number; ty: number; emoji: string } }
  | { t: "hub"; aud: Aud; cx: number; cy: number; ty: number; emoji: string }
  | { t: "photo"; aud: Aud; id: string; cx: number; cy: number; r: 16 | 18 | 21; ri: 13 | 15 | 18; ring: "white" | "go"; img: MapImg }
  | { t: "dot"; aud: Aud; cx: number; cy: number }
  | { t: "label"; aud: Aud; x: number; y: number; anchor: "start" | "middle"; size: 9 | 10 | 12; tone: MapTone; text: string };

export const MAP_ART: Record<MapArea, { ariaLabel: string; els: MapEl[] }> = {
  trip: {
    ariaLabel: "Map of how everyone gets to Goa",
    els: [
      { t: "rect", aud: "both", tone: "map-sea" },
      {
        t: "shape",
        aud: "both",
        d: "M73 0 L71 6 L75 31 L73 63 L75 87 L79 107 L83 127 L93 168 L103 208 L111 236 L125 265 L139 293 L151 329 L163 357 L175 377 L194 410 L206 442 L214 470 L226 494 L388 520 L388 0 Z",
        tone: "map-land",
      },
      { t: "label", aud: "both", x: 14, y: 300, anchor: "start", size: 9, tone: "map-label", text: "ARABIAN SEA" },
      { t: "route", aud: "both", d: "M266 330 Q213 245 114 226", tone: "info", badge: { cx: 201, cy: 262, ty: 266, emoji: "✈️" } },
      { t: "route", aud: "everyone", d: "M76 84 Q52 167 114 226", tone: "teal", badge: { cx: 74, cy: 161, ty: 165, emoji: "🚆" } },
      { t: "route", aud: "everyone", d: "M115 106 Q151 167 114 226", tone: "amber-2", badge: { cx: 133, cy: 167, ty: 171, emoji: "🚌" } },
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
    ],
  },
  goa: {
    ariaLabel: "Places in Goa and how you get between them",
    els: [
      { t: "rect", aud: "both", tone: "map-land" },
      {
        t: "shape",
        aud: "both",
        d: "M0 0 H70 C 58 60, 40 120, 50 180 C 58 240, 40 300, 70 370 C 84 420, 70 450, 74 480 H0 Z",
        tone: "map-sea",
      },
      { t: "road", aud: "both", d: "M0 360 C 80 370, 180 290, 388 250", w: 5 },
      { t: "road", aud: "both", d: "M150 0 C 170 90, 220 200, 250 480", w: 4 },
      { t: "label", aud: "both", x: 12, y: 290, anchor: "start", size: 9, tone: "map-label", text: "ARABIAN" },
      { t: "label", aud: "both", x: 12, y: 302, anchor: "start", size: 9, tone: "map-label", text: "SEA" },
      { t: "route", aud: "both", d: "M128 214 Q130 156 100 106", tone: "go", badge: { cx: 122, cy: 158, ty: 163, emoji: "🛵" } },
      { t: "route", aud: "both", d: "M128 214 Q125 263 150 306", tone: "info", badge: { cx: 132, cy: 262, ty: 266, emoji: "🚤" } },
      { t: "route", aud: "both", d: "M128 214 Q244 178 322 84", tone: "ink", badge: { cx: 235, cy: 164, ty: 168, emoji: "🚕" } },
      { t: "route", aud: "everyone", d: "M128 214 Q219 210 292 156", tone: "teal", badge: { cx: 214, cy: 197, ty: 202, emoji: "🚕" } },
      { t: "route", aud: "everyone", d: "M128 214 Q182 232 238 218", tone: "amber-2", badge: { cx: 183, cy: 224, ty: 229, emoji: "🚕" } },
      { t: "hub", aud: "both", cx: 322, cy: 84, ty: 89, emoji: "✈️" },
      { t: "label", aud: "both", x: 322, y: 116, anchor: "middle", size: 9, tone: "muted", text: "MOPA AIRPORT" },
      { t: "hub", aud: "everyone", cx: 292, cy: 156, ty: 161, emoji: "🚆" },
      { t: "label", aud: "everyone", x: 292, y: 188, anchor: "middle", size: 9, tone: "muted", text: "THIVIM" },
      { t: "hub", aud: "everyone", cx: 238, cy: 218, ty: 223, emoji: "🚌" },
      { t: "label", aud: "everyone", x: 238, y: 250, anchor: "middle", size: 9, tone: "muted", text: "MAPUSA" },
      { t: "photo", aud: "both", id: "gv", cx: 128, cy: 214, r: 21, ri: 18, ring: "go", img: "goaPin" },
      { t: "label", aud: "both", x: 128, y: 246, anchor: "middle", size: 9, tone: "muted", text: "VILLA SOL" },
      { t: "photo", aud: "both", id: "gc", cx: 100, cy: 106, r: 18, ri: 15, ring: "white", img: "chapora" },
      { t: "label", aud: "both", x: 100, y: 138, anchor: "middle", size: 9, tone: "muted", text: "CHAPORA FORT" },
      { t: "hub", aud: "both", cx: 150, cy: 306, ty: 311, emoji: "🤿" },
      { t: "label", aud: "both", x: 172, y: 310, anchor: "start", size: 9, tone: "muted", text: "GRANDE ISLAND" },
    ],
  },
};
