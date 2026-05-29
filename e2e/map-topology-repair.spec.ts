import { expect, test } from "@playwright/test";
import { resetWorkbenchState } from "./helpers/urbanAnalytics";

/**
 * Prompt 49 — topology validation + guided repair.
 *
 * Proof: seed fcInvalidGeometry, confirm the invalid badge/action precondition,
 * preview/apply repair through workflow.apply, then assert the badge clears and
 * a review audit row is written.
 */
test.describe("Map Explorer — topology repair @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await resetWorkbenchState(page);
  });

  test("fcInvalidGeometry repair clears invalid badge and records audit", async ({ page }) => {
    const proof = await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const { applyMapCommand } = await import("/src/services/map/actions/MapActionExecutor.ts");
      const { evaluateMapScientificQASync } = await import("/src/services/map/MapScientificQA.ts");
      const { previewLayerTopologyRepair } = await import("/src/services/map/topology/TopologyRepairService.ts");
      const { fcInvalidGeometry } = await import("/src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts");

      const baseLayer = {
        id: "e2e-invalid-geometry",
        name: "E2E invalid geometry",
        type: "geojson" as const,
        visible: true,
        opacity: 1,
        sourceKind: "imported" as const,
        group: "data" as const,
        queryable: true,
        sourceData: fcInvalidGeometry,
        metadata: {
          featureCount: fcInvalidGeometry.features.length,
          geometryType: "Polygon",
          crsSummary: {
            crs: "EPSG:4326",
            status: "known" as const,
            source: "explicit" as const,
            notes: [],
          },
        },
      };
      const beforeQa = evaluateMapScientificQASync([baseLayer], { workerThresholdFeatures: Number.POSITIVE_INFINITY });
      const beforeSummary = beforeQa.layerSummaries[0];
      const invalidLayer = {
        ...baseLayer,
        qaStatus: beforeSummary?.status ?? "unchecked" as const,
        metadata: {
          ...baseLayer.metadata,
          ...(beforeSummary ? { scientificQA: beforeSummary.metadata } : {}),
        },
      };

      const store = useMapExplorerStore.getState();
      store.replaceOverlayLayers([]);
      store.addOverlayLayer(invalidLayer);
      store.setScientificQA(beforeQa);

      const invalidBadges = useMapExplorerStore.getState().overlayLayers[0]?.metadata?.scientificQA?.badges ?? [];
      const repairActionVisible = invalidBadges.includes("invalid_geometry")
        && typeof useMapExplorerStore.getState().overlayLayers[0]?.sourceData === "object";
      const preview = await previewLayerTopologyRepair(invalidLayer, {
        now: () => "2026-05-29T00:00:00.000Z",
        idFactory: () => "e2e",
        mapContextId: "e2e-map",
      });
      if (!preview.outputLayer || !preview.manifest) {
        return {
          repairActionVisible,
          canApply: preview.canApply,
          blocked: preview.blockers.join(" "),
          afterInvalidBadge: true,
          auditRecorded: false,
          removedFeatureCount: preview.preview.removedFeatureCount,
          repairedFeatureCount: preview.preview.repairedFeatureCount,
        };
      }

      const effects = {
        getLayer: (id: string) => useMapExplorerStore.getState().overlayLayers.find((layer) => layer.id === id) ?? null,
        getLayerOrder: () => useMapExplorerStore.getState().overlayLayers.map((layer) => layer.id),
        addLayer: (layer: typeof preview.outputLayer) => useMapExplorerStore.getState().addOverlayLayer(layer),
        removeLayer: (id: string) => useMapExplorerStore.getState().removeOverlayLayer(id),
        setLayerOrder: (orderedIds: string[]) => useMapExplorerStore.getState().reorderLayers(orderedIds),
        setLayerStyle: (id: string, style: Record<string, unknown>) => useMapExplorerStore.getState().updateLayerMetadata(id, { style }),
        removeReportItem: () => {},
      };
      const outcome = applyMapCommand({
        kind: "workflow.apply",
        workflowId: preview.manifest.workflowId,
        outputLayer: preview.outputLayer,
        replaceLayerId: invalidLayer.id,
        canApply: true,
        manifest: preview.manifest,
        caveats: preview.caveats,
      }, effects, {
        idFactory: () => "cmd-e2e-topology",
        now: () => "2026-05-29T00:00:00.000Z",
      });
      useMapExplorerStore.getState().addMapReviewEvent(outcome.reviewEvent);
      const afterQa = evaluateMapScientificQASync(useMapExplorerStore.getState().overlayLayers, {
        workerThresholdFeatures: Number.POSITIVE_INFINITY,
      });
      useMapExplorerStore.getState().setScientificQA(afterQa);
      const repairedLayer = useMapExplorerStore.getState().overlayLayers.find((layer) => layer.id === invalidLayer.id);
      const auditRecorded = useMapExplorerStore.getState().reviewSession.events.some((event) =>
        event.details?.commandKind === "workflow.apply"
        && event.details?.workflowId === "topology.repair"
        && event.details?.replaceLayerId === invalidLayer.id,
      );

      return {
        repairActionVisible,
        canApply: preview.canApply,
        blocked: preview.blockers.join(" "),
        afterInvalidBadge: repairedLayer?.metadata?.scientificQA?.badges.includes("invalid_geometry") ?? true,
        auditRecorded,
        removedFeatureCount: repairedLayer?.metadata?.topologyRepair?.removedFeatureCount ?? 0,
        repairedFeatureCount: repairedLayer?.metadata?.topologyRepair?.repairedFeatureCount ?? 0,
      };
    });

    expect(proof.repairActionVisible).toBe(true);
    expect(proof.canApply, proof.blocked).toBe(true);
    expect(proof.afterInvalidBadge).toBe(false);
    expect(proof.auditRecorded).toBe(true);
    expect(proof.repairedFeatureCount).toBe(1);
    expect(proof.removedFeatureCount).toBe(1);
  });
});
