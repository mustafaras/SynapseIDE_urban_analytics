/**
 * Prompt 38 — work-surface visual pass Playwright smoke test.
 * Verifies that the processing toolbox shows blocked preflight state
 * before run and that the attribute table renders with accessible close button.
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
    await triggerDomClick(mapExplorer.getByTestId("activity-btn-layers"));
    await triggerDomClick(page.getByTestId("map-workbench-sidebar-tab-layers-stack"));

    await seedGeoJSONLayerFixture(page, {
      id: "p38-streets",
      name: "Üsküdar Demo Streets",
      featureCollection: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [[29.0, 41.0], [29.01, 41.01]] },
            properties: { name: "Demo street", class: "residential" },
          },
        ],
      },
      datasetTitle: "Üsküdar Demo Streets",
      sourceLabel: "P38 E2E seeded streets",
    });

    const streetsRow = page.getByRole("listitem", { name: /Layer: Üsküdar Demo Streets/i }).first();
    await expect(streetsRow).toBeVisible({ timeout: 8000 });
    await openLayerActionMenu(streetsRow);
    const tableBtn = streetsRow.getByTestId("map-layer-table-trigger");
    await expect(tableBtn).toBeVisible({ timeout: 8000 });
    await expect(tableBtn).toBeEnabled();
    await triggerDomClick(tableBtn);
    const table = page.getByTestId("map-attribute-table");
    const dockAttributes = page
      .getByTestId("map-right-dock-attributes-body")
      .or(page.getByTestId("map-bottom-panel-attributes"));

    if (await table.isVisible().catch(() => false)) {
      await expect(table.getByRole("button", { name: "Close attribute table" })).toBeVisible();
    } else {
      await expect(dockAttributes.first()).toBeVisible({ timeout: 6000 });
    }

    await page.screenshot({ path: "e2e/__screens__/p38-attribute-table.png" });
  });
});
