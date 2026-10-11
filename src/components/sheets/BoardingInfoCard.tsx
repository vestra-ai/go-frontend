import { Eyebrow } from "@/components/common/Eyebrow";
import { ArrowRight, FileText } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PrivateDetails } from "@/data/types";
import { FileOnItsWay } from "./FileOnItsWay";

type BoardingInfoCardProps = {
  details: PrivateDetails;
  /** Opens this leg's own file (`details.file`). Absent when the booking carries none for me. */
  onOpenTicket?: () => void;
  /** The booking's `created_at`, while its file may still be on its way: the button's place says so meanwhile. */
  pendingSince?: string;
};

/**
 * Flight, route, seat / departs / PNR and the ticket link (F-travel.md §1.4). No money. A stay is drawn the same way:
 * the hotel, check-in → check-out, its times and nights, and the voucher link.
 */
export function BoardingInfoCard({ details, onOpenTicket, pendingSince }: BoardingInfoCardProps) {

  return (
    <Card variant="float-sm" radius="2xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        {details.airline.logo ? (
          <span className="grid h-8 place-items-center rounded-lg border border-line bg-white px-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- the carrier's wordmark from the booking */}
            <img src={details.airline.logo} alt={details.airline.name} className="h-auto max-h-5 w-14 object-contain" />
          </span>
        ) : (
          <span className="min-w-0 truncate text-15 font-semibold">{details.airline.name}</span>
        )}
        <span className="shrink-0 text-13 font-semibold text-muted">{details.flight}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-34 leading-none font-bold tracking-display">{details.from.code}</span>
          <span className="text-13 text-muted">{details.from.time}</span>
        </div>
        <ArrowRight className="mb-3.5 size-5 text-faint" />
        <div className="flex flex-col items-end">
          <span className="text-34 leading-none font-bold tracking-display">{details.to.code}</span>
          <span className="text-13 text-muted">{details.to.time}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t-[1.5px] border-dashed border-line-2 pt-2.5">
        {details.cells.map((cell) => (
          <div key={cell.label} className="flex min-w-0 flex-col gap-0.5">
            <Eyebrow>{cell.label}</Eyebrow>
            <span className="truncate text-18 font-bold tabular-nums">{cell.value}</span>
          </div>
        ))}
      </div>
      {onOpenTicket && details.file ? (
        <Button type="button" variant="secondary" size="sm" className="h-[42px] w-full gap-1.5" onClick={onOpenTicket}>
          <FileText className="size-4" />
          {details.file.label}
        </Button>
      ) : (
        pendingSince && <FileOnItsWay key={pendingSince} since={pendingSince} />
      )}
    </Card>
  );
}
