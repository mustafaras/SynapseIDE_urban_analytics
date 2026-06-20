import { expect, test, type Page } from "@playwright/test";
import { openMapCommand } from "./helpers/mapExplorer";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

/**
 * Prompt 24a proof: search "buffer" in the processing toolbox, run it on a
 * projected layer, and assert an output layer + reproducibility manifest appear.
 */
async function seedProjectedLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-toolbox-projected",
      name: "E2E Projected Parcels",
      type: "geojson",
      visible: true,
      opacity: 0.8,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      sourceData: {
        type: "FeatureCollection",
        features: Array.from({ length: 4 }, (_, index) => ({
          type: "Feature",
          id: `parcel-${index}`,
          geometry: {
            type: "Polygon",
            coordinates: [[
              [29.0 + index * 0.02, 41.0],
              [29.015 + index * 0.02, 41.0],
              [29.015 + index * 0.02, 41.015],
              [29.0 + index * 0.02, 41.015],
              [29.0 + index * 0.02, 41.0],
            ]],
          },
          properties: { zone: index % 2 === 0 ? "residential" : "commercial", area_m2: 1500 + index * 250 },
        })),
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 4,
        fields: ["zone", "area_m2"],
        crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
      },
    });
  });
}

async function openProcessingToolbox(page: Page, mapExplorer: ReturnType<Page["getByRole"]>): Promise<void> {
  await openMapCommand(page, mapExplorer, /processing toolbox/i, /processing toolbox/i);
}

test.describe("Map Explorer processing toolbox", () => {
  test("searches for buffer and runs it, producing an output layer with a manifest", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(
      page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first(),
    );
    await seedProjectedLayer(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Projected Parcels");

    await openProcessingToolbox(page, mapExplorer);

    const toolbox = page.getByTestId("map-processing-toolbox");
    await expect(toolbox).toBeVisible();

    await toolbox.getByTestId("processing-tool-search").fill("buffer");
    await triggerDomClick(toolbox.getByTestId("processing-tool-buffer"));

    // Projected CRS → not blocked.
    await expect(toolbox.getByTestId("processing-preflight-blocked")).toHaveCount(0);
    const runButton = toolbox.getByTestId("processing-tool-run");
    await expect(runButton).toBeEnabled();
    await triggerDomClick(runButton);

    const result = toolbox.getByTestId("processing-run-result");
    await expect(result).toHaveAttribute("data-run-status", "applied");
    await expect(toolbox.getByTestId("processing-run-output-layer")).toContainText("Buffer");
    await expect(toolbox.getByTestId("processing-run-manifest")).toContainText("manifest-processing-buffer");
    // The derived buffer layer is added and selected in the canonical layer inspector.
    await expect(page.getByTestId("map-layer-inspector")).toContainText("Buffer · E2E Projected Parcels");
  });
});
