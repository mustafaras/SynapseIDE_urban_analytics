import { expect, test, type Page } from "@playwright/test";

import {
  openWorkflowById,
  openWorkflowsWorkspace,
  resetWorkbenchState,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

async function seedTemporalPolygonLayer(page: Page): Promise<void> {
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
      id: "e2e-emerging-hot-spot-layer",
      name: "E2E Emerging Hot Spot Districts",
      datasetTitle: "E2E Emerging Hot Spot Districts",
      sourceLabel: "E2E seeded temporal polygon layer",
      featureCollection: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "district-a",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.94, 41.01], [28.945, 41.01], [28.945, 41.015], [28.94, 41.015], [28.94, 41.01]]],
            },
            properties: {
              district: "A",
              hotspot_2020: 12,
              hotspot_2021: 16,
              hotspot_2022: 21,
              hotspot_2023: 24,
            },
          },
          {
            type: "Feature",
            id: "district-b",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.945, 41.01], [28.95, 41.01], [28.95, 41.015], [28.945, 41.015], [28.945, 41.01]]],
            },
            properties: {
              district: "B",
              hotspot_2020: 18,
              hotspot_2021: 21,
              hotspot_2022: 26,
              hotspot_2023: 29,
            },
          },
          {
            type: "Feature",
            id: "district-c",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.94, 41.015], [28.945, 41.015], [28.945, 41.02], [28.94, 41.02], [28.94, 41.015]]],
            },
            properties: {
              district: "C",
              hotspot_2020: 7,
              hotspot_2021: 9,
              hotspot_2022: 8,
              hotspot_2023: 6,
            },
          },
          {
            type: "Feature",
            id: "district-d",
            geometry: {
              type: "Polygon",
              coordinates: [[[28.945, 41.015], [28.95, 41.015], [28.95, 41.02], [28.945, 41.02], [28.945, 41.015]]],
            },
            properties: {
              district: "D",
              hotspot_2020: 14,
              hotspot_2021: 13,
              hotspot_2022: 17,
              hotspot_2023: 15,
            },
          },
        ],
      },
    });
  });
}

test.describe("Emerging hot spot workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
  });

  test("opens from the workflow library, runs the analysis, shows legend output, and saves review-ready results", async ({ page }) => {
    await seedTemporalPolygonLayer(page);

    const urbanModal = await openWorkflowsWorkspace(page);
    const flow = await openWorkflowById(urbanModal, "emerging_hot_spot");

    await expect(flow.getByTestId("emerging-hotspot-workflow-panel")).toBeVisible();
    await expect(flow.getByTestId("emerging-hotspot-source-select")).toHaveValue("e2e-emerging-hot-spot-layer");

    await triggerDomClick(flow.getByTestId("emerging-hotspot-run"));

    await expect(flow.getByTestId("emerging-hotspot-last-run")).toContainText(/time steps/i);
    await expect(flow.getByTestId("emerging-hotspot-legend")).toContainText(/Hot Spot|Cold Spot/);

    await expect
      .poll(async () => page.evaluate(async () => {
        const module = await import("/src/stores/useMapExplorerStore.ts");
        return module.useMapExplorerStore.getState().overlayLayers.some(
          (layer) => layer.metadata?.analysisResult?.engine === "EmergingHotSpots",
        );
      }))
      .toBe(true);

    await expect
      .poll(async () => page.evaluate(async () => {
        const module = await import("/src/stores/useFlowStore.ts");
        return module.useFlowStore.getState().completedRuns.some(
          (run) => run.flowId === "emerging_hot_spot" && /Emerging Hot Spots/i.test(run.label),
        );
      }))
      .toBe(true);

    const reviewFlow = await openWorkflowById(urbanModal, "review");
    await expect(reviewFlow).toContainText(/Emerging Hot Spots/i);
    await triggerDomClick(reviewFlow.getByRole("radio").first());
    await triggerDomClick(reviewFlow.getByRole("button", { name: /^(Next|Next →)$/i }));
    await expect(reviewFlow).toContainText(/Map Outputs/i);
  });
});