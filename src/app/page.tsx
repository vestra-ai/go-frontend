"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FeatureTrio } from "@/components/home/FeatureTrio";
import { LegalLine } from "@/components/home/LegalLine";
import { WelcomeOrbit } from "@/components/home/WelcomeOrbit";
import { GoogleButton } from "@/components/shell/GoogleButton";
import { Screen } from "@/components/shell/Screen";
import { welcome as copy } from "@/data/seed/copy";
import { toastGo } from "@/lib/toast";
import { useHydrated, useStore } from "@/store";

export default function WelcomePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const signedIn = useStore((s) => s.session.signedIn);
  const signIn = useStore((s) => s.signIn);

  useEffect(() => {
    if (hydrated && signedIn) router.replace("/home");
  }, [hydrated, signedIn, router]);

  if (!hydrated || signedIn) {
    return (
      <Screen bg="surface">
        <div className="flex-1 bg-white" />
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="relative flex flex-1 flex-col bg-linear-to-b from-[#FFFBFA] from-0% via-[#FFFDFC] via-30% to-white to-55% px-6 pt-4 pb-safe">
        <WelcomeOrbit items={[...copy.orbit]} mascot={copy.mascot} pills={copy.pills} />
        <div className="relative mt-4 flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-34 leading-[1.15] font-semibold tracking-title text-balance text-ink">{copy.headlines[0]}</h1>
          <p className="max-w-[350px] text-16 leading-[1.45] tracking-body text-pretty text-muted">{copy.subline}</p>
        </div>
        <FeatureTrio items={[...copy.features]} />
        <div className="relative mt-auto flex flex-col gap-2.5 pt-[22px]">
          <GoogleButton
            onSignedIn={() => {
              signIn();
              router.replace("/home");
            }}
          />
          <LegalLine
            {...copy.legal}
            onTerms={() => toastGo(copy.toasts.terms)}
            onPrivacy={() => toastGo(copy.toasts.privacy)}
          />
        </div>
      </div>
    </Screen>
  );
}
