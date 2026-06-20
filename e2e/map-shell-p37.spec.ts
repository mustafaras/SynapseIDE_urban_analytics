/**
 * Prompt 37 — operator visual pass Playwright smoke test.
 * Verifies LayerInspector GisTabs (data-testid per tab) and close button
 * are rendered, and screenshots the inspector panel for visual proof.
 *
 * @smoke
 */
import { expect, test } from "@playwright/test";
import {
  openLayerActionMenu,
  openMapExplorer,
  resetWorkbenchState,
  seedGeoJSONLayerFixture,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

test.describe("P37 — operator visual pass @smoke", () => {
  test("LayerInspector tabs carry data-testid via GisTabs tabTestIdPrefix", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    const mapExplorer = await openMapExplorer(page);
    await triggerDomClick(mapExplorer.getByTestId("activity-btn-layers"));
    await triggerDomClick(page.getByTestId("map-workbench-sidebar-tab-layers-stack"));

    await seedGeoJSONLayerFixture(page, {
      id: "p37-layer",
      name: "P37 Inspection Target",
      featureCollection: {
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: [29.0, 41.0] }, properties: { zone: "A" } },
          ],
        },
      datasetTitle: "P37 Inspection Target",
      sourceLabel: "P37 E2E seeded layer",
    });

    // Open inspector on the seeded layer
  const layerRow = page.getByRole("listitem", { name: /Layer: P37 Inspection Target/i }).first();
    await expect(layerRow).toBeVisible({ timeout: 8000 });
    await openLayerActionMenu(layerRow);
    const inspectTrigger = layerRow.getByTestId("map-layer-inspect-trigger");
    await expect(inspectTrigger).toBeVisible();
    await triggerDomClick(inspectTrigger);

    const inspector = page.getByTestId("map-inspector-host").getByTestId("map-layer-inspector");
    await expect(inspector).toBeVisible({ timeout: 8000 });

    // Verify GisTabs assigned data-testid to each tab
    await expect(inspector.locator('[data-testid="map-layer-inspector-tab-overview"]')).toBeVisible();
    await expect(inspector.locator('[data-testid="map-layer-inspector-tab-schema"]')).toBeVisible();
    await expect(inspector.locator('[data-testid="map-layer-inspector-tab-crs"]')).toBeVisible();
    await expect(inspector.locator('[data-testid="map-layer-inspector-tab-style"]')).toBeVisible();

    // Verify close button has accessible label
    await expect(page.getByTestId("map-inspector-host").getByRole("button", { name: "Close inspector" })).toBeVisible();

    await page.screenshot({ path: "e2e/__screens__/p37-layer-inspector.png" });
  });
});
