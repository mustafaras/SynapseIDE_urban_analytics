/**
 * Symbology manager — applies classification schemes and colour palettes
 * to GeoJSON features, producing deck.gl-compatible style properties and
 * a legend description.
 */

import {
  type ClassificationResult,
  equalInterval,
  headTailBreaks,
  naturalBreaks,
  prettyBreaks,
  quantile,
  standardDeviation,
} from './ClassificationSchemes';
import { getDivergingPalette, getSequentialPalette } from './ColorBrewerIntegration';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SchemeType =
  | 'naturalBreaks'
  | 'quantile'
  | 'equalInterval'
  | 'standardDeviation'
  | 'prettyBreaks'
  | 'headTailBreaks';

export type SymbologyType = 'choropleth' | 'graduatedSymbol' | 'dotDensity';

export type PaletteType = 'sequential' | 'diverging';

export interface LegendEntry {
  label: string;
  color: string;
  /** Only set for graduated-symbol symbology. */
  radius?: number;
}

export interface StyledFeature {
  /** Original GeoJSON feature with added __style property. */
  type: 'Feature';
  geometry: GeoJSON.Geometry;
  properties: Record<string, unknown> & {
    __style: DeckStyle;
  };
}

export interface DeckStyle {
  getFillColor: [number, number, number, number];
  getLineColor: [number, number, number, number];
  getRadius?: number;
  getElevation?: number;
}

export interface ClassifiedResult {
  features: StyledFeature[];
  legend: LegendEntry[];
  classification: ClassificationResult;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CLASSIFIERS: Record<
  SchemeType,
  (values: number[], n: number) => ClassificationResult
> = {
  naturalBreaks,
  quantile,
  equalInterval,
  standardDeviation,
  prettyBreaks,
  headTailBreaks: (values) => headTailBreaks(values),
};

function parseRGB(color: string): [number, number, number] {
  /* Handle "rgb(r,g,b)" */
  const rgbMatch = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(color);
  if (rgbMatch) {
    return [+rgbMatch[1]!, +rgbMatch[2]!, +rgbMatch[3]!];
  }
  /* Handle "#rrggbb" */
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  return [128, 128, 128]; // fallback grey
}

function classIndex(value: number, breaks: number[]): number {
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]!) return i;
  }
  return breaks.length - 1;
}

function fetchPalette(
  palette: string,
  numColors: number,
  paletteType: PaletteType,
): string[] {
  return paletteType === 'diverging'
    ? getDivergingPalette(palette, numColors)
    : getSequentialPalette(palette, numColors);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Apply a classification scheme and palette to a GeoJSON FeatureCollection,
 * returning styled features with deck.gl-compatible `__style` properties
 * and a legend.
 */
export function applyClassification(
  geojson: GeoJSON.FeatureCollection,
  property: string,
  scheme: SchemeType,
  numClasses: number,
  palette: string,
  options: {
    symbology?: SymbologyType;
    paletteType?: PaletteType;
    opacity?: number;
    minRadius?: number;
    maxRadius?: number;
  } = {},
): ClassifiedResult {
  const {
    symbology = 'choropleth',
    paletteType = 'sequential',
    opacity = 200,
    minRadius = 4,
    maxRadius = 40,
  } = options;

  /* Extract numeric values for classification. */
  const values: number[] = [];
  for (const f of geojson.features) {
    const v = f.properties?.[property];
    if (typeof v === 'number' && Number.isFinite(v)) values.push(v);
  }

  if (values.length === 0) {
    return { features: [], legend: [], classification: { breaks: [], classRanges: [] } };
  }

  const classify = CLASSIFIERS[scheme];
  const classification = classify(values, numClasses);
  const { breaks, classRanges } = classification;
  const colors = fetchPalette(palette, breaks.length, paletteType);

  /* Build legend --------------------------------------------------- */
  const legend: LegendEntry[] = classRanges.map((r, i) => ({
    label: `${r.min.toFixed(2)} – ${r.max.toFixed(2)}`,
    color: colors[i] ?? '#888',
    ...(symbology === 'graduatedSymbol'
      ? { radius: minRadius + ((maxRadius - minRadius) * i) / Math.max(breaks.length - 1, 1) }
      : {}),
  }));

  /* Style features ------------------------------------------------- */
  const valMin = Math.min(...values);
  const valMax = Math.max(...values);
  const valRange = valMax - valMin || 1;

  const features: StyledFeature[] = geojson.features.map((f) => {
    const raw = f.properties?.[property];
    const val = typeof raw === 'number' && Number.isFinite(raw) ? raw : valMin;
    const ci = classIndex(val, breaks);
    const rgb = parseRGB(colors[ci] ?? '#888');

    let style: DeckStyle;

    switch (symbology) {
      case 'graduatedSymbol': {
        const radius =
          minRadius + ((val - valMin) / valRange) * (maxRadius - minRadius);
        style = {
          getFillColor: [rgb[0], rgb[1], rgb[2], opacity],
          getLineColor: [0, 0, 0, 180],
          getRadius: radius,
        };
        break;
      }
      case 'dotDensity': {
        /* Dot density: elevation encodes value; colour is constant. */
        style = {
          getFillColor: [rgb[0], rgb[1], rgb[2], opacity],
          getLineColor: [0, 0, 0, 80],
          getElevation: val,
        };
        break;
      }
      default: {
        /* choropleth */
        style = {
          getFillColor: [rgb[0], rgb[1], rgb[2], opacity],
          getLineColor: [60, 60, 60, 200],
        };
      }
    }

    return {
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: { ...f.properties, __style: style },
    };
  });

  return { features, legend, classification };
}
