import { share as shareCopy } from "@/data/seed/copy";
import type { Trip } from "@/data/types";
import { toastGo } from "@/lib/toast";

export type NativeChannel = "messages" | "gmail" | "more";

/** A file shared through the same sheet instead of the trip invite (e.g. a ticket PDF from the viewer). */
export interface ShareFile {
  title: string;
  /** Second line of the sheet's top card ("6E5313-K7QX2M.pdf · 2 pages"). */
  sub: string;
  url: string;
  emoji: string;
}

export function inviteLink(trip: Trip): string {
  return trip.inviteHref ?? "https://" + trip.inviteUrl;
}

/** The link that goes out: the file's when there is one, else the trip invite. */
function linkOf(trip: Trip, file?: ShareFile): string {
  return file ? file.url : inviteLink(trip);
}

/**
 * What goes out: the file when there is one, else the trip invite. The invite is one `text` with the link already in it and no
 * separate `url`, because apps differ in how they join the two (some keep only the url) and this way the message arrives as written.
 */
function payload(trip: Trip, file?: ShareFile): { title: string; text: string; url?: string } {
  if (file) return { title: file.title, text: file.title, url: file.url };
  return { title: shareCopy.title(trip.name), text: shareCopy.message(inviteLink(trip)) };
}

export async function copyInviteLink(trip: Trip, file?: ShareFile): Promise<void> {
  try {
    await navigator.clipboard?.writeText(linkOf(trip, file));
  } catch {
    // Clipboard can be blocked (permissions, insecure context); the toast still confirms the tap.
  }
  toastGo(shareCopy.toasts.copied);
}

/** Returns true when the OS share sheet handled it (including a user cancel). */
async function nativeShare(trip: Trip, file?: ShareFile): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  try {
    await navigator.share(payload(trip, file));
    return true;
  } catch (err) {
    return err instanceof DOMException && err.name === "AbortError";
  }
}

// navigator.share needs user activation: call these synchronously from the tap handler.
export async function inviteViaWhatsApp(trip: Trip, file?: ShareFile): Promise<void> {
  if (await nativeShare(trip, file)) return;
  const { text, url } = payload(trip, file);
  const message = url ? text + " " + url : text;
  window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
}

export async function inviteNative(trip: Trip, channel: NativeChannel, file?: ShareFile): Promise<void> {
  if (await nativeShare(trip, file)) return;
  await navigator.clipboard?.writeText(linkOf(trip, file)).catch(() => {});
  toastGo(shareCopy.toasts[channel]);
}
