"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isKnownCard, type CallCard, type OptionsCard, type Transfer } from "@/api/contract";
import { errorMessage } from "@/api/http";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatSkeleton } from "@/components/chat/ChatSkeleton";
import { Composer } from "@/components/chat/Composer";
import { ComposerTray } from "@/components/chat/ComposerTray";
import { EarlierMessagesRow } from "@/components/chat/EarlierMessagesRow";
import { FactChipRow, type FactChipData } from "@/components/chat/FactChipRow";
import { GoThinking } from "@/components/chat/GoThinking";
import { LongPressOverlay } from "@/components/chat/LongPressOverlay";
import { MessageList } from "@/components/chat/MessageList";
import { NewMessagesPill } from "@/components/chat/NewMessagesPill";
import { RoomUsersProvider } from "@/components/chat/RoomContext";
import { useLongPress } from "@/components/chat/useLongPress";
import { useScrollToEnd, useStayAtEnd, useThreadFollow } from "@/components/chat/useScrollToEnd";
import { Screen } from "@/components/shell/Screen";
import { ShareInviteSheet } from "@/components/shell/ShareInviteSheet";
import { AttachmentSheet } from "@/components/sheets/AttachmentSheet";
import { BoardSheet } from "@/components/sheets/BoardSheet";
import { BudgetSheet } from "@/components/sheets/BudgetSheet";
import { CabSheet } from "@/components/sheets/CabSheet";
import { FromCitySheet } from "@/components/sheets/FromCitySheet";
import { PlaceDetailsSheet } from "@/components/sheets/PlaceDetailsSheet";
import { PrivateSheet } from "@/components/sheets/PrivateSheet";
import { QuickStartSheet } from "@/components/sheets/QuickStartSheet";
import { RecordPaymentSheet, type RecordTarget } from "@/components/sheets/RecordPaymentSheet";
import { RouteSheet } from "@/components/sheets/RouteSheet";
import { StayDetailsSheet } from "@/components/sheets/StayDetailsSheet";
import { TicketSheet } from "@/components/sheets/TicketSheet";
import { useCardTap } from "@/components/sheets/useCardTap";
import { useGroupBudget } from "@/components/sheets/useGroupBudget";
import { recordTargetFor } from "@/components/sheets/useRecordTarget";
import { RecordingSheet } from "@/components/trip/RecordingSheet";
import { PRIVATE_COPY } from "@/data/seed/bookings";
import { CIT } from "@/data/seed/cities";
import { board as boardCopy, cards as cardCopy, chat as chatCopy, fromSheet, polls, staySheet } from "@/data/seed/copy";
import { ROUTE_COPY } from "@/data/seed/routes";
import type { Attachment, ChipKey, CityRef, FrameRect, TripId, TripType, Vibe } from "@/data/types";
import { GO_MENTION, mentionHandles, type MentionItem } from "@/lib/mentions";
import { dropQueryParams } from "@/lib/query";
import { scrollBehavior } from "@/lib/motion";
import { toastGo } from "@/lib/toast";
import {
  answerMandate,
  castVote,
  loadBookings,
  loadMoney,
  loadOlderMessages,
  loadRoom,
  markRead,
  react,
  retractVote,
  retrySend,
  saveJoinAnswers,
  sendMessage,
  useGo,
  useTripGate,
  type TripData,
} from "@/state";
import { buildBoard, type BoardTarget } from "@/state/boardView";
import { toPrivateDetails, toTicketDoc } from "@/state/bookingView";
import { toCall, type CallModel } from "@/state/homeView";
import { toCabCard, toPlaceOption, toRouteCard, toStay, voteShape } from "@/state/optionView";
import { buildRoom } from "@/state/roomView";
import { fromMinor, toTripDates, toUser, tripFromView, usersById } from "@/state/view";
import { kFormat } from "@/lib/format";
import type { OptionRef, RoomModel } from "./CardView";
import { MessageRenderer, userAvatar, type MessageActions } from "./MessageRenderer";
import { useChatSheets } from "./useChatSheets";
import { useComposerModes } from "./useComposerModes";

