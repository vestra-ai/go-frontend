"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MenuItem } from "@/components/common/MenuItem";
import { Copy, Reply } from "@/components/icons/generated";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { chat as copy } from "@/data/seed/copy";
import type { Attachment, AvatarSpec, BubbleMaxWidth, FrameRect } from "@/data/types";
import { MENU_EXIT_MS } from "@/data/timing";
import { assets } from "@/lib/assets";
import { toastGo } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { AttachmentContent, photoBubbleClass } from "./AttachmentContent";
import { Bubble } from "./Bubble";

type LongPressOverlayProps = {
  /**
   * `author`: a member and Go sit on the left (`name` / `avatar` are the member's; Go brings its own), mine on the right
   * with neither. `attachments` / `location` are drawn as the thread draws them (not tappable here); a message with no
   * text has nothing to copy, so the menu leaves Copy out.
   */
  message: {
    id: string;
    author: "member" | "go" | "me";
    name?: string;
    text: string;
    avatar?: AvatarSpec;
    maxWidth?: BubbleMaxWidth;
    attachments?: Attachment[];
    location?: { label: string };
  };
  /** Rect of the pressed bubble row, relative to #app-frame's top-left (page coordinates). */
  anchorRect: FrameRect;
  /** The emoji I have on this message, marked in the bar (tapping it again takes it back). */
  myReaction?: string;
  /** Every callback below runs once the overlay's exit animation has played (`MENU_EXIT_MS`); each one closes the overlay. */
  onReact(emoji: string): void;
  onReply(): void;
  onAskGo(): void;
  /** Called after the overlay has copied the text and shown "Message copied"; close it here. */
  onCopy(): void;
  /** Backdrop tap or Escape. */
  onClose(): void;
};

/** The browser's own menu (right-click / touch-hold) never shows over the message actions. */
const suppressContextMenu = (e: React.MouseEvent) => e.preventDefault();

const EDGE = 16; // the column stays at least this far inside the frame
const BAR_OFFSET = 60; // reaction bar 50 + gap 10, so the lifted bubble lands on the real one

/**
 * D1 message actions: blurred scrim, reaction bar, the lifted bubble at its real position, Reply / Ask Go / Copy.
 * DESIGN-ASSUMPTION (PLAN §12.1 #10): anchored to the pressed bubble instead of the design's fixed top 300.
 * Render inside the chat Screen (positioned, page-sized: it scrolls with the thread). The scrim fades in and the column
 * eases up from the side the bubble sits on; any way out plays that backwards before the parent closes it.
 */
