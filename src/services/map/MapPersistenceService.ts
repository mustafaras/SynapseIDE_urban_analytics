import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from "geojson";
import {
  getTables,
  loadGeoJSON,
  toGeoJSON,
} from "@/engine/spatial-db";
import {
  MAP_ANNOTATION_LIMIT,
  MAP_BOOKMARK_LIMIT,
} from "../../centerpanel/components/map/mapTypes";
import type {
  BaseLayerId,
  DrawnFeature,
  LayerPersistenceSource,
  LayerProvenance,
  LayerQaStatus,
  LayerRestoreState,
  LayerGroupId,
  LayerMetadata,
  MapAnnotation,
  MapAnnotationProperties,
  MapAnnotationStyleSettings,
  MapBookmark,
  MapEvidenceArtifact,
  MapPin,
  Measurement,
  OverlayLayerConfig,
  ViewportState,
} from "../../centerpanel/components/map/mapTypes";
import {
  exportDrawingsToFeatureCollection,
  exportPinsToFeatureCollection,
} from "./MapDataExporter";
import {
  parseGeoJSONText,
  parseInlineGeoJSONSource,
} from "./MapDataImporter";
import { MAP_REVIEW_AUDIT_CATEGORIES } from "./MapReviewSessionService";
import type { MapReviewAuditCategory, MapReviewSession } from "./MapReviewSessionService";
import type {
  MapScientificQAIssueSeverity,
  MapScientificQAState,
} from "./MapScientificQA";

const STORAGE_PREFIX = "synapse.map.project.persistence.v1.";
const SNAPSHOT_VERSION = 3;
const INLINE_LAYER_DATA_LIMIT_BYTES = 1 * 1024 * 1024;
const FALLBACK_STORAGE_QUOTA_BYTES = 5 * 1024 * 1024;
const QUOTA_WARNING_RATIO = 0.8;

const syncedProjects = new Map<string, string>();

type PersistedSourceData = string | FeatureCollection | Feature | Geometry;

export type SpatialQueryPredicate = "intersects" | "within";

export interface MapProjectSnapshotLayoutPreferences {
  layerPanelWidth: number;
  rightPanelWidth: number;
}

export interface MapProjectLayerReference {
  layerId: string;
  name: string;
  type: OverlayLayerConfig["type"];
  visible: boolean;
  opacity: number;
  sourcePersistence: LayerPersistenceSource;
  restoreState: LayerRestoreState;
  restoreWarnings: string[];
  group?: LayerGroupId;
  sourceKind?: OverlayLayerConfig["sourceKind"];
  sourceRef?: string;
  crs?: string;
  geometryType?: string;
  featureCount?: number;
  bounds?: [number, number, number, number];
  qaStatus?: LayerQaStatus;
  queryable?: boolean;
  provenanceLabel?: string;
  evidenceArtifactIds: string[];
}

