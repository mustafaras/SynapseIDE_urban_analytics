import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function waitForMapExplorerDialog(page: Page) {
  const loadingStatus = page.getByText("Loading Map Explorer...");
  await expect(loadingStatus).toBeHidden({ timeout: 60000 });
  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible({ timeout: 60000 });
  return mapExplorer;
}

async function openMapExplorer(page: Page) {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

  const mapExplorer = await waitForMapExplorerDialog(page);
  const exploreButton = page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first();
  await expect(exploreButton).toBeVisible();
  await triggerDomClick(exploreButton);
  return mapExplorer;
}

async function openMapExplorerFromStore(page: Page) {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    module.useMapExplorerStore.getState().open();
  });

  const mapExplorer = await waitForMapExplorerDialog(page);
  const exploreButton = page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first();
  await expect(exploreButton).toBeVisible();
  await triggerDomClick(exploreButton);
  return mapExplorer;
}

async function getPersistedLayerPanelWidth(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem("synapse-map-explorer");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { layoutPreferences?: { layerPanelWidth?: number } } };
    return parsed.state?.layoutPreferences?.layerPanelWidth ?? null;
  });
}

async function openCommandPalette(page: Page) {
  await page.keyboard.press("Control+K");
  const palette = page.getByRole("dialog", { name: "Map command palette" });
  await expect(palette).toBeVisible();
  return palette;
}

async function expectPaletteCommand(page: Page, query: string, commandId: string): Promise<void> {
  const palette = page.getByRole("dialog", { name: "Map command palette" });
  await palette.getByLabel("Search map commands").fill(query);
  await expect(page.getByTestId(`map-command-palette-option-${commandId}`)).toBeVisible();
}

async function openSidebarTab(page: Page, tabId: string): Promise<void> {
  const tab = page.getByTestId(`map-workbench-sidebar-tab-${tabId}`);
  await expect(tab).toBeVisible();
  await tab.scrollIntoViewIfNeeded();
  await triggerDomClick(tab);
  await expect(tab).toHaveAttribute("aria-selected", "true");
}

async function openPrompt16Explorer(page: Page, options: { seedWorkflowLayer?: boolean } = {}) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await resetWorkbenchState(page);
  await openMapExplorerFromStore(page);
  if (options.seedWorkflowLayer) {
    await seedWorkflowBufferLayer(page);
  }

  const shell = page.locator('[data-map-explorer-shell="true"]');
  const rail = page.getByTestId("map-activity-rail");
  await expect(shell).toBeVisible();
  await expect(rail).toBeVisible();
  await expect(page.getByTestId("map-canvas-region")).toBeVisible();
  return { shell, rail };
}

async function expectNoHorizontalOverflowOrPanelOverlap(page: Page): Promise<void> {
  const result = await page.evaluate(() => {
    const selectors = [
      { name: "shell", selector: '[data-map-explorer-shell="true"]' },
      { name: "command center", selector: '[data-testid="map-command-center"]', allowInternalOverflow: true },
      { name: "activity rail", selector: '[data-testid="map-activity-rail"]' },
      { name: "panel rail", selector: '[data-testid="map-layer-panel-rail"]', allowInternalOverflow: true },
      { name: "workbench sidebar", selector: '[data-map-workbench-sidebar="true"]' },
      { name: "canvas region", selector: '[data-testid="map-canvas-region"]' },
      { name: "canvas viewport controls", selector: '[data-testid="map-canvas-viewport-controls"]' },
      { name: "canvas furniture controls", selector: '[data-testid="map-canvas-furniture-controls"]' },
      { name: "inspector", selector: '[data-testid="map-inspector-host"]' },
      { name: "bottom timeline", selector: '[data-testid="map-bottom-timeline"]' },
      { name: "bottom panel", selector: '[data-testid="map-bottom-panel"]' },
    ];
    const isVisible = (element: Element): boolean => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };
    const boundsIssues = selectors.flatMap(({ name, selector, allowInternalOverflow }) =>
      Array.from(document.querySelectorAll(selector)).flatMap((element, index) => {
        if (!isVisible(element)) return [];
        const rect = element.getBoundingClientRect();
        const ownOverflow = Math.max(0, element.scrollWidth - element.clientWidth);
        const internalOverflow = !allowInternalOverflow && ownOverflow > 2;
        const outOfViewport = rect.left < -1 || rect.right > window.innerWidth + 1;
        return internalOverflow || outOfViewport
          ? [{
              name: `${name}${index > 0 ? ` ${index + 1}` : ""}`,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              viewportWidth: window.innerWidth,
              ownOverflow,
            }]
          : [];
      }),
    );
    const bottomPanel = document.querySelector('[data-testid="map-bottom-panel"]');
    const statusBar = document.querySelector('[role="status"][aria-label="Map status"]');
    const overlapIssues = bottomPanel && statusBar && isVisible(bottomPanel) && isVisible(statusBar)
      ? (() => {
          const panelRect = bottomPanel.getBoundingClientRect();
          const statusRect = statusBar.getBoundingClientRect();
          return panelRect.bottom <= statusRect.top + 1
            ? []
            : [{ name: "bottom panel/status bar", panelBottom: Math.round(panelRect.bottom), statusTop: Math.round(statusRect.top) }];
        })()
      : [];
    return { boundsIssues, overlapIssues };
  });

  expect(result.boundsIssues, JSON.stringify(result.boundsIssues)).toEqual([]);
  expect(result.overlapIssues, JSON.stringify(result.overlapIssues)).toEqual([]);
}

async function seedComparisonLayers(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const createFeatureCollection = (offset: number, label: string) => ({
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          id: `comparison-${label}`,
          geometry: {
            type: "Polygon" as const,
            coordinates: [[
              [28.96 + offset, 41.0],
              [28.985 + offset, 41.0],
              [28.985 + offset, 41.025],
              [28.96 + offset, 41.025],
              [28.96 + offset, 41.0],
            ]],
          },
          properties: {
            scenario: label,
            value: offset === 0 ? 42 : 57,
          },
        },
      ],
    });

    const store = module.useMapExplorerStore.getState();
    store.addOverlayLayer({
      id: "e2e-comparison-layer-a",
      name: "E2E Existing Conditions",
      type: "geojson",
      visible: true,
      opacity: 0.82,
      group: "data",
      sourceKind: "imported",
      sourceData: createFeatureCollection(0, "existing"),
      style: {
        fillColor: "#3794ff",
        fillOpacity: 0.42,
        strokeColor: "#38bdf8",
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["scenario", "value"],
      },
    });
    store.addOverlayLayer({
      id: "e2e-comparison-layer-b",
      name: "E2E Proposed Scenario",
      type: "geojson",
      visible: true,
      opacity: 0.78,
      group: "data",
      sourceKind: "imported",
      sourceData: createFeatureCollection(0.012, "proposed"),
      style: {
        fillColor: "#38bdf8",
        fillOpacity: 0.35,
        strokeColor: "#0ea5e9",
      },
      metadata: {
        geometryType: "Polygon",
        featureCount: 1,
        fields: ["scenario", "value"],
      },
    });
  });
}

