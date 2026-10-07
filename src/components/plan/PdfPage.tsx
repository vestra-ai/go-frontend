import { BOOKINGS_COPY } from "@/data/seed/bookings";
import type { TicketDoc } from "@/data/types";
import { assets } from "@/lib/assets";

const copy = BOOKINGS_COPY.viewer;

const Bar = ({ w, h = "h-2.5" }: { w: string; h?: string }) => (
  <span aria-hidden className={`block ${h} rounded-xs bg-skeleton`} style={{ width: w }} />
);

/** Page 1 of the K7QX2M e-ticket: header, meta grid, route band, skeleton text, fare bars, barcode. */
export function PdfPage({ ticket }: { ticket: TicketDoc }) {
  return (
    <div className="box-border flex aspect-[360/509] w-full max-w-[360px] flex-col gap-3.5 bg-white p-[22px] font-serif shadow-page">
      <div className="flex items-center justify-between">
        <span className="flex h-[26px] items-center bg-indigo px-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG brand wordmark */}
          <img src={assets.indigo.src} alt="IndiGo" width={50} height={15} />
        </span>
        <span className="text-11 font-bold tracking-badge">{copy.header}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-10 leading-[1.35]">
        <span>
          {copy.pnr} <b>{ticket.pnr}</b>
        </span>
        <span>
          {copy.bookedOn} {ticket.booked}
        </span>
        <span>
          {copy.passenger} <b>{ticket.passenger}</b>
        </span>
        <span>
          {copy.seat} <b>{ticket.seat}</b>
        </span>
      </div>
      <div className="flex justify-between border-y border-ink py-2.5 text-10 leading-[1.4]">
        <div>
          <div className="text-18 font-bold">{ticket.from.code}</div>
          <div>{ticket.from.place}</div>
          <div>{ticket.from.time}</div>
        </div>
        <div className="self-center">{ticket.flight}</div>
        <div className="text-right">
          <div className="text-18 font-bold">{ticket.to.code}</div>
          <div>{ticket.to.place}</div>
          <div>{ticket.to.time}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {["92%", "84%", "88%", "60%"].map((w) => (
          <Bar key={w} w={w} />
        ))}
      </div>
      <div className="mt-1 flex flex-col gap-1.5">
        <span className="text-10 font-bold">{copy.fare}</span>
        {["70%", "66%", "72%"].map((w) => (
          <Bar key={w} w={w} h="h-2" />
        ))}
      </div>
      <div
        aria-hidden
        className="mt-auto h-[46px] bg-[repeating-linear-gradient(90deg,var(--color-ink)_0_2px,transparent_2px_4px,var(--color-ink)_4px_5px,transparent_5px_8px)]"
      />
    </div>
  );
}
