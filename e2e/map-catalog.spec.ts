import { expect, test, type Locator, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openCatalog(page: Page, mapExplorer: Locator): Promise<void> {
  const directButton = mapExplorer.getByRole("button", { name: /catalog/i }).first();
  if (await directButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await triggerDomClick(directButton);
    return;
  }
  await triggerDomClick(
    mapExplorer.getByRole("button", { name: "Scientific QA, 3D sync, density, and command controls" }),
  );
  await triggerDomClick(
    page.getByRole("menu", { name: "Advanced commands" }).getByRole("menuitem", { name: /catalog/i }),
  );
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
    await expect(catalog).toContainText("DEMO / SYNTHETIC");
    await expect(catalog).toContainText("Not observational data");
    await triggerDomClick(catalog.getByTestId("catalog-add-demo-pack"));

    const layerRow = page.getByRole("option", { name: /Layer: Fatih Demo Blocks/i }).first();
    await expect(layerRow).toBeVisible();
    await expect(layerRow).toContainText(/Demo \/ restored/i);
  });
});
