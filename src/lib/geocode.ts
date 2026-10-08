import { CIT } from "@/data/seed/cities";
import type { CityRef } from "@/data/types";

// Open-Meteo geocoding (GeoNames data): free, no API key, CORS-enabled. https://open-meteo.com/en/docs/geocoding-api
const ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const COUNTRY = "IN";

type GeoResult = {
  id: number;
  name: string;
  feature_code: string;
  admin1?: string;
  country?: string;
  population?: number;
};

type Ranked = { city: CityRef; population: number };

// The API has no "top cities" endpoint, so the biggest Indian metros are resolved by name through the same search and
// ranked by the population the API returns.
const TOP_CITY_NAMES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai",
  "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur",
] as const;
const TOP_LIMIT = 10;
const TOP_STORAGE_KEY = "go.topCities.v1";
const TOP_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SEARCH_LIMIT = 8;

async function request(name: string, count: number, signal?: AbortSignal): Promise<GeoResult[]> {
  const params = new URLSearchParams({ name, count: String(count), language: "en", countryCode: COUNTRY, format: "json" });
  const res = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!res.ok) throw new Error(`Geocoding request failed (${res.status})`);
  const data = (await res.json()) as { results?: GeoResult[] };
  return data.results ?? [];
}

// Populated places only (no countries, regions or landmarks).
const isPlace = (r: GeoResult) => r.feature_code.startsWith("PPL");

/** Keeps the strip's own id when the name matches one (so picking "Mumbai" highlights its chip). */
function toRef(r: GeoResult): CityRef {
  const region = [r.admin1, r.country].filter(Boolean).join(", ");
  const known = CIT.find((c) => c.name.toLowerCase() === r.name.toLowerCase());
  // Names repeat across states (two "Nashopur"s), so a searched city's id carries its state.
  return known ? { ...known, region } : { id: `${r.name}|${r.admin1 ?? ""}`.toLowerCase(), name: r.name, region };
}

const byPopulation = (a: Ranked, b: Ranked) => b.population - a.population;

const searchCache = new Map<string, CityRef[]>();

/** Live city search: Indian towns and cities matching `query`, biggest first. Needs 2+ characters. */
export async function searchCitiesOnline(query: string, signal?: AbortSignal): Promise<CityRef[]> {
  const q = query.trim().toLowerCase();
  const cached = searchCache.get(q);
  if (cached) return cached;

  const seen = new Set<string>();
  const ranked: Ranked[] = [];
  for (const r of await request(q, 20, signal)) {
    if (!isPlace(r)) continue;
    const key = `${r.name}|${r.admin1 ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ranked.push({ city: toRef(r), population: r.population ?? 0 });
  }
  const cities = ranked.sort(byPopulation).slice(0, SEARCH_LIMIT).map((x) => x.city);
  searchCache.set(q, cities);
  return cities;
}

function readStoredTop(): CityRef[] | null {
  try {
    const raw = window.localStorage.getItem(TOP_STORAGE_KEY);
    if (!raw) return null;
    const { at, cities } = JSON.parse(raw) as { at: number; cities: CityRef[] };
    return Date.now() - at < TOP_TTL_MS && cities.length > 0 ? cities : null;
  } catch {
    return null;
  }
}

function storeTop(cities: CityRef[]) {
  try {
    window.localStorage.setItem(TOP_STORAGE_KEY, JSON.stringify({ at: Date.now(), cities }));
  } catch {
    // Storage can be blocked or full; the in-memory copy still serves this session.
  }
}

let topPromise: Promise<CityRef[]> | null = null;

/** Top Indian cities by population, fetched once per session and kept for a week. */
export function fetchTopCities(): Promise<CityRef[]> {
  topPromise ??= (async () => {
    const stored = readStoredTop();
    if (stored) return stored;

    const settled = await Promise.allSettled(TOP_CITY_NAMES.map((name) => request(name, 10)));
    const ranked: Ranked[] = [];
    for (const [i, outcome] of settled.entries()) {
      if (outcome.status !== "fulfilled") continue;
      const best = outcome.value
        .filter((r) => isPlace(r) && r.name.toLowerCase() === TOP_CITY_NAMES[i].toLowerCase())
        .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
      if (best) ranked.push({ city: toRef(best), population: best.population ?? 0 });
    }
    if (ranked.length === 0) throw new Error("No top cities available");
    const cities = ranked.sort(byPopulation).slice(0, TOP_LIMIT).map((x) => x.city);
    storeTop(cities);
    return cities;
  })().catch((err) => {
    topPromise = null; // let the next open try again
    throw err;
  });
  return topPromise;
}
