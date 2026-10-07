"use client";

import { useEffect, useRef, useState } from "react";
import { InfoNote } from "@/components/common/InfoNote";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { ROUTE_COPY, ROUTE_MODES, TRIP_TYPES } from "@/data/seed/routes";
import type { RouteMode, TripId, TripType } from "@/data/types";
import {
  chosen as chosenRoute,
  countLine,
  ctaLabel,
  filtersFor,
  legCodes,
  nTime,
  previewCount,
  slotText,
  visibleRoutes,
} from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { LegSummaryCard } from "./LegSummaryCard";
import { OptionListCard } from "./OptionListCard";
import { RouteOptionRow } from "./RouteOptionRow";
import { TimeChip } from "./TimeChip";
import { TimeSheet } from "./TimeSheet";

type RouteSheetProps = {
  tripId: TripId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** F2 private route picker over the chat (store-connected: `chat[tripId].route`), with the nested TimeSheet (F3). */
export function RouteSheet({ tripId, open, onOpenChange }: RouteSheetProps) {
  const route = useStore((s) => s.chat[tripId].route);
  const { trip, mode, filt, draft } = route;

  const codes = legCodes(mode);
  const shown = visibleRoutes(route);
  const chosen = chosenRoute(shown, route.pick);
  const onward = { eyebrow: ROUTE_COPY.onwardEyebrow, value: codes[0], meta: slotText(route.on) };
  const back = { eyebrow: ROUTE_COPY.returnEyebrow, value: codes[1], meta: slotText(route.ret) };
  const legs = trip === "round" ? [onward, back] : [onward];

  // Every close (X, scrim, drag, or Back changing `open`) discards the time-sheet drafts; the stage never changes.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) useStore.getState().closeTimeSheet(tripId);
    wasOpen.current = open;
  }, [open, tripId]);

  // The nested TimeSheet opens a frame after this sheet, so its focus/dismiss layer always stacks on top
  // (the F3 preset opens both in one commit, which would leave the time sheet inert and aria-hidden).
  const [layered, setLayered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLayered(open));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={96}>
      <SheetBody>
        <SheetHeader title={ROUTE_COPY.title[trip]} subtitle={ROUTE_COPY.sub[trip]} closeLabel={ROUTE_COPY.close} />

        <SegmentedControl
          variant="contained"
          aria-label={ROUTE_COPY.tripTypeLabel}
          value={trip}
          onValueChange={(v) => useStore.getState().setRouteTrip(tripId, v as TripType)}
        >
          {TRIP_TYPES.map((t) => (
            <SegmentedControlItem key={t.id} value={t.id}>
              {t.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>

        <SegmentedControl
          variant="separated"
          aria-label={ROUTE_COPY.modeLabel}
          value={mode}
          onValueChange={(v) => useStore.getState().setRouteMode(tripId, v as RouteMode)}
        >
          {ROUTE_MODES.map((m) => (
            <SegmentedControlItem key={m.id} value={m.id} className={cn(m.id !== mode && "text-ink")}>
              <span aria-hidden>{m.emoji}</span>
              {m.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>

        <LegSummaryCard legs={legs} />

        <div
          role="group"
          aria-label={ROUTE_COPY.filterLabel}
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none"
        >
          {filtersFor(mode, trip).map((f) => (
            <Chip
              key={f.id}
              size="lg"
              pressed={filt === f.id}
              onClick={() => useStore.getState().setRouteFilter(tripId, f.id)}
              className="transition-colors duration-160"
            >
              {f.label}
            </Chip>
          ))}
          <TimeChip count={nTime(route)} onOpen={() => useStore.getState().openTimeSheet(tripId)} />
        </div>

        <span className="px-1 text-13 font-semibold tracking-caption text-muted">{countLine(shown.length)}</span>

        <OptionListCard>
          {shown.length > 0 ? (
            shown.map((o) => (
              <RouteOptionRow
                key={o.id}
                option={o}
                trip={trip}
                selected={chosen?.id === o.id}
                onSelect={() => useStore.getState().pickRoute(tripId, o.id)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center gap-2.5 px-4 py-5 text-center">
              <span className="text-15 font-semibold">{ROUTE_COPY.emptyTitle}</span>
              <Button type="button" variant="tint" size="sm" onClick={() => useStore.getState().clearRouteFilters(tripId)}>
                {ROUTE_COPY.clearFilters}
              </Button>
            </div>
          )}
        </OptionListCard>

        <InfoNote>{ROUTE_COPY.privacy}</InfoNote>
      </SheetBody>

      <SheetFooter>
        <Button
          type="button"
          variant="primary"
          size="xl"
          className="w-full"
          disabled={!chosen}
          onClick={() => {
            if (!chosen) return;
            useStore.getState().bookRoute(tripId, { optionId: chosen.id, trip });
            onOpenChange(false);
          }}
        >
          {ctaLabel(chosen, trip)}
        </Button>
      </SheetFooter>

      <TimeSheet
        open={layered && draft !== null}
        trip={trip}
        codes={codes}
        draft={draft ?? { on: route.on, ret: route.ret }}
        preview={draft ? previewCount(route, draft) : shown.length}
        onToggle={(leg, id) => useStore.getState().toggleDraftSlot(tripId, leg, id)}
        onClear={() => useStore.getState().clearDraftSlots(tripId)}
        onApply={() => useStore.getState().applyTimeSlots(tripId)}
        onClose={() => useStore.getState().closeTimeSheet(tripId)}
      />
    </BottomSheet>
  );
}
