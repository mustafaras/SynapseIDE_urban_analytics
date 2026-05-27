import * as path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedAttributedLayers(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const store = module.useMapExplorerStore.getState();

    store.addOverlayLayer({
      id: "e2e-book-layer-1",
      name: "E2E Book Layer Alpha",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      qaStatus: "passed",
      sourceData: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "book-poly-1",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.96, 41.0], [29.0, 41.0], [29.0, 41.03], [28.96, 41.03], [28.96, 41.0]]],
            },
            properties: { zone: "A", value: 100 },
          },
        ],
      },
      style: {
        fillColor: "#3794ff",
        legendEntries: [{ label: "E2E Book Layer Alpha", color: "#3794ff" }],
      },
      provenance: {
        label: "E2E Attribution Source",
        sourceName: "E2E Attribution Source",
        attribution: "© E2E Test",
        license: "CC BY 4.0",
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["zone", "value"],
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
        datasetContext: {
          crs: "EPSG:4326",
          source: "E2E Attribution Source",
          license: "CC BY 4.0",
          attribution: "© E2E Test",
        },
      },
    });

    store.addOverlayLayer({
      id: "e2e-book-layer-2",
      name: "E2E Book Layer Beta",
      type: "geojson",
      visible: true,
      opacity: 1,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      qaStatus: "passed",
      sourceData: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "book-poly-2",
            geometry: {
              type: "Polygon",
              coordinates: [[[29.01, 41.0], [29.05, 41.0], [29.05, 41.03], [29.01, 41.03], [29.01, 41.0]]],
            },
            properties: { zone: "B", value: 200 },
          },
        ],
      },
      style: {
        fillColor: "#22c55e",
        legendEntries: [{ label: "E2E Book Layer Beta", color: "#22c55e" }],
      },
      provenance: {
        label: "E2E Attribution Source 2",
        sourceName: "E2E Attribution Source 2",
        attribution: "© E2E Test 2",
        license: "ODbL",
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["zone", "value"],
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
        datasetContext: {
          crs: "EPSG:4326",
          source: "E2E Attribution Source 2",
          license: "ODbL",
          attribution: "© E2E Test 2",
        },
      },
    });
  });
}

test.describe("Map Explorer layout designer (book)", () => {
  test("opens layout designer, adds a second page, asserts page count and export button", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();

    // Switch to explore mode to ensure layers panel is visible
    const exploreButton = mapExplorer.getByRole("button", {
      name: /Explore Layers|Switch map workspace to explore/i,
    }).first();
    if (await exploreButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await triggerDomClick(exploreButton);
    }

    // Seed 2 attributed layers via store
    await seedAttributedLayers(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Book Layer Alpha");

    // Open layout designer — same toolbar button as figure composer (Publish toolbar)
    await triggerDomClick(mapExplorer.getByRole("button", { name: "Switch toolbar to Publish mode" }));
    const figureButton = mapExplorer.getByRole("button", {
      name: /Compose a gate-checked publication figure/i,
    }).first();
    if (await figureButton.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await triggerDomClick(figureButton);
    } else {
      await triggerDomClick(mapExplorer.getByRole("button", {
        name: "Scientific QA, 3D sync, density, and command controls",
      }));
      await triggerDomClick(page.getByRole("menu", { name: "Advanced commands" }).getByRole("menuitem", {
        name: /Compose a gate-checked publication figure/i,
      }));
    }

    const designer = page.getByRole("dialog", { name: "Layout designer" });
    await expect(designer).toBeVisible();

    // Initially 1 page
    const pageCountEl = designer.getByTestId("map-layout-page-count");
    await expect(pageCountEl).toContainText("1");

    // Add a second page
    const addPageButton = designer.getByTestId("map-layout-add-page");
    await expect(addPageButton).toBeVisible();
    await triggerDomClick(addPageButton);

    // Assert page count is now 2
    await expect(pageCountEl).toContainText("2");

    // Tab for page 2 should exist
    await expect(designer.getByTestId("map-layout-page-tab-2")).toBeVisible();

    // Export button should be visible
    await expect(designer.getByTestId("map-layout-export")).toBeVisible();

    // Preset selector should be visible
    await expect(designer.getByTestId("map-layout-preset-select")).toBeVisible();

    // Screenshot
    await page.screenshot({
      path: path.join("e2e", "__screens__", "map-layout-book.png"),
      clip: { x: 0, y: 0, width: 1680, height: 1100 },
    });
  });
});
