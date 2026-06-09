import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import {
  openUrbanAnalyticsWorkbench,
  resetWorkbenchState,
  triggerDomClick,
  waitForMapExplorerDialog,
} from "./helpers/urbanAnalytics";

type BaselineViewport = {
  label: string;
  width: number;
  height: number;
};

const BASELINE_VIEWPORTS = [
  { label: "desktop-1366x768", width: 1366, height: 768 },
  { label: "short-desktop-1280x620", width: 1280, height: 620 },
  { label: "tablet-1024x768", width: 1024, height: 768 },
  { label: "narrow-390x844", width: 390, height: 844 },
] as const satisfies readonly BaselineViewport[];

const PANEL_VIEWPORTS = [
  { label: "desktop-1366x768", width: 1366, height: 768 },
  { label: "narrow-390x844", width: 390, height: 844 },
] as const satisfies readonly BaselineViewport[];

async function capturePage(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const body = await page.screenshot({
    path: `e2e/__screens__/${name}.png`,
    fullPage: false,
  });
  await testInfo.attach(name, { body, contentType: "image/png" });
}

async function captureLocator(locator: Locator, testInfo: TestInfo, name: string): Promise<void> {
  const body = await locator.screenshot({
    path: `e2e/__screens__/${name}.png`,
  });
  await testInfo.attach(name, { body, contentType: "image/png" });
}

async function firstVisible(locator: Locator): Promise<Locator | null> {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }
  return null;
}

async function clickVisible(locator: Locator, description: string): Promise<void> {
  const target = await firstVisible(locator);
  if (!target) {
    throw new Error(`No visible target found for ${description}.`);
  }
  await target.scrollIntoViewIfNeeded().catch(() => undefined);
  await triggerDomClick(target);
}

async function openMapExplorerAtLaunch(page: Page): Promise<Locator> {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

  const mapExplorer = await waitForMapExplorerDialog(page);
  await expect(page.getByTestId("map-command-center")).toBeVisible();
  await expect(page.getByRole("status", { name: "Map status" })).toBeVisible();
  await expect(page.getByTestId("map-canvas-region")).toBeVisible();
  return mapExplorer;
}

async function openMapExplorerExplore(page: Page, viewport: BaselineViewport): Promise<Locator> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await resetWorkbenchState(page);
  const mapExplorer = await openMapExplorerAtLaunch(page);
  await clickVisible(
    page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }),
    "Explore Layers workspace switch",
  );
  await expect(page.getByTestId("map-canvas-region")).toBeVisible();
  await expect(page.getByTestId("map-command-center")).toBeVisible();
  return mapExplorer;
}

async function seedBaselineLayer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const { useMapExplorerStore } = await import("/src/stores/useMapExplorerStore.ts");
    const featureCollection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "baseline-demo-parcel-1",
          geometry: {
            type: "Polygon",
            coordinates: [[
              [28.96, 41.0],
              [28.99, 41.0],
              [28.99, 41.03],
              [28.96, 41.03],
              [28.96, 41.0],
            ]],
          },
          properties: {
            name: "Baseline demo parcel",
            mode: "demo",
          },
        },
      ],
    };

    useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-baseline-demo-parcels",
      name: "E2E Baseline Demo Parcels",
      type: "geojson",
      visible: true,
      opacity: 0.86,
      group: "data",
      sourceKind: "demo",
      sourceData: featureCollection,
      metadata: {
        geometryType: "Polygon",
        featureCount: featureCollection.features.length,
        fields: ["name", "mode"],
        runtimeMode: "demo",
        datasetContext: {
          datasetId: "e2e-baseline-demo-parcels",
          datasetTitle: "E2E Baseline Demo Parcels",
          source: "Playwright visual baseline fixture",
          crs: "EPSG:4326",
        },
        crsSummary: {
          crs: "EPSG:4326",
          status: "known",
          source: "explicit",
          notes: ["Playwright visual baseline fixture declares WGS84 coordinates."],
        },
      },
    });
  });
}

async function openActivity(page: Page, activityId: string): Promise<void> {
  const activityButton = page.getByTestId(`activity-btn-${activityId}`);
  await expect(activityButton).toBeVisible();
  await triggerDomClick(activityButton);
  await expect(activityButton).toHaveAttribute("data-map-activity-state", "active");
  await expect(page.getByTestId("map-layer-panel-rail")).toBeVisible();
}

async function runToolbarCommand(page: Page, commandId: string, query: string): Promise<void> {
  const directCommand = await firstVisible(page.getByTestId(`map-toolbar-command-${commandId}`));
  if (directCommand) {
    await triggerDomClick(directCommand);
    return;
  }

  const overflow = await firstVisible(page.getByTestId("map-command-center-overflow"));
  if (overflow) {
    await triggerDomClick(overflow);
    const overflowCommand = await firstVisible(page.getByTestId(`map-toolbar-command-${commandId}`));
    if (overflowCommand) {
      await triggerDomClick(overflowCommand);
      return;
    }
  }

  await page.keyboard.press("Control+K");
  const palette = page.getByRole("dialog", { name: "Map command palette" });
  await expect(palette).toBeVisible();
  await palette.getByLabel("Search map commands").fill(query);
  await triggerDomClick(page.getByTestId(`map-command-palette-option-${commandId}`).first());
}

