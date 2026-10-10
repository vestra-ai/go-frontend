import type { ReactNode } from "react";
import { ScreenTitle } from "@/components/shell/ScreenTitle";
import { home as copy } from "@/data/seed/copy";

/** The returning Home body's column; shared with the skeleton so both lay out alike. */
export const homeBodyClass = "flex flex-col gap-2.5 px-4 pt-2.5 pb-[130px]";

/** Home's pinned title row: eyebrow over "Your trips", the profile avatar at the right. Shared with the skeleton. */
export function HomeHeader({ eyebrow, avatar }: { eyebrow: ReactNode; avatar: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 bg-canvas px-5 pt-safe pb-2">
      <ScreenTitle className="flex-1" eyebrow={eyebrow} title={copy.title} trailing={avatar} />
    </div>
  );
}
