import { PassField } from "@/components/checkin/PassField";
import { RouteRow } from "@/components/checkin/RouteRow";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QrBitmap } from "@/components/icons/custom/QrBitmap";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { CheckIn } from "@/data/types";

const copy = CHECKIN_COPY.pass;

type BoardingPassCardProps = {
  /** A finished check-in (`pass` is set). */
  checkin: CheckIn & { pass: NonNullable<CheckIn["pass"]> };
  /** The seat the airline confirmed, shown in the SEAT field. */
  seat: string;
  /** Hides the "DigiYatra on" pill when the traveller switched it off. */
  digiYatra?: boolean;
};

/** K4 boarding pass: indigo band, route, 8 fields, tear line, QR stub. */
export function BoardingPassCard({ checkin, seat, digiYatra = true }: BoardingPassCardProps) {
  const { route, passRoute, pass } = checkin;
  const f = copy.fields;

  return (
    <Card variant="shadow" radius="3xl" className="overflow-hidden">
      <div className="flex items-center justify-between bg-ink px-[18px] py-3.5 text-white">
        {checkin.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- the carrier's wordmark from the booking
          <img src={checkin.logo} alt="" className="h-5 w-auto max-w-[110px] object-contain" />
        ) : (
          <span aria-hidden className="text-18 leading-none">
            ✈️
          </span>
        )}
        <span className="text-14 font-bold tracking-badge">{checkin.flight}</span>
      </div>
      <div className="flex flex-col gap-4 p-[18px]">
        <RouteRow
          size="lg"
          from={route.from}
          fromSub={passRoute.fromSub}
          to={route.to}
          toSub={passRoute.toSub}
        />
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <PassField label={f.passenger} value={pass.passenger} />
            <PassField label={f.date} value={checkin.date} align="end" />
          </div>
          <div className="flex gap-2">
            <PassField label={f.boarding} value={pass.boarding} />
            <PassField label={f.departs} value={pass.departs} align="center" />
            <PassField label={f.seat} value={seat} align="end" />
          </div>
          <div className="flex gap-2">
            <PassField label={f.gate} value={pass.gate} />
            <PassField label={f.zone} value={pass.zone} align="center" />
            <PassField label={f.seq} value={pass.seq} align="end" />
          </div>
        </div>
      </div>
      <Separator variant="dashed" aria-hidden className="mx-[18px] w-auto border-t-2 border-line" />
      <div className="flex items-center gap-4 p-[18px]">
        {pass.qr && <QrBitmap rows={pass.qr} size={150} />}
        <div className="flex flex-1 flex-col gap-2">
          {digiYatra && (
            <Badge variant="success-soft" size="md" className="self-start text-12 font-bold">
              <span aria-hidden>{copy.digiYatra.slice(0, 2)}</span>
              {copy.digiYatra.slice(2)}
            </Badge>
          )}
          <p className="text-13 text-muted">{copy.digiYatraHelp}</p>
          {checkin.passenger.bags && <p className="text-13 text-muted">{checkin.passenger.bags}</p>}
        </div>
      </div>
    </Card>
  );
}