export function LongPressOverlay({ message, anchorRect, myReaction, onReact, onReply, onAskGo, onCopy, onClose }: LongPressOverlayProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const firstReactionRef = useRef<HTMLButtonElement>(null);
  const top = anchorRect.top - BAR_OFFSET;

  // Exit: the parent unmounts the overlay as soon as it is told to close, so it is told after the fade, once.
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const exitTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(exitTimer.current), []);
  const leave = useCallback((then: () => void) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    exitTimer.current = window.setTimeout(then, MENU_EXIT_MS);
  }, []);

  // Clamp against the bottom once the column's height is known (the top clamp is applied at render).
  useLayoutEffect(() => {
    const column = columnRef.current;
    const frameHeight = (column?.offsetParent as HTMLElement | null)?.clientHeight;
    if (!column || !frameHeight) return;
    const maxTop = frameHeight - EDGE - column.offsetHeight;
    column.style.top = `${Math.max(EDGE, Math.min(top, maxTop))}px`;
  }, [top]);

  useEffect(() => {
    window.getSelection()?.removeAllRanges(); // the press itself may have selected a word before the overlay opened
    firstReactionRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") leave(onClose);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [leave, onClose]);

  const attachments = message.attachments ?? [];
  const hasText = message.text.trim() !== "";
  const mine = message.author === "me";
  const bubble = { author: message.author, name: message.name, avatar: message.avatar, maxWidth: message.maxWidth, lifted: true } as const;

  function copyText() {
    // Go writes `**bold**`; the bubble shows it bold, so what is copied has no markers.
    void navigator.clipboard?.writeText(message.text.replace(/\*\*(.+?)\*\*/g, "$1")).catch(() => {
      // Clipboard can be blocked (permissions, insecure context); the toast still confirms the tap.
    });
    toastGo(copy.toasts.copied);
    leave(onCopy);
  }

  return (
    <>
      <button
        type="button"
        aria-label={copy.longPress.close}
        className={cn(
          "absolute inset-0 z-40 cursor-default bg-scrim-strong backdrop-blur-[6px] transition-opacity ease-out starting:opacity-0",
          leaving ? "opacity-0 duration-150" : "duration-220",
        )}
        onClick={() => leave(onClose)}
        onContextMenu={suppressContextMenu}
      />
      <div
        ref={columnRef}
        role="dialog"
        aria-label={copy.longPress.dialogLabel}
        // The column spans the frame, so its empty sides and gaps must not eat taps meant for the backdrop: only the
        // reaction bar and the menu take pointer events; a tap anywhere else (the lifted copy included) closes.
        // Unselectable: the overlay opens under the still-held finger, which would otherwise select the word there.
        className={cn(
          "pointer-events-none absolute inset-x-4 z-[41] flex flex-col gap-2.5 select-none [-webkit-touch-callout:none]",
          "transition-[opacity,scale] ease-out starting:scale-95 starting:opacity-0",
          mine ? "origin-top-right" : "origin-top-left",
          leaving ? "scale-95 opacity-0 duration-150" : "duration-220",
        )}
        style={{ top: Math.max(EDGE, top) }}
        // The press that opened the overlay is still down under it: its context-menu event now lands here, not on the bubble.
        onContextMenu={suppressContextMenu}
      >
        <div
          className={cn(
            "pointer-events-auto flex gap-0.5 rounded-full bg-white px-1.5 py-1 shadow-menu",
            mine ? "self-end" : "ml-[30px] self-start",
          )}
        >
          {copy.longPress.reactions.map((emoji, i) => (
            <Button
              key={emoji}
              ref={i === 0 ? firstReactionRef : undefined}
              type="button"
              variant={emoji === myReaction ? "soft" : "ghost"}
              size="icon"
              className="size-[42px] text-24"
              aria-label={copy.longPress.react(emoji)}
              aria-pressed={emoji === myReaction}
              onClick={() => leave(() => onReact(emoji))}
            >
              {emoji}
            </Button>
          ))}
        </div>

        {attachments.map((a, i) => (
          <Bubble key={i} {...bubble} className={a.kind === "image" ? photoBubbleClass : undefined}>
            <AttachmentContent attachment={a} />
          </Bubble>
        ))}
        {(hasText || message.location || attachments.length === 0) && (
          <Bubble {...bubble}>
            {message.location ? (
              <span className="flex flex-col gap-1">
                {hasText && <span>{message.text}</span>}
                <span className="font-semibold underline underline-offset-2">📍 {message.location.label}</span>
              </span>
            ) : (
              message.text
            )}
          </Bubble>
        )}

        <div className={cn("pointer-events-auto w-[230px] overflow-hidden rounded-4xl bg-white shadow-menu", mine ? "self-end" : "ml-[38px]")}>
          <MenuItem variant="wide" label={copy.longPress.reply} icon={<Reply className="size-[18px]" />} onClick={() => leave(onReply)} />
          <MenuItem
            variant="wide"
            label={copy.longPress.askGo}
            icon={<Avatar kind="go" size={22} src={assets.goAvatar.src} />}
            onClick={() => leave(onAskGo)}
          />
          {hasText && <MenuItem variant="wide" label={copy.longPress.copy} icon={<Copy className="size-[18px]" />} onClick={copyText} />}
        </div>
      </div>
    </>
  );
}
