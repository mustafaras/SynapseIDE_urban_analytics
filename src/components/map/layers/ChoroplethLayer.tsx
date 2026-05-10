/**
 * Choropleth (thematic) map layer — GeoJSON polygons coloured by property value.
 *
 * Supports natural breaks (Jenks), quantile, and equal-interval classification.
 */
import { GeoJsonLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { FeatureCollection } from 'geojson';
import {
  getSequentialScale,
  type InterpolatorName,
  type RGBA,
} from '../utils/colorScales';

/* ------------------------------------------------------------------ */
/*  Classification                                                     */
/* ------------------------------------------------------------------ */

export type ClassificationMethod = 'jenks' | 'quantile' | 'equal-interval';

export interface ClassBreaks {
  breaks: number[];
  min: number;
  max: number;
}

/** Equal-interval classification. */
function equalIntervalBreaks(values: number[], n: number): ClassBreaks {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / n || 1;
  const breaks = Array.from({ length: n - 1 }, (_, i) => min + step * (i + 1));
  return { breaks, min, max };
}

/** Quantile classification. */
function quantileBreaks(values: number[], n: number): ClassBreaks {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  const breaks = Array.from({ length: n - 1 }, (_, i) => {
    const idx = Math.floor((len * (i + 1)) / n);
    return sorted[Math.min(idx, len - 1)];
  });
  return { breaks, min: sorted[0], max: sorted[len - 1] };
}

/** Jenks natural breaks (Fisher-Jenks optimisation). */
function jenksBreaks(values: number[], n: number): ClassBreaks {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  if (len <= n) {
    return { breaks: sorted.slice(1), min: sorted[0], max: sorted[len - 1] };
  }

  const mat1: number[][] = Array.from({ length: len + 1 }, () =>
    Array<number>(n + 1).fill(0),
  );
  const mat2: number[][] = Array.from({ length: len + 1 }, () =>
    Array<number>(n + 1).fill(Infinity),
  );

  for (let i = 1; i <= n; i++) {
    mat1[1][i] = 1;
    mat2[1][i] = 0;
  }

  for (let l = 2; l <= len; l++) {
    let ssd = 0;
    let sum = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const val = sorted[l - m];
      w++;
      sum += val;
      ssd += val * val;
      const v = ssd - (sum * sum) / w;
      if (m < l) {
        for (let j = 2; j <= n; j++) {
          const cost = v + mat2[l - m][j - 1];
          if (cost < mat2[l][j]) {
            mat1[l][j] = l - m + 1;
            mat2[l][j] = cost;
          }
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = ssd - (sum * sum) / w;
  }

  const breaks: number[] = [];
  let k = len;
  for (let j = n; j >= 2; j--) {
    breaks.unshift(sorted[mat1[k][j] - 1]);
    k = mat1[k][j] - 1;
  }
  return { breaks, min: sorted[0], max: sorted[len - 1] };
}

/** Compute class-break boundaries using the chosen algorithm. */
export function classify(
  values: number[],
  method: ClassificationMethod,
  numClasses: number,
): ClassBreaks {
  if (values.length === 0) return { breaks: [], min: 0, max: 0 };
  switch (method) {
    case 'equal-interval':
      return equalIntervalBreaks(values, numClasses);
    case 'quantile':
      return quantileBreaks(values, numClasses);
    case 'jenks':
      return jenksBreaks(values, numClasses);
  }
}

/* ------------------------------------------------------------------ */
/*  Legend                                                              */
/* ------------------------------------------------------------------ */

export interface LegendItem {
  label: string;
  color: RGBA;
  min: number;
  max: number;
}

/** Build legend entries from class breaks and a colour-scale function. */
export function generateChoroplethLegend(
  classBreaks: ClassBreaks,
  scaleFn: (v: number) => RGBA,
): LegendItem[] {
  const { breaks, min, max } = classBreaks;
  const bounds = [min, ...breaks, max];
  return Array.from({ length: bounds.length - 1 }, (_, i) => {
    const lo = bounds[i];
    const hi = bounds[i + 1];
    return {
      label: `${lo.toFixed(1)} – ${hi.toFixed(1)}`,
      color: scaleFn((lo + hi) / 2),
      min: lo,
      max: hi,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Config & factory                                                   */
/* ------------------------------------------------------------------ */

export interface ChoroplethConfig {
  id: string;
  data: FeatureCollection;
  /** Property name to symbolise. */
  property: string;
  colorScale?: InterpolatorName;
  classification?: ClassificationMethod;
  numClasses?: number;
  opacity?: number;
  visible?: boolean;
  selectedFeatureId?: string | number | null;
  onHover?: (info: PickingInfo) => void;
  onClick?: (info: PickingInfo) => void;
}

/** Create a deck.gl GeoJsonLayer configured as a choropleth. */
export function createChoroplethLayer(config: ChoroplethConfig) {
  const {
    id,
    data,
    property,
    colorScale = 'YlOrRd',
    classification = 'quantile',
    numClasses = 5,
    opacity = 0.8,
    visible = true,
    selectedFeatureId = null,
    onHover,
    onClick,
  } = config;

  const values = data.features
    .map((f) => f.properties?.[property])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const cb = classify(values, classification, numClasses);
  const scaleFn = getSequentialScale(colorScale, [cb.min, cb.max]);
  const NO_DATA: RGBA = [200, 200, 200, 100];

  return new GeoJsonLayer({
    id,
    data,
    visible,
    opacity,
    pickable: true,
    stroked: true,
    filled: true,
    lineWidthMinPixels: 1,
    getLineColor: [80, 80, 80, 160],
    getFillColor: (f: any) => {
      const v = f.properties?.[property];
      return typeof v === 'number' && Number.isFinite(v) ? scaleFn(v) : NO_DATA;
    },
    getLineWidth: (f: any) =>
      selectedFeatureId != null &&
      (f.properties?.id ?? f.id) === selectedFeatureId
        ? 3
        : 1,
    updateTriggers: {
      getFillColor: [property, colorScale, classification, numClasses],
      getLineWidth: [selectedFeatureId],
    },
    ...(onHover ? { onHover } : {}),
    ...(onClick ? { onClick } : {}),
  });
}
