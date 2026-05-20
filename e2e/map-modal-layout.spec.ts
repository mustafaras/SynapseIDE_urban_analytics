import { expect, test } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openMapExplorer(page: import("@playwright/test").Page) {
  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  const exploreButton = page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first();
  await expect(exploreButton).toBeVisible();
  await triggerDomClick(exploreButton);
  return mapExplorer;
}

async function getPersistedLayerPanelWidth(page: import("@playwright/test").Page): Promise<number | null> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem("synapse-map-explorer");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { layoutPreferences?: { layerPanelWidth?: number } } };
    return parsed.state?.layoutPreferences?.layerPanelWidth ?? null;
  });
}

async function seedComparisonLayers(page: import("@playwright/test").Page): Promise<void> {
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

test.describe("Prompt 35 premium Map Explorer layout", () => {
  test("keeps map, layer rail, and bottom status visible on desktop", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    await openMapExplorer(page);

    const canvasRegion = page.getByTestId("map-canvas-region");
    const layerRail = page.getByTestId("map-layer-panel-rail");
    const bottomTimeline = page.getByTestId("map-bottom-timeline");

    await expect(canvasRegion).toBeVisible();
    await expect(layerRail).toBeVisible();
    await expect(layerRail).toHaveAttribute("data-map-panel-rail", "left");
    await expect(bottomTimeline).toBeVisible();
    await expect(page.getByRole("application", { name: /Interactive map canvas/i })).toBeVisible();

    const canvasBox = await canvasRegion.boundingBox();
    const railBox = await layerRail.boundingBox();
    const timelineBox = await bottomTimeline.boundingBox();

    expect(canvasBox?.height ?? 0).toBeGreaterThanOrEqual(560);
    expect(railBox?.width ?? 0).toBeGreaterThanOrEqual(320);
    expect(timelineBox?.height ?? 0).toBeGreaterThan(24);

    await testInfo.attach("prompt-35-desktop-viewport", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
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

  test("keeps controls usable across laptop and tablet viewport screenshots", async ({ page }, testInfo) => {
    const viewports = [
      { label: "laptop", width: 1366, height: 900, minimumHeight: 520 },
      { label: "tablet", width: 1024, height: 768, minimumHeight: 420 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await resetWorkbenchState(page);
      await openMapExplorer(page);

      const canvasRegion = page.getByTestId("map-canvas-region");
      const bottomTimeline = page.getByTestId("map-bottom-timeline");
      await expect(canvasRegion).toBeVisible();
      await expect(bottomTimeline).toBeVisible();

      const canvasBox = await canvasRegion.boundingBox();
      expect(canvasBox?.height ?? 0).toBeGreaterThanOrEqual(viewport.minimumHeight);

      await testInfo.attach(`prompt-35-${viewport.label}-viewport`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    }
  });
});
