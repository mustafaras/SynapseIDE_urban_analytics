/**
 * Heatmap layer — aggregates point data into a continuous density surface.
 */
import { HeatmapLayer as DeckHeatmapLayer } from '@deck.gl/aggregation-layers';
import type { FeatureCollection, Point } from 'geojson';

/* ------------------------------------------------------------------ */
/*  Config & factory                                                   */
/* ------------------------------------------------------------------ */

export interface HeatmapConfig {
  id: string;
  data: FeatureCollection<Point>;
  /** Property used as weight. Falls back to 1 per point when omitted. */
  weightProperty?: string;
  /** Radius in pixels (default 30). */
  radiusPixels?: number;
  /** Intensity multiplier (default 1). */
  intensity?: number;
  /** Minimum weight threshold 0-1 (default 0.05). */
  threshold?: number;
  /** Colour ramp: array of [r, g, b] from low → high density. */
  colorRange?: [number, number, number][];
  opacity?: number;
  visible?: boolean;
}

const DEFAULT_COLOR_RANGE: [number, number, number][] = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78],
];

/** Create a deck.gl HeatmapLayer from GeoJSON point data. */
export function createHeatmapLayer(config: HeatmapConfig) {
  const {
    id,
    data,
    weightProperty,
    radiusPixels = 30,
    intensity = 1,
    threshold = 0.05,
    colorRange = DEFAULT_COLOR_RANGE,
    opacity = 1,
    visible = true,
  } = config;

  return new DeckHeatmapLayer({
    id,
    data: data.features,
    visible,
    opacity,
    pickable: false,
    getPosition: (d: any) => d.geometry.coordinates as [number, number],
    getWeight: (d: any) => {
      if (!weightProperty) return 1;
      const w = d.properties?.[weightProperty];
      return typeof w === 'number' && Number.isFinite(w) ? w : 0;
    },
    radiusPixels,
    intensity,
    threshold,
    colorRange,
    aggregation: 'SUM',
  });
}
