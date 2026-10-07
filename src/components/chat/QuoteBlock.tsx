type QuoteBlockProps = { author: string; text: string };

/** Reply quote inside my (black) bubble: "Arjun · in, but only after 6pm fri 😭". */
export function QuoteBlock({ author, text }: QuoteBlockProps) {
  return (
    <div className="rounded-lg border-l-[3px] border-go-line bg-white/14 px-2.5 py-1.5 text-13 leading-[1.35]">
      {author} · {text}
    </div>
  );
}
