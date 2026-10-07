import type { DateOption } from "@/data/types";

// E5 dates poll (E-deciding.md §1.6). 6 Nov and 25 Dec 2026 are Fridays; 23 Jan 2027 is a Saturday.
export const DATE_OPTIONS: DateOption[] = [
  {
    id: "diwali",
    name: "Diwali",
    month: "NOV",
    range: "6–9",
    meta: "Fri to Mon · no leave",
    fit: "Works for all 4",
    fitTone: "success",
    voters: ["priya", "arjun"],
  },
  {
    id: "xmas",
    name: "Christmas",
    month: "DEC",
    range: "25–28",
    meta: "Fri to Mon · no leave",
    fit: "Kabir’s away · 3 of 4",
    fitTone: "go",
    voters: ["rahul"],
  },
  {
    id: "rday",
    name: "Republic Day",
    month: "JAN",
    range: "23–26",
    meta: "Sat to Tue · 1 leave",
    fit: "Works for all 4 · 1 leave",
    fitTone: "muted",
    voters: [],
  },
];
