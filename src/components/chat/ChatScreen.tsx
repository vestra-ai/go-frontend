"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { Composer } from "@/components/chat/Composer";
import { ComposerTray } from "@/components/chat/ComposerTray";
import { FactChipRow, type FactChipData } from "@/components/chat/FactChipRow";
import { LongPressOverlay } from "@/components/chat/LongPressOverlay";
import { MessageList } from "@/components/chat/MessageList";
import { NextStepPill } from "@/components/chat/NextStepPill";
import { useLongPress } from "@/components/chat/useLongPress";
import { useScrollToEnd } from "@/components/chat/useScrollToEnd";
import { Screen } from "@/components/shell/Screen";
import { ShareInviteSheet } from "@/components/shell/ShareInviteSheet";
import { BoardSheet } from "@/components/sheets/BoardSheet";
import { BudgetSheet } from "@/components/sheets/BudgetSheet";
import { CabSheet } from "@/components/sheets/CabSheet";
import { FromCitySheet } from "@/components/sheets/FromCitySheet";
import { PaySheet } from "@/components/sheets/PaySheet";
import { PlaceDetailsSheet } from "@/components/sheets/PlaceDetailsSheet";
import { PrivateSheet } from "@/components/sheets/PrivateSheet";
import { QuickStartSheet } from "@/components/sheets/QuickStartSheet";
import { RouteSheet } from "@/components/sheets/RouteSheet";
import { StayDetailsSheet } from "@/components/sheets/StayDetailsSheet";
import { VisaSheet } from "@/components/sheets/VisaSheet";
import { stageIndexOf } from "@/data/scenario/engine";
import { PRIVATE_COPY, PRIVATE_DETAILS } from "@/data/seed/bookings";
import { DEFAULT_CITY } from "@/data/seed/cities";
import { baliToasts, chat as chatCopy, paySheet, staySheet, toasts } from "@/data/seed/copy";
import { PLACES } from "@/data/seed/places";
import { STAYS } from "@/data/seed/stays";
import { TRIPS } from "@/data/seed/trips";
import { baliVisa } from "@/data/seed/visa";
import { AUTO_SCROLL_DONE_MS, DATES_NUDGE_MS, GO_TYPING_MS, RAHUL_CLAIMS_MS } from "@/data/timing";
import type { CardKind, ChipKey, FrameRect, StageId, TripId, UserId } from "@/data/types";
import { scrollBehavior } from "@/lib/motion";
import { toastGo } from "@/lib/toast";
import { useChatHeader, useChips, useMessages, useNextPill, useStage, useStore, useVisaRows } from "@/store";
import { MessageRenderer, userAvatar, type CardActions } from "./MessageRenderer";
import { useChatSheets } from "./useChatSheets";
import { useComposerModes } from "./useComposerModes";

// G-bali.md §1.3 / §1.7 #6: the Bali header, board and settled chips toast and Back goes home, as designed.
const TOAST_HEADER_TRIPS: ReadonlySet<TripId> = new Set<TripId>(["bali"]);

/** Bubble-row rect relative to #app-frame's top-left, i.e. in page coordinates (the long-press overlay is absolute inside the page). */
function frameRect(el: HTMLElement): FrameRect {
  const r = el.getBoundingClientRect();
  const f = document.getElementById("app-frame")?.getBoundingClientRect();
  return { top: r.top - (f?.top ?? 0), left: r.left - (f?.left ?? 0), width: r.width, height: r.height };
}

/**
 * The trip chat (`/trips/[tripId]/chat`): scenario thread, fact chips, composer modes, every chat sheet.
 * Artboards C1–C5, D1–D3, E1–E15, F1–F8, G2–G3 and H1–H3 are states of this screen (PLAN §8, §9.3).
 * Mount it after the store has hydrated: first-render messages count as history (no rise-in).
 */
