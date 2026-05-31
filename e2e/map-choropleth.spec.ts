import { expect, test } from "@playwright/test";
import { importLocalMapFileWithPreflight } from "./helpers/mapImport";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

function createChoroplethFixture() {
  const ring = (minLng: number, minLat: number, maxLng: number, maxLat: number) => [[
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat],
  ]];

  const document = {
    type: "FeatureCollection",
    features: [
      { type: "Feature", id: "tract-1", geometry: { type: "Polygon", coordinates: ring(28.96, 41.00, 28.97, 41.01) }, properties: { name: "Tract 1", score: 12 } },
      { type: "Feature", id: "tract-2", geometry: { type: "Polygon", coordinates: ring(28.97, 41.00, 28.98, 41.01) }, properties: { name: "Tract 2", score: 28 } },
      { type: "Feature", id: "tract-3", geometry: { type: "Polygon", coordinates: ring(28.98, 41.00, 28.99, 41.01) }, properties: { name: "Tract 3", score: 47 } },
      { type: "Feature", id: "tract-4", geometry: { type: "Polygon", coordinates: ring(28.99, 41.00, 29.00, 41.01) }, properties: { name: "Tract 4", score: 83 } },
      { type: "Feature", id: "tract-5", geometry: { type: "Polygon", coordinates: ring(29.00, 41.00, 29.01, 41.01) }, properties: { name: "Tract 5", score: null } },
    ],
  };

  return {
    name: "choropleth-polygons.geojson",
    mimeType: "application/geo+json",
    buffer: Buffer.from(JSON.stringify(document)),
  };
}

test.describe("Map Explorer choropleth renderer", () => {
  test("renders the full thematic configuration panel for an imported polygon layer", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();
    await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());

    await triggerDomClick(page.getByRole("button", {
      name: /Import GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, and GPX files|Open spatial data import options/i,
    }));
    const importHub = page.getByRole("dialog", { name: "Spatial data import hub" });
    await expect(importHub).toBeVisible();

    await importLocalMapFileWithPreflight(page, createChoroplethFixture());

    await expect(page.getByTestId("toast").filter({ hasText: /Imported choropleth-polygons \(5 features\)\./i }).first()).toBeVisible();
    await triggerDomClick(page.getByRole("button", {
      name: /Switch toolbar to Analyze mode|Analyze Outputs|Switch map workspace to analyze/i,
    }).first());
    await triggerDomClick(page.getByRole("button", { name: /Open thematic choropleth panel|Toggle choropleth panel/i }));

    const choropleth = page.getByRole("dialog", { name: "Choropleth configuration" });
    await expect(choropleth).toBeVisible();
    await expect(choropleth.getByLabel("Polygon layer")).toContainText("choropleth-polygons");
    await expect(choropleth.getByLabel("Attribute")).toHaveValue("score");

    await choropleth.getByLabel("Method").selectOption("natural-breaks");
    await expect(choropleth.getByLabel("Method")).toHaveValue("natural-breaks");
    await choropleth.getByLabel("Classes").selectOption("5");
    await choropleth.getByLabel("Color ramp").selectOption("Blues");
    await expect(choropleth.getByLabel("Color ramp")).toHaveValue("Blues");

    await expect(choropleth.getByText("Ramp preview")).toBeVisible();
    await expect(choropleth.getByText("Legend", { exact: true })).toBeVisible();
    await expect(choropleth.getByText("Click a class to isolate it")).toBeVisible();
    await expect(choropleth.getByText("No data").first()).toBeVisible();
    await expect(choropleth.getByText("Polygons", { exact: true })).toBeVisible();
    await expect(choropleth.getByText("Numeric", { exact: true })).toBeVisible();

    await choropleth.getByLabel("Method").selectOption("equal-interval");
    await expect(choropleth.getByLabel("Method")).toHaveValue("equal-interval");
    await expect(choropleth.getByText("Legend", { exact: true })).toBeVisible();
  });
});
