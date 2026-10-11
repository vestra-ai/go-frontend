import { MapPin } from "@/components/icons/generated";
import { details as copy } from "@/data/seed/copy";
import type { OptionExtras } from "@/data/types";

const linkClass = "flex min-h-8 items-center gap-1 text-14 font-semibold text-go underline-offset-2 active:underline";

/** Under an option's details: where it is on a map, and its own page ("View on ixigo"). Small links, never buttons. */
export function OptionLinks({ extras }: { extras?: OptionExtras }) {
  if (!extras?.mapHref && !extras?.link) return null;
  return (
    <div className="flex flex-wrap gap-x-5 px-1">
      {extras.mapHref && (
        <a href={extras.mapHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
          <MapPin className="size-[14px] shrink-0" />
          {copy.map}
        </a>
      )}
      {extras.link && (
        <a href={extras.link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {extras.link.label}
        </a>
      )}
    </div>
  );
}
