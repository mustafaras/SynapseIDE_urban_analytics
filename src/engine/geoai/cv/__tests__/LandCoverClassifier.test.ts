/**
 * Land Cover Classification Pipeline — test suite
 *
 * Tests preprocessing, tiling, inference decode, postprocessing, accuracy metrics,
 * and the full end-to-end pipeline using a mock runtime.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  accuracyReport,
  classifyRaster,
  computeClassMetrics,
  computeTileGrid,
  confusionMatrix,
  decodeTileOutput,
  extractTile,
  morphologicalCleanup,
  normalizeRaster,
} from '../LandCoverClassifier';
import type { ClassifiedTile, RasterTile } from '../types';
import { ONNXRuntimeManager } from '../../runtime/ONNXRuntimeManager';
import type { RuntimeAdapter, TensorLike } from '../../runtime/types';
import { ModelRegistry } from '../../runtime/ModelRegistry';

/* ── Helper: create a simple raster ──────────────────── */

function makeRaster(bands: number, h: number, w: number, fill = 1): RasterTile {
  return {
    data: new Float32Array(bands * h * w).fill(fill),
    bands,
    height: h,
    width: w,
  };
}

/* ── Mock runtime adapter that returns class-0 everywhere ── */

function createClassifierAdapter(numClasses = 6): RuntimeAdapter {
  const sessions = new Map<string, number>();
  let counter = 0;

  return {
    async loadModel(_src: string | ArrayBuffer) {
      const h = `sess-${++counter}`;
      sessions.set(h, 1024);
      return h;
    },
    async run(
      _handle: string,
      feeds: Record<string, TensorLike>,
      signal?: AbortSignal,
    ) {
      if (signal?.aborted) throw new DOMException('aborted', 'AbortError');

      // Parse input shape to determine H, W
      const input = feeds['input'];
      const [, , h, w] = input.dims;
      const pixelCount = h * w;

      // Create mock softmax output: class 0 gets 0.9, rest 0.02 each
      const probs = new Float32Array(numClasses * pixelCount);
      for (let i = 0; i < pixelCount; i++) {
        probs[0 * pixelCount + i] = 0.9; // class 0 dominant
        for (let c = 1; c < numClasses; c++) {
          probs[c * pixelCount + i] = 0.02;
        }
      }

      return {
        output: {
          data: probs,
          dims: [1, numClasses, h, w],
        },
      };
    },
    async releaseSession(handle: string) {
      sessions.delete(handle);
    },
    getSessionMemory(handle: string) {
      return sessions.get(handle) ?? 0;
    },
  };
}

/* ══════════════════════════════════════════════════════
   Raster Preprocessing
   ══════════════════════════════════════════════════════ */

describe('normalizeRaster', () => {
  it('normalizes to [0,1] per band', () => {
    const tile: RasterTile = {
      data: new Float32Array([100, 200, 300, 400, 10, 20, 30, 40]),
      bands: 2,
      height: 2,
      width: 2,
    };
    normalizeRaster(tile);
    // Band 0: (100-100)/(400-100)...(400-100)/(400-100) = 0, 1/3, 2/3, 1
    expect(tile.data[0]).toBeCloseTo(0, 5);
    expect(tile.data[3]).toBeCloseTo(1, 5);
    // Band 1
    expect(tile.data[4]).toBeCloseTo(0, 5);
    expect(tile.data[7]).toBeCloseTo(1, 5);
  });

  it('handles constant-value band (no division by zero)', () => {
    const tile = makeRaster(1, 2, 2, 5);
    normalizeRaster(tile);
    // All same → range = 1 (fallback), so all become 0
    for (let i = 0; i < 4; i++) {
      expect(tile.data[i]).toBeCloseTo(0, 5);
    }
  });
});

/* ══════════════════════════════════════════════════════
   Tile Slicing
   ══════════════════════════════════════════════════════ */

