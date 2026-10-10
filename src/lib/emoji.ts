// A leading token is an emoji when it has a pictograph (or a flag) and no letters: "🏊" yes, "Free" no.
const EMOJI_TOKEN = new RegExp("^(?!.*\\p{L})(?=.*[\\p{Extended_Pictographic}\\p{Regional_Indicator}])", "u");

/**
 * Labels with a leading emoji ("🎧 Listen in") split at the first space: { emoji: "🎧", label: "Listen in" }.
 * Plain words stay whole: the Server's labels ("Free Wifi") come without one.
 */
export function splitEmoji(text: string): { emoji: string; label: string } {
  const i = text.indexOf(" ");
  if (i < 0 || !EMOJI_TOKEN.test(text.slice(0, i))) return { emoji: "", label: text };
  return { emoji: text.slice(0, i), label: text.slice(i + 1) };
}