/** Bubble-row rect relative to #app-frame's top-left, i.e. in page coordinates (the long-press overlay is absolute inside the page). */
function frameRect(el: HTMLElement): FrameRect {
  const r = el.getBoundingClientRect();
  const f = document.getElementById("app-frame")?.getBoundingClientRect();
  return { top: r.top - (f?.top ?? 0), left: r.left - (f?.left ?? 0), width: r.width, height: r.height };
}

/** "Quick start" was closed without answering: remembered per trip on this device, so it does not come back. */
const quickStartKey = (tripId: string) => `go-quickstart-dismissed:${tripId}`;
function wasDismissed(tripId: string): boolean {
  try {
    return window.localStorage.getItem(quickStartKey(tripId)) === "1";
  } catch {
    return false;
  }
}

const VIBE_PREFIX = "Vibe: ";
const VIBES: readonly Vibe[] = ["beach", "hills", "city", "any"];

/** A city I answered in words, as the picker's value (the strip's own id when it is one of its chips). */
function cityRef(name: string | null | undefined): CityRef | null {
  if (!name) return null;
  const known = CIT.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return known ?? { id: name.toLowerCase(), name };
}

/**
 * The trip chat (`/trips/[tripId]/chat`, CONTRACT-APP §4.6–§4.8): the room is `GET …/messages` plus live frames. Go's
 * messages, chips and cards come from Go; votes, the mandate and money are the Server's own rows.
 */
export function ChatScreen({ tripId }: { tripId: TripId }) {
  const data = useTripGate(tripId);
  const ready = data !== null;

  useEffect(() => {
    if (ready) void loadRoom(tripId).catch((err) => toastGo(errorMessage(err)));
  }, [ready, tripId]);

  // A room that is not there yet when the page opens (a refresh, a first visit) is replaced by the skeleton in place; only
  // one that is already there slides up with the page.
  const [slideIn] = useState(() => data?.view != null && data.room === "ready");

  // First-render messages count as history (no rise-in), so the room mounts once its first page is in.
  if (!data?.view || data.room !== "ready") return <ChatSkeleton tripId={tripId} />;
  return <Room tripId={tripId} data={data} slideIn={slideIn} />;
}

