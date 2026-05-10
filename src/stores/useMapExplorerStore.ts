import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import {
  MAP_ANNOTATION_LIMIT,
  MAP_BOOKMARK_LIMIT,
  MAP_LAYER_REGISTRY_EVENT,
  type LayerGroupId,
  type LayerProvenance,
  type LayerQaStatus,
  type LayerSourceKind,
  type BaseLayerId,
  type DrawnFeature,
  type DrawToolId,
  type MapAnnotation,
  type MapAnnotationProperties,
  type MapAnnotationStyleSettings,
  type MapBookmark,
  type MapEvidenceArtifact,
  type MapLayerRegistryChangeDetail,
  type MapLayerRegistryOperation,
  type MapPin,
  type MapToolId,
  type Measurement,
  type MeasureToolId,
  type MeasureUnit,
  type OverlayLayerConfig,
  type PendingFitBoundsRequest,
  type PendingFitBoundsRequestInput,
  type PlaybackSpeed,
  type TemporalTimeRange,
  type ViewportState,
} from "../centerpanel/components/map/mapTypes";
import { MAP_NUMERIC } from "../centerpanel/components/map/mapTokens";
import {
  resolveOverlayLayerQueryable,
  summarizeOverlayLayer,
} from "../centerpanel/components/map/mapContextSummary";
import {
  createMapEvidenceArtifact,
  patchMapEvidenceArtifact,
  selectMapEvidenceArtifactsByAoi as filterMapEvidenceArtifactsByAoi,
  selectMapEvidenceArtifactsByLayer as filterMapEvidenceArtifactsByLayer,
  selectMapEvidenceArtifactsBySource as filterMapEvidenceArtifactsBySource,
  selectMapEvidenceArtifactsByWorkflow as filterMapEvidenceArtifactsByWorkflow,
  upsertMapEvidenceArtifact as upsertMapEvidenceArtifactInRegistry,
  type MapEvidenceArtifactDraft,
  type MapEvidenceArtifactUpdate,
} from "../centerpanel/components/map/mapEvidenceArtifacts";
import type { MapScientificQAState } from "../services/map/MapScientificQA";
import {
  appendMapReviewEvent,
  createMapReviewSession,
  updateMapReviewEventStatus as updateMapReviewEventStatusInSession,
  type MapReviewSession,
  type MapReviewSessionInput,
  type MapReviewTimelineEventInput,
  type MapReviewTimelineEventStatus,
} from "../services/map/MapReviewSessionService";

/* ================================================================== */
/*  Default viewport                                                   */
/* ================================================================== */

const DEFAULT_VIEWPORT: ViewportState = {
  center: [29.0, 41.0],
  zoom: 10,
  bearing: 0,
  pitch: 0,
};

export interface MapExplorerLayoutPreferences {
  layerPanelWidth: number;
  rightPanelWidth: number;
}

const DEFAULT_LAYOUT_PREFERENCES: MapExplorerLayoutPreferences = {
  layerPanelWidth: MAP_NUMERIC.layerPanelWidth,
  rightPanelWidth: 384,
};

const DEFAULT_ANNOTATION_SETTINGS: MapAnnotationStyleSettings = {
  fontSize: 16,
  color: "#F59E0B",
  bold: true,
  italic: false,
  rotation: 0,
  hasBackground: true,
  leaderLine: false,
};

type MapBookmarkInput = Omit<MapBookmark, "id" | "timestamp"> & Partial<Pick<MapBookmark, "id" | "timestamp">>;

interface MapAnnotationInput {
  id?: string;
  coordinate: [number, number];
  text: string;
  style: MapAnnotationStyleSettings;
  leaderTarget?: [number, number] | null;
  createdAt?: string;
  updatedAt?: string;
}

type MapCopilotActionStatus = "proposed" | "preview" | "applied" | "rejected";

interface MapCopilotContextSnapshotInput {
  snapshotId: string;
  [key: string]: unknown;
}

interface MapCopilotActionProposalInput {
  id: string;
  kind: string;
  title: string;
  [key: string]: unknown;
}

interface MapCopilotActionProposal extends MapCopilotActionProposalInput {
  status: MapCopilotActionStatus;
  queuedAt: string;
  previewedAt?: string;
  appliedAt?: string;
  rejectedAt?: string;
}

interface MapCopilotAuditEntry {
  id: string;
  proposalId: string;
  action: MapCopilotActionStatus;
  timestamp: string;
}

const isAoiFeature = (feature: Pick<DrawnFeature, "geometry">): boolean =>
  feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon";

const resolveActiveAoiId = (features: DrawnFeature[], preferredId?: string): string | undefined => {
  const preferred = preferredId
    ? features.find((feature) => feature.id === preferredId && isAoiFeature(feature))
    : undefined;
  return preferred?.id ?? features.find(isAoiFeature)?.id;
};

/* ================================================================== */
/*  State shape                                                        */
/* ================================================================== */

export interface MapExplorerState {
  /* --- Visibility (NOT persisted) --- */
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  /* --- Viewport (persisted) --- */
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  setViewport: (v: Partial<ViewportState>) => void;
  /**
   * Apply a partial viewport synchronously, bypassing the debounced setter.
   *
   * Use this for programmatic synchronization (e.g. Urban Analytics
   * study-area binding) where the next consumer must read the new viewport
   * immediately. Cancels any pending debounced setViewport timer.
   */
  applyImmediateViewport: (v: Partial<ViewportState>) => void;

  /* --- Pending fit-bounds request (NOT persisted) --- */
  /**
   * Latest pending request for the Map Explorer canvas to fit a target
   * extent. Last-write-wins. Consumers (e.g. MapExplorerModal) read and
   * clear this value once the fit has been applied to the live map.
   */
  pendingFitBounds: PendingFitBoundsRequest | null;
  /**
   * Queue a fit-bounds request. Returns the queued request so callers can
   * correlate downstream events. Safe to call before the modal mounts —
   * Map Explorer consumes the latest request when its canvas becomes ready.
   */
  requestFitBounds: (input: PendingFitBoundsRequestInput) => PendingFitBoundsRequest;
  /**
   * Atomically read and clear the pending fit-bounds request. Returns the
   * consumed request, or null if there was nothing to consume.
   */
  consumePendingFitBounds: () => PendingFitBoundsRequest | null;
  /**
   * Mirror of the most recent explicit fit-bounds request that survives
   * past `consumePendingFitBounds`. Used to give explicit user-driven fit
   * intents (e.g. an Urban Analytics study-area selection) priority over
   * downstream side-effects on the same open cycle, such as project
   * autoload restoring a stored viewport. Cleared on the next genuine
   * user-initiated pan/zoom or via `clearLastExplicitFitRequest()`.
   */
  lastExplicitFitRequest: PendingFitBoundsRequest | null;
  /** Clear `lastExplicitFitRequest`. */
  clearLastExplicitFitRequest: () => void;

  /* --- Base layer (persisted) --- */
  activeBaseLayer: BaseLayerId;
  setBaseLayer: (layer: BaseLayerId) => void;

  /* --- Pins (persisted) --- */
  pins: MapPin[];
  addPin: (pin: MapPin) => void;
  removePin: (id: string) => void;
  updatePin: (id: string, patch: Partial<Omit<MapPin, "id">>) => void;
  clearPins: () => void;
  replacePins: (pins: MapPin[]) => void;

