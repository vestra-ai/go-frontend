"use client";

import { useEffect, useState } from "react";
import { searchCities as searchSavedCities } from "@/data/seed/cities";
import type { CityRef } from "@/data/types";
import { fetchTopCities, searchCitiesOnline } from "@/lib/geocode";

/** Quiet time after the last keystroke before a search request goes out. */
const DEBOUNCE_MS = 400;

type Outcome = { query: string; cities: CityRef[]; offline: boolean };
type State = {
  /** Successful results by query, so reopening the picker or retyping a query is instant. */
  byQuery: Record<string, Outcome>;
  /** Saved-list fallback for a query whose request failed (never cached: the next open tries the network again). */
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
  /** The live API was unreachable; `cities` come from the saved list. */
  offline: boolean;
};

const includes = (c: CityRef, q: string) => c.name.toLowerCase().includes(q);

/**
 * City results for the dropdown: top Indian cities while the query is empty, a filter of those for one character, a
 * live search from two. A search goes out only after the user has stopped typing for DEBOUNCE_MS, and typing again
 * cancels the request that is still in flight (aborting its fetch) before the next one is scheduled. An unreachable
 * API (offline PWA, blocked network) falls back to the bundled list instead of showing nothing.
 */
export function useCityResults(query: string, active: boolean): CityResults {
  const q = query.trim().toLowerCase();
  const [state, setState] = useState<State>({ byQuery: {}, fallback: null, last: null });

  const known = state.byQuery[q] ?? (state.fallback?.query === q ? state.fallback : null);

  useEffect(() => {
    if (!active || state.byQuery[q]) return;
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
        if (q.length < 2) {
          const top = await fetchTopCities();
          settle({ query: q, cities: q ? top.filter((c) => includes(c, q)) : top, offline: false });
        } else {
          settle({ query: q, cities: await searchCitiesOnline(q, controller.signal), offline: false });
        }
      } catch {
        // An aborted request is a superseded one, not a failure.
        settle({ query: q, cities: searchSavedCities(q), offline: true });
      }
    };

    // Empty / one-character queries come from the cached top list: no need to wait for typing to settle.
    const timer = window.setTimeout(run, q.length < 2 ? 0 : DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // `state.byQuery[q]` is read only to skip work already done; re-running on every state change would cancel itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, active]);

  if (known) return { cities: known.cities, loading: false, stale: false, offline: known.offline };
  // While typing, the previous query's rows stay (dimmed). With nothing relevant to keep, show the loading state.
  const keep = q && state.last?.query ? state.last : null;
  return { cities: keep?.cities ?? [], loading: true, stale: keep !== null, offline: false };
}
