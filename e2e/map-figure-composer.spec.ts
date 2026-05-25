import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedMissingAttributionLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-figure-missing-attribution",
      name: "E2E Missing Attribution District",
      type: "geojson",
      visible: true,
      opacity: 0.72,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      sourceData: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "e2e-figure-district-1",
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
              district: "Missing Attribution QA",
              access_index: 72.4,
            },
          },
        ],
      },
      style: {
        color: "#22c55e",
        fillColor: "#22c55e",
        fillOpacity: 0.34,
        strokeColor: "#86efac",
        legendEntries: [
          { label: "Missing attribution district", color: "#22c55e" },
        ],
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["district", "access_index"],
        datasetContext: {
          datasetId: "e2e-figure-missing-attribution",
          datasetTitle: "E2E Missing Attribution Fixture",
          source: "Playwright fixture",
          crs: "EPSG:4326",
        },
        crsSummary: {
          crs: "EPSG:4326",
          status: "known",
          source: "explicit",
          notes: [],
        },
      },
    });
  });
}

test.describe("Map Explorer figure composer", () => {
  test("blocks figure export with a named reason when a visible layer lacks attribution metadata", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());
    await seedMissingAttributionLayer(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Missing Attribution District");

    await triggerDomClick(mapExplorer.getByRole("button", { name: "Switch toolbar to Publish mode" }));
    const figureButton = mapExplorer.getByRole("button", {
      name: /Compose a gate-checked publication figure/i,
    }).first();
    if (await figureButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await triggerDomClick(figureButton);
    } else {
      await triggerDomClick(mapExplorer.getByRole("button", {
        name: "Scientific QA, 3D sync, density, and command controls",
      }));
      await triggerDomClick(page.getByRole("menu", { name: "Advanced commands" }).getByRole("menuitem", {
        name: /Compose a gate-checked publication figure/i,
      }));
    }

    const composer = page.getByRole("dialog", { name: "Publication figure composer" });
    await expect(composer).toBeVisible();
    await expect(composer.getByTestId("map-figure-blockers")).toContainText("Attribution and license");
    await expect(composer.getByTestId("map-figure-blockers")).toContainText("E2E Missing Attribution District");
    await expect(composer.getByTestId("map-figure-export")).toBeDisabled();
  });
});