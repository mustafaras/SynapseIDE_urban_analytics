import JSZip from "jszip";
import { downloadBlob } from "@/centerpanel/lib/download";
import type {
  FeatureCollection,
  Feature,
  Geometry,
} from "geojson";
import type {
  LayerPersistenceSource,
  LayerRestoreState,
  MapReproducibilityManifest,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import {
  buildMapExportReviewEvent,
  appendMapReviewEvent,
  exportMapReviewSessionJson,
  exportMapReviewSessionMarkdown,
  type MapReviewSession,
  type MapReviewTimelineEventInput,
} from "./MapReviewSessionService";
import {
  createMapProjectSnapshot,
  getRestorableOverlayLayers,
  type MapProjectSnapshot,
  type PersistedOverlayLayer,
  type SaveProjectMapStateInput,
} from "./MapPersistenceService";
import type { SourceHandle } from "./contracts/gisContracts";

export const MAP_OFFLINE_PACKAGE_VERSION = 1;
export const MAP_OFFLINE_PACKAGE_MIME_TYPE = "application/vnd.synapse.map-offline-package+zip";
export const MAP_OFFLINE_PACKAGE_INLINE_SOURCE_LIMIT_BYTES = 1 * 1024 * 1024;

const PACKAGE_MANIFEST_PATH = "map-package.json";
const SNAPSHOT_PATH = "snapshot/map-project.json";
const SOURCE_HANDLES_PATH = "sources/source-handles.json";
const STYLE_INDEX_PATH = "styles/layer-styles.json";
const EVIDENCE_PATH = "evidence/evidence-references.json";
const REVIEW_JSON_PATH = "review/review-session.json";
const REVIEW_MARKDOWN_PATH = "review/review-session.md";
const README_PATH = "README.md";

type PersistedSourceData = string | FeatureCollection | Feature | Geometry;

export interface MapOfflinePackageSourceEntry {
  layerId: string;
  layerName: string;
  sourceId: string | null;
  embedded: boolean;
  filePath?: string;
  byteLength: number;
  restoreState: LayerRestoreState;
  storage: LayerPersistenceSource;
  unavailableReason?: string;
}

export interface MapOfflinePackageLayerStyleEntry {
  layerId: string;
  layerName: string;
  style: Record<string, unknown> | null;
  labelSpec: unknown;
}

export interface MapOfflinePackageManifest {
  version: number;
  packageId: string;
  projectId: string;
  createdAt: string;
  snapshotPath: typeof SNAPSHOT_PATH;
  sourceHandlePath: typeof SOURCE_HANDLES_PATH;
  styleIndexPath: typeof STYLE_INDEX_PATH;
  evidencePath: typeof EVIDENCE_PATH;
  reviewSessionPath?: typeof REVIEW_JSON_PATH;
  reviewMarkdownPath?: typeof REVIEW_MARKDOWN_PATH;
  sourceCount: number;
  embeddedSourceCount: number;
  unavailableSourceCount: number;
  layerCount: number;
  manifestIds: string[];
  evidenceArtifactIds: string[];
  sourceIds: string[];
  caveats: string[];
  sources: MapOfflinePackageSourceEntry[];
}

export interface MapOfflinePackageExportInput extends SaveProjectMapStateInput {
  packageId?: string;
  createdAt?: string;
  reviewSession?: MapReviewSession | null;
}

export interface MapOfflinePackageExportResult {
  filename: string;
  mimeType: typeof MAP_OFFLINE_PACKAGE_MIME_TYPE;
  bytes: Uint8Array;
  blob: Blob;
  byteLength: number;
  packageManifest: MapOfflinePackageManifest;
  snapshot: MapProjectSnapshot;
  reviewEvent: MapReviewTimelineEventInput;
  reviewSession: MapReviewSession | null;
}

export interface MapOfflinePackageImportResult {
  packageManifest: MapOfflinePackageManifest;
  snapshot: MapProjectSnapshot;
  restoredLayers: OverlayLayerConfig[];
  reviewSession: MapReviewSession | null;
  unavailableLayerIds: string[];
  embeddedLayerIds: string[];
}

interface PreparedOfflineSnapshot {
  snapshot: MapProjectSnapshot;
  sources: MapOfflinePackageSourceEntry[];
  caveats: string[];
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function byteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return value.length * 2;
}

function safeIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "map";
}

function uniqueStrings(values: readonly (string | null | undefined)[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized && !result.includes(normalized)) {
      result.push(normalized);
    }
  }
  return result;
}

