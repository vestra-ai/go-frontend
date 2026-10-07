import { JOIN_1_MS, JOIN_2_MS } from "@/data/timing";
import { acceptInvite, createDraftGoa, joinGoa, JOINERS } from "@/store/logic";
import { cancel, schedule } from "@/store/timers";
import type { SliceCreator } from "@/store/types";

const JOIN_TIMERS = ["join:rahul", "join:priya"] as const;

export interface TripsActions {
  /** Idempotent: inserts the Goa draft (just you) plus College gang, the Bali invite and past trips. */
  createDraftGoa(): void;
  /** Idempotent: Rahul joins after JOIN_1_MS and Priya after JOIN_2_MS (from the first call); `instant` adds both now. */
  simulateJoins(opts?: { instant?: boolean }): void;
  /** Joins the invite's trip and drops it from App home; Bali's chat sits at `visa`. */
  acceptInvite(code: string): void;
  /** State-only no-op (the invite stays listed, as designed). The caller shows "Invite declined. Priya won’t be told." */
  declineInvite(code: string): void;
}

export const createTripsSlice: SliceCreator<TripsActions> = (set, get) => ({
  createDraftGoa: () =>
    set((s) => {
      createDraftGoa(s);
    }),
  simulateJoins: (opts) => {
    if (opts?.instant) {
      JOIN_TIMERS.forEach(cancel);
      set((s) => {
        JOINERS.forEach((id) => joinGoa(s, id));
        s.trips.joinRun = "done";
      });
      return;
    }
    if (get().trips.joinRun !== "idle") return;
    set((s) => {
      s.trips.joinRun = "running";
    });
    schedule(JOIN_TIMERS[0], JOIN_1_MS, () =>
      set((s) => {
        joinGoa(s, "rahul");
      }),
    );
    schedule(JOIN_TIMERS[1], JOIN_2_MS, () =>
      set((s) => {
        joinGoa(s, "priya");
        s.trips.joinRun = "done";
      }),
    );
  },
  acceptInvite: (code) =>
    set((s) => {
      acceptInvite(s, code);
    }),
  declineInvite: () => {},
});
