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
  return "https://" + trip.inviteUrl;
}

/** What goes out: the file when there is one, else the trip invite. */
function payload(trip: Trip, file?: ShareFile): { title: string; url: string } {
  return file ? { title: file.title, url: file.url } : { title: shareCopy.title(trip.name), url: inviteLink(trip) };
}

export async function copyInviteLink(trip: Trip, file?: ShareFile): Promise<void> {
  try {
    await navigator.clipboard?.writeText(payload(trip, file).url);
  } catch {
    // Clipboard can be blocked (permissions, insecure context); the toast still confirms the tap.
  }
  toastGo(shareCopy.toasts.copied);
}

/** Returns true when the OS share sheet handled it (including a user cancel). */
async function nativeShare(trip: Trip, file?: ShareFile): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  const { title, url } = payload(trip, file);
  try {
    await navigator.share({ title, text: title, url });
    return true;
  } catch (err) {
    return err instanceof DOMException && err.name === "AbortError";
  }
}

// navigator.share needs user activation: call these synchronously from the tap handler.
export async function inviteViaWhatsApp(trip: Trip, file?: ShareFile): Promise<void> {
  if (await nativeShare(trip, file)) return;
  const { title, url } = payload(trip, file);
  const text = title + " " + url;
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
}

export async function inviteNative(trip: Trip, channel: NativeChannel, file?: ShareFile): Promise<void> {
  if (await nativeShare(trip, file)) return;
  await navigator.clipboard?.writeText(payload(trip, file).url).catch(() => {});
  toastGo(shareCopy.toasts[channel]);
}
