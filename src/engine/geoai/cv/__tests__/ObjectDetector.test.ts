/**
 * ObjectDetector — tile-based detection, NMS, coordinate conversion.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  computeIoU,
  decodeYoloOutput,
  detectObjectsWithInferrer,
  type GeoTransform,
  nonMaxSuppression,
  pixelBoxToGeoBBox,
  type RawDetection,
  type TileInferrer,
  URBAN_OBJECT_CLASSES,
} from '../ObjectDetector';
import type { RasterTile } from '../types';

function makeRaster(bands: number, h: number, w: number, fill = 1): RasterTile {
  return {
    data: new Float32Array(bands * h * w).fill(fill),
    bands,
    height: h,
    width: w,
  };
}

const IDENTITY_TRANSFORM: GeoTransform = {
  originLon: 0,
  originLat: 0,
  pixelLon: 1,
  pixelLat: -1,
};

describe('computeIoU', () => {
  it('returns 0 for disjoint boxes', () => {
    const a: RawDetection = { x: 0, y: 0, width: 10, height: 10, classIndex: 0, confidence: 1 };
    const b: RawDetection = { x: 20, y: 20, width: 10, height: 10, classIndex: 0, confidence: 1 };
    expect(computeIoU(a, b)).toBe(0);
  });

  it('returns 1 for identical boxes', () => {
    const a: RawDetection = { x: 0, y: 0, width: 10, height: 10, classIndex: 0, confidence: 1 };
    expect(computeIoU(a, { ...a })).toBeCloseTo(1, 5);
  });

  it('computes partial overlap correctly', () => {
    // Two 10x10 boxes sharing a 5x5 square → IoU = 25 / (100+100-25) = 25/175
    const a: RawDetection = { x: 0, y: 0, width: 10, height: 10, classIndex: 0, confidence: 1 };
    const b: RawDetection = { x: 5, y: 5, width: 10, height: 10, classIndex: 0, confidence: 1 };
    expect(computeIoU(a, b)).toBeCloseTo(25 / 175, 5);
  });
});

describe('nonMaxSuppression', () => {
  it('suppresses lower-confidence duplicates', () => {
    const boxes: RawDetection[] = [
      { x: 0, y: 0, width: 10, height: 10, classIndex: 0, confidence: 0.9 },
      { x: 1, y: 1, width: 10, height: 10, classIndex: 0, confidence: 0.8 }, // high overlap
      { x: 1, y: 1, width: 10, height: 10, classIndex: 0, confidence: 0.7 },
    ];
    const kept = nonMaxSuppression(boxes, 0.4);
    expect(kept.length).toBe(1);
    expect(kept[0].confidence).toBeCloseTo(0.9);
  });

  it('keeps overlapping boxes of different classes', () => {
    const boxes: RawDetection[] = [
      { x: 0, y: 0, width: 10, height: 10, classIndex: 0, confidence: 0.9 },
      { x: 0, y: 0, width: 10, height: 10, classIndex: 1, confidence: 0.9 },
    ];
    const kept = nonMaxSuppression(boxes, 0.4);
    expect(kept.length).toBe(2);
  });

  it('returns empty for empty input', () => {
    expect(nonMaxSuppression([], 0.4)).toEqual([]);
  });
});

describe('pixelBoxToGeoBBox', () => {
  it('handles a north-up identity transform', () => {
    const bbox = pixelBoxToGeoBBox(10, 20, 5, 5, IDENTITY_TRANSFORM);
    // pixelLat=-1 → y=20 → lat=-20; y=25 → lat=-25. south=-25, north=-20
    expect(bbox).toEqual([10, -25, 15, -20]);
  });

  it('handles positive pixelLat (north-down)', () => {
    const bbox = pixelBoxToGeoBBox(0, 0, 2, 2, {
      originLon: 100,
      originLat: -10,
      pixelLon: 0.5,
      pixelLat: 0.5,
    });
    expect(bbox).toEqual([100, -10, 101, -9]);
  });
});

describe('decodeYoloOutput', () => {
  it('decodes [1, N, 5+C] format and filters by threshold', () => {
    // 2 boxes, 2 classes
    // Box 0: cx=5, cy=5, w=4, h=4, obj=0.9, class0=0.8 → score 0.72
    // Box 1: cx=10, cy=10, w=2, h=2, obj=0.1, class1=0.5 → score 0.05 (filtered)
    const data = new Float32Array([
      5, 5, 4, 4, 0.9, 0.8, 0.1,
      10, 10, 2, 2, 0.1, 0.1, 0.5,
    ]);
    const dets = decodeYoloOutput({ data, dims: [1, 2, 7] }, 2, 0.25);
    expect(dets.length).toBe(1);
    expect(dets[0].classIndex).toBe(0);
    expect(dets[0].x).toBeCloseTo(3);
    expect(dets[0].y).toBeCloseTo(3);
    expect(dets[0].width).toBeCloseTo(4);
    expect(dets[0].confidence).toBeCloseTo(0.72, 5);
  });

  it('decodes [1, 5+C, N] (column-major) layout', () => {
    // Single box, 1 class, column-major: [cx, cy, w, h, obj, p0] each length 1
    const data = new Float32Array([2, 3, 2, 2, 1, 1]);
    const dets = decodeYoloOutput({ data, dims: [1, 6, 1] }, 1, 0.1);
    expect(dets.length).toBe(1);
    expect(dets[0].x).toBeCloseTo(1);
    expect(dets[0].y).toBeCloseTo(2);
  });

  it('returns empty on malformed dims', () => {
    expect(decodeYoloOutput({ data: new Float32Array(2), dims: [2] }, 1, 0.1)).toEqual([]);
  });
});

/* ══════════════════════════════════════════════════════
   Pipeline
   ══════════════════════════════════════════════════════ */