function restoreWarningForPackage(layer: PersistedOverlayLayer): string {
  const sourceLabel = layer.sourceRef ? ` Original reference: ${layer.sourceRef}.` : "";
  return `Source bytes for ${layer.name} were not embedded in the offline package; reload the original source before analytical use.${sourceLabel}`;
}

function markLayerUnavailableForOfflinePackage(layer: PersistedOverlayLayer): PersistedOverlayLayer {
  const warning = restoreWarningForPackage(layer);
  const metadata = cloneJson(layer.metadata ?? {});
  const persistence = metadata.persistence
    ? cloneJson(metadata.persistence)
    : {
      snapshotVersion: 0,
      savedAt: metadata.updatedAt ?? new Date().toISOString(),
      sourcePersistence: "metadata" as const,
      restoreState: "stale-reference" as const,
      restoreWarnings: [],
    };

  const restoreWarnings = uniqueStrings([
    warning,
    ...(Array.isArray(persistence.restoreWarnings) ? persistence.restoreWarnings : []),
  ]);
  metadata.persistence = {
    ...persistence,
    sourcePersistence: "metadata",
    restoreState: "stale-reference",
    restoreWarnings,
    sourceRestoreStatus: "unavailable",
  };
  metadata.sourceRestoreStatus = "unavailable";

  const next: PersistedOverlayLayer = {
    ...layer,
    sourcePersistence: "metadata",
    restoreState: "stale-reference",
    restoreWarnings,
    metadata,
  };
  delete next.sourceData;
  delete next.sourceRef;
  return next;
}

function sourceIdForLayer(layer: PersistedOverlayLayer): string | null {
  return layer.metadata?.sourceId ?? layer.metadata?.persistence?.sourceId ?? null;
}

function sourceDataToFeatureCollection(sourceData: PersistedSourceData): FeatureCollection | null {
  if (typeof sourceData === "string") {
    try {
      const parsed = JSON.parse(sourceData) as unknown;
      return isFeatureCollection(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isFeatureCollection(sourceData) ? sourceData : null;
}

function isFeatureCollection(value: unknown): value is FeatureCollection {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "FeatureCollection" &&
    Array.isArray((value as { features?: unknown }).features)
  );
}

function prepareSnapshotForOfflinePackage(snapshot: MapProjectSnapshot): PreparedOfflineSnapshot {
  const next = cloneJson(snapshot);
  const sources: MapOfflinePackageSourceEntry[] = [];
  const embeddedSourceIds = new Set<string>();
  const caveats = new Set<string>();

  next.overlayLayers = next.overlayLayers.map((layer) => {
    const sourceId = sourceIdForLayer(layer);
    const sourceData = layer.sourceData;
    const collection = sourceData ? sourceDataToFeatureCollection(sourceData) : null;
    const serializedSource = collection ? JSON.stringify(collection) : "";
    const serializedBytes = serializedSource ? byteLength(serializedSource) : 0;
    const canEmbed = layer.sourcePersistence === "inline" &&
      collection != null &&
      serializedBytes <= MAP_OFFLINE_PACKAGE_INLINE_SOURCE_LIMIT_BYTES;

    if (canEmbed) {
      if (sourceId) embeddedSourceIds.add(sourceId);
      const filePath = `sources/${safeIdPart(layer.id)}.geojson`;
      sources.push({
        layerId: layer.id,
        layerName: layer.name,
        sourceId,
        embedded: true,
        filePath,
        byteLength: serializedBytes,
        restoreState: "restored",
        storage: "inline",
      });
      return {
        ...layer,
        sourceData: collection,
        sourcePersistence: "inline" as const,
        restoreState: "restored" as const,
        restoreWarnings: [],
      };
    }

    const unavailable = markLayerUnavailableForOfflinePackage(layer);
    caveats.add(`Layer ${layer.id} source data is unavailable in this offline package.`);
    sources.push({
      layerId: layer.id,
      layerName: layer.name,
      sourceId,
      embedded: false,
      byteLength: serializedBytes,
      restoreState: unavailable.restoreState,
      storage: unavailable.sourcePersistence,
      unavailableReason: unavailable.restoreWarnings[0] ?? restoreWarningForPackage(layer),
    });
    return unavailable;
  });

  next.sourceHandles = next.sourceHandles.map((handle) => {
    const nextHandle: SourceHandle = cloneJson(handle);
    if (embeddedSourceIds.has(nextHandle.sourceId)) {
      nextHandle.storageMode = "inline-small";
      nextHandle.restoreStatus = "restored";
      nextHandle.caveats = nextHandle.caveats.filter((caveat) => !/not embedded|unavailable/i.test(caveat));
      delete nextHandle.sourceRef;
      delete nextHandle.workerTableName;
      return nextHandle;
    }

    const originalRef = nextHandle.sourceRef ?? nextHandle.workerTableName;
    nextHandle.restoreStatus = "unavailable";
    nextHandle.caveats = uniqueStrings([
      ...nextHandle.caveats,
      originalRef
        ? `Original source reference ${originalRef} was not embedded in the offline package.`
        : "Source bytes were not embedded in the offline package.",
    ]);
    delete nextHandle.sourceRef;
    delete nextHandle.workerTableName;
    return nextHandle;
  });

  next.references.staleLayerIds = next.overlayLayers
    .filter((layer) => layer.restoreState !== "restored")
    .map((layer) => layer.id);
  next.references.externalSourceRefs = [];

  return {
    snapshot: next,
    sources,
    caveats: [...caveats],
  };
}

function isMapReproducibilityManifest(value: unknown): value is MapReproducibilityManifest {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { manifestId?: unknown }).manifestId === "string" &&
    typeof (value as { workflowId?: unknown }).workflowId === "string"
  );
}