export function ChatScreen({ tripId }: { tripId: TripId }) {
  const anchorRef = useRef<HTMLSpanElement>(null);

  const storedTrip = useStore((s) => s.trips.trips[tripId]);
  const trip = storedTrip ?? TRIPS[tripId]; // before the trip exists (Bali invite) the seed still renders
  const me = useStore((s) => s.session.userId);
  const users = useStore((s) => s.trips.members);
  const chat = useStore((s) => s.chat[tripId]);
  const stage = useStage(tripId);
  const header = useChatHeader(tripId);
  const chips = useChips(tripId);
  const messages = useMessages(tripId);
  const pill = useNextPill(tripId);
  const visaRows = useVisaRows(tripId);
  const stageIndex = chat.stageIndex;
  const toastHeader = TOAST_HEADER_TRIPS.has(tripId);

  // Go posts the next stage after a typing delay (PLAN §9.3): a newly entered stage's block and its pill
  // stay hidden for GO_TYPING_MS. History on mount (and a store reset to an earlier stage) shows at once.
  const [shownIndex, setShownIndex] = useState(stageIndex);
  if (stageIndex < shownIndex) setShownIndex(stageIndex);
  useEffect(() => {
    if (stageIndex <= shownIndex) return;
    const t = window.setTimeout(() => setShownIndex(stageIndex), GO_TYPING_MS);
    return () => window.clearTimeout(t);
  }, [stageIndex, shownIndex]);
  const revealed = Math.min(shownIndex, stageIndex);
  const settled = revealed === stageIndex;
  const visible = messages.filter((m) => stageIndexOf(tripId, m.stage) <= revealed);

  // Messages already in the thread on first render don't rise in (C-chat-kickoff.md §1.2 Bubble `enter`).
  const [historyIds] = useState(() => new Set(messages.map((m) => m.id)));

  // Chip / board deep links scroll their card into view once it is on screen (H-board.md §1.4).
  const [scrollTarget, setScrollTarget] = useState<CardKind | null>(null);
  useEffect(() => {
    if (!scrollTarget || !settled) return;
    const t = window.setTimeout(() => {
      document.querySelector(`[data-card="${scrollTarget}"]`)?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
      setScrollTarget(null);
    }, AUTO_SCROLL_DONE_MS);
    return () => window.clearTimeout(t);
  }, [scrollTarget, settled]);

  const sheets = useChatSheets(tripId, { onScrollToCard: setScrollTarget });
  const modes = useComposerModes(tripId, stage.id, visible);
  const sheet = sheets.sheet;

  // E12 → E13: Rahul claims the open booking after RAHUL_CLAIMS_MS; cleared while the pay sheet is open,
  // re-armed when it closes unpaid (E-deciding.md §1.2 `pay`). Not persisted: a reload re-arms from zero.
  const rahulArmed = stage.id === "pay" && chat.stayBooking.status === "open" && sheet !== "pay";
  useEffect(() => {
    if (!rahulArmed) return;
    const t = window.setTimeout(() => useStore.getState().claimBooking(tripId), RAHUL_CLAIMS_MS);
    return () => window.clearTimeout(t);
  }, [rahulArmed, tripId]);

  // DESIGN-ASSUMPTION (C-chat-kickoff.md §1.7 #14): the `dates-talk` fallback nudge shows DATES_NUDGE_MS after the
  // stage is current with no composer mode; a mode clears the timer; once shown it stays until the stage changes.
  const [nudgeFor, setNudgeFor] = useState<number | null>(null);
  const nudgeArmed = pill?.ready === "dates-nudge" && settled && modes.mode === null && nudgeFor !== stageIndex;
  useEffect(() => {
    if (!nudgeArmed) return;
    const t = window.setTimeout(() => setNudgeFor(stageIndex), DATES_NUDGE_MS);
    return () => window.clearTimeout(t);
  }, [nudgeArmed, stageIndex]);

  const chatPill =
    pill && settled && !pill.inSheet && (pill.ready !== "dates-nudge" || nudgeFor === stageIndex) ? pill : null;

  // The 3A contract: useLongPress cancels on any scroll, so auto-scroll holds while a press is armed and
  // catches up on release.
  const liveScrollKey = `${visible.length}|${chatPill?.label ?? ""}`;
  const [heldScrollKey, setHeldScrollKey] = useState<string | null>(null);
  useScrollToEnd(anchorRef, [heldScrollKey ?? liveScrollKey, modes.bottomPadding]);

  // Long-press (D1): one gesture for every member bubble; the bubble's `[data-msg-id]` row names the message.
  const [anchor, setAnchor] = useState<{ id: string; rect: FrameRect } | null>(null);
  const pressHandlers = useLongPress((target) => {
    const row = target.closest<HTMLElement>("[data-msg-id]");
    const id = row?.dataset.msgId;
    if (!row || !id) return;
    setHeldScrollKey(null); // the overlay now covers the bubble, so its release never reaches the row
    setAnchor({ id, rect: frameRect(row) });
    modes.setMode("longpress", id);
  });

  // `?mode=longpress&msg=…` on load (D1 preset): measure the row once it has been laid out and scrolled.
  const overlayTarget = modes.mode === "longpress" ? modes.target : null;
  const measureId = overlayTarget && anchor?.id !== overlayTarget.id ? overlayTarget.id : null;
  useEffect(() => {
    if (!measureId) return;
    const raf = requestAnimationFrame(() => {
      const row = document.querySelector<HTMLElement>(`[data-msg-id="${CSS.escape(measureId)}"]`);
      if (row) setAnchor({ id: measureId, rect: frameRect(row) });
    });
    return () => cancelAnimationFrame(raf);
  }, [measureId]);

  const store = () => useStore.getState();

  function goToCard(stageId: StageId, card: CardKind) {
    store().ensureStage(tripId, stageId);
    setScrollTarget(card);
  }

  // Fact chips (PLAN §8.1, E-deciding.md §1.2; Bali: G-bali.md §1.3). `?sheet=budget` fast-forwards to `budget`.
  function onChip(key: ChipKey, isSet: boolean) {
    if (toastHeader) {
      if (key === "budget" || key === "from") sheets.open(key);
      else toastGo(baliToasts.settled);
      return;
    }
    switch (key) {
      case "where":
        return isSet ? sheets.open("board") : goToCard("places", "place-poll");
      case "when":
        return isSet ? sheets.open("board") : goToCard("dates-poll", "dates-poll");
      case "stay":
        return isSet ? sheets.open("board") : goToCard("stays", "stay-poll");
      case "budget":
        return sheets.open("budget");
      case "from":
        return sheets.open("from");
    }
  }

  // While QuickStart is open no chip is active; From / Budget are active while their sheet is open, and the
  // budget chip through the whole unsaved `budget` stage (store `active`).
  const quickStartOpen = sheet === "quickstart";
  const chipData: FactChipData[] = chips.map((c) => ({
    key: c.key,
    emoji: c.emoji,
    label: c.label,
    state: c.state,
    active: !quickStartOpen && (Boolean(c.active) || ((c.key === "from" || c.key === "budget") && sheet === c.key)),
    onPress: () => onChip(c.key, c.state === "set"),
  }));

  const actions: CardActions = {
    askPlaces: () => store().advance(tripId, "place-asked"),
    votePlace: (id) => store().votePlace(tripId, id),
    openPlace: (id) => sheets.open("place", id),
    morePlaces: () => toastGo(toasts.morePlaces),
    voteDate: (id) => store().voteDate(tripId, id),
    toggleFlexible: () => store().setFlexible(tripId),
    openBudget: () => sheets.open("budget"),
    voteStay: (id) => store().voteStay(tripId, id),
    openStay: (id) => sheets.open("stay", id),
    moreStays: () => toastGo(toasts.moreStays),
    openPay: () => sheets.open("pay"),
    watchCheckout: () => toastGo(toasts.watchCheckout),
    completeBooking: () => store().completeBooking(tripId),
    openRoute: () => sheets.open("route"),
    openCab: () => sheets.open("cab"),
    viewPrivate: () => {
      store().markPrivateViewed(tripId);
      sheets.open("private");
    },
    openVisa: () => sheets.open("visa"),
  };

  // Pill after the current stage's seed messages, before anything sent in this stage (E-deciding.md §1.2).
  const sentIds = new Set(chat.sent.map((m) => m.id));
  const firstSent = visible.findIndex((m) => m.stage === stage.id && sentIds.has(m.id));
  const pillAt = chatPill ? (firstSent < 0 ? visible.length : firstSent) : -1;
  const pillNode = chatPill && (
    <NextStepPill key={chatPill.label} label={chatPill.label} onPress={() => store().advance(tripId, chatPill.trigger)} />
  );

  // Sheet payloads. Place / stay keep their last id so the content stays put while the sheet animates out.
  const [lastPlaceId, setLastPlaceId] = useState<string | null>(null);
  const placeId = sheet === "place" ? sheets.sheetId : null;
  if (placeId && placeId !== lastPlaceId) setLastPlaceId(placeId);
  const place = PLACES.find((p) => p.id === (placeId ?? lastPlaceId)) ?? null;

  const [lastStayId, setLastStayId] = useState<string | null>(null);
  const stayId = sheet === "stay" ? sheets.sheetId : null;
  if (stayId && stayId !== lastStayId) setLastStayId(stayId);
  const stayDetails = STAYS.find((s) => s.id === (stayId ?? lastStayId)) ?? null;

  const payStayId = messages.flatMap((m) => (m.card?.kind === "pay-ask" ? [m.card.payload.stayId] : []))[0];
  const payStay = STAYS.find((s) => s.id === payStayId);

  const budgetNext =
    pill?.inSheet === "budget"
      ? {
          label: pill.label,
          onPress: () => {
            sheets.close();
            store().advance(tripId, pill.trigger);
          },
        }
      : null;

  const closeOnFalse = (open: boolean) => {
    if (!open) sheets.close();
  };

  // Composer / tray / overlay.
  const target = modes.target;
  const targetUser = target ? users[target.author as UserId] : null;
  const trayMode = modes.mode === "reply" || modes.mode === "askGo" ? modes.mode : null;

  return (
    <>
      <Screen>
        <ChatHeader
          trip={{ name: trip.name, avatar: trip.illustration, tint: trip.tint }}
          subtitle={header.subtitle}
          members={header.memberIds.map((id) => userAvatar(users[id]))}
          backHref={toastHeader ? "/home" : `/trips/${tripId}`}
          onTitlePress={toastHeader ? () => toastGo(baliToasts.tripPage) : undefined}
          onBoard={() => {
            if (toastHeader) toastGo(baliToasts.board);
            else if (sheet === "board") sheets.close();
            else sheets.open("board");
          }}
          onShare={() => sheets.open("share")}
        >
          <FactChipRow chips={chipData} />
        </ChatHeader>

        <MessageList bottomPadding={modes.bottomPadding} anchorRef={anchorRef}>
          {visible.map((m, i) => (
            <Fragment key={m.id}>
              {i === pillAt && pillNode}
              <MessageRenderer
                message={m}
                me={me}
                users={users}
                chat={chat}
                visaRows={visaRows}
                enter={!historyIds.has(m.id)}
                // F-travel.md §1.4: the row after the plan card clears its floating 🔥 chip.
                className={i > 0 && visible[i - 1].card?.kind === "plan" ? "mt-[26px]" : undefined}
                pressHandlers={pressHandlers}
                onPressStart={() => setHeldScrollKey(liveScrollKey)}
                onPressEnd={() => setHeldScrollKey(null)}
                actions={actions}
              />
            </Fragment>
          ))}
          {pillAt === visible.length && pillNode}
        </MessageList>

        {trayMode && target && targetUser ? (
          <ComposerTray
            mode={trayMode}
            banner={{
              title:
                trayMode === "reply"
                  ? chatCopy.tray.replyingTo(targetUser.firstName)
                  : chatCopy.tray.askGoAbout(targetUser.firstName),
              snippet: target.text ?? "",
              accent: trayMode === "reply" ? "go" : "ink",
            }}
            suggestions={trayMode === "askGo" ? target.askGoSuggestions : undefined}
            value={modes.trayDraft}
            onChange={modes.setTrayDraft}
            placeholder={
              trayMode === "reply" ? chatCopy.tray.replyPlaceholder(targetUser.firstName) : chatCopy.tray.askGoPlaceholder
            }
            onSend={modes.sendTray}
            onCancel={() => modes.setMode(null)}
          />
        ) : (
          <Composer
            value={modes.draft}
            onChange={modes.setDraft}
            onSend={modes.sendDraft}
            recording={modes.recording}
            onMic={modes.mic}
            attachOpen={modes.attachOpen}
            onAttachOpenChange={modes.onAttachOpenChange}
            onAttach={modes.attach}
          />
        )}

        {overlayTarget && targetUser && anchor?.id === overlayTarget.id && (
          <LongPressOverlay
            message={{
              id: overlayTarget.id,
              name: targetUser.firstName,
              text: overlayTarget.text ?? "",
              avatar: userAvatar(targetUser),
              maxWidth: overlayTarget.maxWidth,
            }}
            anchorRect={anchor.rect}
            onReact={(emoji) => {
              store().react(tripId, overlayTarget.id, emoji);
              modes.setMode(null);
              toastGo(chatCopy.toasts.reacted(emoji, targetUser.firstName));
            }}
            onMore={() => toastGo(chatCopy.toasts.emojiKeyboard)}
            onReply={() => modes.setMode("reply", overlayTarget.id)}
            onAskGo={() => modes.setMode("askGo", overlayTarget.id)}
            // The overlay has already copied the text and toasted "Message copied" (3A contract).
            onCopy={() => modes.setMode(null)}
            onClose={() => modes.setMode(null)}
          />
        )}
      </Screen>

      <QuickStartSheet
        open={sheet === "quickstart"}
        initial={{ answers: chat.quickStartAnswers, from: chat.fromCity ?? DEFAULT_CITY }}
        initialQuery={sheets.query}
        onDone={(answers, from) => {
          store().completeQuickStart(tripId, answers, from);
          sheets.close();
        }}
        onDismiss={() => {
          if (chat.quickStart === "pending") store().dismissQuickStart(tripId);
          sheets.close();
        }}
      />
      <FromCitySheet
        open={sheet === "from"}
        initialCity={chat.fromCity ?? DEFAULT_CITY}
        initialQuery={sheets.query}
        onSave={(city) => {
          store().setFromCity(tripId, city);
          sheets.close();
        }}
        onClose={sheets.close}
      />
      <PlaceDetailsSheet
        open={sheet === "place"}
        onOpenChange={closeOnFalse}
        place={place}
        voters={place?.voters ?? []}
        onVote={(id) => {
          store().votePlace(tripId, id);
          sheets.close();
        }}
      />
      <BudgetSheet
        open={sheet === "budget"}
        onOpenChange={closeOnFalse}
        lo={chat.budget.lo}
        hi={chat.budget.hi}
        saved={chat.budget.saved}
        onChange={(lo, hi) => store().setBudget(tripId, lo, hi)}
        onSave={() => {
          store().saveBudget(tripId);
          // G-bali.md §1.3: Bali saves and closes, with no stage change and no pill.
          if (toastHeader) sheets.close();
        }}
        next={budgetNext}
      />
      <StayDetailsSheet
        open={sheet === "stay"}
        onOpenChange={closeOnFalse}
        stay={stayDetails}
        subtitle={staySheet.subtitle}
        dates={staySheet.dates}
        onVote={(id) => {
          store().voteStay(tripId, id);
          sheets.close();
        }}
      />
      {payStay && (
        <PaySheet
          open={sheet === "pay"}
          onOpenChange={closeOnFalse}
          stay={payStay}
          summary={paySheet.summary}
          methods={paySheet.methods}
          split={paySheet.split}
          cta={paySheet.cta}
          trust={paySheet.trust}
          onPay={() => {
            sheets.close();
            store().payBooking(tripId);
          }}
        />
      )}
      <RouteSheet tripId={tripId} open={sheet === "route"} onOpenChange={closeOnFalse} />
      <CabSheet tripId={tripId} open={sheet === "cab"} onOpenChange={closeOnFalse} />
      <PrivateSheet
        open={sheet === "private"}
        onOpenChange={closeOnFalse}
        title={PRIVATE_COPY.title}
        sub={PRIVATE_COPY.sub}
        details={PRIVATE_DETAILS}
        ticketHref={`/trips/${tripId}/bookings/${PRIVATE_DETAILS.bookingId}/ticket`}
      />
      <VisaSheet
        open={sheet === "visa"}
        onOpenChange={closeOnFalse}
        copy={baliVisa.sheet}
        uploads={chat.visa.uploads}
        fields={chat.visa.fields}
        onUpload={(key) => store().setVisaUpload(tripId, key)}
        onFieldChange={(key, value) => store().setVisaField(tripId, key, value)}
        onSend={() => {
          store().sendVisa(tripId);
          sheets.close();
        }}
      />
      <BoardSheet tripId={tripId} open={sheet === "board"} onOpenChange={closeOnFalse} onAction={sheets.boardAction} />
      <ShareInviteSheet trip={trip} open={sheet === "share"} onOpenChange={closeOnFalse} />
    </>
  );
}
