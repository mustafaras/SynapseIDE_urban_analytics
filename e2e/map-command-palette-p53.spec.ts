import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedProjectedLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const storeModule = await import("/src/stores/useMapExplorerStore.ts");
    storeModule.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-p53-projected",
      name: "E2E P53 Projected Parcels",
      type: "geojson",
      visible: true,
      opacity: 0.85,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      sourceData: {
        type: "FeatureCollection",
        features: Array.from({ length: 4 }, (_, index) => ({
          type: "Feature",
          id: `p53-parcel-${index}`,
          geometry: {
            type: "Polygon",
            coordinates: [[
              [29 + index * 0.02, 41],
              [29.012 + index * 0.02, 41],
              [29.012 + index * 0.02, 41.012],
              [29 + index * 0.02, 41.012],
              [29 + index * 0.02, 41],
            ]],
          },
          properties: { zone: index % 2 === 0 ? "residential" : "commercial", area_m2: 1200 + index * 150 },
        })),
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 4,
        fields: ["zone", "area_m2"],
        crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
      },
    });
  });
}

test.describe("Map Explorer command palette", () => {
  test("opens with Ctrl+K, fuzzy-searches buffer, and runs the processing tool from the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(
      page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first(),
    );
    await seedProjectedLayer(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E P53 Projected Parcels");

    await mapExplorer.focus();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyK");
    await page.keyboard.up("Control");
    const palette = page.getByRole("dialog", { name: "Map command palette" });
    await expect(palette).toBeVisible();
    await palette.getByLabel("Search map commands").fill("bufr");
    await expect(palette.getByRole("option", { name: /Buffer/i }).first()).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(palette).toBeHidden();
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("Buffer · E2E P53 Projected Parcels");

    await expect.poll(async () => page.evaluate(async () => {
      const storeModule = await import("/src/stores/useMapExplorerStore.ts");
      const layer = storeModule.useMapExplorerStore
        .getState()
        .overlayLayers.find((entry) => entry.name === "Buffer · E2E P53 Projected Parcels");
      return {
        hasLayer: Boolean(layer),
        hasManifest: Boolean(layer?.metadata?.reproducibilityManifest?.manifestId?.startsWith("manifest-processing-buffer")),
        reviewEvent: storeModule.useMapExplorerStore
          .getState()
          .reviewSession.events.some((event) => event.title.includes("Applied workflow")),
      };
    })).toEqual({ hasLayer: true, hasManifest: true, reviewEvent: true });
  });
});
