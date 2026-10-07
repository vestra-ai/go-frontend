import type { ReactNode } from "react";
import { BookingProgressCard } from "@/components/chat/cards/BookingProgressCard";
import { BudgetAskBubble } from "@/components/chat/cards/BudgetAskBubble";
import { DatesPollCard } from "@/components/chat/cards/DatesPollCard";
import { PayAskCard } from "@/components/chat/cards/PayAskCard";
import { PlacePollRail } from "@/components/chat/cards/PlacePollRail";
import { PlanCard } from "@/components/chat/cards/PlanCard";
import { PrivateTeaserCard } from "@/components/chat/cards/PrivateTeaserCard";
import { ProgressPill } from "@/components/chat/cards/ProgressPill";
import { StayPollRail } from "@/components/chat/cards/StayPollRail";
import { TravelAskBubble } from "@/components/chat/cards/TravelAskBubble";
import { VisaAskBubble } from "@/components/chat/cards/VisaAskBubble";
import { VisaStatusCard } from "@/components/chat/cards/VisaStatusCard";
import { WhoLandsCard } from "@/components/chat/cards/WhoLandsCard";
import { DATE_OPTIONS } from "@/data/seed/dates";
import { PLACES } from "@/data/seed/places";
import { STAYS } from "@/data/seed/stays";
import { baliVisa } from "@/data/seed/visa";
import type { AvatarSpec, DateOption, MessageCard, PlaceOption, Stay, User, UserId } from "@/data/types";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatTripData, VisaRow } from "@/store";
import { Bubble } from "./Bubble";
import { NextStepPill } from "./NextStepPill";
import { QuickReplyBlock } from "./QuickReplyBlock";
import { SystemPill } from "./SystemPill";
import type { LongPressHandlers } from "./useLongPress";

// Card kind → component for all 15 card kinds (C-chat-kickoff.md §1.9, E-deciding.md §1.9, F-travel.md §1.9,
// G-bali.md §1.3). Store, router and toast wiring arrive as `actions`; this file stays presentational.

/** Every callback a card can fire; ChatScreen binds them to the store, the sheet URL and toasts. */
export interface CardActions {
  /** Quick-reply chip or the Go nudge: `advance('place-asked')`. */
  askPlaces(): void;
  votePlace(id: PlaceOption["id"] | null): void;
  openPlace(id: PlaceOption["id"]): void;
  morePlaces(): void;
  voteDate(id: DateOption["id"] | null): void;
  toggleFlexible(): void;
  openBudget(): void;
  voteStay(id: Stay["id"] | null): void;
  openStay(id: Stay["id"]): void;
  moreStays(): void;
  openPay(): void;
  watchCheckout(): void;
  completeBooking(): void;
  openRoute(): void;
  openCab(): void;
  viewPrivate(): void;
  openVisa(): void;
}

// DESIGN-ASSUMPTION (PLAN §12.1 #7): the claimed booker row reads "Rahul is booking for all 4" whoever claimed,
// so its avatar follows the copy.
const DESIGN_BOOKER: UserId = "rahul";

// Same mount animation as Bubble's, for cards and pills appended after first render.
const enterClass =
  "transition-[opacity,translate] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0";

const byIds = <T extends { id: string }>(list: T[], ids: readonly string[]): T[] =>
  ids.flatMap((id) => list.filter((item) => item.id === id));

export function userAvatar(user: User): AvatarSpec {
  return { kind: "user", src: user.avatar, initials: user.initials, tone: user.tone };
}

type MessageRendererProps = {
  message: ChatMessage;
  me: UserId;
  users: Record<UserId, User>;
  chat: ChatTripData;
  visaRows: VisaRow[];
  /** Appended after first render: rise-in. */
  enter: boolean;
  /** Extra classes on the row wrapper (e.g. the 26px gap after the plan card). */
  className?: string;
  /** One shared `useLongPress` for every member bubble; the target's `[data-msg-id]` names the message. */
  pressHandlers: LongPressHandlers;
  /** A press started / ended on a member bubble (ChatScreen holds auto-scroll while a press is armed). */
  onPressStart(): void;
  onPressEnd(): void;
  actions: CardActions;
};

