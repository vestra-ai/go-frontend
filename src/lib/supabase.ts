import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_KEY, SUPABASE_URL } from "@/api/env";

// Sign-in is Supabase Auth (CONTRACT-APP §1.2): the Server issues no tokens. supabase-js keeps the session in
// localStorage, refreshes the access token on its own, and finishes the PKCE redirect when it finds `?code=` in the URL.

let client: SupabaseClient | null = null;

/** Browser only. Throws when the project URL / key are not set, so a misconfigured build fails loudly on first use. */
export function supabase(): SupabaseClient {
  if (typeof window === "undefined") throw new Error("supabase() is browser-only");
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
