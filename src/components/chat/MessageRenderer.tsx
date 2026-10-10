import { AttachmentContent, photoBubbleClass } from "./AttachmentContent";
import { cards as copy } from "@/data/seed/copy";
import type { Attachment, AvatarSpec, User } from "@/data/types";
import { cn } from "@/lib/utils";
import type { RoomMessage } from "@/state/roomView";
import { userOf } from "@/state/view";
import { Bubble } from "./Bubble";
import { CardView, type RoomActions, type RoomModel } from "./CardView";
import { QuickReplyBlock } from "./QuickReplyBlock";
import { SystemPill } from "./SystemPill";
import type { LongPressHandlers } from "./useLongPress";

// One row of the room (CONTRACT-APP §4.6): a system pill, Go's / a member's / my bubble with its attachments, Go's
// card under the text in the same message, and Go's quick replies under that. This file stays presentational:
// ChatScreen binds the callbacks to the Server and the sheets.

/** What a message row can fire besides its card's own actions. */
export interface MessageActions extends RoomActions {
  /** Tap on a photo or a file: opens it in the viewer. */
  openAttachment(attachment: Attachment): void;
  /** A quick-reply chip: sends its text as my own message. */
  quickReply(text: string): void;
  /** A send of mine that failed: try again with the same `client_message_id`. */
  retry(clientId: string): void;
}

// Same mount animation as Bubble's, for cards and pills appended after first render.
const enterClass =
  "transition-[opacity,translate] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0";

export function userAvatar(user: User): AvatarSpec {
  return { kind: "user", src: user.avatar, initials: user.initials, tone: user.tone };
}

type MessageRendererProps = {
  message: RoomMessage;
  room: RoomModel;
  /** Appended after first render: rise-in. */
  enter: boolean;
  /** Extra classes on the row wrapper. */
  className?: string;
  /** One shared `useLongPress` for every bubble; the target's `[data-msg-id]` names the message. */
  pressHandlers: LongPressHandlers;
  /** A press started / ended on a message row (ChatScreen holds auto-scroll while a press is armed). */
  onPressStart(): void;
  onPressEnd(): void;
  actions: MessageActions;
};

/** One thread row. Every row carries `data-message` so a deep link (`?focus=`) can scroll to it. */
export function MessageRenderer({ message: m, room, enter, className, pressHandlers, onPressStart, onPressEnd, actions }: MessageRendererProps) {
  const card = m.card ? (
    <div data-card={m.card.kind} className={cn("flex flex-col", enter && enterClass)}>
      <CardView card={m.card} room={room} actions={actions} />
    </div>
  ) : null;

  if (m.author.kind === "system") {
    return (
      <div data-message={m.id} className={cn("flex flex-col gap-2.5", enter && enterClass, className)}>
        {/* A person-opened poll is anchored on a system message whose text is the question: the card says it. */}
        {(!card || m.card?.kind !== "vote") && m.text && <SystemPill text={m.text} />}
        {card}
      </div>
    );
  }

  const isGo = m.author.kind === "go";
  const author = isGo ? "go" : m.mine ? "me" : "member";
  const user = m.author.kind === "person" ? userOf(room.users, m.author.id) : null;
  const who = user && !m.mine ? { name: user.firstName, avatar: userAvatar(user) } : {};
  // Every stored message with a bubble (a member's, mine, Go's) takes the long-press actions; deleted ones and sends
  // still in flight do not.
  const actionable = !m.deleted && !m.sending;
  const press = actionable ? pressHandlers : undefined;
  const text = m.deleted ? copy.message.deleted : m.text;
  // The reaction chips and the quote belong to the message: they sit on its last / first bubble.
  const bubbles = [...m.attachments.map((a) => ({ attachment: a })), ...(text || m.location ? [{ attachment: null }] : [])];

  const rows = bubbles.map((b, i) => {
    const last = i === bubbles.length - 1;
    return (
      <Bubble
        key={i}
        author={author}
        {...who}
        quote={i === 0 ? m.quote : undefined}
        // `[]`, not undefined, on the message's last bubble: it keeps the room for the pill, so a first reaction shifts nothing.
        reactions={last && !m.deleted ? (m.reactions ?? []) : undefined}
        enter={enter}
        pressHandlers={press}
        className={b.attachment?.kind === "image" ? photoBubbleClass : undefined}
        bodyClassName={m.deleted ? "text-muted italic" : undefined}
      >
        {b.attachment ? (
          <AttachmentContent attachment={b.attachment} onOpen={() => b.attachment && actions.openAttachment(b.attachment)} />
        ) : m.location ? (
          <span className="flex flex-col gap-1">
            {text && <span>{text}</span>}
            <a href={m.location.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
              📍 {m.location.label}
            </a>
          </span>
        ) : (
          text
        )}
      </Bubble>
    );
  });

  const sending = m.sending;
  const chipsHugBubble = bubbles.length > 0 && !card && sending?.status !== "failed" && !m.reactions?.length;
  return (
    <div
      data-message={m.id}
      // Long-press on a bubble opens the message actions. The wrapper names the message for the shared handler and the
      // overlay's anchor, and tells ChatScreen a press is armed.
      {...(actionable
        ? { "data-msg-id": m.id, onPointerDown: onPressStart, onPointerUp: onPressEnd, onPointerCancel: onPressEnd, onPointerLeave: onPressEnd }
        : {})}
      // Sending → stored is the same row (see `RoomMessage.key`): only the opacity changes, so it eases there.
      className={cn("flex flex-col gap-2.5 transition-opacity duration-220 ease-out", sending?.status === "sending" && "opacity-60", className)}
    >
      {rows}
      {sending?.status === "failed" && (
        <button type="button" className="self-end text-13 font-semibold text-danger" onClick={() => actions.retry(m.id)}>
          {sending.error ?? copy.message.sendFailed}
        </button>
      )}
      {card}
      {isGo && m.quickReplies.length > 0 && (
        // Chips belong to the bubble above them: pulled up over the reaction slot's 8px + the thread's 10px gap (to 12px),
        // unless a card or the retry line sits in between, or a reaction pill hangs there. They then get 18px, not 10px, before the next message.
        <div className={cn("mb-2 flex flex-col", chipsHugBubble && "-mt-1.5", enter && enterClass)}>
          <QuickReplyBlock
            chips={m.quickReplies.map((reply) => ({ label: reply.label, onPress: () => actions.quickReply(reply.text ?? reply.label) }))}
          />
        </div>
      )}
    </div>
  );
}
