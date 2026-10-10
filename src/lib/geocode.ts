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

const SEARCH_LIMIT = 8;
/** The API fuzzy-matches only from 3 characters; 2 return exact name matches only (so "mu" finds nothing), 1 nothing. */
export const MIN_SEARCH_CHARS = 3;

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

/** Live city search: Indian towns and cities matching `query`, biggest first. Needs MIN_SEARCH_CHARS+ characters. */
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
