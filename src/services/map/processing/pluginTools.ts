import * as turf from "@turf/turf";
import type { Feature } from "geojson";
import type { ProcessingToolDescriptor } from "@/services/map/contracts/gisContracts";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { resolveOverlayLayerCrsSummary } from "@/centerpanel/components/map/mapLayerMetadata";
import { CrsPreflight } from "@/services/map/crs/CrsPreflight";
import {
  EMPTY_FC,
  featureCollection,
  geometryClassOf,
  layerFeatures,
  type ProcessingToolExecutor,
  type ProcessingToolPreview,
} from "./referenceTools";

export const REFERENCE_PLUGIN_TOOL_ID = "plugin-envelope";

export const REFERENCE_PLUGIN_TOOL_DESCRIPTOR: ProcessingToolDescriptor = {
  toolId: REFERENCE_PLUGIN_TOOL_ID,
  title: "Plugin envelope",
  category: "Plugin",
  summary:
    "Reference extension tool that builds a projected bounding-envelope layer through the standard processing lifecycle.",
  parameters: [{ key: "layer", label: "Input layer", type: "layer", required: true }],
  requiresCrs: true,
  executionMode: "main-preview",
  qaGated: true,
  urbanMethodIds: ["plugin.walkability-access"],
  implemented: true,
};

function featureSourceId(feature: Feature, index: number): string {
  return feature.id == null ? `feature-${index}` : String(feature.id);
}

function buildEnvelopeFeature(feature: Feature, inputLayer: OverlayLayerConfig, index: number): Feature {
  const envelope = turf.bboxPolygon(turf.bbox(feature));
  return {
    ...envelope,
    id: `plugin-envelope-${featureSourceId(feature, index)}`,
    properties: {
      ...(feature.properties ?? {}),
      source_feature_id: featureSourceId(feature, index),
      source_layer_id: inputLayer.id,
      plugin_id: "map.reference-extension-pack",
      plugin_tool_id: REFERENCE_PLUGIN_TOOL_ID,
    },
  };
}

export const REFERENCE_PLUGIN_TOOL_EXECUTOR: ProcessingToolExecutor = {
  descriptor: REFERENCE_PLUGIN_TOOL_DESCRIPTOR,
  preview({ inputLayer }): ProcessingToolPreview {
    const logs: string[] = [`plugin-envelope: input layer "${inputLayer.name}" (${inputLayer.id})`];
    const blockers: string[] = [];
    const features = layerFeatures(inputLayer);
    if (features.length === 0) blockers.push("Input layer has no features to envelope.");

    const layerCrs = resolveOverlayLayerCrsSummary(inputLayer).crs;
    const crs = CrsPreflight.preflight(
      {
        id: REFERENCE_PLUGIN_TOOL_ID,
        label: "Plugin envelope",
        metric: "area",
        executionKind: "planar",
        displayCrs: "EPSG:4326",
      },
      [{ id: inputLayer.id, name: inputLayer.name, crs: layerCrs }],
    );
    if (crs.blocked) blockers.push(crs.reason ?? "Plugin envelope requires a projected source CRS.");

    const outputFeatures = blockers.length === 0
      ? featureCollection(features.map((feature, index) => buildEnvelopeFeature(feature, inputLayer, index)))
      : EMPTY_FC;
    const caveats = blockers.length === 0
      ? [
          ...crs.caveats,
          "Plugin envelope outputs bounding polygons for extension-registry smoke testing; review before analytical use.",
        ]
      : [];

    logs.push(
      blockers.length > 0
        ? `plugin-envelope: blocked (${blockers.join("; ")})`
        : `plugin-envelope: produced ${outputFeatures.features.length} envelope feature(s)`,
    );

    return {
      ok: blockers.length === 0,
      blockers,
      caveats,
      logs,
      crs,
      outputFeatures,
      outputFeatureCount: outputFeatures.features.length,
      outputGeometryClass: geometryClassOf(outputFeatures.features, "Polygon"),
      parameters: { pluginId: "map.reference-extension-pack" },
    };
  },
};

export const REFERENCE_PLUGIN_TOOL_EXECUTORS: Readonly<Record<string, ProcessingToolExecutor>> = {
  [REFERENCE_PLUGIN_TOOL_ID]: REFERENCE_PLUGIN_TOOL_EXECUTOR,
};