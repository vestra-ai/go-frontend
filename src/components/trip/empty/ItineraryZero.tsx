import { EmptyHeroCard } from "@/components/trip/EmptyHeroCard";
import { planZero } from "@/data/seed/copy";
import type { TripId } from "@/data/types";

// Both buttons open the trip chat: the plan is drafted with Go in the room.
const chatHref = (tripId: TripId) => `/trips/${tripId}/chat`;

const copy = planZero.itinerary;

/** Itinerary tab before place and dates are set. */
export function ItineraryZero({ tripId }: { tripId: TripId }) {
  return (
    <EmptyHeroCard
      emoji={copy.emoji}
      title={copy.title}
      body={copy.body}
      primary={{ label: copy.primary, href: chatHref(tripId), goAvatar: true }}
      secondary={{ label: copy.secondary, href: chatHref(tripId) }}
    />
  );
}
