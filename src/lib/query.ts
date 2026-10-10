/**
 * Drops query params from the address bar with `history.replaceState` (no navigation, no new entry; Next mirrors it into
 * `useSearchParams`). For one-shot params such as `?stage=` and `?open=` that apply on arrival and must never stay in the URL.
 */
export function dropQueryParams(...keys: string[]) {
  const params = new URLSearchParams(window.location.search);
  if (!keys.some((k) => params.has(k))) return;
  keys.forEach((k) => params.delete(k));
  const qs = params.toString();
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}
