/**
 * Where the Server keeps the photos it sends (`photo_url` on a trip's destination). These go through Next's image
 * optimizer, which resizes them to the width on screen: the originals are around 600 KB and the Server does not resize.
 * Used by `next.config.ts` as the `remotePatterns` allowlist and by `isOptimizable` below. Keep it exact: the allowlist
 * is what stops the optimizer from fetching any other host. Add a staging host here when there is one.
 */
export const OPTIMIZED_IMAGE_HOSTS = ["brain-production-6b68.up.railway.app"] as const;

/** The path the Server serves its photos under. */
export const OPTIMIZED_IMAGE_PATH = "/img/";

/**
 * True for a photo `next/image` may optimize. Anything else (another host, a relative path, a bad URL) must render with
 * `unoptimized`: in development `next/image` throws for a host that is not allowlisted, and in production the optimizer
 * answers 400, so the cover would be missing.
 */
export function isOptimizable(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.search === "" && url.pathname.startsWith(OPTIMIZED_IMAGE_PATH) && (OPTIMIZED_IMAGE_HOSTS as readonly string[]).includes(url.hostname);
  } catch {
    return false;
  }
}
