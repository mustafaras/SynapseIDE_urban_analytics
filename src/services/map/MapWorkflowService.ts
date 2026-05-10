/* ================================================================== */
/*  MapWorkflowService                                                 */
/*                                                                     */
/*  Prompt 31 — AOI, Selection, Buffer & Comparison Workflows.        */
/*                                                                     */
/*  Provides explicit, scientific, transparent guided workflows for:  */
/*                                                                    */
/*    - AOI creation (viewport, drawn polygon, selected features,    */
/*      geocoded place)                                              */
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

import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";
import * as turf from "@turf/turf";
import type {
  LayerMetadata,
  LayerProvenance,
  LayerQaStatus,
  LayerScientificQAMetadata,
  LayerSourceKind,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import {
  buildFeatureCollectionMetadata,
  getFeatureCollectionBounds,
} from "./MapDataImporter";

/* ================================================================== */
/*  Versioning & constants                                             */
/* ================================================================== */

export const MAP_WORKFLOW_SERVICE_VERSION = 1;

/** Threshold above which large datasets should be processed in a worker. */
export const MAP_WORKFLOW_WORKER_FEATURE_THRESHOLD = 5_000;

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
  | "geocoded-place";

export const MAP_WORKFLOW_AOI_SOURCE_LABELS: Record<MapWorkflowAOISourceKind, string> = {
  viewport: "Current viewport",
  "selected-features": "Selected features",
  "drawn-polygon": "Drawn polygon",
  "geocoded-place": "Geocoded place",
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

export interface MapWorkflowContext {
  layers: MapWorkflowSourceLayerSummary[];
  layerSourceMap: Map<string, FeatureCollection>;
  selectedFeatures: Array<Feature<Geometry>>;
  selectedLayerIds: string[];
  drawnPolygons: Array<Feature<Polygon | MultiPolygon>>;
  viewportBounds: [number, number, number, number] | null;
  geocodedPlace: MapWorkflowGeocodedPlace | null;
  now?: Date;
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
  issues: MapWorkflowIssue[];
  guidance: MapWorkflowGuidance[];
  nextRequiredStep: MapWorkflowStepId | null;
  canApply: boolean;
  needsWorker: boolean;
  suggestions: MapWorkflowSuggestedAction[];
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

  if (!preview.featureCollection) {
    return null;
  }

  const layer = buildDerivedLayer(preview, context);
  const sourceLayerIds = collectSourceLayerIds(preview.draft, context);
  const reportItem: MapWorkflowReportItem = {
    id: `wf:${preview.workflow}:${nowIso(context)}:${layer.id}`,
    workflow: preview.workflow,
    title: layer.name,
    description: describeWorkflow(preview),
    derivedLayerId: layer.id,
    sourceLayerIds,
    parameters: collectParameters(preview.draft),
    metrics: preview.metrics,
    caveats: collectCaveats(preview),
    createdAt: nowIso(context),
  };

  return { layer, preview, reportItem };
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

  const reportItem: MapWorkflowReportItem = {
    id: `wf:comparison:${nowIso(context)}:${layerId}`,
    workflow: "comparison",
    title: draft.name,
    description: describeWorkflow(preview),
    derivedLayerId: layerId,
    sourceLayerIds: [draft.layerAId!, draft.layerBId!],
    parameters: collectParameters(draft),
    metrics: preview.metrics,
    caveats: collectCaveats(preview),
    comparisonState: preview.comparisonState,
    createdAt: nowIso(context),
  };

  return { layer, preview, reportItem };
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
  if (source && meters > 0 && !distanceIssue && issues.every((entry) => entry.severity !== "blocker")) {
    workerNeeded = source.features.length > MAP_WORKFLOW_WORKER_FEATURE_THRESHOLD;
    featureCollection = computeBuffer(source, meters, {
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

  let featureCollection: FeatureCollection | null = null;
  let workerNeeded = false;
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
      const result = computeIntersect(sourceA, sourceB, draft.preserveAttributes);
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

  let featureCollection: FeatureCollection | null = null;
  let workerNeeded = false;

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
      featureCollection = computeDifference(sourceA, sourceB);
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

  let featureCollection: FeatureCollection | null = null;
  let workerNeeded = false;

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
      featureCollection = computeUnion(sourceA, sourceB, draft.dissolve);
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
  needsWorker?: boolean | undefined;
  forceCanApply?: boolean | undefined;
  comparisonState?: MapWorkflowComparisonStatePreview | undefined;
}): MapWorkflowPreview {
  const blockers = input.issues.filter((entry) => entry.severity === "blocker");
  const featureCount = input.featureCollection?.features.length ?? 0;
  const canApply =
    blockers.length === 0 &&
    (input.forceCanApply ?? (featureCount > 0 || input.workflow === "comparison"));

  const nextRequiredStep = blockers[0]?.step ?? null;

  return {
    workflow: input.workflow,
    draft: input.draft,
    featureCollection: input.featureCollection,
    geometryClass: input.geometryClass,
    featureCount,
    bounds: input.bounds,
    metrics: input.metrics,
    issues: input.issues,
    guidance: input.guidance,
    nextRequiredStep,
    canApply,
    needsWorker: Boolean(input.needsWorker),
    suggestions: input.suggestions,
    ...(input.comparisonState ? { comparisonState: input.comparisonState } : {}),
  };
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

function mergePolygons(
  polygons: Array<Feature<Polygon | MultiPolygon>>,
  label = "AOI",
): Feature<Polygon | MultiPolygon> | null {
  if (polygons.length === 0) return null;
  if (polygons.length === 1) {
    const cloned = JSON.parse(JSON.stringify(polygons[0])) as Feature<Polygon | MultiPolygon>;
    cloned.properties = { ...(cloned.properties ?? {}), aoi_label: label };
    return cloned;
  }
  let acc: Feature<Polygon | MultiPolygon> | null = null;
  for (const polygon of polygons) {
    if (!acc) {
      acc = polygon;
      continue;
    }
    try {
      const fc = turf.featureCollection([acc, polygon]);
      const merged = turf.union(fc);
      if (merged) {
        acc = merged as Feature<Polygon | MultiPolygon>;
      }
    } catch {
      // skip
    }
  }
  if (acc) {
    acc.properties = { ...(acc.properties ?? {}), aoi_label: label };
  }
  return acc;
}

function computeBuffer(
  source: FeatureCollection,
  meters: number,
  options: { segments: number; dissolve: boolean; sourceLayerId: string },
): FeatureCollection {
  const buffered: Feature<Polygon | MultiPolygon>[] = [];
  for (const feature of source.features) {
    if (!feature.geometry) continue;
    try {
      const result = turf.buffer(feature, meters, {
        units: "meters",
        steps: options.segments,
      });
      if (!result) continue;
      const cloned = result as Feature<Polygon | MultiPolygon>;
      cloned.properties = {
        ...(feature.properties ?? {}),
        __buffer_meters: meters,
        __buffer_source_id: feature.id ?? null,
        __buffer_source_layer: options.sourceLayerId,
      };
      buffered.push(cloned);
    } catch {
      // skip
    }
  }

  if (options.dissolve && buffered.length > 1) {
    const merged = mergePolygons(buffered, "buffered_dissolved");
    if (merged) {
      merged.properties = {
        __buffer_meters: meters,
        __buffer_source_layer: options.sourceLayerId,
        __dissolved: true,
        __input_features: source.features.length,
      };
      return { type: "FeatureCollection", features: [merged] };
    }
  }

  return { type: "FeatureCollection", features: buffered };
}

function computeIntersect(
  sourceA: FeatureCollection,
  sourceB: FeatureCollection,
  preserveAttributes: "a" | "b" | "both",
): { featureCollection: FeatureCollection; pairCount: number } {
  const features: Feature[] = [];
  let pairCount = 0;
  for (const a of sourceA.features) {
    if (!isPolygonGeometry(a.geometry)) continue;
    for (const b of sourceB.features) {
      if (!isPolygonGeometry(b.geometry)) continue;
      try {
        const fc = turf.featureCollection([
          a as Feature<Polygon | MultiPolygon>,
          b as Feature<Polygon | MultiPolygon>,
        ]);
        const result = turf.intersect(fc);
        if (!result) continue;
        pairCount += 1;
        const properties: Record<string, unknown> = {};
        if (preserveAttributes === "a" || preserveAttributes === "both") {
          for (const [key, value] of Object.entries(a.properties ?? {})) {
            properties[`a_${key}`] = value;
          }
        }
        if (preserveAttributes === "b" || preserveAttributes === "both") {
          for (const [key, value] of Object.entries(b.properties ?? {})) {
            properties[`b_${key}`] = value;
          }
        }
        properties.__intersect_pair_index = pairCount;
        features.push({
          ...(result as Feature),
          properties,
        });
      } catch {
        // skip
      }
    }
  }
  return {
    featureCollection: { type: "FeatureCollection", features },
    pairCount,
  };
}

function computeDifference(
  sourceA: FeatureCollection,
  sourceB: FeatureCollection,
): FeatureCollection {
  const dissolveB = mergeAllPolygons(sourceB);
  if (!dissolveB) {
    return { type: "FeatureCollection", features: [] };
  }
  const features: Feature[] = [];
  for (const a of sourceA.features) {
    if (!isPolygonGeometry(a.geometry)) continue;
    try {
      const fc = turf.featureCollection([
        a as Feature<Polygon | MultiPolygon>,
        dissolveB,
      ]);
      const result = turf.difference(fc);
      if (!result) continue;
      const properties = { ...(a.properties ?? {}), __difference: true };
      features.push({
        ...(result as Feature),
        properties,
      });
    } catch {
      // skip
    }
  }
  return { type: "FeatureCollection", features };
}

function computeUnion(
  sourceA: FeatureCollection,
  sourceB: FeatureCollection,
  dissolve: boolean,
): FeatureCollection {
  const allPolygons: Array<Feature<Polygon | MultiPolygon>> = [];
  for (const feature of sourceA.features) {
    if (isPolygonGeometry(feature.geometry)) {
      allPolygons.push({ ...(feature as Feature<Polygon | MultiPolygon>), properties: { ...(feature.properties ?? {}), __union_origin: "A" } });
    }
  }
  for (const feature of sourceB.features) {
    if (isPolygonGeometry(feature.geometry)) {
      allPolygons.push({ ...(feature as Feature<Polygon | MultiPolygon>), properties: { ...(feature.properties ?? {}), __union_origin: "B" } });
    }
  }

  if (!dissolve) {
    return { type: "FeatureCollection", features: allPolygons };
  }

  const merged = mergePolygons(allPolygons, "union_dissolved");
  if (!merged) {
    return { type: "FeatureCollection", features: allPolygons };
  }
  merged.properties = { ...(merged.properties ?? {}), __dissolved: true };
  return { type: "FeatureCollection", features: [merged] };
}

function mergeAllPolygons(
  source: FeatureCollection,
): Feature<Polygon | MultiPolygon> | null {
  const polygons = source.features.filter(
    (feature): feature is Feature<Polygon | MultiPolygon> => isPolygonGeometry(feature.geometry),
  );
  return mergePolygons(polygons);
}

function isPolygonGeometry(geometry: Geometry | null | undefined): boolean {
  return !!geometry && (geometry.type === "Polygon" || geometry.type === "MultiPolygon");
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

function describeMethod(preview: MapWorkflowPreview): string {
  switch (preview.workflow) {
    case "aoi":
      return "AOI construction (viewport / selection / drawn / geocoded)";
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
