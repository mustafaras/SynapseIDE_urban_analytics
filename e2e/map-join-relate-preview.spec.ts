import { expect, test, type Page } from "@playwright/test";
import { openMapCommand } from "./helpers/mapExplorer";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function seedPrompt50Layers(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
    const { fcPointsWGS84, fcPolygonsProjected } = await import("/src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts");
    const store = useMapExplorerStore.getState();
    store.replaceOverlayLayers([]);
    store.addOverlayLayer({
      id: "e2e-p50-points",
      name: "E2E fcPointsWGS84",
      type: "geojson",
      visible: true,
      opacity: 0.95,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      queryable: true,
      sourceData: fcPointsWGS84,
      metadata: {
        featureCount: fcPointsWGS84.features.length,
        geometryType: "Point",
        fields: ["id", "name", "value", "date"],
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
      },
    });
    store.addOverlayLayer({
      id: "e2e-p50-polygons",
      name: "E2E fcPolygonsProjected",
      type: "geojson",
      visible: true,
      opacity: 0.55,
      group: "data",
      sourceKind: "imported",
      qaStatus: "passed",
      queryable: true,
      sourceData: fcPolygonsProjected.featureCollection,
      metadata: {
        featureCount: fcPolygonsProjected.featureCollection.features.length,
        geometryType: "Polygon",
        fields: ["id", "zone", "area_m2"],
        crsSummary: { crs: fcPolygonsProjected.declaredCrs, status: "known", source: "explicit", notes: [] },
      },
    });
  });
}

async function openProcessingToolbox(page: Page, mapExplorer: ReturnType<Page["getByRole"]>): Promise<void> {
  await openMapCommand(page, mapExplorer, /processing toolbox/i, /processing toolbox/i);
}

test.describe("Map Explorer — join / relate preview @smoke", () => {
  test("shows matched and unmatched counts before applying fcPointsWGS84 within fcPolygonsProjected", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(
      page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first(),
    );
    await seedPrompt50Layers(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E fcPolygonsProjected");

    await openProcessingToolbox(page, mapExplorer);
    const toolbox = page.getByTestId("map-processing-toolbox");
    await expect(toolbox).toBeVisible();

    await toolbox.getByTestId("processing-tool-search").fill("spatial join");
    await triggerDomClick(toolbox.getByTestId("processing-tool-spatial-join"));
    await toolbox.getByTestId("processing-param-layer").selectOption({ label: "E2E fcPointsWGS84" });
    await toolbox.getByTestId("processing-param-layerB").selectOption({ label: "E2E fcPolygonsProjected" });
    await toolbox.getByTestId("processing-param-predicate").selectOption("within");

    const preview = toolbox.getByTestId("processing-join-preview");
    await expect(preview).toBeVisible({ timeout: 10_000 });
    await expect(toolbox.getByTestId("processing-join-matched-count")).toContainText(/Matched: [1-9]\d* \/ 25/);
    await expect(toolbox.getByTestId("processing-join-unmatched-count")).toContainText(/Unmatched: [1-9]\d*/);
    await expect(toolbox.getByTestId("processing-join-cardinality")).toContainText(/Cardinality: (1:1|1:N|N:1|N:M)/);

    const runButton = toolbox.getByTestId("processing-tool-run");
    await expect(runButton).toBeEnabled();
    await runButton.click({ force: true });
    await expect(toolbox.getByTestId("processing-run-result")).toHaveAttribute("data-run-status", "applied");
    await expect(toolbox.getByTestId("processing-run-manifest")).toContainText("manifest-processing-spatial-join");
    // Result layer routing can land in different workbench surfaces; the run + manifest proof is the stable contract.
  });
});
