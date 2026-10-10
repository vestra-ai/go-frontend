"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CrewCluster } from "@/components/home/CrewCluster";
import { CrewList } from "@/components/home/CrewList";
import { InviteLinkField } from "@/components/home/InviteLinkField";
import { SuggestionsPlaceholder } from "@/components/home/SuggestionsPlaceholder";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ArrowLeft, MessageCircle } from "@/components/icons/generated";
import { FadeDock } from "@/components/shell/FadeDock";
import { StickyDock } from "@/components/shell/StickyDock";
import { Screen } from "@/components/shell/Screen";
import { ShareInviteSheet } from "@/components/shell/ShareInviteSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { crew as copy } from "@/data/seed/copy";
import { timeAgo } from "@/lib/dates";
import { formatWhosIn } from "@/lib/format";
import { copyInviteLink } from "@/lib/share";
import { toastGo } from "@/lib/toast";
import { newKey } from "@/api/http";
import { createTrip, loadMe, useGo, useOpenTrip, useRequireSession } from "@/state";
import { toUser, tripFromView } from "@/state/view";

const CREATE_KEY = "go-new-trip-key";

/**
 * `POST /trips` for a visit without `?trip=`. The Idempotency-Key is kept for the tab until the trip exists, so a
 * reload (or a second effect run) while the request is on its way replays the same answer instead of adding a trip.
 */
let creating: Promise<string> | null = null;
function createOnce(hint: string | null): Promise<string> {
  creating ??= (async () => {
    let key = window.sessionStorage.getItem(CREATE_KEY);
    if (!key) {
      key = newKey();
      window.sessionStorage.setItem(CREATE_KEY, key);
    }
    // The body must be the same on a replay: read my profile first, then build it once.
    const me = useGo.getState().me ?? (await loadMe());
    const view = await createTrip(
      { ...(hint ? { destination_hint: hint.slice(0, 80) } : {}), ...(me.from_city ? { from_city: me.from_city } : {}) },
      key,
    );
    window.sessionStorage.removeItem(CREATE_KEY);
    return view.trip_id;
  })().finally(() => {
    creating = null;
  });
  return creating;
}

/** Who's coming (CONTRACT-APP §4.4): the new trip's people, live as friends tap the invite link. */
function WhosComing() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useRequireSession();
  const tripId = params.get("trip");
  const hint = params.get("hint");
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (session !== "signedIn" || tripId) return;
    let cancelled = false;
    createOnce(hint)
      .then((id) => {
        if (!cancelled) router.replace(`/trips/new?trip=${encodeURIComponent(id)}`);
      })
      .catch(() => {
        if (cancelled) return;
        window.sessionStorage.removeItem(CREATE_KEY);
        toastGo(copy.createFailed);
        router.replace("/home");
      });
    return () => {
      cancelled = true;
    };
  }, [session, tripId, hint, router]);

  if (session !== "signedIn" || !tripId) return <Screen>{null}</Screen>;
  return <Crew tripId={tripId} shareOpen={shareOpen} setShareOpen={setShareOpen} />;
}

