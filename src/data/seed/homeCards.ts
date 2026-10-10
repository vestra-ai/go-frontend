import { tripHome } from "@/data/seed/copy";

// App-home trip card status line. Which one shows is the Server's call (`TripSummary.attention`); the words are here.
export const HOME_CARD_STATUS = {
  pending: (n: number) => `${n} ${n === 1 ? "thing" : "things"} pending on you`,
  allSet: tripHome.allSet.title,
  collecting: "Go is collecting everyone’s answers",
} as const;
