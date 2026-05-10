/**
 * Street-network layer — PathLayer for edges coloured / sized by attribute.
 */
import { PathLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import {
  getSequentialScale,
  type InterpolatorName,
  type RGBA,
} from '../utils/colorScales';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NetworkEdge {
  /** Ordered vertex coordinates [[lon, lat], …] */
  path: [number, number][];
  /** Arbitrary edge attributes (betweenness, speed, LTS, …) */
  properties: Record<string, unknown>;
}

export interface NetworkConfig {
  id: string;
  data: NetworkEdge[];
  /** Property mapped to colour. */
  colorAttribute?: string;
  colorScale?: InterpolatorName;
  /** Property mapped to width. */
  widthAttribute?: string;
  /** [min, max] width in pixels. */
  widthRange?: [number, number];
  /** Fallback colour when no attribute is set. */
  defaultColor?: RGBA;
  opacity?: number;
  visible?: boolean;
  onHover?: (info: PickingInfo) => void;
  onClick?: (info: PickingInfo) => void;
}

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

/** Create a deck.gl PathLayer for street-network visualisation. */
export function createNetworkLayer(config: NetworkConfig) {
  const {
    id,
    data,
    colorAttribute,
    colorScale = 'Viridis',
    widthAttribute,
    widthRange = [1, 6],
    defaultColor = [100, 100, 100, 200] as RGBA,
    opacity = 0.9,
    visible = true,
    onHover,
    onClick,
  } = config;

  /* Pre-compute value ranges for scaling */
  let colorFn: ((v: number) => RGBA) | null = null;
  if (colorAttribute) {
    const vals = data
      .map((e) => Number(e.properties[colorAttribute]))
      .filter(Number.isFinite);
    if (vals.length) {
      colorFn = getSequentialScale(colorScale, [
        Math.min(...vals),
        Math.max(...vals),
      ]);
    }
  }

  const [wMin, wMax] = widthRange;
  let widthFn: ((v: number) => number) | null = null;
  if (widthAttribute) {
    const vals = data
      .map((e) => Number(e.properties[widthAttribute]))
      .filter(Number.isFinite);
    if (vals.length) {
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      const range = hi - lo || 1;
      widthFn = (v: number) => wMin + (wMax - wMin) * ((v - lo) / range);
    }
  }

  return new PathLayer({
    id,
    data,
    visible,
    opacity,
    pickable: true,
    widthUnits: 'pixels' as const,
    widthMinPixels: 1,
    getPath: (d: any) => d.path,
    getColor: (d: any) => {
      if (colorFn && colorAttribute) {
        const v = Number(d.properties[colorAttribute]);
        return Number.isFinite(v) ? colorFn(v) : defaultColor;
      }
      return defaultColor;
    },
    getWidth: (d: any) => {
      if (widthFn && widthAttribute) {
        const v = Number(d.properties[widthAttribute]);
        return Number.isFinite(v) ? widthFn(v) : wMin;
      }
      return 2;
    },
    updateTriggers: {
      getColor: [colorAttribute, colorScale],
      getWidth: [widthAttribute, widthRange],
    },
    ...(onHover ? { onHover } : {}),
    ...(onClick ? { onClick } : {}),
  });
}
