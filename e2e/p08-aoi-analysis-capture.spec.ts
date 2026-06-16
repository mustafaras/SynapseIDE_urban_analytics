import { expect, test } from "@playwright/test";
import {
  openMapExplorer,
  resetWorkbenchState,
  seedGeoJSONLayerFixture,
  triggerDomClick,
} from "./helpers/urbanAnalytics";

test.describe("p08 AOI analysis capture", () => {
  test("captures analysis dispatch and evidence registration", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const mapExplorer = await openMapExplorer(page, "explore");

    await seedGeoJSONLayerFixture(page, {
      id: "p08-seeded-points",
      name: "P08 Queryable Sample",
      featureCollection: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "inside-1",
            geometry: { type: "Point", coordinates: [29.001, 41.001] },
            properties: { score: 12, zone: "A" },
          },
          {
            type: "Feature",
            id: "inside-2",
            geometry: { type: "Point", coordinates: [29.006, 41.006] },
            properties: { score: 18, zone: "A" },
          },
          {
            type: "Feature",
            id: "outside-1",
            geometry: { type: "Point", coordinates: [29.03, 41.03] },
            properties: { score: 7, zone: "B" },
          },
        ],
      },
      datasetTitle: "P08 Queryable Sample",
      sourceLabel: "P08 e2e seeded",
    });

    await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const store = module.useMapExplorerStore.getState();
      const now = new Date().toISOString();

      store.replaceDrawnFeatures([
        {
          id: "p08-aoi",
          geometry: {
            type: "Polygon",
            coordinates: [[
              [28.9985, 40.9985],
              [29.0105, 40.9985],
              [29.0105, 41.0105],
              [28.9985, 41.0105],
              [28.9985, 40.9985],
            ]],
          },
          properties: {
            label: "Study area AOI",
            createdAt: now,
          },
        },
      ]);
      store.setActiveAoi("p08-aoi");
    });

    const interactiveCanvas = page.locator(".maplibregl-canvas").first();
    await expect(interactiveCanvas).toBeVisible({ timeout: 15000 });
    await interactiveCanvas.click({ position: { x: 520, y: 340 } });
    await interactiveCanvas.click({ button: "right", position: { x: 520, y: 340 } });

    const contextMenu = page.getByRole("menu", { name: "Map context menu" });
    if (!(await contextMenu.isVisible())) {
      await interactiveCanvas.focus();
      await page.keyboard.press("Shift+F10");
    }
    await expect(contextMenu).toBeVisible({ timeout: 10000 });

    const analyzeAreaAction = contextMenu.getByRole("menuitem", { name: /Analyze area/i });
    await expect(analyzeAreaAction).toBeVisible();
    await triggerDomClick(analyzeAreaAction);

    const dispatchDialog = page.getByRole("dialog", { name: "Choose workflow for map analysis dispatch" });
    await expect(dispatchDialog).toBeVisible({ timeout: 15000 });
    await expect(dispatchDialog.getByText("Analyze This Area")).toBeVisible();

    await page.screenshot({ path: "MAP_EXPLORER_DOCK_REDESIGN_2026-06-15/evidence/p08-aoi-analysis.png", fullPage: true });

    const compatibleFlowButtons = dispatchDialog.locator("button").filter({ hasText: /AOI attached/i });
    await expect(compatibleFlowButtons.first()).toBeVisible();
    const selectedFlowLabel = (await compatibleFlowButtons.first().locator("span").first().innerText()).trim();
    await triggerDomClick(compatibleFlowButtons.first());
    await expect(dispatchDialog).toBeHidden({ timeout: 15000 });

    const analysisLayer = await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const layers = module.useMapExplorerStore.getState().overlayLayers;
      const matches = layers.filter((layer) =>
        layer.metadata?.analysisResult?.inputParameters?.analysisMethod === "AOI compatible analysis dispatch"
      );
      const latest = matches[matches.length - 1];
      return latest ? { id: latest.id, name: latest.name } : null;
    });
    expect(analysisLayer).not.toBeNull();

    await triggerDomClick(mapExplorer.getByTestId("activity-btn-layers"));
    await triggerDomClick(page.getByTestId("map-workbench-sidebar-tab-layers-stack"));

    const flowNamePattern = new RegExp(selectedFlowLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const analysisRow = page.getByRole("listitem", { name: flowNamePattern }).first();
    await expect(analysisRow).toBeVisible({ timeout: 30000 });

    const layerActionsToggle = analysisRow.getByLabel(/^Layer actions for /).first();
    await expect(layerActionsToggle).toBeVisible();
    await triggerDomClick(layerActionsToggle);

    const inspectTrigger = analysisRow.getByTestId("map-layer-inspect-trigger");
    await expect(inspectTrigger).toBeVisible();
    await triggerDomClick(inspectTrigger);

    const registeredToast = page.getByText(/ANALYSIS REGISTERED/i).first();
    await expect(registeredToast).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: "MAP_EXPLORER_DOCK_REDESIGN_2026-06-15/evidence/p08-evidence-registered.png", fullPage: true });
  });
});
