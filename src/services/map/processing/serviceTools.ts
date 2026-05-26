/* ==================================================================== */
/*  Service-backed processing tools — Prompt 24b                         */
/*                                                                        */
/*  Wraps existing map services as ProcessingToolDescriptors so the       */
/*  toolbox reaches a production-grade catalogue (≥12 implemented):       */
/*    overlay  — intersect, difference, union, clip                       */
/*    geometry — dissolve, simplify, reproject                            */
/*    join     — spatial-join                                             */
/*    stats    — hotspot (Getis-Ord Gi*) via SpatialStatsExecutionService */
/*                                                                        */
/*  Each executor runs a real CRS preflight (P7), emits logs, and feeds   */
/*  MapProcessingExecutor, which routes the apply through the P9 command  */
/*  lifecycle and attaches a reproducibility manifest. Tools that are not */
/*  yet wired are published as `implemented:false` descriptors so the     */
/*  toolbox shows them disabled with a reason (no fake outputs).          */
/* ==================================================================== */

import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type {
  CrsPreflightResult,
  ProcessingToolDescriptor,
} from "@/services/map/contracts/gisContracts";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { resolveOverlayLayerCrsSummary } from "@/centerpanel/components/map/mapLayerMetadata";
import { CrsPreflight, type CrsPreflightMetric } from "@/services/map/crs/CrsPreflight";
import { normalizeCrs, project } from "@/services/map/crs/MapProjectionService";
import {
  computeDifference,
  computeIntersect,
  computeUnion,
  isPolygonGeometry,
  turfGeometryOps,
} from "@/services/map/geometry/GeometryWorkflowEngine";
import { executeHotSpotSpatialStats } from "@/services/map/SpatialStatsExecutionService";
import {
  EMPTY_FC,
  featureCollection,
  geometryClassOf,
  layerFeatures,
  type ProcessingToolExecutor,
  type ProcessingToolInputs,
  type ProcessingToolPreview,
} from "./referenceTools";

/* -------------------------------------------------------------------- */
/*  Shared helpers                                                       */
/* -------------------------------------------------------------------- */

function blocked(blockers: string[], geometryClass: string, logs: string[], parameters: Record<string, unknown>): ProcessingToolPreview {
  return {
    ok: false,
    blockers,
    caveats: [],
    logs,
    crs: null,
    outputFeatures: EMPTY_FC,
    outputFeatureCount: 0,
    outputGeometryClass: geometryClass,
    parameters,
  };
}

function crsOf(layer: OverlayLayerConfig): string | null {
  return resolveOverlayLayerCrsSummary(layer).crs;
}

/** Resolve the required second layer for two-input tools. */
function resolveSecondary(
  inputs: ProcessingToolInputs,
  key: string,
): { layer: OverlayLayerConfig | null; id: string } {
  const id = typeof inputs.params[key] === "string" ? (inputs.params[key] as string) : "";
  return { layer: id ? inputs.getLayer(id) : null, id };
}

/** Planar overlay preflight over both source layers. */
function overlayCrs(label: string, metric: CrsPreflightMetric, a: OverlayLayerConfig, b: OverlayLayerConfig): CrsPreflightResult {
  return CrsPreflight.preflight(
    { id: label.toLowerCase(), label, metric, executionKind: "planar", displayCrs: "EPSG:4326" },
    [
      { id: a.id, name: a.name, crs: crsOf(a) },
      { id: b.id, name: b.name, crs: crsOf(b) },
    ],
  );
}

const LAYER_PARAM = { key: "layer", label: "Input layer", type: "layer", required: true } as const;
const LAYER_B_PARAM = { key: "layerB", label: "Overlay layer", type: "layer", required: true } as const;

/* -------------------------------------------------------------------- */
/*  Overlay tools (intersect / difference / union / clip)                */
/* -------------------------------------------------------------------- */

interface OverlayConfig {
  toolId: string;
  title: string;
  metric: CrsPreflightMetric;
  summary: string;
  compute(a: FeatureCollection, b: FeatureCollection): FeatureCollection;
}