export interface PersistedMapEvidenceArtifactReference {
  id: string;
  artifactId: string;
  kind: MapEvidenceArtifact["kind"];
  title: string;
  state: MapEvidenceArtifact["state"];
  sourceModule: MapEvidenceArtifact["sourceModule"];
  linkedLayerIds: string[];
  sourceLayerIds: string[];
  linkedAoiId?: string;
  linkedRunId?: string;
  linkedWorkflowId?: string;
  reportInsertId?: string;
  reportSnapshotId?: string;
  exportId?: string;
  qaState: MapEvidenceArtifact["qa"]["state"];
  qaIssueIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MapProjectQASnapshot {
  status: LayerQaStatus;
  checkedAt: string | null;
  issueCount: number;
  blockerCount: number;
  layerCount: number;
  issueCounts: Record<MapScientificQAIssueSeverity, number>;
  issueIds: string[];
  signature: string | null;
}

export interface MapProjectReviewTimelineReference {
  sessionId: string;
  title: string;
  updatedAt: string;
  eventCount: number;
  eventIds: string[];
  auditCategories: MapReviewAuditCategory[];
  layerIds: string[];
  evidenceArtifactIds: string[];
  qaIssueIds: string[];
  reportItemIds: string[];
}

export interface MapProjectSnapshotReferences {
  contextSummaryId?: string;
  evidenceArtifactIds: string[];
  publicationManifestIds: string[];
  reportHandoffIds: string[];
  externalSourceRefs: string[];
  staleLayerIds: string[];
}

export interface MapProjectPersistenceBoundary {
  localStoragePersists: string[];
  projectSnapshotPersists: string[];
  neverPersistInLightweightState: string[];
}

export const MAP_PROJECT_PERSISTENCE_BOUNDARY: MapProjectPersistenceBoundary = {
  localStoragePersists: [
    "viewport",
    "activeBaseLayer",
    "pins",
    "bookmarks",
    "annotations",
    "annotationToolSettings",
    "layoutPreferences",
    "selectedFeatureIds",
    "activeAoiId",
    "activeAnalysisResultLayerIds",
  ],
  projectSnapshotPersists: [
    "viewport",
    "activeBaseLayer",
    "layoutPreferences",
    "pins",
    "bookmarks",
    "annotations",
    "drawnFeatures",
    "measurements",
    "layerReferences",
    "lightweightOverlayLayerMetadata",
    "evidenceArtifactReferences",
    "qaSummary",
    "reviewTimelineReferences",
  ],
  neverPersistInLightweightState: [
    "large GeoJSON layer payloads",
    "Arrow or GeoParquet buffers",
    "worker table payloads",
    "external service fetched payloads outside cache policy",
    "large map screenshots or canvases",
    "local file handles",
    "volatile dialog state",
  ],
};

export interface PersistedOverlayLayer {
  id: string;
  name: string;
  type: OverlayLayerConfig["type"];
  visible: boolean;
  opacity: number;
  group?: LayerGroupId;
  sourceKind?: OverlayLayerConfig["sourceKind"];
  queryable?: boolean;
  qaStatus?: LayerQaStatus;
  provenance?: LayerProvenance;
  style?: Record<string, unknown>;
  metadata?: LayerMetadata;
  sourceData?: PersistedSourceData;
  sourcePersistence: LayerPersistenceSource;
  sourceRef?: string;
  restoreState: LayerRestoreState;
  restoreWarnings: string[];
}

export interface MapProjectSnapshot {
  version: number;
  projectId: string;
  savedAt: string;
  activeBaseLayer: BaseLayerId;
  viewport: ViewportState;
  layoutPreferences?: MapProjectSnapshotLayoutPreferences;
  pins: MapPin[];
  bookmarks: MapBookmark[];
  annotations: MapAnnotation[];
  drawnFeatures: DrawnFeature[];
  measurements: Measurement[];
  overlayLayers: PersistedOverlayLayer[];
  layerReferences: MapProjectLayerReference[];
  evidenceArtifacts: PersistedMapEvidenceArtifactReference[];
  qaSummary: MapProjectQASnapshot | null;
  reviewTimeline: MapProjectReviewTimelineReference | null;
  references: MapProjectSnapshotReferences;
  persistenceBoundary: MapProjectPersistenceBoundary;
}

export interface MapPersistenceQuotaEstimate {
  usage: number;
  quota: number;
  projectedUsage: number;
  percentUsed: number;
  projectedPercentUsed: number;
  warning: boolean;
  blocked: boolean;
}

export interface SaveProjectMapStateInput {
  projectId: string;
  activeBaseLayer: BaseLayerId;
  viewport: ViewportState;
  pins: MapPin[];
  bookmarks?: MapBookmark[];
  annotations?: MapAnnotation[];
  drawnFeatures: DrawnFeature[];
  overlayLayers: OverlayLayerConfig[];
  layoutPreferences?: MapProjectSnapshotLayoutPreferences;
  measurements?: Measurement[];
  mapEvidenceArtifacts?: MapEvidenceArtifact[];
  scientificQA?: MapScientificQAState | null;
  reviewSession?: MapReviewSession | null;
  currentMapBounds?: [number, number, number, number] | null;
  currentMapBoundsUpdatedAt?: string | null;
  lastContextSnapshotId?: string;
  publicationManifestIds?: string[];
  reportHandoffIds?: string[];
}

export interface SaveProjectMapStateResult {
  snapshot: MapProjectSnapshot;
  quota: MapPersistenceQuotaEstimate;
  persistedFeatureCount: number;
  persistedLayerCount: number;
  metadataOnlyLayerCount: number;
  spatialTableName: string;
}

export interface LoadProjectMapStateResult {
  snapshot: MapProjectSnapshot | null;
  restoredPinCount: number;
  restoredDrawingCount: number;
  restoredLayerCount: number;
  restoredFeatureCount: number;
  spatialTableName: string | null;
  staleLayerIds: string[];
  externalSourceRefs: string[];
}

export interface ProjectSpatialQueryResult {
  collection: FeatureCollection;
  rowCount: number;
  spatialTableName: string;
}

export class MapPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapPersistenceError";
  }
}

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${encodeURIComponent(projectId)}`;
}

function getBrowserStorage(): Storage {
  if (typeof localStorage === "undefined") {
    throw new MapPersistenceError("Project map persistence requires browser local storage.");
  }
  return localStorage;
}

function byteLength(value: string): number {
  return new Blob([value]).size;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function estimateJsonSerializedBytes(value: unknown, limit = Number.POSITIVE_INFINITY): number {
  const seen = new WeakSet<object>();
  let totalBytes = 0;

  const addBytes = (bytes: number): boolean => {
    totalBytes += bytes;
    return totalBytes > limit;
  };

  const visit = (entry: unknown): void => {
    if (totalBytes > limit) return;

    if (entry === null) {
      addBytes(4);
      return;
    }

    switch (typeof entry) {
      case "string":
        addBytes(byteLength(entry) + 2);
        return;
      case "number":
      case "boolean":
        addBytes(String(entry).length);
        return;
      case "undefined":
      case "function":
      case "symbol":
        addBytes(4);
        return;
      case "object":
        break;
      default:
        addBytes(4);
        return;
    }

    if (Array.isArray(entry)) {
      if (addBytes(2)) return;
      entry.forEach((item, index) => {
        if (index > 0) addBytes(1);
        visit(item);
      });
      return;
    }

    if (entry && typeof entry === "object") {
      if (seen.has(entry)) {
        addBytes(4);
        return;
      }
      seen.add(entry);
      const entries = Object.entries(entry).filter(([, item]) => typeof item !== "undefined");
      if (addBytes(2)) return;
      entries.forEach(([key, item], index) => {
        if (index > 0) addBytes(1);
        addBytes(byteLength(key) + 3);
        visit(item);
      });
    }
  };

  visit(value);
  return totalBytes;
}

function isLikelyInlineGeoJsonText(value: string): boolean {
  const trimmedStart = value.trimStart();
  if (trimmedStart.startsWith("{") || trimmedStart.startsWith("[")) return true;
  return /FeatureCollection|"type"\s*:\s*"Feature"|"coordinates"\s*:|"features"\s*:/i.test(
    trimmedStart.slice(0, 512),
  );
}

function oversizedLayerRestoreWarnings(): string[] {
  return [
    "Layer source data exceeded the inline snapshot limit and was not persisted; reload the source layer before treating it as available.",
  ];
}

function metadataOnlyStaleLayer(base: PersistedOverlayLayer): PersistedOverlayLayer {
  const metadataBase = { ...base };
  delete metadataBase.sourceData;
  delete metadataBase.sourceRef;
  return {
    ...metadataBase,
    sourcePersistence: "metadata",
    restoreState: "stale-reference",
    restoreWarnings: oversizedLayerRestoreWarnings(),
  };
}

function sanitizeProjectId(projectId: string): string {
  const trimmed = projectId.trim();
  if (trimmed.length === 0) {
    throw new MapPersistenceError("A project must be selected before saving or loading map data.");
  }
  return trimmed;
}

function sanitizeTableFragment(projectId: string): string {
  const fragment = projectId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return fragment.length > 0 ? fragment : "default";
}

function spatialTableName(projectId: string): string {
  const fragment = sanitizeTableFragment(projectId);
  return `map_project_${fragment}`;
}

function normalizeViewport(input: unknown): ViewportState {
  const source = isObject(input) ? input : {};
  const center = Array.isArray(source.center) && source.center.length >= 2
    ? [Number(source.center[0]), Number(source.center[1])] as [number, number]
    : [29, 41] as [number, number];
  const zoom = Number(source.zoom);
  const bearing = Number(source.bearing);
  const pitch = Number(source.pitch);

  return {
    center: [
      Number.isFinite(center[0]) ? center[0] : 29,
      Number.isFinite(center[1]) ? center[1] : 41,
    ],
    zoom: Number.isFinite(zoom) ? zoom : 10,
    bearing: Number.isFinite(bearing) ? bearing : 0,
    pitch: Number.isFinite(pitch) ? pitch : 0,
  };
}

function normalizeLayoutPreferences(input: unknown): MapProjectSnapshotLayoutPreferences | undefined {
  if (!isObject(input)) return undefined;
  return {
    layerPanelWidth: clampNumber(input.layerPanelWidth, 220, 520, 280),
    rightPanelWidth: clampNumber(input.rightPanelWidth, 300, 620, 384),
  };
}

function normalizePin(pin: unknown, index: number): MapPin {
  const source = isObject(pin) ? pin : {};
  const lng = Number(source.lng);
  const lat = Number(source.lat);
  return {
    id: typeof source.id === "string" && source.id.trim().length > 0 ? source.id : `pin-${index + 1}`,
    lng: Number.isFinite(lng) ? lng : 0,
    lat: Number.isFinite(lat) ? lat : 0,
    ...(typeof source.label === "string" ? { label: source.label } : {}),
  };
}

function normalizeCoordinatePair(input: unknown, fallback: [number, number]): [number, number] {
  if (!Array.isArray(input) || input.length < 2) {
    return fallback;
  }
  const longitude = Number(input[0]);
  const latitude = Number(input[1]);
  return [
    Number.isFinite(longitude) ? longitude : fallback[0],
    Number.isFinite(latitude) ? latitude : fallback[1],
  ];
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : fallback;
}

function normalizeAnnotationStyle(input: unknown): MapAnnotationStyleSettings {
  const source = isObject(input) ? input : {};
  return {
    fontSize: clampNumber(source.fontSize, 12, 36, 16),
    color: typeof source.color === "string" && source.color.trim().length > 0 ? source.color : "#3794ff",
    bold: typeof source.bold === "boolean" ? source.bold : true,
    italic: typeof source.italic === "boolean" ? source.italic : false,
    rotation: clampNumber(source.rotation, -180, 180, 0),
    hasBackground: typeof source.hasBackground === "boolean" ? source.hasBackground : true,
    leaderLine: typeof source.leaderLine === "boolean" ? source.leaderLine : false,
  };
}

function normalizeBookmark(bookmark: unknown, index: number): MapBookmark {
  const source = isObject(bookmark) ? bookmark : {};
  const viewport = normalizeViewport(source);
  const rawLayers = Array.isArray(source.layers) ? source.layers : [];
  return {
    id: typeof source.id === "string" && source.id.trim().length > 0 ? source.id : `bookmark-${index + 1}`,
    name: typeof source.name === "string" && source.name.trim().length > 0 ? source.name.slice(0, 80) : `View ${index + 1}`,
    center: viewport.center,
    zoom: viewport.zoom,
    bearing: viewport.bearing,
    pitch: viewport.pitch,
    layers: Array.from(new Set(rawLayers.filter((entry): entry is string => typeof entry === "string" && entry.length > 0))),
    timestamp: typeof source.timestamp === "string" ? source.timestamp : new Date(0).toISOString(),
    activeVisualization: typeof source.activeVisualization === "string" ? source.activeVisualization : null,
  };
}

function normalizeAnnotation(annotation: unknown, index: number): MapAnnotation {
  const source = isObject(annotation) ? annotation : {};
  const geometry = isObject(source.geometry) ? source.geometry : {};
  const propertiesSource = isObject(source.properties) ? source.properties : {};
  const coordinate = normalizeCoordinatePair(geometry.coordinates, [29, 41]);
  const style = normalizeAnnotationStyle(propertiesSource);
  const createdAt = typeof propertiesSource.createdAt === "string" ? propertiesSource.createdAt : new Date(0).toISOString();
  const properties: MapAnnotationProperties = {
    ...style,
    text: typeof propertiesSource.text === "string" && propertiesSource.text.trim().length > 0
      ? propertiesSource.text.slice(0, 240)
      : `Annotation ${index + 1}`,
    createdAt,
    updatedAt: typeof propertiesSource.updatedAt === "string" ? propertiesSource.updatedAt : createdAt,
    leaderTarget: propertiesSource.leaderTarget ? normalizeCoordinatePair(propertiesSource.leaderTarget, coordinate) : null,
  };

  return {
    id: typeof source.id === "string" && source.id.trim().length > 0 ? source.id : `annotation-${index + 1}`,
    type: "Feature",
    geometry: { type: "Point", coordinates: coordinate },
    properties,
  };
}

function normalizeDrawnFeature(feature: unknown, index: number): DrawnFeature {
  const source = isObject(feature) ? feature : {};
  const geometry: Geometry = source.geometry
    ? (cloneJson(source.geometry as Geometry) as Geometry)
    : { type: "Point", coordinates: [0, 0] };
  return {
    id: typeof source.id === "string" && source.id.trim().length > 0 ? source.id : `drawing-${index + 1}`,
    geometry,
    properties: {
      label:
        isObject(source.properties) && typeof source.properties.label === "string"
          ? source.properties.label
          : `Drawing ${index + 1}`,
      createdAt:
        isObject(source.properties) && typeof source.properties.createdAt === "string"
          ? source.properties.createdAt
          : new Date(0).toISOString(),
      ...(isObject(source.properties) ? cloneJson(source.properties as DrawnFeature["properties"]) : {}),
    },
  };
}

function normalizeMeasurement(measurement: unknown, index: number): Measurement {
  const source = isObject(measurement) ? measurement : {};
  const rawCoordinates = Array.isArray(source.coordinates) ? source.coordinates : [];
  const coordinates = rawCoordinates
    .map((coordinate) => normalizeCoordinatePair(coordinate, [0, 0]))
    .filter((coordinate) => Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1]));
  const value = Number(source.value);
  return {
    id: typeof source.id === "string" && source.id.trim().length > 0 ? source.id : `measurement-${index + 1}`,
    type: source.type === "measure-area" ? "measure-area" : "measure-distance",
    coordinates,
    value: Number.isFinite(value) ? value : 0,
    label: typeof source.label === "string" && source.label.trim().length > 0
      ? source.label
      : `Measurement ${index + 1}`,
    timestamp: typeof source.timestamp === "string" ? source.timestamp : new Date(0).toISOString(),
  };
}

function normalizeStringList(value: unknown, limit = 200): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ids.push(normalized);
    if (ids.length >= limit) break;
  }
  return ids;
}

function resolveLayerCrs(metadata: LayerMetadata | undefined): string | undefined {
  const crs = metadata?.datasetContext?.crs
    ?? metadata?.columnar?.crs
    ?? metadata?.eoSource?.crs
    ?? metadata?.externalService?.crs;
  return typeof crs === "string" && crs.trim().length > 0 ? crs.trim() : undefined;
}

function resolveLayerSourceRef(layer: {
  sourceData?: unknown;
  metadata?: LayerMetadata;
  provenance?: LayerProvenance;
}): string | undefined {
  if (typeof layer.sourceData === "string" && layer.sourceData.trim().length > 0) {
    return layer.sourceData.trim();
  }
  const external = layer.metadata?.externalService;
  const sourceRef = external?.urlTemplate ?? external?.endpoint ?? layer.provenance?.sourceUrl;
  return typeof sourceRef === "string" && sourceRef.trim().length > 0 ? sourceRef.trim() : undefined;
}

function buildRestoreWarnings(
  sourcePersistence: LayerPersistenceSource,
  sourceRef: string | undefined,
): string[] {
  if (sourcePersistence === "inline") return [];
  if (sourcePersistence === "url") {
    return [
      sourceRef
        ? `Layer source must be reloaded from external reference: ${sourceRef}.`
        : "Layer source uses an external reference that must be reloaded.",
    ];
  }
  return [
    "Layer source data was not persisted in the lightweight project snapshot; only metadata and references were restored.",
  ];
}

function resolveRestoreState(sourcePersistence: LayerPersistenceSource): LayerRestoreState {
  if (sourcePersistence === "inline") return "restored";
  if (sourcePersistence === "url") return "external-reference";
  return "metadata-only";
}

function normalizeOverlayLayer(layer: unknown): PersistedOverlayLayer {
  const source = isObject(layer) ? layer : {};
  const metadata = isObject(source.metadata) ? cloneJson(source.metadata as LayerMetadata) : undefined;
  const style = isObject(source.style) ? cloneJson(source.style as Record<string, unknown>) : undefined;
  const provenance = isObject(source.provenance) ? cloneJson(source.provenance as LayerProvenance) : undefined;
  const sourceData = source.sourceData;
  const normalizedSourceData =
    typeof sourceData === "string" || isObject(sourceData) ? cloneJson(sourceData as PersistedSourceData) : undefined;
  const sourcePersistence: LayerPersistenceSource =
    source.sourcePersistence === "inline" || source.sourcePersistence === "url" || source.sourcePersistence === "metadata"
      ? source.sourcePersistence
      : normalizedSourceData == null
        ? "metadata"
        : typeof normalizedSourceData === "string"
          ? "url"
          : "inline";
  const sourceRef = typeof source.sourceRef === "string" && source.sourceRef.trim().length > 0
    ? source.sourceRef.trim()
    : resolveLayerSourceRef({ sourceData: normalizedSourceData, metadata, provenance });
  const restoreWarnings = normalizeStringList(source.restoreWarnings);
  const defaultWarnings = buildRestoreWarnings(sourcePersistence, sourceRef);
  const restoreState = source.restoreState === "restored"
    || source.restoreState === "external-reference"
    || source.restoreState === "metadata-only"
    || source.restoreState === "stale-reference"
    ? source.restoreState
    : resolveRestoreState(sourcePersistence);

  const normalized: PersistedOverlayLayer = {
    id: typeof source.id === "string" && source.id.trim().length > 0 ? source.id : `layer-${Date.now()}`,
    name: typeof source.name === "string" ? source.name : "Restored layer",
    type:
      source.type === "geojson" ||
      source.type === "heatmap" ||
      source.type === "raster-tile" ||
      source.type === "vector-tile"
        ? source.type
        : "geojson",
    visible: source.visible !== false,
    opacity: Number.isFinite(Number(source.opacity)) ? Math.max(0, Math.min(1, Number(source.opacity))) : 1,
    sourcePersistence,
    restoreState,
    restoreWarnings: restoreWarnings.length > 0 ? restoreWarnings : defaultWarnings,
    ...(source.group === "base" || source.group === "data" || source.group === "analysis" || source.group === "voxcity"
      ? { group: source.group }
      : {}),
    ...(source.sourceKind === "project" ||
    source.sourceKind === "imported" ||
    source.sourceKind === "external" ||
    source.sourceKind === "derived" ||
    source.sourceKind === "demo"
      ? { sourceKind: source.sourceKind }
      : {}),
    ...(typeof source.queryable === "boolean" ? { queryable: source.queryable } : {}),
    ...(source.qaStatus === "unchecked" || source.qaStatus === "passed" || source.qaStatus === "warning" || source.qaStatus === "error"
      ? { qaStatus: source.qaStatus }
      : {}),
    ...(sourceRef ? { sourceRef } : {}),
    ...(provenance ? { provenance } : {}),
    ...(style ? { style } : {}),
    ...(metadata ? { metadata } : {}),
    ...(normalizedSourceData ? { sourceData: normalizedSourceData } : {}),
  };
  return normalized;
}

function normalizeEvidenceArtifactReference(value: unknown): PersistedMapEvidenceArtifactReference | null {
  const source = isObject(value) ? value : {};
  const id = typeof source.id === "string" && source.id.trim().length > 0 ? source.id.trim() : null;
  const artifactId = typeof source.artifactId === "string" && source.artifactId.trim().length > 0
    ? source.artifactId.trim()
    : id;
  const kind = typeof source.kind === "string" ? source.kind : null;
  const title = typeof source.title === "string" && source.title.trim().length > 0 ? source.title.trim() : null;
  const state = typeof source.state === "string" ? source.state : "active";
  const sourceModule = typeof source.sourceModule === "string" ? source.sourceModule : "map-explorer";
  if (!id || !artifactId || !kind || !title) return null;
  const qa = isObject(source.qa) ? source.qa : {};
  return {
    id,
    artifactId,
    kind: kind as MapEvidenceArtifact["kind"],
    title,
    state: state as MapEvidenceArtifact["state"],
    sourceModule: sourceModule as MapEvidenceArtifact["sourceModule"],
    linkedLayerIds: normalizeStringList(source.linkedLayerIds),
    sourceLayerIds: normalizeStringList(source.sourceLayerIds),
    ...(typeof source.linkedAoiId === "string" && source.linkedAoiId.trim() ? { linkedAoiId: source.linkedAoiId.trim() } : {}),
    ...(typeof source.linkedRunId === "string" && source.linkedRunId.trim() ? { linkedRunId: source.linkedRunId.trim() } : {}),
    ...(typeof source.linkedWorkflowId === "string" && source.linkedWorkflowId.trim() ? { linkedWorkflowId: source.linkedWorkflowId.trim() } : {}),
    ...(typeof source.reportInsertId === "string" && source.reportInsertId.trim() ? { reportInsertId: source.reportInsertId.trim() } : {}),
    ...(typeof source.reportSnapshotId === "string" && source.reportSnapshotId.trim() ? { reportSnapshotId: source.reportSnapshotId.trim() } : {}),
    ...(typeof source.exportId === "string" && source.exportId.trim() ? { exportId: source.exportId.trim() } : {}),
    qaState: typeof qa.state === "string" ? qa.state as MapEvidenceArtifact["qa"]["state"] : "unchecked",
    qaIssueIds: normalizeStringList(source.qaIssueIds ?? qa.issueIds),
    createdAt: typeof source.createdAt === "string" ? source.createdAt : new Date(0).toISOString(),
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : new Date(0).toISOString(),
  };
}

function normalizeEvidenceArtifactReferences(value: unknown): PersistedMapEvidenceArtifactReference[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeEvidenceArtifactReference)
    .filter((entry): entry is PersistedMapEvidenceArtifactReference => entry != null);
}

function qaIssueCountsFallback(): Record<MapScientificQAIssueSeverity, number> {
  return {
    info: 0,
    warning: 0,
    error: 0,
    blocker: 0,
  };
}

function normalizeQASnapshot(value: unknown): MapProjectQASnapshot | null {
  if (!isObject(value)) return null;
  const issueCountsSource = isObject(value.issueCounts) ? value.issueCounts : {};
  const issueCounts = qaIssueCountsFallback();
  for (const severity of Object.keys(issueCounts) as MapScientificQAIssueSeverity[]) {
    const count = Number(issueCountsSource[severity]);
    issueCounts[severity] = Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
  }
  const issueIds = normalizeStringList(value.issueIds);
  return {
    status:
      value.status === "passed" ||
      value.status === "warning" ||
      value.status === "error" ||
      value.status === "unchecked"
        ? value.status
        : "unchecked",
    checkedAt: typeof value.checkedAt === "string" ? value.checkedAt : null,
    issueCount: Number.isFinite(Number(value.issueCount)) ? Math.max(0, Math.floor(Number(value.issueCount))) : issueIds.length,
    blockerCount: Number.isFinite(Number(value.blockerCount)) ? Math.max(0, Math.floor(Number(value.blockerCount))) : 0,
    layerCount: Number.isFinite(Number(value.layerCount)) ? Math.max(0, Math.floor(Number(value.layerCount))) : 0,
    issueCounts,
    issueIds,
    signature: typeof value.signature === "string" ? value.signature : null,
  };
}

function normalizeReviewTimelineReference(value: unknown): MapProjectReviewTimelineReference | null {
  if (!isObject(value)) return null;
  const sessionId = typeof value.sessionId === "string" && value.sessionId.trim().length > 0 ? value.sessionId.trim() : null;
  if (!sessionId) return null;
  const eventIds = normalizeStringList(value.eventIds);
  const validAuditCategories = new Set<string>(MAP_REVIEW_AUDIT_CATEGORIES);
  return {
    sessionId,
    title: typeof value.title === "string" && value.title.trim().length > 0 ? value.title.trim() : "Map review session",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date(0).toISOString(),
    eventCount: Number.isFinite(Number(value.eventCount)) ? Math.max(0, Math.floor(Number(value.eventCount))) : eventIds.length,
    eventIds,
    auditCategories: normalizeStringList(value.auditCategories).filter((category): category is MapReviewAuditCategory => validAuditCategories.has(category)),
    layerIds: normalizeStringList(value.layerIds),
    evidenceArtifactIds: normalizeStringList(value.evidenceArtifactIds),
    qaIssueIds: normalizeStringList(value.qaIssueIds),
    reportItemIds: normalizeStringList(value.reportItemIds),
  };
}

function normalizeSnapshotReferences(value: unknown): MapProjectSnapshotReferences {
  const source = isObject(value) ? value : {};
  return {
    ...(typeof source.contextSummaryId === "string" && source.contextSummaryId.trim()
      ? { contextSummaryId: source.contextSummaryId.trim() }
      : {}),
    evidenceArtifactIds: normalizeStringList(source.evidenceArtifactIds),
    publicationManifestIds: normalizeStringList(source.publicationManifestIds),
    reportHandoffIds: normalizeStringList(source.reportHandoffIds),
    externalSourceRefs: normalizeStringList(source.externalSourceRefs),
    staleLayerIds: normalizeStringList(source.staleLayerIds),
  };
}

function evidenceIdsForLayer(
  layerId: string,
  evidenceArtifacts: readonly PersistedMapEvidenceArtifactReference[],
): string[] {
  return evidenceArtifacts
    .filter((artifact) =>
      artifact.linkedLayerIds.includes(layerId) || artifact.sourceLayerIds.includes(layerId),
    )
    .map((artifact) => artifact.id);
}

function layerReferenceFromPersistedLayer(
  layer: PersistedOverlayLayer,
  evidenceArtifacts: readonly PersistedMapEvidenceArtifactReference[],
): MapProjectLayerReference {
  const metadata = layer.metadata;
  const evidenceArtifactIds = evidenceIdsForLayer(layer.id, evidenceArtifacts);
  return {
    layerId: layer.id,
    name: layer.name,
    type: layer.type,
    visible: layer.visible,
    opacity: layer.opacity,
    sourcePersistence: layer.sourcePersistence,
    restoreState: layer.restoreState,
    restoreWarnings: [...layer.restoreWarnings],
    evidenceArtifactIds,
    ...(layer.group ? { group: layer.group } : {}),
    ...(layer.sourceKind ? { sourceKind: layer.sourceKind } : {}),
    ...(layer.sourceRef ? { sourceRef: layer.sourceRef } : {}),
    ...(resolveLayerCrs(metadata) ? { crs: resolveLayerCrs(metadata) } : {}),
    ...(metadata?.geometryType ? { geometryType: metadata.geometryType } : {}),
    ...(typeof metadata?.featureCount === "number" ? { featureCount: metadata.featureCount } : {}),
    ...(metadata?.bounds ? { bounds: metadata.bounds } : {}),
    ...(layer.qaStatus ? { qaStatus: layer.qaStatus } : {}),
    ...(typeof layer.queryable === "boolean" ? { queryable: layer.queryable } : {}),
    ...(layer.provenance?.label ? { provenanceLabel: layer.provenance.label } : {}),
  };
}

function migrateSnapshot(projectId: string, raw: unknown): MapProjectSnapshot {
  if (!isObject(raw)) {
    throw new MapPersistenceError("Saved map snapshot is not a valid object.");
  }

  const version = Number(raw.version);
  const normalizedVersion = Number.isFinite(version) && version > 0 ? version : 0;

  if (normalizedVersion > SNAPSHOT_VERSION) {
    throw new MapPersistenceError("Saved map snapshot uses a newer schema version.");
  }

  const pins = Array.isArray(raw.pins) ? raw.pins.map(normalizePin) : [];
  const bookmarks = Array.isArray(raw.bookmarks)
    ? raw.bookmarks.slice(0, MAP_BOOKMARK_LIMIT).map(normalizeBookmark)
    : [];
  const annotations = Array.isArray(raw.annotations)
    ? raw.annotations.slice(0, MAP_ANNOTATION_LIMIT).map(normalizeAnnotation)
    : [];
  const drawnFeatures = Array.isArray(raw.drawnFeatures)
    ? raw.drawnFeatures.map(normalizeDrawnFeature)
    : [];
  const measurements = Array.isArray(raw.measurements)
    ? raw.measurements.map(normalizeMeasurement)
    : [];
  const overlayLayers = Array.isArray(raw.overlayLayers)
    ? raw.overlayLayers.map(normalizeOverlayLayer)
    : [];
  const evidenceArtifacts = normalizeEvidenceArtifactReferences(raw.evidenceArtifacts);
  const layerReferences = Array.isArray(raw.layerReferences)
    ? raw.layerReferences
        .map((entry) => {
          if (!isObject(entry)) return null;
          const layerId = typeof entry.layerId === "string" && entry.layerId.trim().length > 0 ? entry.layerId.trim() : null;
          if (!layerId) return null;
          const layer = overlayLayers.find((candidate) => candidate.id === layerId);
          return layer
            ? layerReferenceFromPersistedLayer(layer, evidenceArtifacts)
            : null;
        })
        .filter((entry): entry is MapProjectLayerReference => entry != null)
    : overlayLayers.map((layer) => layerReferenceFromPersistedLayer(layer, evidenceArtifacts));
  const qaSummary = normalizeQASnapshot(raw.qaSummary);
  const reviewTimeline = normalizeReviewTimelineReference(raw.reviewTimeline);
  const references = normalizeSnapshotReferences(raw.references);
  const externalSourceRefs = Array.from(new Set([
    ...references.externalSourceRefs,
    ...overlayLayers
      .filter((layer) => layer.sourcePersistence === "url" && layer.sourceRef)
      .map((layer) => layer.sourceRef as string),
  ]));
  const staleLayerIds = Array.from(new Set([
    ...references.staleLayerIds,
    ...overlayLayers
      .filter((layer) => layer.restoreState !== "restored")
      .map((layer) => layer.id),
  ]));

  return {
    version: SNAPSHOT_VERSION,
    projectId: typeof raw.projectId === "string" && raw.projectId.trim().length > 0 ? raw.projectId : projectId,
    savedAt: typeof raw.savedAt === "string" ? raw.savedAt : new Date(0).toISOString(),
    activeBaseLayer:
      raw.activeBaseLayer === "streets" ||
      raw.activeBaseLayer === "satellite" ||
      raw.activeBaseLayer === "dark" ||
      raw.activeBaseLayer === "terrain"
        ? raw.activeBaseLayer
        : "dark",
    viewport: normalizeViewport(raw.viewport ?? raw),
    ...(normalizeLayoutPreferences(raw.layoutPreferences) ? { layoutPreferences: normalizeLayoutPreferences(raw.layoutPreferences) } : {}),
    pins,
    bookmarks,
    annotations,
    drawnFeatures,
    measurements,
    overlayLayers,
    layerReferences,
    evidenceArtifacts,
    qaSummary,
    reviewTimeline,
    references: {
      ...references,
      evidenceArtifactIds: Array.from(new Set([
        ...references.evidenceArtifactIds,
        ...evidenceArtifacts.map((artifact) => artifact.id),
      ])),
      externalSourceRefs,
      staleLayerIds,
    },
    persistenceBoundary: MAP_PROJECT_PERSISTENCE_BOUNDARY,
  };
}

function serializeLayerForPersistence(layer: OverlayLayerConfig): PersistedOverlayLayer {
  const sourceRef = resolveLayerSourceRef(layer);
  const baseSourcePersistence: LayerPersistenceSource = !layer.sourceData && sourceRef ? "url" : "metadata";
  const baseRestoreState = resolveRestoreState(baseSourcePersistence);
  const base: PersistedOverlayLayer = {
    id: layer.id,
    name: layer.name,
    type: layer.type,
    visible: layer.visible,
    opacity: layer.opacity,
    sourcePersistence: baseSourcePersistence,
    restoreState: baseRestoreState,
    restoreWarnings: buildRestoreWarnings(baseSourcePersistence, sourceRef),
    ...(layer.group ? { group: layer.group } : {}),
    ...(layer.sourceKind ? { sourceKind: layer.sourceKind } : {}),
    ...(typeof layer.queryable === "boolean" ? { queryable: layer.queryable } : {}),
    ...(layer.qaStatus ? { qaStatus: layer.qaStatus } : {}),
    ...(sourceRef ? { sourceRef } : {}),
    ...(layer.provenance ? { provenance: cloneJson(layer.provenance) } : {}),
    ...(layer.style ? { style: cloneJson(layer.style) } : {}),
    ...(layer.metadata ? { metadata: cloneJson(layer.metadata) } : {}),
  };

  if (!layer.sourceData) {
    return base;
  }

  if (typeof layer.sourceData === "string") {
    if (byteLength(layer.sourceData) > INLINE_LAYER_DATA_LIMIT_BYTES && isLikelyInlineGeoJsonText(layer.sourceData)) {
      return metadataOnlyStaleLayer(base);
    }

    const inlineCollection = parseInlineGeoJSONSource(layer.sourceData);
    if (inlineCollection) {
      if (estimateJsonSerializedBytes(inlineCollection, INLINE_LAYER_DATA_LIMIT_BYTES + 1) > INLINE_LAYER_DATA_LIMIT_BYTES) {
        return metadataOnlyStaleLayer(base);
      }

      return {
        ...base,
        sourceData: cloneJson(inlineCollection),
        sourcePersistence: "inline",
        restoreState: "restored",
        restoreWarnings: [],
      };
    }

    return {
      ...base,
      sourceData: layer.sourceData,
      sourcePersistence: "url",
      restoreState: "external-reference",
      restoreWarnings: buildRestoreWarnings("url", layer.sourceData),
      sourceRef: layer.sourceData,
    };
  }

  if (estimateJsonSerializedBytes(layer.sourceData, INLINE_LAYER_DATA_LIMIT_BYTES + 1) > INLINE_LAYER_DATA_LIMIT_BYTES) {
    return metadataOnlyStaleLayer(base);
  }

  const clonedSource = cloneJson(layer.sourceData as FeatureCollection | Feature | Geometry);
  const serializedSource = JSON.stringify(clonedSource);
  if (byteLength(serializedSource) > INLINE_LAYER_DATA_LIMIT_BYTES) {
    return metadataOnlyStaleLayer(base);
  }

  return {
    ...base,
    sourceData: clonedSource,
    sourcePersistence: "inline",
    restoreState: "restored",
    restoreWarnings: [],
  };
}

function buildQASnapshot(qa: MapScientificQAState | null | undefined): MapProjectQASnapshot | null {
  if (!qa) return null;
  const blockerCount = qa.issues.filter((issue) => issue.severity === "blocker" || issue.severity === "error").length;
  return {
    status: qa.status,
    checkedAt: qa.checkedAt,
    issueCount: qa.issues.length,
    blockerCount,
    layerCount: qa.layerSummaries.length,
    issueCounts: { ...qaIssueCountsFallback(), ...qa.metadata.issueCounts },
    issueIds: qa.issues.map((issue) => issue.id),
    signature: qa.metadata.signature,
  };
}

function buildReviewTimelineReference(
  reviewSession: MapReviewSession | null | undefined,
): MapProjectReviewTimelineReference | null {
  if (!reviewSession) return null;
  const auditCategories = new Set<MapReviewAuditCategory>();
  const layerIds = new Set<string>();
  const evidenceArtifactIds = new Set<string>();
  const qaIssueIds = new Set<string>();
  const reportItemIds = new Set<string>();
  const eventIds: string[] = [];

  for (const event of reviewSession.events) {
    eventIds.push(event.id);
    auditCategories.add(event.category);
    for (const layerId of event.layerIds) layerIds.add(layerId);
    for (const evidenceArtifactId of event.evidenceArtifactIds) evidenceArtifactIds.add(evidenceArtifactId);
    for (const issueId of event.qaIssueIds) qaIssueIds.add(issueId);
    for (const reportId of event.reportItemIds) reportItemIds.add(reportId);
  }

  return {
    sessionId: reviewSession.id,
    title: reviewSession.title,
    updatedAt: reviewSession.updatedAt,
    eventCount: reviewSession.events.length,
    eventIds,
    auditCategories: [...auditCategories],
    layerIds: [...layerIds],
    evidenceArtifactIds: [...evidenceArtifactIds],
    qaIssueIds: [...qaIssueIds],
    reportItemIds: [...reportItemIds],
  };
}

function buildSnapshotReferences(input: {
  contextSummaryId?: string;
  evidenceArtifacts: readonly PersistedMapEvidenceArtifactReference[];
  overlayLayers: readonly PersistedOverlayLayer[];
  publicationManifestIds?: string[];
  reportHandoffIds?: string[];
}): MapProjectSnapshotReferences {
  const externalSourceRefs = input.overlayLayers
    .map((layer) => layer.sourceRef)
    .filter((sourceRef): sourceRef is string => Boolean(sourceRef));
  const staleLayerIds = input.overlayLayers
    .filter((layer) => layer.restoreState !== "restored")
    .map((layer) => layer.id);
  return {
    ...(input.contextSummaryId ? { contextSummaryId: input.contextSummaryId } : {}),
    evidenceArtifactIds: input.evidenceArtifacts.map((artifact) => artifact.id),
    publicationManifestIds: normalizeStringList(input.publicationManifestIds),
    reportHandoffIds: normalizeStringList(input.reportHandoffIds),
    externalSourceRefs: Array.from(new Set(externalSourceRefs)),
    staleLayerIds: Array.from(new Set(staleLayerIds)),
  };
}

function createSnapshot(input: SaveProjectMapStateInput): MapProjectSnapshot {
  const overlayLayers = input.overlayLayers.map(serializeLayerForPersistence);
  const evidenceArtifacts = normalizeEvidenceArtifactReferences(input.mapEvidenceArtifacts ?? []);
  const layerReferences = overlayLayers.map((layer) => layerReferenceFromPersistedLayer(layer, evidenceArtifacts));
  const qaSummary = buildQASnapshot(input.scientificQA);
  const reviewTimeline = buildReviewTimelineReference(input.reviewSession);
  return {
    version: SNAPSHOT_VERSION,
    projectId: sanitizeProjectId(input.projectId),
    savedAt: new Date().toISOString(),
    activeBaseLayer: input.activeBaseLayer,
    viewport: cloneJson(input.viewport),
    ...(input.layoutPreferences ? { layoutPreferences: cloneJson(input.layoutPreferences) } : {}),
    pins: cloneJson(input.pins),
    bookmarks: cloneJson((input.bookmarks ?? []).slice(0, MAP_BOOKMARK_LIMIT)),
    annotations: cloneJson((input.annotations ?? []).slice(0, MAP_ANNOTATION_LIMIT)),
    drawnFeatures: cloneJson(input.drawnFeatures),
    measurements: cloneJson(input.measurements ?? []),
    overlayLayers,
    layerReferences,
    evidenceArtifacts,
    qaSummary,
    reviewTimeline,
    references: buildSnapshotReferences({
      contextSummaryId: input.lastContextSnapshotId,
      evidenceArtifacts,
      overlayLayers,
      publicationManifestIds: input.publicationManifestIds,
      reportHandoffIds: input.reportHandoffIds,
    }),
    persistenceBoundary: MAP_PROJECT_PERSISTENCE_BOUNDARY,
  };
}

function buildSpatialLayerFeatures(layer: PersistedOverlayLayer): Feature[] {
  if (!layer.sourceData) {
    return [];
  }

  const inlineCollection = typeof layer.sourceData === "string"
    ? parseInlineGeoJSONSource(layer.sourceData)
    : null;
  if (typeof layer.sourceData === "string" && !inlineCollection) {
    return [];
  }

  const collection = inlineCollection ?? parseGeoJSONText(JSON.stringify(layer.sourceData));
  return collection.features.map((feature) => ({
    ...cloneJson(feature),
    properties: {
      ...(cloneJson(feature.properties ?? {}) as GeoJsonProperties),
      __mapSourceType: "overlay",
      __mapLayerId: layer.id,
      __mapLayerName: layer.name,
      __mapLayerType: layer.type,
    },
  }));
}

function buildSpatialFeatureCollection(snapshot: MapProjectSnapshot): FeatureCollection {
  const pinFeatures = exportPinsToFeatureCollection(snapshot.pins).features.map((feature) => ({
    ...feature,
    properties: {
      ...(cloneJson(feature.properties ?? {}) as GeoJsonProperties),
      __mapSourceType: "pin",
    },
  }));

  const drawingFeatures = exportDrawingsToFeatureCollection(snapshot.drawnFeatures).features.map((feature) => ({
    ...feature,
    properties: {
      ...(cloneJson(feature.properties ?? {}) as GeoJsonProperties),
      __mapSourceType: "drawing",
    },
  }));

  const annotationFeatures = snapshot.annotations.map((annotation) => ({
    ...cloneJson(annotation),
    properties: {
      ...(cloneJson(annotation.properties ?? {}) as GeoJsonProperties),
      __mapSourceType: "annotation",
      __mapAnnotationId: annotation.id,
    },
  }));

  const overlayFeatures = snapshot.overlayLayers.flatMap((layer) => buildSpatialLayerFeatures(layer));

  return {
    type: "FeatureCollection",
    features: [...pinFeatures, ...drawingFeatures, ...annotationFeatures, ...overlayFeatures],
  };
}

function countLayerFeatures(layer: PersistedOverlayLayer): number {
  if (layer.sourcePersistence !== "inline" || !layer.sourceData) {
    return 0;
  }

  const inlineCollection = typeof layer.sourceData === "string"
    ? parseInlineGeoJSONSource(layer.sourceData)
    : null;
  const parsed = inlineCollection ?? parseGeoJSONText(JSON.stringify(layer.sourceData));
  return parsed.features.length;
}

function computeRestoredFeatureCount(snapshot: MapProjectSnapshot): number {
  const inlineLayerFeatureCount = snapshot.overlayLayers.reduce((total, layer) => total + countLayerFeatures(layer), 0);
  return snapshot.pins.length + snapshot.drawnFeatures.length + snapshot.annotations.length + inlineLayerFeatureCount;
}

function computeLocalStorageUsage(): number {
  if (typeof localStorage === "undefined") return 0;

  let usage = 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? "";
    usage += byteLength(key) + byteLength(value);
  }
  return usage;
}

async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  const storageManager = typeof navigator !== "undefined" ? navigator.storage : undefined;
  if (storageManager?.estimate) {
    const estimate = await storageManager.estimate();
    if (typeof estimate.quota === "number" && typeof estimate.usage === "number") {
      return {
        usage: estimate.usage,
        quota: estimate.quota,
      };
    }
  }

  return {
    usage: computeLocalStorageUsage(),
    quota: FALLBACK_STORAGE_QUOTA_BYTES,
  };
}

async function estimateQuotaForWrite(projectId: string, payload: string): Promise<MapPersistenceQuotaEstimate> {
  const { usage, quota } = await getStorageEstimate();
  const existing = typeof localStorage !== "undefined" ? localStorage.getItem(storageKey(projectId)) ?? "" : "";
  const existingBytes = existing.length > 0 ? byteLength(existing) : 0;
  const payloadBytes = byteLength(payload);
  const projectedUsage = Math.max(0, usage - existingBytes + payloadBytes);
  const percentUsed = quota > 0 ? usage / quota : 0;
  const projectedPercentUsed = quota > 0 ? projectedUsage / quota : 0;

  return {
    usage,
    quota,
    projectedUsage,
    percentUsed,
    projectedPercentUsed,
    warning: projectedPercentUsed >= QUOTA_WARNING_RATIO,
    blocked: quota > 0 && projectedUsage >= quota,
  };
}

async function ensureSpatialTable(projectId: string, snapshot: MapProjectSnapshot): Promise<string> {
  const tableName = spatialTableName(projectId);
  const cachedSavedAt = syncedProjects.get(projectId);
  if (cachedSavedAt === snapshot.savedAt) {
    return tableName;
  }

  const featureCollection = buildSpatialFeatureCollection(snapshot);
  await loadGeoJSON(tableName, featureCollection);
  syncedProjects.set(projectId, snapshot.savedAt);
  return tableName;
}

function restoreOverlayLayers(snapshot: MapProjectSnapshot): OverlayLayerConfig[] {
  return snapshot.overlayLayers.map((layer): OverlayLayerConfig => ({
    id: layer.id,
    name: layer.name,
    type: layer.type,
    visible: layer.visible,
    opacity: layer.opacity,
    ...(layer.group ? { group: layer.group } : {}),
    ...(layer.sourceKind ? { sourceKind: layer.sourceKind } : {}),
    ...(typeof layer.queryable === "boolean" ? { queryable: layer.queryable } : {}),
    ...(layer.qaStatus ? { qaStatus: layer.qaStatus } : {}),
    ...(layer.provenance ? { provenance: cloneJson(layer.provenance) } : {}),
    ...(layer.style ? { style: cloneJson(layer.style) } : {}),
    metadata: {
      ...(layer.metadata ? cloneJson(layer.metadata) : {}),
      persistence: {
        snapshotVersion: snapshot.version,
        savedAt: snapshot.savedAt,
        sourcePersistence: layer.sourcePersistence,
        restoreState: layer.restoreState,
        restoreWarnings: [...layer.restoreWarnings],
        ...(layer.sourceRef ? { sourceRef: layer.sourceRef } : {}),
      },
    },
    ...(layer.sourceData ? { sourceData: cloneJson(layer.sourceData) } : {}),
  }));
}

function buildBoundsPolygonWkt(bounds: [number, number, number, number]): string {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  return `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;
}

