import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { ArrowLeft } from "@/components/icons/generated";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopBarProps = {
  title: ReactNode;
  /** 13px muted line under the title. */
  subtitle?: ReactNode;
  /** Back target as a link… */
  backHref?: string;
  /** …or a handler. With neither, no back button renders. */
  onBack?: MouseEventHandler<HTMLButtonElement>;
  /** 1–2 icon buttons on the right. */
  trailing?: ReactNode;
  tone?: "white" | "transparent";
  /** `safe` = 56px (pt-safe), `hero` = 46px (pt-safe-hero). */
  padTop?: "safe" | "hero";
  className?: string;
  /** Optional row under the title (filter chips). */
  children?: ReactNode;
};

/** Page header: 44px back arrow, 20/700 title, trailing actions. */
export function TopBar({
  title,
  subtitle,
  backHref,
  onBack,
  trailing,
  tone = "transparent",
  padTop = "safe",
  className,
  children,
}: TopBarProps) {
  const arrow = <ArrowLeft className="size-[22px]" strokeWidth={2} />;

  return (
    <header
      className={cn(
        "flex shrink-0 flex-col px-3 pb-2",
        padTop === "safe" ? "pt-safe" : "pt-safe-hero",
        tone === "white" && "bg-white",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        {backHref !== undefined ? (
          <Button asChild variant="ghost" size="icon" aria-label="Back">
            <Link href={backHref}>{arrow}</Link>
          </Button>
        ) : onBack ? (
          <Button variant="ghost" size="icon" aria-label="Back" onClick={onBack}>
            {arrow}
          </Button>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-20 font-bold tracking-h3">{title}</h1>
          {subtitle && <p className="truncate text-13 tracking-caption text-muted">{subtitle}</p>}
        </div>
        {trailing && <div className="flex shrink-0 items-center gap-1">{trailing}</div>}
      </div>
      {children}
    </header>
  );
}
