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
import { TicketNotches } from "./TicketNotches";

const MEDIA_BG = {
  indigo: "bg-indigo",
  "stay-tint": "bg-stay-soft",
  none: "",
} as const;

/** The torn stub's width in px; the notches are placed from it. */
export const STUB_WIDTH = 80;

const ACCENT = { info: "border-info", success: "border-success" } as const;

/** M1 ticket-stub card: media, details, avatars, dashed-torn stub. Links to the booking's `href`. */
export function BookingTicketCard({ booking, members }: { booking: Booking; members: Record<string, User> }) {
  const { media, stub } = booking;
  return (
    <Link
      href={booking.href}
      className="relative flex min-h-[108px] items-stretch rounded-5xl border border-line bg-white text-ink no-underline shadow-float-sm transition-transform duration-[160ms] ease-[var(--ease-out)] active:scale-[0.985] active:bg-surface-pressed"
    >
      <div className={cn("flex w-[92px] shrink-0 overflow-hidden rounded-l-5xl", MEDIA_BG[media.bg], media.kind !== "photo" && "items-center justify-center")}>
        {media.kind === "logo" && (
          // eslint-disable-next-line @next/next/no-img-element -- SVG brand wordmark
          <img src={media.src} alt={media.alt ?? ""} className="h-auto w-16" />
        )}
        {media.kind === "photo" && (
          // eslint-disable-next-line @next/next/no-img-element -- design photo, decorative
          <img src={media.src} alt="" className="size-full object-cover" />
        )}
        {media.kind === "emoji" && (
          <span aria-hidden className="text-[34px] leading-none">
            {media.emoji}
          </span>
        )}
      </div>
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
            <Eyebrow>{BOOKINGS_COPY.tickets}</Eyebrow>
          </>
        ) : (
          <>
            <CheckBadge size={30} />
            <Eyebrow className="text-success-ink">{BOOKINGS_COPY.booked}</Eyebrow>
          </>
        )}
      </div>
      <TicketNotches stubWidth={STUB_WIDTH} />
    </Link>
  );
}