  /* --- Bookmarks (persisted) --- */
  bookmarks: MapBookmark[];
  addMapBookmark: (bookmark: MapBookmarkInput) => MapBookmark | null;
  renameMapBookmark: (id: string, name: string) => void;
  removeMapBookmark: (id: string) => void;
  restoreMapBookmark: (id: string) => MapBookmark | null;
  replaceMapBookmarks: (bookmarks: MapBookmark[]) => void;
  clearMapBookmarks: () => void;

  /* --- Annotations (persisted) --- */
  annotations: MapAnnotation[];
  annotationToolSettings: MapAnnotationStyleSettings;
  selectedAnnotationId: string | null;
  setAnnotationToolSettings: (settings: Partial<MapAnnotationStyleSettings>) => void;
  addMapAnnotation: (annotation: MapAnnotationInput) => MapAnnotation | null;
  updateMapAnnotation: (id: string, patch: {
    geometry?: GeoJSON.Point;
    properties?: Partial<MapAnnotationProperties>;
  }) => void;
  moveMapAnnotation: (id: string, coordinate: [number, number]) => void;
  removeMapAnnotation: (id: string) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  replaceMapAnnotations: (annotations: MapAnnotation[]) => void;
  clearMapAnnotations: () => void;

  /* --- Active tool (NOT persisted) --- */
  activeTool: MapToolId;
  setActiveTool: (tool: MapToolId) => void;

  /* --- Layout preferences (persisted) --- */
  layoutPreferences: MapExplorerLayoutPreferences;
  setLayoutPreferences: (patch: Partial<MapExplorerLayoutPreferences>) => void;

  /* --- Overlay layers (NOT persisted — GeoJSON too large) --- */
  overlayLayers: OverlayLayerConfig[];
  addOverlayLayer: (layer: OverlayLayerConfig) => void;
  removeOverlayLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  updateLayerMetadata: (id: string, metadata: Partial<OverlayLayerConfig>) => void;
  reorderLayers: (orderedIds: string[]) => void;
  replaceOverlayLayers: (layers: OverlayLayerConfig[]) => void;
  scientificQA: MapScientificQAState | null;
  setScientificQA: (qa: MapScientificQAState | null) => void;
  currentMapBounds: [number, number, number, number] | null;
  currentMapBoundsUpdatedAt: string | null;
  setCurrentMapBounds: (bounds: [number, number, number, number] | null) => void;

  /* --- Map evidence artifact registry (NOT persisted) --- */
  mapEvidenceArtifacts: MapEvidenceArtifact[];
  registerMapEvidenceArtifact: (draft: MapEvidenceArtifactDraft) => MapEvidenceArtifact;
  upsertMapEvidenceArtifact: (artifact: MapEvidenceArtifact) => MapEvidenceArtifact;
  updateMapEvidenceArtifact: (
    artifactId: string,
    patch: MapEvidenceArtifactUpdate,
  ) => MapEvidenceArtifact | null;
  clearMapEvidenceArtifacts: () => void;

    /* --- Selection metadata (NOT persisted) --- */
  selectedFeatureIds: Record<string, string[]>;
  activeAoiId: string | undefined;
  activeAnalysisResultLayerIds: string[];
  setSelectedFeatures: (layerId: string, featureIds: string[]) => void;
  clearSelectedFeatures: (layerId?: string) => void;
  setActiveAoi: (id: string | undefined) => void;
  setActiveAnalysisResultLayers: (ids: string[]) => void;

  /* --- Copilot context/action metadata (NOT persisted) --- */
  lastContextSnapshotId: string | undefined;
  lastCopilotContextSnapshot: MapCopilotContextSnapshotInput | null;
  copilotActionProposals: MapCopilotActionProposal[];
  copilotAuditTrail: MapCopilotAuditEntry[];
  pendingCopilotActionCount: number;
  emitCopilotContextSnapshot: (snapshot: MapCopilotContextSnapshotInput) => void;
  queueCopilotActionProposal: (proposal: MapCopilotActionProposalInput) => void;
  previewCopilotActionProposal: (id: string) => void;
  applyCopilotActionProposal: (id: string) => void;
  rejectCopilotActionProposal: (id: string) => void;

  /* --- Collaborative review session metadata (NOT persisted) --- */
  reviewSession: MapReviewSession;
  addMapReviewEvent: (event: MapReviewTimelineEventInput) => void;
  updateMapReviewEventStatus: (eventId: string, status: MapReviewTimelineEventStatus, outcome?: string) => void;
  clearMapReviewSession: (input?: MapReviewSessionInput) => void;

  /* --- Drawing (NOT persisted) --- */
  activeDrawTool: DrawToolId | null;
  setActiveDrawTool: (tool: DrawToolId | null) => void;
  drawnFeatures: DrawnFeature[];
  addDrawnFeature: (feature: DrawnFeature) => void;
  removeDrawnFeature: (id: string) => void;
  updateDrawnFeature: (id: string, patch: Partial<DrawnFeature>) => void;
  clearDrawnFeatures: () => void;
  replaceDrawnFeatures: (features: DrawnFeature[]) => void;
  selectedFeatureId: string | null;
  setSelectedFeatureId: (id: string | null) => void;

  /** AOI selector: returns the first drawn polygon / rectangle, or null */
  getAoi: () => DrawnFeature | null;

  /* --- Measurement (NOT persisted) --- */
  activeMeasureTool: MeasureToolId | null;
  setActiveMeasureTool: (tool: MeasureToolId | null) => void;
  measureUnit: MeasureUnit;
  setMeasureUnit: (unit: MeasureUnit) => void;
  measurements: Measurement[];
  addMeasurement: (m: Measurement) => void;
  removeMeasurement: (id: string) => void;
  clearMeasurements: () => void;
  /* --- Temporal player (NOT persisted) --- */
  currentTimestep: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  timeRange: TemporalTimeRange;
  setCurrentTimestep: (step: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setTimeRange: (range: TemporalTimeRange) => void;

  restoreProjectState: (state: {
    viewport: ViewportState;
    activeBaseLayer: BaseLayerId;
    pins: MapPin[];
    bookmarks: MapBookmark[];
    annotations: MapAnnotation[];
    drawnFeatures: DrawnFeature[];
    overlayLayers: OverlayLayerConfig[];
    measurements?: Measurement[];
    /**
     * When true, the persisted viewport (center/zoom/bearing/pitch) from
     * the snapshot is NOT written into the store. Used when an explicit
     * fit-bounds request is in effect for the current open cycle so the
     * project's stored viewport does not stomp the user's intent.
     */
    skipViewport?: boolean;
  }) => void;
  clearProjectContent: (next?: {
    viewport?: ViewportState;
    activeBaseLayer?: BaseLayerId;
  }) => void;
}

type PersistedMapExplorerState = Pick<
  MapExplorerState,
  | "center"
  | "zoom"
  | "bearing"
  | "pitch"
  | "activeBaseLayer"
  | "pins"
  | "bookmarks"
  | "annotations"
  | "annotationToolSettings"
  | "selectedFeatureIds"
  | "activeAoiId"
  | "activeAnalysisResultLayerIds"
  | "layoutPreferences"
>;

const noopMapExplorerStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function resolveMapExplorerStorage(): StateStorage {
  const storage = typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage;

  if (!storage) {
    return noopMapExplorerStorage;
  }

  try {
    const probeKey = "__synapse-map-explorer-storage-check__";
    storage.setItem(probeKey, probeKey);
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return noopMapExplorerStorage;
  }
}

/* ================================================================== */
/*  Viewport debounce helper                                           */
/* ================================================================== */

let _vpTimer: ReturnType<typeof setTimeout> | null = null;

function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

function normalizeCoordinate(value: [number, number], fallback: [number, number]): [number, number] {
  const longitude = Number(value[0]);
  const latitude = Number(value[1]);
  return [
    Number.isFinite(longitude) ? longitude : fallback[0],
    Number.isFinite(latitude) ? latitude : fallback[1],
  ];
}

function createMapEntityId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeBookmarkName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return (trimmed.length > 0 ? trimmed : fallback).slice(0, 80);
}

