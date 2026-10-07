// Public surface of the store (PLAN §9.4). Client components only: import from "@/store".
// No "use client" here: Next rejects `export *` in a client boundary; the hook modules carry the directive.
export { useStore } from "@/store/store";
export { useHydrated } from "@/store/useHydrated";
export * from "@/store/hooks";
export * from "@/store/selectors";
export type { GoStore } from "@/store/types";
export type { SendOptions } from "@/store/slices/chat";
export type {
  ChatTripData,
  CheckinState,
  GoData,
  HomeTripData,
  MoneyData,
  OpenRow,
  RecordedPayment,
  RecordingRate,
  RouteState,
  VisaState,
} from "@/store/state";
export { STORE_KEY } from "@/store/persist";
