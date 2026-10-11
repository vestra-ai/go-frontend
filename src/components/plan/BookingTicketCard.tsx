"use client";

import Link from "next/link";
import { AvatarStack } from "@/components/common/AvatarStack";
import { CheckBadge } from "@/components/common/CheckBadge";
import { Eyebrow } from "@/components/common/Eyebrow";
import { Separator } from "@/components/ui/separator";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import type { Booking } from "@/data/types";
import type { User } from "@/data/types";
import { cn } from "@/lib/utils";
import { BookingMedia } from "./BookingMedia";
import { TICKET_SHADOW, TicketBody } from "./TicketNotches";

/** The torn stub's width in px; the notches are placed from it. */
export const STUB_WIDTH = 80;

const ACCENT = { info: "border-info", success: "border-success" } as const;

/** M1 ticket-stub card: media, details, avatars, dashed-torn stub. Links to the booking's `href`. */
export function BookingTicketCard({ booking, members }: { booking: Booking; members: Record<string, User> }) {
  const { media, stub } = booking;
  return (
    <Link
      href={booking.href}
      className={cn("group block rounded-5xl text-ink no-underline transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.985]", TICKET_SHADOW.sm)}
    >
      <TicketBody stubWidth={STUB_WIDTH} className="min-h-[108px] group-active:bg-surface-pressed">
        <BookingMedia media={media} className="w-[92px]" />
        <div className={cn("flex min-w-0 flex-1 flex-col justify-center gap-px border-l-[3px] p-3", ACCENT[booking.accent])}>
          <Eyebrow className="leading-[1.35]">{booking.eyebrow}</Eyebrow>
          <span className="line-clamp-2 text-[19px] font-semibold leading-[1.2] tracking-[-0.016em]">{booking.title}</span>
          <span className="truncate text-13 tracking-caption text-muted">{booking.sub}</span>
          <AvatarStack
            className="mt-1"
            size={22}
            overlap={7}
            ring="white"
            avatars={booking.memberIds.flatMap((id) => {
              const u = members[id];
              return u ? [{ name: u.name, src: u.avatar, tone: u.tone }] : [];
            })}
          />
        </div>
        <div style={{ width: STUB_WIDTH }} className="relative flex shrink-0 flex-col items-center justify-center gap-1 text-center">
          <Separator orientation="vertical" variant="dashed" className="absolute inset-y-0 left-0" />
          {stub.kind === "count" ? (
            <>
              <span className="text-26 font-bold leading-none tabular-nums">{stub.n}</span>
              <Eyebrow>{BOOKINGS_COPY.tickets(stub.n)}</Eyebrow>
            </>
          ) : (
            <>
              <CheckBadge size={30} />
              <Eyebrow className="text-success-ink">{BOOKINGS_COPY.booked}</Eyebrow>
            </>
          )}
        </div>
      </TicketBody>
    </Link>
  );
}
