/* ================================================================== */
/*  MapWorkflowService                                                 */
/*                                                                     */
/*  Prompt 31 — AOI, Selection, Buffer & Comparison Workflows.        */
/*                                                                     */
/*  Provides explicit, scientific, transparent guided workflows for:  */
/*                                                                    */
/*    - AOI creation (viewport, drawn polygon, selected features,    */
/*      geocoded place, Urban study area)                            */
/*    - Buffer (geodesic, metric / imperial)                         */
/*    - Intersection of two polygon layers                           */
/*    - Difference (A − B) and Union for scenario comparison         */
/*    - Comparison view state (split, swipe, opacity blend)          */
/*                                                                   */
/*  All operations:                                                  */
/*    - return previews before commit (no map mutation)              */
/*    - emit derived OverlayLayerConfig with provenance + QA status  */
/*    - validate inputs and surface explicit blockers/warnings       */
/*    - generate suggestions as explicit actions, never mutations    */
/*    - are pure, deterministic, and worker-safe                     */
/* ================================================================== */

import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";
import * as turf from "@turf/turf";
import type { CrsPreflightResult, CrsRemedy } from "@/services/map/contracts/gisContracts";
import type {
  LayerMetadata,
  LayerProvenance,
  LayerQaStatus,
  LayerScientificQAMetadata,
  LayerSourceKind,
  MapReproducibilityExpectedOutput,
  MapReproducibilityLayerReference,
  MapReproducibilityManifest,
  MapReproducibilityQASummary,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import {
  buildFeatureCollectionMetadata,
  getFeatureCollectionBounds,
} from "./MapDataImporter";
import {
  preflight as preflightCrs,
  type CrsPreflightLayer,
  type CrsPreflightMetric,
  type CrsPreflightOperation,
} from "./crs/CrsPreflight";
import {
  computeBuffer,
  computeDifference,
  computeIntersect,
  computeUnion,
  mergePolygons,
  type GeometryWorkflowComputation,
  type GeometryWorkflowParams,
  type GeometryWorkflowRequest,
} from "./geometry/GeometryWorkflowEngine";
import {
  summarizeDrawnGeometryValidation,
  validateDrawnGeometry,
} from "./DrawnGeometryValidation";

/* ================================================================== */
/*  Versioning & constants                                             */
/* ================================================================== */

export const MAP_WORKFLOW_SERVICE_VERSION = 1;

export const MAP_WORKFLOW_MANIFEST_VERSION = 1;

/** Threshold above which large datasets should be processed in a worker. */
export const MAP_WORKFLOW_WORKER_FEATURE_THRESHOLD = 5_000;

/**
 * Upper bound on features the main-thread preview computes. Above the worker
 * threshold the on-map preview is computed from the first N features only so
 * the drawer stays responsive; the full result is produced in the worker via
 * `executeMapWorkflow`.
 */
export const MAP_WORKFLOW_PREVIEW_SAMPLE_LIMIT = 1_500;

interface BoundedPreviewSource {
  source: FeatureCollection;
  sampled: boolean;
  fullCount: number;
}

/** Cap the source the main-thread preview computes on, returning the full count. */
function boundPreviewSource(source: FeatureCollection): BoundedPreviewSource {
  const fullCount = source.features.length;
  if (fullCount <= MAP_WORKFLOW_PREVIEW_SAMPLE_LIMIT) {
    return { source, sampled: false, fullCount };
  }
  return {
    source: { type: "FeatureCollection", features: source.features.slice(0, MAP_WORKFLOW_PREVIEW_SAMPLE_LIMIT) },
    sampled: true,
    fullCount,
  };
}

export const MAP_WORKFLOW_BUFFER_MIN_DISTANCE = 0;
/** Hard upper bound on buffer distance (≈ Earth half-circumference; 20 000 km). */
export const MAP_WORKFLOW_BUFFER_MAX_METERS = 2.0e7;

/* ================================================================== */
/*  Identity / shared types                                            */
/* ================================================================== */

export type MapWorkflowKind =
  | "aoi"
  | "buffer"
  | "intersect"
  | "difference"
  | "union"
  | "comparison";

export type MapWorkflowStepId =
  | "source"
  | "operation"
  | "parameters"
  | "preview"
  | "apply"
  | "report";

export const MAP_WORKFLOW_STEP_ORDER: readonly MapWorkflowStepId[] = [
  "source",
  "operation",
  "parameters",
  "preview",
  "apply",
  "report",
] as const;

export const MAP_WORKFLOW_STEP_LABELS: Record<MapWorkflowStepId, string> = {
  source: "Source",
  operation: "Operation",
  parameters: "Parameters",
  preview: "Preview",
  apply: "Apply",
  report: "Report",
};

export type MapWorkflowAOISourceKind =
  | "viewport"
  | "selected-features"
  | "drawn-polygon"
  | "geocoded-place"
  | "urban-study-area";

export const MAP_WORKFLOW_AOI_SOURCE_LABELS: Record<MapWorkflowAOISourceKind, string> = {
  viewport: "Current viewport",
  "selected-features": "Selected features",
  "drawn-polygon": "Drawn polygon",
  "geocoded-place": "Geocoded place",
  "urban-study-area": "Urban study area",
};

export type MapWorkflowDistanceUnit =
  | "meters"
  | "kilometers"
  | "feet"
  | "miles";

export const MAP_WORKFLOW_DISTANCE_UNIT_LABELS: Record<MapWorkflowDistanceUnit, string> = {
  meters: "m",
  kilometers: "km",
  feet: "ft",
  miles: "mi",
};

const METERS_PER_UNIT: Record<MapWorkflowDistanceUnit, number> = {
  meters: 1,
  kilometers: 1_000,
  feet: 0.3048,
  miles: 1_609.344,
};

export type MapWorkflowComparisonView = "split" | "swipe" | "blend";

export const MAP_WORKFLOW_COMPARISON_VIEW_LABELS: Record<MapWorkflowComparisonView, string> = {
  split: "Synchronized split view",
  swipe: "Swipe view",
  blend: "Opacity blend",
};

/* ================================================================== */
/*  Source feature schema                                              */
/* ================================================================== */

export type MapWorkflowGeometryClass = "point" | "line" | "polygon" | "mixed" | "unknown";

export interface MapWorkflowSourceLayerSummary {
  id: string;
  name: string;
  visible: boolean;
  sourceKind: LayerSourceKind | undefined;
  qaStatus: LayerQaStatus | undefined;
  geometryType: string;
  geometryClass: MapWorkflowGeometryClass;
  featureCount: number;
  crs: string | null;
  dataVersion: string | null;
  fields: string[];
  hasGeometry: boolean;
}

/* ================================================================== */
/*  Workflow drafts (UI state ↔ service)                               */
/* ================================================================== */

export interface MapWorkflowReport {
  title: string;
  description?: string;
  includeMethods: boolean;
  includeQA: boolean;
}

export interface MapWorkflowAOIDraft {
  kind: "aoi";
  source: MapWorkflowAOISourceKind;
  name: string;
  bufferMeters: number;
  bufferUnit: MapWorkflowDistanceUnit;
  bufferDistance: number;
}

export interface MapWorkflowBufferDraft {
  kind: "buffer";
  sourceMode: "layer" | "selected-features";
  sourceLayerId: string | null;
  distance: number;
  unit: MapWorkflowDistanceUnit;
  segments: number;
  dissolve: boolean;
  name: string;
}

export interface MapWorkflowIntersectDraft {
  kind: "intersect";
  layerAId: string | null;
  layerBId: string | null;
  preserveAttributes: "a" | "b" | "both";
  name: string;
}

export interface MapWorkflowDifferenceDraft {
  kind: "difference";
  minuendLayerId: string | null;
  subtrahendLayerId: string | null;
  name: string;
}

export interface MapWorkflowUnionDraft {
  kind: "union";
  layerAId: string | null;
  layerBId: string | null;
  dissolve: boolean;
  name: string;
}

export interface MapWorkflowComparisonDraft {
  kind: "comparison";
  layerAId: string | null;
  layerBId: string | null;
  view: MapWorkflowComparisonView;
  swipePosition: number; // 0..1
  blendOpacityA: number; // 0..1
  blendOpacityB: number; // 0..1
  name: string;
}

export type MapWorkflowDraft =
  | MapWorkflowAOIDraft
  | MapWorkflowBufferDraft
  | MapWorkflowIntersectDraft
  | MapWorkflowDifferenceDraft
  | MapWorkflowUnionDraft
  | MapWorkflowComparisonDraft;

/* ================================================================== */
/*  Workflow context (what the service sees from Map Explorer)         */
/* ================================================================== */

export interface MapWorkflowGeocodedPlace {
  label: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  center?: [number, number];
  source?: string;
}

export interface MapWorkflowUrbanStudyArea {
  id: string;
  label: string;
  bounds: [number, number, number, number];
  activeAoiId?: string;
}

export interface MapWorkflowContext {
  layers: MapWorkflowSourceLayerSummary[];
  layerSourceMap: Map<string, FeatureCollection>;
  selectedFeatures: Array<Feature<Geometry>>;
  selectedLayerIds: string[];
  drawnPolygons: Array<Feature<Polygon | MultiPolygon>>;
  viewportBounds: [number, number, number, number] | null;
  geocodedPlace: MapWorkflowGeocodedPlace | null;
  urbanStudyArea: MapWorkflowUrbanStudyArea | null;
  now?: Date;
  urbanRequiredCrs?: string | null;
}

/* ================================================================== */
/*  Issues, validation, suggestions                                    */
/* ================================================================== */

export type MapWorkflowIssueSeverity = "blocker" | "warning" | "info";

export interface MapWorkflowIssue {
  step: MapWorkflowStepId;
  severity: MapWorkflowIssueSeverity;
  code: string;
  message: string;
  remedy?: CrsRemedy;
}

export interface MapWorkflowGuidance {
  step: MapWorkflowStepId;
  title: string;
  body: string;
}

export interface MapWorkflowSuggestedAction {
  id: string;
  label: string;
  description: string;
  step: MapWorkflowStepId;
  patch: Partial<MapWorkflowDraft>;
}

/* ================================================================== */
/*  Preview & apply outputs                                            */
/* ================================================================== */

export interface MapWorkflowPreview {
  workflow: MapWorkflowKind;
  draft: MapWorkflowDraft;
  featureCollection: FeatureCollection | null;
  geometryClass: MapWorkflowGeometryClass;
  featureCount: number;
  bounds: [number, number, number, number] | null;
  metrics: Record<string, number | string | null>;
  expectedOutput: MapReproducibilityExpectedOutput;
  manifest: MapReproducibilityManifest;
  issues: MapWorkflowIssue[];
  guidance: MapWorkflowGuidance[];
  nextRequiredStep: MapWorkflowStepId | null;
  canApply: boolean;
  needsWorker: boolean;
  /** True when the on-map preview was computed from a bounded sample (large input). */
  previewSampled?: boolean;
  /**
   * True when the full result must be produced off the main thread (large
   * input). Direct `applyMapWorkflowPreview` is refused; the UI routes such
   * previews through `executeMapWorkflow` (worker).
   */
  executionDeferred?: boolean;
  suggestions: MapWorkflowSuggestedAction[];
  crsPreflight: CrsPreflightResult;
  comparisonState?: MapWorkflowComparisonStatePreview;
}

export interface MapWorkflowComparisonStatePreview {
  view: MapWorkflowComparisonView;
  layerAId: string;
  layerBId: string;
  layerAName: string;
  layerBName: string;
  swipePosition: number;
  blendOpacityA: number;
  blendOpacityB: number;
}

export interface MapWorkflowApplyResult {
  layer: OverlayLayerConfig;
  preview: MapWorkflowPreview;
  manifest: MapReproducibilityManifest;
  reportItem: MapWorkflowReportItem;
}

export interface MapWorkflowReportItem {
  id: string;
  workflow: MapWorkflowKind;
  title: string;
  description: string;
  derivedLayerId: string;
  sourceLayerIds: string[];
  parameters: Record<string, unknown>;
  metrics: Record<string, number | string | null>;
  caveats: string[];
  manifest: MapReproducibilityManifest;
  comparisonState?: MapWorkflowComparisonStatePreview;
  createdAt: string;
}

export const MAP_WORKFLOW_PREVIEW_LAYER_ID = "__map_workflow_preview_layer";

/* ================================================================== */
/*  Public API — context construction                                  */
/* ================================================================== */

export function buildMapWorkflowContext(
  overlayLayers: ReadonlyArray<OverlayLayerConfig>,
  options: {
    selectedFeatures?: Array<Feature<Geometry>>;
    selectedLayerIds?: string[];
    drawnPolygons?: Array<Feature<Polygon | MultiPolygon>>;
    viewportBounds?: [number, number, number, number] | null;
    geocodedPlace?: MapWorkflowGeocodedPlace | null;
    urbanStudyArea?: MapWorkflowUrbanStudyArea | null;
    urbanRequiredCrs?: string | null;
    now?: Date;
  } = {},
): MapWorkflowContext {
  const sourceMap = new Map<string, FeatureCollection>();
  const layers: MapWorkflowSourceLayerSummary[] = [];

  for (const layer of overlayLayers) {
    const fc = coerceLayerToFeatureCollection(layer);
    const geometryType = layer.metadata?.geometryType ?? inferGeometryType(fc);
    const featureCount = fc?.features.length ?? layer.metadata?.featureCount ?? 0;
    const fields = layer.metadata?.fields ?? [];
    const crs =
      layer.metadata?.crsSummary?.crs ??
      layer.metadata?.registry?.crsSummary.crs ??
      layer.metadata?.datasetContext?.crs ??
      layer.metadata?.columnar?.crs ??
      layer.metadata?.externalService?.crs ??
      null;

    if (fc) {
      sourceMap.set(layer.id, fc);
    }

    layers.push({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      sourceKind: layer.sourceKind,
      qaStatus: layer.qaStatus,
      geometryType: typeof geometryType === "string" ? geometryType : "Unknown",
      geometryClass: classifyGeometry(geometryType ?? "Unknown"),
      featureCount,
      crs,
      dataVersion:
        layer.metadata?.dataVersion ??
        layer.metadata?.analysisResult?.sourceDataVersion ??
        layer.metadata?.persistence?.savedAt ??
        null,
      fields,
      hasGeometry: Boolean(fc && fc.features.length > 0),
    });
  }

  return {
    layers,
    layerSourceMap: sourceMap,
    selectedFeatures: options.selectedFeatures ?? [],
    selectedLayerIds: options.selectedLayerIds ?? inferSelectedLayerIds(options.selectedFeatures ?? []),
    drawnPolygons: options.drawnPolygons ?? [],
    viewportBounds: options.viewportBounds ?? null,
    geocodedPlace: options.geocodedPlace ?? null,
    urbanStudyArea: options.urbanStudyArea ?? null,
    ...(options.urbanRequiredCrs !== undefined ? { urbanRequiredCrs: options.urbanRequiredCrs } : {}),
    ...(options.now ? { now: options.now } : {}),
  };
}

/* ================================================================== */
/*  Draft factories                                                    */
/* ================================================================== */

export function createDefaultDraft(kind: MapWorkflowKind): MapWorkflowDraft {
  switch (kind) {
    case "aoi":
      return {
        kind: "aoi",
        source: "viewport",
        name: "Custom AOI",
        bufferMeters: 0,
        bufferUnit: "kilometers",
        bufferDistance: 0,
      } satisfies MapWorkflowAOIDraft;
    case "buffer":
      return {
        kind: "buffer",
        sourceMode: "layer",
        sourceLayerId: null,
        distance: 500,
        unit: "meters",
        segments: 32,
        dissolve: false,
        name: "Buffer result",
      } satisfies MapWorkflowBufferDraft;
    case "intersect":
      return {
        kind: "intersect",
        layerAId: null,
        layerBId: null,
        preserveAttributes: "both",
        name: "Intersection result",
      } satisfies MapWorkflowIntersectDraft;
    case "difference":
      return {
        kind: "difference",
        minuendLayerId: null,
        subtrahendLayerId: null,
        name: "Difference result",
      } satisfies MapWorkflowDifferenceDraft;
    case "union":
      return {
        kind: "union",
        layerAId: null,
        layerBId: null,
        dissolve: true,
        name: "Union result",
      } satisfies MapWorkflowUnionDraft;
    case "comparison":
      return {
        kind: "comparison",
        layerAId: null,
        layerBId: null,
        view: "split",
        swipePosition: 0.5,
        blendOpacityA: 0.85,
        blendOpacityB: 0.55,
        name: "Layer comparison",
      } satisfies MapWorkflowComparisonDraft;
  }
  return assertNever(kind);
}

/* ================================================================== */
/*  Preview generation — public dispatcher                             */
/* ================================================================== */

export function generateMapWorkflowPreview(
  draft: MapWorkflowDraft,
  context: MapWorkflowContext,
): MapWorkflowPreview {
  switch (draft.kind) {
    case "aoi":
      return previewAOI(draft, context);
    case "buffer":
      return previewBuffer(draft, context);
    case "intersect":
      return previewIntersect(draft, context);
    case "difference":
      return previewDifference(draft, context);
    case "union":
      return previewUnion(draft, context);
    case "comparison":
      return previewComparison(draft, context);
  }
  return assertNever(draft);
}

/* ================================================================== */
/*  Apply — promote preview to derived layer + report item             */
/* ================================================================== */

export function applyMapWorkflowPreview(
  preview: MapWorkflowPreview,
  context: MapWorkflowContext,
): MapWorkflowApplyResult | null {
  if (!preview.canApply) {
    return null;
  }

  if (preview.workflow === "comparison") {
    return applyComparison(preview, context);
  }

  // A deferred large-input preview only holds a bounded sample — committing it
  // would register an incomplete result. Force the worker path instead.
  if (preview.executionDeferred) {
    return null;
  }

  if (!preview.featureCollection) {
    return null;
  }

  const baseLayer = buildDerivedLayer(preview, context);
  const sourceLayerIds = collectSourceLayerIds(preview.draft, context);
  const appliedAt = nowIso(context);
  const reportItemId = `wf:${preview.workflow}:${appliedAt}:${baseLayer.id}`;
  const manifest = buildAppliedManifest(
    preview,
    [{
      layerId: baseLayer.id,
      role: "derived-output",
      name: baseLayer.name,
      sourceKind: "derived",
      featureCount: preview.featureCount,
    }],
    {
      createdAt: appliedAt,
      reportItemIds: [reportItemId],
    },
  );
  const layer: OverlayLayerConfig = {
    ...baseLayer,
    metadata: {
      ...(baseLayer.metadata ?? {}),
      reproducibilityManifest: manifest,
    },
  };
  const reportItem: MapWorkflowReportItem = {
    id: reportItemId,
    workflow: preview.workflow,
    title: layer.name,
    description: describeWorkflow(preview),
    derivedLayerId: layer.id,
    sourceLayerIds,
    parameters: collectParameters(preview.draft),
    metrics: preview.metrics,
    caveats: collectCaveats(preview),
    manifest,
    createdAt: manifest.createdAt,
  };

  return { layer, preview, manifest, reportItem };
}

/* ================================================================== */
/*  Worker execution — large inputs run off the main thread            */
/* ================================================================== */

/** Progress/lifecycle surfaced to the UI while a workflow runs in a worker. */
export interface MapWorkflowExecutionUpdate {
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  percent: number;
  stage?: string | undefined;
  detail?: string | undefined;
  error?: string | undefined;
}

/**
 * Handle returned by a worker executor. The geometry op resolves with a fully
 * attributed computation; `cancel` aborts the in-flight job cleanly.
 */
export interface MapWorkflowExecutionHandle {
  promise: Promise<GeometryWorkflowComputation>;
  cancel: () => boolean;
}

/**
 * Injected boundary the composition fills with the background worker pool, so
 * `MapWorkflowService` performs no I/O and stays unit-testable with a fake.
 */
export interface MapWorkflowWorkerExecutor {
  run: (
    request: GeometryWorkflowRequest,
    options: {
      title: string;
      description?: string | undefined;
      onProgress?: ((update: MapWorkflowExecutionUpdate) => void) | undefined;
    },
  ) => MapWorkflowExecutionHandle;
}

const WORKER_GEOMETRY_OPS: ReadonlySet<MapWorkflowKind> = new Set(["buffer", "intersect", "difference", "union"]);

function resolveBufferSource(
  draft: MapWorkflowBufferDraft,
  context: MapWorkflowContext,
): { source: FeatureCollection | null; sourceLayerId: string } {
  const sourceMode = draft.sourceMode ?? "layer";
  if (sourceMode === "selected-features") {
    return {
      source: {
        type: "FeatureCollection",
        features: context.selectedFeatures.filter((feature) => Boolean(feature.geometry)),
      },
      sourceLayerId: context.selectedLayerIds.join(",") || "selection",
    };
  }
  const layerId = draft.sourceLayerId;
  return {
    source: layerId ? context.layerSourceMap.get(layerId) ?? null : null,
    sourceLayerId: layerId ?? "layer",
  };
}

/**
 * Build the serializable worker request for a buffer/intersect/difference/union
 * preview. Returns null when the workflow is not a worker geometry op or the
 * source geometry is unavailable.
 */
export function buildGeometryWorkflowRequest(
  preview: MapWorkflowPreview,
  context: MapWorkflowContext,
): GeometryWorkflowRequest | null {
  if (!WORKER_GEOMETRY_OPS.has(preview.workflow)) return null;
  const draft = preview.draft;
  const executionCrs = preview.crsPreflight.executionCrs;
  const displayCrs = preview.crsPreflight.displayCrs;
  const sourceLayerIds = collectSourceLayerIds(draft, context);

  if (draft.kind === "buffer") {
    const { source, sourceLayerId } = resolveBufferSource(draft, context);
    if (!source || source.features.length === 0) return null;
    const params: GeometryWorkflowParams = {
      op: "buffer",
      meters: unitToMeters(draft.distance, draft.unit),
      segments: clampSegments(draft.segments),
      dissolve: draft.dissolve,
      sourceLayerId,
    };
    return { op: "buffer", sources: [source], params, executionCrs, displayCrs, sourceLayerIds, preferGeos: true };
  }

  if (draft.kind === "intersect" || draft.kind === "difference" || draft.kind === "union") {
    const sourceA = draft.layerAId ? context.layerSourceMap.get(draft.layerAId) ?? null : null;
    const sourceB = draft.layerBId ? context.layerSourceMap.get(draft.layerBId) ?? null : null;
    if (!sourceA || !sourceB) return null;
    const params: GeometryWorkflowParams =
      draft.kind === "intersect"
        ? { op: "intersect", preserveAttributes: draft.preserveAttributes }
        : draft.kind === "union"
          ? { op: "union", dissolve: draft.dissolve }
          : { op: "difference" };
    return { op: draft.kind, sources: [sourceA, sourceB], params, executionCrs, displayCrs, sourceLayerIds, preferGeos: true };
  }

  return null;
}

/**
 * Turn a worker computation into a committed apply result — the same derived
 * layer + manifest + report item shape as `applyMapWorkflowPreview`, but built
 * from the full off-thread feature collection rather than the bounded sample.
 */
export function finalizeWorkerWorkflowResult(
  preview: MapWorkflowPreview,
  context: MapWorkflowContext,
  computation: GeometryWorkflowComputation,
): MapWorkflowApplyResult | null {
  const committedPreview: MapWorkflowPreview = {
    ...preview,
    featureCollection: computation.featureCollection,
    featureCount: computation.featureCount,
    bounds: computation.bounds,
    metrics: {
      ...preview.metrics,
      ...computation.metrics,
      executed_in_worker: 1,
      worker_input_features: computation.inputFeatureCount,
    },
    previewSampled: false,
    executionDeferred: false,
    canApply: true,
  };
  return applyMapWorkflowPreview(committedPreview, context);
}

/**
 * Execute a workflow preview, running large inputs in a worker (with progress
 * + cancel) and small inputs synchronously on the main thread. Always resolves
 * with a fully attributed apply result whose manifest CRS equals the execution
 * CRS, or throws if the op cannot run / was cancelled.
 */
export async function executeMapWorkflow(
  preview: MapWorkflowPreview,
  context: MapWorkflowContext,
  executor: MapWorkflowWorkerExecutor,
  hooks?: {
    onProgress?: ((update: MapWorkflowExecutionUpdate) => void) | undefined;
    registerHandle?: ((handle: MapWorkflowExecutionHandle) => void) | undefined;
  },
): Promise<MapWorkflowApplyResult> {
  const request = preview.needsWorker ? buildGeometryWorkflowRequest(preview, context) : null;

  if (!request) {
    // Small / non-worker op: synchronous apply on the main thread.
    hooks?.onProgress?.({ status: "running", percent: 50, stage: "Computing on main thread" });
    const applied = applyMapWorkflowPreview(
      preview.executionDeferred ? { ...preview, executionDeferred: false } : preview,
      context,
    );
    if (!applied) {
      throw new Error("Workflow could not be applied. Resolve the highlighted blockers and try again.");
    }
    hooks?.onProgress?.({ status: "completed", percent: 100, stage: "Complete" });
    return applied;
  }

  hooks?.onProgress?.({ status: "queued", percent: 0, stage: "Queued" });
  const handle = executor.run(request, {
    title: `${describeMethod(preview)} (${request.sources.reduce((total, fc) => total + fc.features.length, 0).toLocaleString()} features)`,
    description: "Off-main-thread geometry execution",
    onProgress: hooks?.onProgress,
  });
  hooks?.registerHandle?.(handle);

  const computation = await handle.promise;
  const applied = finalizeWorkerWorkflowResult(preview, context, computation);
  if (!applied) {
    throw new Error("Worker geometry result could not be committed to a derived layer.");
  }
  return applied;
}

export function buildMapWorkflowPreviewLayer(
  preview: MapWorkflowPreview | null,
  context: MapWorkflowContext,
): OverlayLayerConfig | null {
  if (!preview?.featureCollection) {
    return null;
  }

  const baseMetadata = buildFeatureCollectionMetadata(preview.featureCollection);
  const sourceLayerIds = collectSourceLayerIds(preview.draft, context);
  const qaMetadata = buildDerivedQAMetadata(preview, context, sourceLayerIds);

  return {
    id: MAP_WORKFLOW_PREVIEW_LAYER_ID,
    name: `Preview · ${describeMethod(preview)}`,
    type: "geojson",
    visible: true,
    opacity: 0.42,
    sourceData: preview.featureCollection,
    queryable: false,
    sourceKind: "derived",
    group: "analysis",
    qaStatus: qaMetadata.status,
    provenance: {
      label: `Workflow preview · ${preview.workflow}`,
      method: describeMethod(preview),
      generatedAt: nowIso(context),
      sourceLayerIds,
      notes: ["Transient preview layer — apply the workflow to register a derived result."],
    },
    metadata: {
      ...baseMetadata,
      updatedAt: nowIso(context),
      scientificQA: qaMetadata,
      reproducibilityManifest: preview.manifest,
    },
  };
}

function applyComparison(
  preview: MapWorkflowPreview,
  context: MapWorkflowContext,
): MapWorkflowApplyResult | null {
  if (!preview.comparisonState) return null;
  const draft = preview.draft as MapWorkflowComparisonDraft;
  const layerA = context.layers.find((entry) => entry.id === draft.layerAId);
  const layerB = context.layers.find((entry) => entry.id === draft.layerBId);
  if (!layerA || !layerB) return null;

  const compositeFeatures: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  const layerId = `derived:comparison:${draft.layerAId}__${draft.layerBId}:${nowIso(context)}`;
  const provenance: LayerProvenance = {
    label: `Comparison · ${layerA.name} ↔ ${layerB.name}`,
    method: `Map comparison view (${preview.comparisonState.view})`,
    generatedAt: nowIso(context),
    sourceLayerIds: [draft.layerAId!, draft.layerBId!],
    notes: ["Comparison view does not modify source layers."],
  };

  const layer: OverlayLayerConfig = {
    id: layerId,
    name: draft.name,
    type: "geojson",
    visible: false,
    opacity: 1,
    sourceData: compositeFeatures,
    queryable: false,
    sourceKind: "derived",
    group: "analysis",
    provenance,
    qaStatus: "passed",
    metadata: {
      featureCount: 0,
      geometryType: "Comparison",
      fields: [],
      updatedAt: nowIso(context),
      scientificQA: buildDerivedQAMetadata(preview, context, []),
    },
  };

  const appliedAt = nowIso(context);
  const reportItemId = `wf:comparison:${appliedAt}:${layerId}`;
  const manifest = buildAppliedManifest(preview, [
    {
      layerId,
      role: "derived-output",
      name: draft.name,
      sourceKind: "derived",
      featureCount: 0,
    },
  ], {
    createdAt: appliedAt,
    reportItemIds: [reportItemId],
  });
  const layerWithManifest: OverlayLayerConfig = {
    ...layer,
    metadata: {
      ...(layer.metadata ?? {}),
      reproducibilityManifest: manifest,
    },
  };

  const reportItem: MapWorkflowReportItem = {
    id: reportItemId,
    workflow: "comparison",
    title: draft.name,
    description: describeWorkflow(preview),
    derivedLayerId: layerId,
    sourceLayerIds: [draft.layerAId!, draft.layerBId!],
    parameters: collectParameters(draft),
    metrics: preview.metrics,
    caveats: collectCaveats(preview),
    manifest,
    comparisonState: preview.comparisonState,
    createdAt: manifest.createdAt,
  };

  return { layer: layerWithManifest, preview, manifest, reportItem };
}

/* ================================================================== */
/*  AOI workflow                                                       */
/* ================================================================== */

function previewAOI(
  draft: MapWorkflowAOIDraft,
  context: MapWorkflowContext,
): MapWorkflowPreview {
  const issues: MapWorkflowIssue[] = [];
  const guidance: MapWorkflowGuidance[] = [];
  const suggestions: MapWorkflowSuggestedAction[] = [];

  guidance.push({
    step: "source",
    title: "Why this input matters",
    body:
      "The AOI is the spatial scope for downstream analyses — buffers, intersections, and statistics reuse it. " +
      "Keep it tight enough to be meaningful, but inclusive of the features you intend to compare.",
  });

  let baseGeometry: Feature<Polygon | MultiPolygon> | null = null;
  let sourceLabel = MAP_WORKFLOW_AOI_SOURCE_LABELS[draft.source];
  let basisDescription = "";
  const provenanceNotes: string[] = [];

  switch (draft.source) {
    case "viewport": {
      if (!context.viewportBounds || !isFiniteBounds(context.viewportBounds)) {
        issues.push({
          step: "source",
          severity: "blocker",
          code: "viewport-unavailable",
          message: "Current map viewport bounds are unavailable. Pan or zoom the map and try again.",
        });
      } else {
        baseGeometry = bboxToPolygonFeature(context.viewportBounds, "AOI viewport");
        basisDescription = `Viewport ${formatBounds(context.viewportBounds)}`;
      }
      break;
    }
    case "selected-features": {
      if (context.selectedFeatures.length === 0) {
        issues.push({
          step: "source",
          severity: "blocker",
          code: "no-selection",
          message: "Select one or more map features before creating an AOI from selection.",
        });
      } else {
        const polygon = featuresToPolygon(context.selectedFeatures, "AOI selection");
        if (!polygon) {
          issues.push({
            step: "source",
            severity: "blocker",
            code: "selection-no-polygon",
            message: "Selected features could not be converted to a polygon AOI.",
          });
        } else {
          baseGeometry = polygon;
          basisDescription = `${context.selectedFeatures.length} selected feature${context.selectedFeatures.length === 1 ? "" : "s"}`;
          provenanceNotes.push("Convex hull of selected features when geometry is non-polygonal.");
        }
      }
      break;
    }
    case "drawn-polygon": {
      if (context.drawnPolygons.length === 0) {
        issues.push({
          step: "source",
          severity: "blocker",
          code: "no-drawn-polygon",
          message: "Draw a polygon on the map before creating an AOI from a drawing.",
        });
      } else {
        const merged = mergePolygons(context.drawnPolygons);
        if (!merged) {
          issues.push({
            step: "source",
            severity: "blocker",
            code: "invalid-drawn-polygon",
            message: "Drawn polygon geometry could not be processed.",
          });
        } else {
          baseGeometry = merged;
          basisDescription = `${context.drawnPolygons.length} drawn polygon${context.drawnPolygons.length === 1 ? "" : "s"}`;
        }
      }
      break;
    }
    case "geocoded-place": {
      if (!context.geocodedPlace) {
        issues.push({
          step: "source",
          severity: "blocker",
          code: "no-geocoded-place",
          message: "Missing prerequisite: search for a place name and select a geocoded result first.",
        });
      } else if (!isFiniteBounds(context.geocodedPlace.bbox)) {
        issues.push({
          step: "source",
          severity: "blocker",
          code: "invalid-geocoded-bbox",
          message: "Geocoded place bbox is invalid.",
        });
      } else {
        baseGeometry = bboxToPolygonFeature(context.geocodedPlace.bbox, draft.name || context.geocodedPlace.label);
        basisDescription = `Geocoded place ${context.geocodedPlace.label}`;
        sourceLabel = `Geocoded · ${context.geocodedPlace.label}`;
        provenanceNotes.push(`Place source: ${context.geocodedPlace.source ?? "unknown"}`);
      }
      break;
    }
    case "urban-study-area": {
      if (!context.urbanStudyArea) {
        issues.push({
          step: "source",
          severity: "blocker",
          code: "no-urban-study-area",
          message: "Missing prerequisite: choose and apply an Urban Analytics study area first.",
        });
      } else if (!isFiniteBounds(context.urbanStudyArea.bounds)) {
        issues.push({
          step: "source",
          severity: "blocker",
          code: "invalid-urban-study-area-bounds",
          message: "Urban Analytics study area bounds are invalid.",
        });
      } else {
        baseGeometry = bboxToPolygonFeature(context.urbanStudyArea.bounds, draft.name || context.urbanStudyArea.label);
        basisDescription = `Urban study area ${context.urbanStudyArea.label}`;
        sourceLabel = `Urban · ${context.urbanStudyArea.label}`;
        provenanceNotes.push(`Urban study area ID: ${context.urbanStudyArea.id}`);
        if (context.urbanStudyArea.activeAoiId) {
          provenanceNotes.push(`Active Urban AOI: ${context.urbanStudyArea.activeAoiId}`);
        }
      }
      break;
    }
  }

  const bufferMeters = unitToMeters(draft.bufferDistance ?? 0, draft.bufferUnit);
  const bufferIssue = validateBufferDistance(bufferMeters, "parameters");
  if (bufferIssue) issues.push(bufferIssue);

  let aoiGeometry = baseGeometry;
  if (aoiGeometry && bufferMeters > 0 && !bufferIssue) {
    aoiGeometry = applyBufferToFeature(aoiGeometry, bufferMeters);
    if (!aoiGeometry) {
      issues.push({
        step: "parameters",
        severity: "blocker",
        code: "aoi-buffer-failed",
        message: "Buffer expansion of the AOI failed for the chosen distance.",
      });
    }
  }

  const aoiValidation = aoiGeometry ? validateDrawnGeometry(aoiGeometry.geometry) : null;
  if (aoiValidation?.status === "blocked") {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "aoi-invalid-geometry",
      message: summarizeDrawnGeometryValidation(aoiValidation),
    });
  } else if (aoiValidation?.status === "warning") {
    issues.push({
      step: "source",
      severity: "warning",
      code: "aoi-geometry-warning",
      message: summarizeDrawnGeometryValidation(aoiValidation),
    });
  }

  const featureCollection: FeatureCollection | null = aoiGeometry
    ? {
        type: "FeatureCollection",
        features: [
          {
            ...aoiGeometry,
            properties: {
              ...(aoiGeometry.properties ?? {}),
              aoi_source: draft.source,
              aoi_label: draft.name,
              aoi_buffer_meters: bufferMeters,
              ...(aoiValidation ? {
                aoi_validation_status: aoiValidation.status,
                aoi_validation_issues: aoiValidation.issueCodes.join(","),
              } : {}),
            },
          },
        ],
      }
    : null;

  const bounds = featureCollection ? getFeatureCollectionBounds(featureCollection) ?? null : null;
  const areaKm2 = featureCollection ? safeAreaKm2(featureCollection) : 0;

  if (featureCollection && areaKm2 < 0.000_01) {
    issues.push({
      step: "parameters",
      severity: "warning",
      code: "aoi-degenerate",
      message: "Resulting AOI area is effectively zero. Increase the buffer distance or expand the source.",
    });
  }

  if (!draft.name.trim()) {
    issues.push({
      step: "parameters",
      severity: "warning",
      code: "aoi-name-missing",
      message: "Provide a descriptive name so the AOI is auditable in the report.",
    });
  }

  guidance.push({
    step: "parameters",
    title: "Geodesic buffer expansion",
    body: "Use a small expansion (10–500 m) to capture features along the AOI edge without skewing analyses.",
  });

  if (draft.source !== "drawn-polygon" && context.drawnPolygons.length > 0) {
    suggestions.push({
      id: "aoi-prefer-drawn",
      label: "Use drawn polygon instead",
      description: "A user-drawn polygon usually represents intent more precisely than the current viewport.",
      step: "source",
      patch: { source: "drawn-polygon" } as Partial<MapWorkflowAOIDraft>,
    });
  }

  if (draft.source !== "selected-features" && context.selectedFeatures.length > 0) {
    suggestions.push({
      id: "aoi-prefer-selection",
      label: "Use selected features",
      description: `Promote the ${context.selectedFeatures.length} selected feature(s) to an AOI.`,
      step: "source",
      patch: { source: "selected-features" } as Partial<MapWorkflowAOIDraft>,
    });
  }

  return finalizePreview({
    workflow: "aoi",
    draft: {
      ...draft,
      bufferMeters,
    },
    featureCollection,
    geometryClass: "polygon",
    metrics: {
      area_km2: areaKm2,
      buffer_meters: bufferMeters,
      basis: basisDescription,
      source_kind: sourceLabel,
      provenance_notes: provenanceNotes.join(" · ") || null,
    },
    bounds,
    issues,
    guidance,
    suggestions,
    context,
  });
}

