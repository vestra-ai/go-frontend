"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { Screen } from "@/components/shell/Screen";

/** Trip chat: the room, its sheets, and the composer's reply / ask-Go modes (mirrored in the query string). */
export default function ChatPage() {
  const { tripId } = useParams<{ tripId: string }>();
  // Canvas-coloured shell until the trip and the room's first page are read.
  const shell = <Screen>{null}</Screen>;
  return (
    <Suspense fallback={shell}>
      <ChatScreen key={tripId} tripId={tripId} />
    </Suspense>
  );
}
