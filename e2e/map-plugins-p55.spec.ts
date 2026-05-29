import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedProjectedLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const storeModule = await import("/src/stores/useMapExplorerStore.ts");
    storeModule.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-p55-projected",
      name: "E2E P55 Projected Parcels",
      type: "geojson",
      visible: true,
      opacity: 0.85,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      sourceData: {
        type: "FeatureCollection",
        features: Array.from({ length: 4 }, (_, index) => ({
          type: "Feature",
          id: `p55-parcel-${index}`,
          geometry: {
            type: "Polygon",
            coordinates: [[
              [29 + index * 0.02, 41],
              [29.012 + index * 0.02, 41],
              [29.012 + index * 0.02, 41.012],
              [29 + index * 0.02, 41.012],
              [29 + index * 0.02, 41],
            ]],
          },
          properties: { zone: index % 2 === 0 ? "residential" : "commercial", area_m2: 1200 + index * 150, population: 450 + index * 25 },
        })),
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 4,
        fields: ["zone", "area_m2", "population"],
        crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
      },
    });
  });
}

async function openAdvancedCommand(
  page: Page,
  mapExplorer: ReturnType<Page["getByRole"]>,
  directName: RegExp,
  menuName: RegExp,
): Promise<void> {
  const directButton = mapExplorer.getByRole("button", { name: directName }).first();
  if (await directButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await triggerDomClick(directButton);
    return;
  }
  await triggerDomClick(
    mapExplorer.getByRole("button", { name: "Scientific QA, 3D sync, density, and command controls" }),
  );
  await triggerDomClick(
    page.getByRole("menu", { name: "Advanced commands" }).getByRole("menuitem", { name: menuName }),
  );
}

test.describe("Map Explorer plugin registry", () => {
  test("lists reference extensions and runs the reference processing plugin through the lifecycle", async ({ page }) => {
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
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E P55 Projected Parcels");

    await openAdvancedCommand(page, mapExplorer, /Open plugin and extension registry/i, /plugin/i);
    const pluginPanel = page.getByTestId("map-plugin-panel");
    await expect(pluginPanel).toBeVisible();
    await expect(pluginPanel.getByTestId("map-plugin-extension-source.cityjson-static")).toBeVisible();
    await expect(pluginPanel.getByTestId("map-plugin-extension-renderer.dot-density-reference")).toBeVisible();
    await expect(pluginPanel.getByTestId("map-plugin-extension-processing.plugin-envelope")).toBeVisible();
    await expect(pluginPanel.getByTestId("map-plugin-extension-urban.walkability-reference")).toBeVisible();

    await openAdvancedCommand(page, mapExplorer, /processing toolbox/i, /processing toolbox/i);
    const toolbox = page.getByTestId("map-processing-toolbox");
    await expect(toolbox).toBeVisible();
    await toolbox.getByTestId("processing-tool-search").fill("plugin envelope");
    await triggerDomClick(toolbox.getByTestId("processing-tool-plugin-envelope"));
    await expect(toolbox.getByTestId("processing-preflight-ok")).toContainText("Ready");

    await triggerDomClick(toolbox.getByTestId("processing-tool-run"));
    await expect(toolbox.getByTestId("processing-run-result")).toHaveAttribute("data-run-status", "applied");
    await expect(toolbox.getByTestId("processing-run-output-layer")).toContainText("Plugin envelope");
    await expect(toolbox.getByTestId("processing-run-manifest")).toContainText("manifest-processing-plugin-envelope");

    await expect.poll(async () => page.evaluate(async () => {
      const storeModule = await import("/src/stores/useMapExplorerStore.ts");
      const layer = storeModule.useMapExplorerStore
        .getState()
        .overlayLayers.find((entry) => entry.name === "Plugin envelope · E2E P55 Projected Parcels");
      return {
        hasLayer: Boolean(layer),
        hasManifest: Boolean(layer?.metadata?.reproducibilityManifest?.manifestId?.startsWith("manifest-processing-plugin-envelope")),
        reviewEvent: storeModule.useMapExplorerStore
          .getState()
          .reviewSession.events.some((event) => event.title.includes("Applied workflow")),
      };
    })).toEqual({ hasLayer: true, hasManifest: true, reviewEvent: true });
  });
});