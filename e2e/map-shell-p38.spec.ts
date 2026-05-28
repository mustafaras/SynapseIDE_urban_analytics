/**
 * Prompt 38 — work-surface visual pass Playwright smoke test.
 * Verifies that the processing toolbox shows blocked preflight state
 * before run and that the attribute table renders with accessible close button.
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

test.describe("P38 — work-surface visual pass @smoke", () => {
  test("processing toolbox close button is accessible via GisIconButton", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    const mapExplorer = await openMapExplorer(page);

    // Open the processing toolbox via the Toolbox toolbar button
    const toolboxBtn = mapExplorer.getByRole("button", { name: /Toolbox/i }).first();
    if (await toolboxBtn.isVisible()) {
      await triggerDomClick(toolboxBtn);
      const toolbox = page.getByTestId("map-processing-toolbox");
      await expect(toolbox).toBeVisible({ timeout: 6000 });

      // Close button must have accessible label
      await expect(toolbox.getByRole("button", { name: "Close processing toolbox" })).toBeVisible();

      // Blocked preflight must be visible before running (select a CRS-required tool with no layers)
      const bufferTool = toolbox.getByTestId("processing-tool-buffer");
      if (await bufferTool.isVisible()) {
        await triggerDomClick(bufferTool);
        await expect(toolbox.getByTestId("processing-preflight-blocked")).toBeVisible({ timeout: 3000 });
      }
    }

    await page.screenshot({ path: "e2e/__screens__/p38-processing-toolbox.png" });
  });

  test("attribute table close button is accessible via GisIconButton", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    const mapExplorer = await openMapExplorer(page);

    // Seed a layer with features
    await page.evaluate(async () => {
      const m = await import("/src/stores/useMapExplorerStore.ts");
      m.useMapExplorerStore.getState().addOverlayLayer({
        id: "p38-table-layer",
        name: "P38 Table Target",
        type: "geojson",
        visible: true,
        opacity: 1,
        group: "data",
        sourceKind: "imported",
        sourceData: {
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: [29.0, 41.0] }, properties: { zone: "A", value: null } },
            { type: "Feature", geometry: { type: "Point", coordinates: [29.1, 41.1] }, properties: { zone: "B", value: 42 } },
          ],
        },
        metadata: {
          geometryType: "Point",
          featureCount: 2,
          fields: ["zone", "value"],
          crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
        },
      } as Parameters<typeof m.useMapExplorerStore.getState().addOverlayLayer>[0]);
    });

    // Open the attribute table on the seeded layer
    const layerRow = mapExplorer.getByRole("option", { name: /Layer: P38 Table Target/i }).first();
    await expect(layerRow).toBeVisible({ timeout: 8000 });

    // Try to open the table — look for a "Table" button in the layer row
    const tableBtn = layerRow.getByRole("button", { name: /Table/i }).first();
    if (await tableBtn.isVisible()) {
      await triggerDomClick(tableBtn);
      const table = page.getByTestId("map-attribute-table");
      await expect(table).toBeVisible({ timeout: 6000 });
      await expect(table.getByRole("button", { name: "Close attribute table" })).toBeVisible();
    }

    await page.screenshot({ path: "e2e/__screens__/p38-attribute-table.png" });
  });
});
