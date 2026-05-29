import { expect, test } from "@playwright/test";
import type { DrawnFeature, OverlayLayerConfig } from "../src/centerpanel/components/map/mapTypes";
import type { MapActionEffects, MapActionOutcome } from "../src/services/map/actions/MapActionExecutor";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openMapExplorer(page: import("@playwright/test").Page): Promise<void> {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));
  await expect(page.getByRole("dialog", { name: "Map Explorer" }).first()).toBeVisible();
}

test.describe("Prompt 54 — map undo/redo stack", () => {
  test("add layer, style it, edit AOI, then undo x3 and redo x3", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);

    const proof = await page.evaluate(async () => {
      const storeModule = await import("/src/stores/useMapExplorerStore.ts");
      const executorModule = await import("/src/services/map/actions/MapActionExecutor.ts");
      const historyModule = await import("/src/services/map/actions/MapActionHistoryService.ts");
      const validationModule = await import("/src/services/map/DrawnGeometryValidation.ts");

      const store = storeModule.useMapExplorerStore;
      store.setState({ overlayLayers: [], drawnFeatures: [] });

      const read = store.getState;
      const effects = {
        getLayer: (id: string) => read().overlayLayers.find((layer) => layer.id === id) ?? null,
        getLayerOrder: () => read().overlayLayers.map((layer) => layer.id),
        addLayer: (layer: OverlayLayerConfig) => read().addOverlayLayer(layer),
        removeLayer: (id: string) => read().removeOverlayLayer(id),
        setLayerOrder: (orderedIds: string[]) => read().reorderLayers(orderedIds),
        setLayerStyle: (id: string, style: Record<string, unknown>) => read().updateLayerMetadata(id, { style }),
        removeReportItem: () => {},
        getDrawnFeature: (id: string) => read().drawnFeatures.find((feature) => feature.id === id) ?? null,
        updateDrawnFeature: (id: string, patch: Partial<DrawnFeature>) => read().updateDrawnFeature(id, patch),
      } satisfies MapActionEffects;

      let history = historyModule.createMapActionHistory();
      const record = (outcome: MapActionOutcome): void => {
        if (outcome.result.status !== "applied") throw new Error(`Command was not applied: ${outcome.preflight.blockers.join(" ")}`);
        history = historyModule.recordMapActionHistoryEntry(history, {
          commandId: outcome.result.commandId,
          kind: outcome.result.kind,
          title: outcome.reviewEvent.title,
          reviewEventId: outcome.result.reviewEventId ?? outcome.result.commandId,
          appliedAt: outcome.result.createdAt,
          revertable: outcome.result.revertable,
          reverted: false,
          ...(outcome.revertToken ? { revertToken: outcome.revertToken } : {}),
          ...(outcome.redoToken ? { redoToken: outcome.redoToken } : {}),
        });
      };

      const outputLayer: OverlayLayerConfig = {
        id: "p54-added-layer",
        name: "P54 Added Layer",
        type: "geojson",
        visible: true,
        opacity: 0.72,
        group: "analysis",
        sourceKind: "derived",
        sourceData: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            id: "p54-poly-1",
            geometry: {
              type: "Polygon",
              coordinates: [[[29, 41], [29.02, 41], [29.02, 41.02], [29, 41.02], [29, 41]]],
            },
            properties: { zone: "mixed", score: 7 },
          }],
        },
        metadata: {
          geometryType: "Polygon",
          featureCount: 1,
          fields: ["zone", "score"],
          crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
        },
      };

      record(executorModule.applyMapCommand({
        kind: "workflow.apply",
        workflowId: "p54.add-layer",
        outputLayer,
        canApply: true,
      }, effects, { now: () => "2026-05-29T00:00:00.000Z", idFactory: () => "p54-add" }));

      record(executorModule.applyMapCommand({
        kind: "layer.style",
        layerId: outputLayer.id,
        style: { fillColor: "#f59e0b", fillOpacity: 0.48, strokeColor: "#92400e" },
        opacity: 0.88,
      }, effects, { now: () => "2026-05-29T00:00:01.000Z", idFactory: () => "p54-style" }));

      const beforeAoi: DrawnFeature = {
        id: "p54-aoi",
        geometry: {
          type: "Polygon",
          coordinates: [[[29.04, 41.04], [29.08, 41.04], [29.08, 41.08], [29.04, 41.08], [29.04, 41.04]]],
        },
        properties: {
          label: "P54 AOI",
          createdAt: "2026-05-29T00:00:00.000Z",
          validation: validationModule.validateDrawnGeometry({
            type: "Polygon",
            coordinates: [[[29.04, 41.04], [29.08, 41.04], [29.08, 41.08], [29.04, 41.08], [29.04, 41.04]]],
          }),
        },
      };
      const afterAoi: DrawnFeature = {
        ...beforeAoi,
        geometry: {
          type: "Polygon",
          coordinates: [[[29.04, 41.04], [29.1, 41.04], [29.1, 41.09], [29.04, 41.08], [29.04, 41.04]]],
        },
        properties: {
          ...beforeAoi.properties,
          validation: validationModule.validateDrawnGeometry({
            type: "Polygon",
            coordinates: [[[29.04, 41.04], [29.1, 41.04], [29.1, 41.09], [29.04, 41.08], [29.04, 41.04]]],
          }),
        },
      };
      read().addDrawnFeature(beforeAoi);
      record(executorModule.applyMapCommand({
        kind: "aoi.edit",
        featureId: beforeAoi.id,
        previousFeature: beforeAoi,
        nextFeature: afterAoi,
        validation: afterAoi.properties.validation,
      }, effects, { now: () => "2026-05-29T00:00:02.000Z", idFactory: () => "p54-aoi-edit" }));

      const snapshot = () => {
        const state = read();
        const layer = state.overlayLayers.find((entry) => entry.id === outputLayer.id) ?? null;
        const aoi = state.drawnFeatures.find((entry) => entry.id === beforeAoi.id) ?? null;
        return {
          layerIds: state.overlayLayers.map((entry) => entry.id),
          style: layer?.style ?? null,
          opacity: layer?.opacity ?? null,
          aoiCoordinate: aoi?.geometry.type === "Polygon" ? aoi.geometry.coordinates[0]?.[2] ?? null : null,
          undo: historyModule.summarizeMapUndoRedo(history),
        };
      };

      const applied = snapshot();
      for (let index = 0; index < 3; index += 1) {
        const entry = historyModule.findUndoableEntry(history);
        if (!entry?.revertToken) throw new Error(`Missing undo entry ${index}`);
        executorModule.revertMapCommand(entry.revertToken, effects);
        history = historyModule.markMapActionUndone(history, entry.commandId);
      }
      const undone = snapshot();
      for (let index = 0; index < 3; index += 1) {
        const entry = historyModule.findRedoableEntry(history);
        if (!entry?.redoToken) throw new Error(`Missing redo entry ${index}`);
        executorModule.redoMapCommand(entry.redoToken, effects);
        history = historyModule.markMapActionRedone(history, entry.commandId);
      }
      const redone = snapshot();

      return { applied, undone, redone };
    });

    expect(proof.applied.layerIds).toEqual(["p54-added-layer"]);
    expect(proof.applied.style).toMatchObject({ fillColor: "#f59e0b" });
    expect(proof.applied.aoiCoordinate).toEqual([29.1, 41.09]);
    expect(proof.applied.undo).toMatchObject({ canUndo: true, canRedo: false, undoDepth: 3 });

    expect(proof.undone.layerIds).toEqual([]);
    expect(proof.undone.aoiCoordinate).toEqual([29.08, 41.08]);
    expect(proof.undone.undo).toMatchObject({ canUndo: false, canRedo: true, redoDepth: 3 });

    expect(proof.redone.layerIds).toEqual(["p54-added-layer"]);
    expect(proof.redone.style).toMatchObject({ fillColor: "#f59e0b" });
    expect(proof.redone.opacity).toBe(0.88);
    expect(proof.redone.aoiCoordinate).toEqual([29.1, 41.09]);
    expect(proof.redone.undo).toMatchObject({ canUndo: true, canRedo: false, undoDepth: 3 });
  });
});