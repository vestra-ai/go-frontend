"use client";

import type { Attention, Home, PastTripSummary } from "@/api/contract";
import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { SectionHeader } from "@/components/common/SectionHeader";
import { FadeDock } from "@/components/shell/FadeDock";
import { StickyDock } from "@/components/shell/StickyDock";
import { homeBodyClass } from "@/components/home/HomeHeader";
import { PastTripRow } from "@/components/home/PastTripRow";
import { TripCard } from "@/components/home/TripCard";
import { useStartTrip } from "@/components/home/useStartTrip";
import { Spinner } from "@/components/icons/custom/Spinner";
import { Plus } from "@/components/icons/generated";
import { DashedNoteRow } from "@/components/trip/DashedNoteRow";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { home as copy } from "@/data/seed/copy";
import { HOME_CARD_STATUS } from "@/data/seed/homeCards";
import type { PastTrip } from "@/data/types";
import { parseDay } from "@/lib/dates";
import { inr } from "@/lib/format";
import { fromMinor, illustrationFor, toUser, tripFromSummary } from "@/state/view";

/** The trip card's status line. `attention` is computed by the Server (CONTRACT-APP §4.2); the words are the app's. */
function statusOf(attention: Attention): { text: string; tone: "go" | "muted" } {
  switch (attention.kind) {
    case "needs_you":
      return { text: HOME_CARD_STATUS.pending(attention.count), tone: "go" };
    case "task":
      return { text: attention.label, tone: "go" };
    case "all_set":
      return { text: HOME_CARD_STATUS.allSet, tone: "muted" };
    default:
      return { text: HOME_CARD_STATUS.collecting, tone: "muted" };
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const PAST_TINTS = ["bg-amber-tint", "bg-green-tint", "bg-info-tint", "bg-peach-tint"] as const;

/** "Aug 2026 · 5 people · all settled" */
function pastTrip(trip: PastTripSummary, index: number): PastTrip {
  const start = trip.dates ? parseDay(trip.dates.start) : null;
  const parts = [
    ...(start ? [`${MONTHS[start.getMonth()]} ${start.getFullYear()}`] : []),
    copy.pastPeople(trip.people_count),
    ...(trip.all_settled ? [copy.pastSettled] : []),
  ];
  return {
    id: trip.trip_id,
    title: trip.title,
    sub: parts.join(" · "),
    tintClass: PAST_TINTS[index % PAST_TINTS.length],
    img: illustrationFor(trip.trip_id, trip.title),
  };
}

/** Returning Home body (what I owe, your trips, past trips) plus the New-trip FAB. */
export function AppHomeView({ home }: { home: Home }) {
  const now = new Date();
  const trip = useStartTrip();

  return (
    <>
      <div className={homeBodyClass}>
        {home.owes.length > 0 && (
          <>
            <SectionHeader title={copy.owesTitle} />
            <ListCard padding="tight">
              {home.owes.map((owed) => {
                const to = toUser(owed.to);
                return (
                  <ListRow
                    key={`${owed.trip_id}|${owed.to.person_id}`}
                    dense
                    href={`/trips/${owed.trip_id}/expenses`}
                    chevron
                    leading={<Avatar size={44} name={to.name} src={to.avatar} tone={to.tone} />}
                    title={copy.owes(to.firstName, inr(fromMinor(owed.amount_minor)))}
                    sub={owed.trip_title}
                  />
                );
              })}
            </ListCard>
          </>
        )}
        {home.trips.length > 0 && (
          <SectionHeader title={copy.tripsTitle} meta={copy.tripsMeta(home.trips.length)} className={home.owes.length > 0 ? "mt-3.5" : undefined} />
        )}
        {home.trips.map((summary) => {
          const trip = tripFromSummary(summary, now);
          const status = statusOf(summary.attention);
          return (
            <TripCard
              key={trip.id}
              href={`/trips/${trip.id}`}
              name={trip.name}
              cover={trip.cover ? { kind: "photo", ...trip.cover } : { kind: "gradient" }}
              coverTitle={trip.homeCard.coverTitle}
              coverSub={trip.homeCard.coverSub}
              members={summary.people_preview.slice(0, 4).map((p) => toUser(p))}
              status={status.text}
              statusTone={status.tone}
            />
          );
        })}
        <SectionHeader title={copy.pastTitle} className="mt-3.5" />
        {home.past_trips.length > 0 ? (
          <ListCard padding="tight">
            {home.past_trips.map((trip, i) => (
              <PastTripRow key={trip.trip_id} trip={pastTrip(trip, i)} settled={trip.all_settled} />
            ))}
          </ListCard>
        ) : (
          <DashedNoteRow emoji={copy.pastEmpty.emoji} title={copy.pastEmpty.title} sub={copy.pastEmpty.sub} />
        )}
      </div>
      <StickyDock>
        <FadeDock variant="fade" className="h-[120px] items-center justify-end">
          <Button
            variant="primary"
            size="xl"
            aria-busy={trip.pending !== null}
            onClick={() => void trip.start("fab")}
            className="mb-1 px-6 text-17 font-semibold tracking-normal shadow-fab"
          >
            {trip.pending ? <Spinner className="size-5 border-white/30 border-t-white border-r-white" /> : <Plus className="size-5" />}
            {copy.fab}
          </Button>
        </FadeDock>
      </StickyDock>
    </>
  );
}
