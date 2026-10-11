"use client";

import { useEffect, useState, type ReactNode } from "react";
import type {
  CallCard,
  Card,
  CardAction,
  ChecklistCard,
  Decision,
  Id,
  KnownCard,
  NoticeCard,
  OptionsCard,
  PayCard,
  Transfer,
  TripView,
  VoteCard as VoteCardType,
  WorkingCard,
} from "@/api/contract";
import { isKnownCard, type Features } from "@/api/contract";
import { SettleRow } from "@/components/money/SettleRow";
import { DayCard } from "@/components/plan/DayCard";
import { TimelineRow } from "@/components/plan/TimelineRow";
import { SpendVsBudgetCard } from "@/components/board/SpendVsBudgetCard";
import { LastCallRow } from "@/components/trip/LastCallRow";
import { VendorLivePanel } from "@/components/trip/VendorLivePanel";
import { cards as copy, polls } from "@/data/seed/copy";
import type { User, VisaMember } from "@/data/types";
import { daysBetween, formatDay, formatDayShort, formatHHMM, monthShort, parseDay, timeAgo, wallTime, weekdayShort } from "@/lib/dates";
import { inr } from "@/lib/format";
import { SKELETON_BAR } from "@/lib/skeleton";
import { cn } from "@/lib/utils";
import { loadDecision } from "@/state/actions";
import { bookingEmoji, httpUrl, routeLine } from "@/state/bookingView";
import { closesIn } from "@/state/boardView";
import { toSettlement } from "@/state/moneyView";
import { optionAction, toDateOption, toPlaceOption, toStay, voteShape } from "@/state/optionView";
import type { TripData } from "@/state/store";
import { fromMinor, illustrationFor, placePhoto, toTripDates, userOf } from "@/state/view";
import { toWorking } from "@/state/workingView";
import { Bubble } from "./Bubble";
import { InChatCard } from "./InChatCard";
import { NextStepPill } from "./NextStepPill";
import { BookedTicketCard } from "./cards/BookedTicketCard";
import { BookingProgressCard } from "./cards/BookingProgressCard";
import { BudgetAskBubble } from "./cards/BudgetAskBubble";
import { DatesPollCard } from "./cards/DatesPollCard";
import { PayAskCard } from "./cards/PayAskCard";
import { PlacePollRail } from "./cards/PlacePollRail";
import { PlanCard } from "./cards/PlanCard";
import { PrivateTeaserCard } from "./cards/PrivateTeaserCard";
import { ReceiptCard } from "./cards/ReceiptCard";
import { StayPollRail } from "./cards/StayPollRail";
import { TravelAskBubble } from "./cards/TravelAskBubble";
import { VisaStatusCard } from "./cards/VisaStatusCard";
import { WhoLandsCard } from "./cards/WhoLandsCard";

// Contract card → component (CONTRACT-APP §5). Record cards (`vote`, `mandate`, `ticket`, `expense`, `settle_up`,
// `day`, `plan`, `budget`) carry an id and are drawn from the Server's own rows, so the room and the Trip screens
// never disagree. Go cards (`options`, `working`, `call`, `pay`, `notice`, `checklist`, `rooms`) are drawn from the
// card itself and replaced in place by a `card` frame. A kind this build does not know, or a record card whose row
// is not there, shows its `fallback_text`.

/** Which option a details sheet is about: a vote's (by index) or an options card's (by `option_id`). */
export type OptionRef =
  | { source: "vote"; decisionId: Id; index: number; shape: "place" | "stay" }
  | { source: "card"; card: OptionsCard; optionId: Id; shape: "place" | "stay" };

/** What the room hands every card: the trip as held, and who is looking. */
export interface RoomModel {
  tripId: Id;
  view: TripView;
  data: TripData;
  users: Record<Id, User>;
  me: User;
  features: Features | undefined;
}

