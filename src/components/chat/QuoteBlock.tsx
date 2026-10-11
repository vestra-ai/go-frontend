import { cn } from "@/lib/utils";

type QuoteBlockProps = {
  /** Empty for a system message, and for a stand-in. */
  author: string;
  text: string;
  /** Tap: the thread goes to the quoted message. */
  onOpen?: () => void;
  /** The words stand in for a message the thread has not loaded: drawn like "Message deleted". */
  standIn?: boolean;
};

const blockClass = "rounded-lg border-l-[3px] border-mine-line bg-ink/6 px-2.5 py-1.5 text-13 leading-[1.35] wrap-anywhere";

/** Reply quote inside a bubble: "Arjun · in, but only after 6pm fri 😭". A long message is cut after three lines. */
export function QuoteBlock({ author, text, onOpen, standIn = false }: QuoteBlockProps) {
  // The clamp is on an inner box: on the padded one, the fourth line shows in the bottom padding.
  const line = <span className={cn("line-clamp-3", standIn && "text-muted italic")}>{author ? `${author} · ${text}` : text}</span>;
  if (!onOpen) return <div className={blockClass}>{line}</div>;
  return (
    <button type="button" className={cn(blockClass, "cursor-pointer text-left transition-opacity duration-160 active:opacity-60")} onClick={onOpen}>
      {line}
    </button>
  );
}
