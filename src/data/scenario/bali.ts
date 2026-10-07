import type { ScenarioStage } from "@/data/types";

// Bali chat (G-bali.md §1.2): one terminal stage. sendVisa() fires `visa-sent` with no transition.
export const BALI_SCENARIO: ScenarioStage[] = [
  {
    id: "visa",
    subtitle: "Christmas · 25–28 Dec",
    memberIds: ["aarav", "rahul", "priya", "arjun"], // DESIGN-ASSUMPTION: header stack as designed (G-bali.md §1.7 #11)
    chips: {
      where: { label: "Bali", state: "set" },
      when: { label: "Dec 25–28", state: "set" },
      stay: { label: "Stay?", state: "unset" },
      budget: { label: "₹55k", state: "set" },
      from: { label: "Bengaluru", state: "set" },
    },
    messages: [
      { id: "bv-1", stage: "visa", author: "system", kind: "system", text: "Flights to Denpasar on hold · 4 seats" },
      {
        id: "bv-2",
        stage: "visa",
        author: "go",
        kind: "card",
        maxWidth: 80,
        card: {
          kind: "visa-ask",
          payload: {
            text: "Indian passports need a visa on arrival for Bali. I can apply online for each of you so there’s no queue at the airport 🛂",
            cta: "Add my passport details",
            caption: "Only you and Go see what you add",
          },
        },
      },
      { id: "bv-3", stage: "visa", author: "go", kind: "card", card: { kind: "visa-status", payload: { tripId: "bali" } } },
      { id: "bv-4", stage: "visa", author: "priya", kind: "text", text: "my passport photo is so bad lol", maxWidth: 72 },
    ],
    next: [],
  },
];
