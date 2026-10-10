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