async function ensureProjectSnapshot(projectId: string): Promise<MapProjectSnapshot | null> {
  const key = storageKey(projectId);
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new MapPersistenceError("Saved map snapshot is corrupted and could not be parsed.");
  }

  return migrateSnapshot(projectId, parsed);
}

export async function saveProjectMapState(
  input: SaveProjectMapStateInput,
): Promise<SaveProjectMapStateResult> {
  const projectId = sanitizeProjectId(input.projectId);
  const snapshot = createSnapshot({ ...input, projectId });
  const payload = JSON.stringify(snapshot);
  const quota = await estimateQuotaForWrite(projectId, payload);

  if (quota.blocked) {
    throw new MapPersistenceError("Map storage quota is full. Free space before saving this project.");
  }

  const storage = getBrowserStorage();
  try {
    storage.setItem(storageKey(projectId), payload);
  } catch {
    throw new MapPersistenceError("Map storage quota was exceeded while saving this project.");
  }

  const tableName = await ensureSpatialTable(projectId, snapshot);
  return {
    snapshot,
    quota,
    persistedFeatureCount: computeRestoredFeatureCount(snapshot),
    persistedLayerCount: snapshot.overlayLayers.length,
    metadataOnlyLayerCount: snapshot.overlayLayers.filter((layer) => layer.sourcePersistence === "metadata").length,
    spatialTableName: tableName,
  };
}

