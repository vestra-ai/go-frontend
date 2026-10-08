import { useId } from "react";

import type { SpotKey } from "@/data/types";
import { BLEED_X, BLEED_Y, MAP_ART, type MapArea, type MapAudience, type MapEl, type MapImg, type MapTone } from "@/data/seed/mapArt";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

export interface GoaMapProps {
  area: MapArea;
  audience: MapAudience;
  className?: string;
  /** Photo ids drawn with the selected ring, in the photo's own layer (a photo behind another keeps its ring behind it). */
  ringed?: ReadonlySet<string>;
  /** Makes each dotted route tappable (a wide invisible stroke along it) and selects that route. */
  onRouteSelect?: (key: SpotKey) => void;
  /** Extra SVG nodes painted last, inside the <svg>. */
  children?: React.ReactNode;
}

// Static class maps written out in full so Tailwind scans the literals.
const FILL: Record<MapTone, string> = {
  "map-sea": "fill-map-sea",
  "map-land": "fill-map-land",
  "map-road": "fill-map-road",
  "map-label": "fill-map-label",
  muted: "fill-muted",
  faint: "fill-faint",
  ink: "fill-ink",
  go: "fill-go",
  info: "fill-info",
  teal: "fill-teal",
  "amber-2": "fill-amber-2",
  white: "fill-white",
};

const STROKE: Record<MapTone, string> = {
  "map-sea": "",
  "map-land": "",
  "map-road": "stroke-map-road",
  "map-label": "",
  muted: "",
  faint: "",
  ink: "stroke-ink",
  go: "stroke-go",
  info: "stroke-info",
  teal: "stroke-teal",
  "amber-2": "stroke-amber-2",
  white: "",
};

const IMG: Record<MapImg, string> = {
  aarav: assets.avatars.aarav.src,
  arjun: assets.avatars.arjun.src,
  rahul: assets.avatars.rahul.src,
  priya: assets.avatars.priya.src,
  goaPin: assets.photos.goaPin.src,
  chapora: assets.photos.chaporaFort.src,
};

function Badge({ cx, cy, ty, r, emoji }: { cx: number; cy: number; ty: number; r: number; emoji: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="fill-white stroke-ink/12" />
      <text x={cx} y={ty} textAnchor="middle" fontSize={r}>
        {emoji}
      </text>
    </g>
  );
}

function renderEl(
  el: MapEl,
  key: number,
  uid: string,
  ringed?: ReadonlySet<string>,
  onRouteSelect?: (key: SpotKey) => void,
) {
  switch (el.t) {
    case "rect":
      // Painted well past the viewBox: the art bleeds so the map can be shifted (centred) without showing an edge.
      return <rect key={key} x={-BLEED_X} y={-BLEED_Y} width={388 + 2 * BLEED_X} height={480 + 2 * BLEED_Y} className={FILL[el.tone]} />;
    case "shape":
      return <path key={key} d={el.d} className={FILL[el.tone]} />;
    case "road":
      return <path key={key} d={el.d} className="stroke-map-road" strokeWidth={el.w} fill="none" />;
    case "route":
      return (
        <g key={key}>
          <path
            d={el.d}
            className={STROKE[el.tone]}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="0.1 7"
            fill="none"
          />
          {onRouteSelect && (
            // The dots are too thin to hit: an invisible stroke along the same path takes the tap. The route's badge
            // button is the keyboard / screen-reader way in, so this one is hidden from AT.
            <path
              d={el.d}
              aria-hidden
              fill="none"
              stroke="transparent"
              strokeWidth={26}
              pointerEvents="stroke"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation(); // a route tap is not a tap on the bare map
                onRouteSelect(el.key);
              }}
            />
          )}
          <Badge cx={el.badge.cx} cy={el.badge.cy} ty={el.badge.ty} r={13} emoji={el.badge.emoji} />
        </g>
      );
    case "hub":
      return <Badge key={key} cx={el.cx} cy={el.cy} ty={el.ty} r={15} emoji={el.emoji} />;
    case "photo": {
      const cid = `${uid}-${el.id}`;
      return (
        <g key={key}>
          <clipPath id={cid}>
            <circle cx={el.cx} cy={el.cy} r={el.ri} />
          </clipPath>
          <circle cx={el.cx} cy={el.cy} r={el.r} className={el.ring === "go" ? "fill-go" : "fill-white"} />
          <image
            href={IMG[el.img]}
            x={el.cx - el.ri}
            y={el.cy - el.ri}
            width={2 * el.ri}
            height={2 * el.ri}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${cid})`}
          />
          {ringed?.has(el.id) && (
            <circle cx={el.cx} cy={el.cy} r={el.r + 1.5} fill="none" strokeWidth={3} className="stroke-go" />
          )}
        </g>
      );
    }
    case "dot":
      return <circle key={key} cx={el.cx} cy={el.cy} r={3} className="fill-faint" />;
    case "label":
      return (
        <text
          key={key}
          x={el.x}
          y={el.y}
          textAnchor={el.anchor}
          fontSize={el.size}
          fontWeight={700}
          letterSpacing={0.6}
          className={FILL[el.tone]}
        >
          {el.text}
        </text>
      );
  }
}

export function GoaMap({ area, audience, ringed, onRouteSelect, className, children }: GoaMapProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const art = MAP_ART[area];
  return (
    <svg
      viewBox="0 0 388 480"
      role="img"
      aria-label={art.ariaLabel}
      className={cn("block size-full overflow-visible font-sans", className)}
    >
      {art.els.filter((e) => e.aud === "both" || e.aud === audience).map((e, i) => renderEl(e, i, uid, ringed, onRouteSelect))}
      {children}
    </svg>
  );
}