/* ================================================================== */
/*  Buffer workflow                                                    */
/* ================================================================== */

function previewBuffer(
  draft: MapWorkflowBufferDraft,
  context: MapWorkflowContext,
): MapWorkflowPreview {
  const issues: MapWorkflowIssue[] = [];
  const guidance: MapWorkflowGuidance[] = [];
  const suggestions: MapWorkflowSuggestedAction[] = [];

  guidance.push({
    step: "source",
    title: "Pick a vector layer",
    body:
      "Buffers operate on geometric features. Choose the layer of points, lines, or polygons whose neighborhoods you want to study.",
  });
  guidance.push({
    step: "parameters",
    title: "Geodesic distance",
    body:
      "Distances are interpreted on the WGS-84 ellipsoid. Choose the unit that matches your reporting context (m, km, ft, mi).",
  });

  const sourceMode = draft.sourceMode ?? "layer";
  const layer = pickLayer(context, draft.sourceLayerId);
  const selectedSource: FeatureCollection | null = sourceMode === "selected-features"
    ? {
        type: "FeatureCollection",
        features: context.selectedFeatures.filter((feature) => Boolean(feature.geometry)),
      }
    : null;
  const selectedGeometryClass = selectedSource ? classifyFeatureCollectionGeometry(selectedSource) : "unknown";

  if (sourceMode === "selected-features" && context.selectedFeatures.length === 0) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "buffer-no-selection",
      message: "Select one or more point, line, or polygon features before buffering the current selection.",
    });
  } else if (sourceMode === "selected-features" && selectedGeometryClass === "unknown") {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "buffer-selection-empty-geometry",
      message: "Selected features do not include usable geometry.",
    });
  } else if (sourceMode === "layer" && !draft.sourceLayerId) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "buffer-no-source",
      message: "Select a source layer to buffer.",
    });
  } else if (sourceMode === "layer" && !layer) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "buffer-source-missing",
      message: "Selected source layer is not available in the current map state.",
    });
  } else if (sourceMode === "layer" && layer && !layer.hasGeometry) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "buffer-source-empty",
      message: `Layer "${layer.name}" has no geometry to buffer.`,
    });
  } else if (sourceMode === "layer" && layer && layer.geometryClass === "unknown") {
    issues.push({
      step: "source",
      severity: "warning",
      code: "buffer-unknown-geometry",
      message: `Layer "${layer.name}" has mixed or unknown geometry types — results may include artifacts.`,
    });
  }

  const meters = unitToMeters(draft.distance, draft.unit);
  const distanceIssue = validateBufferDistance(meters, "parameters");
  if (distanceIssue) issues.push(distanceIssue);

  if (draft.segments < 4 || draft.segments > 256) {
    issues.push({
      step: "parameters",
      severity: "warning",
      code: "buffer-segments-out-of-range",
      message: "Use 8 to 64 segments for smooth, performant buffer outlines (clamped automatically).",
    });
  }

  let featureCollection: FeatureCollection | null = null;
  let workerNeeded = false;
  const source = sourceMode === "selected-features"
    ? selectedSource
    : layer
      ? context.layerSourceMap.get(layer.id) ?? null
      : null;
  const crsPreflight = preflightMapWorkflowOperation({
    label: "Buffer",
    metric: "buffer",
    sourceLayerIds: sourceMode === "selected-features" ? context.selectedLayerIds : layer ? [layer.id] : [],
    context,
    sourceGeometry: source,
  });
  pushCrsPreflightIssue(crsPreflight, "source", issues);

  let previewSampled = false;
  if (source && meters > 0 && !distanceIssue && issues.every((entry) => entry.severity !== "blocker")) {
    workerNeeded = source.features.length > MAP_WORKFLOW_WORKER_FEATURE_THRESHOLD;
    const bounded = boundPreviewSource(source);
    previewSampled = bounded.sampled;
    featureCollection = computeBuffer(bounded.source, meters, {
      segments: clampSegments(draft.segments),
      dissolve: draft.dissolve,
      sourceLayerId: sourceMode === "selected-features"
        ? context.selectedLayerIds.join(",") || "selection"
        : layer?.id ?? "layer",
    });
  }

  if (meters === 0) {
    issues.push({
      step: "parameters",
      severity: "blocker",
      code: "buffer-zero",
      message: "Buffer distance must be greater than 0.",
    });
  }

  const bounds = featureCollection ? getFeatureCollectionBounds(featureCollection) ?? null : null;
  const areaKm2 = featureCollection ? safeAreaKm2(featureCollection) : 0;

  if (
    sourceMode === "layer" &&
    layer?.geometryClass === "polygon" &&
    draft.dissolve === false &&
    (featureCollection?.features.length ?? 0) > 1
  ) {
    suggestions.push({
      id: "buffer-dissolve-hint",
      label: "Dissolve overlapping rings",
      description: "Polygons that touch will produce overlapping buffer rings — dissolving cleans the output.",
      step: "parameters",
      patch: { dissolve: true } as Partial<MapWorkflowBufferDraft>,
    });
  }

  if (sourceMode !== "selected-features" && context.selectedFeatures.length > 0) {
    suggestions.push({
      id: "buffer-selected-features",
      label: "Buffer selected features",
      description: `Use the ${context.selectedFeatures.length} selected feature(s) instead of buffering the whole layer.`,
      step: "source",
      patch: { sourceMode: "selected-features", sourceLayerId: null } as Partial<MapWorkflowBufferDraft>,
    });
  }

  return finalizePreview({
    workflow: "buffer",
    draft: { ...draft, sourceMode, distance: draft.distance },
    featureCollection,
    geometryClass: "polygon",
    metrics: {
      buffer_meters: meters,
      buffer_unit: draft.unit,
      buffer_segments: clampSegments(draft.segments),
      buffered_features: featureCollection?.features.length ?? 0,
      input_features: sourceMode === "selected-features"
        ? context.selectedFeatures.length
        : layer?.featureCount ?? 0,
      source_scope: sourceMode === "selected-features" ? "selected features" : "whole layer",
      area_km2: areaKm2,
    },
    bounds,
    issues,
    guidance,
    suggestions,
    needsWorker: workerNeeded,
    previewSampled,
    executionDeferred: workerNeeded && previewSampled,
    crsPreflight,
    context,
  });
}

