/**
 * GeoAI CV — YOLO-Nano Urban Object Detection
 *
 * Tile-based object detection pipeline for very-high-resolution imagery.
 * Slices a raster into overlapping tiles, runs inference per tile, maps
 * tile-local pixel bounding boxes back to the full raster, then applies
 * class-wise non-maximum suppression across tile boundaries and converts
 * boxes to geographic coordinates for GeoJSON-ready output.
 */

import type { ONNXRuntimeManager } from '../runtime/ONNXRuntimeManager';
import type { TensorLike } from '../runtime/types';
import { computeTileGrid, extractTile, normalizeRaster } from './LandCoverClassifier';
import type { RasterTile } from './types';

/* ══════════════════════════════════════════════════════
   Class schema
   ══════════════════════════════════════════════════════ */

export const URBAN_OBJECT_CLASSES = [
  'vehicle',
  'tree',
  'swimming_pool',
  'solar_panel',
  'construction_site',
] as const;

export type UrbanObjectClass = (typeof URBAN_OBJECT_CLASSES)[number];

/* ══════════════════════════════════════════════════════
   Public contracts
   ══════════════════════════════════════════════════════ */

export interface DetectedObject {
  id?: string;
  className: string;
  confidence: number;
  /** Bounding box in geographic coordinates: [west, south, east, north]. */
  bbox: [number, number, number, number];
  properties?: Record<string, unknown>;
}

export interface ObjectDetectionResult {
  detections: DetectedObject[];
  modelId?: string;
  imageId?: string;
  classLabels?: string[];
}

/**
 * Detection in raster pixel space, as emitted by a tile-level inference step.
 * x,y,width,height are measured in raster pixels with origin at the top-left.
 */
export interface RawDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  classIndex: number;
  confidence: number;
}

/**
 * Affine transform mapping raster pixel coordinates to geographic coordinates.
 * Positive `pixelLon` means pixels increase eastward as x increases.
 * `pixelLat` is typically negative for north-up rasters.
 */
export interface GeoTransform {
  originLon: number;
  originLat: number;
  pixelLon: number;
  pixelLat: number;
}

export interface ObjectDetectorConfig {
  modelId: string;
  /** Square tile size the model expects, e.g. 640. */
  tileSize: number;
  /** Pixel overlap between adjacent tiles to avoid edge artifacts. */
  overlap?: number;
  /** Class labels in the order the model emits them. Defaults to URBAN_OBJECT_CLASSES. */
  classLabels?: readonly string[];
  /** Per-class confidence thresholds. Classes missing here fall back to `defaultConfidence`. */
  confidenceThresholds?: Partial<Record<string, number>>;
  /** Fallback confidence threshold applied to any class without an explicit entry. */
  defaultConfidence?: number;
  /** IoU threshold used by non-maximum suppression (default 0.45). */
  iouThreshold?: number;
  /** Optional image id carried into the result for provenance. */
  imageId?: string;
}

export interface DetectionProgress {
  processedTiles: number;
  totalTiles: number;
  rawDetections: number;
}

export interface DetectionRunOptions {
  signal?: AbortSignal;
  onProgress?: (progress: DetectionProgress) => void;
}

/**
 * Injection seam so the pipeline can be exercised end-to-end without a runtime.
 * Receives the tile data (already extracted and normalized) plus tile metadata
 * and must emit tile-local pixel-space detections.
 */
export type TileInferrer = (
  tile: RasterTile,
  tileIndex: number,
  tileSize: number,
) => Promise<RawDetection[]> | RawDetection[];

/* ══════════════════════════════════════════════════════
   YOLO output decoding
   ══════════════════════════════════════════════════════ */

/**
 * Decode a YOLO-style output tensor into tile-local pixel detections.
 *
 * Accepts either [1, N, 5+C] or [1, 5+C, N]. Values per row:
 * (cx, cy, w, h, objectness, p0, p1, …, pC-1) in tile-pixel units.
 * Detections below `scoreThreshold * objectness * class_prob` are dropped.
 */
