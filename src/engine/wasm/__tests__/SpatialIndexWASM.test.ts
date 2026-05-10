import { describe, expect, it } from 'vitest';
import {
  bruteForceBoundingBox,
  bruteForceNearest,
  createBenchmarkQuerySuite,
  generateSyntheticSpatialRecords,
  SpatialIndexWASM,
} from '../SpatialIndexWASM';

describe('SpatialIndexWASM', () => {
  it('matches brute-force bounding box hits for deterministic records', async () => {
    const records = generateSyntheticSpatialRecords({
      size: 1200,
      bbox: [0, 0, 10, 10],
      seed: 21,
    });
    const index = await SpatialIndexWASM.create(records, { preferredBackend: 'javascript', leafSize: 32 });
    const query = { minX: 2.5, minY: 2.5, maxX: 6.2, maxY: 6.4, limit: 18 };

    const accelerated = index.queryBoundingBox(query);
    const baseline = bruteForceBoundingBox(records, query);

    expect(accelerated.hits.map((hit) => hit.id)).toEqual(baseline.hits.map((hit) => hit.id));
  });

  it('returns the same nearest-neighbor ordering as the brute-force baseline', async () => {
    const records = generateSyntheticSpatialRecords({
      size: 1400,
      bbox: [10, 10, 20, 20],
      seed: 11,
    });
    const index = await SpatialIndexWASM.create(records, { preferredBackend: 'wasm', leafSize: 48 });
    const query = { x: 14.6, y: 14.8, maxResults: 6, maxDistance: 3.5 };

    const accelerated = index.queryNearest(query);
    const baseline = bruteForceNearest(records, query);

    expect(accelerated.hits.map((hit) => hit.id)).toEqual(baseline.hits.map((hit) => hit.id));
  });

  it('produces a consistent benchmark summary against the baseline suite', async () => {
    const records = generateSyntheticSpatialRecords({
      size: 3000,
      bbox: [28.8, 40.9, 29.2, 41.2],
      seed: 7,
    });
    const index = await SpatialIndexWASM.create(records, { preferredBackend: 'javascript', leafSize: 64 });
    const suite = createBenchmarkQuerySuite([28.8, 40.9, 29.2, 41.2], 5);

    const benchmark = index.benchmark(suite);

    expect(benchmark.datasetSize).toBe(3000);
    expect(benchmark.queryCount).toBe(24);
    expect(benchmark.baselineMs).toBeGreaterThanOrEqual(0);
    expect(benchmark.backendMs).toBeGreaterThanOrEqual(0);
    expect(benchmark.consistent).toBe(true);
  });
});