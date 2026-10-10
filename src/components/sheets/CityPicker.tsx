"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Eyebrow } from "@/components/common/Eyebrow";
import { SearchField } from "@/components/common/SearchField";
import { EmojiTile } from "@/components/common/EmojiTile";
import { Search, X } from "@/components/icons/generated";
import { Spinner } from "@/components/icons/custom/Spinner";
import { Chip, chipVariants } from "@/components/ui/chip";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cityPicker as copy } from "@/data/seed/copy";
import { CIT } from "@/data/seed/cities";
import type { CityRef } from "@/data/types";
import { MIN_SEARCH_CHARS } from "@/lib/geocode";
import { scrollBehavior } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useCityResults } from "./useCityResults";

/** How close to the strip's edge a chip may sit before it counts as clipped (px). */
const EDGE = 8;
/** Length of the slide that brings a chip into view (ms). */
const REVEAL_MS = 320;

type CityPickerProps = {
  value: CityRef | null;
  onChange: (city: CityRef | null) => void;
  /** Quick start true, From sheet false. */
  allowDeselect: boolean;
  /** Search state is lifted so the owning sheet can reset it on every open. */
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (q: string) => void;
};

/**
 * One-line city strip plus one "other city" slot below it (C4 / C5). The slot is a dashed "Other city" button; tapped,
 * it becomes a full-width search field with the results floating above it (a popover, so they never take sheet
 * space). Picking a result turns the slot into an active chip for that city (tap = search again, × = clear). Tapping
 * outside, Escape or any strip chip puts the slot back.
 */