export function decodeYoloOutput(
  tensor: TensorLike,
  numClasses: number,
  scoreThreshold: number,
): RawDetection[] {
  const data = tensor.data instanceof Float32Array ? tensor.data : new Float32Array(tensor.data);
  const dims = tensor.dims;
  if (dims.length < 2) return [];

  const stride = 5 + numClasses;
  // Determine layout: [1, N, stride] vs [1, stride, N]
  let numBoxes: number;
  let rowMajor: boolean;
  if (dims[dims.length - 1] === stride) {
    numBoxes = dims[dims.length - 2];
    rowMajor = true;
  } else if (dims[dims.length - 2] === stride) {
    numBoxes = dims[dims.length - 1];
    rowMajor = false;
  } else {
    return [];
  }

  const out: RawDetection[] = [];
  for (let i = 0; i < numBoxes; i++) {
    const get = (k: number): number =>
      rowMajor ? data[i * stride + k] : data[k * numBoxes + i];

    const cx = get(0);
    const cy = get(1);
    const w = get(2);
    const h = get(3);
    const obj = get(4);
    if (!(obj > 0) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) continue;

    let bestClass = -1;
    let bestProb = -Infinity;
    for (let c = 0; c < numClasses; c++) {
      const p = get(5 + c);
      if (p > bestProb) {
        bestProb = p;
        bestClass = c;
      }
    }
    if (bestClass < 0) continue;

    const score = obj * bestProb;
    if (score < scoreThreshold) continue;

    out.push({
      x: cx - w / 2,
      y: cy - h / 2,
      width: w,
      height: h,
      classIndex: bestClass,
      confidence: clamp01(score),
    });
  }
  return out;
}

/* ══════════════════════════════════════════════════════
   Non-maximum suppression
   ══════════════════════════════════════════════════════ */

