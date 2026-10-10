import type { ErrorBody } from "@/api/contract";
import { API_BASE } from "@/api/env";
import { getAccessToken, refreshAccessToken } from "@/lib/auth";

// One fetch wrapper for every Server call (CONTRACT-APP §1). It adds the bearer token, an Idempotency-Key on every
// write, turns the error body into an `ApiError`, and refreshes the session once on 401. It sends only the three
// request headers CORS allows (Authorization, Content-Type, Idempotency-Key) and never credentials (§1.1).

export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 when the request never got an answer (offline, DNS, CORS). */
    readonly status: number,
    readonly code: string,
    /** Plain words, safe to show (§1.5). */
    message: string,
    readonly field: string | null = null,
    readonly retryAfterSeconds: number | null = null,
    readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Something that needs Go did not get an answer: show the message, let them tap again, never auto-retry (§1.5). */
  get goUnavailable(): boolean {
    return this.code === "go_unavailable";
  }
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError;

/** The words to show for any thrown value. */
export function errorMessage(err: unknown, fallback = "Something went wrong. Try again."): string {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  query?: Query;
  /** JSON body. Bodies are strict (§1.3): send only the fields the route names. `undefined` members are dropped. */
  body?: unknown;
  /** `required` (default) fails with 401 when signed out; `optional` sends the token when there is one; `none` never. */
  auth?: "required" | "optional" | "none";
  /** Reuse a key to make a retry of the same press the same write (§1.4). Generated per call otherwise. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

let onSignedOut: (() => void) | null = null;

/** Called when a request stays 401 after one refresh: the session is gone, sign in again (§1.2). */
export function setSignedOutHandler(handler: (() => void) | null) {
  onSignedOut = handler;
}

/** A fresh key for one press: an Idempotency-Key, a `client_message_id`, a `press_id` (§1.4). */
export function newKey(): string {
  return crypto.randomUUID();
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(API_BASE + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: Partial<ErrorBody> | null = null;
  try {
    body = (await res.json()) as Partial<ErrorBody>;
  } catch {
    // A proxy or the platform answered instead of the Server: no contract body.
  }
  const e = body?.error;
  const retryHeader = Number(res.headers.get("Retry-After"));
  return new ApiError(
    res.status,
    e?.code ?? (res.status === 401 ? "unauthorized" : "internal"),
    e?.message ?? `The server answered ${res.status}.`,
    e?.field ?? null,
    e?.retry_after_seconds ?? (Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : null),
    e?.request_id ?? res.headers.get("X-Request-Id"),
  );
}

async function send(method: Method, url: string, opts: RequestOptions, token: string | null, key: string | null): Promise<Response> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (key) headers["Idempotency-Key"] = key;
  const hasBody = opts.body !== undefined;
  if (hasBody) headers["Content-Type"] = "application/json";
  try {
    return await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
      credentials: "omit",
      // The Server sets its own Cache-Control per route (§1.6); the browser cache revalidates `GET /trips/:trip` by ETag.
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "network", "You seem to be offline. Check your connection and try again.");
  }
}

/** Resolves with the parsed JSON, or `undefined` for an answer with no body (202, 204). Rejects with `ApiError`. */
export async function request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
  const auth = opts.auth ?? "required";
  const url = buildUrl(path, opts.query);
  const key = method === "GET" ? null : (opts.idempotencyKey ?? newKey());

  let token = auth === "none" ? null : await getAccessToken();
  if (auth === "required" && !token) {
    onSignedOut?.();
    throw new ApiError(401, "unauthorized", "sign in first");
  }

  let res = await send(method, url, opts, token, key);
  if (res.status === 401 && token) {
    // Refresh once and retry with the same key, so the write still happens once (§1.2, §1.4).
    token = await refreshAccessToken();
    if (token) res = await send(method, url, opts, token, key);
    if (!token || res.status === 401) {
      onSignedOut?.();
      throw token ? await toApiError(res) : new ApiError(401, "unauthorized", "sign in first");
    }
  }

  if (!res.ok) throw await toApiError(res);
  // 202 and 204 carry no body (DELETE /me, leave, read); everything else is JSON.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Fetches a file the Server hands out through a redirect to a signed link (a ticket document, §4.10) and returns its
 * bytes. `fetch` follows the 302; the signed link needs no Authorization.
 */
export async function requestBlob(path: string, signal?: AbortSignal): Promise<Blob> {
  const token = await getAccessToken();
  if (!token) {
    onSignedOut?.();
    throw new ApiError(401, "unauthorized", "sign in first");
  }
  let res: Response;
  try {
    res = await fetch(buildUrl(path), { headers: { Authorization: `Bearer ${token}` }, signal, credentials: "omit" });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "network", "You seem to be offline. Check your connection and try again.");
  }
  if (!res.ok) throw await toApiError(res);
  return res.blob();
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>("POST", path, opts),
  put: <T>(path: string, opts?: RequestOptions) => request<T>("PUT", path, opts),
  patch: <T>(path: string, opts?: RequestOptions) => request<T>("PATCH", path, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, opts),
};
