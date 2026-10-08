import type { AskKey, CallRecording, ChipOption, LastCall, TranscriptLine, VendorCall, VendorId } from "@/data/types";

// Go's live vendor calls (J-triphome-calls.md §1.6). Villa content is the design seed verbatim;
// indigo/cab transcripts and recordings are templates filled from the call's `asking` (see below).
export const VENDOR_CALLS: Record<VendorId, VendorCall> = {
  villa: {
    id: "villa",
    who: "Villa Sol",
    phone: "+91 ••••• ••420",
    emoji: "🏡",
    bg: "bg-amber-soft",
    defaultAsk: "Late check-in around 11 pm, Fri 6 Nov",
    line: "“Let me check with the caretaker…”",
    time: "01:12",
    elapsedS: 72,
    transcriptLive: [
      { speaker: "go", text: "Hi, I’m calling about Rahul Verma’s booking, 6 to 9 November." },
      { speaker: "vendor", text: "Yes, I can see it. Four guests?" },
      { speaker: "go", text: "That’s right. The group lands around 10 pm. Could someone be there for check-in at 11?" },
      { speaker: "vendor", text: "Let me check with the caretaker…" },
    ],
    recording: {
      title: "Call with Villa Sol",
      meta: "Today, 4:12 pm · 2 min 48 s · recorded with consent",
      outcome: {
        headline: "Late check-in confirmed for 11 pm",
        body: "Ramesh, the caretaker, will wait at the gate. Call him on +91 ••••• ••611 when you land. No extra charge.",
      },
      durationS: 168,
      positionS: 42,
      transcript: [
        { t: "0:00", speaker: "go", text: "Hi, this is Go, an assistant calling for Rahul Verma. This call is recorded for the group. Is that okay?" },
        { t: "0:09", speaker: "vendor", text: "Yes, fine. How can I help?" },
        { t: "0:14", speaker: "go", text: "The group lands around 10 pm on Friday. Could someone be there for check-in at 11?", current: true },
        { t: "0:42", speaker: "vendor", text: "Ramesh can wait at the gate. Ask them to call when they land." },
        { t: "1:05", speaker: "go", text: "Perfect. Is there any charge for that?" },
        { t: "1:11", speaker: "vendor", text: "No charge." },
      ],
    },
  },
  indigo: {
    id: "indigo",
    who: "IndiGo",
    phone: "Customer care · PNR K7QX2M",
    emoji: "✈️",
    bg: "bg-indigo-tint", // design #E8EEFB
    defaultAsk: "Add a 15 kg extra bag on your Fri flight",
    line: "“Please hold while I check the fee…”",
    time: "03:40",
    elapsedS: 220,
    transcriptLive: null,
    recording: null,
  },
  cab: {
    id: "cab",
    who: "Cab desk",
    phone: "Mopa Airport taxi counter",
    emoji: "🚕",
    bg: "bg-surface-2",
    defaultAsk: "Airport cab for 2, Fri 9:55 pm landing",
    line: "“Which terminal gate will you come out of?”",
    time: "00:24",
    elapsedS: 24,
    transcriptLive: null,
    recording: null,
  },
};

const unquote = (line: string) => line.replace(/[“”]/g, "");

// DESIGN-ASSUMPTION (J-triphome-calls.md §1.4): IndiGo/cab content is generated from `asking`, `who` and `line`.
export function liveTranscriptFor(vendor: VendorId, asking: string): TranscriptLine[] {
  const call = VENDOR_CALLS[vendor];
  if (call.transcriptLive) return call.transcriptLive;
  return [
    { speaker: "go", text: asking },
    { speaker: "vendor", text: unquote(call.line) },
  ];
}

/** Mock "last call" shown in the Stay done card until real call history exists; the recording sheet falls back to it. */
export const MOCK_LAST_CALL: LastCall = { vendor: "villa", asking: "Late check-in around 11 pm, Fri 6 Nov", endedAt: 0 };

export function recordingFor(vendor: VendorId, asking: string): CallRecording {
  const call = VENDOR_CALLS[vendor];
  if (call.recording) return call.recording;
  return {
    title: `Call with ${call.who}`,
    meta: "Today · recorded with consent",
    outcome: { headline: `Done · ${asking}`, body: `Go handled it with ${call.who}. Full transcript below.` },
    durationS: 168,
    positionS: 42,
    transcript: [
      { t: "0:00", speaker: "go", text: asking, current: true },
      { t: "0:09", speaker: "vendor", text: unquote(call.line) },
    ],
  };
}

const chip = (s: string): ChipOption => {
  const i = s.indexOf(" ");
  return { emoji: s.slice(0, i), label: s.slice(i + 1) };
};

export const CALL_CHIPS: Record<AskKey, ChipOption[]> = {
  stay: ["🌙 Late check-in", "☀️ Early check-in", "🧳 Late check-out", "🛏️ Extra mattress", "🍳 Breakfast", "🚕 Airport pickup"].map(chip),
  fly: ["🧳 Extra baggage", "💺 Sit with Arjun", "🍱 Pre-book a meal", "♿ Wheelchair help", "🔁 Change flight", "💸 Cancel and refund"].map(chip),
  main: ["🌙 Late check-in", "☀️ Early check-in", "🧳 Late check-out", "🚕 Airport cab"].map(chip),
};

// Recording player waveform (J7): 9 played bars, 26 unplayed. Static, not draggable.
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
    stay: {
      eyebrow: "ASK GO TO CALL VILLA SOL",
      srLabel: "What should Go ask Villa Sol?",
      placeholder: "e.g. we land at 10 pm, keep the gate open",
    },
    fly: {
      eyebrow: "ASK GO TO CALL INDIGO",
      srLabel: "What should Go ask IndiGo?",
      placeholder: "e.g. add 15 kg to my flight",
    },
    call: "📞 Call",
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
    elapsed: "0:42",
    total: "2:48",
    rate: (rate: number) => `${rate}×`,
    transcript: "TRANSCRIPT",
    share: "Share in group chat",
    save: "Save",
  },
} as const;
