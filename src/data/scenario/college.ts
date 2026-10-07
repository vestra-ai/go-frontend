import type { ScenarioStage } from "@/data/types";

// DESIGN-ASSUMPTION (I-plan-empty.md §1.6 #13): the design has no College gang chat. This kickoff-only stage
// reuses Goa's opener so /trips/college/chat renders and matches its trip-home chat pill ("Go: What’s the plan, crew? 🌴").
export const COLLEGE_SCENARIO: ScenarioStage[] = [
  {
    id: "kickoff",
    subtitle: "Rahul joined",
    memberIds: ["aarav", "rahul"],
    chips: {
      where: { label: "Where?", state: "unset" },
      when: { label: "When?", state: "unset" },
      stay: { label: "Stay?", state: "unset" },
      budget: { label: "Budget?", state: "unset" },
      from: { label: "From?", state: "unset" },
    },
    messages: [
      { id: "cg-sys", stage: "kickoff", author: "system", kind: "system", text: "Trip created · Rahul joined" },
      {
        id: "cg-go-open",
        stage: "kickoff",
        author: "go",
        kind: "text",
        text: "What’s the plan, crew? 🌴\nWhere are we thinking of going?",
        maxWidth: 76,
      },
    ],
    next: [],
  },
];
