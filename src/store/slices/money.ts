import { recordPayment } from "@/store/logic";
import type { RecordedPayment } from "@/store/state";
import type { SliceCreator } from "@/store/types";

export interface MoneyActions {
  /** M7: prepends "You paid Rahul" (Today) and reduces the You→Rahul settlement; settled once it reaches ₹0. */
  recordPayment(payment: RecordedPayment): void;
}

export const createMoneySlice: SliceCreator<MoneyActions> = (set) => ({
  recordPayment: (payment) =>
    set((s) => {
      recordPayment(s, payment);
    }),
});
