"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, X } from "@/components/icons/generated";
import { StickyDock } from "@/components/shell/StickyDock";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { chat as copy } from "@/data/seed/copy";
import { assets } from "@/lib/assets";
import { focusAtEndAboveKeyboard } from "@/lib/focus";
import type { MentionItem } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { MentionInput } from "./MentionInput";
import { MentionSuggestions } from "./MentionSuggestions";
import { useMentionSuggest } from "./useMentionSuggest";

type ComposerTrayProps = {
  mode: "reply" | "askGo";
  /** title "Replying to Arjun" / "Ask Go about Arjun’s message"; snippet = the target text. */
  banner: { title: string; snippet: string; accent: "go" | "ink" };
  /** Ask Go: tap replaces the draft, never sends. */
  suggestions?: string[];
  value: string;
  onChange(v: string): void;
  placeholder: string;
  /** Trimmed; the caller decides what '' means (reply: nothing, ask Go: advance). */
  onSend(text: string): void;
  onCancel(): void;
  /** Go and the people in the trip: what typing "@" lists. */
  mentionItems?: MentionItem[];
};

/** White reply / ask-Go tray that replaces the composer (D2/D3). No + and no mic. */
export function ComposerTray({ mode, banner, suggestions, value, onChange, placeholder, onSend, onCancel, mentionItems }: ComposerTrayProps) {
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const mentions = useMentionSuggest({ value, onChange, inputRef, items: mentionItems });

  // Focus the input when the tray opens (or switches mode) and when a suggestion chip writes the draft, caret after the
  // words. A swipe on a message opens the tray with the finger elsewhere: the tray is then kept above the keyboard.
  const trayRef = useRef<HTMLDivElement>(null);
  const [suggested, setSuggested] = useState(0);
  useEffect(() => {
    if (inputRef.current && trayRef.current) return focusAtEndAboveKeyboard(inputRef.current, trayRef.current);
  }, [mode, suggested]);

  const send = () => onSend(value.trim());
  const suggest = (text: string) => {
    onChange(text);
    setSuggested((n) => n + 1);
  };

  return (
    <StickyDock>
      <div ref={trayRef} className="absolute inset-x-0 bottom-0 flex flex-col gap-2 rounded-t-6xl bg-white px-4 pt-2.5 pb-safe shadow-tray">
        {mentions.open && (
          <MentionSuggestions id={listId} items={mentions.matches} active={mentions.active} onPick={mentions.pick} className="inset-x-4 bottom-full mb-2" />
        )}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border-l-[3px] bg-surface-2 py-2 pr-2 pl-3",
            banner.accent === "go" ? "border-go" : "border-ink",
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <span
              className={cn(
                "text-13 font-bold",
                banner.accent === "go" ? "text-go" : "text-ink",
                mode === "askGo" && "inline-flex items-center gap-1.5",
              )}
            >
              {mode === "askGo" && <Avatar kind="go" size={18} src={assets.goAvatar.src} />}
              {banner.title}
            </span>
            <span className="truncate text-14 text-muted">{banner.snippet}</span>
          </div>
          <Button type="button" variant="ghost" size="icon-2xs" className="text-muted" aria-label={copy.tray.cancel} onClick={onCancel}>
            <X className="size-3.5" />
          </Button>
        </div>

        {mode === "askGo" && suggestions && suggestions.length > 0 && (
          <div className="-mx-4 flex gap-1.5 overflow-x-auto overscroll-x-contain px-4 scrollbar-none">
            {suggestions.map((s) => (
              <Chip key={s} type="button" size="xs" variant="outline" className="shrink-0" onClick={() => suggest(s)}>
                {s}
              </Chip>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <label htmlFor={inputId} className="min-w-0 flex-1">
            <span className="sr-only">{placeholder}</span>
            <MentionInput
              inputRef={inputRef}
              id={inputId}
              type="text"
              shape="pill-grey"
              autoComplete="off"
              enterKeyHint="send"
              placeholder={placeholder}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={mentions.open}
              aria-controls={mentions.open ? listId : undefined}
              aria-activedescendant={mentions.open ? `${listId}-${mentions.active}` : undefined}
              value={value}
              {...mentions.inputProps}
              onKeyDown={(e) => {
                if (mentions.onKeyDown(e)) return;
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                send();
              }}
            />
          </label>
          <Button type="button" variant="primary" size="icon-lg" aria-label={copy.composer.send} onClick={send}>
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </StickyDock>
  );
}
