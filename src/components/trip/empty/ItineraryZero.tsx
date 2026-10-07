import { EmptyHeroCard } from "@/components/trip/EmptyHeroCard";
import { planZero } from "@/data/seed/copy";
import type { TripId } from "@/data/types";

// DESIGN-ASSUMPTION (I-plan-empty.md §1.6 #13): `college` has no chat scenario, so its links go to the bare chat route.
const chatHref = (tripId: TripId, query?: string) =>
  tripId === "college" || !query ? `/trips/${tripId}/chat` : `/trips/${tripId}/chat?${query}`;

const copy = planZero.itinerary;

/** Itinerary tab before place and dates are set. */
export function ItineraryZero({ tripId }: { tripId: TripId }) {
  return (
    <EmptyHeroCard
      emoji={copy.emoji}
      title={copy.title}
      body={copy.body}
      primary={{ label: copy.primary, href: chatHref(tripId), goAvatar: true }}
      secondary={{ label: copy.secondary, href: chatHref(tripId, "stage=dates-poll") }}
    />
  );
}