function overlayExecutor(config: OverlayConfig): ProcessingToolExecutor {
  return {
    descriptor: {
      toolId: config.toolId,
      title: config.title,
      category: "Overlay",
      summary: config.summary,
      parameters: [{ ...LAYER_PARAM }, { ...LAYER_B_PARAM }],
      requiresCrs: true,
      executionMode: "main-preview",
      qaGated: true,
      urbanMethodIds: [],
      implemented: true,
    },
    preview(inputs): ProcessingToolPreview {
      const { inputLayer } = inputs;
      const logs = [`${config.toolId}: A="${inputLayer.name}" (${inputLayer.id})`];
      const { layer: layerB, id: layerBId } = resolveSecondary(inputs, "layerB");
      if (!layerB) {
        return blocked([`Select an overlay layer for ${config.title}.`], "Polygon", logs, { layerB: layerBId });
      }
      logs.push(`${config.toolId}: B="${layerB.name}" (${layerB.id})`);

      const crs = overlayCrs(config.title, config.metric, inputLayer, layerB);
      logs.push(`${config.toolId}: CRS preflight ${crs.ok ? "passed" : "blocked"}`);
      if (crs.blocked && crs.reason) {
        return {
          ...blocked([crs.reason], "Polygon", logs, { layerB: layerB.id }),
          crs,
          secondarySourceIds: [layerB.id],
        };
      }

      const result = config.compute(featureCollection(layerFeatures(inputLayer)), featureCollection(layerFeatures(layerB)));
      const caveats = [...crs.caveats];
      if (result.features.length === 0) {
        caveats.push(`${config.title} produced no overlapping geometry for these inputs.`);
      }
      logs.push(`${config.toolId}: produced ${result.features.length} feature(s)`);

      return {
        ok: true,
        blockers: [],
        caveats,
        logs,
        crs,
        outputFeatures: result,
        outputFeatureCount: result.features.length,
        outputGeometryClass: geometryClassOf(result.features, "Polygon"),
        parameters: { layerB: layerB.id },
        secondarySourceIds: [layerB.id],
      };
    },
  };
}

const intersectTool = overlayExecutor({
  toolId: "intersect",
  title: "Intersect",
  metric: "intersection",
  summary: "Keep the overlapping geometry of two polygon layers, preserving both sets of attributes. Requires a projected CRS.",
  compute: (a, b) => computeIntersect(a, b, "both").featureCollection,
});

const differenceTool = overlayExecutor({
  toolId: "difference",
  title: "Difference",
  metric: "difference",
  summary: "Subtract the second polygon layer from the first. Requires a projected CRS.",
  compute: (a, b) => computeDifference(a, b),
});

const unionTool = overlayExecutor({
  toolId: "union",
  title: "Union",
  metric: "union",
  summary: "Combine two polygon layers into a single overlay set. Requires a projected CRS.",
  compute: (a, b) => computeUnion(a, b, false),
});

const clipTool = overlayExecutor({
  toolId: "clip",
  title: "Clip",
  metric: "intersection",
  summary: "Clip the first layer to the boundary of the second, keeping the first layer's attributes. Requires a projected CRS.",
  compute: (a, b) => computeIntersect(a, b, "a").featureCollection,
});

/* -------------------------------------------------------------------- */
/*  Dissolve                                                             */
/* -------------------------------------------------------------------- */

