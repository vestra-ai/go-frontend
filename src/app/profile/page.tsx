"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { IdentityCard } from "@/components/home/IdentityCard";
import { PrototypeControls } from "@/components/home/PrototypeControls";
import { SettingsList, type SettingsRow } from "@/components/home/SettingsList";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/button";
import { profile as copy } from "@/data/seed/copy";
import { toastGo } from "@/lib/toast";
import { useHydrated, useStore } from "@/store";

export default function ProfilePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const signedIn = useStore((s) => s.session.signedIn);
  const user = useStore((s) => s.trips.members[s.session.userId]);
  const notifications = useStore((s) => s.session.notifications);
  const setNotifications = useStore((s) => s.setNotifications);
  const signOut = useStore((s) => s.signOut);

  useEffect(() => {
    if (hydrated && !signedIn) router.replace("/");
  }, [hydrated, signedIn, router]);

  if (!hydrated || !signedIn) {
    return <Screen>{null}</Screen>;
  }

  const rows: SettingsRow[] = [
    {
      id: "from",
      kind: "action",
      emoji: copy.rows.from.emoji,
      title: copy.rows.from.title,
      sub: copy.rows.from.sub(user.city ?? ""),
      onPress: () => toastGo(copy.toasts.from),
    },
    { id: "trips", kind: "link", href: "/home", emoji: copy.rows.trips.emoji, title: copy.rows.trips.title, sub: copy.rows.trips.sub },
    {
      id: "payment",
      kind: "action",
      emoji: copy.rows.payment.emoji,
      title: copy.rows.payment.title,
      sub: copy.rows.payment.sub,
      onPress: () => toastGo(copy.toasts.payment),
    },
    {
      id: "notifications",
      kind: "switch",
      emoji: copy.rows.notifications.emoji,
      title: copy.rows.notifications.title,
      sub: copy.rows.notifications.sub,
      checked: notifications,
      onCheckedChange: setNotifications,
      label: copy.rows.notifications.title,
    },
  ];

  return (
    <Screen>
      <TopBar
        sticky
        title={copy.title}
        onBack={() => (window.history.length > 1 ? router.back() : router.push("/home"))}
      />
      <div className="flex flex-col gap-3 px-4 pt-2 pb-10">
        <IdentityCard user={user} providerLabel={copy.provider} />
        <SettingsList rows={rows} />
        <Button
          variant="danger-outline"
          size="lg"
          className="w-full tracking-normal"
          onClick={() => {
            signOut();
            router.replace("/");
          }}
        >
          {copy.signOut}
        </Button>
        <PrototypeControls />
      </div>
    </Screen>
  );
}