function collectReproducibilityManifests(snapshot: MapProjectSnapshot): MapReproducibilityManifest[] {
  const byId = new Map<string, MapReproducibilityManifest>();
  for (const layer of snapshot.overlayLayers) {
    const candidates: unknown[] = [
      layer.metadata?.reproducibilityManifest,
      layer.metadata?.analysisResult?.reproducibilityManifest,
    ];
    for (const candidate of candidates) {
      if (isMapReproducibilityManifest(candidate)) {
        byId.set(candidate.manifestId, cloneJson(candidate));
      }
    }
  }
  return [...byId.values()];
}

function buildLayerStyleIndex(snapshot: MapProjectSnapshot): MapOfflinePackageLayerStyleEntry[] {
  return snapshot.overlayLayers.map((layer) => ({
    layerId: layer.id,
    layerName: layer.name,
    style: layer.style ? cloneJson(layer.style) : null,
    labelSpec: layer.style && "labelSpec" in layer.style ? layer.style.labelSpec : null,
  }));
}

function buildPackageFilename(projectId: string, createdAt: string): string {
  return `map-offline-package-${safeIdPart(projectId)}-${safeIdPart(createdAt.slice(0, 19))}.zip`;
}

function buildReadme(manifest: MapOfflinePackageManifest): string {
  return [
    "# Synapse Map Offline Package",
    "",
    `Package ID: ${manifest.packageId}`,
    `Project ID: ${manifest.projectId}`,
    `Created: ${manifest.createdAt}`,
    "",
    "This package contains lightweight map metadata, styles, reproducibility manifests, review timeline references, evidence references, and only source payloads that fit the offline inline limit.",
    "",
    `Embedded sources: ${manifest.embeddedSourceCount}`,
    `Unavailable sources: ${manifest.unavailableSourceCount}`,
    "",
    ...manifest.caveats.map((caveat) => `- ${caveat}`),
    "",
  ].join("\n");
}

async function addJson(zip: JSZip, path: string, value: unknown): Promise<void> {
  zip.file(path, `${JSON.stringify(value, null, 2)}\n`);
}

function buildPackageManifest(input: {
  packageId: string;
  projectId: string;
  createdAt: string;
  snapshot: MapProjectSnapshot;
  sources: readonly MapOfflinePackageSourceEntry[];
  manifests: readonly MapReproducibilityManifest[];
  reviewSession: MapReviewSession | null;
  caveats: readonly string[];
}): MapOfflinePackageManifest {
  const evidenceArtifactIds = input.snapshot.evidenceArtifacts.map((artifact) => artifact.artifactId);
  const sourceIds = uniqueStrings(input.snapshot.sourceHandles.map((handle) => handle.sourceId));
  return {
    version: MAP_OFFLINE_PACKAGE_VERSION,
    packageId: input.packageId,
    projectId: input.projectId,
    createdAt: input.createdAt,
    snapshotPath: SNAPSHOT_PATH,
    sourceHandlePath: SOURCE_HANDLES_PATH,
    styleIndexPath: STYLE_INDEX_PATH,
    evidencePath: EVIDENCE_PATH,
    ...(input.reviewSession ? { reviewSessionPath: REVIEW_JSON_PATH, reviewMarkdownPath: REVIEW_MARKDOWN_PATH } : {}),
    sourceCount: input.sources.length,
    embeddedSourceCount: input.sources.filter((source) => source.embedded).length,
    unavailableSourceCount: input.sources.filter((source) => !source.embedded).length,
    layerCount: input.snapshot.overlayLayers.length,
    manifestIds: input.manifests.map((manifest) => manifest.manifestId),
    evidenceArtifactIds,
    sourceIds,
    caveats: [...input.caveats],
    sources: input.sources.map((source) => ({ ...source })),
  };
}

