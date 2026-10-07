"use client";

import { AvatarStack } from "@/components/common/AvatarStack";
import { Eyebrow } from "@/components/common/Eyebrow";
import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { invite as copy } from "@/data/seed/copy";
import type { Invite, Trip, User } from "@/data/types";
import { formatWhosIn } from "@/lib/format";

type InviteSheetProps = {
  open: boolean;
  invite: Invite;
  trip: Trip;
  inviter: User;
  members: User[];
  media: { kind: "photo" | "illustration"; src: string; alt: string };
  onAccept: () => void;
  /** X, Not now, scrim tap and drag-down. */
  onDismiss: () => void;
};

// The design's sheet is 536px tall (top 376 on the 912px artboard).
const TOP = 376;

/** Invite landing sheet: who invited you, the trip card, what happens on join, Accept / Not now. */
export function InviteSheet({ open, invite, trip, inviter, members, media, onAccept, onDismiss }: InviteSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
      }}
      top={TOP}
    >
      <SheetBody className="pb-[140px]">
        <SheetHeader
          leading={<Avatar size={36} name={inviter.name} src={inviter.avatar} tone={inviter.tone} />}
          title={copy.title(inviter.firstName)}
          subtitle={copy.sub}
          closeLabel={copy.close}
        />
        <Card variant="shadow" radius="2xl" className="flex items-center gap-3 p-3.5">
          {media.kind === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo
            <img src={media.src} alt={media.alt} className="size-[76px] shrink-0 rounded-3xl object-cover" />
          ) : (
            <span className={`flex size-[76px] shrink-0 items-center justify-center rounded-3xl ${trip.tintClass}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG illustration */}
              <img src={media.src} alt={media.alt} className="size-16" />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="text-20 leading-[1.2] font-semibold tracking-h3">{trip.name}</span>
            {trip.dates && <span className="text-13 leading-[1.35] tracking-caption text-muted">{trip.dates.label}</span>}
            <span className="flex items-center gap-1.5 text-13 tracking-caption text-muted">
              <AvatarStack
                size={22}
                overlap={7}
                ring="white"
                avatars={members.map((u) => ({ name: u.name, src: u.avatar, tone: u.tone }))}
              />
              {formatWhosIn(members.map((u) => u.firstName))}
            </span>
          </div>
        </Card>
        <ListCard padding="rows" className="px-4 py-1">
          <Eyebrow tone="muted" className="pt-2.5 pb-1">
            {copy.whenYouJoin}
          </Eyebrow>
          {invite.whenYouJoin.map((line) => {
            const split = line.indexOf(" ");
            return (
              <ListRow
                key={line}
                dense
                leading={
                  <span aria-hidden className="w-5 text-center text-16 leading-none">
                    {line.slice(0, split)}
                  </span>
                }
                title={<span className="font-normal">{line.slice(split + 1)}</span>}
              />
            );
          })}
        </ListCard>
      </SheetBody>
      <SheetFooter>
        <Button variant="primary" size="xl" className="w-full" onClick={onAccept}>
          {copy.accept}
        </Button>
        <Button variant="link" className="h-12 w-full text-16" onClick={onDismiss}>
          {copy.notNow}
        </Button>
      </SheetFooter>
    </BottomSheet>
  );
}
