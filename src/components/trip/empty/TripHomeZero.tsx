import { Link as LinkIcon } from "@/components/icons/generated";
import { emojiTileVariants } from "@/components/common/EmojiTile";
import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { SectionHeader } from "@/components/common/SectionHeader";
import { GoStatusCard } from "@/components/trip/GoStatusCard";
import { NextUpRow } from "@/components/trip/NextUpRow";
import { planZero } from "@/data/seed/copy";
import type { TripId } from "@/data/types";
import { cn } from "@/lib/utils";

// DESIGN-ASSUMPTION (I-plan-empty.md §1.6 #13): `college` has no chat scenario, so its links go to the bare chat route.
const chatHref = (tripId: TripId, query?: string) =>
  tripId === "college" || !query ? `/trips/${tripId}/chat` : `/trips/${tripId}/chat?${query}`;

const copy = planZero.home;

// Next-up row key -> chat query (I-plan-empty.md §1.5).
const STAGE_QUERY: Record<(typeof copy.nextUp)[number]["key"], string> = {
  where: "stage=places",
  when: "stage=dates-poll",
  stay: "stage=stays",
  budget: "stage=budget&sheet=budget",
  travel: "stage=travel",
};

type TripHomeZeroProps = {
  tripId: TripId;
  /** `college`: opens the share sheet instead of linking to /trips/new. */
  onInvite?: () => void;
};

/** Trip home before anything is decided. Renders the children of TripShell's content column. */
export function TripHomeZero({ tripId, onInvite }: TripHomeZeroProps) {
  const inviteProps = tripId === "college" ? { onClick: onInvite } : { href: "/trips/new" };
  return (
    <>
      <GoStatusCard
        title={copy.statusTitle}
        sub={copy.statusSub}
        progress={{ filled: 0, total: copy.nextUp.length, label: copy.decided(0, copy.nextUp.length) }}
      />
      <SectionHeader className="mt-2" title={copy.nextUpTitle} meta={copy.open(copy.nextUp.length)} />
      <ListCard padding="rows">
        {copy.nextUp.map((row) => (
          <NextUpRow
            key={row.key}
            emoji={row.emoji}
            title={row.title}
            sub={row.sub}
            action={{ label: row.action, href: chatHref(tripId, STAGE_QUERY[row.key]) }}
          />
        ))}
      </ListCard>
      <ListCard padding="rows">
        <ListRow
          {...inviteProps}
          chevron
          leading={
            <span className={cn(emojiTileVariants({ shape: "circle", tint: "go-soft" }), "size-10")}>
              <LinkIcon className="size-5 text-ink" />
            </span>
          }
          titleSize={16}
          title={copy.inviteTitle}
          sub={copy.inviteSub}
        />
      </ListCard>
    </>
  );
}
