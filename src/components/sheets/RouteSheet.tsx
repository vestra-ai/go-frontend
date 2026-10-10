"use client";

import { useState } from "react";
import { FilterChipRow } from "@/components/common/FilterChipRow";
import { InfoNote } from "@/components/common/InfoNote";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { ROUTE_COPY, ROUTE_MODES, TRIP_TYPES } from "@/data/seed/routes";
import type { RouteMode, SlotId, TripType } from "@/data/types";
import {
  chosen as chosenRoute,
  countLine,
  ctaLabel,
  filtersFor,
  legCodes,
  modesOf,
  nTime,
  previewCount,
  visibleRoutes,
} from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { RouteCardModel } from "@/state/optionView";
import { OptionListCard } from "./OptionListCard";
import { RouteOptionRow } from "./RouteOptionRow";
import { TimeChip } from "./TimeChip";
import { TimeSheet } from "./TimeSheet";

type RouteSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The travel options Go found (an `options` card), kept by the caller while the sheet animates out. */
  card: RouteCardModel | null;
  /** "Book": the card's per-option action with the picked option and the one way / round trip choice. */
  onBook: (optionId: string, trip: TripType) => void;
  /** The tap is on its way. */
  pending?: boolean;
};

type Slots = { on: SlotId[]; ret: SlotId[] };
const NO_SLOTS: Slots = { on: [], ret: [] };

/**
 * The route picker over the chat, with the nested TimeSheet. The options are the card's own (CONTRACT-APP §4.7),
 * filtered on the client; nothing is booked here: "Book" tells Go which one, and Go follows up in the room.
 */
export function RouteSheet({ open, onOpenChange, card, onBook, pending = false }: RouteSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={96}>
      {card && <RoutePicker key={card.cardId} card={card} onBook={onBook} pending={pending} />}
    </BottomSheet>
  );
}

function RoutePicker({ card, onBook, pending }: { card: RouteCardModel; onBook: RouteSheetProps["onBook"]; pending: boolean }) {
  const { options } = card;
  const modes = modesOf(options);
  const [trip, setTrip] = useState<TripType>(card.hasReturn ? "round" : "oneway");
  const [mode, setMode] = useState<RouteMode>(modes[0] ?? "flight");
  const [filt, setFilt] = useState("all");
  const [pick, setPick] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slots>(NO_SLOTS);
  // The TimeSheet edits a draft; nothing changes until "Show options".
  const [draft, setDraft] = useState<Slots | null>(null);

  const query = { trip, mode, filt, ...slots };
  const codes = legCodes(options, mode);
  const shown = visibleRoutes(options, query);
  const chosen = chosenRoute(shown, pick);
  const sample = options.find((o) => o.mode === mode) ?? options[0];
  const days: [string, string] = [sample?.legs[0]?.day ?? "", sample?.legs[1]?.day ?? ""];

  return (
    <>
      <SheetBody>
        <SheetHeader
          title={ROUTE_COPY.title(codes[0], trip) || card.title}
          subtitle={ROUTE_COPY.sub(days[0], days[1] || null, trip)}
          closeLabel={ROUTE_COPY.close}
        />
        {card.hasReturn && (
          <SegmentedControl variant="compact" aria-label={ROUTE_COPY.tripTypeLabel} value={trip} onValueChange={(v) => setTrip(v as TripType)}>
            {TRIP_TYPES.map((t) => (
              <SegmentedControlItem key={t.id} value={t.id}>
                {t.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
        {modes.length > 1 && (
          <SegmentedControl
            variant="separated"
            aria-label={ROUTE_COPY.modeLabel}
            value={mode}
            onValueChange={(v) => {
              setMode(v as RouteMode);
              setFilt("all");
              setPick(null);
            }}
          >
            {ROUTE_MODES.filter((m) => modes.includes(m.id)).map((m) => (
              <SegmentedControlItem key={m.id} value={m.id} className={cn(m.id !== mode && "text-ink")}>
                <span aria-hidden>{m.emoji}</span>
                {m.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
        {/* Time stays pinned at the end of the filter row so it is never scrolled out of reach. */}
        <div className="-mx-4 flex items-center">
          <FilterChipRow
            mode="pressed"
            aria-label={ROUTE_COPY.filterLabel}
            className="min-w-0 flex-1 [mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)]"
            options={filtersFor(mode).map((f) => ({ value: f.id, label: f.label }))}
            value={filt}
            onValueChange={setFilt}
          />
          <div className="shrink-0 pr-4 pl-1.5">
            <TimeChip count={nTime(query)} onOpen={() => setDraft({ on: [...slots.on], ret: [...slots.ret] })} />
          </div>
        </div>
        <span className="sr-only" role="status">
          {countLine(shown.length)}
        </span>
        <OptionListCard>
          {shown.length > 0 ? (
            shown.map((o) => <RouteOptionRow key={o.id} option={o} trip={trip} selected={chosen?.id === o.id} onSelect={() => setPick(o.id)} />)
          ) : (
            <div className="flex flex-col items-center gap-2.5 px-4 py-5 text-center">
              <span className="text-15 font-semibold">{ROUTE_COPY.emptyTitle}</span>
              <Button
                type="button"
                variant="tint"
                size="sm"
                onClick={() => {
                  setFilt("all");
                  setSlots(NO_SLOTS);
                }}
              >
                {ROUTE_COPY.clearFilters}
              </Button>
            </div>
          )}
        </OptionListCard>
        <InfoNote>{ROUTE_COPY.privacy}</InfoNote>
      </SheetBody>
      {/* Without the card's own button for me (it is someone else's to pick), the list is there to read. */}
      {card.action && (
        <SheetFooter>
          <Button
            type="button"
            variant="primary"
            size="xl"
            className="w-full"
            disabled={!chosen || pending}
            aria-busy={pending}
            onClick={() => chosen && onBook(chosen.id, trip)}
          >
            {ctaLabel(chosen, trip)}
          </Button>
        </SheetFooter>
      )}
      <TimeSheet
        open={draft !== null}
        trip={trip}
        codes={codes}
        days={days}
        draft={draft ?? slots}
        preview={draft ? previewCount(options, query, draft) : shown.length}
        onToggle={(leg, id) =>
          setDraft((d) => {
            const base = d ?? slots;
            const list = base[leg].includes(id) ? base[leg].filter((x) => x !== id) : [...base[leg], id].sort();
            return { ...base, [leg]: list };
          })
        }
        onClear={() => setDraft(NO_SLOTS)}
        onApply={() => {
          if (draft) setSlots(draft);
          setPick(null);
          setDraft(null);
        }}
        onClose={() => setDraft(null)}
      />
    </>
  );
}
