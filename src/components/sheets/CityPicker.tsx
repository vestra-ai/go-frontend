"use client";

import { useState } from "react";
import { SearchField } from "@/components/common/SearchField";
import { EmojiTile } from "@/components/common/EmojiTile";
import { Search } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { cityPicker as copy } from "@/data/seed/copy";
import { CIT, searchCities } from "@/data/seed/cities";
import type { CityRef } from "@/data/types";
import { cn } from "@/lib/utils";

type CityPickerProps = {
  value: CityRef | null;
  onChange: (city: CityRef | null) => void;
  /** Quick start true, From sheet false. */
  allowDeselect: boolean;
  /** Search state is lifted: the sheet's height depends on it. */
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (q: string) => void;
};

/** One-line city strip + inline "Other city" search (C4 / C5). */
export function CityPicker({
  value,
  onChange,
  allowDeselect,
  searchOpen,
  onSearchOpenChange,
  query,
  onQueryChange,
}: CityPickerProps) {
  // Last search result picked in this sheet session; stays first in the strip.
  const [lastPicked, setLastPicked] = useState<CityRef | null>(null);
  const valueIsOther = value !== null && !CIT.some((c) => c.id === value.id);
  const picked = valueIsOther ? value : lastPicked;
  const items = picked ? [picked, ...CIT] : CIT;

  const results = searchOpen ? searchCities(query) : [];

  function closeSearch() {
    onSearchOpenChange(false);
    onQueryChange("");
  }

  function pick(city: CityRef) {
    setLastPicked(city);
    onChange(city);
    closeSearch();
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none">
        {items.map((c) => {
          const on = value?.id === c.id;
          return (
            <Chip
              key={c.id}
              size="lg"
              pressed={on}
              onClick={() => onChange(on && allowDeselect ? null : c)}
              className="shrink-0 transition-colors duration-160"
            >
              {on ? copy.pickedPrefix + c.name : c.name}
            </Chip>
          );
        })}
      </div>

      {!searchOpen ? (
        <div className="flex">
          <Chip size="lg" variant="dashed" onClick={() => onSearchOpenChange(true)}>
            <Search className="size-4" />
            {copy.other}
          </Chip>
        </div>
      ) : (
        <div className="flex animate-fade-in flex-col gap-2.5">
          <SearchField
            autoFocus
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
          <Card variant="outline" radius="lg" className="px-3">
            {results.length === 0 ? (
              <p className="px-1 py-4 text-13 text-muted">{copy.empty}</p>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={value?.id === r.id}
                  onClick={() => pick(r)}
                  className={cn(
                    "flex w-full items-center gap-3 border-t border-line px-1 py-2.5 text-left first:border-t-0",
                    value?.id === r.id && "bg-success-tint",
                  )}
                >
                  <EmojiTile emoji="📍" size={34} shape="circle" tint="surface-2" />
                  <span className="flex min-w-0 flex-col gap-px">
                    <span className="text-16 font-semibold">{r.name}</span>
                    <span className="text-13 text-muted">{r.region}</span>
                  </span>
                </button>
              ))
            )}
          </Card>
          <div className="flex items-center justify-between px-1">
            <span className="text-12 text-muted">{copy.source}</span>
            <Button variant="link" size="xs" onClick={closeSearch}>
              {copy.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
