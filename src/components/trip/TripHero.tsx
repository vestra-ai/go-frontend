"use client";

import { useLayoutEffect, useRef } from "react";
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

/** The name's sizes, largest first: it takes the first one it fits on one line at, and an ellipsis only past the last. */
const TITLE_PX = [40, 32, 24, 20];

/**
 * Sizes the name to its one line, before the first paint: 40px when it fits the hero's width, smaller for a longer
 * name. Measured, not counted: letters differ too much in width. Fitted again when the hero's width changes and when
 * the web font arrives (it is not as wide as its fallback).
 */
function useTitleFit(title: string) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const row = el?.parentElement;
    if (!el || !row) return;
    let live = true;
    const fit = () => {
      if (!live) return;
      for (const px of TITLE_PX) {
        el.style.fontSize = `${px}px`;
        if (el.scrollWidth <= el.clientWidth) break;
      }
    };
    fit();
    // The row, not the name: the row is as wide as the hero whatever size the name is.
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    void document.fonts?.ready.then(fit);
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [title]);
  return ref;
}

/** One meta line; words that do not fit end in an ellipsis and never run under what is beside them. */
function MetaLine({ line }: { line: TripMetaLine }) {
  return (
    <p className="flex min-w-0 gap-1.5 text-15 font-medium leading-[1.35]">
      <span aria-hidden className="inline-block w-[18px] shrink-0 text-15">
        {line.emoji}
      </span>
      <span className="truncate">{line.text}</span>
    </p>
  );
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
  const titleRef = useTitleFit(title);
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
      <div className="absolute inset-x-5 bottom-[42px] flex flex-col gap-0.5 text-white">
        {/* The name has the hero's full width and always one 40px-tall line, as its skeleton does: beside the crew it
            had half the width, wrapped onto a second line, and the page jumped when it replaced the skeleton. */}
        <h1 className="flex h-10 items-center gap-1 font-bold tracking-display">
          {titleEmoji && (
            <span aria-hidden className="w-[30px] shrink-0 text-[30px] leading-none">
              {titleEmoji}
            </span>
          )}
          {/* Its own line height: at the title's 1, `truncate` would clip the descenders. */}
          <span ref={titleRef} className="min-w-0 flex-1 truncate text-40 leading-[1.2]">
            {title}
          </span>
        </h1>
        {/* The crew sits beside the last line only ("7 joined", short). Beside both, the place-and-dates line ran under
            the avatars once the trip had more than a few people. */}
        <div className="mt-1 flex flex-col gap-0.5">
          {meta.slice(0, -1).map((line) => (
            <MetaLine key={line.text} line={line} />
          ))}
          <div className="flex min-h-7 items-center justify-between gap-3">
            {meta.slice(-1).map((line) => (
              <MetaLine key={line.text} line={line} />
            ))}
            {/* At most four faces, then "+N", as on the home page's trip cards (the Server sends those four). */}
            <AvatarStack
              className="ml-auto shrink-0 pl-2 text-12"
              size={28}
              overlap={10}
              max={4}
              ring="white"
              avatars={members.map((u) => ({ name: u.name, src: u.avatar, tone: u.tone }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
