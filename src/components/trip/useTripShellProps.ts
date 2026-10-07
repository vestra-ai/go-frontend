"use client";

import type { TripShellProps } from "@/components/trip/TripShell";
import type { TripTab } from "@/components/trip/TripTabs";
import { planZero } from "@/data/seed/copy";
import type { TripId } from "@/data/types";
import { useChatPreview, useTripHomeMode, useTripMembers } from "@/store/hooks";
import { selectHome, selectTrip } from "@/store/selectors";
import { useStore } from "@/store/store";

/** The TripShell props every trip tab shares; pages add `children`, share control and `forceCollapsed`. */
export type TripShellBindings = Pick<
  TripShellProps,
  "trip" | "active" | "hero" | "title" | "titleEmoji" | "meta" | "collapsedSub" | "members" | "chatPreview"
>;

// Hero emoji slots (I-plan-empty.md §1.2 zero, J-triphome-calls.md §2 "Hero" populated). No seed namespace holds them.
const ZERO_EMOJI = { where: "📍", joined: "👥" } as const;
const PLANNED_EMOJI = { title: "📍", dates: "📅", countdown: "⏳" } as const;

/**
 * Hero, titles, member stack and Chat FAB for one trip tab, so Home, Itinerary, Bookings and Expenses render the
 * same shell for the same store state (I-plan-empty.md §1.2/§1.4, J-triphome-calls.md §1.2). Null for an unknown trip.
 *
 * DESIGN-ASSUMPTION (I-plan-empty.md §1.4, §1.6 #1): the shell follows `selectTripHomeMode` (populated once the trip
 * is planned) on every tab, even where the tab's content populates earlier from its own data (PLAN §12.1 #23).
 */
export function useTripShellProps(tripId: TripId, active: TripTab): TripShellBindings | null {
  const trip = useStore((s) => selectTrip(s, tripId));
  const mode = useTripHomeMode(tripId);
  const daysToGo = useStore((s) => selectHome(s, tripId).daysToGo);
  const userId = useStore((s) => s.session.userId);
  const members = useTripMembers(tripId);
  const chat = useChatPreview(tripId);
  if (!trip) return null;

  if (mode === "zero") {
    return {
      trip,
      active,
      hero: { kind: "gradient" },
      title: planZero.hero.title,
      meta: [
        { emoji: ZERO_EMOJI.where, text: planZero.hero.where },
        { emoji: ZERO_EMOJI.joined, text: planZero.hero.joined(members.length) },
      ],
      collapsedSub: planZero.hero.where,
      members,
      // Zero FAB: Go + every member (I1: Go, Aarav, Rahul).
      chatPreview: { avatars: ["go", ...members], text: chat.text, unread: chat.unread },
    };
  }

  const range = trip.dates?.range ?? "";
  return {
    trip,
    active,
    hero: trip.hero ? { kind: "image", ...trip.hero } : { kind: "gradient" },
    title: trip.destination ?? trip.name,
    titleEmoji: PLANNED_EMOJI.title,
    meta: [
      { emoji: PLANNED_EMOJI.dates, text: range },
      { emoji: PLANNED_EMOJI.countdown, text: daysToGo },
    ],
    collapsedSub: range,
    members,
    // Populated FAB: Go + the crew minus you (J/L/M inventories: Go, Rahul, Priya, Arjun).
    chatPreview: { avatars: ["go", ...members.filter((u) => u.id !== userId)], text: chat.text, unread: chat.unread },
  };
}
