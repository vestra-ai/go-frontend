import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CHECKIN_COPY } from "@/data/seed/checkin";
import type { User } from "@/data/types";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

type CheckinCardProps = Omit<React.ComponentProps<typeof Card>, "children"> & {
  /** The friend on the same flight (companion note avatar). */
  companion: User;
  /** "Check in now" opens the check-in sheet. */
  onCheckIn(): void;
};

/** K1 "Web check-in is open" card, first in Pending (J-triphome-calls.md §1.2 A.2, K-checkin.md §1.1). */
export function CheckinCard({ companion, onCheckIn, className, ...props }: CheckinCardProps) {
  const copy = CHECKIN_COPY.card;
  return (
    <Card radius="2xl" data-slot="checkin-card" className={cn("flex flex-col gap-3 p-4", className)} {...props}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-14 shrink-0 place-items-center rounded-xl bg-indigo">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG airline wordmark */}
          <img src={assets.indigo.src} alt={assets.indigo.alt} width={assets.indigo.width} height={assets.indigo.height} className="block h-auto w-[46px]" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="flex items-center gap-1.5 text-16 leading-[1.3] font-semibold tracking-body">
            {copy.title}
            <Badge variant="success-soft" size="xs">
              {copy.badge}
            </Badge>
          </span>
          <span className="text-13 tracking-caption text-muted">{copy.sub}</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3 py-2.5">
        <Avatar size={28} src={companion.avatar} initials={companion.initials} tone={companion.tone} />
        <p className="flex-1 text-14 leading-[1.35]">{copy.companion}</p>
      </div>
      <Button variant="primary" size="md" className="w-full" onClick={onCheckIn}>
        {copy.cta}
      </Button>
    </Card>
  );
}
