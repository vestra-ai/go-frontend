"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { announceNavigation } from "@/components/shell/NavFeedback";
import { crew as copy } from "@/data/seed/copy";
import { toastGo } from "@/lib/toast";
import { createTrip, loadMe, useGo } from "@/state";

const WHOS_COMING = "/trips/new";

type StartOptions = {
  /** An idea's destination, when the tap was on one. */
  hint?: string;
  /** Where the new trip opens: "Who's coming" (default), or straight in its chat (Ask Go). */
  to?: "crew" | "chat";
};

/**
 * Starting a trip from Home (CONTRACT-APP §4.4): `POST /trips` runs here, on the tap, and only then does the app move
 * on, to "Who's coming" (`/trips/new?trip=…`) or to the trip's chat, with the trip already in the store.
 * `pending` names the control that was tapped (it shows the spinner) until the next page is on screen; meanwhile every
 * other tap is ignored, so one tap is one trip.
 */
export function useStartTrip() {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  const [leaving, startLeaving] = useTransition();
  const [source, setSource] = useState<string | null>(null);
  const busy = useRef(false);

  // Nothing on Home links to the page any more, so ask for it ahead of the tap.
  useEffect(() => router.prefetch(WHOS_COMING), [router]);

  /** `from` is the tapped control's own name. */
  async function start(from: string, { hint, to = "crew" }: StartOptions = {}) {
    if (busy.current || leaving) return;
    busy.current = true;
    setSource(from);
    setCreating(from);
    try {
      const me = useGo.getState().me ?? (await loadMe());
      const view = await createTrip({
        ...(hint ? { destination_hint: hint.slice(0, 80) } : {}),
        ...(me.from_city ? { from_city: me.from_city } : {}),
      });
      announceNavigation();
      const id = encodeURIComponent(view.trip_id);
      startLeaving(() => router.push(to === "chat" ? `/trips/${id}/chat` : `${WHOS_COMING}?trip=${id}`));
    } catch {
      toastGo(copy.createFailed);
    } finally {
      busy.current = false;
      setCreating(null);
    }
  }

  return { pending: creating ?? (leaving ? source : null), start };
}
