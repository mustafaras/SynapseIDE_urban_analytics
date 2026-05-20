import { expect, test, type Locator } from "@playwright/test";
import { createArrowFixture, createArrowWktFixture, createGeoParquetFixture } from "./helpers/columnarFixtures";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function queueDomClick(locator: Locator): Promise<void> {
  await locator.dispatchEvent("click");
}

test.describe("Map Explorer columnar I/O", () => {
  test("imports Arrow and GeoParquet through the UI and exports GeoParquet", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorerDialogs = page.getByRole("dialog", { name: "Map Explorer" });
    await expect(mapExplorerDialogs).toHaveCount(1);
    const mapExplorer = mapExplorerDialogs.first();
    await expect(mapExplorer).toBeVisible();

    await triggerDomClick(mapExplorer.getByRole("button", {
      name: /Import GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, and GPX files|Open spatial data import options/i,
    }));
    const importHub = page.getByRole("dialog", { name: "Spatial data import hub" });
    await expect(importHub).toContainText("Arrow");
    await expect(importHub).toContainText("GeoParquet");
    await expect(importHub).toContainText("Columnar formats now surface schema previews");

    const [geoParquetChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      importHub.getByRole("button", { name: "Browse Local File" }).click(),
    ]);
    await geoParquetChooser.setFiles(createGeoParquetFixture());

    const geoParquetPreview = page.getByRole("dialog", { name: "GeoParquet schema preview" });
    await expect(geoParquetPreview).toBeVisible();
    await expect(geoParquetPreview).toContainText("2 / 2");
    await expect(geoParquetPreview).toContainText("Arrow IPC worker transfer");
    await expect(geoParquetPreview).toContainText("BBox:");
    await queueDomClick(geoParquetPreview.getByRole("button", { name: "Import Dataset" }));

    await expect(page.getByText(/Imported 2 spatial rows from urban-observations/i)).toBeVisible();
    await triggerDomClick(mapExplorer.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());
    const layerList = mapExplorer.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("urban-observations");
    await expect(layerList).toContainText("GeoParquet");

    await page.locator('input[type="file"][accept*=".geojson"]').setInputFiles(createArrowFixture());

    const arrowPreview = page.getByRole("dialog", { name: "Arrow schema preview" });
    await expect(arrowPreview).toBeVisible();
    await expect(arrowPreview).toContainText("3 / 3");
    await expect(arrowPreview).toContainText("longitude / latitude");
    await expect(arrowPreview).toContainText("Historic Core");
    await queueDomClick(arrowPreview.getByRole("button", { name: "Import Dataset" }));

    await expect(layerList).toContainText("urban-sensors");
    await expect(layerList).toContainText("Arrow");

    await page.evaluate(() => {
      const testWindow = window as Window & {
        __downloadProbeInstalled?: boolean;
        __lastDownloadMeta?: Record<string, unknown> | null;
      };

      if (!testWindow.__downloadProbeInstalled) {
        testWindow.__downloadProbeInstalled = true;

        const originalCreateObjectURL = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (blob) => {
          const objectUrl = originalCreateObjectURL(blob);
          testWindow.__lastDownloadMeta = {
            ...(testWindow.__lastDownloadMeta ?? {}),
            blobSize: blob.size,
            blobType: blob.type,
            objectUrl,
          };
          return objectUrl;
        };

        const originalAnchorClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function patchedAnchorClick(this: HTMLAnchorElement) {
          testWindow.__lastDownloadMeta = {
            ...(testWindow.__lastDownloadMeta ?? {}),
            download: this.download,
            href: this.href,
          };
          return originalAnchorClick.call(this);
        };
      }

      testWindow.__lastDownloadMeta = null;
    });

    await triggerDomClick(mapExplorer.getByRole("button", { name: "Save, load, and export map outputs" }));
    await triggerDomClick(page.getByRole("menu", { name: "Export commands" }).getByRole("menuitem", {
      name: "GeoJSON",
    }));
    const exportDialog = page.getByRole("dialog", { name: "Spatial data export options" });
    const exportFormat = exportDialog.getByRole("combobox", { name: "Export Format" });
    await exportFormat.selectOption({ label: "GeoParquet" });

    await expect(exportDialog.getByRole("spinbutton", { name: "Coordinate Precision" })).toBeDisabled();
    await expect(exportDialog).toContainText("GeoParquet preserves binary columnar geometry");
    await triggerDomClick(exportDialog.getByRole("button", { name: "Export", exact: true }));

    await page.waitForFunction(() => {
      const testWindow = window as Window & {
        __lastDownloadMeta?: { download?: string } | null;
      };
      return Boolean(testWindow.__lastDownloadMeta?.download);
    });

    const downloadMeta = await page.evaluate(() => {
      const testWindow = window as Window & {
        __lastDownloadMeta?: Record<string, unknown> | null;
      };
      return testWindow.__lastDownloadMeta;
    });

    expect(downloadMeta).toMatchObject({
      blobType: "application/vnd.apache.parquet",
    });
    expect(String(downloadMeta?.download ?? "")).toMatch(/\.geoparquet$/i);
    expect(Number(downloadMeta?.blobSize ?? 0)).toBeGreaterThan(0);
    await expect(page.getByText(/Exported \d+ features to .*\.geoparquet/i)).toBeVisible();

    const hmrDiagnostics = [...consoleErrors, ...pageErrors].filter((message) =>
      message.includes("127.0.0.1:3000") ||
      message.includes("failed to connect to websocket") ||
      message.includes("WebSocket closed without opened"),
    );
    expect(hmrDiagnostics).toEqual([]);
  });

  test("imports a WKT Arrow dataset variant and surfaces skipped-row diagnostics", async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 1100 });
    await resetWorkbenchState(page);

    const urbanModal = await openUrbanAnalyticsWorkbench(page);
    await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

    const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
    await expect(mapExplorer).toBeVisible();

    await triggerDomClick(mapExplorer.getByRole("button", {
      name: /Import GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, and GPX files|Open spatial data import options/i,
    }));
    const importHub = page.getByRole("dialog", { name: "Spatial data import hub" });

    const [arrowChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      importHub.getByRole("button", { name: "Browse Local File" }).click(),
    ]);
    await arrowChooser.setFiles(createArrowWktFixture());

    const arrowPreview = page.getByRole("dialog", { name: "Arrow schema preview" });
    await expect(arrowPreview).toBeVisible();
    await expect(arrowPreview).toContainText("2 / 3");
    await expect(arrowPreview).toContainText("geometry");
    await expect(arrowPreview).toContainText("Wkt");
    await expect(arrowPreview).toContainText("Validation Notes");
    await expect(arrowPreview).toContainText("Unsupported WKT geometry type: INVALID.");
    await queueDomClick(arrowPreview.getByRole("button", { name: "Import Dataset" }));

    await triggerDomClick(mapExplorer.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());
    const layerList = mapExplorer.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("urban-zones");
    await expect(layerList).toContainText("Arrow");
  });
});
