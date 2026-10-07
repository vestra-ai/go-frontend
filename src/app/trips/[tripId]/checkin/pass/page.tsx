"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckBadge } from "@/components/common/CheckBadge";
import { GoNote } from "@/components/common/GoNote";
import { StepIndicator } from "@/components/common/StepIndicator";
import { BoardingPassCard } from "@/components/checkin/BoardingPassCard";
import { Share } from "@/components/icons/generated";
import { FadeDock } from "@/components/shell/FadeDock";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { Note } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FLIGHT_BOOKING_ID } from "@/data/seed/bookings";
import { CHECKIN, CHECKIN_COPY } from "@/data/seed/checkin";
import { USERS } from "@/data/seed/users";
import type { TripId } from "@/data/types";
import { toastGo } from "@/lib/toast";
import { useHydrated, useStore } from "@/store";

const copy = CHECKIN_COPY.pass;

export default function BoardingPassPage() {
  const tripId = useParams<{ tripId: string }>().tripId as TripId;
  const hydrated = useHydrated();
  const checkin = useStore((s) => s.home[tripId]?.checkin);

  if (!hydrated || !checkin) return <Screen bg="canvas">{null}</Screen>;

  const sel = checkin.seat;
  const arjun = USERS[CHECKIN.friendId];
  // DESIGN-ASSUMPTION (K-checkin.md §1.7 #1–2): the chosen seat shows here; non-adjacent copy is new.
  const success = CHECKIN.nextToFriend.includes(sel) ? copy.successNextTo(sel) : copy.success(sel);

  return (
    <Screen bg="canvas">
      <TopBar
        title={copy.title}
        backHref={`/trips/${tripId}`}
        trailing={
          <Button
            variant="ghost"
            size="icon"
            aria-label={copy.shareLabel}
            onClick={() => toastGo(copy.shareToast)}
          >
            <Share className="size-5" />
          </Button>
        }
      />
      <div className="flex flex-col gap-3 px-4 pt-1 pb-[130px]">
        <StepIndicator step={3} labels={CHECKIN_COPY.steps} />
        <Note
          variant="green"
          icon={<CheckBadge size={24} />}
          className="text-15 font-semibold transition-[opacity,transform] duration-220 starting:translate-y-1.5 starting:opacity-0"
        >
          {success}
        </Note>
        <BoardingPassCard checkin={CHECKIN} seat={sel} digiYatra={checkin.digiYatra} />
        <GoNote
          variant="outline"
          trailing={<Avatar size={28} name={arjun.name} src={arjun.avatar} tone={arjun.tone} />}
        >
          {copy.goNote}
        </GoNote>
      </div>
      <FadeDock variant="gradient" className="flex-row gap-2 px-4 pt-[30px]">
        <Button variant="primary" size="xl" className="flex-1 text-17" onClick={() => toastGo(copy.walletToast)}>
          {copy.wallet}
        </Button>
        <Button variant="secondary" size="xl" asChild className="flex-1 px-3.5 text-16 tracking-sm">
          <Link href={`/trips/${tripId}/bookings/${FLIGHT_BOOKING_ID}/ticket`}>{copy.download}</Link>
        </Button>
      </FadeDock>
    </Screen>
  );
}
