"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { ChatSkeleton } from "@/components/chat/ChatSkeleton";

/** Trip chat: the room, its sheets, and the composer's reply / ask-Go modes (mirrored in the query string). */
export default function ChatPage() {
  const { tripId } = useParams<{ tripId: string }>();
  return (
    // The skeleton until the trip and the room's first page are read.
    <Suspense fallback={<ChatSkeleton tripId={tripId} />}>
      <ChatScreen key={tripId} tripId={tripId} />
    </Suspense>
  );
}
