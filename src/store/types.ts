import type { StateCreator } from "zustand";
import type { ChatActions } from "@/store/slices/chat";
import type { DemoActions } from "@/store/slices/demo";
import type { HomeActions } from "@/store/slices/home";
import type { MoneyActions } from "@/store/slices/money";
import type { SessionActions } from "@/store/slices/session";
import type { TripsActions } from "@/store/slices/trips";
import type { GoData } from "@/store/state";

// One `create` with the slice pattern (PLAN §9.4): data (./state.ts) + every slice's actions.
export type GoStore = GoData & SessionActions & TripsActions & ChatActions & HomeActions & MoneyActions & DemoActions;

export type SliceCreator<T> = StateCreator<GoStore, [["zustand/persist", unknown], ["zustand/immer", never]], [], T>;
