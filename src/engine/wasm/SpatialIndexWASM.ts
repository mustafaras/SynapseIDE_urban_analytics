import { SPATIAL_INDEX_WASM_BYTES } from './generated/spatialIndexKernel';

export type SpatialIndexBackend = 'wasm' | 'javascript';

type BoundsLike = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export interface SpatialIndexRecord<T extends Record<string, unknown> = Record<string, unknown>> extends BoundsLike {
  id: string;
  properties?: T;
}

export interface SpatialIndexBoundingBoxQuery {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  limit?: number;
}

export interface SpatialIndexNearestQuery {
  x: number;
  y: number;
  maxResults?: number;
  maxDistance?: number;
}

export interface SpatialIndexHit<T extends Record<string, unknown> = Record<string, unknown>> extends SpatialIndexRecord<T> {
  centroidX: number;
  centroidY: number;
  distance?: number;
}

export interface SpatialIndexQueryTiming {
  backend: SpatialIndexBackend;
  elapsedMs: number;
  candidateCount: number;
  scannedLeaves: number;
  resultCount: number;
}

export interface SpatialIndexQueryResult<T extends Record<string, unknown> = Record<string, unknown>> {
  hits: SpatialIndexHit<T>[];
  timing: SpatialIndexQueryTiming;
}

export interface SpatialIndexCapability {
  preferredBackend: SpatialIndexBackend;
  resolvedBackend: SpatialIndexBackend;
  wasmAvailable: boolean;
  usingFallback: boolean;
  fallbackReason: string | undefined;
}

export interface SpatialIndexBenchmarkSummary {
  datasetSize: number;
  queryCount: number;
  baselineMs: number;
  backendMs: number;
  bboxBaselineMs: number;
  bboxBackendMs: number;
  nearestBaselineMs: number;
  nearestBackendMs: number;
  speedup: number;
  consistent: boolean;
  backend: SpatialIndexBackend;
}

export interface SpatialIndexBuildInfo {
  buildMs: number;
  bucketCount: number;
  leafSize: number;
  recordCount: number;
}

export interface SpatialIndexOptions {
  preferredBackend?: SpatialIndexBackend;
  leafSize?: number;
}

interface OrderedRecord<T extends Record<string, unknown>> extends SpatialIndexRecord<T> {
  centroidX: number;
  centroidY: number;
  originalIndex: number;
  sortKey: string;
}

