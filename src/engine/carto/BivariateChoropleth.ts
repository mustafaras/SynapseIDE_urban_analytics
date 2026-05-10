/**
 * Bivariate choropleth — maps two variables to a composite colour
 * using 3×3 or 4×4 colour matrices.
 *
 * Common use-cases:
 *   income × education, density × NDVI, rent_change × income
 */

import { type ClassificationResult, quantile } from './ClassificationSchemes';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type MatrixSize = 3 | 4;

export interface BivariateLegendCell {
  row: number;
  col: number;
  color: string;
  labelX: string;
  labelY: string;
}

export interface BivariateStyle {
  getFillColor: [number, number, number, number];
}

export interface BivariateStyledFeature {
  type: 'Feature';
  geometry: GeoJSON.Geometry;
  properties: Record<string, unknown> & {
    __bivariateClass: [number, number];
    __style: BivariateStyle;
  };
}

export interface BivariateResult {
  features: BivariateStyledFeature[];
  legend: BivariateLegendCell[];
  classificationX: ClassificationResult;
  classificationY: ClassificationResult;
}

/* ------------------------------------------------------------------ */
/*  Pre-built colour matrices                                          */
/* ------------------------------------------------------------------ */

/**
 * Joshua Stevens-style 3×3 bivariate colour matrix.
 * Rows = Y variable (bottom→top), Cols = X variable (left→right).
 */
const MATRIX_3x3: string[][] = [
  /* row 0 (low Y)  */ ['#e8e8e8', '#b5c0da', '#6c83b5'],
  /* row 1 (mid Y)  */ ['#b8d6be', '#90b2b3', '#567994'],
  /* row 2 (high Y) */ ['#73ae80', '#5a9178', '#2a5a5b'],
];

/** 4×4 bivariate colour matrix based on the Stevens approach extended. */
const MATRIX_4x4: string[][] = [
  /* row 0 (low Y)  */ ['#e8e8e8', '#c8d1e5', '#a3b6d9', '#6c83b5'],
  /* row 1           */ ['#ccdfbe', '#aec8bb', '#8fb0c0', '#5f8db5'],
  /* row 2           */ ['#a6d5a0', '#89bfa0', '#6daaab', '#4a8da6'],
  /* row 3 (high Y) */ ['#73ae80', '#5c9a7c', '#448784', '#2a5a5b'],
];

const MATRICES: Record<MatrixSize, string[][]> = {
  3: MATRIX_3x3,
  4: MATRIX_4x4,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function hexToRGBA(hex: string, alpha = 200): [number, number, number, number] {
  const c = hex.replace('#', '');
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
    alpha,
  ];
}

function classIndex(value: number, breaks: number[]): number {
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]!) return i;
  }
  return breaks.length - 1;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Create a bivariate choropleth from a GeoJSON FeatureCollection.
 *
 * @param geojson   Input features.
 * @param propX     Property name for the X axis variable.
 * @param propY     Property name for the Y axis variable.
 * @param size      Matrix size: 3 or 4 (default 3).
 * @param matrix    Optional custom colour matrix (row-major, low-Y first).
 */
export function bivariateChoropleth(
  geojson: GeoJSON.FeatureCollection,
  propX: string,
  propY: string,
  size: MatrixSize = 3,
  matrix?: string[][],
): BivariateResult {
  const colorMatrix = matrix ?? MATRICES[size];
  const numClasses = colorMatrix.length;

  /* Collect values per variable. */
  const xVals: number[] = [];
  const yVals: number[] = [];
  for (const f of geojson.features) {
    const vx = f.properties?.[propX];
    const vy = f.properties?.[propY];
    if (typeof vx === 'number' && Number.isFinite(vx)) xVals.push(vx);
    if (typeof vy === 'number' && Number.isFinite(vy)) yVals.push(vy);
  }

  if (xVals.length === 0 || yVals.length === 0) {
    return {
      features: [],
      legend: [],
      classificationX: { breaks: [], classRanges: [] },
      classificationY: { breaks: [], classRanges: [] },
    };
  }

  /* Classify both axes using quantile. */
  const classX = quantile(xVals, numClasses);
  const classY = quantile(yVals, numClasses);

  /* Build legend cells. */
  const legend: BivariateLegendCell[] = [];
  for (let row = 0; row < numClasses; row++) {
    for (let col = 0; col < numClasses; col++) {
      const rangeX = classX.classRanges[col];
      const rangeY = classY.classRanges[row];
      legend.push({
        row,
        col,
        color: colorMatrix[row]![col]!,
        labelX: rangeX ? `${rangeX.min.toFixed(1)}–${rangeX.max.toFixed(1)}` : '',
        labelY: rangeY ? `${rangeY.min.toFixed(1)}–${rangeY.max.toFixed(1)}` : '',
      });
    }
  }

  /* Style features. */
  const features: BivariateStyledFeature[] = geojson.features.map((f) => {
    const vx = f.properties?.[propX];
    const vy = f.properties?.[propY];
    const xVal = typeof vx === 'number' && Number.isFinite(vx) ? vx : 0;
    const yVal = typeof vy === 'number' && Number.isFinite(vy) ? vy : 0;

    const ci = classIndex(xVal, classX.breaks);
    const ri = classIndex(yVal, classY.breaks);
    const color = colorMatrix[ri]?.[ci] ?? '#888888';

    return {
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: {
        ...f.properties,
        __bivariateClass: [ci, ri] as [number, number],
        __style: { getFillColor: hexToRGBA(color) },
      },
    };
  });

  return {
    features,
    legend,
    classificationX: classX,
    classificationY: classY,
  };
}

/**
 * Retrieve one of the built-in colour matrices.
 */
export function getColorMatrix(size: MatrixSize): string[][] {
  return MATRICES[size].map((row) => [...row]);
}
