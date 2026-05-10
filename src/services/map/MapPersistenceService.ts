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
  LayerGroupId,
  LayerMetadata,
  MapAnnotation,
  MapAnnotationProperties,
  MapAnnotationStyleSettings,
  MapBookmark,
  MapPin,
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

const STORAGE_PREFIX = "synapse.map.project.persistence.v1.";
const SNAPSHOT_VERSION = 2;
const INLINE_LAYER_DATA_LIMIT_BYTES = 1 * 1024 * 1024;
const FALLBACK_STORAGE_QUOTA_BYTES = 5 * 1024 * 1024;
const QUOTA_WARNING_RATIO = 0.8;

const syncedProjects = new Map<string, string>();

type PersistedSourceData = string | FeatureCollection | Feature | Geometry;

export type SpatialQueryPredicate = "intersects" | "within";

export interface PersistedOverlayLayer {
  id: string;
  name: string;
  type: OverlayLayerConfig["type"];
  visible: boolean;
  opacity: number;
  group?: LayerGroupId;
  style?: Record<string, unknown>;
  metadata?: LayerMetadata;
  sourceData?: PersistedSourceData;
  sourcePersistence: "inline" | "url" | "metadata";
}

export interface MapProjectSnapshot {
  version: number;
  projectId: string;
  savedAt: string;
  activeBaseLayer: BaseLayerId;
  viewport: ViewportState;
  pins: MapPin[];
  bookmarks: MapBookmark[];
  annotations: MapAnnotation[];
  drawnFeatures: DrawnFeature[];
  overlayLayers: PersistedOverlayLayer[];
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
    color: typeof source.color === "string" && source.color.trim().length > 0 ? source.color : "#F59E0B",
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

function normalizeOverlayLayer(layer: unknown): PersistedOverlayLayer {
  const source = isObject(layer) ? layer : {};
  const metadata = isObject(source.metadata) ? cloneJson(source.metadata as LayerMetadata) : undefined;
  const style = isObject(source.style) ? cloneJson(source.style as Record<string, unknown>) : undefined;
  const sourceData = source.sourceData;
  const normalizedSourceData =
    typeof sourceData === "string" || isObject(sourceData) ? cloneJson(sourceData as PersistedSourceData) : undefined;
  const sourcePersistence =
    source.sourcePersistence === "inline" || source.sourcePersistence === "url" || source.sourcePersistence === "metadata"
      ? source.sourcePersistence
      : normalizedSourceData == null
        ? "metadata"
        : typeof normalizedSourceData === "string"
          ? "url"
          : "inline";

  return {
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
    ...(source.group === "base" || source.group === "data" || source.group === "analysis"
      ? { group: source.group }
      : {}),
    ...(style ? { style } : {}),
    ...(metadata ? { metadata } : {}),
    ...(normalizedSourceData ? { sourceData: normalizedSourceData } : {}),
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
  const overlayLayers = Array.isArray(raw.overlayLayers)
    ? raw.overlayLayers.map(normalizeOverlayLayer)
    : [];

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
    pins,
    bookmarks,
    annotations,
    drawnFeatures,
    overlayLayers,
  };
}

function serializeLayerForPersistence(layer: OverlayLayerConfig): PersistedOverlayLayer {
  const base: PersistedOverlayLayer = {
    id: layer.id,
    name: layer.name,
    type: layer.type,
    visible: layer.visible,
    opacity: layer.opacity,
    sourcePersistence: "metadata",
    ...(layer.group ? { group: layer.group } : {}),
    ...(layer.style ? { style: cloneJson(layer.style) } : {}),
    ...(layer.metadata ? { metadata: cloneJson(layer.metadata) } : {}),
  };

  if (!layer.sourceData) {
    return base;
  }

  if (typeof layer.sourceData === "string") {
    const inlineCollection = parseInlineGeoJSONSource(layer.sourceData);
    if (inlineCollection) {
      return {
        ...base,
        sourceData: cloneJson(inlineCollection),
        sourcePersistence: "inline",
      };
    }

    return {
      ...base,
      sourceData: layer.sourceData,
      sourcePersistence: "url",
    };
  }

  const clonedSource = cloneJson(layer.sourceData as FeatureCollection | Feature | Geometry);
  const serializedSource = JSON.stringify(clonedSource);
  if (byteLength(serializedSource) > INLINE_LAYER_DATA_LIMIT_BYTES) {
    return base;
  }

  return {
    ...base,
    sourceData: clonedSource,
    sourcePersistence: "inline",
  };
}

function createSnapshot(input: SaveProjectMapStateInput): MapProjectSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    projectId: sanitizeProjectId(input.projectId),
    savedAt: new Date().toISOString(),
    activeBaseLayer: input.activeBaseLayer,
    viewport: cloneJson(input.viewport),
    pins: cloneJson(input.pins),
    bookmarks: cloneJson((input.bookmarks ?? []).slice(0, MAP_BOOKMARK_LIMIT)),
    annotations: cloneJson((input.annotations ?? []).slice(0, MAP_ANNOTATION_LIMIT)),
    drawnFeatures: cloneJson(input.drawnFeatures),
    overlayLayers: input.overlayLayers.map(serializeLayerForPersistence),
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
    return layer.metadata?.featureCount ?? 0;
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
    ...(layer.style ? { style: cloneJson(layer.style) } : {}),
    ...(layer.metadata ? { metadata: cloneJson(layer.metadata) } : {}),
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
