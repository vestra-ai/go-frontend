"use client";

import { useEffect } from "react";
import { startSession } from "@/state/sync";

/** Mounted once in the root layout: reads the Supabase session, boots the store and the live connection. */
export function SessionBoot() {
  useEffect(() => startSession(), []);
  return null;
}
