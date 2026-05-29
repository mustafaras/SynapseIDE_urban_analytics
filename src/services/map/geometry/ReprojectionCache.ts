import type { Feature, FeatureCollection, Geometry } from "geojson";
import { normalizeCrs } from "../crs/MapProjectionService";

export const DEFAULT_REPROJECTION_CACHE_MAX_ENTRIES = 12;

export type ReprojectionCacheAccessStatus = "hit" | "miss" | "bypass";

export interface ReprojectionCacheDescriptor {
  sourceId: string;
  sourceCrs: string;
  inputCrs: string;
  targetCrs: string;
  changeToken: string;
  dataVersion: string | null;
}

export interface ReprojectionCacheAccessSummary extends ReprojectionCacheDescriptor {
  key: string;
  status: ReprojectionCacheAccessStatus;
  featureCount: number;
  coordinateCount: number;
  evictedCount: number;
  accessedAt: string;
}

export interface ReprojectionCacheRunSummary {
  hits: number;
  misses: number;
  bypasses: number;
  evictions: number;
  entries: number;
  maxEntries: number;
  hitRate: number;
  projectedFeatureCount: number;
  projectedCoordinateCount: number;
  sourceIds: string[];
  targetCrs: string | null;
  measuredAt: string;
  accesses: ReprojectionCacheAccessSummary[];
}

export interface ReprojectionCacheStats {
  entries: number;
  maxEntries: number;
  hits: number;
  misses: number;
  evictions: number;
  lastAccessedAt: string | null;
}

export interface ReprojectionCacheProjectionResult {
  featureCollection: FeatureCollection;
  access: ReprojectionCacheAccessSummary;
}

interface ReprojectionCacheEntry {
  descriptor: ReprojectionCacheDescriptor;
  featureCollection: FeatureCollection;
  featureCount: number;
  coordinateCount: number;
  lastAccessedAt: string;
}

interface CoordinateStats {
  count: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  first: string | null;
  last: string | null;
}

class ReprojectionCacheStore {
  private entries = new Map<string, ReprojectionCacheEntry>();
  private maxEntries = DEFAULT_REPROJECTION_CACHE_MAX_ENTRIES;
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private lastAccessedAt: string | null = null;

  project(input: {
    descriptor: ReprojectionCacheDescriptor;
    source: FeatureCollection;
    project: () => FeatureCollection;
  }): ReprojectionCacheProjectionResult {
    const descriptor = normalizeDescriptor(input.descriptor);
    const accessedAt = new Date().toISOString();
    this.lastAccessedAt = accessedAt;
    const sourceStats = summarizeFeatureCollection(input.source);

    if (descriptor.inputCrs === descriptor.targetCrs) {
      return {
        featureCollection: input.source,
        access: buildAccessSummary({
          descriptor,
          key: buildReprojectionCacheKey(descriptor),
          status: "bypass",
          featureCount: sourceStats.featureCount,
          coordinateCount: sourceStats.coordinateCount,
          evictedCount: 0,
          accessedAt,
        }),
      };
    }

    const key = buildReprojectionCacheKey(descriptor);
    const cached = this.entries.get(key);
    if (cached) {
      this.hits += 1;
      cached.lastAccessedAt = accessedAt;
      this.entries.delete(key);
      this.entries.set(key, cached);
      return {
        featureCollection: cached.featureCollection,
        access: buildAccessSummary({
          descriptor,
          key,
          status: "hit",
          featureCount: cached.featureCount,
          coordinateCount: cached.coordinateCount,
          evictedCount: 0,
          accessedAt,
        }),
      };
    }

    this.misses += 1;
    const projected = input.project();
    const projectedStats = summarizeFeatureCollection(projected);
    this.entries.set(key, {
      descriptor,
      featureCollection: projected,
      featureCount: projectedStats.featureCount,
      coordinateCount: projectedStats.coordinateCount,
      lastAccessedAt: accessedAt,
    });
    const evictedCount = this.enforceMaxEntries();
    return {
      featureCollection: projected,
      access: buildAccessSummary({
        descriptor,
        key,
        status: "miss",
        featureCount: projectedStats.featureCount,
        coordinateCount: projectedStats.coordinateCount,
        evictedCount,
        accessedAt,
      }),
    };
  }

