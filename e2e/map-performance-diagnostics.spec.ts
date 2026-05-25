import { expect, test, type Locator, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedLargeFeatureCollection(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const [{ fcLarge }, importer, store] = await Promise.all([
      import("/src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts"),
      import("/src/services/map/MapDataImporter.ts"),
      import("/src/stores/useMapExplorerStore.ts"),
    ]);
    const featureCollection = fcLarge(importer.MAP_GEOJSON_RENDER_FEATURE_BUDGET + 25);
    const metadata = importer.buildFeatureCollectionMetadata(featureCollection);
    store.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-fc-large-diagnostics",
      name: "E2E fcLarge Diagnostics",
      type: "geojson",
      visible: true,
      opacity: 0.84,
      group: "data",
      sourceKind: "imported",
      qaStatus: "warning",
      sourceData: featureCollection,
      metadata: {
        ...metadata,
        datasetContext: {
          datasetId: "e2e-fc-large-diagnostics",
          datasetTitle: "E2E fcLarge Diagnostics",
          source: "Playwright fcLarge fixture",
          crs: "EPSG:4326",
        },
        crsSummary: {
          crs: "EPSG:4326",
          status: "known",
          source: "explicit",
          notes: [],
        },
        licenseAttribution: {
          license: "E2E fixture",
          attribution: "Playwright fcLarge fixture",
          sourceName: "fcLarge",
        },
      },
      style: {
        circleColor: "#f59e0b",
        circleRadius: 3,
        circleOpacity: 0.72,
      },
    });
  });
}

async function openPerformanceDiagnostics(mapExplorer: Locator, page: Page): Promise<void> {
  const diagnosticsButton = mapExplorer.getByRole("button", {
    name: /Open live render budgets and performance diagnostics/i,
  }).first();
  if (await diagnosticsButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await triggerDomClick(diagnosticsButton);
    return;
  }

  await triggerDomClick(mapExplorer.getByRole("button", {
    name: "Scientific QA, 3D sync, density, and command controls",
  }));
  await triggerDomClick(page.getByRole("menu", { name: "Advanced commands" }).getByRole("menuitem", {
    name: /Open live render budgets and performance diagnostics/i,
  }));
}

test.describe("Map Explorer performance diagnostics", () => {
  test("shows fcLarge live diagnostics and bounded-mode banner", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());

    await seedLargeFeatureCollection(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E fcLarge Diagnostics");

    const banner = mapExplorer.getByTestId("map-performance-bounded-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Bounded preview mode");
    await expect(banner).toContainText("30,025");
    await expect(banner).toContainText("30,000");

    await openPerformanceDiagnostics(mapExplorer, page);
    const panel = mapExplorer.getByTestId("map-performance-diagnostics");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("E2E fcLarge Diagnostics");
    await expect(panel).toContainText("Bounded preview");
    await expect(panel).toContainText("30,025");
    await expect(panel).toContainText("30,000");
  });
});
