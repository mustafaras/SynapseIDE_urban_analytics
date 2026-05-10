import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openMapExplorer(page: Page) {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  const exploreButton = page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first();
  await expect(exploreButton).toBeVisible();
  await triggerDomClick(exploreButton);
  return mapExplorer;
}

async function seedReportLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-report-handoff-layer",
      name: "E2E Report Handoff District",
      type: "geojson",
      visible: true,
      opacity: 0.78,
      group: "data",
      sourceKind: "imported",
      sourceData: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "report-district-1",
            geometry: {
              type: "Polygon",
              coordinates: [[
                [28.965, 41.0],
                [28.995, 41.0],
                [28.995, 41.026],
                [28.965, 41.026],
                [28.965, 41.0],
              ]],
            },
            properties: {
              district: "Release QA",
              exposure_index: 64.2,
            },
          },
        ],
      },
      style: {
        fillColor: "#f59e0b",
        fillOpacity: 0.36,
        strokeColor: "#fbbf24",
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["district", "exposure_index"],
        datasetContext: {
          datasetId: "e2e-report-handoff",
          datasetTitle: "E2E Report Handoff Fixture",
          source: "Playwright fixture",
          crs: "EPSG:4326",
        },
      },
    });
  });
}

test.describe("Map Explorer report handoff", () => {
  test("opens a map report handoff preview and inserts it into the report builder", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);
    await seedReportLayer(page);

    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Report Handoff District");

    await page.keyboard.press("Control+K");
    const palette = page.getByRole("dialog", { name: "Map command palette" });
    await expect(palette).toBeVisible();
    await palette.getByLabel("Search map commands").fill("report");
    await triggerDomClick(palette.getByRole("option", { name: /Add current map finding to report/i }).first());

    const handoff = page.getByRole("complementary", { name: "Map report handoff preview" });
    await expect(handoff).toBeVisible();
    await expect(handoff).toContainText("Current map evidence");
    await expect(handoff).toContainText("E2E Report Handoff District");
    await expect(handoff).toContainText("EPSG:4326");

    await triggerDomClick(handoff.getByRole("button", { name: "Insert to report" }));
    await expect(page.getByText(/Added .* map report section\(s\) to the report builder/i)).toBeVisible();
    await expect(handoff).not.toBeVisible();
  });
});