export async function loadProjectMapState(projectId: string): Promise<LoadProjectMapStateResult> {
  const normalizedProjectId = sanitizeProjectId(projectId);
  const snapshot = await ensureProjectSnapshot(normalizedProjectId);
  if (!snapshot) {
    syncedProjects.delete(normalizedProjectId);
    return {
      snapshot: null,
      restoredPinCount: 0,
      restoredDrawingCount: 0,
      restoredLayerCount: 0,
      restoredFeatureCount: 0,
      spatialTableName: null,
      staleLayerIds: [],
      externalSourceRefs: [],
    };
  }

  const tableName = await ensureSpatialTable(normalizedProjectId, snapshot);
  return {
    snapshot: cloneJson(snapshot),
    restoredPinCount: snapshot.pins.length,
    restoredDrawingCount: snapshot.drawnFeatures.length,
    restoredLayerCount: snapshot.overlayLayers.length,
    restoredFeatureCount: computeRestoredFeatureCount(snapshot),
    spatialTableName: tableName,
    staleLayerIds: [...snapshot.references.staleLayerIds],
    externalSourceRefs: [...snapshot.references.externalSourceRefs],
  };
}

export async function queryProjectFeaturesByBounds(params: {
  projectId: string;
  bounds: [number, number, number, number];
  predicate?: SpatialQueryPredicate;
}): Promise<ProjectSpatialQueryResult> {
  const projectId = sanitizeProjectId(params.projectId);
  const snapshot = await ensureProjectSnapshot(projectId);
  if (!snapshot) {
    return {
      collection: { type: "FeatureCollection", features: [] },
      rowCount: 0,
      spatialTableName: spatialTableName(projectId),
    };
  }

  const tableName = await ensureSpatialTable(projectId, snapshot);
  const predicate = params.predicate === "within" ? "ST_Within" : "ST_Intersects";
  const wkt = buildBoundsPolygonWkt(params.bounds);
  const collection = await toGeoJSON(`
    SELECT *
    FROM "${tableName}"
    WHERE ${predicate}(geometry, ST_GeomFromText('${wkt}'))
  `);

  return {
    collection,
    rowCount: collection.features.length,
    spatialTableName: tableName,
  };
}

export async function estimateProjectMapStorage(
  projectId: string,
  nextSnapshot?: SaveProjectMapStateInput,
): Promise<MapPersistenceQuotaEstimate> {
  const normalizedProjectId = sanitizeProjectId(projectId);
  const payload = nextSnapshot
    ? JSON.stringify(createSnapshot({ ...nextSnapshot, projectId: normalizedProjectId }))
    : typeof localStorage !== "undefined"
      ? localStorage.getItem(storageKey(normalizedProjectId)) ?? ""
      : "";

  return estimateQuotaForWrite(normalizedProjectId, payload);
}

export function getRestorableOverlayLayers(snapshot: MapProjectSnapshot): OverlayLayerConfig[] {
  return restoreOverlayLayers(snapshot);
}

export async function hasProjectMapState(projectId: string): Promise<boolean> {
  const normalizedProjectId = sanitizeProjectId(projectId);
  return typeof localStorage !== "undefined" && localStorage.getItem(storageKey(normalizedProjectId)) != null;
}

export async function getSyncedProjectTables(): Promise<string[]> {
  const tables = await getTables();
  return tables
    .map((table) => table.name)
    .filter((name) => name.startsWith("map_project_"));
}
