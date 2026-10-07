import { share as shareCopy } from "@/data/seed/copy";
import type { Trip } from "@/data/types";
import { toastGo } from "@/lib/toast";

export type NativeChannel = "messages" | "gmail" | "more";

export function inviteLink(trip: Trip): string {
  return "https://" + trip.inviteUrl;
}

export async function copyInviteLink(trip: Trip): Promise<void> {
  try {
    await navigator.clipboard?.writeText(inviteLink(trip));
  } catch {
    // Clipboard can be blocked (permissions, insecure context); the toast still confirms the tap.
  }
  toastGo(shareCopy.toasts.copied);
}

/** Returns true when the OS share sheet handled it (including a user cancel). */
async function nativeShare(trip: Trip): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  const title = shareCopy.title(trip.name);
  try {
    await navigator.share({ title, text: title, url: inviteLink(trip) });
    return true;
  } catch (err) {
    return err instanceof DOMException && err.name === "AbortError";
  }
}

// navigator.share needs user activation: call these synchronously from the tap handler.
export async function inviteViaWhatsApp(trip: Trip): Promise<void> {
  if (await nativeShare(trip)) return;
  const text = shareCopy.title(trip.name) + " " + inviteLink(trip);
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
}

export async function inviteNative(trip: Trip, channel: NativeChannel): Promise<void> {
  if (await nativeShare(trip)) return;
  await navigator.clipboard?.writeText(inviteLink(trip)).catch(() => {});
  toastGo(shareCopy.toasts[channel]);
}
