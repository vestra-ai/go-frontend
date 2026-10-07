import type { SliceCreator } from "@/store/types";

export interface SessionActions {
  /** Called by `signInWithGoogle()` callers (lib/auth.ts) before routing to /home. */
  signIn(): void;
  /** Signs out but keeps the demo data, so signing in again resumes it. "Reset demo" clears everything. */
  signOut(): void;
  setNotifications(on: boolean): void;
}

export const createSessionSlice: SliceCreator<SessionActions> = (set) => ({
  signIn: () =>
    set((s) => {
      s.session.signedIn = true;
    }),
  signOut: () =>
    set((s) => {
      s.session.signedIn = false;
    }),
  setNotifications: (on) =>
    set((s) => {
      s.session.notifications = on;
    }),
});
