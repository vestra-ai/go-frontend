"use client";

import Image from "next/image";
import { useState } from "react";
import { Spinner } from "@/components/icons/custom/Spinner";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";
import { cn } from "@/lib/utils";

type GoogleButtonProps = {
  /** Called after sign-in resolves; the page routes to /home. */
  onSignedIn?: () => void;
  className?: string;
};

export function GoogleButton({ onSignedIn, className }: GoogleButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await signInWithGoogle();
      onSignedIn?.();
    } finally {
      setPending(false);
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