/* ================================================================== */
/*  Intersection workflow                                              */
/* ================================================================== */

function previewIntersect(
  draft: MapWorkflowIntersectDraft,
  context: MapWorkflowContext,
): MapWorkflowPreview {
  const issues: MapWorkflowIssue[] = [];
  const guidance: MapWorkflowGuidance[] = [];
  const suggestions: MapWorkflowSuggestedAction[] = [];

  guidance.push({
    step: "source",
    title: "Why two polygon layers",
    body:
      "Geometric intersection requires two polygon (or multi-polygon) layers. Result is the spatial overlap as a derived layer.",
  });

  const layerA = pickLayer(context, draft.layerAId);
  const layerB = pickLayer(context, draft.layerBId);

  validatePolygonPair(draft.layerAId, draft.layerBId, layerA, layerB, issues);
  const crsPreflight = preflightMapWorkflowOperation({
    label: "Intersection",
    metric: "intersection",
    sourceLayerIds: [draft.layerAId, draft.layerBId].filter((id): id is string => Boolean(id)),
    context,
    preferEqualArea: true,
  });
  pushCrsPreflightIssue(crsPreflight, "source", issues);

  let featureCollection: FeatureCollection | null = null;
  let workerNeeded = false;
  let previewSampled = false;
  let intersectingPairs = 0;

  if (
    layerA &&
    layerB &&
    layerA.geometryClass === "polygon" &&
    layerB.geometryClass === "polygon" &&
    layerA.hasGeometry &&
    layerB.hasGeometry &&
    issues.every((entry) => entry.severity !== "blocker")
  ) {
    const sourceA = context.layerSourceMap.get(layerA.id);
    const sourceB = context.layerSourceMap.get(layerB.id);
    if (sourceA && sourceB) {
      workerNeeded =
        sourceA.features.length + sourceB.features.length > MAP_WORKFLOW_WORKER_FEATURE_THRESHOLD;
      const boundedA = boundPreviewSource(sourceA);
      const boundedB = boundPreviewSource(sourceB);
      previewSampled = boundedA.sampled || boundedB.sampled;
      const result = computeIntersect(boundedA.source, boundedB.source, draft.preserveAttributes);
      featureCollection = result.featureCollection;
      intersectingPairs = result.pairCount;
      if (intersectingPairs === 0) {
        issues.push({
          step: "preview",
          severity: "warning",
          code: "intersect-empty",
          message: "No spatial overlap detected between the chosen layers.",
        });
      }
    }
  }

  return finalizePreview({
    workflow: "intersect",
    draft,
    featureCollection,
    geometryClass: "polygon",
    metrics: {
      intersecting_pairs: intersectingPairs,
      output_features: featureCollection?.features.length ?? 0,
      input_features_a: layerA?.featureCount ?? 0,
      input_features_b: layerB?.featureCount ?? 0,
      area_km2: featureCollection ? safeAreaKm2(featureCollection) : 0,
      attribute_strategy: draft.preserveAttributes,
    },
    bounds: featureCollection ? getFeatureCollectionBounds(featureCollection) ?? null : null,
    issues,
    guidance,
    suggestions,
    needsWorker: workerNeeded,
    previewSampled,
    executionDeferred: workerNeeded && previewSampled,
    crsPreflight,
    context,
  });
}

