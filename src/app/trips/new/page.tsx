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
import { formatWhosIn } from "@/lib/format";
import { copyInviteLink } from "@/lib/share";
import { useHydrated, useStore } from "@/store";

/** B1 / B2 / B6: invite the crew while the Goa draft fills up. */
function WhosComing() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const trip = useStore((s) => s.trips.trips.goa);
  const users = useStore((s) => s.trips.members);
  const createDraftGoa = useStore((s) => s.createDraftGoa);
  const simulateJoins = useStore((s) => s.simulateJoins);
  const [shareOpen, setShareOpen] = useState(false);
  const instantJoin = params.get("joined") === "2";

  useEffect(() => {
    if (!hydrated) return;
    createDraftGoa();
    if (instantJoin) simulateJoins({ instant: true });
  }, [hydrated, instantJoin, createDraftGoa, simulateJoins]);

  if (!hydrated || !trip) return <Screen>{null}</Screen>;

  const organizer = users[trip.organizerId];
  const joined = trip.memberIds.filter((id) => id !== trip.organizerId);
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
            {hasJoined ? formatWhosIn(joined.map((id) => users[id].firstName)) : copy.cardTitleEmpty}
          </h2>
          <p className="max-w-[290px] text-15 leading-[1.4] text-muted">
            {hasJoined ? copy.cardBodyJoined(trip.name) : copy.cardBodyEmpty(trip.name)}
          </p>
          <div className="mt-1 self-stretch">
            <InviteLinkField
              url={trip.inviteUrl}
              onCopy={() => {
                void copyInviteLink(trip);
                simulateJoins();
              }}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            className="gap-2 self-stretch px-[18px]"
            onClick={() => {
              setShareOpen(true);
              simulateJoins();
            }}
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
                  { user: organizer, name: copy.you, status: copy.organizer, joined: false },
                  ...joined.map((id) => ({
                    user: users[id],
                    name: users[id].name,
                    status: copy.joinLabel[id] ?? "",
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

      <ShareInviteSheet
        trip={trip}
        open={shareOpen}
        onOpenChange={setShareOpen}
        onShared={() => simulateJoins()}
      />
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
