import { expect, test, type Page } from "@playwright/test";
import { openMapCommand } from "./helpers/mapExplorer";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

/**
 * Prompt 24c proof: a screenshot of the styled toolbox with a blocked tool
 * showing its reason BEFORE any run (Run disabled, reason visible pre-run).
 */
async function openProcessingToolbox(page: Page, mapExplorer: ReturnType<Page["getByRole"]>): Promise<void> {
  await openMapCommand(page, mapExplorer, /processing toolbox/i, /processing toolbox/i);
}

test.describe("Map Explorer processing toolbox — premium styling + blocked states", () => {
  test("shows a not-yet-wired tool's reason before run and screenshots the toolbox", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(
      page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first(),
    );

    await openProcessingToolbox(page, mapExplorer);
    const toolbox = page.getByTestId("map-processing-toolbox");
    await expect(toolbox).toBeVisible();

    // Select a not-yet-wired tool; its reason must be visible with no run performed.
    await toolbox.getByTestId("processing-tool-search").fill("zonal");
    await triggerDomClick(toolbox.getByTestId("processing-tool-raster-zonal-stats"));

    await expect(toolbox.getByTestId("processing-run-result")).toHaveCount(0);
    await expect(toolbox.getByTestId("processing-preflight-blocked")).toBeVisible();
    await expect(toolbox.getByTestId("processing-preflight-blocked")).toContainText(/not yet wired/i);
    await expect(toolbox.getByTestId("processing-tool-run")).toBeDisabled();
    // runtime-mode chip is part of the premium detail header.
    await expect(toolbox.getByTestId("processing-tool-runtime-chip")).toBeVisible();

    await toolbox.screenshot({ path: "test-results/processing-toolbox-24c-blocked.png" });
  });
});
