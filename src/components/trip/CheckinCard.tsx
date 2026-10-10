import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { User } from "@/data/types";
import { cn } from "@/lib/utils";

type CheckinCardProps = Omit<React.ComponentProps<typeof Card>, "children"> & {
  /** The Server's own line for this flight: "6E 5313 · Fri 6 Nov · closes 19:40". */
  sub: string;
  /** The friend on the same booking, when there is one (companion note avatar). */
  companion?: User;
  /** The carrier's wordmark from the booking; without one a plane stands in. */
  logo?: { src: string; alt: string };
  /** "Check in now" opens the check-in sheet. */
  onCheckIn(): void;
};

/** K1 "Web check-in is open" card, first in Pending (J-triphome-calls.md §1.2 A.2, K-checkin.md §1.1). */
export function CheckinCard({ sub, companion, logo, onCheckIn, className, ...props }: CheckinCardProps) {
  const copy = CHECKIN_COPY.card;
  return (
    <Card radius="2xl" data-slot="checkin-card" className={cn("flex flex-col gap-3 p-4", className)} {...props}>
      <div className="flex items-center gap-3">
        {logo ? (
          <span className="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- the carrier's wordmark from the booking */}
            <img src={logo.src} alt={logo.alt} className="block h-auto max-h-8 w-[46px] object-contain" />
          </span>
        ) : (
          <span aria-hidden className="grid h-10 w-14 shrink-0 place-items-center rounded-xl bg-surface-2 text-20 leading-none">
            ✈️
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="flex items-center gap-1.5 text-16 leading-[1.3] font-semibold tracking-body">
            {copy.title}
            <Badge variant="success-soft" size="xs">
              {copy.badge}
            </Badge>
          </span>
          <span className="text-13 tracking-caption text-muted">{sub}</span>
        </div>
      </div>
      {companion && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3 py-2.5">
          <Avatar size={28} src={companion.avatar} initials={companion.initials} tone={companion.tone} />
          <p className="flex-1 text-14 leading-[1.35]">{copy.companion(companion.firstName)}</p>
        </div>
      )}
      <Button variant="primary" size="md" className="w-full" onClick={onCheckIn}>
        {copy.cta}
      </Button>
    </Card>
  );
}
