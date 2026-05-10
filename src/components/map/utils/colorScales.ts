import * as chromatic from 'd3-scale-chromatic';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** [r, g, b, a] in 0-255 range */
export type RGBA = [number, number, number, number];

export type InterpolatorName =
  | 'Viridis' | 'Inferno' | 'Magma' | 'Plasma' | 'Cividis' | 'Turbo'
  | 'Warm' | 'Cool' | 'YlGnBu' | 'YlOrRd' | 'Blues' | 'Greens' | 'Oranges' | 'Reds' | 'Purples'
  | 'BrBG' | 'RdBu' | 'RdYlGn' | 'Spectral' | 'PiYG';

export type QualitativeName =
  | 'Category10' | 'Accent' | 'Dark2' | 'Paired' | 'Set1' | 'Set2' | 'Set3' | 'Tableau10';

/* ------------------------------------------------------------------ */
/*  Interpolator lookup                                                */
/* ------------------------------------------------------------------ */

const SEQUENTIAL: Record<string, (t: number) => string> = {
  Viridis: chromatic.interpolateViridis,
  Inferno: chromatic.interpolateInferno,
  Magma: chromatic.interpolateMagma,
  Plasma: chromatic.interpolatePlasma,
  Cividis: chromatic.interpolateCividis,
  Turbo: chromatic.interpolateTurbo,
  Warm: chromatic.interpolateWarm,
  Cool: chromatic.interpolateCool,
  YlGnBu: chromatic.interpolateYlGnBu,
  YlOrRd: chromatic.interpolateYlOrRd,
  Blues: chromatic.interpolateBlues,
  Greens: chromatic.interpolateGreens,
  Oranges: chromatic.interpolateOranges,
  Reds: chromatic.interpolateReds,
  Purples: chromatic.interpolatePurples,
};

const DIVERGING: Record<string, (t: number) => string> = {
  BrBG: chromatic.interpolateBrBG,
  RdBu: chromatic.interpolateRdBu,
  RdYlGn: chromatic.interpolateRdYlGn,
  Spectral: chromatic.interpolateSpectral,
  PiYG: chromatic.interpolatePiYG,
};

const QUALITATIVE: Record<string, readonly string[]> = {
  Category10: chromatic.schemeCategory10,
  Accent: chromatic.schemeAccent,
  Dark2: chromatic.schemeDark2,
  Paired: chromatic.schemePaired,
  Set1: chromatic.schemeSet1,
  Set2: chromatic.schemeSet2,
  Set3: chromatic.schemeSet3,
  Tableau10: chromatic.schemeTableau10,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Parse CSS rgb/hex string to RGBA tuple */
function cssToRGBA(css: string): RGBA {
  const m = css.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return [+m[1], +m[2], +m[3], 255];

  // hex
  let hex = css.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
    255,
  ];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Returns a function mapping a numeric value in [domain.min, domain.max] → RGBA.
 */
export function getSequentialScale(
  name: InterpolatorName,
  domain: [number, number],
): (value: number) => RGBA {
  const interpolator = SEQUENTIAL[name] ?? chromatic.interpolateViridis;
  const [min, max] = domain;
  const range = max - min || 1;
  return (v: number) => {
    const t = Math.max(0, Math.min(1, (v - min) / range));
    return cssToRGBA(interpolator(t));
  };
}

/**
 * Diverging scale centred on the midpoint of [min, max].
 */
export function getDivergingScale(
  name: InterpolatorName,
  domain: [number, number],
): (value: number) => RGBA {
  const interpolator = DIVERGING[name] ?? chromatic.interpolateRdBu;
  const [min, max] = domain;
  const range = max - min || 1;
  return (v: number) => {
    const t = Math.max(0, Math.min(1, (v - min) / range));
    return cssToRGBA(interpolator(t));
  };
}

/**
 * Returns `count` distinct RGBA colours from a qualitative scheme.
 */
export function getQualitativeScale(
  name: QualitativeName,
  count: number,
): RGBA[] {
  const scheme = QUALITATIVE[name] ?? chromatic.schemeTableau10;
  return Array.from({ length: count }, (_, i) =>
    cssToRGBA(scheme[i % scheme.length]),
  );
}

/* ------------------------------------------------------------------ */
/*  Urban-specific palettes                                            */
/* ------------------------------------------------------------------ */

/** Pre-built palettes for common urban analytics use-cases */
export const URBAN_PALETTES = {
  /** Green → red for walkability / accessibility scores */
  accessibilityScore: (v: number) =>
    getSequentialScale('RdYlGn' as InterpolatorName, [0, 100])(100 - v),

  /** Cool blue → hot red for UHI / temperature */
  heatIsland: getSequentialScale('YlOrRd', [0, 8]),

  /** White → deep green for NDVI 0→1 */
  ndvi: getSequentialScale('Greens', [0, 1]),

  /** Land-use categorical (max 12 classes) */
  landUse: getQualitativeScale('Tableau10', 12),

  /** Vulnerability low(blue) → high(red) */
  vulnerability: getDivergingScale('RdBu' as InterpolatorName, [0, 1]),
} as const;
