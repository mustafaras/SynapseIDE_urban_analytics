import { expect, test } from "@playwright/test";

import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedPointLayerForPolygonMethod(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const features = Array.from({ length: 30 }, (_, index) => ({
      type: "Feature" as const,
      id: `urban-method-point-${index}`,
      geometry: {
        type: "Point" as const,
        coordinates: [29 + index * 0.0001, 41 + index * 0.0001],
      },
      properties: {
        numeric_indicator: index + 1,
        observed_at: "2026-05-01",
      },
    }));

    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-urban-method-points",
      name: "E2E Point Observations",
      type: "geojson",
      visible: true,
      opacity: 0.9,
      sourceKind: "imported",
      queryable: true,
      sourceData: { type: "FeatureCollection", features },
      metadata: {
        fields: ["numeric_indicator", "observed_at"],
        featureCount: features.length,
        crsSummary: { crs: "EPSG:3857", status: "known", source: "explicit", notes: [] },
        geometrySummary: { geometryType: "Point", geometryTypes: ["Point"], featureCount: features.length, source: "explicit", notes: [] },
        schemaSummary: {
          fieldCount: 2,
          source: "explicit",
          notes: [],
          fields: [
            { name: "numeric_indicator", role: "attribute", type: "number" },
            { name: "observed_at", role: "temporal", type: "date" },
          ],
        },
      },
    });
  });
}

test.describe("Urban method compatibility rail", () => {
  test("blocks a polygon-requiring method against a point layer", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await seedPointLayerForPolygonMethod(page);

    await triggerDomClick(urbanModal.getByTestId("cp-tab-methods"));
    await urbanModal.getByRole("searchbox", { name: "Search methods and tools" }).fill("spatial autocorrelation");
    await triggerDomClick(urbanModal.getByRole("button", { name: /Spatial Autocorrelation \(Moran's I\)/i }).first());
    await expect(urbanModal.locator(".rp-title")).toContainText("Spatial Autocorrelation");

    await triggerDomClick(urbanModal.getByTestId("urban-method-prepare-in-map"));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    const rail = mapExplorer.getByTestId("map-urban-method-compatibility-rail");
    await expect(rail).toBeVisible();
    await expect(rail.getByTestId("map-urban-method-status")).toContainText("Blocked");
    await expect(rail).toContainText("requires polygon");
    await expect(rail.getByTestId("map-urban-method-preview-workflow")).toBeDisabled();
  });
});