function normalizeMapBookmark(input: MapBookmarkInput, fallbackIndex: number): MapBookmark {
  return {
    id: input.id?.trim() || createMapEntityId("bookmark"),
    name: sanitizeBookmarkName(input.name, `View ${fallbackIndex + 1}`),
    center: normalizeCoordinate(input.center, DEFAULT_VIEWPORT.center),
    zoom: clampNumber(Number(input.zoom), 0, 24, DEFAULT_VIEWPORT.zoom),
    bearing: clampNumber(Number(input.bearing), -180, 180, DEFAULT_VIEWPORT.bearing),
    pitch: clampNumber(Number(input.pitch), 0, 85, DEFAULT_VIEWPORT.pitch),
    layers: Array.from(new Set(input.layers.filter((layerId) => layerId.trim().length > 0))),
    timestamp: input.timestamp ?? nowIsoTimestamp(),
    activeVisualization: input.activeVisualization ?? null,
  };
}

function normalizeAnnotationSettings(settings: Partial<MapAnnotationStyleSettings>): MapAnnotationStyleSettings {
  return {
    fontSize: clampNumber(Number(settings.fontSize), 12, 36, DEFAULT_ANNOTATION_SETTINGS.fontSize),
    color: typeof settings.color === "string" && settings.color.trim().length > 0
      ? settings.color
      : DEFAULT_ANNOTATION_SETTINGS.color,
    bold: settings.bold ?? DEFAULT_ANNOTATION_SETTINGS.bold,
    italic: settings.italic ?? DEFAULT_ANNOTATION_SETTINGS.italic,
    rotation: clampNumber(Number(settings.rotation), -180, 180, DEFAULT_ANNOTATION_SETTINGS.rotation),
    hasBackground: settings.hasBackground ?? DEFAULT_ANNOTATION_SETTINGS.hasBackground,
    leaderLine: settings.leaderLine ?? DEFAULT_ANNOTATION_SETTINGS.leaderLine,
  };
}

function normalizeMapAnnotation(input: MapAnnotationInput, fallbackIndex: number): MapAnnotation {
  const timestamp = input.createdAt ?? nowIsoTimestamp();
  const settings = normalizeAnnotationSettings(input.style);
  const coordinate = normalizeCoordinate(input.coordinate, DEFAULT_VIEWPORT.center);
  return {
    id: input.id?.trim() || createMapEntityId("annotation"),
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: coordinate,
    },
    properties: {
      ...settings,
      text: (input.text.trim() || `Annotation ${fallbackIndex + 1}`).slice(0, 240),
      createdAt: timestamp,
      updatedAt: input.updatedAt ?? timestamp,
      leaderTarget: input.leaderTarget ? normalizeCoordinate(input.leaderTarget, coordinate) : null,
    },
  };
}

function normalizePersistedAnnotation(annotation: MapAnnotation, fallbackIndex: number): MapAnnotation {
  const coordinate = Array.isArray(annotation.geometry?.coordinates) && annotation.geometry.coordinates.length >= 2
    ? normalizeCoordinate(annotation.geometry.coordinates as [number, number], DEFAULT_VIEWPORT.center)
    : DEFAULT_VIEWPORT.center;
  const input: MapAnnotationInput = {
    coordinate,
    text: typeof annotation.properties?.text === "string" ? annotation.properties.text : `Annotation ${fallbackIndex + 1}`,
    style: normalizeAnnotationSettings(annotation.properties ?? {}),
    leaderTarget: annotation.properties?.leaderTarget ?? null,
    createdAt: annotation.properties?.createdAt,
    updatedAt: annotation.properties?.updatedAt,
  };
  if (typeof annotation.id === "string") {
    input.id = annotation.id;
  }
  return normalizeMapAnnotation(input, fallbackIndex);
}

function normalizeLayoutPreferences(input: Partial<MapExplorerLayoutPreferences> | undefined): MapExplorerLayoutPreferences {
  return {
    layerPanelWidth: clampNumber(
      Number(input?.layerPanelWidth),
      MAP_NUMERIC.layerPanelWidth - 72,
      MAP_NUMERIC.layerPanelWidth + 200,
      DEFAULT_LAYOUT_PREFERENCES.layerPanelWidth,
    ),
    rightPanelWidth: clampNumber(
      Number(input?.rightPanelWidth),
      300,
      520,
      DEFAULT_LAYOUT_PREFERENCES.rightPanelWidth,
    ),
  };
}

