"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AppHomeView } from "@/components/home/AppHomeView";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { HomeZeroView } from "@/components/home/HomeZeroView";
import { Screen } from "@/components/shell/Screen";
import { Avatar } from "@/components/ui/avatar";
import { home as copy } from "@/data/seed/copy";
import { loadHome, useGo, useRequireSession } from "@/state";
import { toUser } from "@/state/view";

/** App home (CONTRACT-APP §4.2): the whole screen is one `GET /home`; `home_changed` re-reads it. */
export default function HomePage() {
  const session = useRequireSession();
  const home = useGo((s) => s.home);
  const fromCity = useGo((s) => s.me?.from_city ?? null);

  useEffect(() => {
    if (session === "signedIn") void loadHome().catch(() => {});
  }, [session]);

  // The session is read and the home answers after first paint (a refresh): the skeleton holds the page until then.
  if (session !== "signedIn" || !home) {
    return <HomeSkeleton />;
  }

  const user = toUser(home.me);
  const hasTrips = home.trips.length > 0 || home.past_trips.length > 0;

  return (
    <Screen>
      <HomeHeader
        eyebrow={hasTrips ? copy.eyebrowBack : copy.eyebrowZero}
        avatar={
          <Link href="/profile" aria-label={copy.profileLabel} className="flex size-11 items-center justify-center rounded-full">
            <Avatar size={40} name={user.name} src={user.avatar} tone={user.tone} />
          </Link>
        }
      />
      {hasTrips ? <AppHomeView home={home} /> : <HomeZeroView city={fromCity} />}
    </Screen>
  );
}
