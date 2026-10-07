"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AppHomeView } from "@/components/home/AppHomeView";
import { HomeZeroView } from "@/components/home/HomeZeroView";
import { Screen } from "@/components/shell/Screen";
import { ScreenTitle } from "@/components/shell/ScreenTitle";
import { Avatar } from "@/components/ui/avatar";
import { home as copy } from "@/data/seed/copy";
import { selectMyTrips, useHydrated, useStore } from "@/store";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const signedIn = useStore((s) => s.session.signedIn);
  const user = useStore((s) => s.trips.members[s.session.userId]);
  const hasTrips = useStore((s) => selectMyTrips(s).length > 0);

  const presetApplied = useRef(false);

  // `?preset=<id>` (PLAN §9.6): reset to the artboard's state, strip the query and go to its route.
  useEffect(() => {
    if (!hydrated) return;
    const id = new URLSearchParams(window.location.search).get("preset");
    if (id) {
      if (presetApplied.current) return;
      presetApplied.current = true;
      router.replace(useStore.getState().applyPreset(id));
    } else if (!signedIn) {
      router.replace("/");
    }
  }, [hydrated, signedIn, router]);

  if (!hydrated || !signedIn) {
    return <Screen scroll="none">{null}</Screen>;
  }

  return (
    <Screen scroll="none">
      <div className={`flex shrink-0 items-center justify-between gap-3 px-5 ${hasTrips ? "pt-safe pb-2" : "pt-[max(60px,env(safe-area-inset-top))]"}`}>
        <ScreenTitle
          className="flex-1"
          eyebrow={hasTrips ? copy.eyebrowBack : copy.eyebrowZero}
          title={copy.title}
          trailing={
            <Link href="/profile" aria-label={copy.profileLabel} className="flex size-11 items-center justify-center rounded-full">
              <Avatar size={40} name={user.name} src={user.avatar} tone={user.tone} />
            </Link>
          }
        />
      </div>
      {hasTrips ? <AppHomeView /> : <HomeZeroView city={user.city ?? ""} />}
    </Screen>
  );
}
