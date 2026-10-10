// Public surface of the server-backed state. Client components only.
// No "use client" here: Next rejects `export *` in a client boundary; the hook module carries the directive.
export { useGo } from "@/state/store";
export type { GoState, Load, OutgoingAttachment, OutgoingMessage, SessionStatus, TripData } from "@/state/store";
export * from "@/state/hooks";
export * from "@/state/actions";
export { openTrip } from "@/state/sync";
