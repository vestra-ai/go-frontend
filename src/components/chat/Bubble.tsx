import type { ReactNode, Ref } from "react";
import { ReactionChip } from "@/components/common/ReactionChip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { chat as copy } from "@/data/seed/copy";
import type { AvatarSpec, BubbleMaxWidth } from "@/data/types";
import { assets } from "@/lib/assets";
import { splitMentions } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { QuoteBlock } from "./QuoteBlock";
import { useMentionHandles } from "./RoomContext";
import type { LongPressHandlers } from "./useLongPress";

type Author = "go" | "member" | "me";

// Static map: never build class names from template strings.
const maxWidthClass: Record<BubbleMaxWidth, string> = {
  64: "max-w-[64%]",
  70: "max-w-[70%]",
  72: "max-w-[72%]",
  76: "max-w-[76%]",
  78: "max-w-[78%]",
  80: "max-w-[80%]",
};

const defaultMaxWidth: Record<Author, BubbleMaxWidth> = { go: 76, member: 72, me: 78 };

// DESIGN-ASSUMPTION (PLAN §12.1 #8): one metric set for every incoming bubble (8/14/10, gap 2, shadow),
// including the dynamic Go ack; mine is 10/14, gap 4, no shadow.
const bubbleClass: Record<Author, string> = {
  go: "rounded-bl-none bg-go-soft px-3.5 pt-2 pb-2.5 gap-0.5 shadow-bubble",
  member: "rounded-bl-none bg-white px-3.5 pt-2 pb-2.5 gap-0.5 shadow-bubble",
  me: "rounded-br-none bg-mine px-3.5 py-2.5 gap-1 text-ink",
};

/** How many distinct emoji the reaction pill shows side by side (WhatsApp shows three); the count after them is the total. */
const PILL_EMOJI = 3;

const enterClass =
  "transition-[opacity,translate] duration-220 ease-out starting:translate-y-1.5 starting:opacity-0";

type BubbleProps = {
  author: Author;
  /** Member first name (Go's label comes from copy; mine has none). */
  name?: string;
  /** Go / member, rendered at 30px. Go defaults to the Go avatar; ignored for me. */
  avatar?: AvatarSpec;
  /** Default: member 72 · go 76 · me 78. */
  maxWidth?: BubbleMaxWidth;
  /** QuoteBlock above the text: the message this one replies to, or asks Go about. */
  quote?: { author: string; text: string };
  /** One entry per emoji, most used first (`RoomMessage.reactions`); drawn as one pill under the bubble. */
  reactions?: { emoji: string; count: number; mine: boolean }[];
  /** Extra rows after the body (GoBubble CTA / caption). */
  footer?: ReactNode;
  /** Mount animation; true only for messages appended after first render. */
  enter?: boolean;
  /** LongPressOverlay copy: scale 1.03 from the side the bubble sits on. */
  lifted?: boolean;
  bubbleRef?: Ref<HTMLDivElement>;
  /** `useLongPress` handlers (members', mine and Go's text bubbles); makes the bubble a focusable button that opens the actions dialog. */
  pressHandlers?: LongPressHandlers;
  /** Overrides on the bubble element (GoBubble's CTA padding). */
  className?: string;
  /** Overrides on the text body. */
  bodyClassName?: string;
  /** Text: "\n" breaks, "**x**" bold, "@Go" / "@Priya" highlighted. Non-string children render as-is. */
  children: ReactNode;
};

/** "@Go" and the "@Name" of anyone in the trip, in the Go accent; the rest as it is. */
function withMentions(text: string, handles: string[]): ReactNode {
  const parts = splitMentions(text, handles);
  if (parts.length === 1 && typeof parts[0] === "string") return text;
  return parts.map((part, i) => (typeof part === "string" ? part : <span key={i} className="font-semibold text-go">{part.mention}</span>));
}

/** Seed text format (E-deciding.md §1.2): `\n` is a line break (whitespace-pre-line), `**x**` is bold. */
function richText(text: string, handles: string[]): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return withMentions(text, handles);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-bold">{withMentions(part, handles)}</strong> : <span key={i}>{withMentions(part, handles)}</span>,
  );
}

function bubbleAvatar(spec: AvatarSpec): ReactNode {
  if (spec.kind === "go") return <Avatar kind="go" size={30} src={assets.goAvatar.src} />;
  return (
    <Avatar size={30} tone={spec.tone} src={spec.src}>
      <AvatarFallback>{spec.initials}</AvatarFallback>
    </Avatar>
  );
}

/** A chat message bubble (C-chat-kickoff.md §1.2). Go is peach, members white, mine periwinkle. */
export function Bubble({
  author,
  name,
  avatar,
  maxWidth,
  quote,
  reactions,
  footer,
  enter = false,
  lifted = false,
  bubbleRef,
  pressHandlers,
  className,
  bodyClassName,
  children,
}: BubbleProps) {
  const isMe = author === "me";
  const handles = useMentionHandles();
  const content = typeof children === "string" ? richText(children, handles) : children;
  const label = author === "go" ? copy.goName : author === "member" ? name : undefined;
  const avatarSpec: AvatarSpec | undefined = isMe ? undefined : (avatar ?? (author === "go" ? { kind: "go" } : undefined));
  const pressable = pressHandlers;
  const reactionTotal = reactions?.reduce((n, r) => n + r.count, 0) ?? 0;

  const bubble = (
    <div
      ref={bubbleRef}
      className={cn(
        // wrap-anywhere (not break-words): a long unbroken string must also lower the column's min-content width, or the bubble outgrows its max-width.
        "flex flex-col rounded-5xl wrap-anywhere",
        bubbleClass[author],
        pressable && "select-none [-webkit-touch-callout:none]",
        className,
      )}
      {...(pressable ? { role: "button", tabIndex: 0, "aria-haspopup": "dialog" as const, ...pressHandlers } : {})}
    >
      {label && (
        <span
          className={cn(
            "text-13 leading-[1.35] font-semibold tracking-caption",
            author === "go" ? "text-go" : "text-muted",
          )}
        >
          {label}
        </span>
      )}
      {quote && <QuoteBlock author={quote.author} text={quote.text} />}
      <div className={cn("text-16 leading-[1.4] tracking-body text-pretty whitespace-pre-line", bodyClassName)}>
        {content}
      </div>
      {footer}
    </div>
  );

  // The max-width sits on a column that also holds the reaction chips, overlapping the bubble's bottom edge by 6px.
  const column = (
    <div className={cn("flex flex-col", isMe ? "items-end" : "items-start", maxWidthClass[maxWidth ?? defaultMaxWidth[author]])}>
      {bubble}
      {reactions && reactions.length > 0 && (
        <ReactionChip
          emoji={reactions.slice(0, PILL_EMOJI).map((r) => r.emoji)}
          // Like WhatsApp: no number for a lone reaction, else the total across every emoji.
          count={reactionTotal > 1 ? reactionTotal : undefined}
          mine={reactions.some((r) => r.mine)}
          label={reactions.map((r) => `${r.emoji} ${r.count}`).join(", ")}
          className={cn("relative -mt-1.5", isMe ? "mr-2.5" : "ml-2.5", enterClass)}
        />
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex",
        isMe ? "justify-end" : "items-end gap-2",
        enter && enterClass,
        lifted && (isMe ? "origin-right" : "origin-left") + " scale-[1.03]",
      )}
    >
      {avatarSpec && bubbleAvatar(avatarSpec)}
      {column}
    </div>
  );
}