function Crew({ tripId, shareOpen, setShareOpen }: { tripId: string; shareOpen: boolean; setShareOpen: (open: boolean) => void }) {
  const router = useRouter();
  const { view, forbidden } = useOpenTrip(tripId);

  useEffect(() => {
    if (forbidden) router.replace("/home");
  }, [forbidden, router]);

  if (!view) return <Screen>{null}</Screen>;

  const trip = tripFromView(view);
  const organizerPerson = view.people.find((p) => p.person_id === view.organizer_person_id) ?? view.me.person;
  const organizer = toUser(organizerPerson);
  const iAmOrganizer = organizerPerson.person_id === view.me.person.person_id;
  const joined = view.people.filter((p) => p.person_id !== organizerPerson.person_id);
  const hasJoined = joined.length > 0;
  const chatHref = `/trips/${trip.id}/chat`;

  function goBack() {
    // DESIGN-ASSUMPTION: the design's two Back targets (B2, B6 -> B1) collapse into one Back.
    if (window.history.length > 1) router.back();
    else router.push("/home");
  }

  return (
    <Screen>
      <div className="sticky top-0 z-30 shrink-0 bg-canvas pt-safe">
        <div className="flex h-11 items-center gap-3 pr-6 pl-[18px]">
          <Button variant="ghost" size="icon" className="-ml-1.5" aria-label={copy.back} onClick={goBack}>
            <ArrowLeft className="size-[22px] text-ink" strokeWidth={2} />
          </Button>
          <div className="flex-1" />
          <Button asChild variant="link" size="sm" className="-mr-1.5 h-9 px-3 text-15">
            <Link href={chatHref}>{copy.skip}</Link>
          </Button>
        </div>
      </div>

      <div className="px-4 pb-[200px]">
        <h1 className="mx-1 mt-2 text-34 leading-[1.12] font-semibold tracking-title">
          {copy.title(trip.destination ?? trip.name)}
        </h1>
        <p className="mx-1 mt-1.5 text-16 leading-[1.35] tracking-body text-muted">
          {hasJoined ? copy.subJoined : copy.subEmpty}
        </p>

        <Card variant="shadow" radius="4xl" className="mt-[22px] flex flex-col items-center gap-3.5 px-5 pt-7 pb-[22px] text-center">
          <CrewCluster user={organizer} />
          <h2 className="text-20 leading-[1.3] font-semibold tracking-h3">
            {hasJoined ? formatWhosIn(joined.map((p) => toUser(p).firstName)) : copy.cardTitleEmpty}
          </h2>
          <p className="max-w-[290px] text-15 leading-[1.4] text-muted">
            {hasJoined ? copy.cardBodyJoined(trip.name) : copy.cardBodyEmpty(trip.name)}
          </p>
          <div className="mt-1 self-stretch">
            <InviteLinkField
              url={trip.inviteUrl}
              onCopy={() => void copyInviteLink(trip)}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            className="gap-2 self-stretch px-[18px]"
            onClick={() => setShareOpen(true)}
          >
            <MessageCircle className="size-5 text-white" strokeWidth={2} />
            {copy.cta}
          </Button>
        </Card>

        {hasJoined ? (
          <>
            <SectionHeader className="mt-6" title={copy.listTitle(trip.name, trip.memberIds.length)} meta={copy.listMeta} />
            <div className="mt-2">
              <CrewList
                rows={[
                  { user: organizer, name: iAmOrganizer ? copy.you : organizer.name, status: copy.organizer, joined: false },
                  ...joined.map((p) => ({
                    user: toUser(p),
                    name: p.person_id === view.me.person.person_id ? copy.you : p.name,
                    status: copy.joinLabel(timeAgo(p.joined_at)),
                    joined: true,
                  })),
                ]}
              />
            </div>
          </>
        ) : (
          <div className="mt-3.5">
            <SuggestionsPlaceholder />
          </div>
        )}
      </div>

      <StickyDock>
        <FadeDock variant="blur" className={hasJoined ? "gap-3 px-4 pt-[70px]" : "gap-2.5 px-4 pt-[70px]"}>
          <Button asChild variant="primary" size="xl" className="w-full">
            <Link href={chatHref}>{hasJoined ? copy.nextJoined : copy.next}</Link>
          </Button>
          {!hasJoined && <p className="text-center text-13 text-muted">{copy.helper}</p>}
        </FadeDock>
      </StickyDock>

      <ShareInviteSheet trip={trip} open={shareOpen} onOpenChange={setShareOpen} />
    </Screen>
  );
}

export default function NewTripPage() {
  return (
    <Suspense fallback={<Screen>{null}</Screen>}>
      <WhosComing />
    </Suspense>
  );
}