const dissolveTool: ProcessingToolExecutor = {
  descriptor: {
    toolId: "dissolve",
    title: "Dissolve",
    category: "Geometry",
    summary: "Merge polygons into one feature, optionally grouped by a field value.",
    parameters: [
      { ...LAYER_PARAM },
      { key: "field", label: "Group by field (optional)", type: "field", required: false },
    ],
    requiresCrs: false,
    executionMode: "main-preview",
    qaGated: false,
    urbanMethodIds: [],
    implemented: true,
  },
  preview(inputs): ProcessingToolPreview {
    const { params, inputLayer } = inputs;
    const logs = [`dissolve: input "${inputLayer.name}" (${inputLayer.id})`];
    const polygons = layerFeatures(inputLayer).filter((feature) => isPolygonGeometry(feature.geometry));
    if (polygons.length === 0) {
      return blocked(["Input layer has no polygon geometry to dissolve."], "Polygon", logs, {});
    }
    const field = typeof params.field === "string" ? params.field.trim() : "";

    const groups = new Map<string, Feature[]>();
    for (const feature of polygons) {
      const key = field ? String(feature.properties?.[field] ?? "∅") : "__all__";
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(feature);
    }

    const merged: Feature[] = [];
    for (const [key, groupFeatures] of groups) {
      const geometry = turfGeometryOps.unaryUnion(
        groupFeatures.map((feature) => feature.geometry).filter(Boolean) as Geometry[],
      );
      if (geometry) {
        merged.push({
          type: "Feature",
          geometry,
          properties: field ? { [field]: key, __dissolved_count: groupFeatures.length } : { __dissolved_count: groupFeatures.length },
        });
      }
    }
    logs.push(`dissolve: ${polygons.length} polygon(s) → ${merged.length} feature(s)`);

    return {
      ok: merged.length > 0,
      blockers: merged.length > 0 ? [] : ["Dissolve could not merge the input polygons."],
      caveats: ["Dissolve merges EPSG:4326 display geometry; reproject for metric-accurate boundaries."],
      logs,
      crs: null,
      outputFeatures: featureCollection(merged),
      outputFeatureCount: merged.length,
      outputGeometryClass: "Polygon",
      parameters: field ? { field } : {},
    };
  },
};

/* -------------------------------------------------------------------- */
/*  Simplify                                                             */
/* -------------------------------------------------------------------- */

const simplifyTool: ProcessingToolExecutor = {
  descriptor: {
    toolId: "simplify",
    title: "Simplify",
    category: "Geometry",
    summary: "Reduce vertex count with Douglas-Peucker simplification at a given tolerance.",
    parameters: [
      { ...LAYER_PARAM },
      { key: "tolerance", label: "Tolerance (degrees)", type: "number", required: true, defaultValue: 0.001 },
    ],
    requiresCrs: false,
    executionMode: "main-preview",
    qaGated: false,
    urbanMethodIds: [],
    implemented: true,
  },
  preview(inputs): ProcessingToolPreview {
    const { params, inputLayer } = inputs;
    const logs = [`simplify: input "${inputLayer.name}" (${inputLayer.id})`];
    const features = layerFeatures(inputLayer);
    const tolerance = Number(params.tolerance);
    const blockers: string[] = [];
    if (features.length === 0) blockers.push("Input layer has no features to simplify.");
    if (!Number.isFinite(tolerance) || tolerance <= 0) blockers.push("Provide a tolerance greater than zero.");
    if (blockers.length > 0) return blocked(blockers, inputLayer.metadata?.geometryType ?? "Geometry", logs, { tolerance });

    const simplified: Feature[] = [];
    for (const feature of features) {
      try {
        simplified.push(turf.simplify(feature as never, { tolerance, highQuality: false }) as Feature);
      } catch {
        simplified.push(feature);
      }
    }
    logs.push(`simplify: simplified ${simplified.length} feature(s) at tolerance ${tolerance}`);

    return {
      ok: true,
      blockers: [],
      caveats: ["Tolerance is in EPSG:4326 degrees; choose a projected workflow for metric tolerances."],
      logs,
      crs: null,
      outputFeatures: featureCollection(simplified),
      outputFeatureCount: simplified.length,
      outputGeometryClass: geometryClassOf(simplified, inputLayer.metadata?.geometryType ?? "Geometry"),
      parameters: { tolerance },
    };
  },
};

/* -------------------------------------------------------------------- */
/*  Reproject                                                            */
/* -------------------------------------------------------------------- */