async function seedWorkflowBufferLayer(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const featureCollection = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          id: "buffer-site-1",
          geometry: {
            type: "Point" as const,
            coordinates: [29.0, 41.0],
          },
          properties: { name: "Kadikoy transit stop" },
        },
        {
          type: "Feature" as const,
          id: "buffer-site-2",
          geometry: {
            type: "Point" as const,
            coordinates: [29.04, 41.02],
          },
          properties: { name: "Uskudar transit stop" },
        },
      ],
    };

    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-buffer-points",
      name: "E2E Istanbul WGS84 Points",
      type: "geojson",
      visible: true,
      opacity: 0.86,
      group: "data",
      sourceKind: "imported",
      sourceData: featureCollection,
      metadata: {
        geometryType: "Point",
        featureCount: featureCollection.features.length,
        fields: ["name"],
        datasetContext: {
          crs: "EPSG:4326",
        },
        crsSummary: {
          crs: "EPSG:4326",
          status: "known",
          source: "explicit",
          notes: ["E2E fixture declares WGS84 coordinates for Prompt 6 CRS planning."],
        },
      },
    });
  });
}

async function seedWorkflowMissingCrsLayer(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const featureCollection = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          id: "missing-crs-parcel-1",
          geometry: {
            type: "Polygon" as const,
            coordinates: [[
              [28.98, 41.0],
              [29.01, 41.0],
              [29.01, 41.03],
              [28.98, 41.03],
              [28.98, 41.0],
            ]],
          },
          properties: { name: "Missing CRS parcel" },
        },
      ],
    };

    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-missing-crs-polygons",
      name: "E2E Missing CRS Polygons",
      type: "geojson",
      visible: true,
      opacity: 0.86,
      group: "data",
      sourceKind: "imported",
      sourceData: featureCollection,
      metadata: {
        geometryType: "Polygon",
        featureCount: featureCollection.features.length,
        fields: ["name"],
      },
    });
  });
}

async function seedAttributeTableLayer(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(async () => {
    const module = await import("/src/stores/useMapExplorerStore.ts");
    const featureCollection = {
      type: "FeatureCollection" as const,
      features: Array.from({ length: 25 }, (_, index) => {
        const ring = Math.floor(index / 5);
        const slot = index % 5;
        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [29.0 + slot * 0.01, 41.0 + ring * 0.01],
          },
          properties: {
            id: index + 1,
            name: `site-${index + 1}`,
            value: (index + 1) * 4,
            date: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
          },
        };
      }),
    };

    module.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-attribute-points",
      name: "E2E Attribute Points",
      type: "geojson",
      visible: true,
      opacity: 0.9,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      sourceData: featureCollection,
      metadata: {
        geometryType: "Point",
        featureCount: featureCollection.features.length,
        fields: ["id", "name", "value", "date"],
        bounds: [29.0, 41.0, 29.04, 41.04],
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
      },
    });
  });
}

async function seedSelectionFixtureLayer(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(async () => {
    const storeModule = await import("/src/stores/useMapExplorerStore.ts");
    const fixtures = await import("/src/centerpanel/components/map/__tests__/fixtures/gisFixtures.ts");
    const featureCollection = fixtures.fcPointsWGS84;

    storeModule.useMapExplorerStore.getState().addOverlayLayer({
      id: "e2e-selection-points",
      name: "E2E fcPointsWGS84 Selection",
      type: "geojson",
      visible: true,
      opacity: 0.9,
      group: "data",
      sourceKind: "imported",
      queryable: true,
      sourceData: featureCollection,
      metadata: {
        geometryType: "Point",
        featureCount: featureCollection.features.length,
        fields: ["id", "name", "value", "date"],
        bounds: [29.0, 41.0, 29.04, 41.04],
        crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
      },
    });
  });
}

async function openWorkflowDrawer(page: import("@playwright/test").Page) {
  const directWorkflowButton = page.getByRole("button", { name: /Workflow|Open AOI .* Compare workflow drawer/i }).first();
  if (await directWorkflowButton.isVisible().catch(() => false)) {
    await triggerDomClick(directWorkflowButton);
  } else {
    await page.keyboard.press("Control+K");
    const palette = page.getByRole("dialog", { name: "Map command palette" });
    await expect(palette).toBeVisible();
    await palette.getByLabel("Search map commands").fill("workflow compare");
    await triggerDomClick(palette.getByRole("option", { name: /Workflow/i }).first());
  }

  const drawer = page.getByTestId("map-workflow-drawer");
  await expect(drawer).toBeVisible();
  return drawer;
}

async function openDrawingsPanel(page: import("@playwright/test").Page): Promise<void> {
  const panel = page.getByRole("region", { name: "Drawn features" });
  if (await panel.isVisible().catch(() => false)) return;
  const directToggles = page.getByRole("button", { name: "Toggle drawings panel" });
  const directToggleCount = await directToggles.count();
  for (let index = 0; index < directToggleCount; index += 1) {
    const directToggle = directToggles.nth(index);
    if (await directToggle.isVisible().catch(() => false)) {
      await triggerDomClick(directToggle);
      await expect(panel).toBeVisible();
      return;
    }
  }
  await page.keyboard.press("Control+K");
  const palette = page.getByRole("dialog", { name: "Map command palette" });
  await expect(palette).toBeVisible();
  await palette.getByLabel("Search map commands").fill("drawings");
  await triggerDomClick(palette.getByRole("option", { name: /Drawings/i }).first());
  await expect(panel).toBeVisible();
}

async function toggleDrawingsPanelFromPalette(page: import("@playwright/test").Page): Promise<void> {
  await page.keyboard.press("Control+K");
  const palette = page.getByRole("dialog", { name: "Map command palette" });
  await expect(palette).toBeVisible();
  await palette.getByLabel("Search map commands").fill("drawings");
  await triggerDomClick(palette.getByRole("option", { name: /Drawings/i }).first());
}

