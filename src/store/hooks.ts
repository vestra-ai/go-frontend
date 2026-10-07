"use client";

import type { TripId } from "@/data/types";
import {
  selectBoard,
  selectBookings,
  selectChatHeader,
  selectChatPreview,
  selectChips,
  selectDone,
  selectItinerary,
  selectLiveCalls,
  selectMessages,
  selectMoney,
  selectMyTrips,
  selectNextPill,
  selectPending,
  selectPendingInvites,
  selectStage,
  selectTripHomeMode,
  selectTripMembers,
  selectVisaRows,
  type Scope,
} from "@/store/selectors";
import { useStore } from "@/store/store";

// Typed hooks over the memoised selectors (stable results, safe with zustand 5's strict snapshots).
// Actions: `useStore((s) => s.advance)` or `useStore.getState().advance(...)`.

export const useStage = (tripId: TripId) => useStore((s) => selectStage(s, tripId));
export const useChips = (tripId: TripId) => useStore((s) => selectChips(s, tripId));
export const useChatHeader = (tripId: TripId) => useStore((s) => selectChatHeader(s, tripId));
export const useMessages = (tripId: TripId) => useStore((s) => selectMessages(s, tripId));
export const useNextPill = (tripId: TripId) => useStore((s) => selectNextPill(s, tripId));
export const useBoard = (tripId: TripId) => useStore((s) => selectBoard(s, tripId));
export const usePending = (tripId: TripId) => useStore((s) => selectPending(s, tripId));
export const useDone = (tripId: TripId) => useStore((s) => selectDone(s, tripId));
export const useLiveCalls = (tripId: TripId) => useStore((s) => selectLiveCalls(s, tripId));
export const useTripHomeMode = (tripId: TripId) => useStore((s) => selectTripHomeMode(s, tripId));
export const useTripMembers = (tripId: TripId) => useStore((s) => selectTripMembers(s, tripId));
export const useChatPreview = (tripId: TripId) => useStore((s) => selectChatPreview(s, tripId));
export const useMyTrips = () => useStore(selectMyTrips);
export const usePendingInvites = () => useStore(selectPendingInvites);
export const useBookings = (tripId: TripId) => useStore((s) => selectBookings(s, tripId));
export const useItinerary = (tripId: TripId, scope: Scope) => useStore((s) => selectItinerary(s, tripId, scope));
export const useMoney = (tripId: TripId, scope: Scope) => useStore((s) => selectMoney(s, tripId, scope));
export const useVisaRows = (tripId: TripId) => useStore((s) => selectVisaRows(s, tripId));