describe('detectObjectsWithInferrer — tiling', () => {
  it('calls inferrer once per tile and invokes progress', async () => {
    const raster = makeRaster(3, 8, 8, 100);
    const infer = vi.fn<TileInferrer>(async () => []);
    const onProgress = vi.fn();

    await detectObjectsWithInferrer(raster, IDENTITY_TRANSFORM, infer, {
      tileSize: 4,
      overlap: 0,
    }, { onProgress });

    // 8x8 → 4 tiles at tileSize=4, overlap=0
    expect(infer).toHaveBeenCalledTimes(4);
    expect(onProgress).toHaveBeenCalledTimes(4);
    const lastCall = onProgress.mock.calls.at(-1)?.[0];
    expect(lastCall?.processedTiles).toBe(4);
    expect(lastCall?.totalTiles).toBe(4);
  });

  it('shifts tile-local detections into raster space and produces geo bbox', async () => {
    const raster = makeRaster(3, 8, 8, 50);
    const infer: TileInferrer = async (_tile, _idx) => {
      // Every tile emits a single detection at its local (1,1,2,2)
      return [{ x: 1, y: 1, width: 2, height: 2, classIndex: 0, confidence: 0.9 }];
    };

    const result = await detectObjectsWithInferrer(raster, IDENTITY_TRANSFORM, infer, {
      tileSize: 4,
      overlap: 0,
      iouThreshold: 0.1,
    });

    // 4 tiles × 1 detection = 4 global boxes at (1,1), (5,1), (1,5), (5,5)
    expect(result.detections.length).toBe(4);
    const boxes = result.detections.map((d) => d.properties as Record<string, number>);
    const origins = boxes.map((p) => [p.pixel_x, p.pixel_y]).sort();
    expect(origins).toEqual([[1, 1], [1, 5], [5, 1], [5, 5]]);

    // Identity transform: bbox in geo should mirror pixel coordinates (lat flipped).
    const d0 = result.detections[0];
    expect(d0.bbox.length).toBe(4);
    expect(d0.className).toBe(URBAN_OBJECT_CLASSES[0]);
  });
});