  stats(): ReprojectionCacheStats {
    return {
      entries: this.entries.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      lastAccessedAt: this.lastAccessedAt,
    };
  }

  reset(maxEntries = DEFAULT_REPROJECTION_CACHE_MAX_ENTRIES): void {
    this.entries.clear();
    this.maxEntries = Math.max(1, Math.floor(maxEntries));
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.lastAccessedAt = null;
  }

  configure(input: { maxEntries?: number }): void {
    if (input.maxEntries != null) {
      this.maxEntries = Math.max(1, Math.floor(input.maxEntries));
      this.enforceMaxEntries();
    }
  }

  private enforceMaxEntries(): number {
    let evictedCount = 0;
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.entries.delete(oldestKey);
      this.evictions += 1;
      evictedCount += 1;
    }
    return evictedCount;
  }
}

const reprojectionCache = new ReprojectionCacheStore();

export function projectFeatureCollectionWithReprojectionCache(input: {
  descriptor: ReprojectionCacheDescriptor;
  source: FeatureCollection;
  project: () => FeatureCollection;
}): ReprojectionCacheProjectionResult {
  return reprojectionCache.project(input);
}

export function getReprojectionCacheStats(): ReprojectionCacheStats {
  return reprojectionCache.stats();
}

export function summarizeReprojectionCacheRun(
  accesses: readonly ReprojectionCacheAccessSummary[],
): ReprojectionCacheRunSummary | null {
  if (accesses.length === 0) return null;
  const stats = getReprojectionCacheStats();
  const hits = accesses.filter((access) => access.status === "hit").length;
  const misses = accesses.filter((access) => access.status === "miss").length;
  const bypasses = accesses.filter((access) => access.status === "bypass").length;
  const measurable = hits + misses;
  const targetCrsValues = uniqueText(accesses.map((access) => access.targetCrs));
  return {
    hits,
    misses,
    bypasses,
    evictions: accesses.reduce((sum, access) => sum + access.evictedCount, 0),
    entries: stats.entries,
    maxEntries: stats.maxEntries,
    hitRate: measurable > 0 ? hits / measurable : 0,
    projectedFeatureCount: accesses.reduce((sum, access) => sum + access.featureCount, 0),
    projectedCoordinateCount: accesses.reduce((sum, access) => sum + access.coordinateCount, 0),
    sourceIds: uniqueText(accesses.map((access) => access.sourceId)),
    targetCrs: targetCrsValues.length === 1 ? targetCrsValues[0]! : null,
    measuredAt: accesses[accesses.length - 1]?.accessedAt ?? new Date().toISOString(),
    accesses: [...accesses],
  };
}

export function buildFeatureCollectionChangeToken(fc: FeatureCollection): string {
  const stats = summarizeFeatureCollection(fc);
  const bbox = stats.coordinateCount > 0
    ? `${formatCoordinate(stats.minX)},${formatCoordinate(stats.minY)},${formatCoordinate(stats.maxX)},${formatCoordinate(stats.maxY)}`
    : "empty";
  const firstFeature = featureToken(fc.features[0]);
  const lastFeature = featureToken(fc.features[fc.features.length - 1]);
  return `fc:${stats.featureCount}:coords:${stats.coordinateCount}:bbox:${bbox}:first:${firstFeature}:last:${lastFeature}`;
}

export function buildReprojectionCacheKey(descriptor: ReprojectionCacheDescriptor): string {
  const normalized = normalizeDescriptor(descriptor);
  return [
    normalized.sourceId,
    normalized.sourceCrs,
    normalized.inputCrs,
    normalized.targetCrs,
    normalized.changeToken,
  ].map(encodeCachePart).join("|");
}

