"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/common/Eyebrow";
import { InfoNote } from "@/components/common/InfoNote";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { fromSheet as copy } from "@/data/seed/copy";
import type { CityRef } from "@/data/types";
import { CityPicker } from "./CityPicker";

type FromCitySheetProps = {
  open: boolean;
  /** fromCity ?? seed Bengaluru. */
  initialCity: CityRef;
  /** ?q=Ind opens the sheet in search mode (C5). */
  initialQuery?: string | null;
  onSave: (city: CityRef) => void;
  /** X, scrim, drag, Back: nothing saved. */
  onClose: () => void;
};

// Sheet top on the 912px design artboard: 447 (h 465). Search results float above the field, so it never grows.
const SHEET_TOP = 447;

export function FromCitySheet({ open, initialCity, initialQuery, onSave, onClose }: FromCitySheetProps) {
  const [city, setCity] = useState<CityRef>(initialCity);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery));
  const [query, setQuery] = useState(initialQuery ?? "");

  // Draft restarts from props each time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setCity(initialCity);
      setSearchOpen(Boolean(initialQuery));
      setQuery(initialQuery ?? "");
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      top={SHEET_TOP}
      aria-label={copy.label}
    >
      <SheetBody className="pb-[120px]">
        <SheetHeader title={copy.title} subtitle={copy.sub} closeLabel={copy.close} />
        <div className="flex flex-col gap-2">
          <Eyebrow className="px-1">{copy.cityLabel}</Eyebrow>
          <CityPicker
            value={city}
            onChange={(c) => {
              if (c) setCity(c);
            }}
            allowDeselect={false}
            searchOpen={searchOpen}
            onSearchOpenChange={setSearchOpen}
            query={query}
            onQueryChange={setQuery}
          />
        </div>
        <InfoNote>{copy.privacy}</InfoNote>
      </SheetBody>
      <SheetFooter>
        <Button variant="primary" size="xl" onClick={() => onSave(city)}>
          {copy.save}
        </Button>
      </SheetFooter>
    </BottomSheet>
  );
}