export function CityPicker({
  value,
  onChange,
  allowDeselect,
  searchOpen,
  onSearchOpenChange,
  query,
  onQueryChange,
}: CityPickerProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const revealFrame = useRef(0);
  const valueIsOther = value !== null && !CIT.some((c) => c.id === value.id);
  // Results (the hardcoded top Indian cities for an empty query, live search from MIN_SEARCH_CHARS). The query is cleared on open rather than on close, so the
  // list keeps its rows while the popover fades out.
  const { cities: results, loading, stale, offline } = useCityResults(query, searchOpen);

  function openSearch() {
    onQueryChange("");
    onSearchOpenChange(true);
  }

  function closeSearch() {
    onSearchOpenChange(false);
  }

  function cancelReveal() {
    cancelAnimationFrame(revealFrame.current);
  }
  // Never leave a frame running after the picker (its sheet) unmounts.
  useEffect(() => cancelReveal, []);

  /**
   * Slides the strip so a chip is centred, e.g. a city picked from the dropdown that the strip already lists.
   * Animated by hand rather than with a native smooth `scrollBy`: picking from the dropdown closes the search field
   * (and the iOS keyboard) in the same moment, and WebKit drops a native smooth scroll when the layout moves under
   * it, so the chip sometimes stayed off-screen. Here the target is re-read every frame and the last frame always
   * lands on it; a touch on the strip hands control back to the user.
   */
  function revealChip(id: string, behavior: ScrollBehavior = scrollBehavior()) {
    const strip = stripRef.current;
    const chip = strip?.querySelector<HTMLElement>(`[data-city-id="${id}"]`);
    if (!strip || !chip) return;
    const target = () => {
      const s = strip.getBoundingClientRect();
      const c = chip.getBoundingClientRect();
      const left = strip.scrollLeft + c.left - s.left - (s.width - c.width) / 2;
      return Math.min(Math.max(left, 0), strip.scrollWidth - strip.clientWidth);
    };
    cancelReveal();
    if (behavior !== "smooth") {
      strip.scrollLeft = target();
      return;
    }
    const from = strip.scrollLeft;
    let start: number | undefined;
    const step = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / REVEAL_MS, 1);
      strip.scrollLeft = from + (target() - from) * (1 - (1 - t) ** 3);
      if (t < 1) revealFrame.current = requestAnimationFrame(step);
    };
    revealFrame.current = requestAnimationFrame(step);
  }

  /** A tapped chip that is clipped by the strip's edge slides into view; one that is fully visible stays put. */
  function ensureVisible(id: string) {
    const strip = stripRef.current;
    const chip = strip?.querySelector<HTMLElement>(`[data-city-id="${id}"]`);
    if (!strip || !chip) return;
    const s = strip.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    if (c.left < s.left + EDGE || c.right > s.right - EDGE) revealChip(id);
  }

  // The picker mounts each time its sheet opens: if the city already selected is a strip chip, bring it into view
  // before the first paint, so a selection further along the strip is never hidden off-screen.
  useLayoutEffect(() => {
    if (value) revealChip(value.id, "auto");
    // Mount only; later selections reveal their chip themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(city: CityRef) {
    onChange(city);
    closeSearch();
    revealChip(city.id);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div
        ref={stripRef}
        onTouchStart={cancelReveal}
        onWheel={cancelReveal}
        className="-mx-4 flex gap-1.5 overflow-x-auto overscroll-x-contain px-4 scrollbar-none"
      >
        {CIT.map((c) => {
          const on = value?.id === c.id;
          return (
            <Chip
              key={c.id}
              data-city-id={c.id}
              size="lg"
              pressed={on}
              onClick={() => {
                if (searchOpen) closeSearch();
                onChange(on && allowDeselect ? null : c);
                if (!on) ensureVisible(c.id);
              }}
              className="shrink-0 transition-colors duration-160"
            >
              {/* The selected label ("📍 Mumbai") is wider than the plain one, so a hidden copy of it sets the chip's width:
                  selecting or deselecting never resizes the chip or shoves its neighbours. */}
              <span className="grid justify-items-center">
                <span aria-hidden className="invisible col-start-1 row-start-1">
                  {copy.pickedPrefix + c.name}
                </span>
                <span className="col-start-1 row-start-1">{on ? copy.pickedPrefix + c.name : c.name}</span>
              </span>
            </Chip>
          );
        })}
      </div>

      <Popover open={searchOpen} onOpenChange={(open) => !open && closeSearch()}>
        <PopoverAnchor asChild>
          {/* Fixed 40px (the chip height): the button, the chip and the search field swap in place with no layout shift. */}
          <div ref={slotRef} className="flex h-10">
            {searchOpen ? (
              <SearchField
                autoFocus
                // The dropdown is the suggestion list: no browser autofill, autocorrect or spellcheck on top of it.
                name="city-search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                wrapperClassName="w-full animate-fade-in"
                shellClassName="h-10 rounded-full pl-3.5 pr-1.5"
                srLabel={copy.searchLabel}
                placeholder={copy.placeholder}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onClear={() => onQueryChange("")}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSearch();
                  }
                }}
              />
            ) : valueIsOther ? (
              <span className={cn(chipVariants({ size: "lg", variant: "solid" }), "cursor-default gap-0 px-0 active:scale-100")}>
                <button
                  type="button"
                  aria-label={copy.changeLabel(value.name)}
                  onClick={openSearch}
                  className={cn(
                    "h-full cursor-pointer rounded-full pl-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ink",
                    allowDeselect ? "pr-1.5" : "pr-[14px]",
                  )}
                >
                  {copy.pickedPrefix + value.name}
                </button>
                {allowDeselect && (
                  <button
                    type="button"
                    aria-label={copy.clearLabel}
                    onClick={() => onChange(null)}
                    className="mr-1 grid size-8 cursor-pointer place-items-center rounded-full outline-none hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    <X className="size-3.5" strokeWidth={2.4} />
                  </button>
                )}
              </span>
            ) : (
              <Chip size="lg" variant="dashed" onClick={openSearch}>
                <Search className="size-4" />
                {copy.other}
              </Chip>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          // The field keeps focus (and the keyboard) while the list is open; a tap on the field itself is not "outside".
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (slotRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
          className="max-h-[min(340px,var(--radix-popover-content-available-height))] w-(--radix-popover-trigger-width) overflow-y-auto overscroll-contain rounded-3xl p-1.5 scrollbar-none"
        >
          {results.length === 0 ? (
            <p className="flex items-center gap-2.5 px-3 py-4 text-13 text-muted" role="status">
              {loading && (
                <span aria-hidden className="flex">
                  <Spinner className="size-4 border-line-2 border-t-ink border-r-ink" />
                </span>
              )}
              {loading
                ? copy.searching
                : query.trim().length < MIN_SEARCH_CHARS
                  ? copy.keepTyping
                  : copy.empty}
            </p>
          ) : (
            // The previous results stay (dimmed) while a new query is on its way.
            <div aria-busy={stale} className={cn("transition-opacity duration-160", stale && "opacity-50")}>
              {!query.trim() && <Eyebrow className="px-3 pt-2 pb-1">{copy.topHeading}</Eyebrow>}
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={value?.id === r.id}
                  onClick={() => pick(r)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left outline-none hover:bg-surface-2 focus-visible:bg-surface-2",
                    value?.id === r.id && "bg-success-tint",
                  )}
                >
                  <EmojiTile emoji="📍" size={34} shape="circle" tint="surface-2" />
                  <span className="flex min-w-0 flex-col gap-px">
                    <span className="text-16 font-semibold">{r.name}</span>
                    <span className="text-13 text-muted">{r.region}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {offline && <p className="px-3 pt-1.5 pb-1 text-12 text-muted">{copy.offline}</p>}
        </PopoverContent>
      </Popover>
    </div>
  );
}
