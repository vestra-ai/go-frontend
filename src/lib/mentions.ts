import type { User } from "@/data/types";

// @-mentions in the room (CONTRACT-APP §4.6). The text carries "@Priya"; a send lists the people it names in
// `mentions`, and the Server sets `mentions_go` itself when the text has "@Go".

export const GO_HANDLE = "Go";

/** §4.6: at most 30 ids in `mentions`. */
const MAX_MENTIONS = 30;

export interface MentionHandle {
  user: User;
  /** What follows the "@": the first name, or the full name when a first name is shared (or is "Go"). */
  handle: string;
}

/** A row of the composer's list: Go, or a person in the trip. */
export type MentionItem = { id: string; name: string; handle: string; user?: User };

export const GO_MENTION: MentionItem = { id: "go", name: GO_HANDLE, handle: GO_HANDLE };

export function mentionHandles(people: User[]): MentionHandle[] {
  const shared = new Map<string, number>();
  for (const p of people) shared.set(p.firstName.toLowerCase(), (shared.get(p.firstName.toLowerCase()) ?? 0) + 1);
  return people
    .filter((user) => user.name.trim())
    .map((user) => {
      const first = user.firstName.toLowerCase();
      const own = first && shared.get(first) === 1 && first !== GO_HANDLE.toLowerCase();
      return { user, handle: own ? user.firstName : user.name };
    });
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// One compiled pattern per set of handles: every bubble of a render asks with the same set.
let compiled: { key: string; pattern: RegExp } | null = null;

/** "@Handle" that starts a word and ends one: "hi @go," yes, "me@go.com" and "@gopal" no. */
function patternFor(handles: string[]): RegExp {
  const key = handles.join("\n");
  if (compiled?.key !== key) {
    const names = [GO_HANDLE, ...handles].sort((a, b) => b.length - a.length).map(escape);
    compiled = { key, pattern: new RegExp(`(^|[^\\p{L}\\p{N}_@])@(${names.join("|")})(?![\\p{L}\\p{N}_])`, "giu") };
  }
  compiled.pattern.lastIndex = 0;
  return compiled.pattern;
}

/** The text cut at its mentions: plain strings, and `{ mention: "@Priya" }` as it was typed. */
export function splitMentions(text: string, handles: string[]): Array<string | { mention: string }> {
  if (!text.includes("@")) return [text];
  const pattern = patternFor(handles);
  const parts: Array<string | { mention: string }> = [];
  let from = 0;
  for (let m = pattern.exec(text); m; m = pattern.exec(text)) {
    const at = m.index + m[1].length;
    if (at > from) parts.push(text.slice(from, at));
    parts.push({ mention: `@${m[2]}` });
    from = pattern.lastIndex;
  }
  if (from < text.length) parts.push(text.slice(from));
  return parts;
}

/** The people a message names, for `mentions` (Go is not a person: the Server reads "@Go" from the text). */
export function mentionedIds(text: string, people: MentionHandle[]): string[] {
  if (!text.includes("@") || people.length === 0) return [];
  const byHandle = new Map(people.map((p) => [p.handle.toLowerCase(), p.user.id]));
  const ids = new Set<string>();
  const pattern = patternFor(people.map((p) => p.handle));
  for (let m = pattern.exec(text); m; m = pattern.exec(text)) {
    const id = byHandle.get(m[2].toLowerCase());
    if (id) ids.add(id);
  }
  return [...ids].slice(0, MAX_MENTIONS);
}

/** The "@…" being typed at the caret: where its "@" is and the letters after it ("" right after the "@"). */
export function mentionQuery(value: string, caret: number): { start: number; query: string } | null {
  const m = /(^|\s)@([^\s@]*)$/u.exec(value.slice(0, caret));
  return m ? { start: m.index + m[1].length, query: m[2] } : null;
}

/** Rows whose name, or any word of it, starts with what was typed. */
export function filterMentions(items: MentionItem[], query: string): MentionItem[] {
  const q = query.toLowerCase();
  if (!q) return items;
  return items.filter((item) => [item.handle, ...item.name.split(/\s+/)].some((word) => word.toLowerCase().startsWith(q)));
}