async function openReviewTimeline(page: import("@playwright/test").Page): Promise<void> {
  const timeline = page.getByTestId("map-review-timeline-event").first();
  const directReviewButton = page.getByRole("button", { name: "Open review timeline with filters and reproducible session export" }).first();
  if (await directReviewButton.isVisible().catch(() => false)) {
    await triggerDomClick(directReviewButton);
    await expect(timeline).toBeVisible();
    return;
  }

  const advancedButton = page.getByRole("button", { name: "Scientific QA, 3D sync, density, and command controls" }).first();
  if (await advancedButton.isVisible().catch(() => false)) {
    await triggerDomClick(advancedButton);
    const advancedMenu = page.getByRole("menu", { name: "Advanced commands" });
    await triggerDomClick(advancedMenu.getByRole("menuitem", {
      name: "Open review timeline with filters and reproducible session export",
    }).first());
    await expect(timeline).toBeVisible();
    return;
  }

  const statusReviewButton = page.getByRole("button", { name: /^Open review timeline$/ }).first();
  if (await statusReviewButton.isVisible().catch(() => false)) {
    await triggerDomClick(statusReviewButton);
    await expect(timeline).toBeVisible();
    return;
  }

  await page.keyboard.press("Control+K");
  const palette = page.getByRole("dialog", { name: "Map command palette" });
  await expect(palette).toBeVisible();
  await palette.getByLabel("Search map commands").fill("review timeline");
  await triggerDomClick(palette.getByRole("option", {
    name: /Open review timeline with filters and reproducible session export/i,
  }).first());
  await expect(timeline).toBeVisible();
}

function projectLngLat(
  coordinate: [number, number],
  viewport: { center: [number, number]; zoom: number },
  canvasBox: { x: number; y: number; width: number; height: number },
): { x: number; y: number } {
  const worldSize = 512 * 2 ** viewport.zoom;
  const project = ([lng, lat]: [number, number]) => {
    const sin = Math.sin((lat * Math.PI) / 180);
    return {
      x: ((lng + 180) / 360) * worldSize,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
    };
  };
  const point = project(coordinate);
  const center = project(viewport.center);
  return {
    x: canvasBox.x + canvasBox.width / 2 + point.x - center.x,
    y: canvasBox.y + canvasBox.height / 2 + point.y - center.y,
  };
}

