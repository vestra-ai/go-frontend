import { assets } from "@/lib/assets";
import type { Stay } from "@/data/types";

const DATES = "Fri 6 → Mon 9 Nov · 3 nights";

// E8–E11 (E-deciding.md §1.6). Seed tallies: Villa Sol 2, Casa Azul 1, The Palms 0.
export const STAYS: Stay[] = [
  {
    id: "sol",
    name: "Villa Sol",
    area: "Anjuna",
    areaLong: "Anjuna, North Goa · 5 min to Anjuna beach",
    priceLabel: "₹10.8k each",
    rating: "4.7",
    reviews: "212 reviews",
    tags: "🏊 Private pool · 3 rooms",
    img: assets.photos.villaSol.src,
    amenities: ["🏊 Private pool", "🛏️ 3 bedrooms", "🍳 Kitchen", "📶 Wi-Fi", "🅿️ Parking", "🧑‍🍳 Caretaker"],
    dates: DATES,
    totalFor4: "₹43,200",
    yourShare: "₹10,800 · inside your ₹21.8k",
    cancellation: "Free cancellation till 1 Nov",
    voters: ["rahul", "arjun"],
  },
  {
    id: "azul",
    name: "Casa Azul",
    area: "Assagao",
    areaLong: "Assagao, North Goa · 12 min to Anjuna beach",
    priceLabel: "₹9.6k each",
    rating: "4.5",
    reviews: "98 reviews",
    tags: "🌿 Garden · 2 rooms + loft",
    img: assets.photos.casaAzul.src,
    amenities: ["🌿 Garden", "🛏️ 2 rooms + loft", "🍳 Kitchen", "📶 Wi-Fi", "🐶 Pet friendly", "🚗 Parking"],
    dates: DATES,
    totalFor4: "₹38,400",
    yourShare: "₹9,600 · inside your ₹21.8k",
    cancellation: "Free cancellation till 30 Oct",
    voters: ["priya"],
  },
  {
    id: "palms",
    name: "The Palms",
    area: "Vagator",
    areaLong: "Vagator, North Goa · On the cliff above Vagator beach",
    priceLabel: "₹12.4k each",
    rating: "4.8",
    reviews: "341 reviews",
    tags: "🌅 Sea view · 3 rooms",
    img: assets.photos.thePalms.src,
    amenities: ["🌅 Sea view", "🛏️ 3 bedrooms", "🏊 Shared pool", "📶 Wi-Fi", "🍹 Bar", "🧹 Daily cleaning"],
    dates: DATES,
    totalFor4: "₹49,600",
    yourShare: "₹12,400 · inside your ₹21.8k",
    cancellation: "Non-refundable",
    voters: [],
  },
];
