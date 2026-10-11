import { Eyebrow } from "@/components/common/Eyebrow";
import { ListCard } from "@/components/common/ListCard";
import { ListRow } from "@/components/common/ListRow";
import { SectionHeader } from "@/components/common/SectionHeader";
import { STUB_WIDTH } from "@/components/plan/BookingTicketCard";
import { DayCard } from "@/components/plan/DayCard";
import { TICKET_SHADOW, TicketBody } from "@/components/plan/TicketNotches";
import { Card } from "@/components/ui/card";
import { segmentedItemVariants, segmentedListVariants } from "@/components/ui/segmented-control";
import { BOOKINGS_COPY } from "@/data/seed/bookings";
import { scopeToggle, tripHome as copy } from "@/data/seed/copy";
import { MONEY_COPY } from "@/data/seed/money";
import { SKELETON_BAR, SKELETON_BAR_ON_CANVAS } from "@/lib/skeleton";
import type { TripTab } from "./TripTabs";

// What each trip tab draws under the tab bar while its data is on its way. They are static: same containers and text
// styles as the real rows, with the text made invisible (see `lib/skeleton.ts`), so nothing moves when the data lands.
// The tab pages use them for their own reads; `TripSkeleton` uses them on a refresh, before the trip itself is read.

/** The Everyone / Just me toggle, not yet pressable. Itinerary and Expenses open on it. */
function ScopeToggleSkeleton({ active }: { active: "everyone" | "me" }) {
  return (
    <div aria-hidden className={segmentedListVariants({ variant: "contained" })}>
      {(["everyone", "me"] as const).map((scope) => (
        <span key={scope} className={segmentedItemVariants({ variant: "contained", active: scope === active })}>
          {scopeToggle[scope]}
        </span>
      ))}
    </div>
  );
}

// --- Home -----------------------------------------------------------------------------------------------------------

/**
 * "Pending on you" as placeholders. Once the trip is read its `needs_you_count` is known, so Home passes it while the
 * list's own read is on its way: the count is then real and only the rows are placeholders (three at most). Without a
 * count (the whole page is still loading) the count is a bar too.
 */
export function PendingSkeleton({ count }: { count?: number }) {
  const rows = count === undefined ? 2 : Math.min(Math.max(count, 1), 3);
  return (
    <>
      <SectionHeader
        title={copy.pendingTitle}
        meta={count === undefined ? <span className={SKELETON_BAR_ON_CANVAS}>{copy.pendingMeta(rows)}</span> : copy.pendingMeta(count)}
      />
      <ListCard padding="rows" aria-hidden>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 not-first:border-t not-first:border-line">
            <span className="size-10 shrink-0 rounded-full bg-line" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-16 leading-[1.3] font-semibold tracking-body">
                <span className={SKELETON_BAR}>Pay back a friend</span>
              </span>
              <span className="text-13 tracking-caption">
                <span className={SKELETON_BAR}>You owe a share</span>
              </span>
            </div>
            <span className="h-9 w-[76px] shrink-0 rounded-full bg-line" />
          </div>
        ))}
      </ListCard>
    </>
  );
}

function HomeBodySkeleton() {
  return (
    <>
      <PendingSkeleton />
      <SectionHeader className="mt-2" title={copy.doneTitle} meta={<span className={SKELETON_BAR_ON_CANVAS}>{copy.doneLabel(3, false)}</span>} />
      <ListCard padding="tight" aria-hidden>
        {[0, 1, 2].map((i) => (
          <ListRow
            key={i}
            className="gap-2.5 py-[11px]"
            leading={<span className="size-9 shrink-0 rounded-full bg-line" />}
            title={<span className={SKELETON_BAR}>Flights booked</span>}
            sub={<span className={SKELETON_BAR}>Added to the trip</span>}
            trailing={<span className="size-[22px] shrink-0 rounded-full bg-line" />}
          />
        ))}
      </ListCard>
    </>
  );
}

// --- Itinerary ------------------------------------------------------------------------------------------------------

function TimelineRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <span className="w-12 shrink-0 text-right text-13 font-semibold tabular-nums">
        <span className={SKELETON_BAR}>9:55p</span>
      </span>
      <span className="size-10 shrink-0 rounded-full bg-line" />
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-15 font-semibold leading-[1.3]">
          <span className={SKELETON_BAR}>Flight to the coast</span>
        </span>
        <span className="truncate text-13 tracking-caption">
          <span className={SKELETON_BAR}>Terminal 3 · gate opens early</span>
        </span>
      </div>
      <span className="h-[22px] w-12 shrink-0 rounded-full bg-line" />
    </div>
  );
}

/** Two day cards. The Itinerary tab shows these alone under its toggle while "Just me" is being read. */
export function ItineraryDaysSkeleton() {
  return (
    <div aria-hidden className="contents">
      {[3, 2].map((rows, day) => (
        <DayCard key={day} label={<span className={SKELETON_BAR}>FRI 6 NOV</span>}>
          {Array.from({ length: rows }, (_, i) => (
            <TimelineRowSkeleton key={i} />
          ))}
        </DayCard>
      ))}
    </div>
  );
}

function ItineraryBodySkeleton() {
  return (
    <>
      <ScopeToggleSkeleton active="everyone" />
      <ItineraryDaysSkeleton />
    </>
  );
}

// --- Bookings -------------------------------------------------------------------------------------------------------

