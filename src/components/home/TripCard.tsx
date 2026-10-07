import Link from "next/link";
import { AvatarStack } from "@/components/common/AvatarStack";
import { ChevronRight } from "@/components/icons/generated";
import { rowPress } from "@/components/home/IdeaCard";
import { Card } from "@/components/ui/card";
import type { User } from "@/data/types";
import { cn } from "@/lib/utils";

type TripCardProps = {
  href: string;
  name: string;
  cover: { kind: "photo"; src: string; alt: string } | { kind: "gradient" };
  /** "📍 Goa": a leading emoji is split off and hidden from assistive tech. */
  coverTitle: string;
  coverSub: string;
  members: User[];
  status: string;
  statusTone: "go" | "muted";
};

const LEADING_EMOJI = /^(\p{Extended_Pictographic}️?)\s+(.*)$/u;

/** Active trip on App home: cover (photo or gradient) with title and crew, status footer. */
export function TripCard({ href, name, cover, coverTitle, coverSub, members, status, statusTone }: TripCardProps) {
  const match = LEADING_EMOJI.exec(coverTitle);
  return (
    <Card asChild variant="shadow" radius="3xl" className={cn("flex flex-col overflow-hidden", rowPress)}>
      <Link href={href}>
        <span className="relative block h-32">
          {cover.kind === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo, full-bleed cover
            <img src={cover.src} alt={cover.alt} className="absolute inset-0 size-full object-cover" />
          ) : (
            <>
              <span className="absolute inset-0 bg-linear-160 from-cover-1 via-cover-2 via-45% to-cover-3" />
              <span aria-hidden className="absolute -top-[30px] -right-10 size-[170px] rounded-full border-[1.5px] border-dashed border-white/45" />
            </>
          )}
          <span className="absolute inset-0 bg-linear-to-b from-ink/0 from-30% to-ink/60" />
          <span className="absolute bottom-3 left-3.5 flex flex-col text-white">
            <span className="text-24 font-bold tracking-h2">
              {match ? (
                <>
                  <span aria-hidden>{match[1]}</span> {match[2]}
                </>
              ) : (
                coverTitle
              )}
            </span>
            <span className="text-14 font-medium">{coverSub}</span>
          </span>
          <AvatarStack
            className="absolute right-3 bottom-3"
            size={26}
            overlap={8}
            ring="white"
            max={4}
            avatars={members.map((u) => ({ name: u.name, src: u.avatar, tone: u.tone }))}
          />
        </span>
        <span className="flex items-center gap-2.5 px-3.5 py-3">
          <span className="flex flex-1 flex-col gap-px">
            <span className="text-16 leading-[1.3] font-semibold tracking-body">{name}</span>
            <span className={cn("text-13", statusTone === "go" ? "font-semibold text-go" : "tracking-caption text-muted")}>
              {status}
            </span>
          </span>
          <ChevronRight className="size-4 text-faint" strokeWidth={2.4} />
        </span>
      </Link>
    </Card>
  );
}
