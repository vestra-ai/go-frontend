"use client";

import { useState } from "react";
import { FadeDock } from "@/components/shell/FadeDock";
import { Screen } from "@/components/shell/Screen";
import { ShareInviteSheet } from "@/components/shell/ShareInviteSheet";
import { StickyDock } from "@/components/shell/StickyDock";
import type { Trip, User } from "@/data/types";
import { ChatFab, type ChatPreview } from "./ChatFab";
import { CollapsingTripHeader } from "./CollapsingTripHeader";
import { TripHero, type TripHeroMedia, type TripMetaLine } from "./TripHero";
import { TripTabs, type TripTab } from "./TripTabs";
import { useCollapsingHeader } from "./useCollapsingHeader";

export interface TripShellProps {
  trip: Trip;
  active: TripTab;
  hero: TripHeroMedia;
  title: string;
  titleEmoji?: string;
  meta: TripMetaLine[];
  collapsedSub: string;
  members: User[];
  chatPreview: ChatPreview;
  onShare?: () => void;
  shareOpen?: boolean;
  onShareOpenChange?: (open: boolean) => void;
  /** M2 preset: no hero or big tabs, compact header static at hp=1. */
  forceCollapsed?: boolean;
  children: React.ReactNode;
}

export function TripShell({
  trip,
  active,
  hero,
  title,
  titleEmoji,
  meta,
  collapsedSub,
  members,
  chatPreview,
  onShare,
  shareOpen,
  onShareOpenChange,
  forceCollapsed = false,
  children,
}: TripShellProps) {
  const scrollHp = useCollapsingHeader();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = shareOpen ?? innerOpen;
  const setOpen = onShareOpenChange ?? setInnerOpen;
  const hp = forceCollapsed ? 1 : scrollHp;
  const share = onShare ?? (() => setOpen(true));

  return (
    <Screen>
      <CollapsingTripHeader hp={hp} tripId={trip.id} active={active} title={title} sub={collapsedSub} onShare={share} />
      {forceCollapsed ? null : (
        <>
          <TripHero hero={hero} title={title} titleEmoji={titleEmoji} meta={meta} members={members} onShare={share} />
          <TripTabs tripId={trip.id} active={active} variant="hero" className="relative z-[2] mx-4 -mt-[26px]" />
        </>
      )}
      <div className={`flex flex-col gap-2.5 px-4 pb-[120px] ${forceCollapsed ? "pt-[calc(env(safe-area-inset-top,0px)+118px)]" : "pt-4"}`}>{children}</div>
      <StickyDock>
        <FadeDock variant="fade" aria-hidden className="h-[120px]" />
        <ChatFab tripId={trip.id} avatars={chatPreview.avatars} preview={chatPreview.text} unread={chatPreview.unread} />
      </StickyDock>
      <ShareInviteSheet trip={trip} open={open} onOpenChange={setOpen} />
    </Screen>
  );
}
