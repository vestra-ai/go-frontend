import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScreenTitleProps = {
  /** 13/600 muted line above the title. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Right slot (avatar, round button), vertically centred. */
  trailing?: ReactNode;
  className?: string;
};

/** Large page title: optional eyebrow over a 34/600 h1. */
export function ScreenTitle({ eyebrow, title, trailing, className }: ScreenTitleProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        {eyebrow && <p className="text-13 font-semibold tracking-caption text-muted">{eyebrow}</p>}
        <h1 className="text-34 font-semibold tracking-title">{title}</h1>
      </div>
      {trailing}
    </div>
  );
}
