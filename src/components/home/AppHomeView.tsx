"use client";

import Link from "next/link";
import { useShallow } from "zustand/react/shallow";
import { ListCard } from "@/components/common/ListCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { FadeDock } from "@/components/shell/FadeDock";
import { InviteCard } from "@/components/home/InviteCard";
import { PastTripRow } from "@/components/home/PastTripRow";
import { TripCard } from "@/components/home/TripCard";
import { Plus } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { home as copy } from "@/data/seed/copy";
import { assets } from "@/lib/assets";
import { toastGo } from "@/lib/toast";
import { selectTripMembers, useMyTrips, usePendingInvites, useStore } from "@/store";

/** A6: returning Home body (invites, your trips, past trips) plus the New-trip FAB. */
export function AppHomeView() {
  const trips = useMyTrips();
  const invites = usePendingInvites();
  const tripsById = useStore((s) => s.trips.trips);
  const pastTrips = useStore((s) => s.trips.pastTrips);
  const users = useStore((s) => s.trips.members);
  // Same stack as the trip home hero (A6 Goa shows Arjun too); memoised per trip, so shallow-equal between renders.
  const tripMembers = useStore(useShallow((s) => trips.map((trip) => selectTripMembers(s, trip.id))));
  const declineInvite = useStore((s) => s.declineInvite);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none">
        <div className="flex flex-col gap-2.5 px-4 pt-2.5 pb-[130px]">
          {invites.length > 0 && <SectionHeader title={copy.invitesTitle} meta={copy.invitesMeta(invites.length)} />}
          {invites.map((invite) => (
            <InviteCard
              key={invite.code}
              title={tripsById[invite.tripId]?.name ?? invite.tripId}
              sub={invite.cardSub}
              members={invite.memberIds.map((id) => users[id])}
              membersLine={invite.membersLine}
              thumb={{ src: assets.illustrations.gokarna.src, tintClass: "bg-info-tint" }}
              acceptHref={`/invite/${invite.code}`}
              onDecline={() => {
                declineInvite(invite.code);
                toastGo(copy.toasts.decline);
              }}
            />
          ))}
          <SectionHeader title={copy.tripsTitle} meta={copy.tripsMeta(trips.length)} className="mt-3.5" />
          {trips.map((trip, i) => (
            <TripCard
              key={trip.id}
              href={`/trips/${trip.id}`}
              name={trip.name}
              cover={trip.cover ? { kind: "photo", ...trip.cover } : { kind: "gradient" }}
              coverTitle={trip.homeCard.coverTitle}
              coverSub={trip.homeCard.coverSub}
              members={tripMembers[i].slice(0, 4)}
              status={trip.homeCard.status}
              statusTone={trip.homeCard.statusTone}
            />
          ))}
          {pastTrips.length > 0 && (
            <>
              <SectionHeader title={copy.pastTitle} className="mt-3.5" />
              <ListCard padding="tight">
                {pastTrips.map((trip) => (
                  <PastTripRow key={trip.id} trip={trip} />
                ))}
              </ListCard>
            </>
          )}
        </div>
      </div>
      <FadeDock variant="fade" className="h-[120px] items-center justify-end">
        <Button variant="primary" size="xl" asChild className="mb-1 px-6 text-17 font-semibold tracking-normal shadow-fab">
          <Link href="/trips/new">
            <Plus className="size-5" />
            {copy.fab}
          </Link>
        </Button>
      </FadeDock>
    </>
  );
}
