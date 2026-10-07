"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { MenuItem } from "@/components/common/MenuItem";
import { Copy, Plus, Reply } from "@/components/icons/generated";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { chat as copy } from "@/data/seed/copy";
import type { AvatarSpec, BubbleMaxWidth, FrameRect } from "@/data/types";
import { assets } from "@/lib/assets";
import { toastGo } from "@/lib/toast";
import { Bubble } from "./Bubble";

type LongPressOverlayProps = {
  message: { id: string; name: string; text: string; avatar: AvatarSpec; maxWidth?: BubbleMaxWidth };
  /** Rect of the pressed bubble row, relative to #app-frame. */
  anchorRect: FrameRect;
  onReact(emoji: string): void;
  /** "More reactions"; the overlay stays open. */
  onMore(): void;
  onReply(): void;
  onAskGo(): void;
  /** Called after the overlay has copied the text and shown "Message copied"; close it here. */
  onCopy(): void;
  /** Backdrop tap or Escape. */
  onClose(): void;
};

const EDGE = 16; // the column stays at least this far inside the frame
const BAR_OFFSET = 60; // reaction bar 50 + gap 10, so the lifted bubble lands on the real one

/**
 * D1 message actions: blurred scrim, reaction bar, the lifted bubble at its real position, Reply / Ask Go / Copy.
 * DESIGN-ASSUMPTION (PLAN §12.1 #10): anchored to the pressed bubble instead of the design's fixed top 300.
 * Render inside the chat Screen (positioned, frame-sized). No enter animation (as designed).
 */
export function LongPressOverlay({ message, anchorRect, onReact, onMore, onReply, onAskGo, onCopy, onClose }: LongPressOverlayProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const firstReactionRef = useRef<HTMLButtonElement>(null);
  const top = anchorRect.top - BAR_OFFSET;

  // Clamp against the bottom once the column's height is known (the top clamp is applied at render).
  useLayoutEffect(() => {
    const column = columnRef.current;
    const frameHeight = (column?.offsetParent as HTMLElement | null)?.clientHeight;
    if (!column || !frameHeight) return;
    const maxTop = frameHeight - EDGE - column.offsetHeight;
    column.style.top = `${Math.max(EDGE, Math.min(top, maxTop))}px`;
  }, [top]);

  useEffect(() => {
    firstReactionRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function copyText() {
    void navigator.clipboard?.writeText(message.text).catch(() => {
      // Clipboard can be blocked (permissions, insecure context); the toast still confirms the tap.
    });
    toastGo(copy.toasts.copied);
    onCopy();
  }

  return (
    <>
      <button
        type="button"
        aria-label={copy.longPress.close}
        className="absolute inset-0 z-[5] cursor-default bg-scrim-strong backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        ref={columnRef}
        role="dialog"
        aria-label={copy.longPress.dialogLabel}
        className="absolute inset-x-4 z-[6] flex flex-col gap-2.5"
        style={{ top: Math.max(EDGE, top) }}
      >
        <div className="ml-[30px] flex gap-0.5 self-start rounded-full bg-white px-1.5 py-1 shadow-menu">
          {copy.longPress.reactions.map((emoji, i) => (
            <Button
              key={emoji}
              ref={i === 0 ? firstReactionRef : undefined}
              type="button"
              variant="ghost"
              size="icon"
              className="size-[42px] text-24"
              aria-label={copy.longPress.react(emoji)}
              onClick={() => onReact(emoji)}
            >
              {emoji}
            </Button>
          ))}
          <Button type="button" variant="soft" size="icon" className="size-[42px] text-muted" aria-label={copy.longPress.more} onClick={onMore}>
            <Plus className="size-[18px]" />
          </Button>
        </div>

        <Bubble author="member" name={message.name} avatar={message.avatar} maxWidth={message.maxWidth} lifted>
          {message.text}
        </Bubble>

        <div className="ml-[38px] w-[230px] overflow-hidden rounded-4xl bg-white shadow-menu">
          <MenuItem variant="wide" label={copy.longPress.reply} icon={<Reply className="size-[18px]" />} onClick={onReply} />
          <MenuItem
            variant="wide"
            label={copy.longPress.askGo}
            icon={<Avatar kind="go" size={22} src={assets.goAvatar.src} />}
            onClick={onAskGo}
          />
          <MenuItem variant="wide" label={copy.longPress.copy} icon={<Copy className="size-[18px]" />} onClick={copyText} />
        </div>
      </div>
    </>
  );
}