describe('computeTileGrid', () => {
  it('covers a raster exactly', () => {
    const grid = computeTileGrid(8, 8, 4, 0);
    expect(grid.length).toBe(4); // 2×2
    expect(grid[0]).toEqual({ row: 0, col: 0, srcY: 0, srcX: 0 });
    expect(grid[3]).toEqual({ row: 1, col: 1, srcY: 4, srcX: 4 });
  });

  it('handles overlap', () => {
    const grid = computeTileGrid(8, 8, 4, 2);
    // step = 2, so cols: 0,2,4,6 → 4 per row; rows: 0,2,4,6 → 4 rows → 16 tiles
    expect(grid.length).toBe(16);
  });

  it('handles raster smaller than tile', () => {
    const grid = computeTileGrid(3, 3, 8, 0);
    expect(grid.length).toBe(1);
  });
});

describe('extractTile', () => {
  it('extracts a tile from a single-band raster', () => {
    const raster: RasterTile = {
      data: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      bands: 1,
      height: 4,
      width: 4,
    };
    const tile = extractTile(raster, 0, 0, 2);
    expect(tile.height).toBe(2);
    expect(tile.width).toBe(2);
    expect(Array.from(tile.data)).toEqual([1, 2, 5, 6]);
  });

  it('zero-pads when tile extends beyond raster', () => {
    const raster: RasterTile = {
      data: new Float32Array([1, 2, 3, 4]),
      bands: 1,
      height: 2,
      width: 2,
    };
    const tile = extractTile(raster, 1, 1, 2);
    // Only pixel at (1,1) = 4 is inside raster
    expect(tile.data[0]).toBe(4);
    expect(tile.data[1]).toBe(0); // padded
    expect(tile.data[2]).toBe(0); // padded
    expect(tile.data[3]).toBe(0); // padded
  });

  it('handles multi-band raster', () => {
    const raster: RasterTile = {
      data: new Float32Array([
        // Band 0
        1, 2, 3, 4,
        // Band 1
        10, 20, 30, 40,
      ]),
      bands: 2,
      height: 2,
      width: 2,
    };
    const tile = extractTile(raster, 0, 0, 2);
    expect(tile.bands).toBe(2);
    expect(Array.from(tile.data.slice(0, 4))).toEqual([1, 2, 3, 4]);
    expect(Array.from(tile.data.slice(4, 8))).toEqual([10, 20, 30, 40]);
  });
});

/* ══════════════════════════════════════════════════════
   Inference Decode
   ══════════════════════════════════════════════════════ */

describe('decodeTileOutput', () => {
  it('picks argmax class per pixel', () => {
    const numClasses = 3;
    const h = 2;
    const w = 2;
    // Class 0: [0.1, 0.8, 0.1, 0.1]
    // Class 1: [0.8, 0.1, 0.1, 0.1]
    // Class 2: [0.1, 0.1, 0.8, 0.8]
    const probs = new Float32Array([
      0.1, 0.8, 0.1, 0.1, // class 0
      0.8, 0.1, 0.1, 0.1, // class 1
      0.1, 0.1, 0.8, 0.8, // class 2
    ]);
    const output = { data: probs, dims: [1, numClasses, h, w] };
    const result = decodeTileOutput(output, numClasses, h, w);

    expect(result.labels[0]).toBe(1); // pixel 0: class 1 has 0.8
    expect(result.labels[1]).toBe(0); // pixel 1: class 0 has 0.8
    expect(result.labels[2]).toBe(2); // pixel 2: class 2 has 0.8
    expect(result.labels[3]).toBe(2); // pixel 3: class 2 has 0.8
  });

  it('returns correct dimensions', () => {
    const probs = new Float32Array(6 * 4 * 4);
    const result = decodeTileOutput({ data: probs, dims: [1, 6, 4, 4] }, 6, 4, 4);
    expect(result.height).toBe(4);
    expect(result.width).toBe(4);
    expect(result.labels.length).toBe(16);
  });
});

/* ══════════════════════════════════════════════════════
   Postprocessing
   ══════════════════════════════════════════════════════ */

