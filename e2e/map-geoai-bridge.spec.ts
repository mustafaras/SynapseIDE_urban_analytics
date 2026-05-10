import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedLandCoverBridgeLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const storeModule = await import("/src/stores/useMapExplorerStore.ts");
    const adapterModule = await import("/src/services/map/MapEngineAdapter.ts");

    const labels = new Uint8Array([0, 1, 1, 2, 3, 4]);
    const probabilities = new Float32Array(labels.length * 6).fill(0.02);
    labels.forEach((label, pixelIndex) => {
      probabilities[label * labels.length + pixelIndex] = 0.92;
    });

    const adapted = adapterModule.adaptLandCoverResult({
      layerName: "E2E Land Cover Bridge",
      runId: "e2e-geoai-bridge",
      runTimestamp: "2026-04-26T12:00:00.000Z",
      bounds: [28.96, 41.0, 28.99, 41.02],
      sourceLayerIds: ["sentinel-2-e2e"],
      sourceKind: "derived",
      provenance: {
        label: "Sentinel-2 E2E fixture",
        sourceName: "Sentinel-2",
        method: "LandCoverClassifier",
        notes: ["Synthetic E2E fixture for map bridge visibility."],
      },
      parameters: {
        sourceId: "sentinel-2-e2e",
        sourceTitle: "Sentinel-2 E2E fixture",
        provider: "E2E",
        modelConfidence: 0.92,
        overallAccuracy: 0.89,
        analysisNotes: "Bridge layer created from adapter metadata only.",
      },
      caveats: ["Synthetic E2E fixture; not field validated."],
      result: {
        labels,
        probabilities,
        height: 2,
        width: 3,
      },
    });

    storeModule.useMapExplorerStore.getState().addOverlayLayer(adapted.layer);
  });
}

test.describe("Map Explorer GeoAI bridge", () => {
  test("shows adapter-backed GeoAI layer metadata", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());

    await seedLandCoverBridgeLayer(page);

    const layerList = page.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("E2E Land Cover Bridge");

    await triggerDomClick(page.getByRole("button", { name: "Show metadata for E2E Land Cover Bridge" }));

    const metadataPopover = page.getByRole("tooltip", { name: "Metadata for E2E Land Cover Bridge" });
    await expect(metadataPopover).toBeVisible();
    await expect(metadataPopover.getByText("Derived", { exact: true })).toBeVisible();
    await expect(metadataPopover.getByText("Sentinel-2 E2E fixture", { exact: true })).toBeVisible();
    await expect(metadataPopover.getByText("LandCoverClassifier", { exact: true })).toBeVisible();
  });
});
