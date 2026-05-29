import { describe, expect, it } from "vitest";
import { fcInvalidGeometry } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  applyMapCommand,
  revertMapCommand,
  type MapActionEffects,
} from "@/services/map/actions/MapActionExecutor";
import { evaluateMapScientificQASync } from "@/services/map/MapScientificQA";
import { previewLayerTopologyRepair } from "@/services/map/topology/TopologyRepairService";

const FIXED_TIME = "2026-05-29T00:00:00.000Z";

function invalidLayer(): OverlayLayerConfig {
  const layer: OverlayLayerConfig = {
    id: "invalid-geometry",
    name: "Invalid geometry",
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "imported",
    group: "data",
    queryable: true,
    sourceData: fcInvalidGeometry,
    metadata: {
      featureCount: fcInvalidGeometry.features.length,
      geometryType: "Polygon",
      crsSummary: {
        crs: "EPSG:4326",
        status: "known",
        source: "explicit",
        notes: [],
      },
    },
  };
  const qa = evaluateMapScientificQASync([layer], { workerThresholdFeatures: Number.POSITIVE_INFINITY });
  const summary = qa.layerSummaries[0];
  return summary
    ? {
        ...layer,
        qaStatus: summary.status,
        metadata: {
          ...(layer.metadata ?? {}),
          scientificQA: summary.metadata,
        },
      }
    : layer;
}

function makeEffects(layers: OverlayLayerConfig[]): {
  effects: MapActionEffects;
  all: () => OverlayLayerConfig[];
} {
  let current = [...layers];
  const effects: MapActionEffects = {
    getLayer: (id) => current.find((layer) => layer.id === id) ?? null,
    getLayerOrder: () => current.map((layer) => layer.id),
    addLayer: (layer) => {
      const existingIndex = current.findIndex((entry) => entry.id === layer.id);
      current = existingIndex === -1
        ? [...current, layer]
        : current.map((entry, index) => (index === existingIndex ? layer : entry));
    },
    removeLayer: (id) => {
      current = current.filter((layer) => layer.id !== id);
    },
    setLayerOrder: (orderedIds) => {
      const byId = new Map(current.map((layer) => [layer.id, layer]));
      current = orderedIds
        .map((id) => byId.get(id))
        .filter((layer): layer is OverlayLayerConfig => Boolean(layer));
    },
    setLayerStyle: (id, style) => {
      current = current.map((layer) => (layer.id === id ? { ...layer, style } : layer));
    },
    removeReportItem: () => {},
  };
  return { effects, all: () => current };
}

describe("TopologyRepairService", () => {
  it("builds a guided repair preview with manifest and clears the invalid geometry badge through workflow.apply", async () => {
    const layer = invalidLayer();
    expect(layer.metadata?.scientificQA?.badges).toContain("invalid_geometry");

    const preview = await previewLayerTopologyRepair(layer, {
      forceInline: true,
      now: () => FIXED_TIME,
      idFactory: () => "fixed",
      mapContextId: "test-map",
    });

    expect(preview.status).toBe("needs-repair");
    expect(preview.canApply).toBe(true);
    expect(preview.manifest?.workflowId).toBe("topology.repair");
    expect(preview.outputLayer?.metadata?.topologyRepair?.engine).toBe("geos-wasm");
    expect(preview.outputLayer?.metadata?.topologyRepair?.removedFeatureCount).toBe(1);
    expect(preview.outputLayer?.metadata?.scientificQA?.badges).not.toContain("invalid_geometry");

    const { effects, all } = makeEffects([layer]);
    if (!preview.outputLayer || !preview.manifest) {
      throw new Error("Expected topology repair preview to produce an output layer and manifest.");
    }
    const outcome = applyMapCommand({
      kind: "workflow.apply",
      workflowId: preview.manifest.workflowId,
      outputLayer: preview.outputLayer,
      replaceLayerId: layer.id,
      canApply: true,
      manifest: preview.manifest,
      caveats: preview.caveats,
    }, effects, { idFactory: () => "cmd-topology", now: () => FIXED_TIME });

    expect(outcome.result.status).toBe("applied");
    expect(outcome.result.kind).toBe("workflow.apply");
    expect(outcome.reviewEvent.details?.replaceLayerId).toBe(layer.id);
    expect(outcome.reviewEvent.details?.manifestId).toBe("manifest-topology-repair-fixed");
    expect(all()).toHaveLength(1);
    expect(all()[0]?.metadata?.scientificQA?.badges).not.toContain("invalid_geometry");

    if (outcome.revertToken) revertMapCommand(outcome.revertToken, effects);
    expect(all()[0]?.metadata?.scientificQA?.badges).toContain("invalid_geometry");
  });
});
