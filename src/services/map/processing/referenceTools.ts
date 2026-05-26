/* ==================================================================== */
/*  Reference processing tools — Prompt 24a                              */
/*                                                                        */
/*  Three tools wired end-to-end as the toolbox reference implementation: */
/*    • buffer           (requires a projected CRS — planar metric work)  */
/*    • centroid         (display-geometry reduction, caveated)           */
/*    • attribute-filter (attribute selection, no CRS)                    */
/*                                                                        */
/*  Each executor is pure: given params + an input layer it returns a     */
/*  preview (preflight verdict + caveats + computed output features +     */
/*  logs). MapProcessingExecutor turns an OK preview into a derived layer */
/*  and routes it through the P9 command lifecycle so the apply is        */
/*  audited and carries a reproducibility manifest.                       */
/* ==================================================================== */

import * as turf from "@turf/turf";
import type { Feature, FeatureCollection } from "geojson";
import type {
  CrsPreflightResult,
  ProcessingToolDescriptor,
} from "@/services/map/contracts/gisContracts";
import type {
  MapReproducibilityCrsSummary,
  MapReproducibilityExpectedOutput,
  MapReproducibilityLayerReference,
  MapReproducibilityManifest,
  MapReproducibilityQASummary,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import { resolveOverlayLayerCrsSummary } from "@/centerpanel/components/map/mapLayerMetadata";
import { CrsPreflight } from "@/services/map/crs/CrsPreflight";

/* -------------------------------------------------------------------- */
/*  Executor contract                                                    */
/* -------------------------------------------------------------------- */

export interface ProcessingToolInputs {
  params: Readonly<Record<string, unknown>>;
  inputLayer: OverlayLayerConfig;
}

export interface ProcessingToolPreview {
  /** True when the tool can be applied (no blockers). */
  ok: boolean;
  /** Hard reasons the tool cannot run (shown before apply). */
  blockers: string[];
  /** Truthful caveats that travel into the manifest/evidence. */
  caveats: string[];
  /** Human-readable run log lines. */
  logs: string[];
  /** CRS preflight verdict, when the tool ran one. */
  crs: CrsPreflightResult | null;
  /** Computed output features (empty collection when blocked). */
  outputFeatures: FeatureCollection;
  outputFeatureCount: number;
  outputGeometryClass: string;
  /** Normalized parameter record recorded in the manifest. */
  parameters: Record<string, unknown>;
}

export interface ProcessingToolExecutor {
  descriptor: ProcessingToolDescriptor;
  preview(inputs: ProcessingToolInputs): ProcessingToolPreview;
}

/* -------------------------------------------------------------------- */
/*  Shared helpers                                                       */
/* -------------------------------------------------------------------- */

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

function layerFeatures(layer: OverlayLayerConfig): Feature[] {
  const data = layer.sourceData as FeatureCollection | undefined;
  if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) return [];
  return data.features as Feature[];
}

function featureCollection(features: Feature[]): FeatureCollection {
  return { type: "FeatureCollection", features };
}

function geometryClassOf(features: Feature[], fallback: string): string {
  const types = new Set(features.map((feature) => feature.geometry?.type).filter(Boolean) as string[]);
  if (types.size === 0) return fallback;
  if (types.size === 1) return [...types][0]!;
  return "GeometryCollection";
}

/* -------------------------------------------------------------------- */
/*  Buffer                                                               */
/* -------------------------------------------------------------------- */