/** Every callback a card can fire; ChatScreen binds them to the Server and the sheets. */
export interface RoomActions {
  /** Cast or move my vote; `null` takes it back (only offered with `features.vote_retract`). */
  vote(decisionId: Id, index: number | null): void;
  flexible(decisionId: Id): void;
  /** "Yes, book it" / "Not now": the Server's own buttons, payer only. */
  mandate(decisionId: Id, answer: "confirm" | "decline"): void;
  /** One press of a Go card button. */
  tap(cardId: Id, actionId: string, opts?: { optionId?: Id; payload?: { trip: "oneway" | "round" } }): void;
  /** The card whose tap is on its way: its buttons wait. */
  pending: string | null;
  openOption(ref: OptionRef): void;
  openRoute(card: OptionsCard): void;
  openCab(card: OptionsCard): void;
  openRecord(transfer: Transfer): void;
  openRecording(card: CallCard): void;
  /** Go's screen, full height: the live stream while it works, else the latest picture (contract 1.3). */
  openLive(card: WorkingCard): void;
}

const money = (minor: number) => inr(fromMinor(minor));

/** Buttons are shown only to the people in `only_for_person_ids` (absent = everyone). */
const visible = (actions: CardAction[] | null | undefined, meId: Id) =>
  (actions ?? []).filter((a) => !a.only_for_person_ids || a.only_for_person_ids.includes(meId));

/** "3 hrs" · "20 min" · "2 days": how long until a time, or "" once it has passed. */
function until(iso: string | null | undefined): string {
  return closesIn(iso).replace(/^closes in /, "");
}

function fallback(card: Card): ReactNode {
  return <Bubble author="go">{card.fallback_text}</Bubble>;
}

/** A vote's card with its options not in the room yet: the size of a poll, so what lands in its place barely moves. */
function VoteSkeleton() {
  return (
    <InChatCard aria-busy className="flex flex-col gap-1 pt-3.5 pb-3">
      <span role="status" className="sr-only">
        {polls.loading}
      </span>
      <div aria-hidden className="flex flex-col gap-1">
        <div className="px-4 pb-1 text-18 leading-[1.3] font-semibold tracking-h4">
          <span className={SKELETON_BAR}>Where should we go this time?</span>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("flex h-16 items-center gap-3.5 px-4", i > 0 && "border-t border-line")}>
            <span className="size-12 shrink-0 rounded-xl bg-line" />
            <span className="flex flex-1 flex-col gap-px">
              <span className="text-15 leading-[1.3] font-semibold">
                <span className={SKELETON_BAR}>Option name here</span>
              </span>
              <span className="text-13">
                <span className={SKELETON_BAR}>No votes yet</span>
              </span>
            </span>
          </div>
        ))}
      </div>
    </InChatCard>
  );
}

/**
 * The message of a vote arrives on the socket before the trip read brings its decision. The text bubble that stood in
 * for the card for that moment flashed, then jumped to the poll. Read the decision now instead and hold a placeholder;
 * only if that read fails does the card's own text stay.
 */
