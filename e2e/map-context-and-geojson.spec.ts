import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import { importLocalMapFileWithPreflight } from "./helpers/mapImport";
import { openMapExplorer, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

function createGeoJsonFixture() {
  const document = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [28.972, 41.004],
            [28.98, 41.004],
            [28.98, 41.012],
            [28.972, 41.012],
            [28.972, 41.004],
          ]],
        },
        properties: {
          name: "Observation Area",
          category: "survey",
        },
      },
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [28.97, 41.0],
            [28.99, 41.0],
            [28.99, 41.02],
            [28.97, 41.02],
            [28.97, 41.0],
          ]],
        },
        properties: {
          name: "Study Area",
          status: "verified",
        },
      },
    ],
  };

  return {
    raw: JSON.stringify(document, null, 2),
    payload: {
      name: "study-area.geojson",
      mimeType: "application/geo+json",
      buffer: Buffer.from(JSON.stringify(document, null, 2)),
    },
  };
}

test.describe("Map Explorer context menu and GeoJSON I/O", () => {
  test("supports reverse geocoding, clipboard copy, and keyboard context-menu actions", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.route("**/nominatim.openstreetmap.org/reverse?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          place_id: 101,
          licence: "OpenStreetMap",
          osm_type: "way",
          osm_id: 202,
          lat: "51.523767",
          lon: "-0.158555",
          display_name: "221B Baker Street, Marylebone, London, Greater London, England, United Kingdom",
          type: "house",
          importance: 0.9,
          boundingbox: ["51.523700", "51.523800", "-0.158700", "-0.158400"],
          address: {
            suburb: "Marylebone",
            city: "London",
            state: "England",
            country: "United Kingdom",
          },
        }),
      });
    });

    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const mapExplorer = await openMapExplorer(page);

    const mapCanvas = page.getByRole("application", { name: /Interactive map canvas/i });
    await expect(mapCanvas).toBeVisible();

    await mapCanvas.click({ button: "right", position: { x: 520, y: 320 } });
    const contextMenu = page.getByRole("menu", { name: "Map context menu" });
    await expect(contextMenu).toBeVisible();

    const headerText = await contextMenu.textContent();
    const coordinateText = headerText?.match(/-?\d+\.\d{6}, -?\d+\.\d{6}/)?.[0] ?? "";
    expect(coordinateText).not.toHaveLength(0);

    await contextMenu.getByRole("menuitem", { name: /Copy coordinates/i }).click();
    await expect(page.getByTestId("toast").filter({ hasText: "Coordinates copied to clipboard." }).first()).toBeVisible();
    await expect.poll(async () => page.evaluate(() => navigator.clipboard.readText())).toBe(coordinateText);

    await mapCanvas.click({ button: "right", position: { x: 560, y: 360 } });
    await expect(contextMenu).toBeVisible();
    await contextMenu.getByRole("menuitem", { name: /^What's here\?/i }).click();
    await expect(page.getByText("221B Baker Street, Marylebone, London, Greater London, England, United Kingdom")).toBeVisible();
    await expect(page.getByText("Marylebone • London • England • United Kingdom")).toBeVisible();

    await mapCanvas.click({ button: "right", position: { x: 600, y: 390 } });
    await expect(contextMenu).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(mapExplorer.getByTestId("activity-btn-analyze")).toHaveAttribute("aria-pressed", "true");
    await expect(mapExplorer.getByTestId("map-right-dock-measure-body")).toBeVisible();

    await mapCanvas.click({ button: "right", position: { x: 640, y: 420 } });
    await expect(contextMenu).toBeVisible();
    await contextMenu.getByRole("menuitem", { name: /Draw polygon here/i }).click();
    await expect(mapExplorer.getByTestId("map-active-tool-indicator")).toContainText("Draw polygon");
    await expect(mapExplorer.getByTestId("map-canvas-draw-aoi")).toHaveAttribute("aria-pressed", "true");
  });

  test("imports, exports, and re-imports GeoJSON through the visible UI", async ({ page }) => {
    const { raw, payload } = createGeoJsonFixture();

    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const mapExplorer = await openMapExplorer(page);

    await triggerDomClick(mapExplorer.getByTestId("activity-btn-data"));
    await expect(mapExplorer.getByTestId("catalog-browse-source")).toBeVisible();
    await triggerDomClick(mapExplorer.getByTestId("catalog-browse-source"));
    const importHub = page.getByRole("dialog", { name: "Spatial data import hub" });
    await expect(importHub).toContainText("GeoJSON");

    await importLocalMapFileWithPreflight(page, payload);

    await expect(page.getByTestId("toast").filter({ hasText: /Imported study-area \(2 features\)\./i }).first()).toBeVisible();

    await triggerDomClick(mapExplorer.getByTestId("activity-btn-layers"));
    const layerList = mapExplorer.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("study-area");

    await triggerDomClick(mapExplorer.getByTestId("activity-btn-publish"));
    const publishDataExportTab = mapExplorer.getByTestId("map-workbench-sidebar-tab-publish-data-export");
    await expect(publishDataExportTab).toBeVisible();
    await triggerDomClick(publishDataExportTab);
    const publishWorkspace = mapExplorer.getByTestId("map-publish-workspace");
    await expect(publishWorkspace).toContainText("GeoJSON and GeoParquet export");
    await triggerDomClick(publishWorkspace.getByRole("button", { name: "Spatial data export" }));

    const exportDialog = page.getByRole("dialog", { name: "Spatial data export options" });
    await expect(exportDialog).toBeVisible();
    await expect(exportDialog.getByRole("combobox", { name: "Export Target" })).toHaveValue("visible-layers");
    await expect(exportDialog.getByRole("spinbutton", { name: "Coordinate Precision" })).toHaveValue("6");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportDialog.getByRole("button", { name: "Export", exact: true }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.geojson$/i);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const exportedText = await fs.readFile(downloadPath!, "utf8");
    expect(JSON.parse(exportedText)).toEqual(JSON.parse(raw));
    await expect(page.getByTestId("toast").filter({ hasText: /Exported 2 features to .*\.geojson/i }).first()).toBeVisible();

    await triggerDomClick(mapExplorer.getByTestId("activity-btn-data"));
    await expect(mapExplorer.getByTestId("catalog-browse-source")).toBeVisible();
    await triggerDomClick(mapExplorer.getByTestId("catalog-browse-source"));
    await expect(page.getByRole("dialog", { name: "Spatial data import hub" })).toBeVisible();
    await importLocalMapFileWithPreflight(page, {
      name: "study-area-roundtrip.geojson",
      mimeType: "application/geo+json",
      buffer: Buffer.from(exportedText),
    });

    await expect(page.getByTestId("toast").filter({ hasText: /Imported study-area-roundtrip \(2 features\)\./i }).first()).toBeVisible();
    await triggerDomClick(mapExplorer.getByTestId("activity-btn-layers"));
    await expect(layerList).toContainText("study-area-roundtrip");
  });
});
