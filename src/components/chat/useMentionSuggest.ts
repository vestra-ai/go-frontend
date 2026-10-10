"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { filterMentions, mentionQuery, type MentionItem } from "@/lib/mentions";

type MentionSuggestOptions = {
  value: string;
  onChange(value: string): void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Go and the people in the trip; none turns the list off. */
  items?: MentionItem[];
};

/**
 * The "@" list of a message input: typing "@" lists Go and the people in the trip, letters after it narrow the list,
 * and a pick writes "@Name " over what was typed. The input keeps the focus the whole time.
 */
export function useMentionSuggest({ value, onChange, inputRef, items = [] }: MentionSuggestOptions) {
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  // Escape closes the list for the "@" it was opened on.
  const [closedAt, setClosedAt] = useState<number | null>(null);

  const token = focused ? mentionQuery(value, caret) : null;
  if (!token && closedAt !== null) setClosedAt(null);
  const matches = token && token.start !== closedAt ? filterMentions(items, token.query) : [];
  const open = matches.length > 0;

  // The highlighted row goes back to the first one whenever the list changes.
  const listKey = token ? `${token.start}:${token.query}` : "";
  const [highlight, setHighlight] = useState({ key: listKey, index: 0 });
  if (highlight.key !== listKey) setHighlight({ key: listKey, index: 0 });
  const active = highlight.key === listKey ? Math.min(highlight.index, Math.max(matches.length - 1, 0)) : 0;

  // A pick rewrites the draft: the caret goes after the name once the new value is in the input.
  const caretAfterPick = useRef<number | null>(null);
  useLayoutEffect(() => {
    const at = caretAfterPick.current;
    if (at === null) return;
    caretAfterPick.current = null;
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(at, at);
  }, [value, inputRef]);

  function pick(item: MentionItem) {
    if (!token) return;
    const before = `${value.slice(0, token.start)}@${item.handle} `;
    caretAfterPick.current = before.length;
    setCaret(before.length);
    onChange(before + value.slice(caret).replace(/^\s/, ""));
  }

  /** True when the key was the list's (arrows, Enter / Tab to pick, Escape to close): the input does nothing more. */
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): boolean {
    if (!open || !token || e.nativeEvent.isComposing) return false;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const step = e.key === "ArrowDown" ? 1 : -1;
      setHighlight({ key: listKey, index: (active + step + matches.length) % matches.length });
    } else if (e.key === "Enter" || e.key === "Tab") {
      pick(matches[active]);
    } else if (e.key === "Escape") {
      setClosedAt(token.start);
    } else {
      return false;
    }
    e.preventDefault();
    return true;
  }

  return {
    open,
    matches,
    active,
    pick,
    onKeyDown,
    /** Spread on the input: they follow the caret and the focus. */
    inputProps: {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setCaret(e.target.selectionStart ?? e.target.value.length);
        onChange(e.target.value);
      },
      onSelect: (e: React.SyntheticEvent<HTMLInputElement>) => setCaret(e.currentTarget.selectionStart ?? 0),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
  };
}
