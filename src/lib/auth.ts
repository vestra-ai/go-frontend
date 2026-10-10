import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/api/env";
import { supabase } from "@/lib/supabase";

// The single auth seam (CONTRACT-APP §1.2). Everything that touches the Supabase session goes through here.

/** Where Supabase sends the browser back after Google; that page routes on to `next`. */
export const AUTH_CALLBACK_PATH = "/auth/callback";

/** Only same-app paths are accepted as a return target (never an absolute or protocol-relative URL). */
export function safeNextPath(next: string | null | undefined, fallback = "/home"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

/**
 * Starts Google sign-in (PKCE). The browser leaves for Google and comes back to `/auth/callback`, so the promise only
 * settles early when the redirect could not start.
 */
export async function signInWithGoogle(next?: string): Promise<void> {
  const redirectTo = new URL(AUTH_CALLBACK_PATH, window.location.origin);
  redirectTo.searchParams.set("next", safeNextPath(next));
  const { error } = await supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.toString() } });
  if (error) throw error;
}

/** The Server keeps nothing per device (§1.2): signing out is local to Supabase. */
export async function signOut(): Promise<void> {
  await supabase().auth.signOut();
}

/** The stored session, once supabase-js has finished reading it (and any `?code=` in the URL). */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase().auth.getSession();
  return data.session;
}

export async function getAccessToken(): Promise<string | null> {
  return (await getSession())?.access_token ?? null;
}

/** `401` → refresh once (§1.2). Null when the refresh token no longer works: sign in again. */
export async function refreshAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase().auth.refreshSession();
  return error ? null : (data.session?.access_token ?? null);
}

/** Fires with the session on sign-in / token refresh and with null on sign-out. Returns the unsubscribe. */
export function onSessionChange(listener: (session: Session | null) => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase().auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}
