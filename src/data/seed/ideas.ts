import { assets } from "@/lib/assets";
import type { Idea } from "@/data/types";

// A4 ideas carousel (A-onboarding.md §1.3). Every card links to /trips/new (Goa draft), as designed.
export const IDEAS: Idea[] = [
  { id: "goa", name: "Goa", tag: "Beaches", travelEmoji: "✈️", travel: "1h flight", tintClass: "bg-amber-soft", img: assets.illustrations.goa.src },
  { id: "coorg", name: "Coorg", tag: "Coffee hills", travelEmoji: "🚗", travel: "6h drive", tintClass: "bg-green-tint", img: assets.illustrations.coorg.src },
  { id: "gokarna", name: "Gokarna", tag: "Quiet beaches", travelEmoji: "🚗", travel: "8h drive", tintClass: "bg-info-tint", img: assets.illustrations.gokarna.src },
  { id: "jaipur", name: "Jaipur", tag: "Palaces", travelEmoji: "✈️", travel: "2.5h flight", tintClass: "bg-peach-tint", img: assets.illustrations.jaipur.src },
  { id: "pondy", name: "Pondy", tag: "French town", travelEmoji: "🚗", travel: "6h drive", tintClass: "bg-amber-tint", img: assets.illustrations.pondy.src },
  { id: "hampi", name: "Hampi", tag: "Ruins", travelEmoji: "🚆", travel: "9h train", tintClass: "bg-peach-tint-2", img: assets.illustrations.hampi.src },
];
