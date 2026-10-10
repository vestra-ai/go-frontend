import type { TripView } from "@/api/contract";
import { Link as LinkIcon } from "@/components/icons/generated";
import { emojiTileVariants } from "@/components/common/EmojiTile";
import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { SectionHeader } from "@/components/common/SectionHeader";
import { GoStatusCard } from "@/components/trip/GoStatusCard";
import { NextUpRow } from "@/components/trip/NextUpRow";
import { planZero } from "@/data/seed/copy";
import { cn } from "@/lib/utils";

const copy = planZero.home;
type NextUpKey = (typeof copy.nextUp)[number]["key"];

/**
 * Which of the five things are settled, read from the trip itself: a place, dates, a booked stay, the group's budget,
 * and a ticket that covers me.
 */
export function decidedKeys(view: TripView): Set<NextUpKey> {
  const meId = view.me.person.person_id;
  const confirmed = view.bookings.filter((b) => b.status === "confirmed");
  const done = new Set<NextUpKey>();
  if (view.destination) done.add("where");
  if (view.dates) done.add("when");
  if (confirmed.some((b) => b.kind === "stay")) done.add("stay");
  if (view.budget?.per_person_minor) done.add("budget");
  if (confirmed.some((b) => (b.kind === "flight" || b.kind === "train" || b.kind === "bus") && b.for_person_ids.includes(meId))) done.add("travel");
  return done;
}

type TripHomeZeroProps = {
  view: TripView;
  /** Opens the share sheet. */
  onInvite: () => void;
  /** "Set" on the budget row: opens the group budget sheet over the page. */
  onSetBudget: () => void;
};

/** Trip home before the trip is planned. Renders the children of TripShell's content column. */
export function TripHomeZero({ view, onInvite, onSetBudget }: TripHomeZeroProps) {
  const done = decidedKeys(view);
  const open = copy.nextUp.filter((row) => !done.has(row.key));
  const total = copy.nextUp.length;
  const chatHref = `/trips/${view.trip_id}/chat`;
  return (
    <>
      <GoStatusCard
        title={done.size === 0 ? copy.statusTitle : copy.statusTitleSome}
        sub={copy.statusSub}
        progress={{ filled: done.size, total, label: copy.decided(done.size, total) }}
      />
      {open.length > 0 && (
        <>
          <SectionHeader className="mt-2" title={copy.nextUpTitle} meta={copy.open(open.length)} />
          <ListCard padding="rows">
            {open.map((row) => (
              <NextUpRow
                key={row.key}
                emoji={row.emoji}
                title={row.title}
                sub={row.sub}
                // Everything is decided with Go in the room; the budget alone has its own sheet.
                action={row.key === "budget" ? { label: row.action, onPress: onSetBudget } : { label: row.action, href: chatHref }}
              />
            ))}
          </ListCard>
        </>
      )}
      <ListCard padding="rows">
        <ListRow
          onClick={onInvite}
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
