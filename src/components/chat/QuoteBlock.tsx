type QuoteBlockProps = { author: string; text: string };

/** Reply quote inside my bubble: "Arjun · in, but only after 6pm fri 😭". A long message is cut after three lines. */
export function QuoteBlock({ author, text }: QuoteBlockProps) {
  return (
    <div className="rounded-lg border-l-[3px] border-mine-line bg-ink/6 px-2.5 py-1.5 text-13 leading-[1.35] wrap-anywhere">
      {/* The clamp is on an inner box: on the padded one, the fourth line shows in the bottom padding. */}
      <span className="line-clamp-3">
        {author} · {text}
      </span>
    </div>
  );
}
