"use client";

import Image from "next/image";
import { useState } from "react";
import { Spinner } from "@/components/icons/custom/Spinner";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";
import { toastGo } from "@/lib/toast";
import { cn } from "@/lib/utils";

type GoogleButtonProps = {
  /** Where to land after sign-in (a path in the app). Defaults to the page's own `?next=`, else /home. */
  next?: string;
  className?: string;
};

export function GoogleButton({ next, className }: GoogleButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      // The browser leaves for Google and comes back to /auth/callback, so the spinner stays until the page unloads.
      await signInWithGoogle(next ?? new URLSearchParams(window.location.search).get("next") ?? undefined);
    } catch {
      setPending(false);
      toastGo("Couldn’t start sign-in. Try again.");
    }
  }

  return (
    <Button
      variant="primary"
      size="xl"
      aria-busy={pending}
      onClick={handleClick}
      className={cn("w-full gap-2.5", className)}
    >
      {pending ? (
        <Spinner className="size-5 border-white/30 border-t-white border-r-white" />
      ) : (
        <Image src="/icons/brand/google.svg" alt="" width={20} height={20} unoptimized className="size-5" />
      )}
      Continue with Google
    </Button>
  );
}
