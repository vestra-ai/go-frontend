import type { CityRef } from "@/data/types";

// One-line city strip (C-chat-kickoff.md §1.4).
export const CIT: CityRef[] = [
  { id: "blr", name: "Bengaluru" },
  { id: "bom", name: "Mumbai" },
  { id: "del", name: "Delhi" },
  { id: "pnq", name: "Pune" },
  { id: "hyd", name: "Hyderabad" },
  { id: "maa", name: "Chennai" },
  { id: "ccu", name: "Kolkata" },
  { id: "amd", name: "Ahmedabad" },
];

export const DEFAULT_CITY: CityRef = CIT[0];

// Default "Other city" dropdown (empty query, and the filter below MIN_SEARCH_CHARS): the biggest Indian cities by
// population, hardcoded so the list opens instantly. Ids match what the live search returns (the strip's id for a
// strip city, else "name|state"), so picking one from here and from a search highlights the same row.
export const TOP_CITIES: CityRef[] = [
  { id: "bom", name: "Mumbai", region: "Maharashtra, India" },
  { id: "del", name: "Delhi", region: "Delhi, India" },
  { id: "blr", name: "Bengaluru", region: "Karnataka, India" },
  { id: "hyd", name: "Hyderabad", region: "Telangana, India" },
  { id: "amd", name: "Ahmedabad", region: "Gujarat, India" },
  { id: "maa", name: "Chennai", region: "Tamil Nadu, India" },
  { id: "ccu", name: "Kolkata", region: "West Bengal, India" },
  { id: "surat|gujarat", name: "Surat", region: "Gujarat, India" },
  { id: "pnq", name: "Pune", region: "Maharashtra, India" },
  { id: "jaipur|rajasthan", name: "Jaipur", region: "Rajasthan, India" },
];

// "Other city" search list. Filter (kept as designed): name startsWith q || region includes q, first 6.
export const MORE: { name: string; region: string }[] = [
  { name: "Indore", region: "Madhya Pradesh, India" },
  { name: "Indapur", region: "Maharashtra, India" },
  { name: "Indi", region: "Karnataka, India" },
  { name: "Imphal", region: "Manipur, India" },
  { name: "Kochi", region: "Kerala, India" },
  { name: "Kozhikode", region: "Kerala, India" },
  { name: "Mangaluru", region: "Karnataka, India" },
  { name: "Mysuru", region: "Karnataka, India" },
  { name: "Nagpur", region: "Maharashtra, India" },
  { name: "Nashik", region: "Maharashtra, India" },
  { name: "Jaipur", region: "Rajasthan, India" },
  { name: "Lucknow", region: "Uttar Pradesh, India" },
  { name: "Surat", region: "Gujarat, India" },
  { name: "Dubai", region: "Dubai, UAE" },
  { name: "Singapore", region: "Singapore" },
];

export function searchCities(query: string): CityRef[] {
  const q = query.trim().toLowerCase();
  return MORE.filter((c) => c.name.toLowerCase().startsWith(q) || c.region.toLowerCase().includes(q))
    .slice(0, 6)
    .map((c) => ({ id: c.name.toLowerCase(), name: c.name, region: c.region }));
}
