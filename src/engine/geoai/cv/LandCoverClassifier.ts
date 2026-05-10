/**
 * GeoAI CV — Land Cover Classification Pipeline
 *
 * Full pipeline: raster preprocessing → tile slicing → inference → postprocessing → accuracy.
 * Compatible with U-Net and SegFormer-style ONNX models via the ONNXRuntimeManager.
 */

import type { ONNXRuntimeManager } from '../runtime/ONNXRuntimeManager';
import type { TensorLike } from '../runtime/types';
import {
  type AccuracyReport,
  type ClassifiedTile,
  type ClassifierConfig,
  type ClassMetrics,
  type ConfusionMatrix,
  LAND_COVER_CLASSES,
  type RasterTile,
} from './types';

/* ══════════════════════════════════════════════════════
   1. Raster Preprocessing
   ══════════════════════════════════════════════════════ */

/**
 * Normalize a raster tile to [0, 1] per band using min-max scaling.
 * Modifies data in-place and returns the same tile reference.
 */
export function normalizeRaster(tile: RasterTile): RasterTile {
  const { data, bands, height, width } = tile;
  const bandSize = height * width;

  for (let b = 0; b < bands; b++) {
    const offset = b * bandSize;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < bandSize; i++) {
      const v = data[offset + i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min || 1;
    for (let i = 0; i < bandSize; i++) {
      data[offset + i] = (data[offset + i] - min) / range;
    }
  }
  return tile;
}

/* ══════════════════════════════════════════════════════
   2. Tile Slicing
   ══════════════════════════════════════════════════════ */

export interface TileSpec {
  row: number;
  col: number;
  srcY: number;
  srcX: number;
}

/**
 * Compute grid of tile origins for slicing a larger raster into model-sized patches.
 */
export function computeTileGrid(
  rasterH: number,
  rasterW: number,
  tileSize: number,
  overlap = 0,
): TileSpec[] {
  const step = tileSize - overlap;
  const tiles: TileSpec[] = [];
  let row = 0;
  for (let y = 0; y < rasterH; y += step) {
    let col = 0;
    for (let x = 0; x < rasterW; x += step) {
      tiles.push({ row, col, srcY: y, srcX: x });
      col++;
    }
    row++;
  }
  return tiles;
}

/**
 * Extract a single tile from a multi-band raster.
 * If the tile extends beyond the raster, zero-pad the excess.
 */
export function extractTile(
  raster: RasterTile,
  srcY: number,
  srcX: number,
  tileSize: number,
): RasterTile {
  const { data, bands, height, width } = raster;
  const bandSize = height * width;
  const tileData = new Float32Array(bands * tileSize * tileSize);

  for (let b = 0; b < bands; b++) {
    const srcBandOff = b * bandSize;
    const dstBandOff = b * tileSize * tileSize;
    for (let ty = 0; ty < tileSize; ty++) {
      const ry = srcY + ty;
      if (ry >= height) break;
      for (let tx = 0; tx < tileSize; tx++) {
        const rx = srcX + tx;
        if (rx >= width) break;
        tileData[dstBandOff + ty * tileSize + tx] = data[srcBandOff + ry * width + rx];
      }
    }
  }

  return { data: tileData, bands, height: tileSize, width: tileSize };
}

/* ══════════════════════════════════════════════════════
   3. Inference Orchestration
   ══════════════════════════════════════════════════════ */

/**
 * Run classification inference on a single tile.
 * Expects model output shape [1, numClasses, H, W] (softmax logits).
 */
export function decodeTileOutput(
  output: TensorLike,
  numClasses: number,
  h: number,
  w: number,
): ClassifiedTile {
  const probs = output.data instanceof Float32Array
    ? output.data
    : new Float32Array(output.data);

  const labels = new Uint8Array(h * w);
  const pixelCount = h * w;

  for (let i = 0; i < pixelCount; i++) {
    let bestClass = 0;
    let bestProb = -Infinity;
    for (let c = 0; c < numClasses; c++) {
      const p = probs[c * pixelCount + i];
      if (p > bestProb) {
        bestProb = p;
        bestClass = c;
      }
    }
    labels[i] = bestClass;
  }

  return { labels, probabilities: probs, height: h, width: w };
}

/**
 * Classify a full raster by tiling, running inference, and stitching results.
 */
export async function classifyRaster(
  raster: RasterTile,
  runtime: ONNXRuntimeManager,
  config: ClassifierConfig,
  signal?: AbortSignal,
): Promise<ClassifiedTile> {
  const { modelId, tileSize, overlap = 0, postprocess = true, minComponentArea = 4 } = config;
  const numClasses = LAND_COVER_CLASSES.length;

  // Normalize
  const normalized = normalizeRaster({
    data: new Float32Array(raster.data),
    bands: raster.bands,
    height: raster.height,
    width: raster.width,
  });

  // Tile grid
  const grid = computeTileGrid(normalized.height, normalized.width, tileSize, overlap);

  // Output buffers
  const outLabels = new Uint8Array(raster.height * raster.width);
  const outProbs = new Float32Array(numClasses * raster.height * raster.width);

  // Process tiles
  for (const spec of grid) {
    if (signal?.aborted) throw new DOMException('Classification aborted', 'AbortError');

    const tile = extractTile(normalized, spec.srcY, spec.srcX, tileSize);
    const feed: Record<string, TensorLike> = {
      input: { data: tile.data, dims: [1, tile.bands, tileSize, tileSize] },
    };

    const result = await runtime.run(modelId, feed, signal);
    const outputKey = Object.keys(result.outputs)[0];
    const decoded = decodeTileOutput(result.outputs[outputKey], numClasses, tileSize, tileSize);

    // Stitch back into the full raster
    stitchTile(decoded, spec.srcY, spec.srcX, raster.height, raster.width, numClasses, outLabels, outProbs);
  }

  const classified: ClassifiedTile = {
    labels: outLabels,
    probabilities: outProbs,
    height: raster.height,
    width: raster.width,
  };

  if (postprocess) {
    morphologicalCleanup(classified, minComponentArea);
  }

  return classified;
}

/* ── Stitch a decoded tile into the output buffers ──── */

function stitchTile(
  tile: ClassifiedTile,
  srcY: number,
  srcX: number,
  outH: number,
  outW: number,
  numClasses: number,
  outLabels: Uint8Array,
  outProbs: Float32Array,
): void {
  const pixelCountOut = outH * outW;
  const tilePixels = tile.height * tile.width;

  for (let ty = 0; ty < tile.height; ty++) {
    const ry = srcY + ty;
    if (ry >= outH) break;
    for (let tx = 0; tx < tile.width; tx++) {
      const rx = srcX + tx;
      if (rx >= outW) break;
      const outIdx = ry * outW + rx;
      const tileIdx = ty * tile.width + tx;

      outLabels[outIdx] = tile.labels[tileIdx];
      for (let c = 0; c < numClasses; c++) {
        outProbs[c * pixelCountOut + outIdx] = tile.probabilities[c * tilePixels + tileIdx];
      }
    }
  }
}

/* ══════════════════════════════════════════════════════
   4. Postprocessing — morphological cleanup
   ══════════════════════════════════════════════════════ */

/**
 * Remove small connected components (salt-and-pepper noise).
 * Uses simple 4-connected flood-fill and replaces tiny regions
 * with the most frequent neighbour class.
 */
export function morphologicalCleanup(tile: ClassifiedTile, minArea: number): void {
  const { labels, height, width } = tile;
  const visited = new Uint8Array(height * width);
  const queue: number[] = [];

  for (let i = 0; i < labels.length; i++) {
    if (visited[i]) continue;

    const cls = labels[i];
    // Flood-fill to find connected component
    const component: number[] = [];
    queue.push(i);
    visited[i] = 1;

    while (queue.length > 0) {
      const idx = queue.pop()!;
      component.push(idx);
      const y = (idx / width) | 0;
      const x = idx % width;

      const neighbors = [
        y > 0 ? idx - width : -1,
        y < height - 1 ? idx + width : -1,
        x > 0 ? idx - 1 : -1,
        x < width - 1 ? idx + 1 : -1,
      ];

      for (const n of neighbors) {
        if (n >= 0 && !visited[n] && labels[n] === cls) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }

    // Replace small components with most common neighbour
    if (component.length < minArea) {
      const neighborCounts = new Map<number, number>();
      for (const idx of component) {
        const y = (idx / width) | 0;
        const x = idx % width;
        const neighbors = [
          y > 0 ? idx - width : -1,
          y < height - 1 ? idx + width : -1,
          x > 0 ? idx - 1 : -1,
          x < width - 1 ? idx + 1 : -1,
        ];
        for (const n of neighbors) {
          if (n >= 0 && labels[n] !== cls) {
            neighborCounts.set(labels[n], (neighborCounts.get(labels[n]) ?? 0) + 1);
          }
        }
      }

      let replacementClass = cls;
      let maxCount = 0;
      for (const [c, count] of neighborCounts) {
        if (count > maxCount) {
          maxCount = count;
          replacementClass = c;
        }
      }

      for (const idx of component) {
        labels[idx] = replacementClass;
      }
    }
  }
}

/* ══════════════════════════════════════════════════════
   5. Accuracy Reporting
   ══════════════════════════════════════════════════════ */

/**
 * Build a confusion matrix from predicted and ground-truth labels.
 */
export function confusionMatrix(
  predicted: Uint8Array,
  groundTruth: Uint8Array,
  numClasses: number,
  classLabels?: string[],
): ConfusionMatrix {
  const labels = classLabels ?? LAND_COVER_CLASSES.slice(0, numClasses) as unknown as string[];
  const matrix: number[][] = Array.from({ length: numClasses }, () =>
    new Array(numClasses).fill(0),
  );

  const n = Math.min(predicted.length, groundTruth.length);
  for (let i = 0; i < n; i++) {
    const actual = groundTruth[i];
    const pred = predicted[i];
    if (actual < numClasses && pred < numClasses) {
      matrix[actual][pred]++;
    }
  }

  return { matrix, classLabels: labels };
}

/**
 * Compute per-class precision, recall, F1, and IoU from a confusion matrix.
 */
export function computeClassMetrics(cm: ConfusionMatrix): ClassMetrics[] {
  const numClasses = cm.matrix.length;
  const metrics: ClassMetrics[] = [];

  for (let c = 0; c < numClasses; c++) {
    const tp = cm.matrix[c][c];
    let rowSum = 0; // actual = c (support)
    let colSum = 0; // predicted = c

    for (let j = 0; j < numClasses; j++) {
      rowSum += cm.matrix[c][j];
      colSum += cm.matrix[j][c];
    }

    const precision = colSum > 0 ? tp / colSum : 0;
    const recall = rowSum > 0 ? tp / rowSum : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const iou = tp + colSum - tp + rowSum - tp > 0
      ? tp / (rowSum + colSum - tp)
      : 0;

    metrics.push({
      className: cm.classLabels[c],
      precision,
      recall,
      f1,
      iou,
      support: rowSum,
    });
  }

  return metrics;
}

/**
 * Full accuracy report.
 */
export function accuracyReport(
  predicted: Uint8Array,
  groundTruth: Uint8Array,
  numClasses: number,
  classLabels?: string[],
): AccuracyReport {
  const cm = confusionMatrix(predicted, groundTruth, numClasses, classLabels);
  const perClass = computeClassMetrics(cm);

  let correct = 0;
  let total = 0;
  for (let i = 0; i < cm.matrix.length; i++) {
    for (let j = 0; j < cm.matrix.length; j++) {
      total += cm.matrix[i][j];
      if (i === j) correct += cm.matrix[i][j];
    }
  }

  const overallAccuracy = total > 0 ? correct / total : 0;
  const classesWithSupport = perClass.filter((c) => c.support > 0);
  const meanF1 =
    classesWithSupport.length > 0
      ? classesWithSupport.reduce((s, c) => s + c.f1, 0) / classesWithSupport.length
      : 0;
  const meanIoU =
    classesWithSupport.length > 0
      ? classesWithSupport.reduce((s, c) => s + c.iou, 0) / classesWithSupport.length
      : 0;

  return { overallAccuracy, confusionMatrix: cm, perClass, meanF1, meanIoU };
}
