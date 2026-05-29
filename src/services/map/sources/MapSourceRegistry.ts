import type { Feature, FeatureCollection, Geometry } from "geojson";
import type {
  LayerCrsSummary,
  LayerPersistenceMetadata,
  LayerPersistenceSource,
  LayerRestoreState,
  LayerSchemaSummary,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import {
  resolveOverlayLayerCrsSummary,
  resolveOverlayLayerSchemaSummary,
} from "@/centerpanel/components/map/mapLayerMetadata";
import type {
  SourceFormat,
  SourceHandle,
  SourceRestoreStatus,
  SourceStorageMode,
} from "../contracts/gisContracts";

export const MAP_SOURCE_INLINE_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024;

type SourcePayload = string | FeatureCollection | Feature | Geometry | undefined;

export interface CreateImportSourceHandleInput {
  layer: OverlayLayerConfig;
  format: SourceFormat;
  sourceSizeBytes?: number;
  sourceRef?: string;
  workerTableName?: string;
  profiledAt?: string;
  caveats?: readonly string[];
}

export interface ApplySourceHandleToLayerOptions {
  snapshotVersion?: number;
  savedAt?: string;
  restoreWarnings?: readonly string[];
}

export class MapSourceRegistry {
  private readonly handles = new Map<string, SourceHandle>();

  constructor(initialHandles: readonly SourceHandle[] = []) {
    this.replace(initialHandles);
  }

  list(): SourceHandle[] {
    return Array.from(this.handles.values()).map(cloneSourceHandle);
  }

  get(sourceId: string): SourceHandle | null {
    const handle = this.handles.get(sourceId);
    return handle ? cloneSourceHandle(handle) : null;
  }

  upsert(handle: SourceHandle): SourceHandle {
    const sanitized = cloneSourceHandle(handle);
    this.handles.set(sanitized.sourceId, sanitized);
    return cloneSourceHandle(sanitized);
  }

  remove(sourceId: string): boolean {
    return this.handles.delete(sourceId);
  }

  replace(handles: readonly SourceHandle[]): void {
    this.handles.clear();
    for (const handle of handles) {
      this.upsert(handle);
    }
  }

  clear(): void {
    this.handles.clear();
  }
}

export function cloneSourceHandle(handle: SourceHandle): SourceHandle {
  const cloned: SourceHandle = {
    sourceId: handle.sourceId,
    kind: handle.kind,
    storageMode: handle.storageMode,
    restoreStatus: handle.restoreStatus,
    crsSummary: cloneCrsSummary(handle.crsSummary),
    featureCount: handle.featureCount,
    caveats: [...handle.caveats],
    profiledAt: handle.profiledAt,
  };

  if (handle.format) cloned.format = handle.format;
  if (handle.sizeBytes != null) cloned.sizeBytes = handle.sizeBytes;
  if (handle.schemaSummary) cloned.schemaSummary = cloneSchemaSummary(handle.schemaSummary);
  if (handle.license) cloned.license = handle.license;
  if (handle.attribution) cloned.attribution = handle.attribution;
  if (handle.workerTableName) cloned.workerTableName = handle.workerTableName;
  if (handle.sourceRef) cloned.sourceRef = handle.sourceRef;
  if (handle.vectorTile) {
    cloned.vectorTile = {
      sourceMode: handle.vectorTile.sourceMode,
      generalization: handle.vectorTile.generalization,
      minZoom: handle.vectorTile.minZoom,
      maxZoom: handle.vectorTile.maxZoom,
      tileSize: handle.vectorTile.tileSize,
      ...(handle.vectorTile.sourceLayer ? { sourceLayer: handle.vectorTile.sourceLayer } : {}),
    };
  }
  return cloned;
}

export function upsertSourceHandle(handles: readonly SourceHandle[], handle: SourceHandle): SourceHandle[] {
  const nextHandle = cloneSourceHandle(handle);
  const existingIndex = handles.findIndex((entry) => entry.sourceId === nextHandle.sourceId);
  if (existingIndex === -1) {
    return [...handles.map(cloneSourceHandle), nextHandle];
  }

  return handles.map((entry, index) => (index === existingIndex ? nextHandle : cloneSourceHandle(entry)));
}

export function removeSourceHandle(handles: readonly SourceHandle[], sourceId: string): SourceHandle[] {
  return handles
    .filter((handle) => handle.sourceId !== sourceId)
    .map(cloneSourceHandle);
}

export function sanitizeSourceHandleForPersistence(handle: SourceHandle): SourceHandle {
  return resolveSourceHandleForRestore(cloneSourceHandle(handle), { hasInlineSourceData: false });
}

export function sanitizeSourceHandlesForPersistence(handles: readonly SourceHandle[]): SourceHandle[] {
  return handles.map(sanitizeSourceHandleForPersistence);
}

export function mapSourceStorageModeToLayerPersistenceSource(storageMode: SourceStorageMode): LayerPersistenceSource {
  switch (storageMode) {
    case "inline-small":
      return "inline";
    case "url-refetch":
    case "external-service":
      return "url";
    case "indexeddb-local":
    case "worker-table":
    case "duckdb-table":
    case "metadata-only":
    default:
      return "metadata";
  }
}

export function mapSourceRestoreStatusToLayerRestoreState(restoreStatus: SourceRestoreStatus): LayerRestoreState {
  switch (restoreStatus) {
    case "restored":
      return "restored";
    case "external-reference":
      return "external-reference";
    case "metadata-only":
    case "recoverable":
      return "metadata-only";
    case "unavailable":
    default:
      return "stale-reference";
  }
}

export function createImportSourceHandle(input: CreateImportSourceHandleInput): SourceHandle {
  const sourceId = resolveLayerSourceId(input.layer) ?? createSourceId(input.layer.id);
  const profiledAt = input.profiledAt ?? input.layer.metadata?.updatedAt ?? new Date().toISOString();
  const workerTableName = input.workerTableName ?? input.layer.metadata?.columnar?.workerTableName ?? input.layer.metadata?.importSource?.workerTableName;
  const storageMode = resolveImportStorageMode({
    sourceSizeBytes: input.sourceSizeBytes,
    sourceRef: input.sourceRef,
    workerTableName,
  });
  const licenseAttribution = input.layer.metadata?.licenseAttribution;
  const schemaSummary = resolveOverlayLayerSchemaSummary(input.layer);
  const caveats = uniqueTextList([
    ...(input.caveats ?? []),
    ...(input.layer.metadata?.importSource?.caveats ?? []),
    ...(input.layer.metadata?.scientificQA?.caveats ?? []),
  ]);

  const handle: SourceHandle = {
    sourceId,
    kind: input.layer.sourceKind ?? "imported",
    storageMode,
    restoreStatus: resolveLiveImportRestoreStatus(storageMode),
    format: input.format,
    crsSummary: resolveOverlayLayerCrsSummary(input.layer),
    featureCount: input.layer.metadata?.featureCount ?? input.layer.metadata?.geometrySummary?.featureCount ?? null,
    caveats,
    profiledAt,
  };

  if (input.sourceSizeBytes != null) handle.sizeBytes = input.sourceSizeBytes;
  if (schemaSummary.fieldCount > 0) handle.schemaSummary = schemaSummary;
  if (licenseAttribution?.license) handle.license = licenseAttribution.license;
  if (licenseAttribution?.attribution) handle.attribution = licenseAttribution.attribution;
  if (workerTableName) handle.workerTableName = workerTableName;
  if (input.sourceRef ?? workerTableName) handle.sourceRef = input.sourceRef ?? workerTableName;
  return handle;
}

export function applySourceHandleToLayer(
  layer: OverlayLayerConfig,
  handle: SourceHandle,
  options: ApplySourceHandleToLayerOptions = {},
): OverlayLayerConfig {
  const persistence = buildLayerPersistenceMetadataFromSourceHandle(handle, options);
  return {
    ...layer,
    sourceKind: handle.kind,
    metadata: {
      ...(layer.metadata ?? {}),
      sourceId: handle.sourceId,
      sourceStorageMode: handle.storageMode,
      sourceRestoreStatus: handle.restoreStatus,
      persistence,
    },
  };
}

export function buildLayerPersistenceMetadataFromSourceHandle(
  handle: SourceHandle,
  options: ApplySourceHandleToLayerOptions = {},
): LayerPersistenceMetadata {
  const sourcePersistence = handle.restoreStatus === "unavailable"
    ? "metadata"
    : mapSourceStorageModeToLayerPersistenceSource(handle.storageMode);
  const restoreWarnings = options.restoreWarnings
    ? [...options.restoreWarnings]
    : buildSourceRestoreWarnings(handle);

  const metadata: LayerPersistenceMetadata = {
    snapshotVersion: options.snapshotVersion ?? 0,
    savedAt: options.savedAt ?? handle.profiledAt,
    sourcePersistence,
    restoreState: mapSourceRestoreStatusToLayerRestoreState(handle.restoreStatus),
    restoreWarnings,
    sourceId: handle.sourceId,
    sourceStorageMode: handle.storageMode,
    sourceRestoreStatus: handle.restoreStatus,
  };

  if (handle.sourceRef) metadata.sourceRef = handle.sourceRef;
  return metadata;
}

export function resolveSourceHandleForRestore(
  handle: SourceHandle,
  options: { hasInlineSourceData: boolean },
): SourceHandle {
  const next = cloneSourceHandle(handle);
  if (options.hasInlineSourceData) {
    next.restoreStatus = "restored";
    return next;
  }

  if (hasRecoverableSourceReference(next)) {
    next.restoreStatus = "recoverable";
    return next;
  }

  next.restoreStatus = "unavailable";
  return next;
}

export function createUnavailableSourceHandleForLayer(
  layer: Pick<OverlayLayerConfig, "id" | "sourceKind" | "metadata">,
  sourceId: string,
  profiledAt: string,
): SourceHandle {
  const metadata = layer.metadata;
  const fallbackCrsSummary: LayerCrsSummary = metadata?.crsSummary ?? metadata?.registry?.crsSummary ?? {
    crs: null,
    status: "unknown",
    source: "unknown",
    notes: ["Source handle was missing during project restore."],
  };

  const handle: SourceHandle = {
    sourceId,
    kind: layer.sourceKind ?? metadata?.registry?.sourceKind ?? "project",
    storageMode: metadata?.sourceStorageMode ?? metadata?.persistence?.sourceStorageMode ?? "metadata-only",
    restoreStatus: "unavailable",
    crsSummary: cloneCrsSummary(fallbackCrsSummary),
    featureCount: metadata?.featureCount ?? metadata?.geometrySummary?.featureCount ?? metadata?.registry?.featureCount ?? null,
    caveats: ["Source handle metadata is missing; only layer metadata can be restored."],
    profiledAt,
  };

  const schemaSummary = metadata?.schemaSummary ?? metadata?.registry?.schemaSummary;
  if (schemaSummary) handle.schemaSummary = cloneSchemaSummary(schemaSummary);
  if (metadata?.licenseAttribution?.license) handle.license = metadata.licenseAttribution.license;
  if (metadata?.licenseAttribution?.attribution) handle.attribution = metadata.licenseAttribution.attribution;
  return handle;
}

export function resolveLayerSourceId(layer: Pick<OverlayLayerConfig, "metadata">): string | null {
  return layer.metadata?.sourceId ?? layer.metadata?.persistence?.sourceId ?? null;
}

export function estimateSourcePayloadBytes(sourceData: SourcePayload): number | undefined {
  if (sourceData == null) return undefined;
  if (typeof sourceData === "string") return byteLength(sourceData);

  try {
    return byteLength(JSON.stringify(sourceData));
  } catch {
    return undefined;
  }
}

function resolveImportStorageMode(input: {
  sourceSizeBytes?: number;
  sourceRef?: string;
  workerTableName?: string;
}): SourceStorageMode {
  if (input.workerTableName) return "worker-table";
  if (input.sourceRef) return "url-refetch";
  if (input.sourceSizeBytes != null && input.sourceSizeBytes <= MAP_SOURCE_INLINE_STORAGE_LIMIT_BYTES) {
    return "inline-small";
  }
  return "metadata-only";
}

function resolveLiveImportRestoreStatus(storageMode: SourceStorageMode): SourceRestoreStatus {
  if (storageMode === "worker-table" || storageMode === "duckdb-table" || storageMode === "indexeddb-local") {
    return "recoverable";
  }
  return "restored";
}

function hasRecoverableSourceReference(handle: SourceHandle): boolean {
  if (handle.storageMode === "url-refetch" || handle.storageMode === "external-service") {
    return Boolean(handle.sourceRef);
  }
  if (handle.storageMode === "indexeddb-local" || handle.storageMode === "worker-table" || handle.storageMode === "duckdb-table") {
    return Boolean(handle.sourceRef || handle.workerTableName);
  }
  return false;
}

function buildSourceRestoreWarnings(handle: SourceHandle): string[] {
  switch (handle.restoreStatus) {
    case "restored":
      return [];
    case "recoverable":
      return [
        handle.sourceRef
          ? `Source ${handle.sourceId} is recoverable from ${handle.sourceRef}; reload or rehydrate before analytical use.`
          : `Source ${handle.sourceId} is recoverable from a local worker/cache handle; rehydrate before analytical use.`,
      ];
    case "external-reference":
      return [
        handle.sourceRef
          ? `Source ${handle.sourceId} uses an external reference: ${handle.sourceRef}.`
          : `Source ${handle.sourceId} uses an external reference that must be reloaded.`,
      ];
    case "metadata-only":
      return [`Source ${handle.sourceId} restored as metadata only; raw geometry is not available in this session.`];
    case "unavailable":
    default:
      return [`Source ${handle.sourceId} is unavailable; reload the source before treating geometry as available.`];
  }
}

function createSourceId(layerId: string): string {
  return `source-${layerId}`;
}

function byteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return value.length * 2;
}

function uniqueTextList(values: readonly (string | null | undefined)[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function cloneCrsSummary(summary: LayerCrsSummary): LayerCrsSummary {
  return {
    crs: summary.crs,
    status: summary.status,
    source: summary.source,
    notes: [...summary.notes],
  };
}

function cloneSchemaSummary(summary: LayerSchemaSummary): LayerSchemaSummary {
  const cloned: LayerSchemaSummary = {
    fieldCount: summary.fieldCount,
    fields: summary.fields.map((field) => ({ ...field })),
    source: summary.source,
    notes: [...summary.notes],
  };
  if (summary.geometryField) cloned.geometryField = summary.geometryField;
  return cloned;
}