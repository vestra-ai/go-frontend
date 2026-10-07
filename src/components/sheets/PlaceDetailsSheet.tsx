"use client";

import { useState } from "react";
import { AvatarStack } from "@/components/common/AvatarStack";
import { CheckBadge } from "@/components/common/CheckBadge";
import { Eyebrow } from "@/components/common/Eyebrow";
import { GoNote } from "@/components/common/GoNote";
import { KVRow } from "@/components/common/KVRow";
import { ListCard } from "@/components/common/ListCard";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { placeSheet as copy, polls } from "@/data/seed/copy";
import type { PlaceOption, UserId } from "@/data/types";
import { userStackAvatar } from "@/lib/avatars";
import { splitEmoji } from "@/lib/emoji";
import { cn } from "@/lib/utils";

type PlaceDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `place.details.layout` picks the layout. */
  place: PlaceOption | null;
  /** Rich voters row: place.voters (seed). */
  voters: UserId[];
  /** votePlace(id), then close: the caller closes the sheet. */
  onVote: (id: PlaceOption["id"]) => void;
};

/** E2 (rich, Goa) and E3/E4 (light, Gokarna/Udaipur) place details (E-deciding.md §1.3). */
export function PlaceDetailsSheet({ open, onOpenChange, place, voters, onVote }: PlaceDetailsSheetProps) {
  // Keep the last place so the sheet keeps its content while it animates out after the query clears.
  const [last, setLast] = useState(place);
  if (place && place !== last) setLast(place);
  const shown = place ?? last;
  if (!shown) return null;

  const details = shown.details;
  const rich = details.layout === "rich";

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={rich ? 96 : 200} aria-label={shown.name}>
      <SheetBody className={rich ? "pb-[150px]" : "pb-[120px]"}>
        <SheetHeader title={shown.name} subtitle={details.subtitle} />

        {details.layout === "rich" ? (
          <>
            <div className="relative h-[170px] overflow-hidden rounded-6xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={details.hero.src} alt={details.hero.alt} className="size-full object-cover" />
              <span aria-hidden className="absolute inset-0 bg-linear-to-b from-ink/0 from-40% to-ink/65" />
              <span className="absolute bottom-3 left-3.5 flex flex-col text-white">
                <span className="text-30 font-bold tracking-title">{shown.name}</span>
                <span className="text-14 font-medium">{details.caption}</span>
              </span>
              <Badge variant="glass" size="md" className="absolute top-3 right-3 font-bold">
                {details.price}
              </Badge>
            </div>

            <ListCard variant="outline" radius="2xl" className="px-4 py-1">
              <Eyebrow className="pt-2.5 pb-0.5">{copy.why}</Eyebrow>
              <ul className="flex flex-col">
                {details.whyRows.map((row, i) => (
                  <li key={row} className={cn("flex items-start gap-2.5 py-[11px]", i > 0 && "border-t border-line")}>
                    <CheckBadge size={22} />
                    <span className="flex-1 text-15 leading-[1.35]">{row}</span>
                  </li>
                ))}
              </ul>
            </ListCard>

            <Card variant="outline" radius="2xl" className="flex flex-col gap-2.5 px-4 py-3.5">
              <Eyebrow>{copy.cost}</Eyebrow>
              {details.cost.map((row) => (
                <div key={row.label} className="flex justify-between text-15">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="w-[18px]">
                      {row.emoji}
                    </span>
                    {row.label}
                  </span>
                  <span className="font-semibold tabular-nums">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t-[1.5px] border-dashed border-line-2 pt-2.5 text-16 font-bold">
                <span>{copy.about}</span>
                <span className="tabular-nums">{details.total}</span>
              </div>
            </Card>

            <div className="flex flex-col gap-2">
              <Eyebrow className="px-1">{copy.activities}</Eyebrow>
              <div className="flex flex-wrap gap-1.5">
                {details.activities.map((activity) => {
                  const { emoji, label } = splitEmoji(activity);
                  return (
                    <Chip key={activity} size="sm" variant="plain" emoji={emoji || undefined} className="border-line-2">
                      {label}
                    </Chip>
                  );
                })}
              </div>
            </div>

            <Card variant="outline" radius="lg" className="flex items-center gap-2.5 px-3.5 py-3">
              {voters.length > 0 && <AvatarStack avatars={voters.map(userStackAvatar)} size={26} overlap={8} ring="white" />}
              <span className="flex-1 text-14">{details.votersLine}</span>
            </Card>
          </>
        ) : (
          <>
            <div className={cn("flex h-[150px] items-center justify-center rounded-5xl", details.tint)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={details.img} alt={shown.name} className="size-[110px]" />
            </div>

            <ListCard variant="outline" radius="lg" className="px-3.5 py-1">
              {details.facts.map((fact) => (
                <KVRow key={fact.label} label={fact.label} value={fact.value} size={14} />
              ))}
            </ListCard>

            <GoNote>{details.goNote}</GoNote>
          </>
        )}
      </SheetBody>

      <SheetFooter>
        <Button type="button" variant="primary" size="xl" className="w-full" onClick={() => onVote(shown.id)}>
          {polls.voteFor(shown.name)}
        </Button>
        {rich && (
          <Button type="button" variant="link" className="h-11 text-16" onClick={() => onOpenChange(false)}>
            {copy.backToAll}
          </Button>
        )}
      </SheetFooter>
    </BottomSheet>
  );
}