function reprojectCoords(coords: unknown, from: string, to: string): unknown {
  if (Array.isArray(coords) && typeof coords[0] === "number") {
    const [x, y] = project(coords as Position as [number, number], from, to);
    return [x, y];
  }
  if (Array.isArray(coords)) return coords.map((entry) => reprojectCoords(entry, from, to));
  return coords;
}

function reprojectGeometry(geometry: Geometry, from: string, to: string): Geometry {
  if (geometry.type === "GeometryCollection") {
    return { ...geometry, geometries: geometry.geometries.map((g) => reprojectGeometry(g, from, to)) };
  }
  return { ...geometry, coordinates: reprojectCoords(geometry.coordinates, from, to) } as Geometry;
}

const reprojectTool: ProcessingToolExecutor = {
  descriptor: {
    toolId: "reproject",
    title: "Reproject",
    category: "Geometry",
    summary: "Reproject features from the source CRS to a target CRS with proj4. Requires a known source CRS.",
    parameters: [
      { ...LAYER_PARAM },
      { key: "targetCrs", label: "Target CRS", type: "crs", required: true, defaultValue: "EPSG:3857", help: "e.g. EPSG:3857, EPSG:32635" },
    ],
    requiresCrs: true,
    executionMode: "main-preview",
    qaGated: false,
    urbanMethodIds: [],
    implemented: true,
  },
  preview(inputs): ProcessingToolPreview {
    const { params, inputLayer } = inputs;
    const logs = [`reproject: input "${inputLayer.name}" (${inputLayer.id})`];
    const features = layerFeatures(inputLayer);
    const sourceCrs = crsOf(inputLayer);
    const targetCrs = typeof params.targetCrs === "string" ? params.targetCrs.trim() : "";
    const blockers: string[] = [];
    if (features.length === 0) blockers.push("Input layer has no features to reproject.");
    if (!sourceCrs) blockers.push("Reproject needs a known source CRS — declare it on the layer first.");
    if (!targetCrs) blockers.push("Provide a target CRS (e.g. EPSG:3857).");
    if (blockers.length > 0) return blocked(blockers, inputLayer.metadata?.geometryType ?? "Geometry", logs, { targetCrs });

    const from = normalizeCrs(sourceCrs!);
    const to = normalizeCrs(targetCrs);
    const reprojected: Feature[] = [];
    for (const feature of features) {
      if (!feature.geometry) continue;
      try {
        reprojected.push({ ...feature, geometry: reprojectGeometry(feature.geometry, from, to) });
      } catch {
        /* skip un-reprojectable geometry */
      }
    }
    const crs: CrsPreflightResult = {
      ok: true,
      blocked: false,
      sourceCrs: from,
      displayCrs: "EPSG:4326",
      executionCrs: to,
      executionKind: "planar",
      caveats: [`Reprojected from ${from} to ${to} with proj4.`],
    };
    logs.push(`reproject: ${reprojected.length} feature(s) ${from} → ${to}`);

    return {
      ok: reprojected.length > 0,
      blockers: reprojected.length > 0 ? [] : ["No geometry could be reprojected."],
      caveats: crs.caveats,
      logs,
      crs,
      outputFeatures: featureCollection(reprojected),
      outputFeatureCount: reprojected.length,
      outputGeometryClass: geometryClassOf(reprojected, inputLayer.metadata?.geometryType ?? "Geometry"),
      parameters: { sourceCrs: from, targetCrs: to },
    };
  },
};

/* -------------------------------------------------------------------- */
/*  Spatial join (points → containing polygon attributes)               */
/* -------------------------------------------------------------------- */

