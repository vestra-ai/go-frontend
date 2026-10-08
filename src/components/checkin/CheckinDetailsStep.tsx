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
import { CHECKIN, CHECKIN_COPY } from "@/data/seed/checkin";
import { SESSION_USER_ID, USERS } from "@/data/seed/users";
import type { TripId } from "@/data/types";
import { useStore } from "@/store";

const copy = CHECKIN_COPY.details;

type CheckinDetailsStepProps = {
  tripId: TripId;
  onContinue: () => void;
  /** The step replaced another inside the open sheet: its content slides in. */
  swapped: boolean;
};

/**
 * K2 web check-in step 1: read-only passenger details, DigiYatra switch and the restricted-items declaration.
 * Content only: CheckinSheet owns the sheet, so moving between steps never closes and reopens it.
 */
export function CheckinDetailsStep({ tripId, onContinue, swapped }: CheckinDetailsStepProps) {
  const digiYatra = useStore((s) => s.home[tripId].checkin.digiYatra);
  const declaration = useStore((s) => s.home[tripId].checkin.declaration);
  const setDigiYatra = useStore((s) => s.setDigiYatra);
  const setDeclaration = useStore((s) => s.setDeclaration);
  const { route, passenger } = CHECKIN;
  const me = USERS[SESSION_USER_ID];

  return (
    <>
      <SheetBody className={swapped ? "animate-page-in" : undefined}>
        <SheetHeader title={copy.title} subtitle={copy.sub} closeLabel={copy.close} />
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
          <KVRow label={copy.mobileLabel} value={passenger.mobile} className="py-3" />
          <KVRow label={copy.bagsLabel} value={passenger.bags} className="py-3" />
        </Card>
        <Card variant="outline" radius="lg" className="flex items-center gap-3 p-[12px_14px]">
          <span aria-hidden className="text-20">
            🙂
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-15 font-semibold tracking-sub">{copy.digiYatraTitle}</span>
            <span className="text-13 text-muted">{copy.digiYatraSub}</span>
          </div>
          <Switch
            checked={digiYatra}
            onCheckedChange={(on) => setDigiYatra(tripId, on)}
            aria-label={copy.digiYatraTitle}
          />
        </Card>
        <CheckboxCard
          title={copy.declarationTitle}
          sub={copy.declarationSub}
          checked={declaration}
          onCheckedChange={(c) => setDeclaration(tripId, c === true)}
          className="p-[12px_14px]"
        />
        <GoNote variant="peach">{copy.goNote}</GoNote>
      </SheetBody>
      <SheetFooter>
        <Button variant="primary" size="xl" className="w-full" disabled={!declaration} onClick={onContinue}>
          {copy.cta}
        </Button>
      </SheetFooter>
    </>
  );
}
