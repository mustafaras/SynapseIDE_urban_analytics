import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick, waitForMapExplorerDialog } from "./helpers/urbanAnalytics";

function isIgnorableDiagnostic(message: string): boolean {
  return (
    /failed to connect to websocket|websocket closed without opened|hmr|vite|favicon/i.test(message) ||
    /127\.0\.0\.1:9231|net::ERR_CONNECTION_REFUSED/i.test(message)
  );
}

async function seedStabilityLayer(page: Page, cycle: number): Promise<void> {
  await page.evaluate(async (cycleIndex) => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const store = module.useMapExplorerStore.getState();
    store.addOverlayLayer({
      id: `e2e-stability-layer-${cycleIndex}`,
      name: `E2E Stability District ${cycleIndex}`,
      type: "geojson",
      visible: true,
      opacity: 0.74,
      group: "data",
      sourceKind: "imported",
      sourceData: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: `stability-${cycleIndex}`,
            geometry: {
              type: "Polygon",
              coordinates: [[
                [28.95 + cycleIndex * 0.002, 41.0],
                [28.975 + cycleIndex * 0.002, 41.0],
                [28.975 + cycleIndex * 0.002, 41.024],
                [28.95 + cycleIndex * 0.002, 41.024],
                [28.95 + cycleIndex * 0.002, 41.0],
              ]],
            },
            properties: {
              cycle: cycleIndex,
              exposure: 40 + cycleIndex,
            },
          },
        ],
      },
      style: {
        fillColor: "#38bdf8",
        fillOpacity: 0.32,
        strokeColor: "#0ea5e9",
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["cycle", "exposure"],
        datasetContext: {
          datasetId: `e2e-stability-${cycleIndex}`,
          datasetTitle: `E2E Stability Fixture ${cycleIndex}`,
          source: "Playwright stability fixture",
          crs: "EPSG:4326",
        },
      },
    });
  }, cycle);
}

test.describe("Map Explorer stability", () => {
  test("survives repeated open close panel and viewport churn without page errors", async ({ page }, testInfo) => {
    const diagnostics: string[] = [];
    page.on("pageerror", (error) => diagnostics.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") {
        diagnostics.push(`console: ${message.text()}`);
      }
    });

    await page.setViewportSize({ width: 1440, height: 960 });
    await resetWorkbenchState(page);

    for (let cycle = 1; cycle <= 6; cycle += 1) {
      await page.setViewportSize(cycle % 2 === 0 ? { width: 920, height: 760 } : { width: 1440, height: 960 });
      const urbanModal = await openUrbanAnalyticsWorkbench(page);
      await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

      const mapExplorer = await waitForMapExplorerDialog(page);
      await expect(page.getByRole("application", { name: /Interactive map canvas/i })).toBeVisible();

      await triggerDomClick(mapExplorer.getByTestId("activity-btn-layers"));

      await seedStabilityLayer(page, cycle);
      await expect(mapExplorer.getByRole("list", { name: "Layer list" })).toContainText(`E2E Stability District ${cycle}`);

      await page.keyboard.press("Control+K");
      const palette = page.getByRole("dialog", { name: "Map command palette" });
      await expect(palette).toBeVisible();
      await palette.getByLabel("Search map commands").fill("scientific qa");
      await triggerDomClick(palette.getByRole("option", { name: /Toggle scientific QA panel/i }).first());
      const rightDockHost = mapExplorer.getByTestId("map-right-dock-host");
      await expect(rightDockHost).toBeVisible();
      await expect(rightDockHost).toHaveAttribute("data-map-right-dock-panel", /^(problems|scientificQA|qa)$/);

      await triggerDomClick(mapExplorer.getByTestId("activity-btn-analyze"));
      const workflowsTab = mapExplorer.getByTestId("map-workbench-sidebar-tab-analyze-workflows");
      await expect(workflowsTab).toBeVisible();
      await workflowsTab.scrollIntoViewIfNeeded();
      await triggerDomClick(workflowsTab);
      await expect(workflowsTab).toHaveAttribute("aria-selected", "true");
      await expect(mapExplorer.getByTestId("map-workflow-drawer")).toBeVisible();

      await page.setViewportSize(cycle % 2 === 0 ? { width: 1440, height: 960 } : { width: 720, height: 760 });
      await expect(page.getByTestId("map-canvas-region")).toBeVisible();
      await expect(mapExplorer.getByRole("status", { name: "Map status" })).toBeVisible();

      await triggerDomClick(mapExplorer.getByRole("button", { name: "Close map explorer (Escape)" }));
      await expect(mapExplorer).toBeHidden();
    }

    const unexpectedDiagnostics = diagnostics.filter((message) => !isIgnorableDiagnostic(message));
    if (unexpectedDiagnostics.length > 0) {
      await testInfo.attach("map-explorer-stability-diagnostics", {
        body: unexpectedDiagnostics.join("\n"),
        contentType: "text/plain",
      });
    }
    expect(unexpectedDiagnostics).toEqual([]);
  });
});