function renderCard(card: MessageCard, props: MessageRendererProps): ReactNode {
  const { chat, me, users, visaRows, actions } = props;

  switch (card.kind) {
    case "quick-replies":
      return (
        <QuickReplyBlock
          eyebrow={card.payload.eyebrow}
          chips={card.payload.chips.map((label) => ({ label, onPress: actions.askPlaces }))}
        />
      );
    case "go-nudge":
      return <NextStepPill label={card.payload.label} onPress={actions.askPlaces} />;
    case "place-poll":
      return (
        <PlacePollRail
          places={byIds(PLACES, card.payload.placeIds)}
          vote={chat.placeVote}
          me={me}
          countdown={card.payload.countdown}
          more={card.payload.more}
          onVote={actions.votePlace}
          onDetails={actions.openPlace}
          onMore={actions.morePlaces}
        />
      );
    case "dates-poll":
      return (
        <DatesPollCard
          title={card.payload.title}
          countdown={card.payload.countdown}
          options={byIds(DATE_OPTIONS, card.payload.dateIds)}
          vote={chat.dateVote}
          flexible={chat.flexible}
          me={users[me]}
          of={card.payload.of}
          flexibleLabels={card.payload.flexible}
          onVote={actions.voteDate}
          onFlexible={actions.toggleFlexible}
        />
      );
    case "budget-ask":
      return <BudgetAskBubble {...card.payload} onCta={actions.openBudget} />;
    case "stay-poll":
      return (
        <StayPollRail
          stays={byIds(STAYS, card.payload.stayIds)}
          vote={chat.stayVote}
          me={me}
          more={card.payload.more}
          onVote={actions.voteStay}
          onDetails={actions.openStay}
          onMore={actions.moreStays}
        />
      );
    case "pay-ask": {
      const { stayId, ...copy } = card.payload;
      const stay = STAYS.find((s) => s.id === stayId);
      if (!stay) return null;
      return (
        <PayAskCard
          stay={stay}
          state={chat.stayBooking.status}
          booker={users[DESIGN_BOOKER]}
          copy={copy}
          onClaim={actions.openPay}
        />
      );
    }
    case "booking-progress": {
      const { stayId, ticket, late, receipt, ...copy } = card.payload;
      const stay = STAYS.find((s) => s.id === stayId);
      if (!stay) return null;
      return (
        <BookingProgressCard
          stay={stay}
          copy={copy}
          // The payload ticket has no photo: the booked stay's (3A contract).
          ticket={{ ...ticket, img: stay.img, imgAlt: stay.name }}
          late={late}
          receipt={{
            label: receipt.label,
            item: { title: receipt.title, payer: users[receipt.payer], amount: receipt.amount },
            split: receipt.split,
            cta: receipt.cta,
            href: receipt.href,
          }}
          done={chat.stayBooking.done}
          onWatch={actions.watchCheckout}
          onComplete={actions.completeBooking}
        />
      );
    }
    case "travel-ask":
      return <TravelAskBubble {...card.payload} onCta={actions.openRoute} />;
    case "progress-pill":
      return <ProgressPill text={card.payload.text} />;
    case "who-lands":
      return <WhoLandsCard {...card.payload} onSuggestion={actions.openCab} />;
    case "private-teaser":
      return <PrivateTeaserCard {...card.payload} onView={actions.viewPrivate} />;
    case "plan":
      return <PlanCard {...card.payload} />;
    case "visa-ask":
      return <VisaAskBubble {...card.payload} onCta={actions.openVisa} />;
    case "visa-status":
      return <VisaStatusCard emoji={baliVisa.emoji} title={baliVisa.title} due={baliVisa.due} rows={visaRows} />;
  }
}

/** One thread row: system pill, Go / member / my bubble, or a Go card (wrapped with `data-card` for scroll targets). */
export function MessageRenderer(props: MessageRendererProps) {
  const { message: m, me, users, enter, className, pressHandlers, onPressStart, onPressEnd } = props;

  if (m.kind === "card" && m.card) {
    return (
      <div data-card={m.card.kind} className={cn("flex flex-col", enter && enterClass, className)}>
        {renderCard(m.card, props)}
      </div>
    );
  }

  if (m.kind === "system" || m.author === "system") {
    return (
      <div className={cn("flex flex-col", enter && enterClass, className)}>
        <SystemPill text={m.text ?? ""} />
      </div>
    );
  }

  if (m.author === "go") {
    return (
      <div className={cn("flex flex-col", className)}>
        <Bubble author="go" maxWidth={m.maxWidth} reaction={m.reaction} enter={enter}>
          {m.text ?? ""}
        </Bubble>
      </div>
    );
  }

  if (m.author === me) {
    return (
      <div className={cn("flex flex-col", className)}>
        <Bubble author="me" maxWidth={m.maxWidth} quote={m.quote} mention={m.mention} reaction={m.reaction} enter={enter}>
          {m.text ?? ""}
        </Bubble>
      </div>
    );
  }

  // Member bubble: long-press opens the message actions (C-chat-kickoff.md §1.5). The wrapper names the message
  // for the shared handler and the D1 overlay anchor, and tells ChatScreen a press is armed.
  const user = users[m.author];
  return (
    <div
      data-msg-id={m.id}
      className={cn("flex flex-col", className)}
      onPointerDown={onPressStart}
      onPointerUp={onPressEnd}
      onPointerCancel={onPressEnd}
      onPointerLeave={onPressEnd}
    >
      <Bubble
        author="member"
        name={user.firstName}
        avatar={userAvatar(user)}
        maxWidth={m.maxWidth}
        reaction={m.reaction}
        enter={enter}
        pressHandlers={pressHandlers}
      >
        {m.text ?? ""}
      </Bubble>
    </div>
  );
}
