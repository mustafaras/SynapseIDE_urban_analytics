import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

/**
 * Prompt 24b proof: the toolbox lists ≥12 implemented tools, and spatial-join
 * runs on a points + polygons pair, producing a manifest-backed output layer.
 */
async function seedJoinLayers(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const store = module.useMapExplorerStore.getState();
    store.addOverlayLayer({
      id: "e2e-join-points",
      name: "E2E Join Points",
      type: "geojson",
      visible: true,
      opacity: 0.9,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      sourceData: {
        type: "FeatureCollection",
        features: Array.from({ length: 6 }, (_, index) => ({
          type: "Feature",
          id: `pt-${index}`,
          geometry: { type: "Point", coordinates: [29.005 + index * 0.005, 41.005] },
          properties: { id: index, name: `pt-${index}` },
        })),
      },
      metadata: {
        geometryType: "Point",
        featureCount: 6,
        fields: ["id", "name"],
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
      },
    });
    store.addOverlayLayer({
      id: "e2e-join-polys",
      name: "E2E Join Polys",
      type: "geojson",
      visible: true,
      opacity: 0.6,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      sourceData: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "zone-a",
            geometry: {
              type: "Polygon",
              coordinates: [[
                [29.0, 41.0],
                [29.05, 41.0],
                [29.05, 41.02],
                [29.0, 41.02],
                [29.0, 41.0],
              ]],
            },
            properties: { zone: "central" },
          },
        ],
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["zone"],
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
      },
    });
  });
}

async function openProcessingToolbox(page: Page, mapExplorer: ReturnType<Page["getByRole"]>): Promise<void> {
  const directButton = mapExplorer.getByRole("button", { name: /processing toolbox/i }).first();
  if (await directButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await triggerDomClick(directButton);
    return;
  }
  await triggerDomClick(
    mapExplorer.getByRole("button", { name: "Scientific QA, 3D sync, density, and command controls" }),
  );
  await triggerDomClick(
    page.getByRole("menu", { name: "Advanced commands" }).getByRole("menuitem", { name: /processing toolbox/i }),
  );
}

test.describe("Map Explorer processing toolbox — service tools", () => {
  test("lists ≥12 implemented tools and runs spatial-join with a manifest", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(
      page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first(),
    );
    await seedJoinLayers(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Join Polys");

    await openProcessingToolbox(page, mapExplorer);
    const toolbox = page.getByTestId("map-processing-toolbox");
    await expect(toolbox).toBeVisible();

    // ≥12 implemented tools (total options minus the "not wired yet" stubs).
    const options = toolbox.getByRole("option");
    const totalOptions = await options.count();
    const stubOptions = await toolbox.getByRole("option").filter({ hasText: "not wired yet" }).count();
    expect(totalOptions - stubOptions).toBeGreaterThanOrEqual(12);

    // Run spatial-join: points joined to the polygon layer.
    await toolbox.getByTestId("processing-tool-search").fill("spatial join");
    await triggerDomClick(toolbox.getByTestId("processing-tool-spatial-join"));
    await expect(toolbox.getByTestId("processing-param-layerB")).toBeVisible();
    await toolbox.getByTestId("processing-param-layer").selectOption({ label: "E2E Join Points" });
    await toolbox.getByTestId("processing-param-layerB").selectOption({ label: "E2E Join Polys" });

    // The pre-run preflight notice flips to ready once both inputs resolve.
    await expect(toolbox.getByTestId("processing-preflight-ok")).toBeVisible({ timeout: 10_000 });
    const runButton = toolbox.getByTestId("processing-tool-run");
    await expect(runButton).toBeEnabled();
    await runButton.scrollIntoViewIfNeeded();
    await runButton.click({ force: true });

    const result = toolbox.getByTestId("processing-run-result");
    await expect(result).toHaveAttribute("data-run-status", "applied");
    await expect(toolbox.getByTestId("processing-run-manifest")).toContainText("manifest-processing-spatial-join");
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("Spatial join · E2E Join Points");
  });
});
