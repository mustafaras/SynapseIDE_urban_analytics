// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import type { DrawnFeature, MapReproducibilityManifest, OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  applyMapCommand,
  previewMapCommand,
  revertMapCommand,
  type MapActionEffects,
} from "@/services/map/actions/MapActionExecutor";
import {
  createMapActionHistory,
  findRevertableEntry,
  markMapActionReverted,
  recordMapActionHistoryEntry,
} from "@/services/map/actions/MapActionHistoryService";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import { validateDrawnGeometry } from "../DrawnGeometryValidation";

const FIXED_OPTS = { idFactory: () => "cmd-1", now: () => "2026-05-23T00:00:00.000Z" };

function layer(id: string, overrides: Partial<OverlayLayerConfig> = {}): OverlayLayerConfig {
  return { id, name: `Layer ${id}`, type: "geojson", visible: true, opacity: 1, ...overrides };
}

function drawnAoi(id: string, coordinates: GeoJSON.Position[][]): DrawnFeature {
  const geometry: GeoJSON.Polygon = { type: "Polygon", coordinates };
  return {
    id,
    geometry,
    properties: {
      label: `AOI ${id}`,
      createdAt: "2026-05-23T00:00:00.000Z",
      validation: validateDrawnGeometry(geometry),
    },
  };
}

function createFakeEffects(initial: OverlayLayerConfig[] = []) {
  let layers = [...initial];
  let drawings: DrawnFeature[] = [];
  const removedReportItems: string[] = [];
  const effects: MapActionEffects = {
    getLayer: (id) => layers.find((entry) => entry.id === id) ?? null,
    getLayerOrder: () => layers.map((entry) => entry.id),
    addLayer: (entry) => {
      const existingIndex = layers.findIndex((layerEntry) => layerEntry.id === entry.id);
      layers = existingIndex === -1
        ? [...layers, entry]
        : layers.map((layerEntry, index) => (index === existingIndex ? entry : layerEntry));
    },
    removeLayer: (id) => {
      layers = layers.filter((entry) => entry.id !== id);
    },
    setLayerOrder: (orderedIds) => {
      const byId = new Map(layers.map((entry) => [entry.id, entry]));
      layers = orderedIds
        .map((id) => byId.get(id))
        .filter((entry): entry is OverlayLayerConfig => Boolean(entry));
    },
    setLayerStyle: (id, style) => {
      layers = layers.map((entry) => (entry.id === id ? { ...entry, style } : entry));
    },
    removeReportItem: (id) => {
      removedReportItems.push(id);
    },
    getDrawnFeature: (id) => drawings.find((entry) => entry.id === id) ?? null,
    updateDrawnFeature: (id, patch) => {
      drawings = drawings.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
    },
  };
  return {
    effects,
    ids: () => layers.map((entry) => entry.id),
    layers: () => layers,
    drawings: () => drawings,
    setDrawings: (entries: DrawnFeature[]) => {
      drawings = entries;
    },
    removedReportItems,
  };
}

describe("previewMapCommand", () => {
  it("is ok for removing an existing layer", () => {
    const { effects } = createFakeEffects([layer("a")]);
    const preflight = previewMapCommand({ kind: "layer.remove", layerId: "a" }, effects);
    expect(preflight.ok).toBe(true);
    expect(preflight.blockers).toEqual([]);
  });

  it("blocks removing a layer that no longer exists", () => {
    const { effects } = createFakeEffects([]);
    const preflight = previewMapCommand({ kind: "layer.remove", layerId: "ghost" }, effects);
    expect(preflight.ok).toBe(false);
    expect(preflight.blockers.join(" ")).toContain("no longer available");
  });

  it("caveats removing a derived analysis layer", () => {
    const { effects } = createFakeEffects([
      layer("derived", { metadata: { analysisResult: { engine: "MapWorkflowService" } } as OverlayLayerConfig["metadata"] }),
    ]);
    const preflight = previewMapCommand({ kind: "layer.remove", layerId: "derived" }, effects);
    expect(preflight.ok).toBe(true);
    expect(preflight.caveats.join(" ")).toContain("lineage");
  });

  it("blocks an unready workflow.apply and a non-publishable report.handoff", () => {
    const { effects } = createFakeEffects([layer("a")]);
    const workflow = previewMapCommand(
      { kind: "workflow.apply", workflowId: "w1", outputLayer: layer("o"), canApply: false, blockers: ["Configure inputs."] },
      effects,
    );
    expect(workflow.ok).toBe(false);
    expect(workflow.blockers).toContain("Configure inputs.");

    const report = previewMapCommand(
      { kind: "report.handoff", layerId: "a", reportItemId: "r1", reportTitle: "Finding", publishable: false },
      effects,
    );
    expect(report.ok).toBe(false);
  });

  it("blocks aoi.edit when the edited geometry is invalid", () => {
    const { effects, setDrawings } = createFakeEffects();
    const before = drawnAoi("aoi-1", [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);
    const invalid = drawnAoi("aoi-1", [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]]);
    setDrawings([before]);

    const preflight = previewMapCommand({
      kind: "aoi.edit",
      featureId: "aoi-1",
      previousFeature: before,
      nextFeature: invalid,
      validation: validateDrawnGeometry(invalid.geometry),
    }, effects);

    expect(preflight.ok).toBe(false);
    expect(preflight.blockers.join(" ")).toContain("Self-intersecting");
    expect(preflight.caveats.join(" ")).toContain("CRS");
  });
});

