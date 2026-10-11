"use client";

import { useParams } from "next/navigation";
import { InviteScreen } from "@/components/home/InviteScreen";

/** The invite link: `<base>/invite/<code>`. A friend taps it, signs in if needed, taps Accept, and is in the trip (CONTRACT-APP §4.3). */
export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  return <InviteScreen key={code} code={code} />;
}
