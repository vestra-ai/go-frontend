import { SIGN_IN_MS } from "@/data/timing";

/**
 * The single auth seam. Callers await it, then route to /home.
 * TODO: real Google OAuth — replace this stub; the signature stays the same.
 */
export function signInWithGoogle(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, SIGN_IN_MS);
  });
}