function VotePending({ card, room }: { card: VoteCardType; room: RoomModel }) {
  const [failed, setFailed] = useState(false);
  const { tripId } = room;
  const decisionId = card.decision_id;
  useEffect(() => {
    let current = true;
    loadDecision(tripId, decisionId).catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [tripId, decisionId]);
  return failed ? fallback(card) : <VoteSkeleton />;
}

// ---------------------------------------------------------------------------
// vote
// ---------------------------------------------------------------------------

function VoteCard({ decision, room, actions }: { decision: Decision; room: RoomModel; actions: RoomActions }) {
  const { me, features, data, view } = room;
  const open = decision.status === "open";
  const stored = data.myVotes[decision.decision_id];
  // My vote: what the single-vote routes said, else my row in an open (non-anonymous) vote.
  const mine = stored !== undefined ? stored : (decision.votes?.find((v) => v.person_id === me.id) ?? null);
  const myIndex = mine && "option_index" in mine ? String(mine.option_index) : null;
  const flexible = Boolean(mine && "flexible" in mine);
  // The rails add me to the option I picked, so the seed list is everyone else.
  const votersOf = (index: number) => (decision.votes ?? []).filter((v) => v.option_index === index && v.person_id !== me.id).map((v) => v.person_id);
  const result = decision.result_index != null ? decision.options[decision.result_index]?.label : undefined;
  const ended = decision.status === "cancelled" ? polls.cancelled : result ? polls.won(result) : polls.closed;
  const left = until(decision.closes_at);
  const shape = voteShape(decision);

  const onVote = (id: string | null) => {
    if (!open) return;
    // Taking a vote back is behind a flag; without it a re-tap leaves the pick as it is (moving it still works).
    if (id === null) {
      if (features?.vote_retract) actions.vote(decision.decision_id, null);
      return;
    }
    actions.vote(decision.decision_id, Number(id));
  };

  if (shape === "list") {
    return (
      <DatesPollCard
        title={decision.question}
        countdown={open && left ? polls.left(left) : undefined}
        options={decision.options.map((o, i) => toDateOption(o, String(i), votersOf(i)))}
        vote={myIndex}
        flexible={flexible}
        me={me}
        of={decision.of}
        voted={decision.voted}
        flexibleLabels={features?.vote_flexible && decision.kind === "choice" ? polls.flexible : undefined}
        closed={!open}
        winner={!open && decision.result_index != null ? String(decision.result_index) : null}
        onVote={onVote}
        onFlexible={() => actions.flexible(decision.decision_id)}
      />
    );
  }

  const countdown = open ? (left ? polls.closesIn(left) : undefined) : ended;
  if (shape === "stay") {
    return (
      <div className="flex flex-col gap-2.5">
        <StayPollRail
          stays={decision.options.map((o, i) => toStay(o, String(i), votersOf(i), { dates: view.dates, people: view.people.length, seed: decision.decision_id }))}
          vote={myIndex}
          me={me.id}
          disabled={!open}
          onVote={onVote}
          onDetails={(id) => actions.openOption({ source: "vote", decisionId: decision.decision_id, index: Number(id), shape: "stay" })}
        />
        {countdown && <span className="ml-[38px] text-13 font-semibold text-muted">{countdown}</span>}
      </div>
    );
  }
  return (
    <PlacePollRail
      places={decision.options.map((o, i) => toPlaceOption(o, String(i), votersOf(i), decision.decision_id, i))}
      vote={myIndex}
      me={me.id}
      countdown={countdown}
      disabled={!open}
      onVote={onVote}
      onDetails={(id) => actions.openOption({ source: "vote", decisionId: decision.decision_id, index: Number(id), shape: "place" })}
    />
  );
}

// ---------------------------------------------------------------------------
// mandate, pay, the claim notice
// ---------------------------------------------------------------------------

function MandateCard({ decision, room, actions }: { decision: Decision; room: RoomModel; actions: RoomActions }) {
  const mandate = decision.mandate;
  if (!mandate) return null;
  const option = decision.options[mandate.choice_index];
  const payer = userOf(room.users, mandate.payer_person_id);
  const isPayer = payer.id === room.me.id;
  const name = isPayer ? "You" : payer.firstName;
  const answered = mandate.confirmed_at ? copy.mandate.confirmed(name) : mandate.declined_at ? copy.mandate.declined(name) : null;
  const canAnswer = isPayer && !answered;
  return (
    <PayAskCard
      img={httpUrl(option?.image_url) ?? httpUrl(option?.photos?.[0]?.url)}
      imgAlt={option?.label}
      badge={copy.mandate.badge}
      title={option?.label ?? decision.question}
      total={copy.mandate.upTo(money(mandate.cap_minor))}
      sub={decision.question}
      assurance={mandate.refundable_only ? copy.mandate.refundable : undefined}
      state={canAnswer ? "open" : "claimed"}
      cta={canAnswer ? { label: copy.mandate.yes, onPress: () => actions.mandate(decision.decision_id, "confirm") } : undefined}
      secondary={canAnswer ? { label: copy.mandate.notNow, onPress: () => actions.mandate(decision.decision_id, "decline") } : undefined}
      helper={canAnswer ? copy.mandate.helper : undefined}
      booker={{ user: payer, ...(answered ?? copy.mandate.waiting(payer.firstName)), live: !mandate.declined_at }}
    />
  );
}

function PayView({ card, room, actions }: { card: PayCard; room: RoomModel; actions: RoomActions }) {
  const payer = userOf(room.users, card.payer_person_id);
  const mine = visible(card.actions, room.me.id);
  const approve = mine.find((a) => a.style === "primary") ?? mine[0];
  const decline = mine.find((a) => a !== approve);
  const waiting = card.state === "waiting";
  const expires = until(card.expires_at);
  return (
    <PayAskCard
      badge={copy.pay.badge}
      title={card.merchant}
      total={money(card.amount_minor)}
      sub={card.purpose}
      assurance={
        card.refundable_until
          ? { title: copy.pay.freeCancel(formatDay(wallTime(card.refundable_until))), sub: waiting && expires ? copy.pay.expires(`in ${expires}`) : "" }
          : undefined
      }
      state={waiting && approve ? "open" : "claimed"}
      cta={
        waiting && approve
          ? { label: approve.label, pending: actions.pending === card.card_id, onPress: () => actions.tap(card.card_id, approve.action_id) }
          : undefined
      }
      secondary={waiting && decline ? { label: decline.label, onPress: () => actions.tap(card.card_id, decline.action_id) } : undefined}
      helper={waiting && approve ? copy.pay.helper : undefined}
      booker={
        waiting
          ? { user: payer, title: copy.pay.waiting(payer.firstName), sub: expires ? copy.pay.expires(`in ${expires}`) : "" }
          : { user: payer, title: copy.pay.state[card.state as keyof typeof copy.pay.state] ?? card.state, sub: card.merchant, live: false }
      }
    />
  );
}

function NoticeView({ card, room, actions }: { card: NoticeCard; room: RoomModel; actions: RoomActions }) {
  const mine = visible(card.actions, room.me.id);
  const first = mine[0];
  const press = (action: CardAction) => () => actions.tap(card.card_id, action.action_id);
  const caption = [card.source?.name, card.deadline_at ? formatDay(wallTime(card.deadline_at)) : null].filter(Boolean).join(" · ");
  const text = `**${card.title}**\n${card.body}`;

  // "One person books for all": the first claim wins, and Go replaces the card to say who has it.
  const claim = mine.find((a) => a.action_id === "claim");
  if (claim) {
    return (
      <PayAskCard
        img={httpUrl(card.image_url)}
        imgAlt={card.title}
        badge={copy.claim.badge}
        title={card.title}
        total=""
        sub={card.body}
        state="open"
        cta={{ label: claim.label, pending: actions.pending === card.card_id, onPress: press(claim) }}
        helper={caption || undefined}
      />
    );
  }
  // A card for me alone with one thing to open: my own booking, kept out of the group's view.
  if (first && card.for_person_ids?.length === 1 && card.for_person_ids[0] === room.me.id) {
    return <PrivateTeaserCard label={card.title.toUpperCase()} lines={card.body.split("\n").filter(Boolean)} cta={first.label} onView={press(first)} />;
  }
  if (first) return <BudgetAskBubble text={text} cta={first.label} caption={caption} onCta={press(first)} />;
  return (
    <Bubble author="go" maxWidth={80}>
      {caption ? `${text}\n${caption}` : text}
    </Bubble>
  );
}

// ---------------------------------------------------------------------------
// options, working, call, checklist
// ---------------------------------------------------------------------------

function OptionsView({ card, room, actions }: { card: OptionsCard; room: RoomModel; actions: RoomActions }) {
  const { me, view } = room;
  const checked = copy.checked(timeAgo(card.checked_at));
  const pick = optionAction(card, me.id);
  const others = visible(card.actions, me.id).filter((a) => !a.per_option);
  const busy = actions.pending === card.card_id;
  const extra = others.map((a) => <NextStepPill key={a.action_id} label={a.label} onPress={() => actions.tap(card.card_id, a.action_id)} />);

  // Flights, trains, buses and cabs open a sheet: there are too many to pick from in a rail.
  if (card.option_kind === "flight" || card.option_kind === "train" || card.option_kind === "bus" || card.option_kind === "cab") {
    const openSheet = () => (card.option_kind === "cab" ? actions.openCab(card) : actions.openRoute(card));
    return (
      <div className="flex flex-col gap-2.5">
        <TravelAskBubble text={`**${card.title}**\n${copy.options.count(card.options.length)} · ${checked}`} cta={copy.options.see} caption="" onCta={openSheet} />
        {extra}
      </div>
    );
  }

  const onPick = pick ? (id: string | null) => id !== null && actions.tap(card.card_id, pick.actionId, { optionId: id }) : () => {};
  const stay = card.option_kind === "stay";
  return (
    <div className="flex flex-col gap-2.5">
      {stay ? (
        <StayPollRail
          stays={card.options.map((o) => toStay(o, o.option_id, [], { dates: view.dates, people: view.people.length, seed: card.card_id }))}
          vote={null}
          me={me.id}
          hideVotes
          voteLabel={pick?.label}
          disabled={!pick || busy}
          onVote={onPick}
          onDetails={(id) => actions.openOption({ source: "card", card, optionId: id, shape: "stay" })}
        />
      ) : (
        <PlacePollRail
          places={card.options.map((o, i) => toPlaceOption(o, o.option_id, [], card.card_id, i))}
          vote={null}
          me={me.id}
          hideVotes
          voteLabel={pick?.label}
          disabled={!pick || busy}
          onVote={onPick}
          onDetails={(id) => actions.openOption({ source: "card", card, optionId: id, shape: "place" })}
        />
      )}
      <span className="ml-[38px] text-13 font-semibold text-muted">{checked}</span>
      {extra}
    </div>
  );
}

function WorkingView({ card, room, actions }: { card: WorkingCard; room: RoomModel; actions: RoomActions }) {
  const work = toWorking(card);
  const mine = visible(card.actions, room.me.id);
  const openLive = () => actions.openLive(card);
  // With a stream on the card, watching happens here in the app: Go's own `watch` button opens it too, and the card
  // offers one when Go sent none.
  const buttons = mine.map((a) => ({ label: a.label, onPress: work.liveUrl && a.action_id === "watch" ? openLive : () => actions.tap(card.card_id, a.action_id) }));
  if (work.liveUrl && !mine.some((a) => a.action_id === "watch")) buttons.unshift({ label: copy.working.watch, onPress: openLive });
  return (
    <BookingProgressCard
      title={card.title}
      actions={buttons}
      url={work.address}
      screenshot={work.screenshot}
      line={work.line}
      lineSub={work.lineSub}
      steps={{ filled: work.filled, total: work.total }}
      status={work.status}
      live={card.state === "running"}
      open={work.liveUrl || work.screenshot ? { label: copy.working.open(card.title), onPress: openLive } : undefined}
    />
  );
}

function CallView({ card, room, actions }: { card: CallCard; room: RoomModel; actions: RoomActions }) {
  const mine = visible(card.actions, room.me.id);
  const has = (id: string) => mine.some((a) => a.action_id === id);
  if (card.state === "dialing" || card.state === "talking") {
    return (
      <div className="mr-4 ml-[38px]">
        <VendorLivePanel
          who={card.business}
          asking={card.goal}
          // Listen in is hidden while `features.calls` is off (§7).
          onListen={room.features?.calls && has("listen") ? () => actions.tap(card.card_id, "listen") : undefined}
          onEnd={has("stop") ? () => actions.tap(card.card_id, "stop") : undefined}
        />
      </div>
    );
  }
  if (card.state === "ended" && card.outcome) {
    return (
      <div className="mr-4 ml-[38px]">
        <LastCallRow
          who={card.business}
          outcome={card.outcome}
          onRecording={room.features?.calls && card.recording_url ? () => actions.openRecording(card) : undefined}
          className="bg-white shadow-bubble"
        />
      </div>
    );
  }
  return <Bubble author="go">{card.state === "failed" ? copy.call.failed(card.business) : card.fallback_text}</Bubble>;
}

const ROW_STATUS: Record<ChecklistCard["rows"][number]["status"], VisaMember["status"]> = {
  todo: "not-yet",
  started: "started",
  done: "sent",
  info: "started",
};

function ChecklistView({ card, room, actions }: { card: ChecklistCard; room: RoomModel; actions: RoomActions }) {
  const due = card.due_at ? copy.checklist.due(formatDay(parseDay(card.due_at)).replace(/^\w+ /, "")) : undefined;
  const nameOf = (id: Id) => (id === room.me.id ? "You" : userOf(room.users, id).firstName);
  // A list of lines to read (who lands when) with Go's suggestion under it, or a to-do per person (a visa).
  if (card.suggestion || card.rows.some((r) => r.status === "info")) {
    const cta = card.suggestion?.cta;
    return (
      <WhoLandsCard
        title={card.title}
        status={card.subtitle ?? due ?? ""}
        rows={card.rows.map((r) => ({ userId: r.person_id, name: nameOf(r.person_id), mode: r.label ?? "", lands: r.sub ?? "", booked: r.status === "done" }))}
        suggestion={card.suggestion ? { emoji: copy.checklist.suggestion, text: card.suggestion.text, cta: cta?.label ?? "" } : undefined}
        onSuggestion={cta ? () => actions.tap(card.card_id, cta.action_id) : undefined}
      />
    );
  }
  return (
    <VisaStatusCard
      emoji={copy.checklist.emoji}
      title={card.title}
      due={due}
      rows={card.rows.map((r) => ({
        user: userOf(room.users, r.person_id),
        isYou: r.person_id === room.me.id,
        sub: r.sub ?? "",
        status: ROW_STATUS[r.status] ?? "started",
        label: r.label ?? undefined,
      }))}
    />
  );
}

// ---------------------------------------------------------------------------
// record cards drawn from the trip's own rows
// ---------------------------------------------------------------------------

function TicketView({ bookingId, room }: { bookingId: Id; room: RoomModel }) {
  const b = room.view.bookings.find((x) => x.booking_id === bookingId);
  if (!b) return null;
  const kind = b.kind.toUpperCase();
  const start = b.journey ? wallTime(b.journey.depart_at) : b.starts_at ? wallTime(b.starts_at) : null;
  const end = b.ends_at ? wallTime(b.ends_at) : null;
  const nights = b.kind === "stay" && start && end ? daysBetween(start, end) : 0;
  const dates = b.journey
    ? `${routeLine(b.journey)}${start ? ` · ${formatDayShort(start)}` : ""}`
    : start && end
      ? `${formatDayShort(start)} → ${formatDayShort(end)}`
      : start
        ? formatDayShort(start)
        : b.vendor;
  return (
    <div className="mr-[30px] ml-[38px]">
      <BookedTicketCard
        img={httpUrl(b.image_url) ?? httpUrl(placePhoto(b.place)) ?? illustrationFor(b.booking_id, b.place?.name ?? b.title)}
        imgAlt={b.title}
        eyebrow={b.status === "cancelled" ? copy.ticket.cancelled(kind) : copy.ticket.booked(kind)}
        title={b.title}
        dates={dates}
        stub={nights > 0 ? copy.ticket.nights(nights) : copy.ticket.stub}
        showReaction={false}
      />
    </div>
  );
}

function ExpenseView({ expenseId, room }: { expenseId: Id; room: RoomModel }) {
  const e = room.view.expenses.find((x) => x.expense_id === expenseId);
  // A row that is gone was removed (§4.6): say so rather than drawing an amount that no longer counts.
  if (!e) return <Bubble author="go">{copy.expense.removed}</Bubble>;
  const n = Math.max(e.split_person_ids.length, 1);
  return (
    <ReceiptCard
      label={copy.expense.label}
      item={{ title: e.note, payer: userOf(room.users, e.paid_by_person_id), amount: money(e.amount_minor) }}
      split={copy.expense.split(money(Math.floor(e.amount_minor / n)), n)}
      cta={copy.expense.cta}
      href={`/trips/${room.tripId}/expenses`}
    />
  );
}

function SettleUpView({ room, actions }: { room: RoomModel; actions: RoomActions }) {
  const transfers = room.view.money.transfers;
  if (transfers.length === 0) return <Bubble author="go">{copy.settle.allSquare}</Bubble>;
  return (
    <InChatCard className="px-3.5 pt-3 pb-0.5">
      <span className="text-16 font-semibold tracking-body">{copy.settle.title}</span>
      {transfers.map((t) => (
        <SettleRow
          key={`${t.from_person_id}|${t.to_person_id}`}
          settlement={toSettlement(t)}
          users={room.users}
          isYou={t.from_person_id === room.me.id}
          onRecord={() => actions.openRecord(t)}
        />
      ))}
    </InChatCard>
  );
}

const CATEGORY_EMOJI = { stay: "🏡", food: "🍽️", getting_around: "🚕", activities: "🎟️", other: "📌" } as const;

function DayView({ date, room }: { date: string; room: RoomModel }) {
  const day = room.view.itinerary.find((d) => d.date === date);
  if (!day || day.items.length === 0) return null;
  const at = parseDay(day.date);
  const label = `${weekdayShort(at)} ${at.getDate()} ${monthShort(at)}`.toUpperCase() + (day.title ? ` · ${day.title.toUpperCase()}` : "");
  const kindOf = new Map(room.view.bookings.map((b) => [b.booking_id, b.kind]));
  return (
    <div className="mr-4 ml-[38px]">
      <DayCard label={label}>
        {day.items.map((item, i) => {
          const kind = item.booking_id ? kindOf.get(item.booking_id) : undefined;
          return (
            <TimelineRow
              key={item.item_id ?? i}
              time={item.time ? formatHHMM(item.time).replace(" am", "a").replace(" pm", "p") : ""}
              emoji={kind ? bookingEmoji(kind) : (CATEGORY_EMOJI[item.category] ?? CATEGORY_EMOJI.other)}
              title={item.title}
              sub={item.note ?? item.place?.name ?? ""}
              connector={i < day.items.length - 1}
              trailing={null}
            />
          );
        })}
      </DayCard>
    </div>
  );
}

function PlanView({ room }: { room: RoomModel }) {
  const { view, tripId } = room;
  const dates = view.dates ? toTripDates(view.dates) : null;
  const place = view.destination?.name ?? view.title;
  const start = view.dates ? parseDay(view.dates.start) : null;
  const end = view.dates ? parseDay(view.dates.end) : null;
  const photo = httpUrl(placePhoto(view.destination));
  // The seal's ring holds about 28 characters: repeat the place name as often as fits.
  const stamp = `${place.toUpperCase()} ✦ `;
  const ring = stamp.repeat(Math.max(1, Math.round(28 / stamp.length))).trim();
  return (
    <PlanCard
      eyebrow={copy.plan.eyebrow}
      place={{ emoji: "📍", label: place }}
      dates={{ emoji: "📅", label: dates?.range ?? "" }}
      countdown={{ emoji: "⏳", label: dates?.countdown ?? "" }}
      hero={photo ? { src: photo, alt: place } : undefined}
      seal={{
        ring,
        month: start ? monthShort(start).toUpperCase() : "",
        days: start && end ? `${start.getDate()}–${end.getDate()}` : "",
      }}
      memberIds={view.people.slice(0, 5).map((p) => p.person_id)}
      days={view.itinerary.map((d, i) => ({
        n: i + 1,
        weekday: weekdayShort(parseDay(d.date)).toUpperCase(),
        caption: d.title ?? d.items[0]?.title ?? "",
        img: httpUrl(d.image_url) ?? "",
      }))}
      footer={{ label: copy.plan.made, cta: copy.plan.open, href: `/trips/${tripId}/itinerary` }}
    />
  );
}

/** "The money so far": the trip's spend against the plan the organizer set, when there is one. */
function BudgetView({ room }: { room: RoomModel }) {
  const m = room.view.money;
  const of = (category: string) => fromMinor(m.by_category.find((c) => c.category === category)?.amount_minor ?? 0);
  const spent = fromMinor(m.spent_minor);
  const plan = m.plan_minor ? fromMinor(m.plan_minor) : null;
  const stay = of("stay");
  return (
    <div className="mr-4 ml-[38px]">
      <SpendVsBudgetCard
        eyebrow={copy.budget.eyebrow}
        spend={plan ? { kind: "filled", stay, travel: Math.max(0, spent - stay), budget: plan, left: Math.max(0, plan - spent) } : { kind: "empty" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function renderKnown(card: KnownCard, room: RoomModel, actions: RoomActions): ReactNode {
  switch (card.kind) {
    case "vote": {
      const decision = room.view.decisions.find((d) => d.decision_id === card.decision_id);
      return decision ? <VoteCard decision={decision} room={room} actions={actions} /> : <VotePending card={card} room={room} />;
    }
    case "mandate": {
      const decision = room.view.decisions.find((d) => d.decision_id === card.decision_id);
      return decision?.mandate ? <MandateCard decision={decision} room={room} actions={actions} /> : null;
    }
    case "ticket":
      return room.view.bookings.some((b) => b.booking_id === card.booking_id) ? <TicketView bookingId={card.booking_id} room={room} /> : null;
    case "expense":
      return <ExpenseView expenseId={card.expense_id} room={room} />;
    case "settle_up":
      return <SettleUpView room={room} actions={actions} />;
    case "day":
      return room.view.itinerary.some((d) => d.date === card.date && d.items.length > 0) ? <DayView date={card.date} room={room} /> : null;
    case "plan":
      return room.view.itinerary.length > 0 ? <PlanView room={room} /> : null;
    case "budget":
      return <BudgetView room={room} />;
    case "options":
      return <OptionsView card={card} room={room} actions={actions} />;
    case "working":
      return <WorkingView card={card} room={room} actions={actions} />;
    case "call":
      return <CallView card={card} room={room} actions={actions} />;
    case "pay":
      return <PayView card={card} room={room} actions={actions} />;
    case "notice":
      return <NoticeView card={card} room={room} actions={actions} />;
    case "checklist":
      return <ChecklistView card={card} room={room} actions={actions} />;
    case "rooms":
      // No drawing for room sets yet: the card's own words, as for any kind this build does not draw.
      return null;
  }
}

/** One card under a message. Falls back to the card's `fallback_text` whenever there is nothing better to draw. */
export function CardView({ card, room, actions }: { card: Card; room: RoomModel; actions: RoomActions }) {
  const drawn = isKnownCard(card) ? renderKnown(card, room, actions) : null;
  return <>{drawn ?? fallback(card)}</>;
}
