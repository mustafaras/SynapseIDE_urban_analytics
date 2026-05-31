import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

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
    const urbanModal = await openUrbanAnalyticsWorkbench(page);

    for (let cycle = 1; cycle <= 6; cycle += 1) {
      await page.setViewportSize(cycle % 2 === 0 ? { width: 920, height: 760 } : { width: 1440, height: 960 });
      await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

      const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
      await expect(mapExplorer).toBeVisible();
      await expect(page.getByRole("application", { name: /Interactive map canvas/i })).toBeVisible();

      const exploreButton = page.getByRole("button", { name: /Explore Layers|Switch toolbar to Explore mode|Switch map workspace to explore/i }).first();
      await expect(exploreButton).toBeVisible();
      await triggerDomClick(exploreButton);

      await seedStabilityLayer(page, cycle);
      await expect(page.getByRole("list", { name: "Layer list" })).toContainText(`E2E Stability District ${cycle}`);

      await page.keyboard.press("Control+K");
      const palette = page.getByRole("dialog", { name: "Map command palette" });
      await expect(palette).toBeVisible();
      await palette.getByLabel("Search map commands").fill("scientific qa");
      await triggerDomClick(palette.getByRole("option", { name: /Toggle scientific QA panel/i }).first());
      await expect(page.getByRole("dialog", { name: "Scientific QA side panel" })).toBeVisible();

      await triggerDomClick(page.getByRole("button", { name: /Open AOI .* Compare workflow drawer/i }).first());
      await expect(page.getByTestId("map-workflow-drawer")).toBeVisible();

      await page.setViewportSize(cycle % 2 === 0 ? { width: 1440, height: 960 } : { width: 720, height: 760 });
      await expect(page.getByTestId("map-canvas-region")).toBeVisible();
      await expect(page.getByTestId("map-bottom-timeline")).toBeVisible();

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