/* ================================================================== */
/*  Difference workflow (A − B)                                        */
/* ================================================================== */

function previewDifference(
  draft: MapWorkflowDifferenceDraft,
  context: MapWorkflowContext,
): MapWorkflowPreview {
  const issues: MapWorkflowIssue[] = [];
  const guidance: MapWorkflowGuidance[] = [];
  const suggestions: MapWorkflowSuggestedAction[] = [];

  guidance.push({
    step: "source",
    title: "Order matters",
    body:
      "Difference returns regions of A not covered by B. Pick A as the scenario you want to keep and B as the area to subtract.",
  });

  const layerA = pickLayer(context, draft.minuendLayerId);
  const layerB = pickLayer(context, draft.subtrahendLayerId);
  validatePolygonPair(draft.minuendLayerId, draft.subtrahendLayerId, layerA, layerB, issues);
  const crsPreflight = preflightMapWorkflowOperation({
    label: "Difference",
    metric: "difference",
    sourceLayerIds: [draft.minuendLayerId, draft.subtrahendLayerId].filter((id): id is string => Boolean(id)),
    context,
    preferEqualArea: true,
  });
  pushCrsPreflightIssue(crsPreflight, "source", issues);

  let featureCollection: FeatureCollection | null = null;
  let workerNeeded = false;
  let previewSampled = false;

  if (
    layerA &&
    layerB &&
    layerA.geometryClass === "polygon" &&
    layerB.geometryClass === "polygon" &&
    layerA.hasGeometry &&
    layerB.hasGeometry &&
    issues.every((entry) => entry.severity !== "blocker")
  ) {
    const sourceA = context.layerSourceMap.get(layerA.id);
    const sourceB = context.layerSourceMap.get(layerB.id);
    if (sourceA && sourceB) {
      workerNeeded =
        sourceA.features.length + sourceB.features.length > MAP_WORKFLOW_WORKER_FEATURE_THRESHOLD;
      const boundedA = boundPreviewSource(sourceA);
      const boundedB = boundPreviewSource(sourceB);
      previewSampled = boundedA.sampled || boundedB.sampled;
      featureCollection = computeDifference(boundedA.source, boundedB.source);
    }
  }

  return finalizePreview({
    workflow: "difference",
    draft,
    featureCollection,
    geometryClass: "polygon",
    metrics: {
      output_features: featureCollection?.features.length ?? 0,
      input_features_a: layerA?.featureCount ?? 0,
      input_features_b: layerB?.featureCount ?? 0,
      area_km2: featureCollection ? safeAreaKm2(featureCollection) : 0,
    },
    bounds: featureCollection ? getFeatureCollectionBounds(featureCollection) ?? null : null,
    issues,
    guidance,
    suggestions,
    needsWorker: workerNeeded,
    previewSampled,
    executionDeferred: workerNeeded && previewSampled,
    crsPreflight,
    context,
  });
}

