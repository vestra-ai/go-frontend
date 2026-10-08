"use client";

import { useState } from "react";
import { GoaMap } from "@/components/icons/custom/GoaMap";
import { Card } from "@/components/ui/card";
import type { MapArea, MapAudience } from "@/data/seed/mapArt";
import { MAP_COPY } from "@/data/seed/map";
import type { MapSpot, SpotKey } from "@/data/types";
import { MapDetailCard, type ResolvedMapCard } from "./MapDetailCard";
import { MapHintPill } from "./MapHintPill";
import { MapScopeSwitch } from "./MapScopeSwitch";
import { MAP_BLEED, MAP_HOME } from "@/data/seed/map";
import { MapSpotButton } from "./MapSpotButton";
import { PanZoomLayer } from "./PanZoomLayer";

export interface MapCardProps {
  area: MapArea;
  audience: MapAudience;
  sel: SpotKey | null;
  /** Spots already filtered to the current area and audience, in MAP_SPOTS order. */
  spots: MapSpot[];
  card: ResolvedMapCard | null;
  onArea: (area: MapArea) => void;
  onSelect: (key: SpotKey) => void;
  onClose: () => void;
  onAction: () => void;
}

/** Itinerary map: SVG art, tappable spots, area switch, then the hint pill or the selected spot's card. */
export function MapCard({ area, audience, sel, spots, card, onArea, onSelect, onClose, onAction }: MapCardProps) {
  // Selected avatar spots ring their photo in the art, so a photo behind another keeps its ring behind it too.
  // Counts the taps on spots / routes: each one asks the detail card to scroll itself into view (a page that merely
  // opens with a `?sel=` spot does not).
  const [taps, setTaps] = useState(0);
  const select = (key: SpotKey) => {
    setTaps((n) => n + 1);
    onSelect(key);
  };
  const ringed = new Set(spots.flatMap((s) => (s.photo && s.key === sel ? [s.photo] : [])));
  return (
    <Card variant="shadow" radius="2xl" className="relative isolate aspect-[388/480] w-full overflow-hidden bg-map-land">
      {/* Art and pins share one layer, so they pan and zoom together; the switch and cards stay put above it. */}
      <PanZoomLayer home={MAP_HOME[audience]} bleed={MAP_BLEED} homeKey={`${area}-${audience}`} zoomInLabel={MAP_COPY.zoomIn} zoomOutLabel={MAP_COPY.zoomOut} onBackgroundTap={onClose}>
        <GoaMap area={area} audience={audience} ringed={ringed} onRouteSelect={select} className="absolute inset-0" />
        {spots.map((spot, i) => (
          <MapSpotButton
            key={`${spot.key}-${i}`}
            x={spot.x}
            y={spot.y}
            label={spot.label}
            selected={spot.key === sel}
            ringless={spot.photo !== undefined}
            onPress={() => select(spot.key)}
          />
        ))}
      </PanZoomLayer>
      <MapScopeSwitch value={area} onChange={onArea} />
      {card ? <MapDetailCard card={card} revealKey={taps} onClose={onClose} onAction={onAction} /> : <MapHintPill text={MAP_COPY.hint} />}
    </Card>
  );
}
