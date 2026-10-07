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