/* ================================================================== */
/*  Union workflow                                                     */
/* ================================================================== */

function previewUnion(
  draft: MapWorkflowUnionDraft,
  context: MapWorkflowContext,
): MapWorkflowPreview {
  const issues: MapWorkflowIssue[] = [];
  const guidance: MapWorkflowGuidance[] = [];
  const suggestions: MapWorkflowSuggestedAction[] = [];

  guidance.push({
    step: "source",
    title: "Combined coverage",
    body:
      "Union produces a layer covering A ∪ B. Use it to combine policy scenarios or expand a study area.",
  });

  const layerA = pickLayer(context, draft.layerAId);
  const layerB = pickLayer(context, draft.layerBId);
  validatePolygonPair(draft.layerAId, draft.layerBId, layerA, layerB, issues);
  const crsPreflight = preflightMapWorkflowOperation({
    label: "Union",
    metric: "union",
    sourceLayerIds: [draft.layerAId, draft.layerBId].filter((id): id is string => Boolean(id)),
    context,
    preferEqualArea: true,
  });
  pushCrsPreflightIssue(crsPreflight, "source", issues);

  let featureCollection: FeatureCollection | null = null;
  let workerNeeded = false;
  let previewSampled = false;

  if (
    layerA &&
    layerB &&
    layerA.geometryClass === "polygon" &&
    layerB.geometryClass === "polygon" &&
    layerA.hasGeometry &&
    layerB.hasGeometry &&
    issues.every((entry) => entry.severity !== "blocker")
  ) {
    const sourceA = context.layerSourceMap.get(layerA.id);
    const sourceB = context.layerSourceMap.get(layerB.id);
    if (sourceA && sourceB) {
      workerNeeded =
        sourceA.features.length + sourceB.features.length > MAP_WORKFLOW_WORKER_FEATURE_THRESHOLD;
      const boundedA = boundPreviewSource(sourceA);
      const boundedB = boundPreviewSource(sourceB);
      previewSampled = boundedA.sampled || boundedB.sampled;
      featureCollection = computeUnion(boundedA.source, boundedB.source, draft.dissolve);
    }
  }

  return finalizePreview({
    workflow: "union",
    draft,
    featureCollection,
    geometryClass: "polygon",
    metrics: {
      output_features: featureCollection?.features.length ?? 0,
      input_features_a: layerA?.featureCount ?? 0,
      input_features_b: layerB?.featureCount ?? 0,
      dissolved: draft.dissolve ? 1 : 0,
      area_km2: featureCollection ? safeAreaKm2(featureCollection) : 0,
    },
    bounds: featureCollection ? getFeatureCollectionBounds(featureCollection) ?? null : null,
    issues,
    guidance,
    suggestions,
    needsWorker: workerNeeded,
    previewSampled,
    executionDeferred: workerNeeded && previewSampled,
    crsPreflight,
    context,
  });
}

/* ================================================================== */
/*  Comparison workflow                                                */
/* ================================================================== */

function previewComparison(
  draft: MapWorkflowComparisonDraft,
  context: MapWorkflowContext,
): MapWorkflowPreview {
  const issues: MapWorkflowIssue[] = [];
  const guidance: MapWorkflowGuidance[] = [];
  const suggestions: MapWorkflowSuggestedAction[] = [];

  guidance.push({
    step: "source",
    title: "Pick two visible layers",
    body:
      "Comparison is non-destructive — two visible layers are rendered side-by-side, swiped, or blended without changing source data.",
  });
  guidance.push({
    step: "operation",
    title: "Choose a comparison view",
    body:
      "Split view shows synchronized maps. Swipe sweeps a divider across one canvas. Blend cross-fades the layers via opacity.",
  });

  const layerA = pickLayer(context, draft.layerAId);
  const layerB = pickLayer(context, draft.layerBId);
  if (!draft.layerAId || !draft.layerBId) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "comparison-missing-layer",
      message: "Choose a layer for both A and B.",
    });
  }
  if (draft.layerAId && draft.layerBId && draft.layerAId === draft.layerBId) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "comparison-duplicate",
      message: "Pick two different layers to compare.",
    });
  }
  if (layerA && !layerA.visible) {
    issues.push({
      step: "source",
      severity: "warning",
      code: "comparison-a-hidden",
      message: `Layer A "${layerA.name}" is currently hidden — make it visible to see the comparison.`,
    });
  }
  if (layerB && !layerB.visible) {
    issues.push({
      step: "source",
      severity: "warning",
      code: "comparison-b-hidden",
      message: `Layer B "${layerB.name}" is currently hidden — make it visible to see the comparison.`,
    });
  }

  const swipePosition = clamp01(draft.swipePosition);
  const blendOpacityA = clamp01(draft.blendOpacityA);
  const blendOpacityB = clamp01(draft.blendOpacityB);
  if (draft.swipePosition !== swipePosition) {
    issues.push({
      step: "parameters",
      severity: "info",
      code: "comparison-swipe-clamped",
      message: "Swipe position has been clamped to the [0, 1] range.",
    });
  }

  const ready =
    !!layerA &&
    !!layerB &&
    draft.layerAId !== draft.layerBId &&
    issues.every((entry) => entry.severity !== "blocker");

  const comparisonState: MapWorkflowComparisonStatePreview | undefined =
    layerA && layerB && draft.layerAId && draft.layerBId && draft.layerAId !== draft.layerBId
      ? {
          view: draft.view,
          layerAId: draft.layerAId,
          layerBId: draft.layerBId,
          layerAName: layerA.name,
          layerBName: layerB.name,
          swipePosition,
          blendOpacityA,
          blendOpacityB,
        }
      : undefined;

  return finalizePreview({
    workflow: "comparison",
    draft: { ...draft, swipePosition, blendOpacityA, blendOpacityB },
    featureCollection: null,
    geometryClass: "polygon",
    metrics: {
      view: draft.view,
      swipe_position: swipePosition,
      blend_opacity_a: blendOpacityA,
      blend_opacity_b: blendOpacityB,
      layer_a_visible: layerA?.visible ? 1 : 0,
      layer_b_visible: layerB?.visible ? 1 : 0,
    },
    bounds: null,
    issues,
    guidance,
    suggestions,
    forceCanApply: ready,
    comparisonState,
    context,
  });
}

