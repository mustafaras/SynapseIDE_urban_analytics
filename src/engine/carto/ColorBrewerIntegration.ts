/**
 * Color palette utilities built on d3-scale-chromatic.
 *
 * Provides sequential, diverging and qualitative palettes plus
 * three urban-specific custom ramps.
 */

import {
  /* sequential single-hue */
  interpolateBlues,
  interpolateGreens,
  interpolateGreys,
  interpolateOranges,
  interpolatePurples,
  interpolateReds,
  /* sequential multi-hue */
  interpolateViridis,
  interpolateInferno,
  interpolateMagma,
  interpolatePlasma,
  interpolateCividis,
  interpolateYlOrRd,
  interpolateYlGnBu,
  interpolateOrRd,
  interpolateBuGn,
  interpolateBuPu,
  /* diverging */
  interpolateRdBu,
  interpolateRdYlGn,
  interpolateRdYlBu,
  interpolatePRGn,
  interpolatePiYG,
  interpolateBrBG,
  interpolateSpectral,
  /* qualitative */
  schemeCategory10,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  schemePaired,
  schemeTableau10,
  schemeDark2,
  schemeAccent,
  schemePastel1,
  schemePastel2,
} from 'd3-scale-chromatic';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Interpolator = (t: number) => string;

export interface PaletteInfo {
  name: string;
  interpolate: Interpolator;
}

/* ------------------------------------------------------------------ */
/*  Registries                                                         */
/* ------------------------------------------------------------------ */

const SEQUENTIAL: Record<string, Interpolator> = {
  Blues: interpolateBlues,
  Greens: interpolateGreens,
  Greys: interpolateGreys,
  Oranges: interpolateOranges,
  Purples: interpolatePurples,
  Reds: interpolateReds,
  Viridis: interpolateViridis,
  Inferno: interpolateInferno,
  Magma: interpolateMagma,
  Plasma: interpolatePlasma,
  Cividis: interpolateCividis,
  YlOrRd: interpolateYlOrRd,
  YlGnBu: interpolateYlGnBu,
  OrRd: interpolateOrRd,
  BuGn: interpolateBuGn,
  BuPu: interpolateBuPu,
};

const DIVERGING: Record<string, Interpolator> = {
  RdBu: interpolateRdBu,
  RdYlGn: interpolateRdYlGn,
  RdYlBu: interpolateRdYlBu,
  PRGn: interpolatePRGn,
  PiYG: interpolatePiYG,
  BrBG: interpolateBrBG,
  Spectral: interpolateSpectral,
};

const QUALITATIVE: Record<string, readonly string[]> = {
  Category10: schemeCategory10,
  Set1: schemeSet1,
  Set2: schemeSet2,
  Set3: schemeSet3,
  Paired: schemePaired,
  Tableau10: schemeTableau10,
  Dark2: schemeDark2,
  Accent: schemeAccent,
  Pastel1: schemePastel1,
  Pastel2: schemePastel2,
};

/* ------------------------------------------------------------------ */
/*  Urban-specific custom palettes                                     */
/* ------------------------------------------------------------------ */

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function multiStopInterpolator(
  stops: [number, number, number][],
): Interpolator {
  return (t: number) => {
    const clamped = Math.max(0, Math.min(1, t));
    const segCount = stops.length - 1;
    const seg = clamped * segCount;
    const idx = Math.min(Math.floor(seg), segCount - 1);
    const local = seg - idx;
    return lerpColor(stops[idx]!, stops[idx + 1]!, local);
  };
}

/** Blue → Yellow → Red (urban heat island) */
const urbanHeat = multiStopInterpolator([
  [49, 54, 149],   // deep blue
  [116, 173, 209], // light blue
  [255, 255, 191], // pale yellow
  [244, 109, 67],  // orange
  [165, 0, 38],    // dark red
]);

/** Red → Yellow → Green (green deficit / vegetation) */
const greenDeficit = multiStopInterpolator([
  [165, 0, 38],    // dark red
  [244, 109, 67],  // orange
  [255, 255, 191], // pale yellow
  [102, 189, 99],  // light green
  [0, 104, 55],    // dark green
]);

/** Red → Blue → Green (accessibility spectrum) */
const accessibility = multiStopInterpolator([
  [165, 0, 38],    // dark red
  [215, 48, 39],   // red
  [69, 117, 180],  // blue
  [49, 54, 149],   // deep blue
  [0, 136, 55],    // green
]);

const URBAN_PALETTES: Record<string, Interpolator> = {
  urban_heat: urbanHeat,
  green_deficit: greenDeficit,
  accessibility,
};

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Sample `numColors` from an interpolator at evenly-spaced positions.
 */
function sampleColors(interpolate: Interpolator, numColors: number): string[] {
  if (numColors <= 0) return [];
  if (numColors === 1) return [interpolate(0.5)];
  return Array.from({ length: numColors }, (_, i) =>
    interpolate(i / (numColors - 1)),
  );
}

/**
 * Get a sequential palette by name.
 * Returns an array of `numColors` hex/rgb colour strings.
 */
export function getSequentialPalette(
  name: string,
  numColors: number,
): string[] {
  const interp = SEQUENTIAL[name] ?? URBAN_PALETTES[name];
  if (!interp) {
    throw new Error(
      `Unknown sequential palette "${name}". Available: ${[
        ...Object.keys(SEQUENTIAL),
        ...Object.keys(URBAN_PALETTES),
      ].join(', ')}`,
    );
  }
  return sampleColors(interp, numColors);
}

/**
 * Get a diverging palette by name.
 */
export function getDivergingPalette(
  name: string,
  numColors: number,
): string[] {
  const interp = DIVERGING[name];
  if (!interp) {
    throw new Error(
      `Unknown diverging palette "${name}". Available: ${Object.keys(DIVERGING).join(', ')}`,
    );
  }
  return sampleColors(interp, numColors);
}

/**
 * Get a qualitative palette by name, trimmed to `numColors`.
 */
export function getQualitativePalette(
  name: string,
  numColors: number,
): string[] {
  const scheme = QUALITATIVE[name];
  if (!scheme) {
    throw new Error(
      `Unknown qualitative palette "${name}". Available: ${Object.keys(QUALITATIVE).join(', ')}`,
    );
  }
  /* Cycle if more colours requested than available. */
  const out: string[] = [];
  for (let i = 0; i < numColors; i++) {
    out.push(scheme[i % scheme.length]!);
  }
  return out;
}

/**
 * Get any registered interpolator by name (sequential, diverging, or urban).
 * Returns `undefined` when not found.
 */
export function getInterpolator(name: string): Interpolator | undefined {
  return SEQUENTIAL[name] ?? DIVERGING[name] ?? URBAN_PALETTES[name];
}

export { SEQUENTIAL, DIVERGING, QUALITATIVE, URBAN_PALETTES };
