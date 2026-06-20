/**
 * Playwright e2e — Prompt 60: terrain + CityJSON source handles.
 *
 * Proof: a small CityJSON source is imported into the 3D scene, grounded on
 * DEM-style terrain samples, and rendered to a non-blank scene canvas while
 * SourceHandle metadata records vertical datum truthfully.
 */
import { expect, test, type Page } from "@playwright/test";
import {
  openMapExplorer as openMapExplorerWorkbench,
  resetWorkbenchState,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

async function openMapExplorer(page: Page) {
  await page.setViewportSize({ width: 1680, height: 1100 });
  await resetWorkbenchState(page);
  await openMapExplorerWorkbench(page, "scene");
}

function countUniqueByteValues(buffer: Buffer, sampleSize = 4000): number {
  const seen = new Set<number>();
  const step = Math.max(1, Math.floor(buffer.length / sampleSize));
  for (let index = 0; index < buffer.length; index += step) {
    seen.add(buffer[index]);
  }
  return seen.size;
}

test.describe("Prompt 60 — terrain + CityJSON 3D scene @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await openMapExplorer(page);
  });

  test("imports CityJSON, grounds buildings on terrain, and renders a non-blank 3D scene canvas", async ({ page }) => {
    await page.evaluate(async () => {
      const { SAMPLE_CITYJSON_STRING } = await import("/src/features/urbanAnalytics/voxcity/sampleCityJSON.ts");
      const {
        createDemTerrainSourceHandle,
        createTerrainElevationGrid,
        importCityJSONSceneSource,
      } = await import("/src/services/map/scene3d/MapTerrainCityModelService.ts");
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");

      const terrain = createTerrainElevationGrid({
        sourceId: "p60-terrain-dem",
        width: 3,
        height: 3,
        bbox: [13.3774, 52.5160, 13.3838, 52.5222],
        values: [18, 20, 24, 22, 28, 34, 26, 35, 42],
        crs: "EPSG:4326",
        noData: null,
        verticalDatum: { value: "EGM96 geoid height", source: "user-declared" },
      });
      const terrainHandle = createDemTerrainSourceHandle({
        sourceId: "p60-terrain-dem",
        title: "P60 DEM terrain",
        metadata: {
          width: 3,
          height: 3,
          bbox: terrain.bbox,
          epsgCode: "EPSG:4326",
          noData: null,
        },
        terrain,
      });
      const cityModel = await importCityJSONSceneSource({
        json: SAMPLE_CITYJSON_STRING,
        sourceId: "p60-cityjson-sample",
        title: "P60 CityJSON sample",
        runtimeMode: "sample",
        terrain,
      });

      const layerId = "p60-cityjson-grounded-layer";
      const mapStore = useMapExplorerStore.getState();
      mapStore.upsertSourceHandle(cityModel.sourceHandle);
      mapStore.upsertSourceHandle(terrainHandle);
      mapStore.addOverlayLayer({
        id: layerId,
        name: "P60 Terrain-grounded CityJSON",
        type: "geojson",
        visible: true,
        opacity: 0.78,
        group: "voxcity",
        sourceKind: "imported",
        queryable: true,
        qaStatus: "warning",
        sourceData: cityModel.footprintCollection,
        metadata: {
          sourceId: cityModel.sourceHandle.sourceId,
          sourceStorageMode: cityModel.sourceHandle.storageMode,
          sourceRestoreStatus: cityModel.sourceHandle.restoreStatus,
          crsSummary: cityModel.sourceHandle.crsSummary,
          featureCount: cityModel.footprintCollection.features.length,
          geometryType: "Polygon",
          fields: ["measuredHeight", "scene3d_base_elevation_m", "scene3d_vertical_datum_status"],
        },
      });

      const sceneStore = useScene3DStore.getState();
      sceneStore.setRuntimeMode("3d");
      sceneStore.setActiveLayer(layerId, cityModel.footprintCollection, {
        heightField: "measuredHeight",
        cityModelSourceHandle: cityModel.sourceHandle,
        terrainSourceHandle: terrainHandle,
      });
    });

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await expect(page.getByTestId("map-top-command-surface")).toBeVisible();

    const scene3dTab = mapExplorer.getByTestId("map-workbench-sidebar-tab-scene-3d");
    await expect(scene3dTab).toBeVisible();
    await scene3dTab.scrollIntoViewIfNeeded();
    await triggerDomClick(scene3dTab);

    const panel = page.getByTestId("scene3d-panel");
    await expect(panel).toBeVisible();
    await expect(page.getByTestId("scene3d-source-handle")).toContainText("cityjson");
    await expect(page.getByTestId("scene3d-vertical-datum")).toContainText("EGM96 geoid height");

    const canvas = page.getByTestId("scene3d-terrain-canvas");
    await expect(canvas).toBeVisible();
    const image = await canvas.screenshot({ type: "png" });
    expect(countUniqueByteValues(image)).toBeGreaterThan(5);

    const metadata = await page.evaluate(async () => {
      const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
      const { useScene3DStore } = await import("/src/stores/useScene3DStore.ts");
      const sceneState = useScene3DStore.getState();
      const sourceHandles = useMapExplorerStore.getState().sourceHandles;
      return {
        citySceneDatum: sceneState.cityModelSourceHandle?.scene3d?.verticalDatum ?? null,
        terrainDatum: sceneState.terrainSourceHandle?.scene3d?.verticalDatum ?? null,
        persistedCityHandle: sourceHandles.find((handle) => handle.sourceId === "p60-cityjson-sample") ?? null,
      };
    });

    expect(metadata.citySceneDatum?.status).toBe("unknown");
    expect(metadata.citySceneDatum?.caveats?.join(" ")).toMatch(/vertical datum/i);
    expect(metadata.terrainDatum?.status).toBe("known");
    expect(metadata.persistedCityHandle?.scene3d?.verticalDatum?.status).toBe("unknown");
  });
});
