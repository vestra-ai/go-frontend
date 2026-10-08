import type { ReactNode } from "react";
import { INVITES } from "@/data/seed/invites";

// Static for the same reason as the trip layout: the Accept link on App home must not wait on the server.
export function generateStaticParams() {
  return Object.keys(INVITES).map((code) => ({ code }));
}

export default function InviteLayout({ children }: { children: ReactNode }) {
  return children;
}
