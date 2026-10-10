/**
 * Shown under the tab bar while the next tab's payload arrives. Empty on purpose: the tabs share one shell (layout.tsx),
 * so the hero and the tab bar stay on screen and only this column waits, instead of the whole page going blank.
 */
export default function TripTabLoading() {
  return null;
}