function resolveOverlayLayerSourceKind(
  layer: OverlayLayerConfig,
  group: LayerGroupId,
): LayerSourceKind {
  if (layer.sourceKind) {
    return layer.sourceKind;
  }

  if (group === "analysis" || layer.metadata?.analysisResult) {
    return "derived";
  }

  if (layer.metadata?.datasetContext?.datasetId || layer.metadata?.eoSource?.isDemo) {
    return "demo";
  }

  if (layer.metadata?.eoSource || (typeof layer.sourceData === "string" && /^https?:\/\//i.test(layer.sourceData))) {
    return "external";
  }

  if (layer.sourceData) {
    return "imported";
  }

  return "project";
}

function resolveOverlayLayerQaStatus(layer: OverlayLayerConfig): LayerQaStatus {
  if (layer.qaStatus) {
    return layer.qaStatus;
  }

  if (layer.metadata?.analysisResult?.stale) {
    return "warning";
  }

  return "unchecked";
}

function resolveOverlayLayerProvenance(layer: OverlayLayerConfig): LayerProvenance | undefined {
  if (layer.provenance) {
    return layer.provenance;
  }

  const analysis = layer.metadata?.analysisResult;
  if (analysis) {
    return {
      label: `${analysis.engine} result`,
      method: analysis.parameterSummary,
      generatedAt: analysis.runTimestamp,
      ...(analysis.sourceLayerIds ? { sourceLayerIds: [...analysis.sourceLayerIds] } : {}),
      ...(analysis.runId ? { notes: [`run:${analysis.runId}`] } : {}),
    };
  }

  const dataset = layer.metadata?.datasetContext;
  if (dataset) {
    return {
      label: dataset.source ?? dataset.datasetTitle ?? dataset.datasetId ?? layer.name,
      ...(dataset.datasetTitle ? { sourceName: dataset.datasetTitle } : {}),
      ...(dataset.license ? { license: dataset.license } : {}),
      ...(dataset.updateDate ? { collectedAt: dataset.updateDate } : {}),
    };
  }

  const eoSource = layer.metadata?.eoSource;
  if (eoSource) {
    return {
      label: eoSource.provider,
      sourceName: eoSource.sourceRef,
      ...(eoSource.sourceUrl ? { sourceUrl: eoSource.sourceUrl } : {}),
      ...(eoSource.timeLabel ? { collectedAt: eoSource.timeLabel } : {}),
      notes: [eoSource.sourceKind],
    };
  }

  if (typeof layer.sourceData === "string") {
    return {
      label: layer.sourceData,
      sourceUrl: layer.sourceData,
    };
  }

  return undefined;
}

function buildOverlayLayerRegistryFields(
  layer: OverlayLayerConfig,
  group: LayerGroupId,
): Pick<OverlayLayerConfig, "sourceKind" | "qaStatus" | "queryable" | "provenance"> {
  const sourceKind = resolveOverlayLayerSourceKind(layer, group);
  const qaStatus = resolveOverlayLayerQaStatus(layer);
  const provenance = resolveOverlayLayerProvenance(layer) ?? { label: `${sourceKind} layer` };

  return {
    sourceKind,
    qaStatus,
    queryable: resolveOverlayLayerQueryable(layer),
    provenance,
  };
}

function normalizeOverlayLayerForStore(layer: OverlayLayerConfig): OverlayLayerConfig {
  const group = layer.group ?? "data";
  const timestamp = nowIsoTimestamp();
  const layerWithGroup: OverlayLayerConfig = { ...layer, group };
  const registryFields = buildOverlayLayerRegistryFields(layerWithGroup, group);

  if (group === "analysis") {
    if (!layer.metadata) {
      return {
        ...layerWithGroup,
        ...registryFields,
        group,
      };
    }

    const { analysisResult, ...metadata } = layer.metadata;
    return {
      ...layerWithGroup,
      ...registryFields,
      group,
      metadata: {
        ...metadata,
        updatedAt: layer.metadata.updatedAt ?? timestamp,
        ...(analysisResult
          ? {
              analysisResult: {
                ...analysisResult,
                stale: analysisResult.stale ?? false,
              },
            }
          : {}),
      },
    };
  }

  return {
    ...layerWithGroup,
    ...registryFields,
    group,
    metadata: {
      ...(layer.metadata ?? {}),
      updatedAt: timestamp,
      dataVersion: layer.metadata?.dataVersion ?? timestamp,
    },
  };
}

function detectLayerRegistryOperation(
  previousLayers: OverlayLayerConfig[],
  layers: OverlayLayerConfig[],
): { operation: MapLayerRegistryOperation; layerId?: string } {
  const previousIds = previousLayers.map((layer) => layer.id);
  const nextIds = layers.map((layer) => layer.id);
  const addedId = nextIds.find((id) => !previousIds.includes(id));
  const removedId = previousIds.find((id) => !nextIds.includes(id));

  if (addedId && !removedId) {
    return { operation: "add", layerId: addedId };
  }

  if (removedId && !addedId) {
    return { operation: "remove", layerId: removedId };
  }

  if (addedId || removedId || previousLayers.length !== layers.length) {
    return { operation: "replace" };
  }

  const previousById = new Map(previousLayers.map((layer) => [layer.id, layer]));
  const reordered = nextIds.some((id, index) => previousIds[index] !== id);
  if (reordered) {
    return { operation: "reorder" };
  }

  const visibilityChanged = layers.find((layer) => previousById.get(layer.id)?.visible !== layer.visible);
  if (visibilityChanged) {
    return { operation: "toggle", layerId: visibilityChanged.id };
  }

  const opacityChanged = layers.find((layer) => previousById.get(layer.id)?.opacity !== layer.opacity);
  if (opacityChanged) {
    return { operation: "opacity", layerId: opacityChanged.id };
  }

  return { operation: "update" };
}

function emitMapLayerRegistryChange(
  previousLayers: OverlayLayerConfig[],
  layers: OverlayLayerConfig[],
): void {
  if (typeof globalThis.CustomEvent !== "function" || typeof globalThis.dispatchEvent !== "function") {
    return;
  }

  const { operation, layerId } = detectLayerRegistryOperation(previousLayers, layers);
  const detail: MapLayerRegistryChangeDetail = {
    operation,
    layers: layers.map(summarizeOverlayLayer),
    previousLayers: previousLayers.map(summarizeOverlayLayer),
    timestamp: nowIsoTimestamp(),
    ...(layerId ? { layerId } : {}),
  };

  globalThis.dispatchEvent(new CustomEvent(MAP_LAYER_REGISTRY_EVENT, { detail }));
}

function markDependentAnalysisLayersStale(
  layers: OverlayLayerConfig[],
  sourceLayerId: string,
  sourceDataVersion?: string,
): OverlayLayerConfig[] {
  return layers.map((layer) => {
    const analysisResult = layer.metadata?.analysisResult;
    if (!analysisResult?.sourceLayerIds?.includes(sourceLayerId)) {
      return layer;
    }

    const shouldMarkStale =
      sourceDataVersion == null ||
      !analysisResult.sourceDataVersion ||
      analysisResult.sourceDataVersion !== sourceDataVersion;

    if (!shouldMarkStale || analysisResult.stale) {
      return layer;
    }

    return {
      ...layer,
      metadata: {
        ...(layer.metadata ?? {}),
        analysisResult: {
          ...analysisResult,
          stale: true,
        },
      },
    };
  });
}

function applyScientificQAMetadataToLayers(
  layers: OverlayLayerConfig[],
  qa: MapScientificQAState | null,
): OverlayLayerConfig[] {
  if (!qa) {
    return layers.map((layer) => {
      if (!layer.metadata?.scientificQA && layer.qaStatus !== "passed" && layer.qaStatus !== "warning" && layer.qaStatus !== "error") {
        return layer;
      }
      const { scientificQA: _scientificQA, ...metadata } = layer.metadata ?? {};
      void _scientificQA;
      return {
        ...layer,
        qaStatus: layer.metadata?.analysisResult?.stale ? "warning" : "unchecked",
        metadata,
      };
    });
  }

  const summaryByLayerId = new Map(qa.layerSummaries.map((summary) => [summary.layerId, summary]));
  return layers.map((layer) => {
    const summary = summaryByLayerId.get(layer.id);
    if (!summary) {
      return layer;
    }

    const current = layer.metadata?.scientificQA;
    if (
      layer.qaStatus === summary.status &&
      current?.signature === summary.metadata.signature &&
      current?.status === summary.metadata.status &&
      current?.issueIds.join("|") === summary.metadata.issueIds.join("|") &&
      current?.badges.join("|") === summary.metadata.badges.join("|")
    ) {
      return layer;
    }

    return {
      ...layer,
      qaStatus: summary.status,
      metadata: {
        ...(layer.metadata ?? {}),
        scientificQA: summary.metadata,
      },
    };
  });
}

function debouncedSetViewport(
  setter: (fn: (s: MapExplorerState) => Partial<MapExplorerState>) => void,
  patch: Partial<ViewportState>,
): void {
  if (_vpTimer) clearTimeout(_vpTimer);
  _vpTimer = setTimeout(() => {
    setter(() => ({ ...patch }));
    _vpTimer = null;
  }, 250);
}

function countPendingCopilotActions(proposals: MapCopilotActionProposal[]): number {
  return proposals.filter((proposal) => proposal.status === "proposed" || proposal.status === "preview").length;
}

function createCopilotAuditEntry(
  proposalId: string,
  action: MapCopilotActionStatus,
): MapCopilotAuditEntry {
  const timestamp = nowIsoTimestamp();
  return {
    id: `copilot-audit-${timestamp}-${proposalId}`,
    proposalId,
    action,
    timestamp,
  };
}

/* ================================================================== */
/*  Store                                                              */
/* ================================================================== */

export const useMapExplorerStore = create<MapExplorerState>()(
  persist<MapExplorerState, [], [], PersistedMapExplorerState>(
    (set, get) => ({
      /* --- Visibility --- */
      isOpen: false,
      /* Opening the modal also force-clears any tool state that could have
         been left stuck (e.g. by HMR, a thrown error mid-drag, or a previous
         session). Without this reset, an `activeDrawTool` or `activeTool`
         left non-null prevents MapLibre's pan/zoom handlers from running. */
      open: () =>
        set({
          isOpen: true,
          activeTool: null,
          activeDrawTool: null,
          activeMeasureTool: null,
          selectedFeatureId: null,
          selectedAnnotationId: null,
        }),
      close: () => set({ isOpen: false, lastExplicitFitRequest: null }),
      toggle: () => set((s: MapExplorerState) => ({ isOpen: !s.isOpen })),

      /* --- Viewport --- */
      ...DEFAULT_VIEWPORT,
      setViewport: (v: Partial<ViewportState>) => debouncedSetViewport(set, v),
      applyImmediateViewport: (v: Partial<ViewportState>) => {
        if (_vpTimer) {
          clearTimeout(_vpTimer);
          _vpTimer = null;
        }
        set(() => ({ ...v }));
      },

      /* --- Pending fit-bounds request --- */
      pendingFitBounds: null as PendingFitBoundsRequest | null,
      lastExplicitFitRequest: null as PendingFitBoundsRequest | null,
      requestFitBounds: (input: PendingFitBoundsRequestInput) => {
        const requestedAt = nowIsoTimestamp();
        const requestId = createMapEntityId("fitbounds-req");
        const request: PendingFitBoundsRequest = input.aoiId
          ? {
              bounds: [...input.bounds] as [number, number, number, number],
              source: input.source,
              aoiId: input.aoiId,
              requestId,
              requestedAt,
            }
          : {
              bounds: [...input.bounds] as [number, number, number, number],
              source: input.source,
              requestId,
              requestedAt,
            };
        set({ pendingFitBounds: request, lastExplicitFitRequest: request });
        return request;
      },
      consumePendingFitBounds: () => {
        const current = get().pendingFitBounds;
        if (!current) return null;
        set({ pendingFitBounds: null });
        return current;
      },
      clearLastExplicitFitRequest: () => {
        if (get().lastExplicitFitRequest) {
          set({ lastExplicitFitRequest: null });
        }
      },

      /* --- Base layer --- */
      activeBaseLayer: "dark" as BaseLayerId,
      setBaseLayer: (layer: BaseLayerId) => set({ activeBaseLayer: layer }),

      /* --- Pins --- */
      pins: [] as MapPin[],
      addPin: (pin: MapPin) => set((s: MapExplorerState) => ({ pins: [...s.pins, pin] })),
      removePin: (id: string) =>
        set((s: MapExplorerState) => ({ pins: s.pins.filter((p) => p.id !== id) })),
      updatePin: (id: string, patch: Partial<Omit<MapPin, "id">>) =>
        set((s: MapExplorerState) => ({
          pins: s.pins.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      clearPins: () => set({ pins: [] }),
      replacePins: (pins: MapPin[]) => set({ pins: [...pins] }),

      /* --- Bookmarks --- */
      bookmarks: [] as MapBookmark[],
      addMapBookmark: (bookmark: MapBookmarkInput) => {
        const current = get();
        const normalizedBookmark = normalizeMapBookmark(bookmark, current.bookmarks.length);
        const existingIndex = current.bookmarks.findIndex((entry) => entry.id === normalizedBookmark.id);
        if (existingIndex === -1 && current.bookmarks.length >= MAP_BOOKMARK_LIMIT) {
          return null;
        }

        set((state: MapExplorerState) => ({
          bookmarks: existingIndex === -1
            ? [...state.bookmarks, normalizedBookmark]
            : state.bookmarks.map((entry) => entry.id === normalizedBookmark.id ? normalizedBookmark : entry),
        }));
        return normalizedBookmark;
      },
      renameMapBookmark: (id: string, name: string) =>
        set((state: MapExplorerState) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.id === id
              ? { ...bookmark, name: sanitizeBookmarkName(name, bookmark.name), timestamp: nowIsoTimestamp() }
              : bookmark,
          ),
        })),
      removeMapBookmark: (id: string) =>
        set((state: MapExplorerState) => ({
          bookmarks: state.bookmarks.filter((bookmark) => bookmark.id !== id),
        })),
      restoreMapBookmark: (id: string) => {
        const bookmark = get().bookmarks.find((entry) => entry.id === id) ?? null;
        if (!bookmark) {
          return null;
        }

        if (_vpTimer) {
          clearTimeout(_vpTimer);
          _vpTimer = null;
        }

        const visibleLayerIds = new Set(bookmark.layers);
        set((state: MapExplorerState) => ({
          center: [...bookmark.center] as [number, number],
          zoom: bookmark.zoom,
          bearing: bookmark.bearing,
          pitch: bookmark.pitch,
          overlayLayers: state.overlayLayers.map((layer) => ({
            ...layer,
            visible: visibleLayerIds.has(layer.id),
          })),
          activeAnalysisResultLayerIds: bookmark.activeVisualization ? [bookmark.activeVisualization] : [],
        }));
        return bookmark;
      },
      replaceMapBookmarks: (bookmarks: MapBookmark[]) =>
        set({
          bookmarks: bookmarks
            .slice(0, MAP_BOOKMARK_LIMIT)
            .map((bookmark, index) => normalizeMapBookmark(bookmark, index)),
        }),
      clearMapBookmarks: () => set({ bookmarks: [] }),

      /* --- Annotations --- */
      annotations: [] as MapAnnotation[],
      annotationToolSettings: DEFAULT_ANNOTATION_SETTINGS,
      selectedAnnotationId: null,
      setAnnotationToolSettings: (settings: Partial<MapAnnotationStyleSettings>) =>
        set((state: MapExplorerState) => ({
          annotationToolSettings: normalizeAnnotationSettings({
            ...state.annotationToolSettings,
            ...settings,
          }),
        })),
      addMapAnnotation: (annotation: MapAnnotationInput) => {
        const current = get();
        const normalizedAnnotation = normalizeMapAnnotation(annotation, current.annotations.length);
        const existingIndex = current.annotations.findIndex((entry) => entry.id === normalizedAnnotation.id);
        if (existingIndex === -1 && current.annotations.length >= MAP_ANNOTATION_LIMIT) {
          return null;
        }

        set((state: MapExplorerState) => ({
          annotations: existingIndex === -1
            ? [...state.annotations, normalizedAnnotation]
            : state.annotations.map((entry) => entry.id === normalizedAnnotation.id ? normalizedAnnotation : entry),
          selectedAnnotationId: normalizedAnnotation.id,
        }));
        return normalizedAnnotation;
      },
      updateMapAnnotation: (id, patch) =>
        set((state: MapExplorerState) => ({
          annotations: state.annotations.map((annotation) => {
            if (annotation.id !== id) {
              return annotation;
            }
            const nextProperties = patch.properties
              ? {
                  ...annotation.properties,
                  ...patch.properties,
                  ...normalizeAnnotationSettings({
                    ...annotation.properties,
                    ...patch.properties,
                  }),
                  text: (patch.properties.text ?? annotation.properties.text).slice(0, 240),
                  updatedAt: nowIsoTimestamp(),
                }
              : annotation.properties;
            return {
              ...annotation,
              ...(patch.geometry ? { geometry: patch.geometry } : {}),
              properties: nextProperties,
            };
          }),
        })),
      moveMapAnnotation: (id: string, coordinate: [number, number]) =>
        set((state: MapExplorerState) => ({
          annotations: state.annotations.map((annotation) =>
            annotation.id === id
              ? {
                  ...annotation,
                  geometry: { type: "Point", coordinates: normalizeCoordinate(coordinate, annotation.geometry.coordinates as [number, number]) },
                  properties: { ...annotation.properties, updatedAt: nowIsoTimestamp() },
                }
              : annotation,
          ),
        })),
      removeMapAnnotation: (id: string) =>
        set((state: MapExplorerState) => ({
          annotations: state.annotations.filter((annotation) => annotation.id !== id),
          selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
        })),
      setSelectedAnnotationId: (id: string | null) => set({ selectedAnnotationId: id }),
      replaceMapAnnotations: (annotations: MapAnnotation[]) =>
        set({
          annotations: annotations
            .slice(0, MAP_ANNOTATION_LIMIT)
            .map((annotation, index) => normalizePersistedAnnotation(annotation, index)),
          selectedAnnotationId: null,
        }),
      clearMapAnnotations: () => set({ annotations: [], selectedAnnotationId: null }),

      /* --- Active tool --- */
      activeTool: null as MapToolId,
      setActiveTool: (tool: MapToolId) => set({ activeTool: tool }),

      /* --- Layout preferences --- */
      layoutPreferences: DEFAULT_LAYOUT_PREFERENCES,
      setLayoutPreferences: (patch: Partial<MapExplorerLayoutPreferences>) =>
        set((state: MapExplorerState) => ({
          layoutPreferences: normalizeLayoutPreferences({
            ...state.layoutPreferences,
            ...patch,
          }),
        })),

      /* --- Overlay layers --- */
      overlayLayers: [] as OverlayLayerConfig[],
      addOverlayLayer: (layer: OverlayLayerConfig) =>
        set((s: MapExplorerState) => {
          const normalizedLayer = normalizeOverlayLayerForStore(layer);
          const existingIndex = s.overlayLayers.findIndex((entry) => entry.id === normalizedLayer.id);
          let overlayLayers =
            existingIndex === -1
              ? [...s.overlayLayers, normalizedLayer]
              : s.overlayLayers.map((entry, index) => (index === existingIndex ? normalizedLayer : entry));

          if (normalizedLayer.group !== "analysis") {
            overlayLayers = markDependentAnalysisLayersStale(
              overlayLayers,
              normalizedLayer.id,
              normalizedLayer.metadata?.dataVersion,
            );
          }

          return { overlayLayers };
        }),
      removeOverlayLayer: (id: string) =>
        set((s: MapExplorerState) => {
          const removedLayer = s.overlayLayers.find((layer) => layer.id === id);
          let overlayLayers = s.overlayLayers.filter((layer) => layer.id !== id);

          if (removedLayer && (removedLayer.group ?? "data") !== "analysis") {
            overlayLayers = markDependentAnalysisLayersStale(
              overlayLayers,
              removedLayer.id,
              undefined,
            );
          }

          return {
            overlayLayers,
          };
        }),
      toggleLayerVisibility: (id: string) =>
        set((s: MapExplorerState) => ({
          overlayLayers: s.overlayLayers.map((l) =>
            l.id === id ? { ...l, visible: !l.visible } : l,
          ),
        })),
      setLayerOpacity: (id: string, opacity: number) =>
        set((s: MapExplorerState) => ({
          overlayLayers: s.overlayLayers.map((l) =>
            l.id === id ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l,
          ),
        })),
      updateLayerMetadata: (id: string, patch: Partial<OverlayLayerConfig>) =>
        set((s: MapExplorerState) => ({
          overlayLayers: s.overlayLayers.map((l) =>
            l.id === id ? { ...l, ...patch } : l,
          ),
        })),
      reorderLayers: (orderedIds: string[]) =>
        set((s: MapExplorerState) => {
          const byId = new Map(s.overlayLayers.map((l) => [l.id, l]));
          const reordered = orderedIds
            .map((id) => byId.get(id))
            .filter((l): l is OverlayLayerConfig => l !== undefined);
          return { overlayLayers: reordered };
        }),
      replaceOverlayLayers: (layers: OverlayLayerConfig[]) =>
        set({ overlayLayers: layers.map((layer) => normalizeOverlayLayerForStore(layer)) }),
      scientificQA: null,
      setScientificQA: (qa: MapScientificQAState | null) =>
        set((state: MapExplorerState) => {
          if (state.scientificQA?.metadata.signature === qa?.metadata.signature) {
            return {};
          }
          return {
            scientificQA: qa,
            overlayLayers: applyScientificQAMetadataToLayers(state.overlayLayers, qa),
          };
        }),
      currentMapBounds: null,
      currentMapBoundsUpdatedAt: null,
      setCurrentMapBounds: (bounds) =>
        set({
          currentMapBounds: bounds,
          currentMapBoundsUpdatedAt: bounds ? nowIsoTimestamp() : null,
        }),

      /* --- Map evidence artifact registry --- */
      mapEvidenceArtifacts: [] as MapEvidenceArtifact[],
      registerMapEvidenceArtifact: (draft: MapEvidenceArtifactDraft) => {
        const artifact = createMapEvidenceArtifact(draft);
        set((state: MapExplorerState) => ({
          mapEvidenceArtifacts: upsertMapEvidenceArtifactInRegistry(state.mapEvidenceArtifacts, artifact),
        }));
        return artifact;
      },
      upsertMapEvidenceArtifact: (artifact: MapEvidenceArtifact) => {
        set((state: MapExplorerState) => ({
          mapEvidenceArtifacts: upsertMapEvidenceArtifactInRegistry(state.mapEvidenceArtifacts, artifact),
        }));
        return artifact;
      },
      updateMapEvidenceArtifact: (artifactId: string, patch: MapEvidenceArtifactUpdate) => {
        let updated: MapEvidenceArtifact | null = null;
        set((state: MapExplorerState) => ({
          mapEvidenceArtifacts: state.mapEvidenceArtifacts.map((artifact) => {
            if (artifact.id !== artifactId && artifact.artifactId !== artifactId) return artifact;
            updated = patchMapEvidenceArtifact(artifact, patch);
            return updated;
          }),
        }));
        return updated;
      },
      clearMapEvidenceArtifacts: () => set({ mapEvidenceArtifacts: [] }),

      /* --- Selection metadata --- */
      selectedFeatureIds: {} as Record<string, string[]>,
      activeAoiId: undefined,
      activeAnalysisResultLayerIds: [] as string[],
      setSelectedFeatures: (layerId: string, featureIds: string[]) =>
        set((s: MapExplorerState) => {
          if (featureIds.length === 0) {
            const { [layerId]: _omit, ...rest } = s.selectedFeatureIds;
            void _omit;
            return { selectedFeatureIds: rest };
          }
          return {
            selectedFeatureIds: {
              ...s.selectedFeatureIds,
              [layerId]: [...featureIds],
            },
          };
        }),
      clearSelectedFeatures: (layerId?: string) =>
        set((s: MapExplorerState) => {
          if (layerId === undefined) {
            return { selectedFeatureIds: {} };
          }
          const { [layerId]: _omit, ...rest } = s.selectedFeatureIds;
          void _omit;
          return { selectedFeatureIds: rest };
        }),
      setActiveAoi: (id: string | undefined) => set({ activeAoiId: id }),
      setActiveAnalysisResultLayers: (ids: string[]) =>
        set({ activeAnalysisResultLayerIds: [...ids] }),

      /* --- Copilot context/action metadata --- */
      lastContextSnapshotId: undefined,
      lastCopilotContextSnapshot: null,
      copilotActionProposals: [] as MapCopilotActionProposal[],
      copilotAuditTrail: [] as MapCopilotAuditEntry[],
      pendingCopilotActionCount: 0,
      emitCopilotContextSnapshot: (snapshot: MapCopilotContextSnapshotInput) =>
        set({
          lastContextSnapshotId: snapshot.snapshotId,
          lastCopilotContextSnapshot: { ...snapshot },
        }),
      queueCopilotActionProposal: (proposal: MapCopilotActionProposalInput) =>
        set((state: MapExplorerState) => {
          const queuedAt = nowIsoTimestamp();
          const nextProposal: MapCopilotActionProposal = {
            ...proposal,
            status: "proposed",
            queuedAt,
          };
          const exists = state.copilotActionProposals.some((entry) => entry.id === proposal.id);
          const copilotActionProposals = exists
            ? state.copilotActionProposals.map((entry) => entry.id === proposal.id ? nextProposal : entry)
            : [...state.copilotActionProposals, nextProposal];
          return {
            copilotActionProposals,
            pendingCopilotActionCount: countPendingCopilotActions(copilotActionProposals),
          };
        }),
      previewCopilotActionProposal: (id: string) =>
        set((state: MapExplorerState) => {
          const timestamp = nowIsoTimestamp();
          const copilotActionProposals = state.copilotActionProposals.map((proposal) =>
            proposal.id === id && proposal.status === "proposed"
              ? { ...proposal, status: "preview" as const, previewedAt: timestamp }
              : proposal,
          );
          return {
            copilotActionProposals,
            pendingCopilotActionCount: countPendingCopilotActions(copilotActionProposals),
          };
        }),
      applyCopilotActionProposal: (id: string) =>
        set((state: MapExplorerState) => {
          const timestamp = nowIsoTimestamp();
          const copilotActionProposals = state.copilotActionProposals.map((proposal) =>
            proposal.id === id && proposal.status !== "applied"
              ? { ...proposal, status: "applied" as const, appliedAt: timestamp }
              : proposal,
          );
          return {
            copilotActionProposals,
            copilotAuditTrail: [...state.copilotAuditTrail, createCopilotAuditEntry(id, "applied")],
            pendingCopilotActionCount: countPendingCopilotActions(copilotActionProposals),
          };
        }),
      rejectCopilotActionProposal: (id: string) =>
        set((state: MapExplorerState) => {
          const timestamp = nowIsoTimestamp();
          const copilotActionProposals = state.copilotActionProposals.map((proposal) =>
            proposal.id === id && proposal.status !== "rejected"
              ? { ...proposal, status: "rejected" as const, rejectedAt: timestamp }
              : proposal,
          );
          return {
            copilotActionProposals,
            copilotAuditTrail: [...state.copilotAuditTrail, createCopilotAuditEntry(id, "rejected")],
            pendingCopilotActionCount: countPendingCopilotActions(copilotActionProposals),
          };
        }),

      /* --- Collaborative review session metadata --- */
      reviewSession: createMapReviewSession(),
      addMapReviewEvent: (event: MapReviewTimelineEventInput) =>
        set((state: MapExplorerState) => ({
          reviewSession: appendMapReviewEvent(state.reviewSession, event),
        })),
      updateMapReviewEventStatus: (eventId: string, status: MapReviewTimelineEventStatus, outcome?: string) =>
        set((state: MapExplorerState) => ({
          reviewSession: updateMapReviewEventStatusInSession(
            state.reviewSession,
            eventId,
            status,
            outcome ? { outcome } : {},
          ),
        })),
      clearMapReviewSession: (input?: MapReviewSessionInput) =>
        set({ reviewSession: createMapReviewSession(input) }),

      /* --- Drawing --- */
      activeDrawTool: null as DrawToolId | null,
      setActiveDrawTool: (tool: DrawToolId | null) => set({ activeDrawTool: tool }),
      drawnFeatures: [] as DrawnFeature[],
      addDrawnFeature: (feature: DrawnFeature) =>
        set((s: MapExplorerState) => {
          const drawnFeatures = [...s.drawnFeatures, feature];
          return {
            drawnFeatures,
            activeAoiId: isAoiFeature(feature)
              ? feature.id
              : resolveActiveAoiId(drawnFeatures, s.activeAoiId),
          };
        }),
      removeDrawnFeature: (id: string) =>
        set((s: MapExplorerState) => {
          const drawnFeatures = s.drawnFeatures.filter((f) => f.id !== id);
          return {
            drawnFeatures,
            activeAoiId: resolveActiveAoiId(
              drawnFeatures,
              s.activeAoiId === id ? undefined : s.activeAoiId,
            ),
            selectedFeatureId: s.selectedFeatureId === id ? null : s.selectedFeatureId,
          };
        }),
      updateDrawnFeature: (id: string, patch: Partial<DrawnFeature>) =>
        set((s: MapExplorerState) => {
          const drawnFeatures = s.drawnFeatures.map((f) =>
            f.id === id ? { ...f, ...patch } : f,
          );
          const updated = drawnFeatures.find((feature) => feature.id === id);
          const preferredId = updated && isAoiFeature(updated) && !s.activeAoiId
            ? id
            : s.activeAoiId;
          return {
            drawnFeatures,
            activeAoiId: resolveActiveAoiId(drawnFeatures, preferredId),
          };
        }),
      clearDrawnFeatures: () => set({ drawnFeatures: [], activeAoiId: undefined, selectedFeatureId: null }),
      replaceDrawnFeatures: (features: DrawnFeature[]) =>
        set({
          drawnFeatures: [...features],
          activeAoiId: resolveActiveAoiId(features),
          selectedFeatureId: null,
        }),
      selectedFeatureId: null as string | null,
      setSelectedFeatureId: (id: string | null) => set({ selectedFeatureId: id }),
      getAoi: (): DrawnFeature | null => {
        const { activeAoiId, drawnFeatures } = get();
        const activeAoi = activeAoiId
          ? drawnFeatures.find((feature: DrawnFeature) => feature.id === activeAoiId && isAoiFeature(feature))
          : undefined;
        return (
          activeAoi ?? drawnFeatures.find((feature: DrawnFeature) => isAoiFeature(feature)) ?? null
        );
      },

      /* --- Temporal player --- */
      currentTimestep: 0,
      isPlaying: false,
      playbackSpeed: 1 as PlaybackSpeed,
      timeRange: { start: 0, end: 0 } as TemporalTimeRange,
      setCurrentTimestep: (step: number) => set({ currentTimestep: step }),
      setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
      setPlaybackSpeed: (speed: PlaybackSpeed) => set({ playbackSpeed: speed }),
      setTimeRange: (range: TemporalTimeRange) => set({ timeRange: range }),

      /* --- Measurement --- */
      activeMeasureTool: null as MeasureToolId | null,
      setActiveMeasureTool: (tool: MeasureToolId | null) => set({ activeMeasureTool: tool }),
      measureUnit: "metric" as MeasureUnit,
      setMeasureUnit: (unit: MeasureUnit) => set({ measureUnit: unit }),
      measurements: [] as Measurement[],
      addMeasurement: (m: Measurement) =>
        set((s: MapExplorerState) => ({ measurements: [...s.measurements, m] })),
      removeMeasurement: (id: string) =>
        set((s: MapExplorerState) => ({
          measurements: s.measurements.filter((m) => m.id !== id),
        })),
      clearMeasurements: () => set({ measurements: [] }),
      restoreProjectState: ({
        viewport,
        activeBaseLayer,
        pins,
        bookmarks = [],
        annotations = [],
        drawnFeatures,
        overlayLayers,
        measurements,
        skipViewport = false,
      }: Parameters<MapExplorerState["restoreProjectState"]>[0]) =>
        set(() => {
          if (_vpTimer) {
            clearTimeout(_vpTimer);
            _vpTimer = null;
          }

          const viewportPatch = skipViewport
            ? {}
            : {
                center: [...viewport.center] as [number, number],
                zoom: viewport.zoom,
                bearing: viewport.bearing,
                pitch: viewport.pitch,
              };

          return {
            ...viewportPatch,
            activeBaseLayer,
            pins: [...pins],
            bookmarks: bookmarks
              .slice(0, MAP_BOOKMARK_LIMIT)
              .map((bookmark, index) => normalizeMapBookmark(bookmark, index)),
            annotations: annotations
              .slice(0, MAP_ANNOTATION_LIMIT)
              .map((annotation, index) => normalizePersistedAnnotation(annotation, index)),
            overlayLayers: overlayLayers.map((layer) => normalizeOverlayLayerForStore(layer)),
            scientificQA: null,
            currentMapBounds: null,
            currentMapBoundsUpdatedAt: null,
            mapEvidenceArtifacts: [],
            selectedFeatureIds: {},
            activeAoiId: resolveActiveAoiId(drawnFeatures),
            activeAnalysisResultLayerIds: [],
            lastContextSnapshotId: undefined,
            lastCopilotContextSnapshot: null,
            copilotActionProposals: [],
            copilotAuditTrail: [],
            pendingCopilotActionCount: 0,
            reviewSession: createMapReviewSession({ title: "Restored project map review session" }),
            drawnFeatures: [...drawnFeatures],
            measurements: measurements ? [...measurements] : [],
            selectedFeatureId: null,
            selectedAnnotationId: null,
            activeTool: null,
            activeDrawTool: null,
            activeMeasureTool: null,
          };
        }),
      clearProjectContent: (next?: Parameters<MapExplorerState["clearProjectContent"]>[0]) =>
        set(() => {
          if (_vpTimer) {
            clearTimeout(_vpTimer);
            _vpTimer = null;
          }

          return {
            center: next?.viewport ? [...next.viewport.center] as [number, number] : [...DEFAULT_VIEWPORT.center],
            zoom: next?.viewport?.zoom ?? DEFAULT_VIEWPORT.zoom,
            bearing: next?.viewport?.bearing ?? DEFAULT_VIEWPORT.bearing,
            pitch: next?.viewport?.pitch ?? DEFAULT_VIEWPORT.pitch,
            activeBaseLayer: next?.activeBaseLayer ?? "dark",
            pins: [],
            bookmarks: [],
            annotations: [],
            overlayLayers: [],
            scientificQA: null,
            currentMapBounds: null,
            currentMapBoundsUpdatedAt: null,
            mapEvidenceArtifacts: [],
            selectedFeatureIds: {},
            activeAoiId: undefined,
            activeAnalysisResultLayerIds: [],
            lastContextSnapshotId: undefined,
            lastCopilotContextSnapshot: null,
            copilotActionProposals: [],
            copilotAuditTrail: [],
            pendingCopilotActionCount: 0,
            reviewSession: createMapReviewSession({ title: "Map review session" }),
            drawnFeatures: [],
            measurements: [],
            selectedFeatureId: null,
            selectedAnnotationId: null,
            activeTool: null,
            activeDrawTool: null,
            activeMeasureTool: null,
          };
        }),
    }),
    {
      name: "synapse-map-explorer",
      storage: createJSONStorage<PersistedMapExplorerState>(() => resolveMapExplorerStorage()),
      partialize: (state) => ({
        center: state.center,
        zoom: state.zoom,
        bearing: state.bearing,
        pitch: state.pitch,
        activeBaseLayer: state.activeBaseLayer,
        pins: state.pins,
        bookmarks: state.bookmarks,
        annotations: state.annotations,
        annotationToolSettings: state.annotationToolSettings,
        selectedFeatureIds: state.selectedFeatureIds,
        activeAoiId: state.activeAoiId,
        activeAnalysisResultLayerIds: state.activeAnalysisResultLayerIds,
        layoutPreferences: normalizeLayoutPreferences(state.layoutPreferences),
      }),
    },
  ),
);

useMapExplorerStore.subscribe((state, previousState) => {
  if (state.overlayLayers !== previousState.overlayLayers) {
    emitMapLayerRegistryChange(previousState.overlayLayers, state.overlayLayers);
  }
});

export function selectMapEvidenceArtifacts(state: MapExplorerState): MapEvidenceArtifact[] {
  return state.mapEvidenceArtifacts;
}

export function selectMapEvidenceArtifactsForLayer(layerId: string | null | undefined) {
  return (state: MapExplorerState): MapEvidenceArtifact[] =>
    filterMapEvidenceArtifactsByLayer(state.mapEvidenceArtifacts, layerId);
}

export function selectMapEvidenceArtifactsForAoi(aoiId: string | null | undefined) {
  return (state: MapExplorerState): MapEvidenceArtifact[] =>
    filterMapEvidenceArtifactsByAoi(state.mapEvidenceArtifacts, aoiId);
}

export function selectMapEvidenceArtifactsForWorkflow(workflowId: string | null | undefined) {
  return (state: MapExplorerState): MapEvidenceArtifact[] =>
    filterMapEvidenceArtifactsByWorkflow(state.mapEvidenceArtifacts, workflowId);
}

export function selectMapEvidenceArtifactsForSource(sourceModule: MapEvidenceArtifact["sourceModule"]) {
  return (state: MapExplorerState): MapEvidenceArtifact[] =>
    filterMapEvidenceArtifactsBySource(state.mapEvidenceArtifacts, sourceModule);
}

export function useMapEvidenceArtifacts(): MapEvidenceArtifact[] {
  return useMapExplorerStore(selectMapEvidenceArtifacts);
}

export function useMapEvidenceArtifactsByLayer(layerId: string | null | undefined): MapEvidenceArtifact[] {
  return useMapExplorerStore(selectMapEvidenceArtifactsForLayer(layerId));
}

export function useMapEvidenceArtifactsByAoi(aoiId: string | null | undefined): MapEvidenceArtifact[] {
  return useMapExplorerStore(selectMapEvidenceArtifactsForAoi(aoiId));
}

export function useMapEvidenceArtifactsByWorkflow(workflowId: string | null | undefined): MapEvidenceArtifact[] {
  return useMapExplorerStore(selectMapEvidenceArtifactsForWorkflow(workflowId));
}

export function useMapEvidenceArtifactsBySource(
  sourceModule: MapEvidenceArtifact["sourceModule"],
): MapEvidenceArtifact[] {
  return useMapExplorerStore(selectMapEvidenceArtifactsForSource(sourceModule));
}
