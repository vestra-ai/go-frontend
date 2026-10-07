import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { merge, partialize, STORE_KEY, STORE_VERSION } from "@/store/persist";
import { createChatSlice } from "@/store/slices/chat";
import { createDemoSlice } from "@/store/slices/demo";
import { createHomeSlice } from "@/store/slices/home";
import { createMoneySlice } from "@/store/slices/money";
import { createSessionSlice } from "@/store/slices/session";
import { createTripsSlice } from "@/store/slices/trips";
import { createInitialData } from "@/store/state";
import type { GoStore } from "@/store/types";

// The one store (PLAN §9.4): zustand 5 + immer + persist. On the server there is no window, so persist is inert and
// `useStore.persist` is undefined: guard it (see useHydrated). Checking `window` rather than `localStorage` matters on
// Node ≥ 25, whose global `localStorage` getter returns undefined (with a warning) instead of being absent.
export const useStore = create<GoStore>()(
  persist(
    immer((...a) => ({
      ...createInitialData(),
      ...createSessionSlice(...a),
      ...createTripsSlice(...a),
      ...createChatSlice(...a),
      ...createHomeSlice(...a),
      ...createMoneySlice(...a),
      ...createDemoSlice(...a),
    })),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: typeof window === "undefined" ? undefined : createJSONStorage(() => window.localStorage),
      partialize,
      merge,
    },
  ),
);
