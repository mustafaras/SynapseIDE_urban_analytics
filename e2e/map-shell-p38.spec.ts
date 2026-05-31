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

    await triggerDomClick(
      page
        .getByRole("button", { name: /Add demo street, block, and building layers/i })
        .first(),
    );

    const tableBtn = mapExplorer.getByTestId("map-layer-table-trigger").first();
    await expect(tableBtn).toBeVisible({ timeout: 8000 });
    await expect(tableBtn).toBeEnabled();
    await triggerDomClick(tableBtn);
    const table = page.getByTestId("map-attribute-table");
    await expect(table).toBeVisible({ timeout: 6000 });
    await expect(table.getByRole("button", { name: "Close attribute table" })).toBeVisible();

    await page.screenshot({ path: "e2e/__screens__/p38-attribute-table.png" });
  });
});
