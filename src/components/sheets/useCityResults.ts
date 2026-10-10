"use client";

import { useEffect, useState } from "react";
import { api } from "@/api/endpoints";
import { CIT, TOP_CITIES } from "@/data/seed/cities";
import type { CityRef } from "@/data/types";

/** Quiet time after the last keystroke before a search request goes out (CONTRACT-APP §4.14). */
const DEBOUNCE_MS = 400;
/** The Server matches from two characters; below that the default list is filtered in place. */
export const MIN_SEARCH_CHARS = 2;

type Outcome = { query: string; cities: CityRef[]; offline: boolean };
type State = {
  /** Successful results by query, so reopening the picker or retyping a query is instant. */
  byQuery: Record<string, Outcome>;
  /** Default-list fallback for a query whose request failed (never cached: the next open tries the network again). */
  fallback: Outcome | null;
  /** Most recent outcome of any kind, shown dimmed while the next query is on its way. */
  last: Outcome | null;
};

export type CityResults = {
  cities: CityRef[];
  /** Nothing to show yet for the current query: the first load, or a request still pending. */
  loading: boolean;
  /** `cities` belong to an earlier query and are shown dimmed until the new ones arrive. */
  stale: boolean;
  /** The Server was unreachable; `cities` come from the default list. */
  offline: boolean;
};

const startsWith = (c: CityRef, q: string) => c.name.toLowerCase().startsWith(q);

/** Keeps the strip's own id when the name matches one (so picking "Mumbai" highlights its chip); `id` is otherwise the Server's. */
function toRef(city: { id: string; name: string; region: string }): CityRef {
  const known = CIT.find((c) => c.name.toLowerCase() === city.name.toLowerCase());
  return { id: known?.id ?? city.id, name: city.name, region: city.region };
}

/**
 * City results for the dropdown: the hardcoded top Indian cities while the query is empty, a filter of those below
 * MIN_SEARCH_CHARS (both instant, no request), `GET /places/cities` from there (names that start with the query,
 * biggest first). A search goes out only after the user has stopped typing for DEBOUNCE_MS, and typing again cancels
 * the request that is still in flight before the next one is scheduled. An unreachable Server falls back to the
 * default list instead of showing nothing.
 */
export function useCityResults(query: string, active: boolean): CityResults {
  const q = query.trim().toLowerCase();
  const [state, setState] = useState<State>({ byQuery: {}, fallback: null, last: null });

  const short = q.length < MIN_SEARCH_CHARS;
  const known = state.byQuery[q] ?? (state.fallback?.query === q ? state.fallback : null);

  useEffect(() => {
    if (!active || short || state.byQuery[q]) return;
    const controller = new AbortController();
    const settle = (outcome: Outcome) => {
      if (controller.signal.aborted) return;
      setState((s) => ({
        byQuery: outcome.offline ? s.byQuery : { ...s.byQuery, [q]: outcome },
        fallback: outcome.offline ? outcome : s.fallback,
        last: outcome,
      }));
    };
    const run = async () => {
      try {
        const res = await api.cities(q, { signal: controller.signal });
        settle({ query: q, cities: res.items.map(toRef), offline: false });
      } catch {
        // An aborted request is a superseded one, not a failure.
        settle({ query: q, cities: TOP_CITIES.filter((c) => startsWith(c, q)), offline: true });
      }
    };
    const timer = window.setTimeout(run, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // `state.byQuery[q]` is read only to skip work already done; re-running on every state change would cancel itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, active]);

  if (short) return { cities: q ? TOP_CITIES.filter((c) => startsWith(c, q)) : TOP_CITIES, loading: false, stale: false, offline: false };
  if (known) return { cities: known.cities, loading: false, stale: false, offline: known.offline };
  // While typing, the previous query's rows stay (dimmed). With nothing relevant to keep, show the loading state.
  const keep = q && state.last?.query ? state.last : null;
  return { cities: keep?.cities ?? [], loading: true, stale: keep !== null, offline: false };
}
