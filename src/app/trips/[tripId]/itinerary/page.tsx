"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { Booking, Day, ItineraryItem } from "@/api/contract";
import { AvatarStack } from "@/components/common/AvatarStack";
import { ScopeBadge } from "@/components/common/ScopeBadge";
import { ScopeToggle } from "@/components/common/ScopeToggle";
import { DayCard } from "@/components/plan/DayCard";
import { TimelineRow } from "@/components/plan/TimelineRow";
import { Screen } from "@/components/shell/Screen";
import { ItineraryZero } from "@/components/trip/empty/ItineraryZero";
import { TripShell } from "@/components/trip/TripShell";
import { useTripShellProps } from "@/components/trip/useTripShellProps";
import type { TripId, User } from "@/data/types";
import { monthShort, parseDay, weekdayShort } from "@/lib/dates";
import { loadItinerary, useTripGate } from "@/state";
import { bookingEmoji } from "@/state/bookingView";
import { usersById } from "@/state/view";

type Scope = "everyone" | "me";

const CATEGORY_EMOJI: Record<ItineraryItem["category"], string> = {
  stay: "🏡",
  food: "🍽️",
  getting_around: "🚕",
  activities: "🎟️",
  other: "📌",
};

/** "FRI 6 NOV" · "SAT 7 NOV · MEHER'S BIRTHDAY" */
function dayLabel(day: Day): string {
  const date = parseDay(day.date);
  const stamp = `${weekdayShort(date)} ${date.getDate()} ${monthShort(date)}`.toUpperCase();
  return day.title ? `${stamp} · ${day.title.toUpperCase()}` : stamp;
}

/** "HH:MM" → "9:55p" (the timeline's narrow time column). */
function compactTime(time?: string | null): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time ?? "");
  if (!m) return time ?? "";
  const h = Number(m[1]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m[2] === "00" ? "" : `:${m[2]}`}${h < 12 ? "a" : "p"}`;
}

const SCOPE_BADGE = { private: "mine", shared: "shared", group: "group" } as const;

const stackOf = (users: User[]) => users.map((u) => ({ name: u.name, src: u.avatar, tone: u.tone }));

function ItineraryPlan({ days, scope, users, bookings }: { days: Day[]; scope: Scope; users: Record<string, User>; bookings: Booking[] }) {
  const kindOf = new Map(bookings.map((b) => [b.booking_id, b.kind]));
  return days
    .filter((day) => day.items.length > 0)
    .map((day) => (
      <DayCard key={day.date} label={dayLabel(day)}>
        {day.items.map((item, i) => {
          const kind = item.booking_id ? kindOf.get(item.booking_id) : undefined;
          const people = (item.person_ids ?? []).flatMap((id) => (users[id] ? [users[id]] : []));
          return (
            <TimelineRow
              key={item.item_id ?? `${day.date}-${i}`}
              time={compactTime(item.time)}
              emoji={kind ? bookingEmoji(kind) : (CATEGORY_EMOJI[item.category] ?? CATEGORY_EMOJI.other)}
              title={item.title}
              sub={item.note ?? item.place?.name ?? ""}
              connector={i < day.items.length - 1}
              trailing={
                scope === "everyone" ? (
                  people.length > 0 ? (
                    <AvatarStack size={22} overlap={7} ring="white" avatars={stackOf(people)} />
                  ) : null
                ) : (
                  <ScopeBadge scope={SCOPE_BADGE[item.audience ?? "group"] ?? "group"} />
                )
              }
            />
          );
        })}
      </DayCard>
    ));
}

/**
 * Itinerary tab (CONTRACT-APP §4.10): `GET …/itinerary?scope=everyone|me`. "Just me" is built by the Server (my items,
 * shared ones, and bookings that cover me reworded for me); `days: []` is "No plan yet".
 */
function ItineraryView({ tripId }: { tripId: TripId }) {
  const params = useSearchParams();
  const [scope, setScope] = useState<Scope>(() => (params.get("scope") === "me" ? "me" : "everyone"));
  const data = useTripGate(tripId);
  const shell = useTripShellProps(tripId, "itinerary");
  const ready = data !== null;

  useEffect(() => {
    if (ready) void loadItinerary(tripId, scope).catch(() => {});
  }, [ready, tripId, scope]);

  // replaceState, never router.push: Back leaves the tab instead of stepping through toggles.
  useEffect(() => {
    const query = `?scope=${scope}`;
    if (window.location.search !== query) window.history.replaceState(window.history.state, "", query);
  }, [scope]);

  if (!data?.view || !shell) return <Screen>{null}</Screen>;

  // "Everyone" draws from the trip itself until the tab's own read lands; "Just me" only exists as its own read.
  const everyone = data.itinerary.everyone ?? data.view.itinerary;
  const days = scope === "me" ? data.itinerary.me : everyone;
  const empty = everyone.every((day) => day.items.length === 0);

  return (
    <TripShell {...shell}>
      {empty ? (
        <ItineraryZero tripId={tripId} />
      ) : (
        <>
          <div className="@container flex items-center gap-2">
            <ScopeToggle className="flex-1" value={scope} onValueChange={setScope} />
          </div>
          {days && <ItineraryPlan days={days} scope={scope} users={usersById(data.view.people)} bookings={data.view.bookings} />}
        </>
      )}
    </TripShell>
  );
}

export default function ItineraryPage() {
  const { tripId } = useParams<{ tripId: string }>();
  return (
    <Suspense fallback={<Screen>{null}</Screen>}>
      <ItineraryView key={tripId} tripId={tripId} />
    </Suspense>
  );
}