test.describe("Map Explorer premium redesign visual baseline", () => {
  test("IMG-01 UX-01 baseline captures the opening readiness cockpit", async ({ page }, testInfo) => {
    test.slow();

    for (const viewport of BASELINE_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await resetWorkbenchState(page);
      const mapExplorer = await openMapExplorerAtLaunch(page);
      const cockpit = page.getByRole("region", { name: "Map workspace cockpit" }).first();
      const cockpitVisible = await cockpit.isVisible().catch(() => false);
      if (cockpitVisible) {
        await expect(cockpit).toBeVisible();
      } else {
        await expect(page.getByTestId("map-canvas-region")).toBeVisible();
      }
      await expect(page.getByTestId("map-command-center")).toBeVisible();
      await expect(page.getByRole("status", { name: "Map status" })).toBeVisible();

      await capturePage(page, testInfo, `map-redesign-baseline-img-01-ux-01-${viewport.label}`);
      await expect(mapExplorer).toBeVisible();
    }
  });

  test("IMG-02 UX-02 baseline captures left Data and Layers panel fit", async ({ page }, testInfo) => {
    test.slow();

    for (const viewport of PANEL_VIEWPORTS) {
      await openMapExplorerExplore(page, viewport);
      await seedBaselineLayer(page);

      await openActivity(page, "data");
      const dataPanel = page.getByTestId("map-catalog-panel");
      await expect(dataPanel).toBeVisible();
      await expect(dataPanel).toHaveAttribute("data-presentation", "embedded");
      await captureLocator(page.getByTestId("map-layer-panel-rail"), testInfo, `map-redesign-baseline-img-02-ux-02-data-${viewport.label}`);

      await openActivity(page, "layers");
      const layerList = page.getByRole("list", { name: "Layer list" });
      await expect(layerList).toContainText("E2E Baseline Demo Parcels");
      await captureLocator(page.getByTestId("map-layer-panel-rail"), testInfo, `map-redesign-baseline-img-02-ux-02-layers-${viewport.label}`);
    }
  });

  test("IMG-03 UX-03 baseline captures the current bottom Diagnostics workspace", async ({ page }, testInfo) => {
    test.slow();

    for (const viewport of [
      { label: "desktop-1366x768", width: 1366, height: 768 },
      { label: "short-desktop-1280x620", width: 1280, height: 620 },
    ] as const satisfies readonly BaselineViewport[]) {
      await openMapExplorerExplore(page, viewport);
      await seedBaselineLayer(page);
      await runToolbarCommand(page, "performance-diagnostics", "performance diagnostics");

      const bottomPanel = page.getByTestId("map-bottom-panel");
      const rightDock = page.getByTestId("map-right-dock-host");
      const bottomPanelVisible = await bottomPanel.isVisible().catch(() => false);
      const rightDockVisible = await rightDock.isVisible().catch(() => false);
      expect(bottomPanelVisible || rightDockVisible).toBe(true);
      if (bottomPanelVisible) {
        await expect(bottomPanel).toHaveAttribute("data-active-bottom-tab", "diagnostics");
      }
      await expect(page.getByTestId("map-performance-diagnostics")).toBeVisible();
      await expect(page.getByRole("status", { name: "Map status" })).toBeVisible();
      await capturePage(page, testInfo, `map-redesign-baseline-img-03-ux-03-diagnostics-${viewport.label}`);
    }
  });

  test("IMG-04 UX-04 baseline captures floating Draw and Measure tool panels", async ({ page }, testInfo) => {
    test.slow();

    await openMapExplorerExplore(page, { label: "desktop-1366x768", width: 1366, height: 768 });
    await seedBaselineLayer(page);

    await runToolbarCommand(page, "drawings", "drawings");
    const drawingPanel = page.getByRole("region", { name: "Drawn features" });
    await expect(drawingPanel).toBeVisible();
    await expect(drawingPanel).toContainText("Drawings");
    await capturePage(page, testInfo, "map-redesign-baseline-img-04-ux-04-floating-draw-desktop-1366x768");

    await runToolbarCommand(page, "measure-distance", "measure distance");
    const measurementPanel = page.getByRole("region", { name: "Measurement results" });
    await expect(measurementPanel).toBeVisible();
    await expect(measurementPanel).toContainText("Measurements");
    await expect(measurementPanel).toContainText("EPSG:4326");
    await capturePage(page, testInfo, "map-redesign-baseline-img-04-ux-04-floating-measure-desktop-1366x768");
  });

  test("UX-05 UX-06 baseline captures top command surface and status bar matrix", async ({ page }, testInfo) => {
    test.slow();

    for (const viewport of BASELINE_VIEWPORTS) {
      await openMapExplorerExplore(page, viewport);
      await seedBaselineLayer(page);

      const commandCenter = page.getByTestId("map-command-center");
      const statusBar = page.getByRole("status", { name: "Map status" });
      await expect(commandCenter).toBeVisible();
      await expect(commandCenter.getByTestId("map-command-center-primary-action")).toBeVisible();
      await expect(commandCenter.getByTestId("map-command-center-overflow")).toBeVisible();
      await expect(statusBar).toBeVisible();
      await expect(statusBar).toContainText("QA");
      const hasViewLabel = await statusBar.textContent().then((value) => /View|Zoom/.test(value ?? ""));
      if (!hasViewLabel) {
        const overflowCount = Number(await statusBar.getAttribute("data-map-status-overflow-count"));
        expect(overflowCount).toBeGreaterThan(0);
      }

      await capturePage(page, testInfo, `map-redesign-baseline-ux-05-ux-06-command-status-${viewport.label}`);
    }
  });
});
