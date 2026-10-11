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
export function focusAtEnd(input: HTMLInputElement, options?: FocusOptions) {
  input.focus(options);
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

/** After the focus, the keyboard has this long to come up and be answered. */
const KEYBOARD_MS = 2000;

/**
 * `focusAtEnd` for a box in a dock at the bottom of the screen, when the app makes the focus itself inside a touch that
 * was not on the box (a swipe on a message that opens the reply tray). Returns the cancel.
 *
 * iOS brings the keyboard up for such a focus, but what it scrolls into view is the place the finger was, not the box:
 * the dock stays under the keyboard. There the focus is made without the browser's own scroll, and once the keyboard is
 * up the page is moved by what it covers of `dock`. The keyboard shortens the visual viewport only, so that move slides
 * the view down inside the layout viewport, to the dock at its bottom. A tap on the box itself is the browser's to
 * reveal, as before. Everywhere else this is `focusAtEnd`.
 */
export function focusAtEndAboveKeyboard(input: HTMLInputElement, dock: HTMLElement): () => void {
  const view = window.visualViewport;
  if (!view || !isIOS()) {
    focusAtEnd(input);
    return () => {};
  }
  focusAtEnd(input, { preventScroll: true });

  // What the keyboard covered before the last move. A move that uncovered nothing took the dock along with the page:
  // more of them would only walk the thread away.
  let covered: number | null = null;
  const reveal = () => {
    if (document.activeElement !== input) return;
    const hidden = dock.getBoundingClientRect().bottom - (view.offsetTop + view.height);
    if (hidden <= 1) return;
    if (covered !== null && hidden > covered - 1) return stop();
    covered = hidden;
    window.scrollBy(0, hidden);
  };
  const stop = () => {
    view.removeEventListener("resize", reveal);
    window.clearTimeout(timer);
    cancelAnimationFrame(frame);
  };
  view.addEventListener("resize", reveal);
  const timer = window.setTimeout(stop, KEYBOARD_MS);
  // The keyboard may be up already (the composer had the focus): nothing will resize.
  const frame = requestAnimationFrame(reveal);
  return stop;
}

/** A held keyboard nobody took over goes after this long. */
const HOLD_MS = 1500;

/**
 * Brings the keyboard up now, inside a tap, for a box that will only be on the page a moment later (the reply tray,
 * which opens once the message menu has faded out). Call it inside the tap; the box then takes the focus as usual.
 *
 * iOS opens the keyboard only for a focus made inside a tap, and keeps it up when the focus moves on. So there an
 * unseen box takes the focus at once and stands in until the real one does; it removes itself when it loses the focus,
 * or after `HOLD_MS` when nothing took it. Everywhere else a later focus brings the keyboard by itself: nothing is done.
 */
export function holdKeyboard(): void {
  if (!isIOS()) return;
  const stand = document.createElement("input");
  stand.type = "text";
  stand.tabIndex = -1;
  stand.autocomplete = "off";
  stand.enterKeyHint = "send";
  stand.setAttribute("aria-hidden", "true");
  // At the top of the screen, so nothing has to scroll to show it; 16px, so iOS does not zoom in on it.
  stand.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;pointer-events:none";
  document.body.appendChild(stand);
  stand.focus({ preventScroll: true });
  const drop = () => {
    window.clearTimeout(timer);
    stand.removeEventListener("blur", drop);
    stand.remove();
  };
  stand.addEventListener("blur", drop);
  const timer = window.setTimeout(drop, HOLD_MS);
}
