import Link from "next/link";
import { Eyebrow } from "@/components/common/Eyebrow";
import { ArrowRight, FileText } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRIVATE_COPY } from "@/data/seed/bookings";
import type { PrivateDetails } from "@/data/types";

type BoardingInfoCardProps = { details: PrivateDetails; ticketHref: string };

/** Flight, route, seat / boards / PNR and the ticket link (F-travel.md §1.4). No money. */
export function BoardingInfoCard({ details, ticketHref }: BoardingInfoCardProps) {
  const cells = [
    { label: PRIVATE_COPY.seat, value: details.seat, className: "" },
    { label: PRIVATE_COPY.boards, value: details.boards, className: "tabular-nums" },
    { label: PRIVATE_COPY.pnr, value: details.pnr, className: "" },
  ];

  return (
    <Card variant="float-sm" radius="2xl" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-8 place-items-center rounded-lg bg-indigo px-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG brand logo */}
          <img src={details.airline.logo} alt={details.airline.name} className="h-auto w-14" />
        </span>
        <span className="text-13 font-semibold text-muted">{details.flight}</span>
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
        {cells.map((cell) => (
          <div key={cell.label} className="flex flex-col gap-0.5">
            <Eyebrow>{cell.label}</Eyebrow>
            <span className={`text-18 font-bold ${cell.className}`}>{cell.value}</span>
          </div>
        ))}
      </div>
      <Button asChild variant="secondary" size="sm" className="h-[42px] w-full gap-1.5">
        <Link href={ticketHref}>
          <FileText className="size-4" />
          {PRIVATE_COPY.openTicket}
        </Link>
      </Button>
    </Card>
  );
}
