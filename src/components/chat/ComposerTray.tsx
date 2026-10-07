"use client";

import { useEffect, useId, useRef } from "react";
import { ArrowRight, X } from "@/components/icons/generated";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { chat as copy } from "@/data/seed/copy";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

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
};

/** White reply / ask-Go tray that replaces the composer (D2/D3). No + and no mic. */
export function ComposerTray({ mode, banner, suggestions, value, onChange, placeholder, onSend, onCancel }: ComposerTrayProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the tray opens (or switches mode), caret after any prefilled draft.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [mode]);

  const send = () => onSend(value.trim());

  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 rounded-t-6xl bg-white px-4 pt-2.5 pb-safe shadow-tray">
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
        <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-none">
          {suggestions.map((s) => (
            <Chip key={s} type="button" size="xs" variant="outline" className="shrink-0" onClick={() => onChange(s)}>
              {s}
            </Chip>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <label htmlFor={inputId} className="min-w-0 flex-1">
          <span className="sr-only">{placeholder}</span>
          <Input
            ref={inputRef}
            id={inputId}
            type="text"
            shape="pill-grey"
            autoComplete="off"
            enterKeyHint="send"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
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
  );
}
