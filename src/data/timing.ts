// Timing constants (plans/PLAN.md §9.5). All values in ms.

export const TOAST_MS = 2200;
export const GO_REPLY_MS = 1200; // Go's "Got it 👍 …" auto-reply after a composer send
export const SCROLL_DELAY_MS = 60;
export const SAVED_CLOSE_MS = 900; // how long "Saved privately ✓" shows before the budget sheet closes itself
export const GO_TYPING_MS = 600; // delay before Go-posted stage entries append
export const LONG_PRESS_MS = 500;
export const RAHUL_CLAIMS_MS = 6000; // cleared while the pay sheet is open, re-armed on close
export const JOIN_1_MS = 4000; // Rahul joins after the first share action
export const JOIN_2_MS = 8000; // Priya joins
export const DATES_NUDGE_MS = 2500;
export const AUTO_SCROLL_DONE_MS = 350;
export const SIGN_IN_MS = 400;

// E15 booking sequence offsets from card mount (plays once; final state persists).
export const BOOKING_SEQUENCE_MS = [1600, 1800, 1900, 2700, 2750, 2850, 3300] as const;
export const BOOKING_SEQ = BOOKING_SEQUENCE_MS; // name used by plans/screens/E-deciding.md