describe("applyMapCommand", () => {
  it("applies layer.remove with an audit event and a revert token", () => {
    const { effects, ids } = createFakeEffects([layer("a"), layer("b")]);
    const outcome = applyMapCommand({ kind: "layer.remove", layerId: "a" }, effects, FIXED_OPTS);

    expect(outcome.result.status).toBe("applied");
    expect(outcome.result.revertable).toBe(true);
    expect(outcome.result.commandId).toBe("cmd-1");
    expect(outcome.reviewEvent.id).toBe("cmd-1");
    expect(outcome.reviewEvent.type).toBe("layer-change");
    expect(outcome.reviewEvent.status).toBe("applied");
    expect(outcome.reviewEvent.undo?.available).toBe(true);
    expect(outcome.reviewEvent.details?.commandId).toBe("cmd-1");
    expect(outcome.revertToken?.kind).toBe("layer.remove");
    expect(ids()).toEqual(["b"]);
  });

  it("carries a reproducibility manifest for workflow.apply and adds the output layer", () => {
    const { effects, ids } = createFakeEffects([]);
    const manifest = { manifestId: "m1" } as unknown as MapReproducibilityManifest;
    const outcome = applyMapCommand(
      { kind: "workflow.apply", workflowId: "w1", outputLayer: layer("derived"), canApply: true, manifest },
      effects,
      FIXED_OPTS,
    );
    expect(outcome.result.status).toBe("applied");
    expect(outcome.result.manifest).toBe(manifest);
    expect(outcome.reviewEvent.type).toBe("workflow-action");
    expect(ids()).toContain("derived");
  });

  it("produces a report-handoff audit event referencing the report item", () => {
    const { effects } = createFakeEffects([layer("a")]);
    const outcome = applyMapCommand(
      { kind: "report.handoff", layerId: "a", reportItemId: "r1", reportTitle: "Finding", publishable: true },
      effects,
      FIXED_OPTS,
    );
    expect(outcome.result.status).toBe("applied");
    expect(outcome.reviewEvent.type).toBe("report-handoff");
    expect(outcome.reviewEvent.reportItemIds).toContain("r1");
  });

  it("applies aoi.edit with validation details and a revert token", () => {
    const { effects, drawings, setDrawings } = createFakeEffects();
    const before = drawnAoi("aoi-1", [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);
    const after = drawnAoi("aoi-1", [[[0, 0], [2, 0], [2, 1], [0, 1], [0, 0]]]);
    setDrawings([before]);

    const outcome = applyMapCommand({
      kind: "aoi.edit",
      featureId: "aoi-1",
      previousFeature: before,
      nextFeature: after,
      validation: validateDrawnGeometry(after.geometry),
    }, effects, FIXED_OPTS);

    expect(outcome.result.status).toBe("applied");
    expect(outcome.result.kind).toBe("aoi.edit");
    expect(outcome.reviewEvent.title).toContain("Edited AOI");
    expect(outcome.reviewEvent.details?.validationStatus).toBe("valid");
    expect(outcome.revertToken?.kind).toBe("aoi.edit");
    expect((drawings()[0]?.geometry as GeoJSON.Polygon).coordinates[0]?.[1]).toEqual([2, 0]);
  });

  it("returns a blocked result with blockers and applies no side effects", () => {
    const { effects, ids } = createFakeEffects([]);
    const outcome = applyMapCommand(
      { kind: "workflow.apply", workflowId: "w1", outputLayer: layer("derived"), canApply: false, blockers: ["Preview not ready."] },
      effects,
      FIXED_OPTS,
    );
    expect(outcome.result.status).toBe("blocked");
    expect(outcome.result.revertable).toBe(false);
    expect(outcome.preflight.blockers).toContain("Preview not ready.");
    expect(outcome.reviewEvent.status).toBe("failed");
    expect(ids()).toHaveLength(0);
  });
});

describe("revertMapCommand", () => {
  it("restores a removed layer at its original position", () => {
    const { effects, ids } = createFakeEffects([layer("a"), layer("b"), layer("c")]);
    const outcome = applyMapCommand({ kind: "layer.remove", layerId: "b" }, effects, FIXED_OPTS);
    expect(ids()).toEqual(["a", "c"]);
    expect(outcome.revertToken).toBeDefined();
    if (outcome.revertToken) revertMapCommand(outcome.revertToken, effects);
    expect(ids()).toEqual(["a", "b", "c"]);
  });

  it("reverts layer.style to the previous style", () => {
    const { effects, layers } = createFakeEffects([layer("a", { style: { color: "red" } })]);
    const outcome = applyMapCommand({ kind: "layer.style", layerId: "a", style: { color: "blue" } }, effects, FIXED_OPTS);
    expect(layers()[0]?.style).toEqual({ color: "blue" });
    if (outcome.revertToken) revertMapCommand(outcome.revertToken, effects);
    expect(layers()[0]?.style).toEqual({ color: "red" });
  });

  it("reverts workflow.apply by removing the output layer", () => {
    const { effects, ids } = createFakeEffects([]);
    const outcome = applyMapCommand({ kind: "workflow.apply", workflowId: "w", outputLayer: layer("derived"), canApply: true }, effects, FIXED_OPTS);
    expect(ids()).toEqual(["derived"]);
    if (outcome.revertToken) revertMapCommand(outcome.revertToken, effects);
    expect(ids()).toHaveLength(0);
  });

  it("reverts workflow.apply replacement by restoring the previous layer", () => {
    const source = layer("source", { metadata: { featureCount: 2 } });
    const repaired = layer("source", { metadata: { featureCount: 1 } });
    const { effects, layers } = createFakeEffects([source]);
    const outcome = applyMapCommand({
      kind: "workflow.apply",
      workflowId: "topology.repair",
      outputLayer: repaired,
      replaceLayerId: "source",
      canApply: true,
    }, effects, FIXED_OPTS);

    expect(layers()[0]?.metadata?.featureCount).toBe(1);
    expect(outcome.revertToken?.kind).toBe("workflow.apply");
    if (outcome.revertToken) revertMapCommand(outcome.revertToken, effects);
    expect(layers()[0]?.metadata?.featureCount).toBe(2);
  });

  it("reverts aoi.edit to the previous geometry", () => {
    const { effects, drawings, setDrawings } = createFakeEffects();
    const before = drawnAoi("aoi-1", [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);
    const after = drawnAoi("aoi-1", [[[0, 0], [2, 0], [2, 1], [0, 1], [0, 0]]]);
    setDrawings([before]);

    const outcome = applyMapCommand({
      kind: "aoi.edit",
      featureId: "aoi-1",
      previousFeature: before,
      nextFeature: after,
      validation: validateDrawnGeometry(after.geometry),
    }, effects, FIXED_OPTS);
    if (outcome.revertToken) revertMapCommand(outcome.revertToken, effects);

    expect((drawings()[0]?.geometry as GeoJSON.Polygon).coordinates[0]?.[1]).toEqual([1, 0]);
  });
});

describe("MapActionHistoryService", () => {
  it("records, finds revertable, and marks reverted", () => {
    let history = createMapActionHistory();
    history = recordMapActionHistoryEntry(history, {
      commandId: "c1",
      kind: "layer.remove",
      title: "Removed: Layer a",
      reviewEventId: "c1",
      appliedAt: "2026-05-23T00:00:00.000Z",
      revertable: true,
      reverted: false,
      revertToken: { kind: "layer.remove", layer: layer("a"), orderedLayerIds: ["a"] },
    });
    expect(findRevertableEntry(history, "c1")?.commandId).toBe("c1");
    history = markMapActionReverted(history, "c1");
    expect(findRevertableEntry(history, "c1")).toBeNull();
  });

  it("never returns non-revertable entries", () => {
    let history = createMapActionHistory();
    history = recordMapActionHistoryEntry(history, {
      commandId: "c2",
      kind: "report.handoff",
      title: "Report handoff: Finding",
      reviewEventId: "c2",
      appliedAt: "2026-05-23T00:00:00.000Z",
      revertable: false,
      reverted: false,
    });
    expect(findRevertableEntry(history, "c2")).toBeNull();
  });
});

describe("MapActionExecutor + store (revert reverses store state)", () => {
  function storeEffects(): MapActionEffects {
    const read = useMapExplorerStore.getState;
    return {
      getLayer: (id) => read().overlayLayers.find((entry) => entry.id === id) ?? null,
      getLayerOrder: () => read().overlayLayers.map((entry) => entry.id),
      addLayer: (entry) => read().addOverlayLayer(entry),
      removeLayer: (id) => read().removeOverlayLayer(id),
      setLayerOrder: (orderedIds) => read().reorderLayers(orderedIds),
      setLayerStyle: (id, style) => read().updateLayerMetadata(id, { style }),
      removeReportItem: () => {},
    };
  }

  it("removes a layer from the store and revert restores it", () => {
    useMapExplorerStore.setState({ overlayLayers: [] });
    useMapExplorerStore.getState().addOverlayLayer(layer("store-a"));
    useMapExplorerStore.getState().addOverlayLayer(layer("store-b"));
    const effects = storeEffects();

    const outcome = applyMapCommand({ kind: "layer.remove", layerId: "store-a" }, effects);
    expect(useMapExplorerStore.getState().overlayLayers.map((entry) => entry.id)).toEqual(["store-b"]);

    expect(outcome.revertToken).toBeDefined();
    if (outcome.revertToken) revertMapCommand(outcome.revertToken, effects);
    expect(useMapExplorerStore.getState().overlayLayers.map((entry) => entry.id)).toEqual(["store-a", "store-b"]);

    useMapExplorerStore.setState({ overlayLayers: [] });
  });
});
