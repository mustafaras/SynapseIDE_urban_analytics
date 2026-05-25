import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openMapExplorer(page: import("@playwright/test").Page) {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  const exploreButton = page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first();
  await expect(exploreButton).toBeVisible();
  await triggerDomClick(exploreButton);
  return mapExplorer;
}

test.describe("Map Explorer — external service production path (Prompt 21)", () => {
  test("a broken external service surfaces a specific actionable failure and a layer caveat", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);

    // Seed an external WMS layer whose dependency the MapConnectionRegistry
    // has classified as a specific failure (CORS) — not a blank tile.
    await page.evaluate(async () => {
      const registry = await import("/src/services/map/sources/MapConnectionRegistry.ts");
      const store = (await import("/src/stores/useMapExplorerStore.ts")).useMapExplorerStore.getState();

      const descriptor = registry.createConnectionDescriptor({
        sourceId: "e2e-external-wms",
        serviceKind: "wms",
        endpoint: "https://example.invalid/wms",
        title: "Offline WMS",
        crs: "EPSG:3857",
      });
      const failure = registry.classifyExternalServiceFailure(new TypeError("Failed to fetch"));
      const externalService = registry.buildConnectionLayerMetadata(descriptor, {
        dependencyStatus: "offline",
        checkedAt: new Date().toISOString(),
        failureKind: failure.kind,
        offlineReason: failure.reason,
      });

      store.addOverlayLayer({
        id: "e2e-external-wms",
        name: "E2E Offline WMS",
        type: "raster-tile",
        visible: true,
        opacity: 0.82,
        group: "data",
        sourceKind: "external",
        queryable: false,
        sourceData: "https://example.invalid/wms?bbox={bbox-epsg-3857}",
        metadata: {
          geometryType: "Raster tiles",
          featureCount: 0,
          externalService,
        },
      });
    });

    const layerList = page.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("E2E Offline WMS");

    // Inspect the layer → Report tab shows the dependency caveat reaching
    // publication readiness: status is blocked and the offline reason renders.
    const layerRow = page.getByRole("option", { name: /Layer: E2E Offline WMS/i });
    await triggerDomClick(layerRow.getByTestId("map-layer-inspect-trigger"));
    const inspector = page.getByTestId("map-layer-inspector");
    await expect(inspector).toBeVisible();

    await triggerDomClick(inspector.getByTestId("map-layer-inspector-tab-report"));
    const reportPanel = page.getByTestId("map-layer-inspector-panel-report");
    await expect(reportPanel).toContainText("blocked");
    // The specific, actionable failure reason (not a blank tile) reaches the layer.
    await expect(reportPanel).toContainText("CORS proxy");
  });
});
