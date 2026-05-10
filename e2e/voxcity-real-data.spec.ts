import { expect, test, type Page } from "@playwright/test";

import {
  openWorkflowById,
  openWorkflowsWorkspace,
  resetWorkbenchState,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

async function seedBuildingLayer(page: Page): Promise<void> {
  await page.evaluate(() => {
    const testWindow = window as Window & {
      e2e?: {
        seedGeoJSONLayer?: (input: {
          id?: string;
          name: string;
          datasetTitle?: string;
          sourceLabel?: string;
          featureCollection: GeoJSON.FeatureCollection;
        }) => void;
      };
    };

    testWindow.e2e?.seedGeoJSONLayer?.({
      id: "e2e-voxcity-buildings",
      name: "E2E Building Footprints",
      datasetTitle: "E2E Building Footprints",
      sourceLabel: "E2E seeded building layer",
      featureCollection: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "parcel-a",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.94, 41.01], [28.945, 41.01], [28.945, 41.015], [28.94, 41.015], [28.94, 41.01]]],
            },
            properties: {
              name: "Parcel A",
              height: 18,
            },
          },
          {
            type: "Feature",
            id: "parcel-b",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.946, 41.01], [28.951, 41.01], [28.951, 41.014], [28.946, 41.014], [28.946, 41.01]]],
            },
            properties: {
              name: "Parcel B",
              height: 24,
            },
          },
        ],
      },
    });
  });
}

test.describe("VoxCity real-data workflows", () => {
  test("loads a real building layer into extrusion and launches sunlight simulation from handed-off real geometry", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    await seedBuildingLayer(page);

    const urbanModal = await openWorkflowsWorkspace(page);
    const extrusionFlow = await openWorkflowById(urbanModal, "voxcity_3d");

    await expect(extrusionFlow.getByTestId("voxcity-source-select")).toHaveValue("e2e-voxcity-buildings");
    await expect(extrusionFlow.getByTestId("voxcity-source-metadata")).toContainText("Project Data Active");
    await expect(extrusionFlow.getByTestId("voxcity-source-metadata")).toContainText("E2E Building Footprints");
    await expect(extrusionFlow.getByTestId("voxcity-source-metadata")).not.toContainText("Sample Mode Active");

    await triggerDomClick(extrusionFlow.getByTestId("voxcity-send-to-solar"));

    const sunlightFlow = await openWorkflowById(urbanModal, "sunlight_sim");
    await expect(sunlightFlow.getByTestId("sunlight-source-metadata")).toContainText("Project Data Active");
    await expect(sunlightFlow.getByTestId("sunlight-source-metadata")).toContainText("Building Viewer handoff active");
    await expect(sunlightFlow.getByTestId("sunlight-source-metadata")).toContainText("E2E Building Footprints");

    await triggerDomClick(sunlightFlow.getByRole("button", { name: "Run sunlight simulation" }));

    await expect(sunlightFlow.getByText("Solar Exposure by Building")).toBeVisible();
    await expect(sunlightFlow.getByText("Quick Statistics")).toBeVisible();

    await triggerDomClick(sunlightFlow.getByRole("button", { name: "Add solar exposure to map" }));

    await expect
      .poll(async () => page.evaluate(async () => {
        const module = await import("/src/stores/useMapExplorerStore.ts");
        return module.useMapExplorerStore.getState().overlayLayers.some((layer) => layer.metadata?.analysisResult?.engine === "SunlightSimulation");
      }))
      .toBe(true);
  });
});