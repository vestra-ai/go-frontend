import { cn } from "@/lib/utils";

export interface QrBitmapProps {
  /** 25 rows of 25 cells: strings of "#" (dark) / anything else (light), or booleans. */
  rows: readonly (string | readonly boolean[])[];
  size?: number;
  className?: string;
}

export function QrBitmap({ rows, size = 150, className }: QrBitmapProps) {
  return (
    <svg
      viewBox="-1 -1 27 27"
      width={size}
      height={size}
      role="img"
      aria-label="Boarding pass QR code"
      shapeRendering="crispEdges"
      className={cn("block bg-white", className)}
    >
      <g className="fill-ink">
        {rows.flatMap((row, y) =>
          Array.from({ length: 25 }, (_, x) =>
            (typeof row === "string" ? row[x] === "#" : row[x] === true) ? (
              <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
            ) : null,
          ),
        )}
      </g>
    </svg>
  );
}
