import type { InvitePreview } from "@/api/contract";
import { API_BASE } from "@/api/env";
import { isOptimizable } from "@/lib/imageHosts";

/** The picture an invite shows for its trip: the trip's own cover, else its destination's photo. The sheet and the link preview use the same one. */
export function invitePhoto(trip: InvitePreview["trip"]): string | null {
  return trip.photo_url || trip.destination?.photo_url || null;
}

// The shared picture goes through Next's image optimizer, as every other photo does: the Server's originals are around
// 600 KB and WhatsApp drops a preview picture over roughly 300 KB. The optimizer only answers a width listed in
// `images.deviceSizes` (next.config.ts) and a quality listed in `images.qualities` (its default is [75]).
const OG_WIDTH = 1080;
const OG_QUALITY = 75;

/**
 * The optimized `/_next/image` address of a cover, relative to `metadataBase` (which makes it absolute). The optimizer
 * answers WebP only to a client whose `Accept` header names it, and the original's format to the rest, so a link
 * previewer that accepts anything gets the original's format. Null for a photo the optimizer would refuse (a host that is not allowlisted).
 */
export function optimizedCoverUrl(photo: string): string | null {
  return isOptimizable(photo) ? `/_next/image?url=${encodeURIComponent(photo)}&w=${OG_WIDTH}&q=${OG_QUALITY}` : null;
}

/**
 * The public invite preview, read on the web server for the link preview's tags (CONTRACT-APP §4.3). Null for anything
 * but a clean answer: the link preview then falls back to the mascot instead of failing the page. The answer is kept for
 * five minutes, because every messenger that unfurls a shared link asks for it and the Server allows 30 a minute per IP address.
 */
export async function fetchInvitePreview(code: string): Promise<InvitePreview | null> {
  try {
    const res = await fetch(`${API_BASE}/invites/${encodeURIComponent(code)}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(3000) });
    return res.ok ? ((await res.json()) as InvitePreview) : null;
  } catch {
    return null;
  }
}
