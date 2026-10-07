import { assets } from "@/lib/assets";
import type { User, UserId } from "@/data/types";

export const SESSION_USER_ID: UserId = "aarav";

// DESIGN-ASSUMPTION (PLAN §12.1 #1): Kabir chats but is never in avatar stacks or "of 4" counts.
// Tones are not in the design (avatars are photos); they only drive the initials fallback.
export const USERS: Record<UserId, User> = {
  aarav: {
    id: "aarav",
    name: "Aarav Shah",
    firstName: "Aarav",
    initials: "AS",
    tone: "amber",
    city: "Bengaluru",
    cityCode: "BLR",
    email: "aarav.shah@gmail.com",
    avatar: assets.avatars.aarav.src,
  },
  rahul: {
    id: "rahul",
    name: "Rahul Verma",
    firstName: "Rahul",
    initials: "RV",
    tone: "info",
    city: "Mumbai",
    cityCode: "BOM",
    avatar: assets.avatars.rahul.src,
  },
  priya: {
    id: "priya",
    name: "Priya Nair",
    firstName: "Priya",
    initials: "PN",
    tone: "peach",
    city: "Pune",
    cityCode: "PNQ",
    avatar: assets.avatars.priya.src,
  },
  arjun: {
    id: "arjun",
    name: "Arjun",
    firstName: "Arjun",
    initials: "A",
    tone: "success",
    city: "Bengaluru",
    cityCode: "BLR",
    avatar: assets.avatars.arjun.src,
  },
  kabir: {
    id: "kabir",
    name: "Kabir",
    firstName: "Kabir",
    initials: "K",
    tone: "go",
    city: "Kochi",
    cityCode: "COK",
    avatar: assets.avatars.kabir.src,
  },
};

// The four people every "of 4" / "split 4 ways" string counts (PLAN §12.1 #1).
export const CREW_OF_4: UserId[] = ["aarav", "rahul", "priya", "arjun"];