interface SpatialLeaf {
  start: number;
  end: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface SpatialQuerySuite {
  bboxQueries: SpatialIndexBoundingBoxQuery[];
  nearestQueries: SpatialIndexNearestQuery[];
}

interface WasmKernelExports {
  memory: WebAssembly.Memory;
  alloc: (size: number) => number;
  reset_alloc: () => void;
  bbox_scan: (
    start: number,
    end: number,
    minXPtr: number,
    minYPtr: number,
    maxXPtr: number,
    maxYPtr: number,
    queryMinX: number,
    queryMinY: number,
    queryMaxX: number,
    queryMaxY: number,
    outPtr: number,
  ) => number;
  distance_scan: (
    start: number,
    end: number,
    centroidXPtr: number,
    centroidYPtr: number,
    queryX: number,
    queryY: number,
    outPtr: number,
  ) => number;
}

interface WasmKernelLayout {
  minXPtr: number;
  minYPtr: number;
  maxXPtr: number;
  maxYPtr: number;
  centroidXPtr: number;
  centroidYPtr: number;
  bboxOutputPtr: number;
  distanceOutputPtr: number;
}

let wasmKernelPromise: Promise<WasmKernelExports | null> | null = null;

const DEFAULT_LEAF_SIZE = 64;
const DEFAULT_MAX_NEAREST = 8;
const SQRT_2 = Math.sqrt(2);

function now(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function stableSortCompare(
  a: Pick<OrderedRecord<Record<string, unknown>>, 'centroidX' | 'centroidY' | 'sortKey'>,
  b: Pick<OrderedRecord<Record<string, unknown>>, 'centroidX' | 'centroidY' | 'sortKey'>,
  axis: 'x' | 'y',
): number {
  if (axis === 'x') {
    if (a.centroidX !== b.centroidX) {
      return a.centroidX - b.centroidX;
    }
    if (a.centroidY !== b.centroidY) {
      return a.centroidY - b.centroidY;
    }
  } else {
    if (a.centroidY !== b.centroidY) {
      return a.centroidY - b.centroidY;
    }
    if (a.centroidX !== b.centroidX) {
      return a.centroidX - b.centroidX;
    }
  }
  return a.sortKey.localeCompare(b.sortKey);
}

function intersectsBounds(record: BoundsLike, query: SpatialIndexBoundingBoxQuery): boolean {
  return !(record.maxX < query.minX || record.minX > query.maxX || record.maxY < query.minY || record.minY > query.maxY);
}

function pointDistanceSquared(x: number, y: number, record: { centroidX: number; centroidY: number }): number {
  const dx = record.centroidX - x;
  const dy = record.centroidY - y;
  return (dx * dx) + (dy * dy);
}

function boxDistanceSquared(x: number, y: number, bounds: Pick<SpatialLeaf, 'minX' | 'minY' | 'maxX' | 'maxY'>): number {
  const dx = x < bounds.minX ? bounds.minX - x : x > bounds.maxX ? x - bounds.maxX : 0;
  const dy = y < bounds.minY ? bounds.minY - y : y > bounds.maxY ? y - bounds.maxY : 0;
  return (dx * dx) + (dy * dy);
}

function buildOrderedRecords<T extends Record<string, unknown>>(records: SpatialIndexRecord<T>[]): OrderedRecord<T>[] {
  return records.map((record, index) => ({
    ...record,
    centroidX: (record.minX + record.maxX) / 2,
    centroidY: (record.minY + record.maxY) / 2,
    originalIndex: index,
    sortKey: `${record.id}\u0000${index}`,
  }));
}

function computeLeafBounds<T extends Record<string, unknown>>(records: OrderedRecord<T>[], start: number, end: number): SpatialLeaf {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let index = start; index < end; index += 1) {
    const record = records[index];
    if (record.minX < minX) minX = record.minX;
    if (record.minY < minY) minY = record.minY;
    if (record.maxX > maxX) maxX = record.maxX;
    if (record.maxY > maxY) maxY = record.maxY;
  }

  return { start, end, minX, minY, maxX, maxY };
}

function partitionLeaves<T extends Record<string, unknown>>(records: OrderedRecord<T>[], leafSize: number): SpatialLeaf[] {
  const leaves: SpatialLeaf[] = [];

  function visit(start: number, end: number): void {
    const count = end - start;
    if (count <= leafSize) {
      leaves.push(computeLeafBounds(records, start, end));
      return;
    }

    let minCentroidX = Number.POSITIVE_INFINITY;
    let maxCentroidX = Number.NEGATIVE_INFINITY;
    let minCentroidY = Number.POSITIVE_INFINITY;
    let maxCentroidY = Number.NEGATIVE_INFINITY;

    for (let index = start; index < end; index += 1) {
      const record = records[index];
      if (record.centroidX < minCentroidX) minCentroidX = record.centroidX;
      if (record.centroidX > maxCentroidX) maxCentroidX = record.centroidX;
      if (record.centroidY < minCentroidY) minCentroidY = record.centroidY;
      if (record.centroidY > maxCentroidY) maxCentroidY = record.centroidY;
    }

    const axis = (maxCentroidX - minCentroidX) >= (maxCentroidY - minCentroidY) ? 'x' : 'y';
    const sorted = records.slice(start, end).sort((a, b) => stableSortCompare(a, b, axis));
    for (let index = 0; index < sorted.length; index += 1) {
      records[start + index] = sorted[index];
    }

    const middle = start + Math.ceil(count / 2);
    visit(start, middle);
    visit(middle, end);
  }

  visit(0, records.length);
  return leaves;
}

function computeDatasetBounds<T extends Record<string, unknown>>(records: OrderedRecord<T>[]): readonly [number, number, number, number] {
  if (records.length === 0) {
    return [2.12, 41.35, 2.22, 41.43];
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const record of records) {
    if (record.minX < minX) minX = record.minX;
    if (record.minY < minY) minY = record.minY;
    if (record.maxX > maxX) maxX = record.maxX;
    if (record.maxY > maxY) maxY = record.maxY;
  }

  return [minX, minY, maxX, maxY];
}

function copyFloat64(memory: ArrayBufferLike, ptr: number, values: Float64Array): void {
  new Float64Array(memory, ptr, values.length).set(values);
}

async function loadKernel(): Promise<WasmKernelExports | null> {
  if (wasmKernelPromise) {
    return wasmKernelPromise;
  }

  wasmKernelPromise = (async () => {
    if (typeof WebAssembly === 'undefined') {
      return null;
    }

    const compiled = await WebAssembly.instantiate(SPATIAL_INDEX_WASM_BYTES, {});
    const exports = compiled.instance.exports as unknown as Partial<WasmKernelExports>;
    if (!exports.memory || !exports.alloc || !exports.reset_alloc || !exports.bbox_scan || !exports.distance_scan) {
      return null;
    }
    return exports as WasmKernelExports;
  })();

  return wasmKernelPromise;
}

function clampLimit(limit: number | undefined, fallback: number): number {
  if (!Number.isFinite(limit) || limit === undefined) {
    return fallback;
  }
  return Math.max(1, Math.floor(limit));
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSyntheticSpatialRecords(options: {
  size: number;
  bbox?: readonly [number, number, number, number];
  seed?: number;
}): SpatialIndexRecord<{ cluster: number; synthetic: true }>[] {
  const bbox = options.bbox ?? [2.12, 41.35, 2.22, 41.43];
  const random = mulberry32(options.seed ?? 1337);
  const [minX, minY, maxX, maxY] = bbox;
  const width = maxX - minX;
  const height = maxY - minY;
  const clusterCount = 6;
  const clusters = Array.from({ length: clusterCount }, (_, clusterIndex) => ({
    x: minX + width * (0.15 + (clusterIndex % 3) * 0.28 + random() * 0.06),
    y: minY + height * (0.16 + Math.floor(clusterIndex / 3) * 0.34 + random() * 0.08),
  }));

  return Array.from({ length: options.size }, (_, index) => {
    const cluster = clusters[index % clusters.length];
    const spanX = width * (0.002 + (random() * 0.004));
    const spanY = height * (0.002 + (random() * 0.004));
    const centerX = Math.min(maxX, Math.max(minX, cluster.x + ((random() - 0.5) * width * 0.08)));
    const centerY = Math.min(maxY, Math.max(minY, cluster.y + ((random() - 0.5) * height * 0.08)));
    return {
      id: `synthetic-${index + 1}`,
      minX: centerX - (spanX / 2),
      minY: centerY - (spanY / 2),
      maxX: centerX + (spanX / 2),
      maxY: centerY + (spanY / 2),
      properties: {
        cluster: index % clusters.length,
        synthetic: true,
      },
    };
  });
}

export function createBenchmarkQuerySuite(bbox: readonly [number, number, number, number], seed = 11): SpatialQuerySuite {
  const [minX, minY, maxX, maxY] = bbox;
  const width = maxX - minX;
  const height = maxY - minY;
  const random = mulberry32(seed);

  const bboxQueries = Array.from({ length: 12 }, (_, index) => {
    const qWidth = width * (0.08 + (random() * 0.12));
    const qHeight = height * (0.08 + (random() * 0.12));
    const startX = minX + (width - qWidth) * (0.08 + ((index % 4) * 0.18) + random() * 0.06);
    const startY = minY + (height - qHeight) * (0.1 + (Math.floor(index / 4) * 0.18) + random() * 0.05);
    return {
      minX: startX,
      minY: startY,
      maxX: Math.min(maxX, startX + qWidth),
      maxY: Math.min(maxY, startY + qHeight),
      limit: 48,
    };
  });

  const nearestQueries = Array.from({ length: 12 }, (_, index) => ({
    x: minX + width * (0.14 + ((index % 4) * 0.2) + random() * 0.05),
    y: minY + height * (0.15 + (Math.floor(index / 4) * 0.2) + random() * 0.05),
    maxResults: 8,
    maxDistance: Math.max(width, height) * 0.2 * SQRT_2,
  }));

  return { bboxQueries, nearestQueries };
}

function serialiseIds<T extends Record<string, unknown>>(hits: SpatialIndexHit<T>[]): string {
  return hits.map((hit) => hit.id).join('|');
}

class WasmRangeScanner {
  readonly memory: WebAssembly.Memory;
  readonly exports: WasmKernelExports;
  readonly layout: WasmKernelLayout;
  readonly maxLeafSize: number;

  private constructor(exports: WasmKernelExports, layout: WasmKernelLayout, maxLeafSize: number) {
    this.memory = exports.memory;
    this.exports = exports;
    this.layout = layout;
    this.maxLeafSize = maxLeafSize;
  }

  static async create<T extends Record<string, unknown>>(records: OrderedRecord<T>[], maxLeafSize: number): Promise<WasmRangeScanner | null> {
    const exports = await loadKernel();
    if (!exports) {
      return null;
    }

    exports.reset_alloc();
    const byteCount = records.length * Float64Array.BYTES_PER_ELEMENT;
    const layout: WasmKernelLayout = {
      minXPtr: exports.alloc(byteCount),
      minYPtr: exports.alloc(byteCount),
      maxXPtr: exports.alloc(byteCount),
      maxYPtr: exports.alloc(byteCount),
      centroidXPtr: exports.alloc(byteCount),
      centroidYPtr: exports.alloc(byteCount),
      bboxOutputPtr: exports.alloc(maxLeafSize * Uint32Array.BYTES_PER_ELEMENT),
      distanceOutputPtr: exports.alloc(maxLeafSize * Float64Array.BYTES_PER_ELEMENT),
    };

    const minX = new Float64Array(records.map((record) => record.minX));
    const minY = new Float64Array(records.map((record) => record.minY));
    const maxX = new Float64Array(records.map((record) => record.maxX));
    const maxY = new Float64Array(records.map((record) => record.maxY));
    const centroidX = new Float64Array(records.map((record) => record.centroidX));
    const centroidY = new Float64Array(records.map((record) => record.centroidY));

    copyFloat64(exports.memory.buffer, layout.minXPtr, minX);
    copyFloat64(exports.memory.buffer, layout.minYPtr, minY);
    copyFloat64(exports.memory.buffer, layout.maxXPtr, maxX);
    copyFloat64(exports.memory.buffer, layout.maxYPtr, maxY);
    copyFloat64(exports.memory.buffer, layout.centroidXPtr, centroidX);
    copyFloat64(exports.memory.buffer, layout.centroidYPtr, centroidY);

    return new WasmRangeScanner(exports, layout, maxLeafSize);
  }

  scanBBox(start: number, end: number, query: SpatialIndexBoundingBoxQuery): Uint32Array {
    const hitCount = this.exports.bbox_scan(
      start,
      end,
      this.layout.minXPtr,
      this.layout.minYPtr,
      this.layout.maxXPtr,
      this.layout.maxYPtr,
      query.minX,
      query.minY,
      query.maxX,
      query.maxY,
      this.layout.bboxOutputPtr,
    );
    return new Uint32Array(this.memory.buffer, this.layout.bboxOutputPtr, hitCount).slice();
  }

  scanDistances(start: number, end: number, x: number, y: number): Float64Array {
    const count = this.exports.distance_scan(
      start,
      end,
      this.layout.centroidXPtr,
      this.layout.centroidYPtr,
      x,
      y,
      this.layout.distanceOutputPtr,
    );
    return new Float64Array(this.memory.buffer, this.layout.distanceOutputPtr, count).slice();
  }
}

export class SpatialIndexWASM<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly buildInfo: SpatialIndexBuildInfo;

  private readonly records: OrderedRecord<T>[];

  private readonly leaves: SpatialLeaf[];

  private readonly preferredBackend: SpatialIndexBackend;

  private readonly resolvedBackend: SpatialIndexBackend;

  private readonly fallbackReason: string | undefined;

  private readonly scanner: WasmRangeScanner | null;

  private constructor(
    records: OrderedRecord<T>[],
    leaves: SpatialLeaf[],
    buildInfo: SpatialIndexBuildInfo,
    scanner: WasmRangeScanner | null,
    preferredBackend: SpatialIndexBackend,
    resolvedBackend: SpatialIndexBackend,
    fallbackReason?: string,
  ) {
    this.records = records;
    this.leaves = leaves;
    this.buildInfo = buildInfo;
    this.scanner = scanner;
    this.preferredBackend = preferredBackend;
    this.resolvedBackend = resolvedBackend;
    this.fallbackReason = fallbackReason;
  }

  static async create<T extends Record<string, unknown> = Record<string, unknown>>(
    sourceRecords: SpatialIndexRecord<T>[],
    options: SpatialIndexOptions = {},
  ): Promise<SpatialIndexWASM<T>> {
    const startedAt = now();
    const preferredBackend = options.preferredBackend ?? 'wasm';
    const leafSize = clampLimit(options.leafSize, DEFAULT_LEAF_SIZE);
    const records = buildOrderedRecords(sourceRecords);
    const leaves = partitionLeaves(records, leafSize);
    let scanner: WasmRangeScanner | null = null;
    let resolvedBackend: SpatialIndexBackend = 'javascript';
    let fallbackReason: string | undefined;

    if (preferredBackend === 'wasm') {
      try {
        scanner = await WasmRangeScanner.create(records, leafSize);
        if (scanner) {
          resolvedBackend = 'wasm';
        } else {
          fallbackReason = 'WebAssembly runtime is unavailable in this environment.';
        }
      } catch (error) {
        fallbackReason = error instanceof Error ? error.message : 'Unknown WebAssembly failure.';
      }
    }

    const buildInfo: SpatialIndexBuildInfo = {
      buildMs: now() - startedAt,
      bucketCount: leaves.length,
      leafSize,
      recordCount: records.length,
    };

    return new SpatialIndexWASM(records, leaves, buildInfo, scanner, preferredBackend, resolvedBackend, fallbackReason);
  }

  getCapability(): SpatialIndexCapability {
    return {
      preferredBackend: this.preferredBackend,
      resolvedBackend: this.resolvedBackend,
      wasmAvailable: this.scanner !== null,
      usingFallback: this.resolvedBackend !== this.preferredBackend,
      fallbackReason: this.fallbackReason,
    };
  }

  queryBoundingBox(query: SpatialIndexBoundingBoxQuery): SpatialIndexQueryResult<T> {
    const limit = clampLimit(query.limit, Number.POSITIVE_INFINITY);
    const startedAt = now();
    const matched: OrderedRecord<T>[] = [];
    let candidateCount = 0;
    let scannedLeaves = 0;

    for (const leaf of this.leaves) {
      if (!(leaf.maxX < query.minX || leaf.minX > query.maxX || leaf.maxY < query.minY || leaf.minY > query.maxY)) {
        scannedLeaves += 1;
        if (this.resolvedBackend === 'wasm' && this.scanner) {
          const indexes = this.scanner.scanBBox(leaf.start, leaf.end, query);
          candidateCount += leaf.end - leaf.start;
          for (const index of indexes) {
            const record = this.records[index];
            if (intersectsBounds(record, query)) {
              matched.push(record);
            }
          }
        } else {
          for (let index = leaf.start; index < leaf.end; index += 1) {
            candidateCount += 1;
            const record = this.records[index];
            if (intersectsBounds(record, query)) {
              matched.push(record);
            }
          }
        }
      }
    }

    matched.sort((left, right) => left.originalIndex - right.originalIndex);
    const hits = matched.slice(0, limit).map((record) => this.toHit(record));

    return {
      hits,
      timing: {
        backend: this.resolvedBackend,
        elapsedMs: now() - startedAt,
        candidateCount,
        scannedLeaves,
        resultCount: hits.length,
      },
    };
  }

  queryNearest(query: SpatialIndexNearestQuery): SpatialIndexQueryResult<T> {
    const maxResults = clampLimit(query.maxResults, DEFAULT_MAX_NEAREST);
    const maxDistanceSquared = Number.isFinite(query.maxDistance)
      ? (query.maxDistance as number) * (query.maxDistance as number)
      : Number.POSITIVE_INFINITY;
    const startedAt = now();
    let candidateCount = 0;
    let scannedLeaves = 0;
    const best: Array<{ record: OrderedRecord<T>; distanceSquared: number }> = [];

    const sortedLeaves = [...this.leaves].sort(
      (left, right) => boxDistanceSquared(query.x, query.y, left) - boxDistanceSquared(query.x, query.y, right),
    );

    const insertCandidate = (record: OrderedRecord<T>, distanceSquared: number) => {
      if (distanceSquared > maxDistanceSquared) {
        return;
      }

      const slot = best.findIndex(
        (entry) => distanceSquared < entry.distanceSquared
          || (distanceSquared === entry.distanceSquared && record.originalIndex < entry.record.originalIndex),
      );
      if (slot === -1) {
        if (best.length < maxResults) {
          best.push({ record, distanceSquared });
        }
      } else {
        best.splice(slot, 0, { record, distanceSquared });
      }

      if (best.length > maxResults) {
        best.length = maxResults;
      }
    };

    for (const leaf of sortedLeaves) {
      if (best.length >= maxResults && boxDistanceSquared(query.x, query.y, leaf) > best[best.length - 1].distanceSquared) {
        break;
      }

      scannedLeaves += 1;
      if (this.resolvedBackend === 'wasm' && this.scanner) {
        const distances = this.scanner.scanDistances(leaf.start, leaf.end, query.x, query.y);
        candidateCount += distances.length;
        for (let localIndex = 0; localIndex < distances.length; localIndex += 1) {
          insertCandidate(this.records[leaf.start + localIndex], distances[localIndex]);
        }
      } else {
        for (let index = leaf.start; index < leaf.end; index += 1) {
          candidateCount += 1;
          insertCandidate(this.records[index], pointDistanceSquared(query.x, query.y, this.records[index]));
        }
      }
    }

    return {
      hits: best.map(({ record, distanceSquared }) => ({
        ...this.toHit(record),
        distance: Math.sqrt(distanceSquared),
      })),
      timing: {
        backend: this.resolvedBackend,
        elapsedMs: now() - startedAt,
        candidateCount,
        scannedLeaves,
        resultCount: best.length,
      },
    };
  }

  benchmark(querySuite?: SpatialQuerySuite): SpatialIndexBenchmarkSummary {
    const extent = computeDatasetBounds(this.records);
    const suite = querySuite ?? createBenchmarkQuerySuite(extent);
    const baselineRecords = [...this.records].sort((left, right) => left.originalIndex - right.originalIndex);

    const bboxBaselineStarted = now();
    const bboxBaseline = suite.bboxQueries.map((query) => bruteForceBoundingBox(baselineRecords, query));
    const bboxBaselineMs = now() - bboxBaselineStarted;

    const bboxBackendStarted = now();
    const bboxBackend = suite.bboxQueries.map((query) => this.queryBoundingBox(query));
    const bboxBackendMs = now() - bboxBackendStarted;

    const nearestBaselineStarted = now();
    const nearestBaseline = suite.nearestQueries.map((query) => bruteForceNearest(baselineRecords, query));
    const nearestBaselineMs = now() - nearestBaselineStarted;

    const nearestBackendStarted = now();
    const nearestBackend = suite.nearestQueries.map((query) => this.queryNearest(query));
    const nearestBackendMs = now() - nearestBackendStarted;

    const baselineMs = bboxBaselineMs + nearestBaselineMs;
    const backendMs = bboxBackendMs + nearestBackendMs;
    const consistent = bboxBaseline.every((result, index) => serialiseIds(result.hits) === serialiseIds(bboxBackend[index].hits))
      && nearestBaseline.every((result, index) => serialiseIds(result.hits) === serialiseIds(nearestBackend[index].hits));

    return {
      datasetSize: this.records.length,
      queryCount: suite.bboxQueries.length + suite.nearestQueries.length,
      baselineMs,
      backendMs,
      bboxBaselineMs,
      bboxBackendMs,
      nearestBaselineMs,
      nearestBackendMs,
      speedup: backendMs > 0 ? baselineMs / backendMs : 0,
      consistent,
      backend: this.resolvedBackend,
    };
  }

  private toHit(record: OrderedRecord<T>): SpatialIndexHit<T> {
    const hit: SpatialIndexHit<T> = {
      id: record.id,
      minX: record.minX,
      minY: record.minY,
      maxX: record.maxX,
      maxY: record.maxY,
      centroidX: record.centroidX,
      centroidY: record.centroidY,
    };
    if (record.properties !== undefined) {
      hit.properties = record.properties;
    }
    return hit;
  }
}

export function supportsSpatialIndexWasm(): boolean {
  return typeof WebAssembly !== 'undefined';
}

export function bruteForceBoundingBox<T extends Record<string, unknown>>(
  records: Array<SpatialIndexRecord<T> | OrderedRecord<T>>,
  query: SpatialIndexBoundingBoxQuery,
): SpatialIndexQueryResult<T> {
  const startedAt = now();
  const limit = clampLimit(query.limit, Number.POSITIVE_INFINITY);
  const hits: SpatialIndexHit<T>[] = [];
  let candidateCount = 0;

  for (const record of records) {
    candidateCount += 1;
    if (intersectsBounds(record, query)) {
      const centroidX = 'centroidX' in record ? record.centroidX : (record.minX + record.maxX) / 2;
      const centroidY = 'centroidY' in record ? record.centroidY : (record.minY + record.maxY) / 2;
      const hit: SpatialIndexHit<T> = {
        id: record.id,
        minX: record.minX,
        minY: record.minY,
        maxX: record.maxX,
        maxY: record.maxY,
        centroidX,
        centroidY,
      };
      if (record.properties !== undefined) {
        hit.properties = record.properties;
      }
      hits.push(hit);
    }
    if (hits.length >= limit) {
      break;
    }
  }

  return {
    hits,
    timing: {
      backend: 'javascript',
      elapsedMs: now() - startedAt,
      candidateCount,
      scannedLeaves: 1,
      resultCount: hits.length,
    },
  };
}

export function bruteForceNearest<T extends Record<string, unknown>>(
  records: Array<SpatialIndexRecord<T> | OrderedRecord<T>>,
  query: SpatialIndexNearestQuery,
): SpatialIndexQueryResult<T> {
  const startedAt = now();
  const maxResults = clampLimit(query.maxResults, DEFAULT_MAX_NEAREST);
  const maxDistanceSquared = Number.isFinite(query.maxDistance)
    ? (query.maxDistance as number) * (query.maxDistance as number)
    : Number.POSITIVE_INFINITY;
  const ranked = records
    .map((record) => {
      const centroidX = 'centroidX' in record ? record.centroidX : (record.minX + record.maxX) / 2;
      const centroidY = 'centroidY' in record ? record.centroidY : (record.minY + record.maxY) / 2;
      const dx = centroidX - query.x;
      const dy = centroidY - query.y;
      const distanceSquared = (dx * dx) + (dy * dy);
      return { record, centroidX, centroidY, distanceSquared };
    })
    .filter((entry) => entry.distanceSquared <= maxDistanceSquared)
    .sort((left, right) => left.distanceSquared - right.distanceSquared)
    .slice(0, maxResults);

  return {
    hits: ranked.map(({ record, centroidX, centroidY, distanceSquared }) => {
      const hit: SpatialIndexHit<T> = {
        id: record.id,
        minX: record.minX,
        minY: record.minY,
        maxX: record.maxX,
        maxY: record.maxY,
        centroidX,
        centroidY,
        distance: Math.sqrt(distanceSquared),
      };
      if (record.properties !== undefined) {
        hit.properties = record.properties;
      }
      return hit;
    }),
    timing: {
      backend: 'javascript',
      elapsedMs: now() - startedAt,
      candidateCount: records.length,
      scannedLeaves: 1,
      resultCount: ranked.length,
    },
  };
}