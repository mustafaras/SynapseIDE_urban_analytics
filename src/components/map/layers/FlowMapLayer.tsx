/**
 * Flow-map layer — arc-based origin-destination flow visualisation.
 */
import { ArcLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import {
  getSequentialScale,
  type InterpolatorName,
} from '../utils/colorScales';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FlowRecord {
  origin: [number, number]; // [lon, lat]
  destination: [number, number]; // [lon, lat]
  volume: number;
  [key: string]: unknown;
}

export interface FlowMapConfig {
  id: string;
  data: FlowRecord[];
  colorScale?: InterpolatorName;
  /** Min / max arc width in pixels. */
  widthRange?: [number, number];
  /** Draw arcs in both directions. */
  bidirectional?: boolean;
  opacity?: number;
  visible?: boolean;
  onHover?: (info: PickingInfo) => void;
  onClick?: (info: PickingInfo) => void;
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

/** Create a deck.gl ArcLayer for OD flows. */
export function createFlowMapLayer(config: FlowMapConfig) {
  const {
    id,
    data,
    colorScale = 'YlOrRd',
    widthRange = [1, 8],
    bidirectional = false,
    opacity = 0.7,
    visible = true,
    onHover,
    onClick,
  } = config;

  const volumes = data.map((d) => d.volume);
  const maxVol = Math.max(...volumes, 1);
  const minVol = Math.min(...volumes, 0);
  const scaleFn = getSequentialScale(colorScale, [minVol, maxVol]);
  const [wMin, wMax] = widthRange;

  const items: FlowRecord[] = bidirectional
    ? data.flatMap((d) => [
        d,
        { ...d, origin: d.destination, destination: d.origin },
      ])
    : data;

  return new ArcLayer({
    id,
    data: items,
    visible,
    opacity,
    pickable: true,
    getSourcePosition: (d: any) => d.origin,
    getTargetPosition: (d: any) => d.destination,
    getSourceColor: (d: any) => scaleFn(d.volume),
    getTargetColor: (d: any) => scaleFn(d.volume),
    getWidth: (d: any) => {
      const ratio = (d.volume - minVol) / (maxVol - minVol || 1);
      return wMin + (wMax - wMin) * ratio;
    },
    widthUnits: 'pixels' as const,
    updateTriggers: {
      getSourceColor: [colorScale],
      getTargetColor: [colorScale],
      getWidth: [widthRange],
    },
    ...(onHover ? { onHover } : {}),
    ...(onClick ? { onClick } : {}),
  });
}
