import { expect, test } from "@playwright/test";
import { importLocalMapFileWithPreflight } from "./helpers/mapImport";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

function ring(minLng: number, minLat: number, maxLng: number, maxLat: number) {
  return [[
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat],
  ]];
}

function createLisaFixture() {
  const clusters = [
    ["HH", 1.8, 0.004, 1.2, 0.9],
    ["HL", 0.7, 0.028, 0.9, -0.8],
    ["LH", 0.6, 0.072, -0.7, 0.6],
    ["LL", 1.3, 0.018, -1.1, -0.9],
    ["NS", 0.1, 0.42, 0.1, -0.1],
  ] as const;

  const features = clusters.map(([clusterType, localI, pValue, zValue, spatialLag], index) => ({
    type: "Feature",
    id: `lisa-${index + 1}`,
    geometry: {
      type: "Polygon",
      coordinates: ring(28.96 + index * 0.01, 41.0, 28.968 + index * 0.01, 41.008),
    },
    properties: {
      name: `LISA ${index + 1}`,
      local_i: localI,
      p_value: pValue,
      cluster_type: clusterType,
      z_value: zValue,
      spatial_lag: spatialLag,
    },
  }));

  return {
    name: "lisa-result.geojson",
    mimeType: "application/geo+json",
    buffer: Buffer.from(JSON.stringify({ type: "FeatureCollection", features })),
  };
}

function createHotSpotFixture() {
  const categories = [
    ["hot-99", 2.9, 0.004],
    ["hot-95", 2.1, 0.025],
    ["hot-90", 1.7, 0.08],
    ["not-significant", 0.2, 0.8],
    ["cold-90", -1.8, 0.07],
    ["cold-95", -2.1, 0.03],
    ["cold-99", -2.9, 0.003],
  ] as const;

  const features = categories.map(([confidence, zScore, pValue], index) => ({
    type: "Feature",
    id: `hotspot-${index + 1}`,
    geometry: {
      type: "Polygon",
      coordinates: ring(28.96 + index * 0.008, 41.02, 28.966 + index * 0.008, 41.026),
    },
    properties: {
      name: `Gi* ${index + 1}`,
      gi_star: zScore,
      z_score: zScore,
      p_value: pValue,
      confidence_level: confidence,
    },
  }));

  return {
    name: "hotspot-result.geojson",
    mimeType: "application/geo+json",
    buffer: Buffer.from(JSON.stringify({ type: "FeatureCollection", features })),
  };
}

async function importFixture(page: import("@playwright/test").Page, fixture: ReturnType<typeof createLisaFixture>) {
  await importLocalMapFileWithPreflight(page, fixture);
}

test.describe("Map Explorer spatial statistics renderers", () => {
  test("shows LISA and Gi-star renderer controls with academic legends", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());

    await importFixture(page, createLisaFixture());
    await expect(page.getByTestId("toast").filter({ hasText: /Imported lisa-result \(5 features\)\./i }).first()).toBeVisible();

    await importFixture(page, createHotSpotFixture());
    await expect(page.getByTestId("toast").filter({ hasText: /Imported hotspot-result \(7 features\)\./i }).first()).toBeVisible();

    await triggerDomClick(page.getByRole("button", {
      name: /Switch toolbar to Analyze mode|Analyze Outputs|Switch map workspace to analyze/i,
    }).first());
    await triggerDomClick(mapExplorer.getByTestId("map-workbench-sidebar-tab-analyze-statistics"));
    await expect(mapExplorer.getByTestId("map-analyze-statistics")).toBeVisible();

    await triggerDomClick(mapExplorer.getByTestId("analyze-statistics-lisa"));
    const lisaPanel = page.getByRole("dialog", { name: "Local Moran's I analysis panel" });
    await expect(lisaPanel).toBeVisible();
    await expect(lisaPanel.getByText("LISA Result Renderer")).toBeVisible();
    await expect(lisaPanel.getByLabel("LISA Result Layer")).toContainText("lisa-result");
    await expect(lisaPanel.getByLabel("Significance Filter")).toBeVisible();
    await expect(lisaPanel.getByText("High-High")).toBeVisible();
    await expect(lisaPanel.getByText("High-Low")).toBeVisible();
    await expect(lisaPanel.getByText("Low-High")).toBeVisible();
    await expect(lisaPanel.getByText("Low-Low")).toBeVisible();
    await expect(lisaPanel.getByText("Not Significant").first()).toBeVisible();
    await expect(lisaPanel.getByText("Moran Scatterplot")).toBeVisible();

    await lisaPanel.getByLabel("Significance Filter").evaluate((node) => {
      const input = node as HTMLInputElement;
      input.value = "0.010";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(lisaPanel.getByText("p ≤ 0.010")).toBeVisible();

    await triggerDomClick(mapExplorer.getByTestId("analyze-statistics-hotspot"));
    const hotSpotPanel = page.getByRole("dialog", { name: "Getis-Ord Gi-star analysis panel" });
    await expect(hotSpotPanel).toBeVisible();
    await expect(hotSpotPanel.getByText("Gi* Hot/Cold Spot Renderer")).toBeVisible();
    await expect(hotSpotPanel.getByLabel("Gi* Result Layer")).toContainText("hotspot-result");
    await expect(hotSpotPanel.getByLabel("Confidence Filter")).toBeVisible();
    await expect(hotSpotPanel.getByText("Hot Spot 99%")).toBeVisible();
    await expect(hotSpotPanel.getByText("Hot Spot 95%")).toBeVisible();
    await expect(hotSpotPanel.getByText("Hot Spot 90%")).toBeVisible();
    await expect(hotSpotPanel.getByText("Cold Spot 90%")).toBeVisible();
    await expect(hotSpotPanel.getByText("Cold Spot 95%")).toBeVisible();
    await expect(hotSpotPanel.getByText("Cold Spot 99%")).toBeVisible();

    await hotSpotPanel.getByLabel("Confidence Filter").evaluate((node) => {
      const input = node as HTMLInputElement;
      input.value = "0.010";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(hotSpotPanel.getByText("p ≤ 0.010")).toBeVisible();
  });
});