const bufferTool: ProcessingToolExecutor = {
  descriptor: {
    toolId: "buffer",
    title: "Buffer",
    category: "Geometry",
    summary:
      "Expand each feature by a fixed distance to produce buffer polygons. Requires a projected source CRS for metric-accurate distances.",
    parameters: [
      { key: "layer", label: "Input layer", type: "layer", required: true },
      {
        key: "distanceMeters",
        label: "Distance (meters)",
        type: "number",
        required: true,
        defaultValue: 100,
        help: "Buffer radius in meters; must be greater than zero.",
      },
    ],
    requiresCrs: true,
    executionMode: "main-preview",
    qaGated: true,
    urbanMethodIds: [],
    implemented: true,
  },
  preview({ params, inputLayer }): ProcessingToolPreview {
    const logs: string[] = [`buffer: input layer "${inputLayer.name}" (${inputLayer.id})`];
    const blockers: string[] = [];
    const features = layerFeatures(inputLayer);
    if (features.length === 0) blockers.push("Input layer has no features to buffer.");

    const distanceMeters = Number(params.distanceMeters);
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
      blockers.push("Provide a buffer distance in meters greater than zero.");
    }

    const layerCrs = resolveOverlayLayerCrsSummary(inputLayer).crs;
    const crs = CrsPreflight.preflight(
      { id: "buffer", label: "Buffer", metric: "buffer", executionKind: "planar", displayCrs: "EPSG:4326" },
      [{ id: inputLayer.id, name: inputLayer.name, crs: layerCrs }],
    );
    logs.push(`buffer: CRS preflight ${crs.ok ? "passed" : "blocked"} (source ${layerCrs ?? "unknown"})`);
    if (crs.blocked && crs.reason) blockers.push(crs.reason);

    const caveats = [...crs.caveats];
    if (blockers.length > 0) {
      return {
        ok: false,
        blockers,
        caveats,
        logs,
        crs,
        outputFeatures: EMPTY_FC,
        outputFeatureCount: 0,
        outputGeometryClass: "Polygon",
        parameters: { distanceMeters },
      };
    }

    const radiusKm = distanceMeters / 1000;
    const buffered: Feature[] = [];
    for (const feature of features) {
      try {
        const result = turf.buffer(feature as never, radiusKm, { units: "kilometers", steps: 8 });
        if (result) buffered.push(result as Feature);
      } catch {
        /* skip features turf cannot buffer; reported via the count delta */
      }
    }
    if (buffered.length < features.length) {
      caveats.push(
        `${features.length - buffered.length} of ${features.length} features could not be buffered and were skipped.`,
      );
    }
    caveats.push(
      "Reference buffer computed with @turf/turf on the layer geometry; the worker/geos-wasm path (Prompt 13) is used for production-scale metric buffering.",
    );
    logs.push(`buffer: produced ${buffered.length} polygon(s) at ${distanceMeters} m`);

    return {
      ok: true,
      blockers: [],
      caveats,
      logs,
      crs,
      outputFeatures: featureCollection(buffered),
      outputFeatureCount: buffered.length,
      outputGeometryClass: "Polygon",
      parameters: { distanceMeters, units: "meters" },
    };
  },
};

/* -------------------------------------------------------------------- */
/*  Centroid                                                             */
/* -------------------------------------------------------------------- */

const centroidTool: ProcessingToolExecutor = {
  descriptor: {
    toolId: "centroid",
    title: "Centroid",
    category: "Geometry",
    summary: "Reduce each feature to its centroid point, preserving attributes.",
    parameters: [{ key: "layer", label: "Input layer", type: "layer", required: true }],
    requiresCrs: false,
    executionMode: "main-preview",
    qaGated: false,
    urbanMethodIds: [],
    implemented: true,
  },
  preview({ inputLayer }): ProcessingToolPreview {
    const logs: string[] = [`centroid: input layer "${inputLayer.name}" (${inputLayer.id})`];
    const features = layerFeatures(inputLayer);
    if (features.length === 0) {
      return {
        ok: false,
        blockers: ["Input layer has no features to reduce to centroids."],
        caveats: [],
        logs,
        crs: null,
        outputFeatures: EMPTY_FC,
        outputFeatureCount: 0,
        outputGeometryClass: "Point",
        parameters: {},
      };
    }

    const layerCrs = resolveOverlayLayerCrsSummary(inputLayer).crs;
    const crs = CrsPreflight.preflight(
      { id: "centroid", label: "Centroid", metric: "visual", executionKind: "geodesic", displayCrs: "EPSG:4326" },
      [{ id: inputLayer.id, name: inputLayer.name, crs: layerCrs }],
    );
    const caveats = [
      "Centroids are computed on EPSG:4326 display geometry; reproject for metric-accurate centroids.",
      ...crs.caveats,
    ];

    const centroids: Feature[] = [];
    for (const feature of features) {
      try {
        const result = turf.centroid(feature as never, { properties: feature.properties ?? {} });
        centroids.push(result as Feature);
      } catch {
        /* skip degenerate geometry */
      }
    }
    if (centroids.length < features.length) {
      caveats.push(`${features.length - centroids.length} feature(s) had no computable centroid and were skipped.`);
    }
    logs.push(`centroid: produced ${centroids.length} point(s)`);

    return {
      ok: centroids.length > 0,
      blockers: centroids.length > 0 ? [] : ["No centroids could be computed from the input geometry."],
      caveats,
      logs,
      crs,
      outputFeatures: featureCollection(centroids),
      outputFeatureCount: centroids.length,
      outputGeometryClass: "Point",
      parameters: {},
    };
  },
};

