/**
 * Prompt 37 — operator visual pass Playwright smoke test.
 * Verifies LayerInspector GisTabs (data-testid per tab) and close button
 * are rendered, and screenshots the inspector panel for visual proof.
 *
 * @smoke
 */
import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openMapExplorer(page: import("@playwright/test").Page) {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));
  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  const exploreButton = page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first();
  await triggerDomClick(exploreButton);
  return mapExplorer;
}

test.describe("P37 — operator visual pass @smoke", () => {
  test("LayerInspector tabs carry data-testid via GisTabs tabTestIdPrefix", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    const mapExplorer = await openMapExplorer(page);

    // Seed a layer directly via the store
    await page.evaluate(async () => {
      const m = await import("/src/stores/useMapExplorerStore.ts");
      m.useMapExplorerStore.getState().addOverlayLayer({
        id: "p37-layer",
        name: "P37 Inspection Target",
        type: "geojson",
        visible: true,
        opacity: 1,
        group: "data",
        sourceKind: "imported",
        sourceData: {
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: [29.0, 41.0] }, properties: { zone: "A" } },
          ],
        },
        metadata: {
          geometryType: "Point",
          featureCount: 1,
          fields: ["zone"],
          crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
        },
      } as Parameters<typeof m.useMapExplorerStore.getState().addOverlayLayer>[0]);
    });

    // Open inspector on the seeded layer
    const layerRow = mapExplorer.getByRole("option", { name: /Layer: P37 Inspection Target/i }).first();
    await expect(layerRow).toBeVisible({ timeout: 8000 });
    const inspectTrigger = layerRow.getByTestId("map-layer-inspect-trigger");
    await triggerDomClick(inspectTrigger);

    const inspector = page.getByTestId("map-layer-inspector");
    await expect(inspector).toBeVisible({ timeout: 8000 });

    // Verify GisTabs assigned data-testid to each tab
    await expect(page.locator('[data-testid="map-layer-inspector-tab-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="map-layer-inspector-tab-schema"]')).toBeVisible();
    await expect(page.locator('[data-testid="map-layer-inspector-tab-crs"]')).toBeVisible();
    await expect(page.locator('[data-testid="map-layer-inspector-tab-style"]')).toBeVisible();

    // Verify close button has accessible label
    await expect(inspector.getByRole("button", { name: "Close layer inspector" })).toBeVisible();

    await page.screenshot({ path: "e2e/__screens__/p37-layer-inspector.png" });
  });
});
