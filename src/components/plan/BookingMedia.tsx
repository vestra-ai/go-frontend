import type { Booking } from "@/data/types";
import { cn } from "@/lib/utils";

const MEDIA_BG = {
  indigo: "bg-indigo",
  "stay-tint": "bg-stay-soft",
  none: "",
} as const;

/**
 * The left end of a booking's ticket, the same on the Bookings tab and in the room: the booking's photo, else the
 * carrier's wordmark, else the kind's emoji on a tint. The caller gives the width.
 */
export function BookingMedia({ media, className }: { media: Booking["media"]; className?: string }) {
  return (
    <div className={cn("flex shrink-0 overflow-hidden rounded-l-5xl", MEDIA_BG[media.bg], media.kind !== "photo" && "items-center justify-center", className)}>
      {media.kind === "logo" && (
        // eslint-disable-next-line @next/next/no-img-element -- SVG brand wordmark
        <img src={media.src} alt={media.alt ?? ""} className="h-auto w-16" />
      )}
      {media.kind === "photo" && (
        // eslint-disable-next-line @next/next/no-img-element -- design photo, decorative
        <img src={media.src} alt={media.alt ?? ""} className="size-full object-cover" />
      )}
      {media.kind === "emoji" && (
        <span aria-hidden className="text-[34px] leading-none">
          {media.emoji}
        </span>
      )}
    </div>
  );
}
