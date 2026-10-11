"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Card as ApiCard, Features, NeedsYouItem, TripView } from "@/api/contract";
import { errorMessage } from "@/api/http";
import { CardView, type RoomActions, type RoomModel } from "@/components/chat/CardView";
import { RoomUsersProvider } from "@/components/chat/RoomContext";
import { AvatarStack } from "@/components/common/AvatarStack";
import { Eyebrow } from "@/components/common/Eyebrow";
import { Spinner } from "@/components/icons/custom/Spinner";
import { GoPageSheet } from "@/components/sheets/GoPageSheet";
import { offers, useCardTap, type GoPage } from "@/components/sheets/useCardTap";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cards as cardCopy, polls, tripHome } from "@/data/seed/copy";
import type { TripId } from "@/data/types";
import { stackAvatar } from "@/lib/avatars";
import { toastGo } from "@/lib/toast";
import { answerMandate, castVote, loadDecision, loadGoCards, loadRecord, retractVote, type TripData } from "@/state";
import { toUser, userOf, usersById } from "@/state/view";

const copy = tripHome.pending;

type PendingSheetProps = {
  tripId: TripId;
  view: TripView;
  data: TripData;
  features: Features | undefined;
  /** The row that was tapped, kept by the caller while the sheet animates out. */
  item: NeedsYouItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Record" on a settle-up card inside the sheet: the caller swaps to its Record a payment sheet. */
  onRecord: RoomActions["openRecord"];
};

/**
 * What a "Pending on you" row opens (CONTRACT-APP §4.2): the item's own card, the same one the chat draws, to act on
 * without leaving the page. A vote or a mandate is read from `GET …/decisions/:id`, one of Go's cards from
 * `GET …/cards`, an open line from `GET …/record`. Anything a card needs the room for (an option's Details, Go's
 * screen, the flights sheet) opens the chat at that message.
 */
export function PendingSheet({ tripId, view, data, features, item, open, onOpenChange, onRecord }: PendingSheetProps) {
  const router = useRouter();
  const users = usersById(view.people);
  const me = toUser(view.me.person);
  const room: RoomModel = { tripId, view, data, users, me, features };

  const kind = item?.kind;
  const decisionId = item?.target.decision_id ?? null;
  const cardId = item?.target.card_id ?? null;
  // Read what the item is about each time it opens; what is already held shows meanwhile.
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open || !kind) return;
    const read =
      (kind === "vote" || kind === "mandate") && decisionId
        ? loadDecision(tripId, decisionId)
        : kind === "card" && cardId
          ? loadGoCards(tripId, cardId)
          : kind === "record_line"
            ? loadRecord(tripId)
            : null;
    if (!read) return;
    let current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the read starts here, with the sheet
    setLoading(true);
    read.catch(() => {}).finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [open, kind, decisionId, cardId, tripId]);

  const toChat = () => {
    const at = item?.target.message_id ? `?focus=${encodeURIComponent(item.target.message_id)}` : "";
    router.push(`/trips/${tripId}/chat${at}`);
  };

  // A page Go answers a tap with (its login view) is framed over this sheet; a `go://` sheet of the room opens the chat.
  const [page, setPage] = useState<GoPage | null>(null);
  const [pageOpen, setPageOpen] = useState(false);
  const cardTap = useCardTap(tripId, toChat, (opened) => {
    setPage(opened);
    setPageOpen(true);
  }, (opened) => offers(data.goCards[opened.cardId]?.card, opened.actionId, me.id));

  const fail = (fallback: string) => (err: unknown) => toastGo(errorMessage(err, fallback));
  const actions: RoomActions = {
    vote: (id, index) => void (index === null ? retractVote(tripId, id) : castVote(tripId, id, { option_index: index })).catch(fail(polls.failed)),
    flexible: (id) => {
      const mine = data.myVotes[id];
      const isFlexible = Boolean(mine && "flexible" in mine);
      if (isFlexible && !features?.vote_retract) return;
      void (isFlexible ? retractVote(tripId, id) : castVote(tripId, id, { flexible: true })).catch(fail(polls.failed));
    },
    mandate: (id, answer) => void answerMandate(tripId, id, answer).catch(fail(cardCopy.mandate.failed)),
    tap: (id, actionId, opts) => void cardTap.tap(id, actionId, opts),
    // After the login page closes itself, Go takes a few seconds to replace the card: its button waits meanwhile.
    pending: cardTap.pending ?? cardTap.settling,
    openOption: toChat,
    openRoute: toChat,
    openCab: toChat,
    openRecord: onRecord,
    openRecording: toChat,
    openLive: toChat,
    openBooking: toChat,
  };

  // The card to draw: the Server's own row for a vote or a mandate, Go's card as it stands now for the rest.
  const base = { card_id: cardId ?? item?.item_id ?? "", fallback_text: item?.title ?? "" };
  const card: ApiCard | null =
    kind === "vote" && decisionId
      ? { ...base, kind: "vote", decision_id: decisionId }
      : kind === "mandate" && decisionId
        ? { ...base, kind: "mandate", decision_id: decisionId }
        : kind === "card" && cardId
          ? (data.goCards[cardId]?.card ?? null)
          : null;
  const line = kind === "record_line" ? view.record.find((l) => l.line_id === item?.target.line_id) : undefined;
  const people = (line?.person_ids ?? []).map((id) => userOf(users, id));
  const nothing = !card && !line;

  return (
    <RoomUsersProvider value={users}>
      <BottomSheet open={open} onOpenChange={onOpenChange} aria-label={item?.title}>
        <SheetBody className="gap-3 pb-[104px]">
          <SheetHeader title={item?.title ?? ""} subtitle={item?.subtitle ?? undefined} />
          {/* Chat cards sit 38px in, on the bubble column beside Go's avatar. There is no avatar here, so take it back. */}
          {card && (
            <div className="-ml-[38px]">
              <CardView card={card} room={room} actions={actions} />
            </div>
          )}
          {line && (
            <Card variant="outline" radius="2xl" className="flex flex-col gap-2 px-4 py-3.5">
              <Eyebrow>{copy.line.eyebrow}</Eyebrow>
              <span className="text-16 leading-[1.35] font-semibold tracking-body wrap-anywhere">{line.text}</span>
              {people.length > 0 && (
                <span className="flex items-center gap-2 text-13 tracking-caption text-muted">
                  <AvatarStack avatars={people.map(stackAvatar)} size={20} overlap={6} ring="white" max={4} />
                  {copy.line.who(people.map((p) => (p.id === me.id ? "you" : p.firstName)))}
                </span>
              )}
            </Card>
          )}
          {nothing &&
            (loading ? (
              <span role="status" className="flex items-center justify-center gap-2 py-6 text-15 text-muted">
                <Spinner className="size-5 border-ink/15 border-t-ink border-r-ink" />
                {copy.loading}
              </span>
            ) : (
              <p className="py-6 text-center text-15 text-muted">{copy.gone}</p>
            ))}
        </SheetBody>
        <SheetFooter>
          <Button type="button" variant="link" className="h-11 text-16" onClick={toChat}>
            {copy.openChat}
          </Button>
        </SheetFooter>
      </BottomSheet>
      <GoPageSheet open={pageOpen} onOpenChange={setPageOpen} url={page?.url ?? null} title={item?.title ?? ""} onEnded={() => page && cardTap.pageEnded(page)} />
    </RoomUsersProvider>
  );
}
