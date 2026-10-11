"use client";

import type { TripView } from "@/api/contract";
import type { TripShellProps } from "@/components/trip/TripShell";
import type { TripTab } from "@/components/trip/TripTabs";
import { planZero } from "@/data/seed/copy";
import type { TripId, User } from "@/data/types";
import { useTripData } from "@/state";
import { toUser, tripFromView, unknownUser } from "@/state/view";

/** The TripShell props every trip tab shares; the tabs' layout adds `children` and `forceCollapsed`. */
export type TripShellBindings = Pick<
  TripShellProps,
  "trip" | "active" | "hero" | "title" | "titleEmoji" | "meta" | "collapsedSub" | "members" | "chatPreview"
>;

// Hero emoji slots (I-plan-empty.md §1.2 zero, J-triphome-calls.md §2 "Hero" populated). No copy namespace holds them.
const ZERO_EMOJI = { where: "📍", joined: "👥" } as const;
const PLANNED_EMOJI = { title: "📍", dates: "📅", countdown: "⏳" } as const;

/** The Chat button reads `TripView.chat` (CONTRACT-APP §4.11): who spoke last, the last line, the unread count. */
function chatPreview(view: TripView, users: User[]): TripShellProps["chatPreview"] {
  const byId = new Map(users.map((u) => [u.id, u]));
  const avatars = view.chat.participants_preview.flatMap((p): Array<"go" | User> => {
    if (p.kind === "go") return ["go"];
    const user = byId.get(p.person_id);
    return user ? [user] : [];
  });
  const last = view.chat.last_message;
  let text: string = planZero.chatPreviewEmpty;
  if (last) {
    const who =
      last.author.kind === "go"
        ? "Go"
        : last.author.kind === "person"
          ? last.author.person_id === view.me.person.person_id
            ? "You"
            : (byId.get(last.author.person_id) ?? unknownUser(last.author.person_id)).firstName
          : "";
    text = who ? `${who}: ${last.text_preview}` : last.text_preview;
  }
  return { avatars: avatars.length > 0 ? avatars : ["go"], text, unread: view.chat.unread_count };
}

/**
 * Hero, titles, member stack and Chat button for one trip tab, so Home, Itinerary, Bookings and Expenses render the
 * same shell for the same trip. Null until the trip has been read.
 *
 * The shell is "populated" once the Server calls the trip `planned` (destination, dates and a confirmed booking,
 * CONTRACT-APP §4.4), on every tab.
 */
export function useTripShellProps(tripId: TripId, active: TripTab): TripShellBindings | null {
  const view = useTripData(tripId).view;
  if (!view) return null;

  const trip = tripFromView(view);
  const members = view.people.map((p) => toUser(p));
  const chat = chatPreview(view, members);

  if (view.stage !== "planned") {
    const where = trip.destination ?? planZero.hero.where;
    return {
      trip,
      active,
      hero: trip.hero ? { kind: "image", ...trip.hero } : { kind: "gradient" },
      title: trip.name || planZero.hero.title,
      meta: [
        { emoji: ZERO_EMOJI.where, text: trip.dates ? `${where} · ${trip.dates.range}` : where },
        { emoji: ZERO_EMOJI.joined, text: planZero.hero.joined(members.length) },
      ],
      collapsedSub: where,
      members,
      chatPreview: chat,
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
      { emoji: PLANNED_EMOJI.countdown, text: trip.dates?.countdown ?? "" },
    ],
    collapsedSub: range,
    members,
    chatPreview: chat,
  };
}
