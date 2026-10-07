/** Seed labels with a leading emoji ("🎧 Listen in") split at the first space: { emoji: "🎧", label: "Listen in" }. */
export function splitEmoji(text: string): { emoji: string; label: string } {
  const i = text.indexOf(" ");
  return i < 0 ? { emoji: "", label: text } : { emoji: text.slice(0, i), label: text.slice(i + 1) };
}
