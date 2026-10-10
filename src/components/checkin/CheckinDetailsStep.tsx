"use client";

import { CheckBadge } from "@/components/common/CheckBadge";
import { CheckboxCard } from "@/components/common/CheckboxCard";
import { GoNote } from "@/components/common/GoNote";
import { KVRow } from "@/components/common/KVRow";
import { ListRow } from "@/components/common/ListRow";
import { StepIndicator } from "@/components/common/StepIndicator";
import { RouteRow } from "@/components/checkin/RouteRow";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { errorMessage } from "@/api/http";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { CheckIn, TripId, User } from "@/data/types";
import { toastGo } from "@/lib/toast";
import { patchCheckin } from "@/state";

const copy = CHECKIN_COPY.details;

type CheckinDetailsStepProps = {
  tripId: TripId;
  bookingId: string;
  checkin: CheckIn;
  me: User;
  /** The friend on the same booking, when there is one. */
  friend: User | null;
  onContinue: () => void;
  /** The step replaced another inside the open sheet: its content slides in. */
  swapped: boolean;
};

/**
 * Web check-in step 1: read-only passenger details, DigiYatra switch and the restricted-items declaration. Each answer
 * is a `PATCH …/checkin`; nothing reaches the airline until "Check in" (CONTRACT-APP §4.12).
 * Content only: CheckinSheet owns the sheet, so moving between steps never closes and reopens it.
 */
export function CheckinDetailsStep({ tripId, bookingId, checkin, me, friend, onContinue, swapped }: CheckinDetailsStepProps) {
  const { route, passenger, digiYatra, declaration } = checkin;
  const save = (body: { digi_yatra?: boolean; declaration?: boolean }) =>
    void patchCheckin(tripId, bookingId, body).catch((err) => toastGo(errorMessage(err, copy.failed)));

  return (
    <>
      <SheetBody className={swapped ? "animate-page-in" : undefined}>
        <SheetHeader title={copy.title(checkin.flight)} subtitle={copy.sub(checkin.date)} closeLabel={copy.close} />
        <StepIndicator step={1} labels={CHECKIN_COPY.steps} />
        <Card variant="outline" radius="lg" className="p-[12px_14px]">
          <RouteRow
            size="sm"
            from={route.from}
            fromTime={route.fromTime}
            fromSub={route.fromSub}
            to={route.to}
            toTime={route.toTime}
            toSub={route.toSub}
          />
        </Card>
        <Card variant="outline" radius="lg" className="px-3.5 py-1">
          <ListRow
            leading={<Avatar size={40} name={me.name} src={me.avatar} tone={me.tone} />}
            title={<span className="tracking-body">{passenger.name}</span>}
            sub={passenger.sub}
            trailing={<CheckBadge size={22} />}
          />
          {passenger.mobile && <KVRow label={copy.mobileLabel} value={passenger.mobile} className="py-3" />}
          {passenger.bags && <KVRow label={copy.bagsLabel} value={passenger.bags} className="py-3" />}
        </Card>
        <Card variant="outline" radius="lg" className="flex items-center gap-3 p-[12px_14px]">
          <span aria-hidden className="text-20">
            🙂
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-15 font-semibold tracking-sub">{copy.digiYatraTitle}</span>
            <span className="text-13 text-muted">{copy.digiYatraSub(route.fromSub)}</span>
          </div>
          <Switch
            checked={digiYatra}
            onCheckedChange={(on) => save({ digi_yatra: on })}
            aria-label={copy.digiYatraTitle}
          />
        </Card>
        <CheckboxCard
          title={copy.declarationTitle}
          sub={copy.declarationSub}
          checked={declaration}
          onCheckedChange={(c) => save({ declaration: c === true })}
          className="p-[12px_14px]"
        />
        <GoNote variant="peach">{copy.goNote(friend?.firstName ?? null)}</GoNote>
      </SheetBody>
      <SheetFooter>
        <Button variant="primary" size="xl" className="w-full" disabled={!declaration} onClick={onContinue}>
          {copy.cta}
        </Button>
      </SheetFooter>
    </>
  );
}
