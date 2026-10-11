"use client";

import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { routeSkeleton } from "@/components/shell/routeSkeleton";
import { Screen } from "@/components/shell/Screen";
import { getSession, safeNextPath } from "@/lib/auth";
import { toastGo } from "@/lib/toast";

type AuthCallbackProps = { searchParams: Promise<{ next?: string | string[] }> };

/**
 * Where Supabase sends the browser back after Google (CONTRACT-APP §1.2). supabase-js trades the `?code=` for a
 * session while it starts up; this page waits for that and routes on to `next`. The wait is a network round trip, so
 * meanwhile it draws the skeleton of the page it is going to (Home, a trip), from the first paint (`next` is read on
 * the server); that page then takes over in place (PageTransition), instead of a white screen in between.
 */
export default function AuthCallbackPage({ searchParams }: AuthCallbackProps) {
  const router = useRouter();
  const param = use(searchParams).next;
  const next = safeNextPath(typeof param === "string" ? param : null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
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
  }, [router, next]);

  return (
    routeSkeleton(next.split(/[?#]/)[0]) ?? (
      <Screen bg="surface">
        <div className="flex-1 bg-white" />
      </Screen>
    )
  );
}
