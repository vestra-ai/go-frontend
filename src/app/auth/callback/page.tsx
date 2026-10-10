"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Screen } from "@/components/shell/Screen";
import { getSession, safeNextPath } from "@/lib/auth";
import { toastGo } from "@/lib/toast";

/**
 * Where Supabase sends the browser back after Google (CONTRACT-APP §1.2). supabase-js trades the `?code=` for a
 * session while it starts up; this page waits for that and routes on to `next`.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const next = safeNextPath(params.get("next"));
    const failure = params.get("error_description") ?? params.get("error");

    void getSession()
      .then((session) => {
        if (cancelled) return;
        if (session) router.replace(next);
        else {
          toastGo(failure ? `Sign-in didn’t finish: ${failure}` : "Sign-in didn’t finish. Try again.");
          router.replace(next === "/home" ? "/" : `/?next=${encodeURIComponent(next)}`);
        }
      })
      .catch(() => {
        if (cancelled) return;
        toastGo("Sign-in didn’t finish. Try again.");
        router.replace("/");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <Screen bg="surface">
      <div className="flex-1 bg-white" />
    </Screen>
  );
}
