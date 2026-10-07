import { assets } from "@/lib/assets";
import { HOME_CARDS } from "@/data/seed/homeCards";
import type { Trip, TripId } from "@/data/types";

// Seed trips (PLAN §9.2). `memberIds` is the state right after creation / before acceptance;
// the store appends joins (simulateJoins, acceptInvite).
export const TRIPS: Record<TripId, Trip> = {
  goa: {
    id: "goa",
    name: "Goa crew",
    destination: "Goa",
    emoji: "🌴",
    dates: {
      label: "Diwali · Fri 6 – Mon 9 Nov",
      short: "Diwali · 6–9 Nov",
      chip: "Nov 6–9",
      range: "Fri 6 – Mon 9 Nov",
      countdown: "in 34 days",
    },
    cover: { src: assets.photos.goaBeach.src, alt: "Goa beach" },
    hero: { src: assets.photos.goaSunset.src, alt: "Palm silhouette against a Goa sunset over the sea" },
    illustration: assets.illustrations.goa.src,
    tint: "amber",
    tintClass: "bg-amber-soft",
    memberIds: ["aarav"],
    organizerId: "aarav",
    inviteCode: "goa-k7q",
    inviteUrl: "go.vestra.ai/t/goa-k7q",
    whatsappGroup: "Goa crew 🌴",
    stage: "new",
    budgetLabel: "₹21.8k",
    fromCity: "Bengaluru",
    homeCard: HOME_CARDS.goa,
  },
  // DESIGN-ASSUMPTION: College gang never shows an invite link or WhatsApp group in the design;
  // the code, group name and emoji below only exist so its share sheet has something to render.
  college: {
    id: "college",
    name: "College gang",
    emoji: "🎒",
    tint: "amber",
    tintClass: "bg-amber-soft",
    memberIds: ["aarav", "rahul"],
    organizerId: "aarav",
    inviteCode: "college-m2p",
    inviteUrl: "go.vestra.ai/t/college-m2p",
    whatsappGroup: "College gang 🎒",
    stage: "new",
    homeCard: HOME_CARDS.college,
  },
  bali: {
    id: "bali",
    name: "Bali crew",
    destination: "Bali",
    emoji: "🌴",
    dates: {
      label: "Christmas · Fri 25 – Mon 28 Dec",
      short: "Christmas · 25–28 Dec",
      chip: "Dec 25–28",
      range: "Fri 25 – Mon 28 Dec",
      countdown: "in 83 days", // DESIGN-ASSUMPTION: not shown in G1–G3; same mock "today" as Goa's "in 34 days"
    },
    // DESIGN-ASSUMPTION (B-crew.md §1.6 #6, PLAN §12.1 #18): no Goa photos for Bali → hero bg-sunset fallback,
    // invite card uses the illustration. The design reuses the Gokarna hut for the Bali avatar.
    illustration: assets.illustrations.gokarna.src,
    tint: "info",
    tintClass: "bg-info-tint",
    memberIds: ["priya", "kabir"],
    organizerId: "priya",
    inviteCode: "bali-x9m",
    inviteUrl: "go.vestra.ai/t/bali-x9m",
    whatsappGroup: "Bali crew 🌴", // DESIGN-ASSUMPTION: the design reused "Goa crew 🌴"
    stage: "deciding",
    budgetLabel: "₹55k",
    fromCity: "Bengaluru",
    homeCard: HOME_CARDS.bali,
  },
};

export const TRIP_IDS: TripId[] = ["goa", "college", "bali"];