function Room({ tripId, data, slideIn }: { tripId: TripId; data: TripData; slideIn: boolean }) {
  const view = data.view!;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const params = useSearchParams();
  const features = useGo((s) => s.config?.features);

  const trip = tripFromView(view);
  const users = usersById(view.people);
  const me = toUser(view.me.person);
  const room: RoomModel = { tripId, view, data, users, me, features };
  const rows = buildRoom(data, users, me.id);

  // Messages already in the thread on first render don't rise in.
  const [historyIds] = useState(() => new Set(rows.map((m) => m.id)));

  // -- Quick start: asked once, until it is answered or dismissed -------------------------------------------------
  const vibe = VIBES.find((v) => view.me.person.know.includes(`${VIBE_PREFIX}${v}`)) ?? null;
  const from = cityRef(view.me.person.from_city);
  const [dismissed, setDismissed] = useState(() => wasDismissed(tripId));
  const autoQuickStart = !dismissed && !from && !vibe && view.stage !== "planned";

  // "@" in the composer: Go first, then everyone else in the trip (not me).
  const mentionPeople = mentionHandles(Object.values(users));
  const mentionItems: MentionItem[] = [
    GO_MENTION,
    ...mentionPeople.filter((p) => p.user.id !== me.id).map((p) => ({ id: p.user.id, name: p.user.name, handle: p.handle, user: p.user })),
  ];
  const modes = useComposerModes(tripId, rows, mentionPeople);
  const sheets = useChatSheets(autoQuickStart, () => modes.setMode(null));
  const sheet = sheets.sheet;
  const budget = useGroupBudget(tripId);

  // Sheet payloads: each keeps its last value so the content stays put while the sheet animates out.
  const [option, setOption] = useState<OptionRef | null>(null);
  const [routeCard, setRouteCard] = useState<OptionsCard | null>(null);
  const [cabCard, setCabCard] = useState<OptionsCard | null>(null);
  const [privateBookingId, setPrivateBookingId] = useState<string | null>(null);
  const [ticketBookingId, setTicketBookingId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Extract<Attachment, { kind: "image" | "file" }> | null>(null);
  const [recordTarget, setRecordTarget] = useState<RecordTarget | null>(null);
  const [recording, setRecording] = useState<CallModel | null>(null);

  /** The latest card of a kind in the room: what a `go://…/sheet/route` link, or the Board's travel row, opens. */
  const latestOptions = (kinds: string[]): OptionsCard | null => {
    for (let i = data.order.length - 1; i >= 0; i--) {
      const card = data.messages[data.order[i]].card;
      if (card?.kind === "options" && kinds.includes((card as OptionsCard).option_kind)) return card as OptionsCard;
    }
    return null;
  };
  const openBudget = () => {
    budget.reset();
    sheets.open("budget");
  };
  const openRoute = (card: OptionsCard | null) => {
    if (!card) return false;
    setRouteCard(card);
    sheets.open("route");
    return true;
  };
  const openCab = (card: OptionsCard | null) => {
    if (!card) return false;
    setCabCard(card);
    sheets.open("cab");
    return true;
  };
  const openPrivate = (bookingId: string) => {
    // My seat, PNR and ticket only come with the bookings read (covered people only, §1.7).
    void loadBookings(tripId).catch(() => {});
    setPrivateBookingId(bookingId);
    sheets.open("private");
  };

  const cardTap = useCardTap(tripId, (route) => {
    if (route.kind === "booking") openPrivate(route.bookingId);
    else if (route.sheet === "budget") openBudget();
    else if (route.sheet === "route") openRoute(latestOptions(["flight", "train", "bus"]));
    else openCab(latestOptions(["cab"]));
  });

  // -- Reading: mark the room read while it is on screen ------------------------------------------------------------
  const lastId = rows.length > 0 ? rows[rows.length - 1].id : "";
  useEffect(() => {
    if (document.visibilityState !== "visible") return;
    const timer = window.setTimeout(() => void markRead(tripId).catch(() => {}), 400);
    return () => window.clearTimeout(timer);
  }, [tripId, lastId]);

  // -- Scrolling --------------------------------------------------------------------------------------------------
  // The 3A contract: useLongPress cancels on any scroll, so auto-scroll holds while a press is armed and catches up
  // on release. The key follows the newest row, so reading back older pages never yanks the thread to its end.
  // Go's `typing` frame (§3.1) adds a row under the newest one; the store drops it when Go speaks or it runs out.
  const goThinking = data.typing.some((e) => e.who.kind === "go");
  const liveScrollKey = goThinking ? `${lastId}+go` : lastId;
  const [heldScrollKey, setHeldScrollKey] = useState<string | null>(null);
  // A new message scrolls a reader who is at the end; one who has scrolled up stays where they are, with a button that counts what came in.
  const thread = useThreadFollow(anchorRef, rows);
  useScrollToEnd(anchorRef, [heldScrollKey ?? liveScrollKey], thread.follow);
  // Opening or closing the reply / ask-Go tray moves the bottom edge only: the thread follows it when it was already at
  // the end, and stays where it is when reading further up (the message being replied to is usually there).
  useStayAtEnd(anchorRef, modes.bottomPadding);
  // A vote's card stands as a placeholder until its decision is read, and the poll is taller: if the thread was at its end,
  // it follows the newest card to its new end.
  const newest = rows[rows.length - 1]?.card;
  useStayAtEnd(anchorRef, newest && isKnownCard(newest) && newest.kind === "vote" ? view.decisions.some((d) => d.decision_id === newest.decision_id) : true);

  // "Earlier messages" adds a page above: keep what was on screen where it was.
  const firstId = rows[0]?.id ?? "";
  const fromBottom = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (fromBottom.current === null) return;
    window.scrollTo(0, document.documentElement.scrollHeight - fromBottom.current);
    fromBottom.current = null;
  }, [firstId]);
  const loadEarlier = () => {
    if (data.loadingHistory) return; // the row stays tappable while loading; a repeat tap must not re-anchor the scroll
    fromBottom.current = document.documentElement.scrollHeight - window.scrollY;
    void loadOlderMessages(tripId).catch((err) => {
      fromBottom.current = null;
      toastGo(errorMessage(err));
    });
  };

  // `?focus=<message>` (a "Pending on you" row, the Board's Vote): scroll to that message once, then drop the param.
  const [focus, setFocus] = useState<string | null>(() => params.get("focus"));
  useEffect(() => {
    if (!focus) return;
    const timer = window.setTimeout(() => {
      document.querySelector(`[data-message="${CSS.escape(focus)}"]`)?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
      dropQueryParams("focus");
      setFocus(null);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [focus]);

  // -- Long-press (one gesture for every member and own bubble; the bubble's `[data-msg-id]` row names the message) --
  const [anchor, setAnchor] = useState<{ id: string; rect: FrameRect } | null>(null);
  const pressHandlers = useLongPress((target) => {
    const row = target.closest<HTMLElement>("[data-msg-id]");
    const id = row?.dataset.msgId;
    if (!row || !id) return;
    setHeldScrollKey(null); // the overlay now covers the bubble, so its release never reaches the row
    setAnchor({ id, rect: frameRect(row) });
    modes.setMode("longpress", id);
  });

  const overlayTarget = modes.mode === "longpress" ? modes.target : null;

  // -- Fact chips: derived from the trip itself, never from a message ---------------------------------------------------
  const stayBooking = view.bookings.find((b) => b.kind === "stay" && b.status === "confirmed");
  const stayWinner = view.decisions.find((d) => d.status === "closed" && d.result_index != null && !d.cancels_booking_id && voteShape(d) === "stay");
  const budgetMinor = view.budget?.per_person_minor;
  const facts: Record<ChipKey, string | null> = {
    where: view.destination?.name ?? null,
    when: view.dates ? toTripDates(view.dates).chip : null,
    // The stay the group chose (a booking, else the vote's winner): not `TripView.stay`, which is "the kind of stay".
    stay: stayBooking?.place?.name ?? stayBooking?.title ?? (stayWinner ? stayWinner.options[stayWinner.result_index!]?.label : null) ?? null,
    budget: budgetMinor ? kFormat(fromMinor(budgetMinor)) : null,
    from: view.me.person.from_city ?? null,
  };
  const onChip = (key: ChipKey) => {
    if (key === "budget") openBudget();
    else if (key === "from") sheets.open("from");
    else openBoard();
  };
  const quickStartOpen = sheet === "quickstart";
  const chipData: FactChipData[] = (["where", "when", "stay", "budget", "from"] as const).map((key) => ({
    key,
    emoji: chatCopy.chipEmoji[key],
    label: facts[key] ?? chatCopy.chipUnset[key],
    state: facts[key] ? "set" : "unset",
    // While QuickStart is open no chip is active; From / Budget are active while their sheet is open.
    active: !quickStartOpen && (key === "from" || key === "budget") && sheet === key,
    onPress: () => onChip(key),
  }));

  // -- Board ------------------------------------------------------------------------------------------------------
  function openBoard() {
    // "Your spend vs the budget" needs my share of the money.
    void loadMoney(tripId).catch(() => {});
    sheets.open("board");
  }
  const board = buildBoard(view, data.money, users);
  const boardAction = (target: BoardTarget) => {
    if (target === "budget") return openBudget();
    const boardRow = board.rows.find((r) => r.key === target);
    if (boardRow?.kind === "poll") {
      // The vote is cast on its card in the room.
      const at = data.order.find((id) => {
        const card = data.messages[id].card;
        return card?.kind === "vote" && (card as { decision_id?: string }).decision_id === boardRow.decisionId;
      });
      sheets.close();
      if (at) setFocus(at);
      return;
    }
    if (target === "travel" && openRoute(latestOptions(["flight", "train", "bus"]))) return;
    // Everything else is asked of Go in the room: the row's ask is put in the composer, ready to send.
    const set = boardRow?.kind === "row" && boardRow.trailing.kind !== "ask";
    const asks = boardCopy.asks;
    const text =
      target === "where"
        ? set ? asks.changeWhere : asks.where
        : target === "when"
          ? set ? asks.changeWhen : asks.when
          : target === "stay"
            ? set ? asks.changeStay : asks.stay
            : board.reminder ? asks.returnTrip : asks.travel;
    sheets.close();
    modes.setDraft(text);
  };

  // -- Card and message actions -----------------------------------------------------------------------------------
  const fail = (fallback: string) => (err: unknown) => toastGo(errorMessage(err, fallback));
  const actions: MessageActions = {
    vote: (decisionId, index) => {
      const job = index === null ? retractVote(tripId, decisionId) : castVote(tripId, decisionId, { option_index: index });
      void job.catch(fail(polls.failed));
    },
    flexible: (decisionId) => {
      const mine = data.myVotes[decisionId];
      const isFlexible = Boolean(mine && "flexible" in mine);
      // Tapping it again takes the answer back, where taking a vote back is allowed.
      if (isFlexible && !features?.vote_retract) return;
      const job = isFlexible ? retractVote(tripId, decisionId) : castVote(tripId, decisionId, { flexible: true });
      void job.catch(fail(polls.failed));
    },
    mandate: (decisionId, answer) => void answerMandate(tripId, decisionId, answer).catch(fail(cardCopy.mandate.failed)),
    tap: (cardId, actionId, opts) => void cardTap.tap(cardId, actionId, opts),
    pending: cardTap.pending,
    openOption: (ref) => {
      setOption(ref);
      sheets.open(ref.shape);
    },
    openRoute: (card) => void openRoute(card),
    openCab: (card) => void openCab(card),
    openRecord: (transfer: Transfer) => {
      setRecordTarget(recordTargetFor(view, transfer));
      sheets.open("record");
    },
    openRecording: (card: CallCard) => {
      setRecording(toCall(card));
      sheets.open("recording");
    },
    openAttachment: (a) => {
      if (a.kind === "voice") return;
      setAttachment(a);
      sheets.open("attachment");
    },
    // A quick reply is my own message: Go hears it as an ordinary `message.created`.
    quickReply: (text) => void sendMessage(tripId, { text }),
    retry: (clientId) => retrySend(tripId, clientId),
  };

  // -- Details sheet payloads -----------------------------------------------------------------------------------------
  const optionDecision = option?.source === "vote" ? view.decisions.find((d) => d.decision_id === option.decisionId) : undefined;
  const optionVoters =
    option?.source === "vote" ? (optionDecision?.votes ?? []).filter((v) => v.option_index === option.index).map((v) => v.person_id) : [];
  const cardOption = option?.source === "card" ? option.card.options.find((o) => o.option_id === option.optionId) : undefined;
  const cardPick = option?.source === "card" ? (option.card.actions ?? []).find((a) => a.per_option && (!a.only_for_person_ids || a.only_for_person_ids.includes(me.id))) : undefined;
  const stayCtx = { dates: view.dates, people: view.people.length, seed: option?.source === "vote" ? option.decisionId : (option?.card.card_id ?? "") };
  const raw = option?.source === "vote" ? optionDecision?.options[option.index] : cardOption;
  const optionId = option ? (option.source === "vote" ? String(option.index) : option.optionId) : "";
  const place = option?.shape === "place" && raw ? toPlaceOption(raw, optionId, optionVoters, stayCtx.seed, option.source === "vote" ? option.index : 0) : null;
  const stayDetails = option?.shape === "stay" && raw ? toStay(raw, optionId, optionVoters, stayCtx) : null;
  // The sheet's button: my vote while the vote is open, or the options card's own per-option action.
  const pressOption = !option
    ? undefined
    : option.source === "vote"
      ? optionDecision?.status === "open"
        ? () => {
            actions.vote(option.decisionId, option.index);
            sheets.close();
          }
        : undefined
      : cardPick
        ? () => {
            actions.tap(option.card.card_id, cardPick.action_id, { optionId: option.optionId });
            sheets.close();
          }
        : undefined;
  const optionLabel = option?.source === "card" ? cardPick?.label : undefined;

  const bookings = data.bookings ?? view.bookings;
  const privateBooking = bookings.find((b) => b.booking_id === privateBookingId);
  const ticketBooking = bookings.find((b) => b.booking_id === ticketBookingId);
  const ticket = ticketBooking ? toTicketDoc(ticketBooking, undefined, me) : null;

  const book = (cardId: string, actionId: string) => (optionId: string, tripType: TripType) =>
    void cardTap.tap(cardId, actionId, { optionId, payload: { trip: tripType } }).then((result) => {
      if (!result || result.result === "refused") return;
      sheets.close();
      if (result.result === "done" && !result.toast) toastGo(ROUTE_COPY.booked);
    });
  const routeModel = routeCard ? toRouteCard(routeCard, me.id) : null;
  const cabModel = cabCard ? toCabCard(cabCard, me.id) : null;

  const closeOnFalse = (open: boolean) => {
    if (!open) sheets.close();
  };
  const dismissQuickStart = () => {
    try {
      window.localStorage.setItem(quickStartKey(tripId), "1");
    } catch {
      // Storage blocked: it stays dismissed for this visit.
    }
    setDismissed(true);
    sheets.close();
  };
  const saveAnswers = (answers: { vibe?: Vibe; from_city?: string | null }) =>
    saveJoinAnswers(tripId, answers).catch(fail(fromSheet.failed));

  // Composer / tray / overlay.
  const target = modes.target;
  // Who the message is from: a member, me or Go. The tray words it as "Replying to Arjun / yourself / Go".
  const targetAuthor = !target ? null : target.mine ? "me" : target.author.kind === "go" ? "go" : "member";
  const targetUser = target?.author.kind === "person" && !target.mine ? (users[target.author.id] ?? null) : null;
  const targetName = targetAuthor === "me" ? chatCopy.tray.yourself : targetAuthor === "go" ? chatCopy.goName : targetUser?.firstName;
  const trayMode = modes.mode === "reply" || modes.mode === "askGo" ? modes.mode : null;
  const subtitle = view.dates ? toTripDates(view.dates).short : chatCopy.subtitle.people(view.people.length);

  return (
    <RoomUsersProvider value={users}>
      <Screen>
        <ChatHeader
          // The same picture as the trip home's hero banner; the drawn illustration only when the destination has no photo.
          trip={{ name: trip.name, avatar: trip.hero?.src ?? trip.illustration, photo: Boolean(trip.hero), tint: trip.tint }}
          subtitle={subtitle}
          members={view.people.slice(0, 4).map((p) => userAvatar(toUser(p)))}
          backHref={`/trips/${tripId}`}
          onBoard={() => (sheet === "board" ? sheets.close() : openBoard())}
          onShare={() => sheets.open("share")}
        >
          <FactChipRow chips={chipData} />
        </ChatHeader>

        <MessageList bottomPadding={modes.bottomPadding} anchorRef={anchorRef} slideIn={slideIn}>
          {data.hasMoreHistory && (
            <EarlierMessagesRow label={chatCopy.earlier} loading={data.loadingHistory} onPress={loadEarlier} />
          )}
          {rows.map((m) => (
            <MessageRenderer
              key={m.key}
              message={m}
              room={room}
              enter={!historyIds.has(m.id)}
              pressHandlers={pressHandlers}
              onPressStart={() => setHeldScrollKey(liveScrollKey)}
              onPressEnd={() => setHeldScrollKey(null)}
              actions={actions}
            />
          ))}
          {goThinking && <GoThinking />}
        </MessageList>

        {trayMode && target && targetName !== undefined ? (
          <ComposerTray
            mode={trayMode}
            banner={{
              title:
                trayMode === "reply"
                  ? chatCopy.tray.replyingTo(targetName)
                  : targetAuthor === "me"
                    ? chatCopy.tray.askGoAboutMine
                    : targetAuthor === "go"
                      ? chatCopy.tray.askGoAboutGo
                      : chatCopy.tray.askGoAbout(targetName),
              snippet: target.text,
              accent: trayMode === "reply" ? "go" : "ink",
            }}
            value={modes.trayDraft}
            onChange={modes.setTrayDraft}
            placeholder={trayMode === "reply" ? chatCopy.tray.replyPlaceholder(targetName) : chatCopy.tray.askGoPlaceholder}
            onSend={modes.sendTray}
            onCancel={() => modes.setMode(null)}
            mentionItems={mentionItems}
          />
        ) : (
          <Composer
            value={modes.draft}
            onChange={modes.setDraft}
            onSend={modes.sendDraft}
            recording={modes.recording}
            recordingSeconds={modes.recordingSeconds}
            onCancelRecording={modes.cancelRecording}
            onMic={modes.mic}
            attachOpen={modes.attachOpen}
            onAttachOpenChange={modes.onAttachOpenChange}
            onAttachFile={modes.attachFile}
            mentionItems={mentionItems}
            slideIn={slideIn}
          />
        )}

        {thread.unread > 0 && <NewMessagesPill label={chatCopy.newMessages(thread.unread)} bottomPadding={modes.bottomPadding} onPress={thread.jumpToEnd} />}

        {overlayTarget && targetAuthor && targetName !== undefined && anchor?.id === overlayTarget.id && (
          <LongPressOverlay
            message={{
              id: overlayTarget.id,
              author: targetAuthor,
              text: overlayTarget.text,
              attachments: overlayTarget.attachments,
              location: overlayTarget.location,
              ...(targetUser ? { name: targetUser.firstName, avatar: userAvatar(targetUser) } : {}),
            }}
            anchorRect={anchor.rect}
            myReaction={overlayTarget.myReaction}
            onReact={(emoji) => {
              // One reaction per person per message: the same emoji again takes it back.
              void react(tripId, overlayTarget.id, overlayTarget.myReaction === emoji ? null : emoji).catch(fail(chatCopy.toasts.reactFailed));
              modes.setMode(null);
            }}
            onReply={() => modes.setMode("reply", overlayTarget.id)}
            onAskGo={() => modes.setMode("askGo", overlayTarget.id)}
            // The overlay has already copied the text and toasted "Message copied".
            onCopy={() => modes.setMode(null)}
            onClose={() => modes.setMode(null)}
          />
        )}
      </Screen>

      <QuickStartSheet
        open={sheet === "quickstart"}
        initial={{ vibe, from }}
        onDone={(nextVibe, nextFrom) => {
          const answers = { ...(nextVibe ? { vibe: nextVibe } : {}), ...(nextFrom ? { from_city: nextFrom.name.slice(0, 60) } : {}) };
          if (Object.keys(answers).length > 0) void saveAnswers(answers);
          dismissQuickStart();
        }}
        onDismiss={dismissQuickStart}
      />
      <FromCitySheet
        open={sheet === "from"}
        initialCity={from}
        onSave={(city) => {
          void saveAnswers({ from_city: city.name.slice(0, 60) });
          sheets.close();
        }}
        onClose={sheets.close}
      />
      <PlaceDetailsSheet open={sheet === "place"} onOpenChange={closeOnFalse} place={place} voters={optionVoters} onVote={pressOption} actionLabel={optionLabel} />
      <StayDetailsSheet
        open={sheet === "stay"}
        onOpenChange={closeOnFalse}
        stay={stayDetails}
        subtitle={staySheet.subtitle}
        dates={stayDetails?.dates ?? ""}
        onVote={pressOption}
        actionLabel={optionLabel}
      />
      <BudgetSheet open={sheet === "budget"} onOpenChange={closeOnFalse} {...budget} />
      <RouteSheet
        open={sheet === "route"}
        onOpenChange={closeOnFalse}
        card={routeModel}
        pending={cardTap.pending !== null}
        onBook={routeModel?.action ? book(routeModel.cardId, routeModel.action.actionId) : () => {}}
      />
      <CabSheet
        open={sheet === "cab"}
        onOpenChange={closeOnFalse}
        card={cabModel}
        pending={cardTap.pending !== null}
        onBook={cabModel?.action ? book(cabModel.cardId, cabModel.action.actionId) : () => {}}
      />
      <PrivateSheet
        open={sheet === "private"}
        onOpenChange={closeOnFalse}
        title={PRIVATE_COPY.title}
        sub={PRIVATE_COPY.sub}
        details={privateBooking ? toPrivateDetails(privateBooking, me.id) : null}
        // Private sheet -> ticket viewer in one swap, so closing the viewer lands back on the chat.
        onOpenTicket={
          privateBooking?.documents?.length
            ? () => {
                setTicketBookingId(privateBooking.booking_id);
                sheets.swap("ticket");
              }
            : undefined
        }
      />
      <AttachmentSheet open={sheet === "attachment"} onOpenChange={closeOnFalse} attachment={attachment} />
      <TicketSheet tripId={tripId} open={sheet === "ticket"} onOpenChange={closeOnFalse} ticket={ticket} />
      <BoardSheet board={board} open={sheet === "board"} onOpenChange={closeOnFalse} onAction={boardAction} />
      <RecordPaymentSheet open={sheet === "record"} onOpenChange={closeOnFalse} target={recordTarget} />
      <RecordingSheet tripId={tripId} call={recording} open={sheet === "recording"} onOpenChange={closeOnFalse} />
      <ShareInviteSheet trip={trip} open={sheet === "share"} onOpenChange={closeOnFalse} />
    </RoomUsersProvider>
  );
}
