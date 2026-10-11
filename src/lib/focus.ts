// Words the app writes in a message box itself (a Board row's ask, a suggestion chip) are easy to miss. The box takes
// the focus with the caret after them, so the keyboard comes up and it reads as "edit this, or send it".

/** An open sheet, or one still sliding away: Radix keeps it in the page until its exit animation ends. */
const SHEET = '[data-slot="drawer-content"]';
/** A sheet still there after this long is another one that opened: the box is left alone. */
const MAX_WAIT_MS = 1500;

/** iPhone, iPod, and iPad (which says it is a Mac, with a touch screen). */
function isIOS(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Focuses a text box with the caret after its text; a text longer than the box shows its end. */
export function focusAtEnd(input: HTMLInputElement) {
  input.focus();
  const end = input.value.length;
  input.setSelectionRange(end, end);
  input.scrollLeft = input.scrollWidth;
}

/**
 * `focusAtEnd`, with the keyboard held back until no sheet is on screen (the sheet whose button wrote the words is still
 * sliding away). Call it inside the tap. Returns the cancel.
 *
 * iOS opens the keyboard only for a focus made inside a tap, so a focus made after the sheet has left would bring none.
 * There the box takes the focus at once with `inputmode="none"` (focused, no keyboard), and gets its keyboard when the
 * attribute goes. Everywhere else a later focus brings the keyboard up by itself.
 */
export function focusAtEndAfterSheets(input: HTMLInputElement): () => void {
  if (!document.querySelector(SHEET)) {
    focusAtEnd(input);
    return () => {};
  }
  const held = isIOS();
  if (held) {
    input.setAttribute("inputmode", "none");
    focusAtEnd(input);
  }

  const started = performance.now();
  let frame = requestAnimationFrame(function wait() {
    const sheet = document.querySelector(SHEET) !== null;
    if (sheet && performance.now() - started < MAX_WAIT_MS) {
      frame = requestAnimationFrame(wait);
      return;
    }
    frame = 0;
    if (sheet) {
      if (!held) return;
      input.blur();
      input.removeAttribute("inputmode");
    } else if (held) {
      input.removeAttribute("inputmode");
    } else {
      focusAtEnd(input);
    }
  });

  return () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    if (held) input.removeAttribute("inputmode");
  };
}