/* ================================================================== */
/*  Utility — finalize, issue handling                                 */
/* ================================================================== */

function finalizePreview(input: {
  workflow: MapWorkflowKind;
  draft: MapWorkflowDraft;
  featureCollection: FeatureCollection | null;
  geometryClass: MapWorkflowGeometryClass;
  metrics: Record<string, number | string | null>;
  bounds: [number, number, number, number] | null;
  issues: MapWorkflowIssue[];
  guidance: MapWorkflowGuidance[];
  suggestions: MapWorkflowSuggestedAction[];
  context: MapWorkflowContext;
  needsWorker?: boolean | undefined;
  previewSampled?: boolean | undefined;
  executionDeferred?: boolean | undefined;
  forceCanApply?: boolean | undefined;
  crsPreflight?: CrsPreflightResult | undefined;
  comparisonState?: MapWorkflowComparisonStatePreview | undefined;
}): MapWorkflowPreview {
  const blockers = input.issues.filter((entry) => entry.severity === "blocker");
  const featureCount = input.featureCollection?.features.length ?? 0;
  // A deferred (worker) preview can be applied — but only through
  // `executeMapWorkflow`, which produces the full off-thread result.
  const canApply =
    blockers.length === 0 &&
    (input.forceCanApply ?? (featureCount > 0 || Boolean(input.executionDeferred) || input.workflow === "comparison"));

  const nextRequiredStep = blockers[0]?.step ?? null;
  const expectedOutput = buildExpectedOutput(input, featureCount, input.needsWorker);
  const crsPreflight = input.crsPreflight ?? preflightMapWorkflowOperation({
    label: describeMethod({ workflow: input.workflow }),
    metric: input.workflow === "comparison" ? "visual" : "area",
    sourceLayerIds: collectSourceLayerIds(input.draft, input.context),
    context: input.context,
    sourceGeometry: input.featureCollection,
    executionKind: input.workflow === "comparison" ? "geodesic" : "geodesic",
    preferEqualArea: input.workflow !== "comparison",
  });
  const manifest = buildPreviewManifest({
    workflow: input.workflow,
    draft: input.draft,
    context: input.context,
    issues: input.issues,
    metrics: input.metrics,
    bounds: input.bounds,
    featureCount,
    expectedOutput,
    needsWorker: Boolean(input.needsWorker),
    canApply,
    crsPreflight,
  });

  return {
    workflow: input.workflow,
    draft: input.draft,
    featureCollection: input.featureCollection,
    geometryClass: input.geometryClass,
    featureCount,
    bounds: input.bounds,
    metrics: input.metrics,
    expectedOutput,
    manifest,
    issues: input.issues,
    guidance: input.guidance,
    nextRequiredStep,
    canApply,
    needsWorker: Boolean(input.needsWorker),
    ...(input.previewSampled ? { previewSampled: true } : {}),
    ...(input.executionDeferred ? { executionDeferred: true } : {}),
    suggestions: input.suggestions,
    crsPreflight,
    ...(input.comparisonState ? { comparisonState: input.comparisonState } : {}),
  };
}

function buildExpectedOutput(
  input: {
    workflow: MapWorkflowKind;
    draft: MapWorkflowDraft;
    geometryClass: MapWorkflowGeometryClass;
    bounds: [number, number, number, number] | null;
    forceCanApply?: boolean | undefined;
  },
  featureCount: number,
  needsWorker: boolean | undefined,
): MapReproducibilityExpectedOutput {
  const layerName = "name" in input.draft && input.draft.name.trim().length > 0
    ? input.draft.name.trim()
    : null;
  const canProduceOutput = featureCount > 0 || input.workflow === "comparison" || input.forceCanApply === true;

  return {
    layerName,
    geometryClass: input.geometryClass,
    featureCount,
    bounds: input.bounds,
    outputLayerGroup: "analysis",
    needsWorker: Boolean(needsWorker),
    reportCompatible: canProduceOutput,
    dashboardCompatible: canProduceOutput && input.workflow !== "comparison",
    ideCompatible: canProduceOutput,
  };
}

function buildPreviewManifest(input: {
  workflow: MapWorkflowKind;
  draft: MapWorkflowDraft;
  context: MapWorkflowContext;
  issues: MapWorkflowIssue[];
  metrics: Record<string, number | string | null>;
  bounds: [number, number, number, number] | null;
  featureCount: number;
  expectedOutput: MapReproducibilityExpectedOutput;
  needsWorker: boolean;
  canApply: boolean;
  crsPreflight: CrsPreflightResult;
}): MapReproducibilityManifest {
  const createdAt = nowIso(input.context);
  const sourceLayerIds = collectSourceLayerIds(input.draft, input.context);
  const sourceLayers = sourceLayerIds.map((layerId) => buildSourceLayerReference(input.context, layerId, input.workflow));
  const previewOutputLayers = input.canApply && input.workflow !== "comparison"
    ? [{
        layerId: MAP_WORKFLOW_PREVIEW_LAYER_ID,
        role: "preview" as const,
        name: `Preview · ${describeMethod({ workflow: input.workflow })}`,
        sourceKind: "derived" as const,
        featureCount: input.featureCount,
      }]
    : [];
  const operation = describeMethod({ workflow: input.workflow });
  const workflowId = buildWorkflowId(input.workflow, createdAt, sourceLayerIds, input.draft);
  const qaSummary = buildManifestQASummary(input.issues, input.needsWorker);

  return {
    version: MAP_WORKFLOW_MANIFEST_VERSION,
    manifestId: buildManifestId("preview", workflowId, createdAt),
    workflowId,
    status: input.canApply ? "preview" : "blocked",
    createdAt,
    mapContextId: buildMapContextId(input.context, sourceLayerIds),
    operation,
    workflowKind: input.workflow,
    inputLayerIds: sourceLayerIds,
    sourceLayerIds,
    outputLayerIds: previewOutputLayers.map((entry) => entry.layerId),
    sourceLayers,
    outputLayers: previewOutputLayers,
    aoiReference: buildAoiReference(input.draft, input.context),
    viewportBounds: input.context.viewportBounds,
    parameters: collectParameters(input.draft),
    crsSummary: buildManifestCrsSummary(input.context, sourceLayerIds, input.bounds, input.crsPreflight),
    qaSummary,
    expectedOutput: input.expectedOutput,
    handoffReferences: {
      reportItemIds: [],
      dashboardBindingIds: [],
      ideArtifactIds: [],
    },
    qaIssueIds: qaSummary.issueIds,
    sourceDataVersions: buildSourceDataVersions(input.context, sourceLayerIds),
    engine: "MapWorkflowService",
    engineVersion: String(MAP_WORKFLOW_SERVICE_VERSION),
  };
}

function buildAppliedManifest(
  preview: MapWorkflowPreview,
  outputLayers: MapReproducibilityLayerReference[],
  options: {
    createdAt: string;
    reportItemIds?: string[];
  },
): MapReproducibilityManifest {
  return {
    ...preview.manifest,
    manifestId: buildManifestId("applied", preview.manifest.workflowId, options.createdAt),
    status: "applied",
    createdAt: options.createdAt,
    outputLayerIds: outputLayers.map((entry) => entry.layerId),
    outputLayers,
    expectedOutput: {
      ...preview.manifest.expectedOutput,
      layerName: outputLayers[0]?.name ?? preview.manifest.expectedOutput.layerName,
      featureCount: outputLayers[0]?.featureCount ?? preview.manifest.expectedOutput.featureCount,
    },
    handoffReferences: {
      ...preview.manifest.handoffReferences,
      reportItemIds: options.reportItemIds ?? preview.manifest.handoffReferences.reportItemIds,
    },
  };
}

function buildSourceLayerReference(
  context: MapWorkflowContext,
  layerId: string,
  workflow: MapWorkflowKind,
): MapReproducibilityLayerReference {
  const layer = context.layers.find((entry) => entry.id === layerId);
  const reference: MapReproducibilityLayerReference = {
    layerId,
    role: workflow === "comparison" ? "comparison-source" : "source",
  };
  if (layer?.name) reference.name = layer.name;
  if (layer?.sourceKind) reference.sourceKind = layer.sourceKind;
  if (layer?.featureCount !== undefined) reference.featureCount = layer.featureCount;
  return reference;
}

function buildAoiReference(
  draft: MapWorkflowDraft,
  context: MapWorkflowContext,
): MapReproducibilityManifest["aoiReference"] {
  const reference: MapReproducibilityManifest["aoiReference"] = {
    source: draft.kind === "aoi" ? draft.source : "map-context",
    selectedLayerIds: [...context.selectedLayerIds],
    selectedFeatureCount: context.selectedFeatures.length,
    drawnPolygonCount: context.drawnPolygons.length,
  };
  if ("name" in draft && draft.name.trim().length > 0) reference.label = draft.name.trim();
  if (context.viewportBounds) reference.viewportBounds = context.viewportBounds;
  if (context.geocodedPlace?.label) reference.geocodedPlaceLabel = context.geocodedPlace.label;
  return reference;
}