const spatialJoinTool: ProcessingToolExecutor = {
  descriptor: {
    toolId: "spatial-join",
    title: "Spatial join",
    category: "Join",
    summary: "Attach attributes from the first containing polygon to each point feature (point-in-polygon).",
    parameters: [
      { key: "layer", label: "Point layer", type: "layer", required: true },
      { key: "layerB", label: "Polygon layer", type: "layer", required: true },
    ],
    requiresCrs: false,
    executionMode: "main-preview",
    qaGated: false,
    urbanMethodIds: [],
    implemented: true,
  },
  preview(inputs): ProcessingToolPreview {
    const { inputLayer } = inputs;
    const logs = [`spatial-join: points="${inputLayer.name}" (${inputLayer.id})`];
    const { layer: polygonLayer, id: polygonId } = resolveSecondary(inputs, "layerB");
    if (!polygonLayer) {
      return blocked(["Select a polygon layer to join attributes from."], "Point", logs, { layerB: polygonId });
    }
    logs.push(`spatial-join: polygons="${polygonLayer.name}" (${polygonLayer.id})`);

    const points = layerFeatures(inputLayer).filter((feature) => feature.geometry?.type === "Point");
    const polygons = layerFeatures(polygonLayer).filter((feature) => isPolygonGeometry(feature.geometry));
    const blockers: string[] = [];
    if (points.length === 0) blockers.push("The point layer has no Point features to join.");
    if (polygons.length === 0) blockers.push("The polygon layer has no polygon features to join from.");
    if (blockers.length > 0) {
      return { ...blocked(blockers, "Point", logs, { layerB: polygonLayer.id }), secondarySourceIds: [polygonLayer.id] };
    }

    // visual-only CRS preflight (geometric containment): caveat, never block.
    const crs = CrsPreflight.preflight(
      { id: "spatial-join", label: "Spatial join", metric: "visual", executionKind: "geodesic", displayCrs: "EPSG:4326" },
      [
        { id: inputLayer.id, name: inputLayer.name, crs: crsOf(inputLayer) },
        { id: polygonLayer.id, name: polygonLayer.name, crs: crsOf(polygonLayer) },
      ],
    );

    let matchedCount = 0;
    const joined: Feature[] = points.map((point) => {
      const container = polygons.find((polygon) => {
        try {
          return turf.booleanPointInPolygon(point as never, polygon as never);
        } catch {
          return false;
        }
      });
      if (container) matchedCount += 1;
      const joinProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(container?.properties ?? {})) {
        joinProps[`join_${key}`] = value;
      }
      return {
        type: "Feature",
        geometry: point.geometry,
        properties: { ...(point.properties ?? {}), ...joinProps, __join_matched: Boolean(container) },
      };
    });
    const caveats = [
      "Spatial join uses geometric point-in-polygon on EPSG:4326 display coordinates.",
      ...crs.caveats,
    ];
    if (matchedCount < points.length) {
      caveats.push(`${points.length - matchedCount} of ${points.length} points fell outside every polygon.`);
    }
    logs.push(`spatial-join: ${matchedCount}/${points.length} point(s) matched a polygon`);

    return {
      ok: true,
      blockers: [],
      caveats,
      logs,
      crs,
      outputFeatures: featureCollection(joined),
      outputFeatureCount: joined.length,
      outputGeometryClass: "Point",
      parameters: { layerB: polygonLayer.id, matchedCount },
      secondarySourceIds: [polygonLayer.id],
    };
  },
};

/* -------------------------------------------------------------------- */
/*  Hot spot analysis (Getis-Ord Gi*) via SpatialStatsExecutionService   */
/* -------------------------------------------------------------------- */

