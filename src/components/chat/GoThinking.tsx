import { chat as copy } from "@/data/seed/copy";
import { Bubble } from "./Bubble";

const DOT_STEP_MS = 160;

/** Go's bubble with three rising dots, the last row of the thread while Go's `typing` frame is on (CONTRACT-APP §3.1). */
export function GoThinking() {
  return (
    <Bubble author="go" enter>
      <span role="status" className="flex h-[22px] items-center gap-1">
        <span className="sr-only">{copy.goThinking}</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className="size-1.5 animate-think rounded-full bg-go [animation-delay:var(--d)]"
            style={{ "--d": `${i * DOT_STEP_MS}ms` } as React.CSSProperties}
          />
        ))}
      </span>
    </Bubble>
  );
}
