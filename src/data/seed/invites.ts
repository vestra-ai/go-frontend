import type { Invite } from "@/data/types";

const WHEN_YOU_JOIN = [
  "💬 You’re added to the trip chat",
  "📅 Go asks your dates and budget",
  "🔒 Your bookings and budget stay private",
];

// Both codes always exist (B-crew.md §1.3), whether or not the Goa draft was created.
export const INVITES: Record<string, Invite> = {
  "goa-k7q": {
    code: "goa-k7q",
    tripId: "goa",
    inviterId: "rahul",
    joinedCount: 3, // kept as designed: "3 joined" counts the viewer (B-crew.md §1.6 #8)
    memberIds: ["rahul", "priya", "aarav"],
    whenYouJoin: WHEN_YOU_JOIN,
    cardSub: "Rahul invited you · Diwali, 6–9 Nov", // DESIGN-ASSUMPTION: the Goa invite never appears on App home
    membersLine: "Rahul, Priya and 1 more are in",
  },
  "bali-x9m": {
    code: "bali-x9m",
    tripId: "bali",
    inviterId: "priya",
    joinedCount: 2,
    memberIds: ["priya", "kabir"],
    whenYouJoin: WHEN_YOU_JOIN,
    cardSub: "Priya invited you · Christmas, 25–28 Dec",
    membersLine: "Priya and Kabir are in",
  },
};
