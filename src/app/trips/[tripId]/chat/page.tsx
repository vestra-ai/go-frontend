"use client";

import { notFound, useParams } from "next/navigation";
import { Suspense } from "react";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { Screen } from "@/components/shell/Screen";
import { TRIP_IDS } from "@/data/seed/trips";
import type { TripId } from "@/data/types";
import { useHydrated } from "@/store";

const isTripId = (id: string): id is TripId => (TRIP_IDS as string[]).includes(id);

/** Trip chat: C1–C5, D1–D3, E1–E15, F1–F8, G2–G3, H1–H3 as scenario stage + query state (PLAN §8). */
export default function ChatPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const hydrated = useHydrated();
  if (!isTripId(tripId)) notFound();

  // Canvas-coloured shell until the persisted store is read, so server and first client render agree.
  const shell = <Screen>{null}</Screen>;
  if (!hydrated) return shell;

  return (
    <Suspense fallback={shell}>
      <ChatScreen key={tripId} tripId={tripId} />
    </Suspense>
  );
}