test.describe("Prompt 35 premium Map Explorer layout", () => {
  test("opens, closes, and reopens the modal without losing the entry point", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await resetWorkbenchState(page);

    const mapExplorer = await openMapExplorer(page);
    await expect(page.getByTestId("map-canvas-region")).toBeVisible();

    await triggerDomClick(page.getByRole("button", { name: "Close map explorer (Escape)" }));
    await expect(mapExplorer).toBeHidden();

    const urbanModal = page.getByRole("dialog", { name: "Urban Analytics Workbench" });
    await expect(urbanModal).toBeVisible();
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));
    await expect(page.getByRole("dialog", { name: "Map Explorer" }).first()).toBeVisible();
    await expect(page.getByTestId("map-canvas-region")).toBeVisible();
  });

  test("keeps hidden Prompt 16 command palette routes discoverable", async ({ page }) => {
    await openPrompt16Explorer(page);
    await openCommandPalette(page);
    await expectPaletteCommand(page, "catalog", "catalog");
    await expectPaletteCommand(page, "contents", "contents");
    await expectPaletteCommand(page, "processing toolbox", "processing-toolbox");
    await expectPaletteCommand(page, "layout figure", "figure-composer");
    await expectPaletteCommand(page, "scientific qa", "qa");
    await expectPaletteCommand(page, "export geojson", "export-geojson");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Map command palette" })).toBeHidden();
  });

  test("switches every Prompt 16 activity without hiding the work surface", async ({ page }) => {
    const { shell, rail } = await openPrompt16Explorer(page);
    const activityIds = [
      "overview",
      "data",
      "layers",
      "analyze",
      "style",
      "scene",
      "publish",
      "qa",
      "review",
      "diagnostics",
      "extensions",
    ];
    for (const activityId of activityIds) {
      await expect(rail.getByTestId(`activity-btn-${activityId}`)).toBeVisible();
      await triggerDomClick(rail.getByTestId(`activity-btn-${activityId}`));
      await expect(shell).toHaveAttribute("data-map-active-activity", activityId);
      await expect(rail.getByTestId(`activity-btn-${activityId}`)).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("map-canvas-region")).toBeVisible();
    }
  });

  test("reaches Prompt 16 data, layers, inspector, QA, and attributes routes", async ({ page }) => {
    const { rail } = await openPrompt16Explorer(page, { seedWorkflowLayer: true });
    await triggerDomClick(rail.getByTestId("activity-btn-data"));
    await openSidebarTab(page, "data-import");
    await expect(page.getByTestId("map-catalog-panel")).toBeVisible();
    await expect(page.getByTestId("map-catalog-panel")).toContainText(/Add Data|Import/i);

    await triggerDomClick(rail.getByTestId("activity-btn-layers"));
    await openSidebarTab(page, "layers-contents");
    await expect(page.getByTestId("map-contents-tree")).toBeVisible();
    await openSidebarTab(page, "layers-stack");

    const seededLayerRow = page.getByRole("listitem", { name: /Layer: E2E Istanbul WGS84 Points/i });
    await expect(seededLayerRow).toBeVisible();
    await triggerDomClick(seededLayerRow.getByTestId("map-layer-inspect-trigger"));
    await expect(page.getByTestId("map-inspector-host")).toBeVisible();
    await expect(page.getByTestId("map-layer-inspector")).toBeVisible();
    await triggerDomClick(page.getByTestId("map-inspector-host").getByRole("button", { name: "Close inspector" }));

    await triggerDomClick(seededLayerRow.getByTestId("map-layer-table-trigger"));
    await expect(page.getByTestId("map-bottom-panel")).toHaveAttribute("data-active-bottom-tab", "attributes");
    await expect(page.getByTestId("map-attribute-table")).toBeVisible();

    await triggerDomClick(page.getByRole("button", { name: "Open QA Problems" }));
    await expect(page.getByTestId("map-bottom-panel")).toHaveAttribute("data-active-bottom-tab", "problems");
    await expect(page.getByRole("region", { name: "Map QA problems" })).toBeVisible();
  });

  test("reaches Prompt 16 Analyze workspace routes", async ({ page }) => {
    const { rail } = await openPrompt16Explorer(page);
    await triggerDomClick(rail.getByTestId("activity-btn-analyze"));
    await openSidebarTab(page, "analyze-workflows");
    await expect(page.getByTestId("map-workflow-drawer")).toBeVisible();
    await openSidebarTab(page, "analyze-tools");
    await expect(page.getByTestId("map-processing-toolbox")).toBeVisible();
    await openSidebarTab(page, "analyze-query");
    await expect(page.getByRole("region", { name: "Natural language map query builder" })).toBeVisible();
    await openSidebarTab(page, "analyze-models");
    await expect(page.getByTestId("map-model-builder")).toBeVisible();
  });

  test("reaches Prompt 16 Scene workspace routes", async ({ page }) => {
    const { rail } = await openPrompt16Explorer(page);
    await triggerDomClick(rail.getByTestId("activity-btn-scene"));
    await openSidebarTab(page, "scene-raster");
    await expect(page.getByTestId("map-scene-tab-body")).toContainText(/No raster layer|Raster/i);
    await openSidebarTab(page, "scene-3d");
    await expect(page.getByTestId("scene3d-panel")).toBeVisible();
    await openSidebarTab(page, "scene-zoning");
    await expect(page.getByTestId("zoning-rules-panel")).toBeVisible();
    await openSidebarTab(page, "scene-massing");
    await expect(page.getByTestId("massing-scenario-panel")).toBeVisible();
    await openSidebarTab(page, "scene-sun-shadow");
    await expect(page.getByTestId("sunshadow-panel")).toBeVisible();
  });

  test("reaches Prompt 16 Publish workspace routes", async ({ page }) => {
    const { rail } = await openPrompt16Explorer(page);
    await triggerDomClick(rail.getByTestId("activity-btn-publish"));
    await openSidebarTab(page, "publish-figure");
    await expect(page.getByTestId("map-layout-designer")).toBeVisible();
    await openSidebarTab(page, "publish-data-export");
    await expect(page.getByTestId("map-publish-panel-slot")).toContainText("GeoJSON and GeoParquet export");
    await openSidebarTab(page, "publish-report");
    await expect(page.getByTestId("map-publish-panel-slot")).toContainText("Snapshot and structured evidence");
    await openSidebarTab(page, "publish-offline-package");
    await expect(page.getByTestId("map-publish-panel-slot")).toContainText("Bounded reproducibility package");
    await openSidebarTab(page, "publish-review-package");
    await expect(page.getByTestId("map-publish-panel-slot")).toContainText("Pre-handoff metadata review");
  });

  test("standardizes Prompt 18 canvas controls for recovery, tools, basemap, and furniture", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await resetWorkbenchState(page);
    await openMapExplorerFromStore(page);
    await seedWorkflowBufferLayer(page);

    const viewportControls = page.getByTestId("map-canvas-viewport-controls");
    const furnitureControls = page.getByTestId("map-canvas-furniture-controls");
    const activeTool = page.getByTestId("map-active-tool-indicator");
    await expect(viewportControls).toBeVisible();
    await expect(furnitureControls).toBeVisible();
    await expect(activeTool).toContainText("Select");
    await expect(viewportControls.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(viewportControls.getByRole("button", { name: /Fit to visible layers/i })).toBeVisible();
    await expect(viewportControls.getByRole("button", { name: "Open CRS readiness" })).toBeVisible();

    await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      module.useMapExplorerStore.getState().setViewport({
        center: [0, 0],
        zoom: 1,
        bearing: 37,
        pitch: 25,
      });
    });
    await triggerDomClick(viewportControls.getByRole("button", { name: "Reset map view" }));
    await expect.poll(() => page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const state = module.useMapExplorerStore.getState();
      return {
        center: state.center,
        zoom: state.zoom,
        bearing: state.bearing,
        pitch: state.pitch,
      };
    })).toEqual({
      center: [29, 41],
      zoom: 10,
      bearing: 0,
      pitch: 0,
    });

    await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      module.useMapExplorerStore.getState().setActiveDrawTool("polygon");
    });
    await expect(activeTool).toContainText("Draw polygon");
    await triggerDomClick(activeTool.getByRole("button", { name: "Clear active map tool" }));
    await expect(activeTool).toContainText("Select");
    await expect.poll(() => page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const state = module.useMapExplorerStore.getState();
      return {
        activeTool: state.activeTool,
        activeDrawTool: state.activeDrawTool,
        activeMeasureTool: state.activeMeasureTool,
      };
    })).toEqual({
      activeTool: null,
      activeDrawTool: null,
      activeMeasureTool: null,
    });

    const beforeBasemapSwitch = await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const state = module.useMapExplorerStore.getState();
      return {
        activeBaseLayer: state.activeBaseLayer,
        overlayLayerIds: state.overlayLayers.map((layer) => layer.id),
      };
    });
    await triggerDomClick(furnitureControls.getByRole("button", { name: /Select base map layer/i }));
    await triggerDomClick(furnitureControls.getByRole("menuitemradio", { name: "OpenStreetMap" }));
    await expect.poll(() => page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const state = module.useMapExplorerStore.getState();
      return {
        activeBaseLayer: state.activeBaseLayer,
        overlayLayerIds: state.overlayLayers.map((layer) => layer.id),
      };
    })).toEqual({
      activeBaseLayer: "streets",
      overlayLayerIds: beforeBasemapSwitch.overlayLayerIds,
    });
    expect(beforeBasemapSwitch.activeBaseLayer).not.toBe("streets");

    await triggerDomClick(furnitureControls.getByRole("button", { name: "Hide north arrow" }));
    await expect(page.getByTestId("map-north-arrow-preview")).toBeHidden();
    const showLegendToggle = furnitureControls.getByRole("button", { name: "Show legend" });
    if (
      await showLegendToggle.isVisible().catch(() => false)
      && await showLegendToggle.isEnabled().catch(() => false)
    ) {
      await triggerDomClick(showLegendToggle);
      await expect(page.getByTestId("map-legend-overlay")).toBeVisible();
    }
    const hideLegendToggle = furnitureControls.getByRole("button", { name: "Hide legend" });
    if (
      await hideLegendToggle.isVisible().catch(() => false)
      && await hideLegendToggle.isEnabled().catch(() => false)
    ) {
      await triggerDomClick(hideLegendToggle);
      await expect(page.getByTestId("map-legend-overlay")).toBeHidden();
      await expect(furnitureControls.getByRole("button", { name: "Show legend" })).toHaveAttribute("aria-pressed", "false");
    }
    await triggerDomClick(furnitureControls.getByRole("button", { name: "Hide scale bar" }));
    await expect(furnitureControls.getByRole("button", { name: "Show scale bar" })).toHaveAttribute("aria-pressed", "false");

    await page.evaluate(() => {
      const canvas = document.querySelector<HTMLElement>('[data-testid="map-canvas-region"]');
      if (!canvas) return;
      const probe = document.createElement("div");
      probe.dataset.testid = "prompt18-feature-popup-probe";
      probe.className = "maplibregl-popup";
      probe.style.position = "absolute";
      probe.style.left = "50%";
      probe.style.top = "50%";
      probe.style.width = "220px";
      probe.style.height = "112px";
      probe.style.transform = "translate(-50%, -50%)";
      probe.style.background = "rgba(255,255,255,0.94)";
      canvas.appendChild(probe);
    });

    const overlapProbe = await page.evaluate(() => {
      const controls = [
        document.querySelector('[data-testid="map-canvas-viewport-controls"]'),
        document.querySelector('[data-testid="map-canvas-furniture-controls"]'),
        document.querySelector('[data-testid="map-active-tool-indicator"]'),
      ].filter((element): element is Element => Boolean(element));
      const popup = document.querySelector('[data-testid="prompt18-feature-popup-probe"]');
      const status = document.querySelector('[role="status"][aria-label="Map status"]');
      const overlaps = (left: DOMRect, right: DOMRect): boolean =>
        left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
      return controls.flatMap((control, index) => {
        const controlRect = control.getBoundingClientRect();
        const issues: string[] = [];
        if (popup && overlaps(controlRect, popup.getBoundingClientRect())) issues.push(`control-${index}-popup`);
        if (status && overlaps(controlRect, status.getBoundingClientRect())) issues.push(`control-${index}-status`);
        return issues;
      });
    });
    expect(overlapProbe).toEqual([]);
    await expectNoHorizontalOverflowOrPanelOverlap(page);
  });

  test("keeps map, layer rail, and bottom status visible on desktop", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);

    const canvasRegion = page.getByTestId("map-canvas-region");
    const layerRail = page.getByTestId("map-layer-panel-rail");
    const bottomTimeline = page.getByTestId("map-bottom-timeline");
    const commandCenter = page.getByTestId("map-command-center");

    await expect(canvasRegion).toBeVisible();
    await expect(layerRail).toBeVisible();
    await expect(layerRail).toHaveAttribute("data-map-panel-rail", "left");
    await expect(bottomTimeline).toBeVisible();
    await expect(commandCenter).toBeVisible();
    await expect(commandCenter.getByTestId("map-toolbar-command-command-palette")).toBeVisible();
    await expect(commandCenter.getByTestId("map-command-center-primary-action")).toBeVisible();
    await expect(commandCenter.getByTestId("map-command-center-overflow")).toBeVisible();
    await expect(page.getByRole("application", { name: /Interactive map canvas/i })).toBeVisible();

    const canvasBox = await canvasRegion.boundingBox();
    const railBox = await layerRail.boundingBox();
    const timelineBox = await bottomTimeline.boundingBox();
    const registryCount = Number(await commandCenter.getAttribute("data-command-registry-count"));
    const visibleCount = Number(await commandCenter.getAttribute("data-command-center-visible-count"));

    expect(canvasBox?.height ?? 0).toBeGreaterThanOrEqual(560);
    expect(railBox?.width ?? 0).toBeGreaterThanOrEqual(320);
    expect(timelineBox?.height ?? 0).toBeGreaterThan(24);
    expect(registryCount).toBeGreaterThan(visibleCount);

    await testInfo.attach("prompt-35-desktop-viewport", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("switches premium activity rail state without hiding the work surface", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);

    const shell = page.locator('[data-map-explorer-shell="true"]');
    const rail = page.getByTestId("map-activity-rail");
    await expect(rail).toBeVisible();
    await expect(rail.getByTestId("activity-btn-overview")).toBeVisible();
    await expect(rail.getByTestId("activity-btn-data")).toBeVisible();
    await expect(rail.getByTestId("activity-btn-layers")).toBeVisible();
    await expect(rail.getByTestId("activity-btn-analyze")).toBeVisible();
    await expect(rail.getByTestId("activity-btn-style")).toBeVisible();
    await expect(rail.getByTestId("activity-btn-scene")).toBeVisible();
    await expect(rail.getByTestId("activity-btn-publish")).toBeVisible();

    await triggerDomClick(rail.getByTestId("activity-btn-data"));
    await expect(shell).toHaveAttribute("data-map-active-activity", "data");
    await expect(rail.getByTestId("activity-btn-data")).toHaveAttribute("aria-pressed", "true");

    await triggerDomClick(rail.getByTestId("activity-btn-layers"));
    await expect(shell).toHaveAttribute("data-map-active-activity", "layers");
    await expect(rail.getByTestId("activity-btn-layers")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("map-canvas-region")).toBeVisible();
  });

  test("persists resized layer rail width", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);

    const layerRail = page.getByTestId("map-layer-panel-rail");
    const resizeHandle = page.getByTestId("map-panel-resize-handle");
    await expect(resizeHandle).toBeVisible();

    const beforeBox = await layerRail.boundingBox();
    expect(beforeBox).not.toBeNull();
    if (!beforeBox) return;

    await page.mouse.move(beforeBox.x + beforeBox.width - 2, beforeBox.y + beforeBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(beforeBox.x + beforeBox.width + 88, beforeBox.y + beforeBox.height / 2);
    await page.mouse.up();

    await expect.poll(async () => {
      const box = await layerRail.boundingBox();
      return Math.round(box?.width ?? 0);
    }).toBeGreaterThan(Math.round(beforeBox.width + 40));

    await expect.poll(async () => await getPersistedLayerPanelWidth(page)).toBeGreaterThan(Math.round(beforeBox.width + 40));
  });

  test("switches the layer panel to a bottom drawer on constrained viewports", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 720, height: 760 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);

    const canvasRegion = page.getByTestId("map-canvas-region");
    const layerRail = page.getByTestId("map-layer-panel-rail");

    await expect(canvasRegion).toHaveAttribute("data-map-dock-compact", "true");
    await expect(canvasRegion).toHaveAttribute("data-map-layer-placement", "bottom");
    await expect(layerRail).toHaveAttribute("data-map-panel-rail", "bottom");
    await expect(layerRail).toBeVisible();

    const canvasBox = await canvasRegion.boundingBox();
    const railBox = await layerRail.boundingBox();

    expect(canvasBox?.height ?? 0).toBeGreaterThanOrEqual(420);
    expect(railBox?.height ?? 0).toBeGreaterThan(160);
    expect(railBox?.width ?? 0).toBeGreaterThan(680);

    await testInfo.attach("prompt-35-narrow-viewport", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });

  test("renders comparison mode with split or swipe preview and synchronized legend", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);
    await seedComparisonLayers(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Existing Conditions");
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Proposed Scenario");

    const drawer = await openWorkflowDrawer(page);
    await triggerDomClick(drawer.getByRole("button", { name: /Compare.*Synchronized split, swipe, or opacity blend/i }));

    const selectors = drawer.getByLabel("Layer selector");
    await selectors.nth(0).selectOption("e2e-comparison-layer-a");
    await selectors.nth(1).selectOption("e2e-comparison-layer-b");
    await triggerDomClick(drawer.getByRole("button", { name: "Swipe view" }));

    const previewHud = page.getByTestId("map-workflow-preview-hud");
    await expect(previewHud).toBeVisible();
    await expect(previewHud).toContainText("Comparison preview");
    await expect(previewHud).toContainText("swipe");

    const comparisonLegend = page.getByTestId("map-comparison-legend");
    await expect(comparisonLegend).toBeVisible();
    await expect(comparisonLegend).toContainText("A · E2E Existing Conditions");
    await expect(comparisonLegend).toContainText("B · E2E Proposed Scenario");
  });

  test("shows the execution CRS chip on workflow preview", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);
    await seedWorkflowBufferLayer(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Istanbul WGS84 Points");

    const drawer = await openWorkflowDrawer(page);
    await triggerDomClick(drawer.getByRole("button", { name: /Buffer: Geodesic ring/i }));
    await drawer.getByLabel("Layer selector").selectOption("e2e-buffer-points");

    const executionCrsChip = page.getByTestId("map-workflow-execution-crs-chip");
    await expect(executionCrsChip).toBeVisible();
    await expect(executionCrsChip).toContainText("Execution CRS EPSG:32635");
  });

  test("blocks buffer workflows when source CRS is missing", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);
    await seedWorkflowMissingCrsLayer(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E Missing CRS Polygons");

    const drawer = await openWorkflowDrawer(page);
    await triggerDomClick(drawer.getByRole("button", { name: /Buffer: Geodesic ring/i }));
    await drawer.getByLabel("Layer selector").selectOption("e2e-missing-crs-polygons");

    const blockedCard = drawer.getByTestId("map-workflow-crs-blocked-card");
    await expect(blockedCard).toBeVisible();
    await expect(blockedCard).toContainText("lack CRS metadata");
    await expect(blockedCard.getByRole("button", { name: /Declare CRS/i })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /Apply spatial workflow blocked/i })).toBeDisabled();
  });

  test("declares a user CRS (caveated) for a missing-CRS layer from the layer rail", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);
    await seedWorkflowMissingCrsLayer(page);

    const row = page.getByRole("listitem", { name: /Layer: E2E Missing CRS Polygons/i });
    await expect(row).toBeVisible();
    await expect(row).toContainText("CRS missing");

    await triggerDomClick(row.getByTestId("map-declare-crs-trigger"));

    const popover = page.getByTestId("map-declare-crs-popover");
    await expect(popover).toBeVisible();
    await expect(popover.getByTestId("map-declare-crs-caveat")).toContainText(/not verified/i);

    await popover.getByTestId("map-declare-crs-search").fill("32635");
    await triggerDomClick(popover.getByRole("button", { name: /Declare EPSG:32635/i }));

    // The CRS badge now reads "user-declared (caveat)" and the caveat persists in the row.
    await expect(popover).toBeHidden();
    await expect(row).toContainText("user-declared (caveat)");
    await expect(row).not.toContainText("CRS missing");
  });

  test("builds a viewport AOI and audits a vertex edit with validation status (Prompt 14)", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);
    const drawer = await openWorkflowDrawer(page);
    const applyWorkflowButton = drawer.getByRole("button", { name: /Apply spatial workflow|Apply workflow/i });
    await expect(applyWorkflowButton).toBeEnabled();
    await triggerDomClick(applyWorkflowButton);

    await expect.poll(async () => page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const store = module.useMapExplorerStore.getState();
      return store.drawnFeatures.some((feature) =>
        feature.properties.label === "Custom AOI" && feature.properties.validation?.status === "valid");
    })).toBe(true);

    await page.evaluate(async () => {
      const storeModule = await import("/src/stores/useMapExplorerStore.ts");
      const validationModule = await import("/src/services/map/DrawnGeometryValidation.ts");
      const store = storeModule.useMapExplorerStore.getState();
      const aoi = store.drawnFeatures.find((feature) => feature.properties.label === "Custom AOI");
      if (!aoi) throw new Error("Viewport AOI drawing was not created.");
      const geometry = {
        type: "Polygon" as const,
        coordinates: [[
          [29.12, 41.06],
          [29.22, 41.06],
          [29.22, 41.16],
          [29.12, 41.16],
          [29.12, 41.06],
        ]],
      };
      store.updateDrawnFeature(aoi.id, {
        geometry,
        properties: {
          ...aoi.properties,
          validation: validationModule.validateDrawnGeometry(geometry),
        },
      });
      store.setActiveAoi(aoi.id);
      store.setSelectedFeatureId(aoi.id);
    });

    await triggerDomClick(drawer.getByRole("button", { name: "Close map workflow drawer" }));
    await openDrawingsPanel(page);
    await expect(page.getByRole("region", { name: "Drawn features" })).toContainText("Validated");

    const dragTarget = await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const store = module.useMapExplorerStore.getState();
      const aoi = store.drawnFeatures.find((feature) => feature.properties.label === "Custom AOI");
      if (!aoi || aoi.geometry.type !== "Polygon") throw new Error("Editable AOI polygon was not found.");
      return {
        center: store.center,
        zoom: store.zoom,
        coordinate: aoi.geometry.coordinates[0][2],
      };
    });
    const canvasBox = await page.locator(".maplibregl-canvas").first().boundingBox();
    expect(canvasBox).not.toBeNull();
    const start = projectLngLat(
      dragTarget.coordinate as [number, number],
      { center: dragTarget.center as [number, number], zoom: dragTarget.zoom },
      canvasBox!,
    );
    await page.waitForTimeout(100);

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 34, start.y - 18, { steps: 6 });
    await page.mouse.up();

    await expect.poll(async () => page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const store = module.useMapExplorerStore.getState();
      const aoi = store.drawnFeatures.find((feature) => feature.properties.label === "Custom AOI");
      return {
        edited: store.reviewSession.events.some((event) => event.title.includes("Edited AOI")),
        status: aoi?.properties.validation?.status ?? null,
      };
    })).toEqual({ edited: true, status: "valid" });
    await expect(page.getByRole("region", { name: "Drawn features" })).toContainText("Validated");

    await openReviewTimeline(page);

    await expect(
      page.getByTestId("map-review-timeline-event").filter({ hasText: "Edited AOI" }).first(),
    ).toBeVisible();
  });

  test("selects fcPointsWGS84 points with a rectangle and shows the count chip (Prompt 15)", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);
    await seedSelectionFixtureLayer(page);
    await expect(page.getByRole("list", { name: "Layer list" })).toContainText("E2E fcPointsWGS84 Selection");
    const drawingsPanel = page.getByRole("region", { name: "Drawn features" });
    if (await drawingsPanel.isVisible().catch(() => false)) {
      await toggleDrawingsPanelFromPalette(page);
      await expect(page.getByRole("region", { name: "Drawn features" })).toBeHidden();
    }

    const countChip = page.getByTestId("map-selection-count-chip");
    await expect(countChip).toBeVisible();
    await expect(countChip).toContainText("0 selected");
    await triggerDomClick(page.getByTestId("map-rectangle-select-tool"));

    const viewport = await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const store = module.useMapExplorerStore.getState();
      return { center: store.center, zoom: store.zoom };
    });
    const canvasBox = await page.locator(".maplibregl-canvas").first().boundingBox();
    expect(canvasBox).not.toBeNull();
    if (!canvasBox) return;

    const start = projectLngLat(
      [28.995, 40.995],
      { center: viewport.center as [number, number], zoom: viewport.zoom },
      canvasBox,
    );
    const end = projectLngLat(
      [29.045, 41.015],
      { center: viewport.center as [number, number], zoom: viewport.zoom },
      canvasBox,
    );
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 });
    await page.mouse.up();

    await expect(countChip).toContainText("10 selected");
    await expect.poll(async () => page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      return module.useMapExplorerStore.getState().selectedFeatureIds["e2e-selection-points"]?.length ?? 0;
    })).toBe(10);
    await expect.poll(async () => page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      return module.useMapExplorerStore.getState().reviewSession.events.some((event) =>
        event.title === "Rectangle selection query" &&
        event.details?.bounded === true &&
        event.details?.provenance != null);
    })).toBe(true);
  });

  test("routes layer removal through the command lifecycle with an audit row and revert", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);
    await seedWorkflowBufferLayer(page);

    const layerList = page.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("E2E Istanbul WGS84 Points");

    // Remove the layer through the layer-action menu (Delete -> Confirm delete);
    // both removal paths are routed through MapActionExecutor.
    await page.getByLabel("Layer actions for E2E Istanbul WGS84 Points").evaluate((el) => {
      (el as HTMLElement).closest("details")?.setAttribute("open", "");
    });
    await triggerDomClick(page.getByRole("menuitem", { name: "Delete E2E Istanbul WGS84 Points" }));
    await triggerDomClick(page.getByRole("menuitem", { name: "Confirm delete E2E Istanbul WGS84 Points" }));
    await expect(layerList).not.toContainText("E2E Istanbul WGS84 Points");

    // Open the review timeline and assert the audit row + revert affordance.
    await openReviewTimeline(page);

    const revertButton = page.getByTestId("map-review-timeline-revert");
    await expect(revertButton).toBeVisible();
    await expect(
      page.getByTestId("map-review-timeline-event").filter({ hasText: "Removed layer" }).first(),
    ).toBeVisible();

    // Revert restores the layer to the rail.
    await triggerDomClick(revertButton);
    await expect(layerList).toContainText("E2E Istanbul WGS84 Points");
  });

  test("opens a tabbed layer inspector with schema + CRS, and shows missing CRS explicitly", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);

    await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      module.useMapExplorerStore.getState().addOverlayLayer({
        id: "e2e-inspector-points",
        name: "E2E Inspector Points",
        type: "geojson",
        visible: true,
        opacity: 0.9,
        group: "data",
        sourceKind: "imported",
        sourceData: { type: "FeatureCollection", features: [] },
        metadata: {
          geometryType: "Point",
          featureCount: 25,
          fields: ["id", "name", "value", "date"],
          crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
        },
      });
      module.useMapExplorerStore.getState().addOverlayLayer({
        id: "e2e-inspector-missing",
        name: "E2E Inspector Missing",
        type: "geojson",
        visible: true,
        opacity: 0.9,
        group: "data",
        sourceKind: "imported",
        sourceData: { type: "FeatureCollection", features: [] },
        metadata: { geometryType: "Polygon", featureCount: 10 },
      });
    });

    const layerList = page.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("E2E Inspector Points");

    // Inspect the known layer: Schema lists `value`, CRS shows EPSG:4326.
    const pointsRow = page.getByRole("listitem", { name: /Layer: E2E Inspector Points/i });
    await triggerDomClick(pointsRow.getByTestId("map-layer-inspect-trigger"));
    const inspectorHost = page.getByTestId("map-inspector-host");
    await expect(inspectorHost).toBeVisible();
    await expect(inspectorHost).toHaveAttribute("data-context", "layer");
    await expect(inspectorHost).toHaveAttribute("data-presentation", "right-rail");

    const inspector = page.getByTestId("map-layer-inspector");
    await expect(inspector).toBeVisible();
    await expect(inspector).toHaveAttribute("data-presentation", "embedded");

    await triggerDomClick(inspector.getByTestId("map-layer-inspector-tab-schema"));
    await expect(page.getByTestId("map-layer-inspector-panel-schema")).toContainText("value");

    await triggerDomClick(inspector.getByTestId("map-layer-inspector-tab-crs"));
    await expect(page.getByTestId("map-layer-inspector-panel-crs")).toContainText("EPSG:4326");

    await triggerDomClick(inspectorHost.getByRole("button", { name: "Close inspector" }));
    await expect(inspectorHost).toBeHidden();

    // The missing-CRS layer shows CRS as `missing`, never a blank.
    const missingRow = page.getByRole("listitem", { name: /Layer: E2E Inspector Missing/i });
    await triggerDomClick(missingRow.getByTestId("map-layer-inspect-trigger"));
    await triggerDomClick(page.getByTestId("map-layer-inspector").getByTestId("map-layer-inspector-tab-crs"));
    await expect(page.getByTestId("map-layer-inspector-panel-crs")).toContainText("missing");
  });

  test("opens an attribute table and syncs row selection with the map context summary", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);
    await seedAttributeTableLayer(page);

    const layerList = page.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("E2E Attribute Points");

    const row = page.getByRole("listitem", { name: /Layer: E2E Attribute Points/i });
    await triggerDomClick(row.getByTestId("map-layer-table-trigger"));

    const table = page.getByTestId("map-attribute-table");
    await expect(table).toBeVisible();
    await expect(table.getByTestId("map-attribute-table-count")).toContainText("25 of 25");

    const firstTableRow = table.getByTestId("map-attribute-row").first();
    await triggerDomClick(firstTableRow);
    await expect(firstTableRow).toHaveAttribute("aria-selected", "true");

    await expect(page.getByTestId("map-bottom-timeline")).toContainText("Select");
    await expect(page.getByTestId("map-bottom-timeline")).toContainText("1");

    const selectedFeatureCount = await page.evaluate(async () => {
      const storeModule = await import("/src/stores/useMapExplorerStore.ts");
      const summaryModule = await import("/src/centerpanel/components/map/mapContextSummary.ts");
      return summaryModule.selectMapExplorerContextSummary(
        storeModule.useMapExplorerStore.getState(),
      ).selection.totalSelectedFeatures;
    });
    expect(selectedFeatureCount).toBe(1);
  });

  test("creates a derived attribute layer with a provenance badge from the sandboxed calculator", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);
    await seedAttributeTableLayer(page);

    const row = page.getByRole("listitem", { name: /Layer: E2E Attribute Points/i });
    await triggerDomClick(row.getByTestId("map-layer-table-trigger"));

    const table = page.getByTestId("map-attribute-table");
    await expect(table).toBeVisible();
    await triggerDomClick(table.getByRole("button", { name: "Calculator" }));

    await table.getByLabel("Derived field name").fill("value_x2");
    await table.getByLabel("Field calculator expression").fill("value * 2");
    await triggerDomClick(table.getByTestId("map-field-calculator-preview"));
    await expect(table.getByTestId("map-field-calculator-preview-summary")).toContainText("value_x2");
    await triggerDomClick(table.getByTestId("map-field-calculator-apply"));

    await expect(table.getByTestId("map-attribute-table-provenance-badge")).toContainText("Derived");
    await expect(table.getByTestId("map-attribute-column-value_x2")).toBeVisible();
  });

  test("keeps controls usable across desktop, tablet, and short viewport screenshots", async ({ page }, testInfo) => {
    const viewports = [
      { label: "desktop", width: 1440, height: 900, minimumHeight: 500 },
      { label: "tablet", width: 768, height: 1024, minimumHeight: 420 },
      { label: "short", width: 1280, height: 600, minimumHeight: 300 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await resetWorkbenchState(page);
      await openMapExplorer(page);
      await triggerDomClick(page.getByRole("button", { name: "Open QA Problems" }));

      const canvasRegion = page.getByTestId("map-canvas-region");
      const bottomTimeline = page.getByTestId("map-bottom-timeline");
      await expect(canvasRegion).toBeVisible();
      await expect(bottomTimeline).toBeVisible();
      await expect(page.getByTestId("map-bottom-panel")).toHaveAttribute("data-active-bottom-tab", "problems");

      const canvasBox = await canvasRegion.boundingBox();
      expect(canvasBox?.height ?? 0).toBeGreaterThanOrEqual(viewport.minimumHeight);
      await expectNoHorizontalOverflowOrPanelOverlap(page);

      await testInfo.attach(`prompt-16-${viewport.label}-viewport`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    }
  });

  test("runs a large buffer in a worker, keeping the main thread responsive (Prompt 13)", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);
    await openMapExplorer(page);

    // Seed a large point layer (> worker threshold) so the buffer is routed off-thread.
    await page.evaluate(async () => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      const COUNT = 8000;
      const features = Array.from({ length: COUNT }, (_, index) => ({
        type: "Feature" as const,
        id: `pt-${index}`,
        geometry: {
          type: "Point" as const,
          coordinates: [28.95 + (index % 200) * 0.0008, 41.0 + Math.floor(index / 200) * 0.0008],
        },
        properties: { id: index },
      }));
      module.useMapExplorerStore.getState().addOverlayLayer({
        id: "e2e-large-buffer",
        name: "E2E Large Points",
        type: "geojson",
        visible: true,
        opacity: 0.9,
        group: "data",
        sourceKind: "imported",
        sourceData: { type: "FeatureCollection", features },
        metadata: {
          geometryType: "Point",
          featureCount: COUNT,
          fields: ["id"],
          // Declared projected CRS so the planar buffer is CRS-safe (not
          // reproject-blocked) and routes to the worker on its own.
          crsSummary: { crs: "EPSG:32635", status: "known", source: "explicit", notes: [] },
        },
      });
    });

    // Execute the buffer through the real background worker pool while a
    // requestAnimationFrame counter ticks. If the geometry ran on the main
    // thread, the counter would stall; off-thread it keeps advancing.
    const outcome = await page.evaluate(async () => {
      const svc = await import("/src/services/map/MapWorkflowService.ts");
      const execMod = await import("/src/services/map/geometry/mapWorkflowWorkerExecutor.ts");
      const store = (await import("/src/stores/useMapExplorerStore.ts")).useMapExplorerStore.getState();

      const context = svc.buildMapWorkflowContext(store.overlayLayers);
      const draft = {
        kind: "buffer" as const,
        sourceMode: "layer" as const,
        sourceLayerId: "e2e-large-buffer",
        distance: 250,
        unit: "meters" as const,
        segments: 8,
        dissolve: false,
        name: "E2E worker buffer",
      };
      const preview = svc.generateMapWorkflowPreview(draft, context);

      let frames = 0;
      let running = true;
      const tick = () => {
        if (!running) return;
        frames += 1;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      const executor = execMod.createMapWorkflowWorkerExecutor();
      let sawProgress = false;
      const result = await svc.executeMapWorkflow(
        preview,
        context,
        executor,
        { onProgress: (update) => { if (update.status === "running" || update.status === "queued") sawProgress = true; } },
      );
      running = false;

      return {
        needsWorker: preview.needsWorker,
        frames,
        sawProgress,
        featureCount: result.preview.featureCount,
        executionCrs: result.manifest.crsSummary.executionCrs,
        backend: String(result.reportItem.metrics.geometry_backend ?? ""),
        derivedLayerId: result.layer.id,
      };
    });

    expect(outcome.needsWorker).toBe(true);
    // Worker reported progress and results are fully attributed.
    expect(outcome.sawProgress).toBe(true);
    expect(outcome.featureCount).toBeGreaterThan(0);
    expect(outcome.executionCrs).toBe("EPSG:32635");
    // geos-wasm actually initialises + runs in the browser worker (turf is the
    // resilient fallback in code, but the supported path is geos-wasm).
    expect(outcome.backend).toBe("geos-wasm");
    expect(outcome.derivedLayerId).toContain("derived:buffer");
    // Main thread stayed responsive during the off-thread run.
    expect(outcome.frames).toBeGreaterThan(3);
  });
});