describe('morphologicalCleanup', () => {
  it('removes small isolated pixels', () => {
    // 4×4 grid: all class 0, except one isolated pixel at (1,1) is class 1
    const labels = new Uint8Array([
      0, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
    ]);
    const tile: ClassifiedTile = {
      labels,
      probabilities: new Float32Array(6 * 16),
      height: 4,
      width: 4,
    };
    morphologicalCleanup(tile, 4); // minArea=4 → remove components < 4 pixels
    expect(tile.labels[5]).toBe(0); // replaced with neighbor class
  });

  it('preserves large components', () => {
    // 4×4 grid: top half class 0, bottom half class 1
    const labels = new Uint8Array([
      0, 0, 0, 0,
      0, 0, 0, 0,
      1, 1, 1, 1,
      1, 1, 1, 1,
    ]);
    const tile: ClassifiedTile = {
      labels,
      probabilities: new Float32Array(6 * 16),
      height: 4,
      width: 4,
    };
    morphologicalCleanup(tile, 4);
    // Both components have 8 pixels → neither removed
    expect(tile.labels[0]).toBe(0);
    expect(tile.labels[8]).toBe(1);
  });
});

/* ══════════════════════════════════════════════════════
   Accuracy Metrics
   ══════════════════════════════════════════════════════ */

describe('confusionMatrix', () => {
  it('builds correct matrix for perfect prediction', () => {
    const gt = new Uint8Array([0, 1, 2, 0, 1, 2]);
    const pred = new Uint8Array([0, 1, 2, 0, 1, 2]);
    const cm = confusionMatrix(pred, gt, 3, ['A', 'B', 'C']);
    expect(cm.matrix[0][0]).toBe(2);
    expect(cm.matrix[1][1]).toBe(2);
    expect(cm.matrix[2][2]).toBe(2);
    // Off-diagonal should be 0
    expect(cm.matrix[0][1]).toBe(0);
    expect(cm.matrix[1][0]).toBe(0);
  });

  it('counts misclassifications correctly', () => {
    const gt = new Uint8Array([0, 0, 1, 1]);
    const pred = new Uint8Array([0, 1, 1, 0]);
    const cm = confusionMatrix(pred, gt, 2, ['A', 'B']);
    expect(cm.matrix[0][0]).toBe(1); // TP for A
    expect(cm.matrix[0][1]).toBe(1); // A predicted as B
    expect(cm.matrix[1][1]).toBe(1); // TP for B
    expect(cm.matrix[1][0]).toBe(1); // B predicted as A
  });
});

describe('computeClassMetrics', () => {
  it('computes perfect metrics', () => {
    const cm = confusionMatrix(
      new Uint8Array([0, 1, 2, 0, 1, 2]),
      new Uint8Array([0, 1, 2, 0, 1, 2]),
      3,
      ['A', 'B', 'C'],
    );
    const metrics = computeClassMetrics(cm);
    expect(metrics.length).toBe(3);
    for (const m of metrics) {
      expect(m.precision).toBeCloseTo(1, 5);
      expect(m.recall).toBeCloseTo(1, 5);
      expect(m.f1).toBeCloseTo(1, 5);
    }
  });

  it('handles zero support class', () => {
    const cm = confusionMatrix(
      new Uint8Array([0, 0, 0]),
      new Uint8Array([0, 0, 0]),
      3,
      ['A', 'B', 'C'],
    );
    const metrics = computeClassMetrics(cm);
    expect(metrics[1].f1).toBe(0);
    expect(metrics[1].support).toBe(0);
  });
});

describe('accuracyReport', () => {
  it('computes overall accuracy', () => {
    const gt = new Uint8Array([0, 1, 2, 0, 1, 2]);
    const pred = new Uint8Array([0, 1, 2, 0, 1, 2]);
    const report = accuracyReport(pred, gt, 3, ['A', 'B', 'C']);
    expect(report.overallAccuracy).toBeCloseTo(1, 5);
    expect(report.meanF1).toBeCloseTo(1, 5);
  });

  it('handles partial correctness', () => {
    const gt = new Uint8Array([0, 0, 1, 1]);
    const pred = new Uint8Array([0, 1, 1, 0]);
    const report = accuracyReport(pred, gt, 2, ['A', 'B']);
    expect(report.overallAccuracy).toBeCloseTo(0.5, 5);
    expect(report.meanF1).toBeCloseTo(0.5, 5);
  });

  it('includes all 6 land cover classes by default', () => {
    const gt = new Uint8Array([0, 1, 2, 3, 4, 5]);
    const pred = new Uint8Array([0, 1, 2, 3, 4, 5]);
    const report = accuracyReport(pred, gt, 6);
    expect(report.perClass.length).toBe(6);
    expect(report.perClass[0].className).toBe('built_up');
    expect(report.perClass[5].className).toBe('agriculture');
  });
});

