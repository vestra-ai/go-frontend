import Link from "next/link";
import { ArrowLeft, Share } from "@/components/icons/generated";
import { AvatarStack } from "@/components/common/AvatarStack";
import { GlassIconButton } from "@/components/common/GlassIconButton";
import { Photo } from "@/components/common/Photo";
import type { User } from "@/data/types";

export type TripHeroMedia = { kind: "image"; src: string; alt: string } | { kind: "gradient" };
export interface TripMetaLine {
  emoji: string;
  text: string;
}

type TripHeroProps = {
  hero: TripHeroMedia;
  title: string;
  titleEmoji?: string;
  meta: TripMetaLine[];
  members: User[];
  onShare: () => void;
};

export function TripHero({ hero, title, titleEmoji, meta, members, onShare }: TripHeroProps) {
  return (
    <div className="relative h-[236px] shrink-0 overflow-hidden bg-sunset">
      {hero.kind === "gradient" ? (
        <>
          <span className="absolute inset-0 bg-[linear-gradient(160deg,var(--color-cover-1)_0%,var(--color-cover-2)_45%,var(--color-cover-3)_100%)]" />
          <span aria-hidden className="absolute -right-[60px] top-[30px] size-60 rounded-full border-[1.5px] border-dashed border-white/45" />
          <span aria-hidden className="absolute right-2.5 top-[100px] size-[100px] rounded-full border-[1.5px] border-dashed border-white/35" />
        </>
      ) : (
        <>
          <Photo
            src={hero.src}
            alt={hero.alt}
            sizes="(min-width: 450px) 450px, 100vw"
            loading="eager"
            className="absolute inset-0 size-full object-cover"
          />
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_27_63/0.25)_0%,rgb(11_27_63/0)_26%,rgb(11_27_63/0.08)_42%,rgb(11_27_63/0.4)_62%,rgb(11_27_63/0.72)_100%)]" />
        </>
      )}
      <GlassIconButton
        asChild
        label="Back"
        icon={<ArrowLeft className="size-5" />}
        className="absolute left-3.5 top-safe-hero"
      >
        <Link href="/home" />
      </GlassIconButton>
      <GlassIconButton
        label="Share trip"
        icon={<Share className="size-[18px]" />}
        onClick={onShare}
        className="absolute right-3.5 top-safe-hero"
      />
      <div className="absolute inset-x-5 bottom-[42px] flex items-end justify-between gap-3 text-white">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="flex items-center gap-1 text-40 font-bold tracking-display">
            {titleEmoji && (
              <span aria-hidden className="w-[30px] text-[30px]">
                {titleEmoji}
              </span>
            )}
            {title}
          </h1>
          <div className="mt-1 flex flex-col gap-0.5">
            {meta.map((line) => (
              <p key={line.text} className="flex gap-1.5 text-15 font-medium leading-[1.35] whitespace-nowrap">
                <span aria-hidden className="inline-block w-[18px] text-15">
                  {line.emoji}
                </span>
                {line.text}
              </p>
            ))}
          </div>
        </div>
        <div className="pb-0.5">
          <AvatarStack
            className="pl-2"
            size={28}
            overlap={8}
            ring="white"
            avatars={members.map((u) => ({ name: u.name, src: u.avatar, tone: u.tone }))}
          />
        </div>
      </div>
    </div>
  );
}
