"use client";

import { useParams } from "next/navigation";
import { InviteScreen } from "@/components/home/InviteScreen";

/** `<base>/j/<code>`, the link shape CONTRACT-APP §4.4 names: kept so links shared in that shape still open. Same screen as `/invite/<code>`. */
export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  return <InviteScreen key={code} code={code} />;
}
