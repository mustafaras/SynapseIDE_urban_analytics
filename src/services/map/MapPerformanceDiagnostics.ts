import type {
  LayerRenderBudgetMetadata,
  MapReprojectionCacheLayerMetadata,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import {
  MAP_GEOJSON_RENDER_COORDINATE_BUDGET,
  MAP_GEOJSON_RENDER_FEATURE_BUDGET,
  MAP_GEOJSON_RENDER_MEMORY_BUDGET_BYTES,
} from "./MapDataImporter";

export type MapPerformanceTimingKind = "render" | "export";

export interface MapPerformanceTimingMetric {
  kind: MapPerformanceTimingKind;
  label: string;
  durationMs: number;
  measuredAt: string;
  featureCount?: number;
  byteLength?: number;
}

export interface MapLayerPerformanceSummary {
  layerId: string;
  layerName: string;
  visible: boolean;
  mode: LayerRenderBudgetMetadata["mode"];
  featureCount: number;
  coordinateCount: number;
  estimatedRenderBytes: number;
  previewFeatureCount?: number;
  previewCoordinateCount?: number;
  warnings: string[];
}

export interface MapPerformanceBudgets {
  modalOpenMs: number;
  mainThreadStallMs: number;
  workerTransferProgressBytes: number;
  metadataLayerCount: number;
  renderFeatureCount: number;
  renderCoordinateCount: number;
  renderMemoryBytes: number;
}

export interface MapReprojectionCacheDiagnosticsSummary {
  layerCount: number;
  entries: number;
  maxEntries: number;
  hits: number;
  misses: number;
  bypasses: number;
  evictions: number;
  hitRate: number;
  projectedFeatureCount: number;
  projectedCoordinateCount: number;
  sourceIds: string[];
  targetCrs: string | null;
  lastRunAt: string | null;
}

export interface MapPerformanceDiagnosticsSummary {
  budgets: MapPerformanceBudgets;
  layerCount: number;
  visibleLayerCount: number;
  metadataOnlyLayerCount: number;
  totalFeatureCount: number;
  totalCoordinateCount: number;
  estimatedRenderBytes: number;
  workerTransferBytes: number;
  previewLayerCount: number;
  overBudgetLayerCount: number;
  renderMode: LayerRenderBudgetMetadata["mode"];
  lastRenderTiming: MapPerformanceTimingMetric | null;
  lastExportTiming: MapPerformanceTimingMetric | null;
  reprojectionCache: MapReprojectionCacheDiagnosticsSummary;
  layers: MapLayerPerformanceSummary[];
  warnings: string[];
}

export const MAP_PERFORMANCE_BUDGETS: MapPerformanceBudgets = {
  modalOpenMs: 1_500,
  mainThreadStallMs: 100,
  workerTransferProgressBytes: 50 * 1024 * 1024,
  metadataLayerCount: 50,
  renderFeatureCount: MAP_GEOJSON_RENDER_FEATURE_BUDGET,
  renderCoordinateCount: MAP_GEOJSON_RENDER_COORDINATE_BUDGET,
  renderMemoryBytes: MAP_GEOJSON_RENDER_MEMORY_BUDGET_BYTES,
};

export function formatPerformanceBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatPerformanceDuration(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "not measured";
  if (value < 1_000) return `${Math.max(0, Math.round(value))} ms`;
  return `${(value / 1_000).toFixed(2)} s`;
}

export function createMapPerformanceTiming(
  input: Omit<MapPerformanceTimingMetric, "durationMs" | "measuredAt"> & {
    startedAt: number;
    endedAt?: number;
    measuredAt?: string;
  },
): MapPerformanceTimingMetric {
  const endedAt = input.endedAt ?? performanceNow();
  return {
    kind: input.kind,
    label: input.label,
    durationMs: Math.max(0, Math.round((endedAt - input.startedAt) * 10) / 10),
    measuredAt: input.measuredAt ?? new Date().toISOString(),
    ...(input.featureCount != null ? { featureCount: input.featureCount } : {}),
    ...(input.byteLength != null ? { byteLength: input.byteLength } : {}),
  };
}

export async function measureMapPerformance<T>(
  input: Omit<MapPerformanceTimingMetric, "durationMs" | "measuredAt">,
  run: () => Promise<T>,
): Promise<{ result: T; metric: MapPerformanceTimingMetric }> {
  const startedAt = performanceNow();
  const result = await run();
  return {
    result,
    metric: createMapPerformanceTiming({
      ...input,
      startedAt,
      endedAt: performanceNow(),
    }),
  };
}

export function buildMapPerformanceDiagnostics(input: {
  overlayLayers: readonly OverlayLayerConfig[];
  timings?: readonly MapPerformanceTimingMetric[];
  budgets?: MapPerformanceBudgets;
}): MapPerformanceDiagnosticsSummary {
  const budgets = input.budgets ?? MAP_PERFORMANCE_BUDGETS;
  const layers = input.overlayLayers.map((layer) => buildLayerPerformanceSummary(layer, budgets));
  const visibleLayers = input.overlayLayers.filter((layer) => layer.visible);
  const totalFeatureCount = sumNumbers(layers.map((layer) => layer.featureCount));
  const totalCoordinateCount = sumNumbers(layers.map((layer) => layer.coordinateCount));
  const estimatedRenderBytes = sumNumbers(layers.map((layer) => layer.estimatedRenderBytes));
  const workerTransferBytes = sumNumbers(input.overlayLayers.map(resolveLayerWorkerTransferBytes));
  const previewLayerCount = layers.filter((layer) => layer.mode === "preview").length;
  const overBudgetLayerCount = layers.filter((layer) => layer.warnings.length > 0 || layer.mode === "preview").length;
  const metadataOnlyLayerCount = input.overlayLayers.filter((layer) => layer.metadata?.sourceStorageMode === "metadata-only").length;
  const timings = input.timings ?? [];
  const lastRenderTiming = findLastTiming(timings, "render");
  const lastExportTiming = findLastTiming(timings, "export");
  const reprojectionCache = buildReprojectionCacheDiagnostics(input.overlayLayers);
  const warnings = buildPerformanceWarnings({
    budgets,
    visibleLayerCount: visibleLayers.length,
    workerTransferBytes,
    previewLayerCount,
    layers,
    lastRenderTiming,
  });

  return {
    budgets,
    layerCount: input.overlayLayers.length,
    visibleLayerCount: visibleLayers.length,
    metadataOnlyLayerCount,
    totalFeatureCount,
    totalCoordinateCount,
    estimatedRenderBytes,
    workerTransferBytes,
    previewLayerCount,
    overBudgetLayerCount,
    renderMode: previewLayerCount > 0 ? "preview" : "full",
    lastRenderTiming,
    lastExportTiming,
    reprojectionCache,
    layers,
    warnings,
  };
}

function buildReprojectionCacheDiagnostics(
  overlayLayers: readonly OverlayLayerConfig[],
): MapReprojectionCacheDiagnosticsSummary {
  const cacheLayers = overlayLayers
    .map((layer) => layer.metadata?.reprojectionCache)
    .filter((entry): entry is MapReprojectionCacheLayerMetadata => Boolean(entry));
  if (cacheLayers.length === 0) {
    return {
      layerCount: 0,
      entries: 0,
      maxEntries: 0,
      hits: 0,
      misses: 0,
      bypasses: 0,
      evictions: 0,
      hitRate: 0,
      projectedFeatureCount: 0,
      projectedCoordinateCount: 0,
      sourceIds: [],
      targetCrs: null,
      lastRunAt: null,
    };
  }

  const latest = findLatestReprojectionCache(cacheLayers);
  const hits = sumNumbers(cacheLayers.map((entry) => entry.hits));
  const misses = sumNumbers(cacheLayers.map((entry) => entry.misses));
  const measurable = hits + misses;
  return {
    layerCount: cacheLayers.length,
    entries: latest.entries,
    maxEntries: latest.maxEntries,
    hits,
    misses,
    bypasses: sumNumbers(cacheLayers.map((entry) => entry.bypasses)),
    evictions: sumNumbers(cacheLayers.map((entry) => entry.evictions)),
    hitRate: measurable > 0 ? hits / measurable : 0,
    projectedFeatureCount: sumNumbers(cacheLayers.map((entry) => entry.projectedFeatureCount)),
    projectedCoordinateCount: sumNumbers(cacheLayers.map((entry) => entry.projectedCoordinateCount)),
    sourceIds: uniqueText(cacheLayers.flatMap((entry) => entry.sourceIds)),
    targetCrs: latest.targetCrs,
    lastRunAt: latest.lastRunAt,
  };
}

function findLatestReprojectionCache(
  entries: readonly MapReprojectionCacheLayerMetadata[],
): MapReprojectionCacheLayerMetadata {
  return entries.reduce((latest, entry) => (
    Date.parse(entry.lastRunAt) >= Date.parse(latest.lastRunAt) ? entry : latest
  ), entries[0]!);
}

function buildLayerPerformanceSummary(
  layer: OverlayLayerConfig,
  budgets: MapPerformanceBudgets,
): MapLayerPerformanceSummary {
  const rendering = layer.metadata?.rendering;
  const featureCount = rendering?.featureCount ?? layer.metadata?.featureCount ?? 0;
  const coordinateCount = rendering?.coordinateCount ?? featureCount;
  const estimatedRenderBytes = rendering?.estimatedRenderBytes ?? estimateFallbackRenderBytes(featureCount, coordinateCount);
  const warnings = rendering?.warnings ?? buildFallbackRenderWarnings({
    featureCount,
    coordinateCount,
    estimatedRenderBytes,
    budgets,
  });
  const mode = rendering?.mode ?? (warnings.length > 0 ? "preview" : "full");

  return {
    layerId: layer.id,
    layerName: layer.name,
    visible: layer.visible,
    mode,
    featureCount,
    coordinateCount,
    estimatedRenderBytes,
    ...(rendering?.previewFeatureCount != null ? { previewFeatureCount: rendering.previewFeatureCount } : {}),
    ...(rendering?.previewCoordinateCount != null ? { previewCoordinateCount: rendering.previewCoordinateCount } : {}),
    warnings,
  };
}

function buildFallbackRenderWarnings(input: {
  featureCount: number;
  coordinateCount: number;
  estimatedRenderBytes: number;
  budgets: MapPerformanceBudgets;
}): string[] {
  const warnings: string[] = [];
  if (input.featureCount > input.budgets.renderFeatureCount) {
    warnings.push(`Feature count ${input.featureCount.toLocaleString()} exceeds the interactive render budget of ${input.budgets.renderFeatureCount.toLocaleString()}.`);
  }
  if (input.coordinateCount > input.budgets.renderCoordinateCount) {
    warnings.push(`Coordinate count ${input.coordinateCount.toLocaleString()} exceeds the interactive render budget of ${input.budgets.renderCoordinateCount.toLocaleString()}.`);
  }
  if (input.estimatedRenderBytes > input.budgets.renderMemoryBytes) {
    warnings.push(`Estimated render memory ${formatPerformanceBytes(input.estimatedRenderBytes)} exceeds the browser render budget of ${formatPerformanceBytes(input.budgets.renderMemoryBytes)}.`);
  }
  return warnings;
}

function buildPerformanceWarnings(input: {
  budgets: MapPerformanceBudgets;
  visibleLayerCount: number;
  workerTransferBytes: number;
  previewLayerCount: number;
  layers: MapLayerPerformanceSummary[];
  lastRenderTiming: MapPerformanceTimingMetric | null;
}): string[] {
  const warnings: string[] = [];
  if (input.visibleLayerCount > input.budgets.metadataLayerCount) {
    warnings.push(`Layer stack has ${input.visibleLayerCount.toLocaleString()} visible layers; the initial metadata-only usability budget is ${input.budgets.metadataLayerCount.toLocaleString()} layers.`);
  }
  if (input.workerTransferBytes > input.budgets.workerTransferProgressBytes) {
    warnings.push(`Worker transfer ${formatPerformanceBytes(input.workerTransferBytes)} exceeds the ${formatPerformanceBytes(input.budgets.workerTransferProgressBytes)} progress threshold.`);
  }
  if (input.lastRenderTiming && input.lastRenderTiming.durationMs > input.budgets.mainThreadStallMs) {
    warnings.push(`Last layer sync render took ${formatPerformanceDuration(input.lastRenderTiming.durationMs)}, above the ${input.budgets.mainThreadStallMs} ms app-code stall budget.`);
  }
  if (input.previewLayerCount > 0) {
    const names = input.layers
      .filter((layer) => layer.mode === "preview")
      .map((layer) => layer.layerName)
      .slice(0, 3)
      .join(", ");
    warnings.push(`${input.previewLayerCount.toLocaleString()} layer${input.previewLayerCount === 1 ? "" : "s"} use bounded preview mode${names ? `: ${names}` : ""}. Full source data remains available for export and worker-backed analysis.`);
  }
  return warnings;
}

function resolveLayerWorkerTransferBytes(layer: OverlayLayerConfig): number {
  const columnarTransfer = layer.metadata?.columnar?.transferSizeBytes;
  if (typeof columnarTransfer === "number" && Number.isFinite(columnarTransfer) && columnarTransfer > 0) {
    return columnarTransfer;
  }
  const importSource = layer.metadata?.importSource;
  if (
    importSource?.workerTransferStatus === "prepared"
    && typeof importSource.fileSizeBytes === "number"
    && Number.isFinite(importSource.fileSizeBytes)
    && importSource.fileSizeBytes > 0
  ) {
    return importSource.fileSizeBytes;
  }
  return 0;
}

function estimateFallbackRenderBytes(featureCount: number, coordinateCount: number): number {
  return Math.round(featureCount * 256 + coordinateCount * 32);
}

function findLastTiming(
  timings: readonly MapPerformanceTimingMetric[],
  kind: MapPerformanceTimingKind,
): MapPerformanceTimingMetric | null {
  for (let index = timings.length - 1; index >= 0; index -= 1) {
    const timing = timings[index];
    if (timing?.kind === kind) return timing;
  }
  return null;
}

function sumNumbers(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}

function uniqueText(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function performanceNow(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}
