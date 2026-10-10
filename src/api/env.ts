// Where the app talks to (CONTRACT-APP §1.1, §1.2). `NEXT_PUBLIC_*` values are inlined at build time, so each one is
// read by its literal name. Set them in `.env.local`; see `.env.example`.

const PRODUCTION_API = "https://server-production-2202go.up.railway.app/app/v1";

/** The Server's base, without a trailing slash: `https://<host>/app/v1`. */
export const API_BASE = (process.env.NEXT_PUBLIC_GO_API_URL || PRODUCTION_API).replace(/\/+$/, "");

/** `wss://<same host>/app/v1/live` (§3). */
export const LIVE_URL = `${API_BASE.replace(/^http/, "ws")}/live`;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
/** The project's anon / publishable key (safe in the browser; the Server refuses it as a bearer token). */
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured = SUPABASE_URL !== "" && SUPABASE_KEY !== "";
