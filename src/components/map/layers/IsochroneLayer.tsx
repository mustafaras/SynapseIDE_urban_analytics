/**
 * Isochrone layer — renders travel-time contour polygons with graduated colour.
 */
import { GeoJsonLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { FeatureCollection } from 'geojson';
import type { RGBA } from '../utils/colorScales';

/* ------------------------------------------------------------------ */
/*  Config & factory                                                   */
/* ------------------------------------------------------------------ */

export interface IsochroneConfig {
  id: string;
  data: FeatureCollection;
  /** Feature property containing the time value in minutes (default 'time'). */
  timeProperty?: string;
  /** Maximum time in minutes — used for colour-gradient normalisation (default 60). */
  maxMinutes?: number;
  opacity?: number;
  visible?: boolean;
  onHover?: (info: PickingInfo) => void;
}

/**
 * Green (close) → Yellow → Red (far) colour interpolation by time ratio.
 * @param ratio 0 = nearest contour, 1 = farthest
 */
function timeColor(ratio: number): RGBA {
  const r = Math.round(255 * Math.min(1, ratio * 2));
  const g = Math.round(255 * Math.min(1, 2 - ratio * 2));
  return [r, g, 40, 180];
}

/** Create a deck.gl GeoJsonLayer for isochrone polygons. */
export function createIsochroneLayer(config: IsochroneConfig) {
  const {
    id,
    data,
    timeProperty = 'time',
    maxMinutes = 60,
    opacity = 0.6,
    visible = true,
    onHover,
  } = config;

  const NO_DATA: RGBA = [180, 180, 180, 80];

  return new GeoJsonLayer({
    id,
    data,
    visible,
    opacity,
    pickable: true,
    stroked: true,
    filled: true,
    lineWidthMinPixels: 1,
    getLineColor: [60, 60, 60, 120],
    getFillColor: (f: any) => {
      const t = f.properties?.[timeProperty];
      if (typeof t !== 'number') return NO_DATA;
      return timeColor(Math.min(t / maxMinutes, 1));
    },
    updateTriggers: {
      getFillColor: [timeProperty, maxMinutes],
    },
    ...(onHover ? { onHover } : {}),
  });
}