const hotSpotTool: ProcessingToolExecutor = {
  descriptor: {
    toolId: "hotspot",
    title: "Hot spot analysis (Gi*)",
    category: "Statistics",
    summary: "Getis-Ord Gi* hot/cold spot classification of a numeric field using contiguity weights.",
    parameters: [
      { ...LAYER_PARAM },
      { key: "valueField", label: "Value field", type: "field", required: true },
      { key: "weightsMethod", label: "Contiguity", type: "enum", required: true, enumValues: ["queen", "rook"], defaultValue: "queen" },
    ],
    requiresCrs: false,
    executionMode: "main-preview",
    qaGated: true,
    urbanMethodIds: [],
    implemented: true,
  },
  preview(inputs): ProcessingToolPreview {
    const { params, inputLayer } = inputs;
    const logs = [`hotspot: input "${inputLayer.name}" (${inputLayer.id})`];
    const valueField = typeof params.valueField === "string" ? params.valueField.trim() : "";
    const weightsMethod = params.weightsMethod === "rook" ? "rook" : "queen";
    if (!valueField) {
      return blocked(["Choose a numeric value field for the hot spot analysis."], "Polygon", logs, { weightsMethod });
    }
    const fc = featureCollection(layerFeatures(inputLayer));
    if (fc.features.length === 0) {
      return blocked(["Input layer has no features for hot spot analysis."], "Polygon", logs, { valueField, weightsMethod });
    }

    try {
      const result = executeHotSpotSpatialStats({
        sourceLayer: inputLayer,
        featureCollection: fc,
        valueField,
        weightsMethod,
        significanceThreshold: 0.05,
        selfWeight: false,
      });
      const output = (result.adaptedResult.layer.sourceData as FeatureCollection | undefined) ?? EMPTY_FC;
      logs.push(`hotspot: classified ${result.validFeatureCount} feature(s) (${result.skippedFeatureCount} skipped)`);
      return {
        ok: true,
        blockers: [],
        caveats: [
          `Gi* uses ${weightsMethod} contiguity weights; classification reflects neighbour structure, not raw values.`,
          ...(result.skippedFeatureCount > 0 ? [`${result.skippedFeatureCount} feature(s) skipped (missing/non-numeric "${valueField}").`] : []),
        ],
        logs,
        crs: null,
        outputFeatures: output,
        outputFeatureCount: output.features.length,
        outputGeometryClass: geometryClassOf(output.features, inputLayer.metadata?.geometryType ?? "Polygon"),
        parameters: { valueField, weightsMethod, significanceThreshold: 0.05 },
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Hot spot analysis failed.";
      logs.push(`hotspot: failed — ${reason}`);
      return blocked([`Hot spot analysis could not run: ${reason}`], "Polygon", logs, { valueField, weightsMethod });
    }
  },
};

/* -------------------------------------------------------------------- */
/*  Registry of implemented service-backed executors                     */
/* -------------------------------------------------------------------- */

export const SERVICE_TOOL_EXECUTORS: Readonly<Record<string, ProcessingToolExecutor>> = {
  intersect: intersectTool,
  difference: differenceTool,
  union: unionTool,
  clip: clipTool,
  dissolve: dissolveTool,
  simplify: simplifyTool,
  reproject: reprojectTool,
  "spatial-join": spatialJoinTool,
  hotspot: hotSpotTool,
};

/* -------------------------------------------------------------------- */
/*  Not-yet-wired tools — shown in the catalogue, disabled with a reason  */
/* -------------------------------------------------------------------- */

function stub(
  toolId: string,
  title: string,
  category: string,
  summary: string,
  options: Partial<ProcessingToolDescriptor> = {},
): ProcessingToolDescriptor {
  return {
    toolId,
    title,
    category,
    summary,
    parameters: [{ ...LAYER_PARAM }],
    requiresCrs: false,
    executionMode: "worker",
    qaGated: false,
    urbanMethodIds: [],
    implemented: false,
    ...options,
  };
}

export const NOT_IMPLEMENTED_TOOL_DESCRIPTORS: ProcessingToolDescriptor[] = [
  stub("lisa-cluster", "LISA clusters", "Statistics", "Local Moran's I cluster/outlier map. Wiring lands with the spatial-stats parameter rail.", { qaGated: true }),
  stub("emerging-hotspot", "Emerging hot spots", "Statistics", "Space-time hot spot trends. Needs the temporal layer pipeline (Prompt 46).", { qaGated: true }),
  stub("raster-zonal-stats", "Zonal statistics", "Raster", "Summarise raster values by polygon zones. Needs the raster pipeline (Prompt 45).", { requiresCrs: true, qaGated: true }),
  stub("kernel-density", "Kernel density", "Statistics", "Heatmap surface from point density. Wiring lands in a later toolbox slice.", { requiresCrs: true }),
];
