import { assets } from "@/lib/assets";
import type { PlaceOption } from "@/data/types";

// E1–E4 (E-deciding.md §1.6). Two detail layouts kept as designed (PLAN §12.1 #9).
export const PLACES: PlaceOption[] = [
  {
    id: "goa",
    name: "Goa",
    meta: "Beaches · ✈️ 1h flight",
    est: "~₹21k each",
    why: "Fits all budgets · great in Nov",
    img: assets.illustrations.goa.src,
    tint: "bg-amber-soft",
    voters: ["priya", "rahul"],
    details: {
      layout: "rich",
      subtitle: "Why it made the list, and what it’ll roughly cost.",
      hero: { src: assets.photos.goaBeach.src, alt: "Palolem beach, Goa" },
      caption: "Beaches · ✈️ 1h flight from Bengaluru",
      price: "~₹21k each",
      whyRows: ["Fits everyone’s budget (₹15–25k each)", "Dry, sunny weather in November", "Nonstop flights after work on Friday"],
      cost: [
        { label: "Stay, 3 nights", emoji: "🏡", value: "₹10–12k" },
        { label: "Travel, both ways", emoji: "✈️", value: "₹7–9k" },
      ],
      total: "₹21k",
      activities: ["🏖️ Beaches", "🛵 Scooter rides", "🌅 Sunset spots", "🤿 Scuba", "⛪ Old Goa", "🛍️ Night markets"],
      votersLine: "Priya and Rahul voted for Goa",
    },
  },
  {
    id: "gokarna",
    name: "Gokarna",
    meta: "Quiet beaches · 🚗 8h drive",
    est: "~₹12k each",
    why: "Cheapest · drive together",
    img: assets.illustrations.gokarna.src,
    tint: "bg-info-tint",
    voters: [],
    details: {
      layout: "light",
      subtitle: "Quiet beaches · temple town",
      tint: "bg-info-tint",
      img: assets.illustrations.gokarna.src,
      facts: [
        { label: "Getting there", value: "🚗 About 8 hours by road, or train to Gokarna Road" },
        { label: "Rough cost", value: "~₹12k each, all-in" },
        { label: "Good for", value: "Beach hopping, cliff walks, slow days" },
        { label: "Early Nov", value: "Warm and dry after the monsoon" },
      ],
      goNote: "Cheapest option. You could all drive down together.",
    },
  },
  {
    id: "udaipur",
    name: "Udaipur",
    meta: "Lakes · ✈️ 2.5h flight",
    est: "~₹26k each",
    why: "Diwali lights · a bit pricier",
    img: assets.illustrations.udaipur.src,
    tint: "bg-info-tint-3",
    voters: ["arjun"],
    details: {
      layout: "light",
      subtitle: "Lakes and palaces",
      tint: "bg-info-tint-3",
      img: assets.illustrations.udaipur.src,
      facts: [
        { label: "Getting there", value: "✈️ About 2.5 hours by air" },
        { label: "Rough cost", value: "~₹26k each, all-in" },
        { label: "Good for", value: "Lake views, old city, Diwali lights" },
        { label: "Early Nov", value: "Warm days, cool evenings" },
      ],
      goNote: "Pricier, and Diwali week books up fast.",
    },
  },
];
