import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedExportLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-image-export-layer",
      name: "E2E Image Export District",
      type: "geojson",
      visible: true,
      opacity: 0.78,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      sourceData: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "image-export-district-1",
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
              district: "Export QA",
              access_index: 72.4,
            },
          },
        ],
      },
      style: {
        color: "#3794ff",
        fillColor: "#3794ff",
        fillOpacity: 0.36,
        strokeColor: "#6aa9ff",
        legendEntries: [
          { label: "Export QA district", color: "#3794ff" },
        ],
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["district", "access_index"],
        datasetContext: {
          datasetId: "e2e-image-export",
          datasetTitle: "E2E Image Export Fixture",
          source: "Playwright fixture",
          license: "CC0-1.0",
          crs: "EPSG:4326",
        },
      },
    });
  });
}

test.describe("Map Explorer PNG image export", () => {
  test("opens the full image export dialog from the visible toolbar UI", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());
    await seedExportLayer(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Image Export District");

    await triggerDomClick(mapExplorer.getByRole("button", { name: "Save, load, and export map outputs" }));
    await triggerDomClick(page.getByRole("menu", { name: "Export commands" }).getByRole("menuitem", {
      name: "Export current map as PNG",
    }));

    const dialog = page.getByRole("dialog", { name: "Publication map export options" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Publication Composition" })).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Format" })).toHaveValue("pdf");
    await dialog.getByRole("combobox", { name: "Format" }).selectOption("png");
    await expect(dialog.getByRole("combobox", { name: "Format" })).toHaveValue("png");

    await dialog.getByRole("combobox", { name: "DPI" }).selectOption("300");
    await expect(dialog.getByRole("combobox", { name: "DPI" })).toHaveValue("300");

    await dialog.getByRole("textbox", { name: "Title", exact: true }).fill("A4 briefing export");
    await expect(dialog.getByRole("textbox", { name: "Title", exact: true })).toHaveValue("A4 briefing export");

    await expect(dialog.getByRole("checkbox", { name: "Scale bar" })).toBeVisible();
    await expect(dialog.getByRole("checkbox", { name: "North arrow" })).toBeVisible();
    await dialog.getByRole("checkbox", { name: "Auto legend" }).check();
    await expect(dialog.getByRole("checkbox", { name: "Attribution" })).toBeVisible();
    await expect(dialog.getByText("Preview", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Download PNG" })).toBeVisible();
  });
});