export async function exportOfflineMapPackage(
  input: MapOfflinePackageExportInput,
): Promise<MapOfflinePackageExportResult> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const projectId = input.projectId;
  const packageId = input.packageId ?? `map-offline-package-${safeIdPart(projectId)}-${safeIdPart(createdAt)}`;
  const provisionalReviewEvent = buildMapExportReviewEvent({
    format: "offline-package",
    scope: projectId,
    timestamp: createdAt,
    layerIds: input.overlayLayers.map((layer) => layer.id),
    sourceIds: input.sourceHandles?.map((handle) => handle.sourceId),
    evidenceArtifactIds: input.mapEvidenceArtifacts?.map((artifact) => artifact.artifactId),
    details: {
      packageId,
      packageVersion: MAP_OFFLINE_PACKAGE_VERSION,
    },
  });
  const reviewSession = input.reviewSession
    ? appendMapReviewEvent(input.reviewSession, provisionalReviewEvent)
    : null;
  const rawSnapshot = createMapProjectSnapshot({
    ...input,
    reviewSession,
  });
  const prepared = prepareSnapshotForOfflinePackage(rawSnapshot);
  const manifests = collectReproducibilityManifests(prepared.snapshot);
  const reviewEvent = {
    ...provisionalReviewEvent,
    runIds: uniqueStrings([
      ...(provisionalReviewEvent.runIds ?? []),
      ...manifests.map((manifest) => manifest.manifestId),
    ]),
    details: {
      ...(provisionalReviewEvent.details ?? {}),
      embeddedSourceCount: prepared.sources.filter((source) => source.embedded).length,
      unavailableSourceCount: prepared.sources.filter((source) => !source.embedded).length,
      manifestCount: manifests.length,
    },
  } satisfies MapReviewTimelineEventInput;
  const packageManifest = buildPackageManifest({
    packageId,
    projectId: prepared.snapshot.projectId,
    createdAt,
    snapshot: prepared.snapshot,
    sources: prepared.sources,
    manifests,
    reviewSession,
    caveats: prepared.caveats,
  });

  const zip = new JSZip();
  await addJson(zip, PACKAGE_MANIFEST_PATH, packageManifest);
  await addJson(zip, SNAPSHOT_PATH, prepared.snapshot);
  await addJson(zip, SOURCE_HANDLES_PATH, prepared.snapshot.sourceHandles);
  await addJson(zip, STYLE_INDEX_PATH, buildLayerStyleIndex(prepared.snapshot));
  await addJson(zip, EVIDENCE_PATH, prepared.snapshot.evidenceArtifacts);
  zip.file(README_PATH, buildReadme(packageManifest));

  for (const source of packageManifest.sources) {
    if (!source.embedded || !source.filePath) continue;
    const layer = prepared.snapshot.overlayLayers.find((candidate) => candidate.id === source.layerId);
    if (!layer?.sourceData) continue;
    zip.file(source.filePath, `${JSON.stringify(layer.sourceData, null, 2)}\n`);
  }

  for (const manifest of manifests) {
    await addJson(zip, `manifests/${safeIdPart(manifest.manifestId)}.json`, manifest);
  }

  if (reviewSession) {
    zip.file(REVIEW_JSON_PATH, exportMapReviewSessionJson(reviewSession));
    zip.file(REVIEW_MARKDOWN_PATH, exportMapReviewSessionMarkdown(reviewSession));
  }

  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const blob = new Blob([bytes], { type: MAP_OFFLINE_PACKAGE_MIME_TYPE });
  return {
    filename: buildPackageFilename(prepared.snapshot.projectId, createdAt),
    mimeType: MAP_OFFLINE_PACKAGE_MIME_TYPE,
    bytes,
    blob,
    byteLength: bytes.byteLength,
    packageManifest,
    snapshot: prepared.snapshot,
    reviewEvent,
    reviewSession,
  };
}

async function readZipText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  if (!file) {
    throw new Error(`Offline package is missing ${path}.`);
  }
  return file.async("text");
}

