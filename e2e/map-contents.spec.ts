import { expect, test, type Locator, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openMapExplorer(page: Page): Promise<Locator> {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));
  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  await triggerDomClick(mapExplorer.getByTestId("activity-btn-layers"));
  return mapExplorer;
}

async function openContents(page: Page, mapExplorer: Locator): Promise<Locator> {
  await triggerDomClick(mapExplorer.getByTestId("activity-btn-layers"));
  const contentsTab = mapExplorer.getByTestId("map-workbench-sidebar-tab-layers-contents");
  await expect(contentsTab).toBeVisible();
  await triggerDomClick(contentsTab);
  const contents = page.getByTestId("map-contents-tree");
  await expect(contents).toBeVisible();
  return contents;
}

async function seedLayers(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
    const addLayer = useMapExplorerStore.getState().addOverlayLayer;
    for (const [id, name, zone] of [
      ["e2e-contents-parcels", "Contents Parcels", "residential"],
      ["e2e-contents-roads", "Contents Roads", "transport"],
    ] as const) {
      addLayer({
        id,
        name,
        type: "geojson",
        visible: true,
        opacity: 0.85,
        group: "data",
        sourceKind: "imported",
        queryable: true,
        provenance: { label: `Persisted ${name} source`, sourceName: "E2E GIS" },
        sourceData: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: { type: "Point", coordinates: [29, 41] },
            properties: { zone },
          }],
        },
        metadata: {
          sourceId: `source-${id}`,
          geometryType: "Point",
          featureCount: 1,
          fields: ["zone"],
          crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
        },
      });
    }
  });
}

test.describe("Map Explorer professional contents tree", () => {
  test("persists a custom layer group through a saved project reload", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    const mapExplorer = await openMapExplorer(page);
    await seedLayers(page);

    const contents = await openContents(page, mapExplorer);
    await triggerDomClick(contents.getByTestId("contents-select-e2e-contents-parcels"));
    await triggerDomClick(contents.getByTestId("contents-select-e2e-contents-roads"));
    await contents.getByTestId("contents-group-name").fill("Priority Review");
    await triggerDomClick(contents.getByTestId("contents-apply-group"));
    const priorityGroup = contents.getByTestId("contents-group-group-priority-review");
    await expect(priorityGroup).toContainText("Contents Parcels");
    await expect(priorityGroup).toContainText("Contents Roads");
    await triggerDomClick(priorityGroup.getByRole("button", { name: "Move Contents Roads up" }));
    await expect(priorityGroup.locator('[data-testid="contents-layer-e2e-contents-roads"]')).toBeVisible();
    await expect(priorityGroup.locator("article").first()).toContainText("Contents Roads");

    await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const { saveProjectMapState } = await import("/src/services/map/MapPersistenceService.ts");
      const state = useMapExplorerStore.getState();
      await saveProjectMapState({
        projectId: "e2e_contents_project",
        activeBaseLayer: state.activeBaseLayer,
        viewport: { center: state.center, zoom: state.zoom, bearing: state.bearing, pitch: state.pitch },
        pins: state.pins,
        drawnFeatures: state.drawnFeatures,
        overlayLayers: state.overlayLayers,
        sourceHandles: state.sourceHandles,
      });
    });

    await page.reload();
    const reloadedExplorer = await openMapExplorer(page);
    await page.evaluate(async () => {
      const { loadProjectMapState, getRestorableOverlayLayers } = await import("/src/services/map/MapPersistenceService.ts");
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const loaded = await loadProjectMapState("e2e_contents_project");
      if (!loaded.snapshot) throw new Error("Contents snapshot was not restored.");
      useMapExplorerStore.getState().replaceOverlayLayers(getRestorableOverlayLayers(loaded.snapshot));
    });
    const restoredContents = await openContents(page, reloadedExplorer);
    const restoredGroup = restoredContents.getByTestId("contents-group-group-priority-review");
    await expect(restoredGroup).toContainText("Contents Parcels");
    await expect(restoredGroup).toContainText("Contents Roads");
    await expect(restoredGroup.locator("article").first()).toContainText("Contents Roads");
  });
});
