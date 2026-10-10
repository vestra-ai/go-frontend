"use client";

import { createContext, useContext, useState } from "react";
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

/** What a tab's content can ask of the shell it sits in (the shell is shared by the four tabs, so it is not the page's to drive). */
interface TripShellActions {
  /** Opens the invite sheet. */
  openShare(): void;
}

const TripShellActionsContext = createContext<TripShellActions | null>(null);

export function useTripShellActions(): TripShellActions {
  const actions = useContext(TripShellActionsContext);
  if (!actions) throw new Error("useTripShellActions must be used inside a TripShell");
  return actions;
}

/** The column under the tab bar (its top padding is the shell's, since the collapsed preset changes it); shared with the skeleton. */
export const tripBodyClass = "flex flex-col gap-2.5 px-4 pb-[120px]";

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
  /** M2 preset: no hero or big tabs, compact header always shown. */
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
  const { sentinelRef, collapsed: scrolledPast, animate } = useCollapsingHeader();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = shareOpen ?? innerOpen;
  const setOpen = onShareOpenChange ?? setInnerOpen;
  const collapsed = forceCollapsed || scrolledPast;
  const share = onShare ?? (() => setOpen(true));
  const actions: TripShellActions = { openShare: () => setOpen(true) };

  return (
    <Screen>
      <CollapsingTripHeader collapsed={collapsed} animate={animate} tripId={trip.id} active={active} title={title} sub={collapsedSub} onShare={share} />
      {forceCollapsed ? null : (
        <>
          <TripHero hero={hero} title={title} titleEmoji={titleEmoji} meta={meta} members={members} onShare={share} />
          {/* The compact header slides in when this (the hero's bottom edge) leaves the top of the screen. */}
          <span ref={sentinelRef} aria-hidden className="-mb-px block h-px" />
          <TripTabs tripId={trip.id} active={active} variant="hero" className="relative z-[2] mx-4 -mt-[26px]" />
        </>
      )}
      {/* The shell lives in the tabs' shared layout, so it stays put when the tab changes. Keyed by the tab, this column is
          what remounts and re-animates (PageTransition marks the wrapper `data-switch="tab"`). */}
      <TripShellActionsContext.Provider value={actions}>
        <div
          key={active}
          className={`${tripBodyClass} [[data-switch=tab]_&]:animate-page-in ${forceCollapsed ? "pt-[calc(env(safe-area-inset-top,0px)+118px)]" : "pt-4"}`}
        >
          {children}
        </div>
      </TripShellActionsContext.Provider>
      <StickyDock>
        <FadeDock variant="fade" aria-hidden className="h-[120px]" />
        <ChatFab tripId={trip.id} avatars={chatPreview.avatars} preview={chatPreview.text} unread={chatPreview.unread} />
      </StickyDock>
      <ShareInviteSheet trip={trip} open={open} onOpenChange={setOpen} />
    </Screen>
  );
}
