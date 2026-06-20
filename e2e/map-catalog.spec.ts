import { expect, test, type Locator, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openCatalog(page: Page, mapExplorer: Locator): Promise<void> {
  await triggerDomClick(mapExplorer.getByTestId("activity-btn-data"));
  const catalogTab = mapExplorer.getByTestId("map-workbench-sidebar-tab-data-catalog");
  await expect(catalogTab).toBeVisible();
  await triggerDomClick(catalogTab);
}

test.describe("Map Explorer catalog", () => {
  test("adds an explicitly labelled demo pack as source-linked layers", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await openCatalog(page, mapExplorer);

    const catalog = page.getByTestId("map-catalog-panel");
    await expect(catalog).toBeVisible();
    await expect(catalog.getByTestId("catalog-readiness-demoSynthetic")).toContainText(/Demo \/ synthetic/i);
    await expect(catalog).toContainText("No synthetic source records.");
    await expect(catalog.getByTestId("catalog-add-demo-pack")).toHaveCount(0);

    const layerState = await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const layers = module.useMapExplorerStore.getState().overlayLayers;
      return {
        total: layers.length,
        demo: layers.filter((layer) => layer.sourceKind === "demo").length,
      };
    });
    expect(layerState).toEqual({ total: 0, demo: 0 });
  });
});