/* -------------------------------------------------------------------- */
/*  Attribute filter                                                     */
/* -------------------------------------------------------------------- */

const FILTER_OPERATORS = ["=", "!=", ">", ">=", "<", "<=", "contains"] as const;
type FilterOperator = (typeof FILTER_OPERATORS)[number];

function matchesFilter(actual: unknown, operator: FilterOperator, value: string): boolean {
  if (operator === "contains") {
    return String(actual ?? "").toLowerCase().includes(value.toLowerCase());
  }
  const numericActual = Number(actual);
  const numericValue = Number(value);
  const bothNumeric = Number.isFinite(numericActual) && Number.isFinite(numericValue) && value.trim() !== "";
  switch (operator) {
    case "=":
      return bothNumeric ? numericActual === numericValue : String(actual ?? "") === value;
    case "!=":
      return bothNumeric ? numericActual !== numericValue : String(actual ?? "") !== value;
    case ">":
      return bothNumeric && numericActual > numericValue;
    case ">=":
      return bothNumeric && numericActual >= numericValue;
    case "<":
      return bothNumeric && numericActual < numericValue;
    case "<=":
      return bothNumeric && numericActual <= numericValue;
    default:
      return false;
  }
}

const attributeFilterTool: ProcessingToolExecutor = {
  descriptor: {
    toolId: "attribute-filter",
    title: "Attribute filter",
    category: "Selection",
    summary: "Keep only features whose attribute matches a comparison. No CRS required.",
    parameters: [
      { key: "layer", label: "Input layer", type: "layer", required: true },
      { key: "field", label: "Field", type: "field", required: true },
      {
        key: "operator",
        label: "Operator",
        type: "enum",
        required: true,
        enumValues: [...FILTER_OPERATORS],
        defaultValue: "=",
      },
      { key: "value", label: "Value", type: "text", required: true },
    ],
    requiresCrs: false,
    executionMode: "main-preview",
    qaGated: false,
    urbanMethodIds: [],
    implemented: true,
  },
  preview({ params, inputLayer }): ProcessingToolPreview {
    const logs: string[] = [`attribute-filter: input layer "${inputLayer.name}" (${inputLayer.id})`];
    const blockers: string[] = [];
    const features = layerFeatures(inputLayer);
    if (features.length === 0) blockers.push("Input layer has no features to filter.");

    const field = typeof params.field === "string" ? params.field.trim() : "";
    if (!field) blockers.push("Choose a field to filter on.");

    const rawOperator = typeof params.operator === "string" ? params.operator : "=";
    const operator: FilterOperator = (FILTER_OPERATORS as readonly string[]).includes(rawOperator)
      ? (rawOperator as FilterOperator)
      : "=";

    const value = params.value === undefined || params.value === null ? "" : String(params.value);
    if (value.trim() === "") blockers.push("Provide a value to compare against.");

    if (blockers.length > 0) {
      return {
        ok: false,
        blockers,
        caveats: [],
        logs,
        crs: null,
        outputFeatures: EMPTY_FC,
        outputFeatureCount: 0,
        outputGeometryClass: inputLayer.metadata?.geometryType ?? "Geometry",
        parameters: { field, operator, value },
      };
    }

    const matched = features.filter((feature) => matchesFilter(feature.properties?.[field], operator, value));
    const caveats: string[] = [];
    if (matched.length === 0) {
      caveats.push(`Filter "${field} ${operator} ${value}" matched 0 of ${features.length} features.`);
    }
    logs.push(`attribute-filter: ${matched.length} of ${features.length} feature(s) matched "${field} ${operator} ${value}"`);

    return {
      ok: true,
      blockers: [],
      caveats,
      logs,
      crs: null,
      outputFeatures: featureCollection(matched),
      outputFeatureCount: matched.length,
      outputGeometryClass: geometryClassOf(matched, inputLayer.metadata?.geometryType ?? "Geometry"),
      parameters: { field, operator, value },
    };
  },
};

/* -------------------------------------------------------------------- */
/*  Registry of reference executors                                      */
/* -------------------------------------------------------------------- */

export const REFERENCE_TOOL_EXECUTORS: Readonly<Record<string, ProcessingToolExecutor>> = {
  buffer: bufferTool,
  centroid: centroidTool,
  "attribute-filter": attributeFilterTool,
};

export const REFERENCE_TOOL_DESCRIPTORS: ProcessingToolDescriptor[] = Object.values(
  REFERENCE_TOOL_EXECUTORS,
).map((executor) => executor.descriptor);

export function getReferenceToolExecutor(toolId: string): ProcessingToolExecutor | null {
  return REFERENCE_TOOL_EXECUTORS[toolId] ?? null;
}