/** A ticket-stub card: the media well, the details, the torn stub with its notches. */
function BookingCardSkeleton() {
  return (
    <div aria-hidden className={TICKET_SHADOW.sm}>
      <TicketBody stubWidth={STUB_WIDTH} className="min-h-[108px]">
        <span className="w-[92px] shrink-0 rounded-l-5xl bg-line" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-px border-l-[3px] border-line p-3">
          <Eyebrow className="leading-[1.35]">
            <span className={SKELETON_BAR}>FLIGHT · DEL TO GOI</span>
          </Eyebrow>
          <span className="text-[19px] font-semibold leading-[1.2] tracking-[-0.016em]">
            <span className={SKELETON_BAR}>Delhi to Goa</span>
          </span>
          <span className="text-13 tracking-caption">
            <span className={SKELETON_BAR}>Fri 6 Nov · 6:05a</span>
          </span>
          <span className="mt-1 h-[22px] w-14 rounded-full bg-line" />
        </div>
        <div style={{ width: STUB_WIDTH }} className="relative flex shrink-0 flex-col items-center justify-center gap-1">
          <span className="absolute inset-y-0 left-0 border-l border-dashed border-line-2" />
          <span className="size-[30px] rounded-full bg-line" />
          <span className="h-[13px] w-10 rounded-md bg-line" />
        </div>
      </TicketBody>
    </div>
  );
}

function BookingsBodySkeleton() {
  return (
    <>
      <SectionHeader title={BOOKINGS_COPY.title} meta={<span className={SKELETON_BAR_ON_CANVAS}>{BOOKINGS_COPY.count(2)}</span>} />
      <BookingCardSkeleton />
      <BookingCardSkeleton />
    </>
  );
}

// --- Expenses -------------------------------------------------------------------------------------------------------

function CategoryTileSkeleton({ label }: { label: string }) {
  return (
    <Card radius="lg" className="flex items-center gap-2.5 p-3">
      <span className="size-12 shrink-0 rounded-xl bg-line" />
      <div className="flex flex-col gap-px">
        <span className="text-18 font-semibold tabular-nums">
          <span className={SKELETON_BAR}>₹21,600</span>
        </span>
        <span className="text-13">
          <span className={SKELETON_BAR}>{label}</span>
        </span>
      </div>
    </Card>
  );
}

function SettleRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-3 not-first:border-t not-first:border-line">
      <span className="size-9 shrink-0 rounded-full bg-line" />
      <span className="h-0.5 flex-1 bg-line" />
      <span className="size-9 shrink-0 rounded-full bg-line" />
      <div className="flex w-[92px] justify-end">
        <span className="h-[34px] w-[76px] rounded-full bg-line" />
      </div>
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 not-first:border-t not-first:border-line">
      <span className="size-10 shrink-0 rounded-full bg-line" />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-15 font-semibold leading-[1.3]">
          <span className={SKELETON_BAR}>Someone paid a booking</span>
        </span>
        <span className="h-[22px] w-16 rounded-full bg-line" />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-15 font-bold tabular-nums">
          <span className={SKELETON_BAR}>₹4,800</span>
        </span>
        <span className="text-13">
          <span className={SKELETON_BAR}>6 Nov</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Expenses as placeholders: the toggle, the total with its split bar and tiles, the settle-up card and the first
 * transactions. The tab shows this while the money and the transactions are read; `scope` keeps the toggle on the
 * person's choice.
 */
export function ExpensesSkeleton({ scope = "everyone" }: { scope?: "everyone" | "me" }) {
  return (
    <div aria-hidden className="contents">
      <ScopeToggleSkeleton active={scope} />
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3 pl-1 pt-1">
          <div className="flex flex-col gap-0.5">
            {/* The total is 44px text: an inline bar would paint taller than its line and touch the caption's, so the line
                keeps the text's height (1.05em) and the bar sits inside it. */}
            <span className="flex h-[1.05em] items-center text-44">
              <span className="h-[0.8em] w-44 rounded-md bg-line-2" />
            </span>
            <span className="text-15">
              <span className={SKELETON_BAR_ON_CANVAS}>{scope === "me" ? MONEY_COPY.meCaption("₹10,000", "₹20,000") : MONEY_COPY.everyoneCaption}</span>
            </span>
          </div>
          {scope === "me" && <span className="h-10 w-[118px] shrink-0 rounded-full bg-line-2" />}
        </div>
        <div className="my-0.5 h-3 rounded-full bg-line-2" />
        <div className="grid grid-cols-2 gap-2.5">
          <CategoryTileSkeleton label={MONEY_COPY.stay} />
          <CategoryTileSkeleton label={MONEY_COPY.travel} />
        </div>
        {scope === "me" && (
          <p className="px-1 text-13 tracking-caption">
            <span className={SKELETON_BAR_ON_CANVAS}>{MONEY_COPY.meFootnote}</span>
          </p>
        )}
      </div>
      <SectionHeader title={MONEY_COPY.settleTitle} meta={<span className={SKELETON_BAR_ON_CANVAS}>{MONEY_COPY.settleMetaMany(2)}</span>} className="mt-2" />
      <Card variant="shadow" radius="2xl" className="px-3.5 pt-1.5 pb-0.5">
        <SettleRowSkeleton />
        <SettleRowSkeleton />
      </Card>
      <SectionHeader title={MONEY_COPY.txTitle} meta={MONEY_COPY.txMeta} className="mt-2" />
      <Card variant="shadow" radius="2xl" className="px-3.5 py-0.5">
        <TransactionRowSkeleton />
        <TransactionRowSkeleton />
        <TransactionRowSkeleton />
      </Card>
      <span className="h-11 w-full rounded-full bg-white shadow-card" />
    </div>
  );
}

/** The body for a tab on a refresh, before the trip is read (so before anything is known about the trip). */
export function TripBodySkeleton({ active }: { active: TripTab }) {
  switch (active) {
    case "home":
      return <HomeBodySkeleton />;
    case "itinerary":
      return <ItineraryBodySkeleton />;
    case "bookings":
      return <BookingsBodySkeleton />;
    case "expenses":
      return <ExpensesSkeleton />;
  }
}
