import { assets } from "@/lib/assets";
import type { PastTrip } from "@/data/types";

export const PAST_TRIPS: PastTrip[] = [
  {
    id: "pondy",
    title: "Pondy weekend",
    sub: "Aug 2026 · 5 people · all settled",
    tintClass: "bg-amber-tint",
    img: assets.illustrations.pondy.src,
  },
  {
    id: "coorg",
    title: "Coorg with the college gang",
    sub: "Mar 2026 · 7 people · all settled",
    tintClass: "bg-green-tint",
    img: assets.illustrations.coorg.src,
  },
];
