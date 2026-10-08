"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { TripHomeSkeleton } from "@/components/home/TripHomeSkeleton";
import { InviteSheet } from "@/components/sheets/InviteSheet";
import { Screen } from "@/components/shell/Screen";
import { TRIPS } from "@/data/seed/trips";
import { assets } from "@/lib/assets";
import { useHydrated, useStore } from "@/store";

// Where Accept lands: Goa's zero trip home (I1), Bali's chat at the visa stage (G2).
const LANDING = { goa: "/trips/goa", bali: "/trips/bali/chat" } as const;

/** B7 / G1: a friend taps an invite link; the inert trip home shows under the invite sheet. */
export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const invite = useStore((s) => s.trips.invites[code]);
  const storedTrip = useStore((s) => (invite ? s.trips.trips[invite.tripId] : undefined));
  const users = useStore((s) => s.trips.members);
  const acceptInvite = useStore((s) => s.acceptInvite);

  if (!hydrated) return <Screen>{null}</Screen>;
  if (!invite) notFound();

  // Invites stay readable before the trip exists in the store (Bali), so fall back to the seed trip.
  const trip = storedTrip ?? TRIPS[invite.tripId];
  const inviter = users[invite.inviterId];
  const members = invite.memberIds.map((id) => users[id]);
  // Hero stack: organizer first, the rest in invite order (B7: Aarav, Rahul, Priya).
  const heroMembers = [...members].sort(
    (a, b) => Number(b.id === trip.organizerId) - Number(a.id === trip.organizerId),
  );
  const media = trip.cover
    ? { kind: "photo" as const, ...trip.cover }
    : { kind: "illustration" as const, src: trip.illustration ?? assets.illustrations.gokarna.src, alt: trip.name };
  const landing = invite.tripId === "bali" ? LANDING.bali : LANDING.goa;

  return (
    <Screen>
      <TripHomeSkeleton
        tripId={trip.id}
        city={trip.destination ?? trip.name}
        dateShort={trip.dates?.short ?? ""}
        joinedCount={invite.joinedCount}
        members={heroMembers}
        hero={trip.hero}
      />
      <InviteSheet
        open
        invite={invite}
        trip={trip}
        inviter={inviter}
        members={members}
        media={media}
        onAccept={() => {
          acceptInvite(code);
          router.replace(landing);
        }}
        // DESIGN-ASSUMPTION: the design's P-WA-Chat exit is excluded; dismissing goes to App home, invite still listed.
        onDismiss={() => router.replace("/home")}
      />
    </Screen>
  );
}
