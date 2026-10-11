"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/api/endpoints";
import { errorMessage } from "@/api/http";
import { IdentityCard } from "@/components/home/IdentityCard";
import { Spinner } from "@/components/icons/custom/Spinner";
import { SettingsList, type SettingsRow } from "@/components/home/SettingsList";
import { FromCitySheet } from "@/components/sheets/FromCitySheet";
import { GoPageSheet, type VaultStatus } from "@/components/sheets/GoPageSheet";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/button";
import { CIT } from "@/data/seed/cities";
import { profile as copy } from "@/data/seed/copy";
import { signOut } from "@/lib/auth";
import { toastGo } from "@/lib/toast";
import { loadMe, updateMe, useGo, useRequireSession } from "@/state";
import { toUser } from "@/state/view";

/** Profile (CONTRACT-APP §4.1): who I am, my default city, my trips, and the way into Go's vault. */
export default function ProfilePage() {
  const router = useRouter();
  const session = useRequireSession();
  const me = useGo((s) => s.me);
  const [fromOpen, setFromOpen] = useState(false);
  // Signing out is a round trip to Supabase: the button shows a spinner until the page has moved on to `/`.
  const [signingOut, setSigningOut] = useState(false);
  // Go's vault, framed in a sheet. The link is kept only here, for the frame: never logged, never stored.
  const [vault, setVault] = useState<{ url: string; open: boolean; pending: boolean }>({ url: "", open: false, pending: false });

  useEffect(() => {
    // The counts move with every trip: read `Me` again on each visit.
    if (session === "signedIn") void loadMe().catch(() => {});
  }, [session]);

  if (session !== "signedIn" || !me) {
    return <Screen>{null}</Screen>;
  }

  const user = toUser({ person_id: me.person_id, name: me.name, photo_url: me.photo_url }, { email: me.email });
  const from = me.from_city ? (CIT.find((c) => c.name === me.from_city) ?? { id: me.from_city.toLowerCase(), name: me.from_city }) : null;

  /**
   * Cards and logins live in Go's vault. Its home opens inside the app (`display: "embedded"`, CONTRACT-APP §4.1), framed
   * at once: the link expires in 5 minutes.
   */
  const openVault = async () => {
    if (vault.pending) return;
    setVault((v) => ({ ...v, pending: true }));
    try {
      const link = await api.vaultLink({ start: "home", display: "embedded" });
      setVault({ url: link.url, open: true, pending: false });
    } catch (err) {
      setVault((v) => ({ ...v, pending: false }));
      toastGo(errorMessage(err, copy.toasts.vaultFailed));
    }
  };
  const closeVault = () => setVault((v) => ({ ...v, open: false }));
  /** The vault's own word that the person is done there: close the frame; what it saved shows on `Me`. */
  const onVault = (status: VaultStatus) => {
    closeVault();
    if (status === "saved") void loadMe().catch(() => {});
    else if (status === "failed") toastGo(copy.toasts.vaultNotSaved);
  };

  const rows: SettingsRow[] = [
    {
      id: "from",
      kind: "action",
      emoji: copy.rows.from.emoji,
      title: copy.rows.from.title,
      sub: copy.rows.from.sub(me.from_city ?? null),
      onPress: () => setFromOpen(true),
    },
    {
      id: "trips",
      kind: "link",
      href: "/home",
      emoji: copy.rows.trips.emoji,
      title: copy.rows.trips.title,
      sub: copy.rows.trips.sub(me.counts.active_trips, me.counts.past_trips),
    },
    {
      id: "payment",
      kind: "action",
      emoji: copy.rows.payment.emoji,
      title: copy.rows.payment.title,
      sub: copy.rows.payment.sub(me.has_upi ? (me.upi_id_masked ?? "") : null),
      onPress: () => void openVault(),
    },
  ];

  return (
    <Screen>
      <TopBar sticky title={copy.title} onBack={() => (window.history.length > 1 ? router.back() : router.push("/home"))} />
      <div className="flex flex-col gap-3 px-4 pt-2 pb-10">
        <IdentityCard user={user} providerLabel={copy.provider(me.auth_provider)} />
        <SettingsList rows={rows} />
        <Button
          variant="danger-outline"
          size="lg"
          className="w-full tracking-normal"
          aria-busy={signingOut}
          onClick={() => {
            if (signingOut) return;
            setSigningOut(true);
            // The Server keeps nothing per device: signing out is Supabase's alone.
            void signOut().finally(() => router.replace("/"));
          }}
        >
          {signingOut && <Spinner className="size-[18px] border-danger/25 border-t-danger border-r-danger" />}
          {copy.signOut}
        </Button>
      </div>
      {/* The profile's default city (the From chip in a trip chat sets that trip's own answer). */}
      <FromCitySheet
        open={fromOpen}
        initialCity={from}
        onSave={(city) => {
          setFromOpen(false);
          updateMe({ from_city: city.name.slice(0, 60) })
            .then(() => toastGo(copy.toasts.fromSaved))
            .catch((err) => toastGo(errorMessage(err, copy.toasts.failed)));
        }}
        onClose={() => setFromOpen(false)}
      />
      <GoPageSheet open={vault.open} onOpenChange={(open) => !open && closeVault()} url={vault.url || null} title={copy.rows.payment.title} onVault={onVault} />
    </Screen>
  );
}