function buildManifestCrsSummary(
  context: MapWorkflowContext,
  sourceLayerIds: string[],
  previewBounds: [number, number, number, number] | null,
  crsPreflight: CrsPreflightResult,
): MapReproducibilityManifest["crsSummary"] {
  if (sourceLayerIds.length === 0) {
    return {
      status: "not-applicable",
      sourceCrs: crsPreflight.sourceCrs,
      displayCrs: crsPreflight.displayCrs,
      executionCrs: crsPreflight.executionCrs,
      executionKind: crsPreflight.executionKind,
      sourceLayerCrs: [],
      missingLayerIds: [],
      notes: buildCrsPreflightNotes(crsPreflight, ["Workflow uses ad-hoc AOI geometry or comparison state without source layer CRS requirements."]),
    };
  }

  const sourceLayerCrs = sourceLayerIds.map((layerId) => {
    const layer = context.layers.find((entry) => entry.id === layerId);
    return { layerId, crs: layer?.crs ?? null };
  });
  const missingLayerIds = sourceLayerCrs
    .filter((entry) => !entry.crs)
    .map((entry) => entry.layerId);
  const uniqueCrs = Array.from(new Set(sourceLayerCrs.map((entry) => entry.crs).filter((crs): crs is string => Boolean(crs))));
  const status = missingLayerIds.length === sourceLayerIds.length
    ? "missing"
    : uniqueCrs.length > 1
      ? "mixed"
      : "known";
  const notes = status === "known"
    ? ["Source CRS metadata is present for workflow traceability."]
    : status === "mixed"
      ? ["Source layers declare more than one CRS; verify projection assumptions before measurement-heavy use."]
      : ["One or more source layers are missing CRS metadata; treat output as needing review."];

  return {
    status,
    sourceCrs: crsPreflight.sourceCrs,
    displayCrs: crsPreflight.displayCrs,
    executionCrs: crsPreflight.executionCrs,
    executionKind: crsPreflight.executionKind,
    sourceLayerCrs,
    missingLayerIds,
    notes: buildCrsPreflightNotes(crsPreflight, notes),
  };
}

function getSourceLayerExtent(
  context: MapWorkflowContext,
  sourceLayerIds: string[],
): [number, number, number, number] | null {
  const extents = sourceLayerIds
    .map((layerId) => {
      const source = context.layerSourceMap.get(layerId);
      return source ? getFeatureCollectionBounds(source) ?? null : null;
    })
    .filter((extent): extent is [number, number, number, number] => Boolean(extent));

  if (extents.length === 0) return null;
  return extents.reduce<[number, number, number, number]>((accumulator, extent) => [
    Math.min(accumulator[0], extent[0]),
    Math.min(accumulator[1], extent[1]),
    Math.max(accumulator[2], extent[2]),
    Math.max(accumulator[3], extent[3]),
  ], extents[0]!);
}

function buildCrsPreflightNotes(preflightResult: CrsPreflightResult, baseNotes: string[]): string[] {
  const notes = [...baseNotes];
  if (preflightResult.reason) {
    notes.push(preflightResult.reason);
  }
  notes.push(...preflightResult.caveats);
  if (preflightResult.executionCrs) {
    notes.push(`Execution CRS ${preflightResult.executionCrs} selected for ${preflightResult.executionKind} metric work.`);
  } else if (preflightResult.blocked) {
    notes.push("Execution CRS is blocked until source CRS metadata is corrected.");
  } else {
    notes.push("Execution CRS is not required for this geodesic or visual display operation.");
  }
  return notes;
}

function buildManifestQASummary(
  issues: MapWorkflowIssue[],
  needsWorker: boolean,
): MapReproducibilityQASummary {
  const blockers = issues.filter((issue) => issue.severity === "blocker");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const info = issues.filter((issue) => issue.severity === "info");
  const caveats = [
    ...warnings.map((issue) => issue.message),
    ...(needsWorker ? ["Large dataset — production runs should execute in a worker for responsiveness."] : []),
  ];

  return {
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "warning" : "passed",
    issueIds: issues.map((issue) => issue.code),
    blockerCount: blockers.length,
    warningCount: warnings.length,
    infoCount: info.length,
    blockers: blockers.map((issue) => issue.message),
    warnings: warnings.map((issue) => issue.message),
    caveats,
  };
}

function buildSourceDataVersions(
  context: MapWorkflowContext,
  sourceLayerIds: string[],
): Record<string, string | null> {
  return sourceLayerIds.reduce<Record<string, string | null>>((accumulator, layerId) => {
    const layer = context.layers.find((entry) => entry.id === layerId);
    accumulator[layerId] = layer?.dataVersion ?? null;
    return accumulator;
  }, {});
}

function buildWorkflowId(
  workflow: MapWorkflowKind,
  createdAt: string,
  sourceLayerIds: string[],
  draft: MapWorkflowDraft,
): string {
  return `map-workflow-${workflow}-${safeIdPart(createdAt)}-${stableHash(`${sourceLayerIds.join("|")}:${JSON.stringify(collectParameters(draft))}`)}`;
}

function buildManifestId(
  status: MapReproducibilityManifest["status"],
  workflowId: string,
  createdAt: string,
): string {
  return `map-manifest-${status}-${safeIdPart(createdAt)}-${stableHash(workflowId)}`;
}

function buildMapContextId(context: MapWorkflowContext, sourceLayerIds: string[]): string {
  return `map-context-${stableHash(JSON.stringify({
    sourceLayerIds,
    viewportBounds: context.viewportBounds,
    selectedLayerIds: context.selectedLayerIds,
    selectedFeatureCount: context.selectedFeatures.length,
    drawnPolygonCount: context.drawnPolygons.length,
    geocodedPlace: context.geocodedPlace?.label ?? null,
    urbanStudyArea: context.urbanStudyArea?.id ?? null,
  }))}`;
}

function safeIdPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "unknown";
}

function stableHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled map workflow variant: ${String(value)}`);
}

function preflightMapWorkflowOperation(input: {
  label: string;
  metric: CrsPreflightMetric;
  sourceLayerIds: string[];
  context: MapWorkflowContext;
  sourceGeometry?: FeatureCollection | null | undefined;
  executionKind?: CrsPreflightResult["executionKind"] | undefined;
  preferEqualArea?: boolean | undefined;
  requiredCrs?: string | null | undefined;
}): CrsPreflightResult {
  const sourceLayers: CrsPreflightLayer[] = input.sourceLayerIds.length > 0
    ? input.sourceLayerIds.map((layerId) => {
        const layer = input.context.layers.find((entry) => entry.id === layerId);
        return {
          id: layerId,
          name: layer?.name ?? layerId,
          crs: layer?.crs ?? null,
        };
      })
    : input.sourceGeometry && input.metric !== "visual" && input.executionKind !== "geodesic"
      ? [{ id: "ad-hoc-geometry", name: "Ad-hoc geometry", crs: null }]
      : [];
  const requiredCrs = input.requiredCrs ?? input.context.urbanRequiredCrs ?? null;
  const operation: CrsPreflightOperation = {
    id: `workflow:${input.metric}`,
    label: input.label,
    metric: input.metric,
    executionKind: input.executionKind ?? "planar",
    ...(requiredCrs ? { requiredCrs } : {}),
    ...(input.preferEqualArea !== undefined ? { preferEqualArea: input.preferEqualArea } : {}),
  };
  return preflightCrs(
    operation,
    sourceLayers,
    input.sourceGeometry ?? getSourceLayerExtent(input.context, input.sourceLayerIds) ?? input.context.viewportBounds,
  );
}

function pushCrsPreflightIssue(
  crsPreflight: CrsPreflightResult,
  step: MapWorkflowStepId,
  issues: MapWorkflowIssue[],
): void {
  if (!crsPreflight.blocked) return;
  issues.push({
    step,
    severity: "blocker",
    code: crsPreflight.remedy ? `crs-${crsPreflight.remedy}` : "crs-preflight-blocked",
    message: crsPreflight.reason ?? "CRS preflight blocked this metric operation.",
    ...(crsPreflight.remedy ? { remedy: crsPreflight.remedy } : {}),
  });
}

function pickLayer(
  context: MapWorkflowContext,
  layerId: string | null,
): MapWorkflowSourceLayerSummary | null {
  if (!layerId) return null;
  return context.layers.find((layer) => layer.id === layerId) ?? null;
}

function validatePolygonPair(
  aId: string | null,
  bId: string | null,
  a: MapWorkflowSourceLayerSummary | null,
  b: MapWorkflowSourceLayerSummary | null,
  issues: MapWorkflowIssue[],
): void {
  if (!aId) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "missing-a",
      message: "Choose a layer for input A.",
    });
  }
  if (!bId) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "missing-b",
      message: "Choose a layer for input B.",
    });
  }
  if (aId && bId && aId === bId) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "duplicate-pair",
      message: "Pick two different layers — they cannot both reference the same source.",
    });
  }
  if (a && a.geometryClass !== "polygon") {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "a-not-polygon",
      message: `Layer A "${a.name}" is ${a.geometryClass}; this operation requires polygon geometry.`,
    });
  }
  if (b && b.geometryClass !== "polygon") {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "b-not-polygon",
      message: `Layer B "${b.name}" is ${b.geometryClass}; this operation requires polygon geometry.`,
    });
  }
  if (a && !a.hasGeometry) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "a-empty",
      message: `Layer A "${a.name}" has no geometry features.`,
    });
  }
  if (b && !b.hasGeometry) {
    issues.push({
      step: "source",
      severity: "blocker",
      code: "b-empty",
      message: `Layer B "${b.name}" has no geometry features.`,
    });
  }
  if (a && a.crs && b && b.crs && a.crs !== b.crs) {
    issues.push({
      step: "source",
      severity: "warning",
      code: "crs-mismatch",
      message: `CRS mismatch: ${a.crs} vs ${b.crs}. Reproject before relying on results.`,
    });
  }
}

function validateBufferDistance(
  meters: number,
  step: MapWorkflowStepId,
): MapWorkflowIssue | null {
  if (!Number.isFinite(meters) || meters < MAP_WORKFLOW_BUFFER_MIN_DISTANCE) {
    return {
      step,
      severity: "blocker",
      code: "buffer-distance-invalid",
      message: "Buffer distance must be a non-negative finite number.",
    };
  }
  if (meters > MAP_WORKFLOW_BUFFER_MAX_METERS) {
    return {
      step,
      severity: "blocker",
      code: "buffer-distance-too-large",
      message: "Buffer distance exceeds the safe upper bound (≈ 20 000 km).",
    };
  }
  return null;
}

/* ================================================================== */
/*  Geometry helpers — pure                                            */
/* ================================================================== */

export function unitToMeters(value: number, unit: MapWorkflowDistanceUnit): number {
  if (!Number.isFinite(value)) return Number.NaN;
  return value * METERS_PER_UNIT[unit];
}

export function metersToUnit(meters: number, unit: MapWorkflowDistanceUnit): number {
  if (!Number.isFinite(meters)) return Number.NaN;
  return meters / METERS_PER_UNIT[unit];
}

export function classifyGeometry(geometryType: string): MapWorkflowGeometryClass {
  const lower = (geometryType ?? "").toLowerCase();
  if (lower.includes("point")) return "point";
  if (lower.includes("line")) return "line";
  if (lower.includes("polygon")) return "polygon";
  if (lower.includes("mixed")) return "mixed";
  return "unknown";
}

function classifyFeatureCollectionGeometry(fc: FeatureCollection): MapWorkflowGeometryClass {
  return classifyGeometry(inferGeometryType(fc));
}

function inferSelectedLayerIds(features: Array<Feature<Geometry>>): string[] {
  const ids = new Set<string>();
  for (const feature of features) {
    const layerId = feature.properties?.__selection_layer_id;
    if (typeof layerId === "string" && layerId.trim()) {
      ids.add(layerId);
    }
  }
  return Array.from(ids);
}

export function bboxToPolygonFeature(
  bbox: [number, number, number, number],
  label: string,
): Feature<Polygon> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return {
    type: "Feature",
    properties: { aoi_label: label },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ],
      ],
    },
  };
}

export function isFiniteBounds(bbox: [number, number, number, number]): boolean {
  return (
    bbox.length === 4 &&
    bbox.every((value) => Number.isFinite(value)) &&
    bbox[0] <= bbox[2] &&
    bbox[1] <= bbox[3]
  );
}

function coerceLayerToFeatureCollection(layer: OverlayLayerConfig): FeatureCollection | null {
  const data = layer.sourceData;
  if (!data || typeof data === "string") return null;
  if ((data as FeatureCollection).type === "FeatureCollection") {
    return data as FeatureCollection;
  }
  if ((data as Feature).type === "Feature") {
    const feature = data as Feature;
    return { type: "FeatureCollection", features: [feature] };
  }
  // Geometry primitive
  const geometry = data as Geometry;
  if (geometry && (geometry as Geometry).type) {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: geometry as Geometry,
        },
      ],
    };
  }
  return null;
}

function inferGeometryType(fc: FeatureCollection | null): string {
  if (!fc || fc.features.length === 0) return "Unknown";
  const types = new Set<string>();
  for (const feature of fc.features) {
    if (feature.geometry?.type) types.add(feature.geometry.type);
  }
  if (types.size === 1) return Array.from(types)[0]!;
  return "Mixed";
}

function applyBufferToFeature(
  geometry: Feature<Polygon | MultiPolygon>,
  meters: number,
): Feature<Polygon | MultiPolygon> | null {
  try {
    const buffered = turf.buffer(geometry, meters, { units: "meters" });
    if (!buffered) return null;
    return buffered as Feature<Polygon | MultiPolygon>;
  } catch {
    return null;
  }
}

function featuresToPolygon(
  features: Array<Feature<Geometry>>,
  label: string,
): Feature<Polygon | MultiPolygon> | null {
  const polygons: Array<Feature<Polygon | MultiPolygon>> = [];
  const others: Array<Feature<Geometry>> = [];

  for (const feature of features) {
    if (!feature.geometry) continue;
    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
      polygons.push(feature as Feature<Polygon | MultiPolygon>);
    } else {
      others.push(feature);
    }
  }

  if (polygons.length > 0 && others.length === 0) {
    return mergePolygons(polygons, label);
  }

  // Fall back to convex hull when geometry is mixed or non-polygonal.
  try {
    const fc: FeatureCollection = {
      type: "FeatureCollection",
      features: features.filter((f) => f.geometry),
    };
    const hull = turf.convex(fc);
    if (!hull) return null;
    hull.properties = { aoi_label: label };
    return hull as Feature<Polygon | MultiPolygon>;
  } catch {
    return null;
  }
}

function safeAreaKm2(fc: FeatureCollection): number {
  try {
    const m2 = turf.area(fc);
    if (!Number.isFinite(m2)) return 0;
    return Math.max(0, m2 / 1_000_000);
  } catch {
    return 0;
  }
}

function clampSegments(value: number): number {
  if (!Number.isFinite(value)) return 32;
  return Math.min(256, Math.max(4, Math.round(value)));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function formatBounds(bounds: [number, number, number, number]): string {
  return `[${bounds.map((value) => value.toFixed(3)).join(", ")}]`;
}

/* ================================================================== */
/*  Apply helpers — derived layer construction                         */
/* ================================================================== */

function buildDerivedLayer(
  preview: MapWorkflowPreview,
  context: MapWorkflowContext,
): OverlayLayerConfig {
  if (!preview.featureCollection) {
    throw new Error("Cannot build derived layer without a feature collection.");
  }

  const draft = preview.draft;
  const sourceLayerIds = collectSourceLayerIds(draft, context);
  const layerName = "name" in draft ? draft.name : `${preview.workflow} result`;
  const layerId = `derived:${preview.workflow}:${sourceLayerIds.join("__") || "ad-hoc"}:${nowIso(context)}`;

  const baseMetadata = buildFeatureCollectionMetadata(preview.featureCollection);
  const provenance: LayerProvenance = {
    label: `${layerName}`,
    method: describeMethod(preview),
    generatedAt: nowIso(context),
    sourceLayerIds,
    notes: collectProvenanceNotes(preview, context),
  };

  const qaMetadata = buildDerivedQAMetadata(preview, context, sourceLayerIds);
  const metadata: LayerMetadata = {
    ...baseMetadata,
    updatedAt: nowIso(context),
    scientificQA: qaMetadata,
  };

  return {
    id: layerId,
    name: layerName,
    type: "geojson",
    visible: true,
    opacity: 0.65,
    sourceData: preview.featureCollection,
    queryable: true,
    sourceKind: "derived",
    group: "analysis",
    provenance,
    qaStatus: qaMetadata.status,
    metadata,
  };
}

function buildDerivedQAMetadata(
  preview: MapWorkflowPreview,
  context: MapWorkflowContext,
  sourceLayerIds: string[],
): LayerScientificQAMetadata {
  const warnings = preview.issues.filter((entry) => entry.severity === "warning");
  const status: LayerQaStatus = warnings.length === 0 ? "passed" : "warning";
  const caveats = collectCaveats(preview);
  const signature = buildQaSignature(preview, sourceLayerIds);
  return {
    status,
    issueIds: warnings.map((entry) => entry.code),
    badges: collectBadges(preview, context, sourceLayerIds),
    checkedAt: nowIso(context),
    featureIssueCount: 0,
    usedWorker: preview.needsWorker,
    caveats,
    signature,
  };
}

function collectBadges(
  preview: MapWorkflowPreview,
  context: MapWorkflowContext,
  sourceLayerIds: string[],
): LayerScientificQAMetadata["badges"] {
  const badges: LayerScientificQAMetadata["badges"] = [];
  let inheritsDemo = false;
  let missingCrs = false;
  for (const layerId of sourceLayerIds) {
    const summary = context.layers.find((layer) => layer.id === layerId);
    if (!summary) continue;
    if (summary.sourceKind === "demo") inheritsDemo = true;
    if (!summary.crs) missingCrs = true;
  }
  if (inheritsDemo) badges.push("sample_data");
  if (missingCrs) badges.push("missing_crs");
  if (preview.workflow === "comparison") badges.push("uncertain_output");
  return badges;
}

function collectCaveats(preview: MapWorkflowPreview): string[] {
  const caveats: string[] = [];
  for (const issue of preview.issues) {
    if (issue.severity === "warning") caveats.push(issue.message);
  }
  if (preview.workflow === "intersect" && preview.featureCount === 0) {
    caveats.push("Intersection produced no overlapping features.");
  }
  if (preview.needsWorker) {
    caveats.push("Large dataset — production runs should execute in a worker for responsiveness.");
  }
  caveats.push(...preview.crsPreflight.caveats);
  return caveats;
}

function collectSourceLayerIds(draft: MapWorkflowDraft, context?: MapWorkflowContext): string[] {
  switch (draft.kind) {
    case "buffer":
      if ((draft.sourceMode ?? "layer") === "selected-features") {
        return context?.selectedLayerIds ?? [];
      }
      return draft.sourceLayerId ? [draft.sourceLayerId] : [];
    case "intersect":
    case "union":
      return [draft.layerAId, draft.layerBId].filter((id): id is string => Boolean(id));
    case "difference":
      return [draft.minuendLayerId, draft.subtrahendLayerId].filter((id): id is string => Boolean(id));
    case "comparison":
      return [draft.layerAId, draft.layerBId].filter((id): id is string => Boolean(id));
    case "aoi":
      if (draft.source === "selected-features") {
        return context?.selectedLayerIds ?? [];
      }
      return [];
    default:
      return [];
  }
}

function collectParameters(draft: MapWorkflowDraft): Record<string, unknown> {
  return JSON.parse(JSON.stringify(draft));
}

function collectProvenanceNotes(
  preview: MapWorkflowPreview,
  _context: MapWorkflowContext,
): string[] {
  const notes: string[] = [];
  notes.push(`Workflow version v${MAP_WORKFLOW_SERVICE_VERSION}`);
  if (preview.needsWorker) {
    notes.push("Large dataset detected — recommend worker dispatch.");
  }
  if (preview.workflow === "buffer") {
    const meters = (preview.draft as MapWorkflowBufferDraft).distance
      ? unitToMeters(
          (preview.draft as MapWorkflowBufferDraft).distance,
          (preview.draft as MapWorkflowBufferDraft).unit,
        )
      : 0;
    notes.push(`Geodesic buffer @ ${meters.toFixed(2)} m`);
  }
  return notes;
}

function describeMethod(preview: Pick<MapWorkflowPreview, "workflow">): string {
  switch (preview.workflow) {
    case "aoi":
      return "AOI construction (viewport / selection / drawn / geocoded / Urban study area)";
    case "buffer":
      return "Geodesic buffer";
    case "intersect":
      return "Pairwise polygon intersection";
    case "difference":
      return "Polygon difference (A − B, dissolved subtrahend)";
    case "union":
      return "Polygon union";
    case "comparison":
      return "Synchronized comparison view";
  }
  return assertNever(preview.workflow);
}

function describeWorkflow(preview: MapWorkflowPreview): string {
  switch (preview.workflow) {
    case "aoi": {
      const draft = preview.draft as MapWorkflowAOIDraft;
      return `AOI from ${MAP_WORKFLOW_AOI_SOURCE_LABELS[draft.source]} (buffer ${draft.bufferDistance} ${MAP_WORKFLOW_DISTANCE_UNIT_LABELS[draft.bufferUnit]})`;
    }
    case "buffer": {
      const draft = preview.draft as MapWorkflowBufferDraft;
      return `Buffer @ ${draft.distance} ${MAP_WORKFLOW_DISTANCE_UNIT_LABELS[draft.unit]}${draft.dissolve ? " · dissolved" : ""}`;
    }
    case "intersect":
      return "Polygon intersection";
    case "difference":
      return "Polygon difference (A minus B)";
    case "union": {
      const draft = preview.draft as MapWorkflowUnionDraft;
      return draft.dissolve ? "Polygon union (dissolved)" : "Polygon union (preserved features)";
    }
    case "comparison": {
      const draft = preview.draft as MapWorkflowComparisonDraft;
      return `Comparison view (${MAP_WORKFLOW_COMPARISON_VIEW_LABELS[draft.view]})`;
    }
  }
  return assertNever(preview.workflow);
}

function buildQaSignature(preview: MapWorkflowPreview, sourceLayerIds: string[]): string {
  const parts = [
    `wf:${preview.workflow}`,
    `src:${sourceLayerIds.join("|") || "none"}`,
    `count:${preview.featureCount}`,
    `worker:${preview.needsWorker ? 1 : 0}`,
  ];
  return parts.join(";");
}

function nowIso(context: MapWorkflowContext): string {
  return (context.now ?? new Date()).toISOString();
}
