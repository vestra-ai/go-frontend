"use client";

import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AvatarStack } from "@/components/common/AvatarStack";
import { ScopeBadge } from "@/components/common/ScopeBadge";
import { ScopeToggle } from "@/components/common/ScopeToggle";
import { ViewToggle, type ViewMode } from "@/components/common/ViewToggle";
import { DayCard } from "@/components/plan/DayCard";
import { MapCard } from "@/components/plan/MapCard";
import type { ResolvedMapCard } from "@/components/plan/MapDetailCard";
import { TimelineRow } from "@/components/plan/TimelineRow";
import { Screen } from "@/components/shell/Screen";
import { ItineraryZero } from "@/components/trip/empty/ItineraryZero";
import { TripShell } from "@/components/trip/TripShell";
import { useTripShellProps } from "@/components/trip/useTripShellProps";
import { MAP_CARDS, MAP_SPOTS } from "@/data/seed/map";
import type { MapArea } from "@/data/seed/mapArt";
import { TRIP_IDS } from "@/data/seed/trips";
import type { MapCard as MapCardData, SpotKey, TripId, User } from "@/data/types";
import { toastGo } from "@/lib/toast";
import { useItinerary, useTripHomeMode, useTripMembers } from "@/store/hooks";
import type { Scope } from "@/store/selectors";
import { useStore } from "@/store/store";
import { useHydrated } from "@/store/useHydrated";

// ---------------------------------------------------------------------------
// URL ↔ state (L-itinerary-map.md §1.1)
// ---------------------------------------------------------------------------

interface PlanState {
  scope: Scope;
  view: ViewMode;
  area: MapArea;
  sel: SpotKey | null;
}

const isSpotKey = (value: string | null): value is SpotKey => value !== null && value in MAP_CARDS;

const visibleSpots = (area: MapArea, scope: Scope) =>
  MAP_SPOTS.filter((s) => s.area === area && (s.audience === "both" || s.audience === scope));

// Each scope opens on its artboard's initial state: Everyone = L1 (trip map, blr card), Just me = L2 (list, no card).
const SCOPE_START: Record<Scope, PlanState> = {
  everyone: { scope: "everyone", view: "map", area: "trip", sel: "blr" },
  me: { scope: "me", view: "list", area: "trip", sel: null },
};

/** Missing → blr on the everyone/trip map, else none; a key with no visible spot → none. */
function parseSel(sel: string | null, area: MapArea, scope: Scope): SpotKey | null {
  if (sel === "none") return null;
  if (!isSpotKey(sel)) return scope === "everyone" && area === "trip" ? "blr" : null;
  // DESIGN-ASSUMPTION (L-itinerary-map.md §1.6 #3): goa-area spots carry no `goa` key, so `area=goa&sel=goa` → none.
  return visibleSpots(area, scope).some((s) => s.key === sel) ? sel : null;
}

/** Missing/invalid params fall back to the §1.1 defaults. */
function parsePlanState(params: URLSearchParams): PlanState {
  const scope: Scope = params.get("scope") === "me" ? "me" : "everyone";
  const view = params.get("view");
  const area: MapArea = params.get("area") === "goa" ? "goa" : "trip";
  return {
    scope,
    view: view === "map" || view === "list" ? view : SCOPE_START[scope].view,
    area,
    sel: parseSel(params.get("sel"), area, scope),
  };
}

// DESIGN-ASSUMPTION (L-itinerary-map.md §1.6 #5): `sel=none` keeps a closed card closed across reloads.
const planQuery = ({ scope, view, area, sel }: PlanState) => `?scope=${scope}&view=${view}&area=${area}&sel=${sel ?? "none"}`;

const resolveCard = ({ me, ...card }: MapCardData, scope: Scope): ResolvedMapCard =>
  scope === "me" ? { ...card, ...me } : card;

const stackOf = (users: User[]) => users.map((u) => ({ name: u.name, src: u.avatar, tone: u.tone }));

// ---------------------------------------------------------------------------
// Populated plan (L1–L3)
// ---------------------------------------------------------------------------

function ItineraryPlan({ tripId, me, others }: { tripId: TripId; me: User; others: User[] }) {
  const params = useSearchParams();
  // Parsed once on mount; later changes write all four params back (PLAN §12.1 #19).
  const [state, setState] = useState(() => parsePlanState(params));
  const users = useStore((s) => s.trips.members);
  const days = useItinerary(tripId, state.scope);

  // replaceState, never router.push: Back leaves the tab instead of stepping through toggles.
  useEffect(() => {
    const query = planQuery(state);
    if (window.location.search !== query) window.history.replaceState(null, "", query);
  }, [state]);

  const { scope, view, area, sel } = state;
  const card = sel ? resolveCard(MAP_CARDS[sel], scope) : null;

  const onAction = () => {
    if (card?.action.kind === "goa") setState((s) => ({ ...s, area: "goa", sel: "villa" }));
    else if (card?.action.kind === "toast") toastGo(card.action.text);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* DESIGN-ASSUMPTION (L-itinerary-map.md §1.6 #1): scope is local state; a switch resets to that artboard's start. */}
        <ScopeToggle
          className="flex-1"
          value={scope}
          onValueChange={(next) => setState(SCOPE_START[next])}
          others={others}
          me={me}
        />
        <ViewToggle value={view} onValueChange={(next) => setState((s) => ({ ...s, view: next }))} />
      </div>
      {view === "map" ? (
        <MapCard
          area={area}
          audience={scope}
          sel={sel}
          spots={visibleSpots(area, scope)}
          card={card}
          onArea={(next) => setState((s) => ({ ...s, area: next, sel: null }))}
          onSelect={(key) => setState((s) => ({ ...s, sel: key }))}
          onClose={() => setState((s) => ({ ...s, sel: null }))}
          onAction={onAction}
        />
      ) : (
        days.map((day) => (
          <DayCard key={day.day} label={day.label}>
            {day.rows.map((row, i) => (
              <TimelineRow
                key={row.id}
                time={row.time}
                emoji={row.emoji}
                title={row.title}
                sub={row.sub}
                connector={i < day.rows.length - 1}
                trailing={
                  scope === "everyone" ? (
                    <AvatarStack size={22} overlap={7} ring="white" avatars={stackOf(row.memberIds.map((id) => users[id]))} />
                  ) : (
                    <ScopeBadge scope={row.scope} />
                  )
                }
              />
            ))}
          </DayCard>
        ))
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page (I2 zero · L1–L3 populated)
// ---------------------------------------------------------------------------

function ItineraryView({ tripId }: { tripId: TripId }) {
  const shell = useTripShellProps(tripId, "itinerary");
  const populated = useTripHomeMode(tripId) === "populated";
  const userId = useStore((s) => s.session.userId);
  const users = useStore((s) => s.trips.members);
  const members = useTripMembers(tripId);
  if (!shell) notFound();

  const others = members.filter((u) => u.id !== userId);

  return (
    <TripShell {...shell}>
      {populated ? (
        <ItineraryPlan tripId={tripId} me={users[userId]} others={others} />
      ) : (
        // I2: ?scope/?view/?area/?sel are ignored in the zero state.
        <ItineraryZero tripId={tripId} />
      )}
    </TripShell>
  );
}

export default function ItineraryPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const hydrated = useHydrated();
  if (!TRIP_IDS.includes(tripId as TripId)) notFound();
  if (!hydrated) return <Screen scroll="none">{null}</Screen>;
  return (
    <Suspense fallback={<Screen scroll="none">{null}</Screen>}>
      <ItineraryView tripId={tripId as TripId} />
    </Suspense>
  );
}
