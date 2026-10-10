import type { AskKey, ChipOption } from "@/data/types";

// Go's calls: suggestion chips for "Ask Go to call …", the recording player's fixed waveform, and copy. The calls
// themselves are the room's `call` cards (state/homeView.ts).

const chip = (s: string): ChipOption => {
  const i = s.indexOf(" ");
  return { emoji: s.slice(0, i), label: s.slice(i + 1) };
};

export const CALL_CHIPS: Record<AskKey, ChipOption[]> = {
  stay: ["🌙 Late check-in", "☀️ Early check-in", "🧳 Late check-out", "🛏️ Extra mattress", "🍳 Breakfast", "🚕 Airport pickup"].map(chip),
  fly: ["🧳 Extra baggage", "💺 Seats together", "🍱 Pre-book a meal", "♿ Wheelchair help", "🔁 Change flight", "💸 Cancel and refund"].map(chip),
  main: ["🌙 Late check-in", "☀️ Early check-in", "🧳 Late check-out", "🚕 Airport cab"].map(chip),
};

// Recording player waveform: bar heights, filled left to right as the recording plays.
export const RECORDING_WAVEFORM = {
  played: [6, 10, 16, 12, 22, 18, 26, 14, 20],
  unplayed: [28, 16, 10, 18, 24, 12, 8, 14, 22, 26, 18, 12, 20, 16, 10, 24, 18, 12, 8, 14, 10, 18, 22, 14, 10, 6],
};

export const RECORDING_RATES = [1, 1.5, 2] as const;

export const CALL_COPY = {
  card: {
    title: (who: string) => `Go ↔ ${who}`,
    live: (clock: string) => `LIVE · ${clock}`,
    askingFor: "ASKING FOR",
    listen: "🎧 Listen in",
    end: "End call",
    another: "Ask Go to make another call",
  },
  form: {
    title: "Need something sorted?",
    sub: "Go calls the villa, airline or cab desk and handles it",
    srLabel: "What should Go ask for?",
    placeholder: "e.g. we land at 10 pm, keep the gate open",
    submit: "📞 Ask Go to call",
  },
  lastCall: {
    prefix: (who: string) => `Last call · ${who}`,
    recording: "Recording",
  },
  panel: {
    onCall: (who: string) => `Go is on a call with ${who}`,
    live: "LIVE",
    asking: (asking: string) => `Asking: ${asking}`,
    badge: "On a call",
  },
  options: {
    eyebrow: (who: string) => `ASK GO TO CALL ${who.toUpperCase()}`,
    srLabel: (who: string) => `What should Go ask ${who}?`,
    placeholder: "e.g. we land at 10 pm, keep the gate open",
    call: "📞 Call",
    /** The message that asks Go in the room ("Ask Go to call…" is a normal message mentioning Go, CONTRACT-APP §4.11). */
    message: (who: string, ask: string) => (ask ? `@Go please call ${who}: ${ask}` : `@Go please call ${who}`),
  },
  listen: {
    title: "Listening in",
    sub: "Go is handling it. Take over anytime.",
    close: "Close",
    heroSub: (clock: string) => `Live · ${clock} · you’re listening, they can’t hear you`,
    transcript: "LIVE TRANSCRIPT",
    goName: "Go",
    speaking: (who: string) => `${who} is speaking`,
    details: (who: string) => `Booking details · ${who}`,
    mute: "🔇 Mute",
    unmute: "🔈 Unmute",
    takeOver: "🙋 Take over",
    handBack: "🤖 Hand back to Go",
    end: "End call",
    noteTakenOver: (who: string) => `You’re talking to ${who} now. Go is listening and taking notes.`,
    noteMuted: (who: string) => `You’re muted. ${who} can’t hear you.`,
    noteDefault: () => "Closing stops listening. Ending hangs up Go’s call.",
  },
  recording: {
    label: (who: string) => `Call with ${who}`,
    play: "Play",
    pause: "Pause",
    rate: (rate: number) => `${rate}×`,
    meta: (when: string, length: string) => (length ? `${when} · ${length}` : when),
    shared: "Shared in the trip chat",
    playFailed: "Couldn’t play the recording. The link may have expired.",
    shareFailed: "Couldn’t share the recording. Try again.",
    transcript: "TRANSCRIPT",
    share: "Share in group chat",
    save: "Save",
  },
} as const;
