/**
 * GeoAI CV — shared types for computer vision pipelines.
 */

/* ── Land cover class schema ─────────────────────────── */

export const LAND_COVER_CLASSES = [
  'built_up',
  'vegetation',
  'water',
  'bare_soil',
  'road',
  'agriculture',
] as const;

export type LandCoverClass = (typeof LAND_COVER_CLASSES)[number];

export const LAND_COVER_CLASS_INDEX: Record<LandCoverClass, number> = {
  built_up: 0,
  vegetation: 1,
  water: 2,
  bare_soil: 3,
  road: 4,
  agriculture: 5,
};

/* ── Raster tile ─────────────────────────────────────── */

export interface RasterTile {
  /** Pixel data — Float32, band-interleaved: [C, H, W] */
  data: Float32Array;
  /** Number of spectral bands (e.g. 4 for B/G/R/NIR) */
  bands: number;
  /** Tile height in pixels */
  height: number;
  /** Tile width in pixels */
  width: number;
}

/* ── Classification results ──────────────────────────── */

export interface ClassifiedTile {
  /** Class label per pixel: [H, W] stored row-major */
  labels: Uint8Array;
  /** Softmax probabilities per pixel per class: [numClasses, H, W] */
  probabilities: Float32Array;
  height: number;
  width: number;
}

export interface ConfusionMatrix {
  /** NxN matrix stored row-major: actual (row) × predicted (col) */
  matrix: number[][];
  classLabels: string[];
}

export interface ClassMetrics {
  className: string;
  precision: number;
  recall: number;
  f1: number;
  iou: number;
  support: number;
}

export interface AccuracyReport {
  overallAccuracy: number;
  confusionMatrix: ConfusionMatrix;
  perClass: ClassMetrics[];
  meanF1: number;
  meanIoU: number;
}

/* ── Pipeline config ─────────────────────────────────── */

export interface ClassifierConfig {
  /** Model id from the ModelRegistry */
  modelId: string;
  /** Tile size the model expects (square), e.g. 256 */
  tileSize: number;
  /** Overlap in pixels between adjacent tiles (default 0) */
  overlap?: number;
  /** Apply morphological cleanup to output (default true) */
  postprocess?: boolean;
  /** Minimum connected-component area (px) to keep (default 4) */
  minComponentArea?: number;
}