export function __resetReprojectionCacheForTests(input: { maxEntries?: number } = {}): void {
  reprojectionCache.reset(input.maxEntries ?? DEFAULT_REPROJECTION_CACHE_MAX_ENTRIES);
}

export function __configureReprojectionCacheForTests(input: { maxEntries?: number }): void {
  reprojectionCache.configure(input);
}

function normalizeDescriptor(descriptor: ReprojectionCacheDescriptor): ReprojectionCacheDescriptor {
  return {
    sourceId: normalizeToken(descriptor.sourceId, "source"),
    sourceCrs: normalizeCrs(normalizeToken(descriptor.sourceCrs, "unknown")),
    inputCrs: normalizeCrs(normalizeToken(descriptor.inputCrs, "unknown")),
    targetCrs: normalizeCrs(normalizeToken(descriptor.targetCrs, "unknown")),
    changeToken: normalizeToken(descriptor.changeToken, "unknown"),
    dataVersion: descriptor.dataVersion,
  };
}

function normalizeToken(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function encodeCachePart(value: string): string {
  return encodeURIComponent(value);
}

function buildAccessSummary(input: {
  descriptor: ReprojectionCacheDescriptor;
  key: string;
  status: ReprojectionCacheAccessStatus;
  featureCount: number;
  coordinateCount: number;
  evictedCount: number;
  accessedAt: string;
}): ReprojectionCacheAccessSummary {
  return {
    ...input.descriptor,
    key: input.key,
    status: input.status,
    featureCount: input.featureCount,
    coordinateCount: input.coordinateCount,
    evictedCount: input.evictedCount,
    accessedAt: input.accessedAt,
  };
}

function summarizeFeatureCollection(fc: FeatureCollection): CoordinateStats & { featureCount: number; coordinateCount: number } {
  const stats: CoordinateStats = {
    count: 0,
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    first: null,
    last: null,
  };
  for (const feature of fc.features) {
    summarizeGeometry(feature.geometry, stats);
  }
  if (stats.count === 0) {
    stats.minX = 0;
    stats.minY = 0;
    stats.maxX = 0;
    stats.maxY = 0;
  }
  return {
    ...stats,
    featureCount: fc.features.length,
    coordinateCount: stats.count,
  };
}

function summarizeGeometry(geometry: Geometry | null | undefined, stats: CoordinateStats): void {
  if (!geometry) return;
  if (geometry.type === "GeometryCollection") {
    for (const entry of geometry.geometries) {
      summarizeGeometry(entry, stats);
    }
    return;
  }
  summarizeCoordinates(geometry.coordinates, stats);
}

function summarizeCoordinates(value: unknown, stats: CoordinateStats): void {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    recordCoordinate(value[0], value[1], stats);
    return;
  }
  for (const entry of value) {
    summarizeCoordinates(entry, stats);
  }
}

function recordCoordinate(x: number, y: number, stats: CoordinateStats): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const token = `${formatCoordinate(x)},${formatCoordinate(y)}`;
  stats.count += 1;
  stats.minX = Math.min(stats.minX, x);
  stats.minY = Math.min(stats.minY, y);
  stats.maxX = Math.max(stats.maxX, x);
  stats.maxY = Math.max(stats.maxY, y);
  stats.first ??= token;
  stats.last = token;
}

function featureToken(feature: Feature | undefined): string {
  if (!feature) return "none";
  const stats: CoordinateStats = {
    count: 0,
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    first: null,
    last: null,
  };
  summarizeGeometry(feature.geometry, stats);
  const id = feature.id == null ? "no-id" : String(feature.id);
  return `${id}:${stats.count}:${stats.first ?? "none"}:${stats.last ?? "none"}`;
}

function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(6) : "nan";
}

function uniqueText(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}