import { GoaMap } from "@/components/icons/custom/GoaMap";
import { Card } from "@/components/ui/card";
import type { MapArea, MapAudience } from "@/data/seed/mapArt";
import { MAP_COPY } from "@/data/seed/map";
import type { MapSpot, SpotKey } from "@/data/types";
import { MapDetailCard, type ResolvedMapCard } from "./MapDetailCard";
import { MapHintPill } from "./MapHintPill";
import { MapScopeSwitch } from "./MapScopeSwitch";
import { MapSpotButton } from "./MapSpotButton";

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
  return (
    <Card variant="shadow" radius="2xl" className="relative isolate aspect-[388/480] w-full overflow-hidden bg-map-land">
      <GoaMap area={area} audience={audience} className="absolute inset-0" />
      {spots.map((spot, i) => (
        <MapSpotButton
          key={`${spot.key}-${i}`}
          x={spot.x}
          y={spot.y}
          label={spot.label}
          selected={spot.key === sel}
          onPress={() => onSelect(spot.key)}
        />
      ))}
      <MapScopeSwitch value={area} onChange={onArea} />
      {card ? <MapDetailCard card={card} onClose={onClose} onAction={onAction} /> : <MapHintPill text={MAP_COPY.hint} />}
    </Card>
  );
}