function parseJsonFile<T>(path: string, text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Offline package file ${path} is not valid JSON.`);
  }
}

function assertPackageManifest(value: MapOfflinePackageManifest): void {
  if (
    value.version !== MAP_OFFLINE_PACKAGE_VERSION ||
    typeof value.packageId !== "string" ||
    value.snapshotPath !== SNAPSHOT_PATH ||
    !Array.isArray(value.sources)
  ) {
    throw new Error("Offline package manifest is not compatible with this Map Explorer version.");
  }
}

function hydrateSnapshotSources(
  snapshot: MapProjectSnapshot,
  manifest: MapOfflinePackageManifest,
  sourcePayloads: ReadonlyMap<string, FeatureCollection>,
): MapProjectSnapshot {
  const next = cloneJson(snapshot);
  next.overlayLayers = next.overlayLayers.map((layer) => {
    const sourceEntry = manifest.sources.find((entry) => entry.layerId === layer.id);
    if (sourceEntry?.embedded && sourceEntry.filePath) {
      const sourceData = sourcePayloads.get(sourceEntry.filePath);
      if (sourceData) {
        return {
          ...layer,
          sourceData,
          sourcePersistence: "inline" as const,
          restoreState: "restored" as const,
          restoreWarnings: [],
        };
      }
    }
    if (sourceEntry && !sourceEntry.embedded) {
      return markLayerUnavailableForOfflinePackage(layer);
    }
    return layer;
  });
  next.references.staleLayerIds = next.overlayLayers
    .filter((layer) => layer.restoreState !== "restored")
    .map((layer) => layer.id);
  next.references.externalSourceRefs = [];
  return next;
}

function applyPackageRestoreWarnings(
  layers: readonly OverlayLayerConfig[],
  manifest: MapOfflinePackageManifest,
): OverlayLayerConfig[] {
  return layers.map((layer) => {
    const sourceEntry = manifest.sources.find((entry) => entry.layerId === layer.id);
    if (!sourceEntry || sourceEntry.embedded || !sourceEntry.unavailableReason) {
      return layer;
    }
    const metadata = cloneJson(layer.metadata ?? {});
    const persistence = metadata.persistence;
    if (!persistence) {
      return layer;
    }
    return {
      ...layer,
      metadata: {
        ...metadata,
        persistence: {
          ...persistence,
          restoreWarnings: uniqueStrings([
            sourceEntry.unavailableReason,
            ...persistence.restoreWarnings,
          ]),
        },
      },
    };
  });
}

export async function importOfflineMapPackage(
  data: ArrayBuffer | Uint8Array | Blob,
): Promise<MapOfflinePackageImportResult> {
  const zip = await JSZip.loadAsync(data);
  const packageManifest = parseJsonFile<MapOfflinePackageManifest>(
    PACKAGE_MANIFEST_PATH,
    await readZipText(zip, PACKAGE_MANIFEST_PATH),
  );
  assertPackageManifest(packageManifest);

  const snapshot = parseJsonFile<MapProjectSnapshot>(
    packageManifest.snapshotPath,
    await readZipText(zip, packageManifest.snapshotPath),
  );
  const sourcePayloads = new Map<string, FeatureCollection>();
  for (const source of packageManifest.sources) {
    if (!source.embedded || !source.filePath) continue;
    const text = await readZipText(zip, source.filePath);
    const parsed = parseJsonFile<unknown>(source.filePath, text);
    if (!isFeatureCollection(parsed)) {
      throw new Error(`Offline package source ${source.filePath} is not a GeoJSON FeatureCollection.`);
    }
    sourcePayloads.set(source.filePath, parsed);
  }

  const hydratedSnapshot = hydrateSnapshotSources(snapshot, packageManifest, sourcePayloads);
  const reviewSession = packageManifest.reviewSessionPath
    ? parseJsonFile<MapReviewSession>(packageManifest.reviewSessionPath, await readZipText(zip, packageManifest.reviewSessionPath))
    : null;

  const restoredLayers = applyPackageRestoreWarnings(getRestorableOverlayLayers(hydratedSnapshot), packageManifest);
  return {
    packageManifest,
    snapshot: hydratedSnapshot,
    restoredLayers,
    reviewSession,
    unavailableLayerIds: hydratedSnapshot.overlayLayers
      .filter((layer) => layer.restoreState !== "restored")
      .map((layer) => layer.id),
    embeddedLayerIds: packageManifest.sources
      .filter((source) => source.embedded)
      .map((source) => source.layerId),
  };
}

export function triggerOfflineMapPackageDownload(result: MapOfflinePackageExportResult): void {
  downloadBlob(result.filename, result.blob);
}