describe('detectObjectsWithInferrer — cross-tile NMS / merge behavior', () => {
  it('merges duplicate detections that straddle adjacent tiles', async () => {
    const raster = makeRaster(3, 4, 4, 10);
    // Grid iterates row-major: idx 0→(srcY=0,srcX=0), 1→(0,2), 2→(2,0), 3→(2,2).
    // Tiles 0 and 2 share the same column; emit the "same" real-world object
    // from each and confirm cross-tile NMS collapses them.
    const infer: TileInferrer = async (_tile, idx) => {
      if (idx === 0) return [{ x: 1, y: 2, width: 2, height: 2, classIndex: 0, confidence: 0.85 }];
      if (idx === 2) return [{ x: 1, y: 0, width: 2, height: 2, classIndex: 0, confidence: 0.8 }];
      return [];
    };

    const result = await detectObjectsWithInferrer(raster, IDENTITY_TRANSFORM, infer, {
      tileSize: 4,
      overlap: 2,
      iouThreshold: 0.3,
    });

    // Both detections map to roughly the same global pixel box → NMS keeps one.
    expect(result.detections.length).toBe(1);
    expect(result.detections[0].confidence).toBeCloseTo(0.85);
  });

  it('respects per-class confidence thresholds', async () => {
    const raster = makeRaster(3, 4, 4, 10);
    const infer: TileInferrer = async () => [
      { x: 0, y: 0, width: 2, height: 2, classIndex: 0, confidence: 0.5 }, // vehicle
      { x: 0, y: 0, width: 2, height: 2, classIndex: 1, confidence: 0.5 }, // tree
    ];
    const result = await detectObjectsWithInferrer(raster, IDENTITY_TRANSFORM, infer, {
      tileSize: 4,
      overlap: 0,
      confidenceThresholds: { vehicle: 0.9, tree: 0.3 },
    });
    expect(result.detections.length).toBe(1);
    expect(result.detections[0].className).toBe('tree');
  });
});

describe('detectObjectsWithInferrer — edge cases', () => {
  it('returns an empty result for a zero-sized raster', async () => {
    const infer = vi.fn<TileInferrer>(async () => []);
    const result = await detectObjectsWithInferrer(
      { data: new Float32Array(0), bands: 3, height: 0, width: 0 },
      IDENTITY_TRANSFORM,
      infer,
      { tileSize: 4, imageId: 'empty' },
    );
    expect(result.detections).toEqual([]);
    expect(result.imageId).toBe('empty');
    expect(result.classLabels).toEqual([...URBAN_OBJECT_CLASSES]);
    expect(infer).not.toHaveBeenCalled();
  });

  it('returns empty detections when the inferrer produces nothing', async () => {
    const raster = makeRaster(3, 4, 4, 1);
    const result = await detectObjectsWithInferrer(raster, IDENTITY_TRANSFORM, async () => [], {
      tileSize: 4,
    });
    expect(result.detections).toEqual([]);
    expect(result.classLabels?.length).toBe(URBAN_OBJECT_CLASSES.length);
  });

  it('honours abort signal between tiles', async () => {
    const raster = makeRaster(3, 8, 8, 1);
    const ac = new AbortController();
    const infer: TileInferrer = async () => {
      ac.abort();
      return [];
    };
    await expect(
      detectObjectsWithInferrer(raster, IDENTITY_TRANSFORM, infer, { tileSize: 4 }, { signal: ac.signal }),
    ).rejects.toThrow(/abort/i);
  });

  it('rejects invalid tileSize', async () => {
    const raster = makeRaster(3, 4, 4, 1);
    await expect(
      detectObjectsWithInferrer(raster, IDENTITY_TRANSFORM, async () => [], { tileSize: 0 }),
    ).rejects.toThrow(/tileSize/);
  });

  it('clamps boxes that extend past raster bounds', async () => {
    const raster = makeRaster(3, 4, 4, 1);
    const infer: TileInferrer = async () => [
      // Box extends beyond tile edge → must be clipped to raster extent.
      { x: 2, y: 2, width: 10, height: 10, classIndex: 2, confidence: 0.9 },
    ];
    const result = await detectObjectsWithInferrer(raster, IDENTITY_TRANSFORM, infer, {
      tileSize: 4,
      iouThreshold: 0.1,
    });
    expect(result.detections.length).toBe(1);
    const p = result.detections[0].properties as Record<string, number>;
    expect(p.pixel_x + p.pixel_width).toBeLessThanOrEqual(4);
    expect(p.pixel_y + p.pixel_height).toBeLessThanOrEqual(4);
  });
});