/* -------------------------------------------------------------------- */
/*  Reproducibility manifest builder                                     */
/* -------------------------------------------------------------------- */

export interface BuildProcessingManifestInput {
  descriptor: ProcessingToolDescriptor;
  inputLayer: OverlayLayerConfig;
  outputLayerId: string;
  outputLayerName: string;
  preview: ProcessingToolPreview;
  createdAt: string;
  manifestId: string;
  mapContextId: string;
}

function computeBounds(fc: FeatureCollection): [number, number, number, number] | null {
  if (fc.features.length === 0) return null;
  try {
    const [minX, minY, maxX, maxY] = turf.bbox(fc as never);
    if ([minX, minY, maxX, maxY].every((value) => Number.isFinite(value))) {
      return [minX, minY, maxX, maxY];
    }
    return null;
  } catch {
    return null;
  }
}

export function buildProcessingManifest(input: BuildProcessingManifestInput): MapReproducibilityManifest {
  const { descriptor, inputLayer, outputLayerId, outputLayerName, preview, createdAt, manifestId, mapContextId } = input;
  const layerCrs = preview.crs?.sourceCrs ?? resolveOverlayLayerCrsSummary(inputLayer).crs ?? null;

  const crsSummary: MapReproducibilityCrsSummary = {
    status: descriptor.requiresCrs ? (layerCrs ? "known" : "missing") : "not-applicable",
    sourceCrs: layerCrs,
    displayCrs: preview.crs?.displayCrs ?? "EPSG:4326",
    executionCrs: preview.crs?.executionCrs ?? null,
    ...(preview.crs?.executionKind ? { executionKind: preview.crs.executionKind } : {}),
    sourceLayerCrs: [{ layerId: inputLayer.id, crs: layerCrs }],
    missingLayerIds: descriptor.requiresCrs && !layerCrs ? [inputLayer.id] : [],
    notes: preview.crs?.caveats ?? [],
  };

  const qaSummary: MapReproducibilityQASummary = {
    status: preview.ok ? "passed" : "blocked",
    issueIds: [],
    blockerCount: preview.blockers.length,
    warningCount: 0,
    infoCount: preview.caveats.length,
    blockers: preview.blockers,
    warnings: [],
    caveats: preview.caveats,
  };

  const expectedOutput: MapReproducibilityExpectedOutput = {
    layerName: outputLayerName,
    geometryClass: preview.outputGeometryClass,
    featureCount: preview.outputFeatureCount,
    bounds: computeBounds(preview.outputFeatures),
    outputLayerGroup: "analysis",
    needsWorker: false,
    reportCompatible: true,
    dashboardCompatible: false,
    ideCompatible: true,
  };

  const sourceLayerRef: MapReproducibilityLayerReference = {
    layerId: inputLayer.id,
    role: "source",
    name: inputLayer.name,
    ...(inputLayer.sourceKind ? { sourceKind: inputLayer.sourceKind } : {}),
    ...(typeof inputLayer.metadata?.featureCount === "number"
      ? { featureCount: inputLayer.metadata.featureCount }
      : {}),
  };

  const outputLayerRef: MapReproducibilityLayerReference = {
    layerId: outputLayerId,
    role: "derived-output",
    name: outputLayerName,
    sourceKind: "derived",
    featureCount: preview.outputFeatureCount,
  };

  return {
    version: 1,
    manifestId,
    workflowId: `processing:${descriptor.toolId}`,
    status: preview.ok ? "applied" : "blocked",
    createdAt,
    mapContextId,
    operation: descriptor.title,
    workflowKind: `processing.${descriptor.toolId}`,
    inputLayerIds: [inputLayer.id],
    sourceLayerIds: [inputLayer.id],
    outputLayerIds: [outputLayerId],
    sourceLayers: [sourceLayerRef],
    outputLayers: [outputLayerRef],
    aoiReference: {
      source: "none",
      selectedLayerIds: [inputLayer.id],
      selectedFeatureCount: 0,
      drawnPolygonCount: 0,
    },
    viewportBounds: null,
    parameters: preview.parameters,
    crsSummary,
    qaSummary,
    expectedOutput,
    handoffReferences: { reportItemIds: [], dashboardBindingIds: [], ideArtifactIds: [] },
    qaIssueIds: [],
    sourceDataVersions: { [inputLayer.id]: inputLayer.metadata?.dataVersion ?? null },
    engine: "MapWorkflowService",
    engineVersion: "processing-toolbox-1",
  };
}