/* ══════════════════════════════════════════════════════
   Full pipeline (end-to-end with mock runtime)
   ══════════════════════════════════════════════════════ */

describe('classifyRaster (E2E)', () => {
  let runtime: ONNXRuntimeManager;

  beforeEach(async () => {
    const adapter = createClassifierAdapter(6);
    runtime = new ONNXRuntimeManager(
      { adapter, memoryBudgetBytes: 512 * 1024 * 1024 },
      new ModelRegistry(),
    );
    await runtime.loadModel('unet-landcover-256', 'mock-model');
  });

  it('classifies a single-tile raster', async () => {
    const raster = makeRaster(4, 4, 4, 100);
    const result = await classifyRaster(raster, runtime, {
      modelId: 'unet-landcover-256',
      tileSize: 4,
    });
    expect(result.height).toBe(4);
    expect(result.width).toBe(4);
    expect(result.labels.length).toBe(16);
    // Mock adapter returns class 0 dominant
    for (let i = 0; i < 16; i++) {
      expect(result.labels[i]).toBe(0);
    }
  });

  it('classifies a multi-tile raster', async () => {
    const raster = makeRaster(4, 8, 8, 200);
    const result = await classifyRaster(raster, runtime, {
      modelId: 'unet-landcover-256',
      tileSize: 4,
      overlap: 0,
    });
    expect(result.height).toBe(8);
    expect(result.width).toBe(8);
    expect(result.labels.length).toBe(64);
  });

  it('supports overlapping tiles', async () => {
    const raster = makeRaster(4, 8, 8, 150);
    const result = await classifyRaster(raster, runtime, {
      modelId: 'unet-landcover-256',
      tileSize: 4,
      overlap: 2,
    });
    expect(result.labels.length).toBe(64);
  });

  it('handles raster smaller than tile size', async () => {
    const raster = makeRaster(4, 2, 2, 50);
    const result = await classifyRaster(raster, runtime, {
      modelId: 'unet-landcover-256',
      tileSize: 4,
    });
    expect(result.height).toBe(2);
    expect(result.width).toBe(2);
    expect(result.labels.length).toBe(4);
  });

  it('respects abort signal', async () => {
    const raster = makeRaster(4, 4, 4, 100);
    const ac = new AbortController();
    ac.abort();
    await expect(
      classifyRaster(raster, runtime, {
        modelId: 'unet-landcover-256',
        tileSize: 4,
      }, ac.signal),
    ).rejects.toThrow(/abort/i);
  });

  it('returns probabilities alongside labels', async () => {
    const raster = makeRaster(4, 4, 4, 100);
    const result = await classifyRaster(raster, runtime, {
      modelId: 'unet-landcover-256',
      tileSize: 4,
    });
    // probabilities shape: [6, 4, 4] = 96 floats
    expect(result.probabilities.length).toBe(6 * 4 * 4);
    // Class-0 prob should be ~0.9 for each pixel
    expect(result.probabilities[0]).toBeCloseTo(0.9, 1);
  });

  it('can compute accuracy on classified output', async () => {
    const raster = makeRaster(4, 4, 4, 100);
    const result = await classifyRaster(raster, runtime, {
      modelId: 'unet-landcover-256',
      tileSize: 4,
    });
    // Ground truth: all class 0 (matches mock output)
    const gt = new Uint8Array(16).fill(0);
    const report = accuracyReport(result.labels, gt, 6);
    expect(report.overallAccuracy).toBeCloseTo(1, 5);
  });
});
