import { useId } from "react";

import { cn } from "@/lib/utils";

export interface BoardStampProps {
  ring: string;
  line1: string;
  line2: string;
  className?: string;
}

export function BoardStamp({ ring, line1, line2, className }: BoardStampProps) {
  const pid = `stamp-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width={76}
      height={76}
      viewBox="0 0 76 76"
      aria-hidden
      className={cn("font-sans text-white", className)}
    >
      <defs>
        <path id={pid} d="M38 38 m-26 0 a26 26 0 1 1 52 0 a26 26 0 1 1 -52 0" />
      </defs>
      <circle cx={38} cy={38} r={35} fill="none" stroke="currentColor" strokeWidth={1.5} />
      <circle cx={38} cy={38} r={19} fill="none" stroke="currentColor" strokeWidth={1} />
      <text fill="currentColor" fontSize={8.5} fontWeight={700} letterSpacing={2.6}>
        <textPath href={`#${pid}`}>{ring}</textPath>
      </text>
      <text x={38} y={37} textAnchor="middle" fill="currentColor" fontSize={9} fontWeight={800}>
        {line1}
      </text>
      <text x={38} y={47} textAnchor="middle" fill="currentColor" fontSize={7.5} fontWeight={600} letterSpacing={1}>
        {line2}
      </text>
    </svg>
  );
}
