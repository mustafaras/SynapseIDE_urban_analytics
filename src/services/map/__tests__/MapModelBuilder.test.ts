import { describe, expect, it } from "vitest";
import type { MapExplorerContextSummary } from "@/centerpanel/components/map/mapContextSummary";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  fcPolygonsProjected,
  FC_POLYGONS_PROJECTED_COUNT,
} from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import type { MapActionEffects } from "@/services/map/actions/MapActionExecutor";
import {
  buildMapModelCodeArtifactRequest,
  executeMapModel,
  executeMapModelBatch,
  saveMapModel,
  type MapModelDefinition,
} from "@/services/map/model";
import { createMapProcessingRegistry } from "@/services/map/processing";

function projectedLayer(id: string): OverlayLayerConfig {
  return {
    id,
    name: `Projected ${id}`,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    queryable: true,
    sourceData: fcPolygonsProjected.featureCollection,
    metadata: {
      featureCount: FC_POLYGONS_PROJECTED_COUNT,
      geometryType: "Polygon",
      dataVersion: `${id}-v1`,
      crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
    },
  };
}

function makeEffects(layers: OverlayLayerConfig[]): {
  effects: MapActionEffects;
  all: () => OverlayLayerConfig[];
} {
  const store = new Map(layers.map((layer) => [layer.id, layer]));
  let order = layers.map((layer) => layer.id);
  const effects: MapActionEffects = {
    getLayer: (id) => store.get(id) ?? null,
    getLayerOrder: () => [...order],
    addLayer: (layer) => {
      store.set(layer.id, layer);
      if (!order.includes(layer.id)) order.push(layer.id);
    },
    removeLayer: (id) => {
      store.delete(id);
      order = order.filter((entry) => entry !== id);
    },
    setLayerOrder: (ids) => {
      order = [...ids];
    },
    setLayerStyle: () => {},
    removeReportItem: () => {},
  };
  return { effects, all: () => [...store.values()] };
}

function transitAccessModel(baseLayerId = "base"): MapModelDefinition {
  return {
    version: 1,
    modelId: "transit-access",
    title: "Transit access coverage",
    inputs: [
      { inputId: "base", label: "Transit buffers", layerId: baseLayerId },
      { inputId: "mask", label: "Residential blocks", layerId: "mask" },
    ],
    steps: [
      {
        stepId: "buffer",
        toolId: "buffer",
        label: "Buffer transit",
        parameters: {
          layer: { kind: "source", inputId: "base" },
          distanceMeters: { kind: "literal", value: 250 },
        },
      },
      {
        stepId: "intersect",
        toolId: "intersect",
        label: "Intersect residential blocks",
        parameters: {
          layer: { kind: "step-output", stepId: "buffer" },
          layerB: { kind: "source", inputId: "mask" },
        },
      },
    ],
  };
}

const contextSummary: MapExplorerContextSummary = {
  contextId: "map-model-test",
  updatedAt: "2026-05-26T09:00:00.000Z",
  viewport: {
    center: [29, 41],
    zoom: 11,
    bearing: 0,
    pitch: 0,
    baseLayerId: "dark",
  },
  currentBounds: [28.9, 40.9, 29.3, 41.3],
  currentBoundsUpdatedAt: "2026-05-26T09:00:00.000Z",
  activeAoi: null,
  visibleLayerIds: ["base", "mask"],
  selectedLayerIds: [],
  activeAnalysisResultLayerIds: [],
  selection: { totalSelectedFeatures: 0, layerCounts: [] },
  qa: {
    status: "passed",
    checkedAt: "2026-05-26T09:00:00.000Z",
    layerCount: 2,
    blockedLayerCount: 0,
    issueCounts: { info: 0, warning: 0, error: 0, blocker: 0 },
  },
};

describe("MapModelBuilder", () => {
  it("serializes and reruns buffer -> intersect with an identical model manifest hash", () => {
    const registry = createMapProcessingRegistry();
    const { effects } = makeEffects([projectedLayer("base"), projectedLayer("mask")]);
    const saved = saveMapModel(transitAccessModel(), "2026-05-26T09:00:00.000Z");

    const first = executeMapModel(saved.definition, registry, effects, {
      now: () => "2026-05-26T09:01:00.000Z",
      mapContextId: "map-model-test",
    });
    const second = executeMapModel(saved.definition, registry, effects, {
      now: () => "2026-05-26T10:01:00.000Z",
      mapContextId: "map-model-test",
    });

    expect(first.status).toBe("applied");
    expect(first.stepRuns.map((entry) => entry.step.toolId)).toEqual(["buffer", "intersect"]);
    expect(first.stepRuns[0]?.result.outputLayer?.metadata?.crsSummary?.crs).toBe("EPSG:32635");
    expect(first.finalOutputLayer?.metadata?.reproducibilityManifest?.manifestId).toBe(first.manifest?.manifestId);
    expect(first.manifestHash).toBe(second.manifestHash);
    expect(first.manifest?.manifestId).toBe(second.manifest?.manifestId);
    expect(first.finalOutputLayer?.id).toBe(second.finalOutputLayer?.id);
    expect(saved.serialized).toContain('"toolId": "intersect"');
  });

  it("plans without committing partial layers when a downstream step blocks", () => {
    const registry = createMapProcessingRegistry();
    const { effects, all } = makeEffects([projectedLayer("base")]);
    const before = all().length;
    const result = executeMapModel(transitAccessModel(), registry, effects);

    expect(result.status).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("mask");
    expect(all()).toHaveLength(before);
  });

  it("runs a safe layer batch with distinct source-bound manifests", () => {
    const registry = createMapProcessingRegistry();
    const { effects } = makeEffects([
      projectedLayer("base-a"),
      projectedLayer("base-b"),
      projectedLayer("mask"),
    ]);
    const result = executeMapModelBatch(
      transitAccessModel("base-a"),
      [
        { targetId: "target-a", label: "District A", layerBindings: { base: "base-a" } },
        { targetId: "target-b", label: "District B", layerBindings: { base: "base-b" } },
      ],
      registry,
      effects,
      { now: () => "2026-05-26T09:10:00.000Z" },
    );

    expect(result.status).toBe("applied");
    expect(result.results).toHaveLength(2);
    expect(result.results[0]?.result.manifestHash).not.toBe(result.results[1]?.result.manifestHash);
    expect(result.results[0]?.result.manifest?.sourceLayerIds).toContain("base-a");
    expect(result.results[1]?.result.manifest?.sourceLayerIds).toContain("base-b");
  });

  it("generates a Synapse IDE workflow artifact from the model manifest", () => {
    const registry = createMapProcessingRegistry();
    const { effects, all } = makeEffects([projectedLayer("base"), projectedLayer("mask")]);
    const result = executeMapModel(transitAccessModel(), registry, effects, {
      now: () => "2026-05-26T09:20:00.000Z",
      mapContextId: contextSummary.contextId,
    });
    const request = buildMapModelCodeArtifactRequest({
      result,
      contextSummary,
      overlayLayers: all(),
      now: "2026-05-26T09:21:00.000Z",
    });

    expect(request.kind).toBe("workflow-script");
    expect(request.workflowId).toBe(result.manifest?.workflowId);
    expect(request.layerIds).toEqual([result.finalOutputLayer?.id]);
    expect(request.content).toContain(result.manifest!.manifestId);
    expect(request.content).toContain(result.manifestHash!);
    expect(request.content).not.toContain("FeatureCollection");
  });
});
