import type { Attachment as ApiAttachment, Card, Id, Message, QuickReply } from "@/api/contract";
import type { Attachment, User } from "@/data/types";
import type { TripData } from "@/state/store";
import { userOf } from "@/state/view";

// The room (CONTRACT-APP §4.6): stored messages by `seq`, then my sends still on their way. Each becomes one row the
// thread draws: a system pill, a bubble (Go's, a member's, mine) with its attachments, and Go's card under it.

export interface RoomMessage {
  /** `message_id`, or the `client_message_id` of a send still on its way. */
  id: string;
  author: { kind: "go" } | { kind: "system" } | { kind: "person"; id: Id };
  mine: boolean;
  text: string;
  deleted: boolean;
  attachments: Attachment[];
  /** A shared place (1.1): drawn as a line with a map link. */
  location?: { label: string; href: string };
  quote?: { author: string; text: string };
  /** My message spoke to Go: the "Go" chip before the text. */
  mention: boolean;
  /** One chip under the bubble: my reaction when I have one, else the most used. */
  reaction?: { emoji: string; count: number };
  myReaction?: string;
  card?: Card;
  quickReplies: QuickReply[];
  /** Only on a send of mine that the Server has not stored yet. */
  sending?: { status: "sending" | "failed"; error?: string };
}

const isAudio = (a: Extract<ApiAttachment, { kind: "file" }>) => a.mime.startsWith("audio/") || (a.duration_s != null && !a.mime.startsWith("video/"));

/** Attachment links are signed and valid 1 hour, minted when the message is read (§4.5). */
function toAttachments(list: ApiAttachment[]): { attachments: Attachment[]; location?: RoomMessage["location"] } {
  const attachments: Attachment[] = [];
  let location: RoomMessage["location"];
  for (const a of list) {
    if (a.kind === "photo") attachments.push({ kind: "image", src: a.url, width: a.width ?? 4, height: a.height ?? 3 });
    else if (a.kind === "file") {
      if (isAudio(a)) attachments.push({ kind: "voice", seconds: a.duration_s ?? 0, src: a.url });
      else attachments.push({ kind: "file", name: a.name, size: a.size_bytes, src: a.url, mime: a.mime });
    } else if (a.kind === "location") {
      location = { label: a.name ?? a.address ?? "Shared location", href: `https://www.google.com/maps?q=${a.lat},${a.lng}` };
    }
  }
  return { attachments, location };
}

function reactionOf(message: Message, meId: Id): Pick<RoomMessage, "reaction" | "myReaction"> {
  if (message.reactions.length === 0) return {};
  const counts = new Map<string, number>();
  for (const r of message.reactions) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  const mine = message.reactions.find((r) => r.person_id === meId)?.emoji;
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const emoji = mine ?? top;
  return { reaction: { emoji, count: counts.get(emoji) ?? 1 }, ...(mine ? { myReaction: mine } : {}) };
}

/** What a quoted message says in one line. */
function previewOf(m: Message): string {
  if (m.deleted) return "Message deleted";
  if (m.text) return m.text;
  if (m.card) return m.card.fallback_text;
  const a = m.attachments[0];
  return a ? (a.kind === "photo" ? "Photo" : a.kind === "file" ? a.name : "Location") : "";
}

function authorName(m: Message, users: Record<Id, User>, meId: Id): string {
  if (m.author.kind === "go") return "Go";
  if (m.author.kind === "system") return "";
  return m.author.person_id === meId ? "You" : userOf(users, m.author.person_id).firstName;
}

export function buildRoom(data: TripData, users: Record<Id, User>, meId: Id): RoomMessage[] {
  const rows: RoomMessage[] = data.order.map((id) => {
    const m = data.messages[id];
    const quoted = data.messages[m.reply_to ?? m.about_message_id ?? ""];
    const mine = m.author.kind === "person" && m.author.person_id === meId;
    return {
      id: m.message_id,
      author: m.author.kind === "person" ? { kind: "person", id: m.author.person_id } : { kind: m.author.kind },
      mine,
      text: m.deleted ? "" : (m.text ?? ""),
      deleted: m.deleted,
      ...(m.deleted ? { attachments: [] } : toAttachments(m.attachments)),
      ...(quoted ? { quote: { author: authorName(quoted, users, meId), text: previewOf(quoted) } } : {}),
      mention: mine && m.mentions_go,
      ...reactionOf(m, meId),
      ...(m.card && !m.deleted ? { card: m.card } : {}),
      quickReplies: m.deleted ? [] : (m.quick_replies ?? []),
    };
  });

  for (const out of data.outbox) {
    // The stored copy is already in the thread (a live frame beat the POST's answer).
    if (out.echoedBy) continue;
    const quoted = data.messages[out.replyTo ?? out.aboutMessageId ?? ""];
    const a = out.attachment;
    rows.push({
      id: out.clientId,
      author: { kind: "person", id: meId },
      mine: true,
      text: out.text ?? "",
      deleted: false,
      attachments: a
        ? [
            a.kind === "photo"
              ? { kind: "image", src: a.previewUrl, width: a.width ?? 4, height: a.height ?? 3 }
              : a.kind === "audio"
                ? { kind: "voice", seconds: a.durationS ?? 0, src: a.previewUrl }
                : { kind: "file", name: a.name, size: a.sizeBytes, src: a.previewUrl, mime: a.mime },
          ]
        : [],
      ...(quoted ? { quote: { author: authorName(quoted, users, meId), text: previewOf(quoted) } } : {}),
      mention: Boolean(out.mentionsGo),
      quickReplies: [],
      sending: { status: out.status, error: out.error },
    });
  }
  return rows;
}
