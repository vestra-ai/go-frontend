import { BALI_SCENARIO } from "@/data/scenario/bali";
import { COLLEGE_SCENARIO } from "@/data/scenario/college";
import { GOA_SCENARIO } from "@/data/scenario/goa";
import type {
  ChipKey,
  Message,
  QuickStartState,
  ScenarioStage,
  StageHeader,
  StageId,
  StageNext,
  StayBookingState,
  TripId,
  TriggerId,
} from "@/data/types";

// Pure scenario lookups for the store/selectors (PLAN §9.3). No state lives here.

export const SCENARIOS: Record<TripId, ScenarioStage[]> = {
  goa: GOA_SCENARIO,
  college: COLLEGE_SCENARIO,
  bali: BALI_SCENARIO,
};

export const CHIP_ORDER: ChipKey[] = ["where", "when", "stay", "budget", "from"];

export function stageIndexOf(tripId: TripId, id: StageId): number {
  return SCENARIOS[tripId].findIndex((s) => s.id === id);
}

export function stageAt(tripId: TripId, index: number): ScenarioStage {
  const stages = SCENARIOS[tripId];
  return stages[Math.min(Math.max(index, 0), stages.length - 1)];
}

// The transition `advance(trigger)` takes from this stage, if it accepts the trigger.
export function transitionFor(stage: ScenarioStage, trigger: TriggerId): StageNext | undefined {
  return stage.next.find((n) => n.trigger === trigger);
}

// The stage's NextStepPill definition (readiness is evaluated by the store).
export function pillFor(stage: ScenarioStage): StageNext | undefined {
  return stage.next.find((n) => n.pill);
}

export function headerFor(stage: ScenarioStage, quickStart: QuickStartState): StageHeader {
  return stage.headerByQuickStart?.[quickStart] ?? { subtitle: stage.subtitle, memberIds: stage.memberIds };
}

export interface VisibilityContext {
  quickStart: QuickStartState;
  stayBooking?: Pick<StayBookingState, "status" | "by">;
}

export function isMessageVisible(msg: Message, ctx: VisibilityContext, stageIsCurrent: boolean): boolean {
  if (msg.live && !stageIsCurrent) return false;
  switch (msg.showIf) {
    case "qs-done":
      return ctx.quickStart === "done";
    case "qs-dismissed":
      return ctx.quickStart === "dismissed";
    case "booking-claimed-by-rahul":
      return ctx.stayBooking?.status === "claimed" && ctx.stayBooking.by === "rahul";
    default:
      return true;
  }
}

// Seed messages of stages 0..stageIndex, grouped per stage so sent messages can be interleaved by stage
// (C-chat-kickoff.md §1.3 ordering rule).
export function seedMessagesByStage(
  tripId: TripId,
  stageIndex: number,
  ctx: VisibilityContext,
): { stage: StageId; messages: Message[] }[] {
  return SCENARIOS[tripId].slice(0, stageIndex + 1).map((stage, i) => ({
    stage: stage.id,
    messages: stage.messages.filter((m) => isMessageVisible(m, ctx, i === stageIndex)),
  }));
}