/** IoU of two axis-aligned pixel boxes. */
export function computeIoU(a: RawDetection, b: RawDetection): number {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;

  const xOverlap = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  const inter = xOverlap * yOverlap;
  if (inter <= 0) return 0;

  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Class-wise greedy NMS. Works across tile boundaries because all detections
 * are in the same full-raster pixel space.
 */
export function nonMaxSuppression(
  detections: RawDetection[],
  iouThreshold: number,
): RawDetection[] {
  if (detections.length === 0) return [];
  const byClass = new Map<number, RawDetection[]>();
  for (const d of detections) {
    const arr = byClass.get(d.classIndex);
    if (arr) arr.push(d);
    else byClass.set(d.classIndex, [d]);
  }

  const kept: RawDetection[] = [];
  for (const group of byClass.values()) {
    group.sort((a, b) => b.confidence - a.confidence);
    const suppressed = new Uint8Array(group.length);
    for (let i = 0; i < group.length; i++) {
      if (suppressed[i]) continue;
      const anchor = group[i];
      kept.push(anchor);
      for (let j = i + 1; j < group.length; j++) {
        if (suppressed[j]) continue;
        if (computeIoU(anchor, group[j]) > iouThreshold) suppressed[j] = 1;
      }
    }
  }
  return kept;
}

/* ══════════════════════════════════════════════════════
   Coordinate conversion
   ══════════════════════════════════════════════════════ */

/**
 * Convert a pixel bounding box (top-left x, y, width, height) into a
 * geographic [west, south, east, north] tuple using an affine transform.
 * Handles both north-up (pixelLat < 0) and north-down rasters.
 */
export function pixelBoxToGeoBBox(
  x: number,
  y: number,
  width: number,
  height: number,
  transform: GeoTransform,
): [number, number, number, number] {
  const lonA = transform.originLon + x * transform.pixelLon;
  const lonB = transform.originLon + (x + width) * transform.pixelLon;
  const latA = transform.originLat + y * transform.pixelLat;
  const latB = transform.originLat + (y + height) * transform.pixelLat;

  const west = Math.min(lonA, lonB);
  const east = Math.max(lonA, lonB);
  const south = Math.min(latA, latB);
  const north = Math.max(latA, latB);
  return [west, south, east, north];
}

/* ══════════════════════════════════════════════════════
   Orchestration
   ══════════════════════════════════════════════════════ */

const DEFAULT_IOU = 0.45;
const DEFAULT_CONFIDENCE = 0.25;

/**
 * Tile-based detection orchestrator using an injected inferrer. This is the
 * engine tested in isolation; `detectObjects` wraps it with the ONNX runtime.
 */
export async function detectObjectsWithInferrer(
  raster: RasterTile,
  transform: GeoTransform,
  infer: TileInferrer,
  config: Omit<ObjectDetectorConfig, 'modelId'> & { modelId?: string },
  options: DetectionRunOptions = {},
): Promise<ObjectDetectionResult> {
  const {
    tileSize,
    overlap = 0,
    classLabels = URBAN_OBJECT_CLASSES,
    confidenceThresholds = {},
    defaultConfidence = DEFAULT_CONFIDENCE,
    iouThreshold = DEFAULT_IOU,
    imageId,
    modelId,
  } = config;

  if (!(tileSize > 0)) throw new Error('ObjectDetector: tileSize must be positive');

  // Empty image: short-circuit. Still returns a well-formed envelope.
  if (raster.height === 0 || raster.width === 0) {
    options.onProgress?.({ processedTiles: 0, totalTiles: 0, rawDetections: 0 });
    return buildResult([], modelId, imageId, classLabels);
  }

  // Normalize once on a scratch copy so the caller's raster is not mutated.
  const normalized = normalizeRaster({
    data: new Float32Array(raster.data),
    bands: raster.bands,
    height: raster.height,
    width: raster.width,
  });

  const grid = computeTileGrid(normalized.height, normalized.width, tileSize, overlap);
  const globalDetections: RawDetection[] = [];

  for (let i = 0; i < grid.length; i++) {
    if (options.signal?.aborted) {
      throw new DOMException('Detection aborted', 'AbortError');
    }
    const spec = grid[i];
    const tile = extractTile(normalized, spec.srcY, spec.srcX, tileSize);
    const tileDetections = await infer(tile, i, tileSize);

    for (const d of tileDetections) {
      if (!Number.isFinite(d.x) || !Number.isFinite(d.y)) continue;
      if (!(d.width > 0) || !(d.height > 0)) continue;

      // Shift to full-raster pixel space and clamp to the raster extent.
      const fx = Math.max(0, d.x + spec.srcX);
      const fy = Math.max(0, d.y + spec.srcY);
      const fxMax = Math.min(normalized.width, d.x + spec.srcX + d.width);
      const fyMax = Math.min(normalized.height, d.y + spec.srcY + d.height);
      const fw = fxMax - fx;
      const fh = fyMax - fy;
      if (fw <= 0 || fh <= 0) continue;

      globalDetections.push({
        x: fx,
        y: fy,
        width: fw,
        height: fh,
        classIndex: d.classIndex,
        confidence: clamp01(d.confidence),
      });
    }

    options.onProgress?.({
      processedTiles: i + 1,
      totalTiles: grid.length,
      rawDetections: globalDetections.length,
    });
  }

  // Class threshold filter, then class-wise NMS across tile boundaries.
  const resolveThreshold = (idx: number): number => {
    const label = classLabels[idx];
    if (label != null) {
      const override = confidenceThresholds[label];
      if (typeof override === 'number' && Number.isFinite(override)) return override;
    }
    return defaultConfidence;
  };

  const filtered = globalDetections.filter((d) => d.confidence >= resolveThreshold(d.classIndex));
  const kept = nonMaxSuppression(filtered, iouThreshold);

  const detections: DetectedObject[] = kept.map((d, idx) => {
    const bbox = pixelBoxToGeoBBox(d.x, d.y, d.width, d.height, transform);
    const className = classLabels[d.classIndex] ?? `class_${d.classIndex}`;
    return {
      id: `det-${idx + 1}`,
      className,
      confidence: d.confidence,
      bbox,
      properties: {
        pixel_x: d.x,
        pixel_y: d.y,
        pixel_width: d.width,
        pixel_height: d.height,
      },
    };
  });

  return buildResult(detections, modelId, imageId, classLabels);
}

function buildResult(
  detections: DetectedObject[],
  modelId: string | undefined,
  imageId: string | undefined,
  classLabels: readonly string[],
): ObjectDetectionResult {
  const result: ObjectDetectionResult = {
    detections,
    classLabels: [...classLabels],
  };
  if (modelId !== undefined) result.modelId = modelId;
  if (imageId !== undefined) result.imageId = imageId;
  return result;
}

/**
 * End-to-end detection pipeline backed by the ONNX runtime. The model is
 * expected to emit a YOLO-style output: [1, N, 5+numClasses] in tile pixels.
 */
export async function detectObjects(
  raster: RasterTile,
  transform: GeoTransform,
  runtime: ONNXRuntimeManager,
  config: ObjectDetectorConfig,
  options: DetectionRunOptions = {},
): Promise<ObjectDetectionResult> {
  const classLabels = config.classLabels ?? URBAN_OBJECT_CLASSES;
  const defaultConfidence = config.defaultConfidence ?? DEFAULT_CONFIDENCE;

  const infer: TileInferrer = async (tile, _idx, tileSize) => {
    const feed: Record<string, TensorLike> = {
      input: { data: tile.data, dims: [1, tile.bands, tileSize, tileSize] },
    };
    const result = await runtime.run(config.modelId, feed, options.signal);
    const outputKey = Object.keys(result.outputs)[0];
    if (!outputKey) return [];
    return decodeYoloOutput(result.outputs[outputKey], classLabels.length, defaultConfidence);
  };

  return detectObjectsWithInferrer(raster, transform, infer, config, options);
}

/* ══════════════════════════════════════════════════════
   Utilities
   ══════════════════════════════════════════════════════ */

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
