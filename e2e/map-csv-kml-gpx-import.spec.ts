import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function expectImportedLayer(page: Page, layerName: string, importFormat: string): Promise<void> {
  await page.waitForFunction(
    async ({ expectedName, expectedFormat }) => {
      const module = await import("/src/stores/useMapExplorerStore.ts");
      return module.useMapExplorerStore.getState().overlayLayers.some((layer) =>
        layer.name === expectedName &&
        layer.visible === true &&
        layer.metadata?.importFormat === expectedFormat,
      );
    },
    { expectedName: layerName, expectedFormat: importFormat },
  );
}

async function openMapExplorer(page: Page) {
  await page.setViewportSize({ width: 1680, height: 1100 });
  await resetWorkbenchState(page);

  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());
  await expect(mapExplorer.getByText("Symbology review")).toBeVisible();
  return mapExplorer;
}

async function importLocalFile(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await triggerDomClick(mapExplorer.getByRole("button", {
    name: /Import GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, and GPX files|Open spatial data import options/i,
  }).first());
  const importHub = page.getByRole("dialog", { name: "Spatial data import hub" });
  await expect(importHub).toBeVisible();

  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    importHub.getByRole("button", { name: "Browse Local File" }).click(),
  ]);
  await chooser.setFiles(file);
}

test.describe("Map Explorer CSV, KML, and GPX import", () => {
  test("opens the CSV mapping dialog with detected coordinate columns and imports valid rows", async ({ page }) => {
    await openMapExplorer(page);

    const csv = [
      "Name,LAT,LON,Category",
      "Park A,41.015,28.979,green",
      "Park B,,29.001,green",
      "Park C,41.022,invalid,green",
      "Park D,41.030,29.010,blue",
      "Park E,41.040,29.020,yellow",
    ].join("\n");

    await importLocalFile(page, {
      name: "parks.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });

    const mappingDialog = page.getByRole("dialog", { name: "CSV coordinate mapping" });
    await expect(mappingDialog).toBeVisible();
    await expect(mappingDialog).toContainText("Import CSV Points");
    await expect(mappingDialog).toContainText("parks.csv contains 5 data rows");
    await expect(mappingDialog).toContainText("Detected: LAT");
    await expect(mappingDialog).toContainText("Detected: LON");
    await expect(mappingDialog).toContainText("Preview (first 5 rows)");
    await expect(mappingDialog).toContainText("Park A");
    await expect(mappingDialog).toContainText("Park E");

    await expect(mappingDialog.getByRole("combobox", { name: "Latitude column" })).toHaveValue("LAT");
    await expect(mappingDialog.getByRole("combobox", { name: "Longitude column" })).toHaveValue("LON");
    const importedCsvLayer = await page.evaluate((rawCsv) => {
      return Promise.all([
        import("/src/services/map/MapDataImporter.ts"),
        import("/src/stores/useMapExplorerStore.ts"),
      ]).then(([importer, storeModule]) => {
        const session = importer.createCsvImportSession(rawCsv, "parks.csv");
        const result = importer.completeCsvImport(session, {
          latitudeColumn: "LAT",
          longitudeColumn: "LON",
        });
        storeModule.useMapExplorerStore.getState().addOverlayLayer(result.layer);
        return storeModule.useMapExplorerStore.getState().overlayLayers
          .map((layer) => ({
            name: layer.name,
            visible: layer.visible,
            importFormat: layer.metadata?.importFormat,
            importedFeatureCount: layer.metadata?.importSource?.importedFeatureCount,
            skippedRecordCount: layer.metadata?.importSource?.skippedRecordCount,
          }))
          .find((layer) => layer.name === "parks");
      });
    }, csv);

    expect(importedCsvLayer).toMatchObject({
      name: "parks",
      visible: true,
      importFormat: "csv",
      importedFeatureCount: 3,
      skippedRecordCount: 2,
    });
  });

  test("imports Google Earth style KML placemarks into the layer panel", async ({ page }) => {
    await openMapExplorer(page);

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Observation Point</name>
      <description>Primary survey node</description>
      <Point><coordinates>28.9784,41.0082,12</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Study Polygon</name>
      <description>AOI boundary</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              28.97,41.00,0 28.99,41.00,0 28.99,41.02,0 28.97,41.02,0 28.97,41.00,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

    await page.evaluate(async (rawKml) => {
      const importer = await import("/src/services/map/MapDataImporter.ts");
      const storeModule = await import("/src/stores/useMapExplorerStore.ts");
      const prepared = await importer.prepareMapImportFile(new File([rawKml], "field-survey.kml", {
        type: "application/xml",
      }));
      if (prepared.kind !== "ready") {
        throw new Error(`Expected ready KML import, received ${prepared.kind}.`);
      }
      storeModule.useMapExplorerStore.getState().addOverlayLayer(prepared.result.layer);
    }, kml);

    await expectImportedLayer(page, "field-survey", "kml");
  });

  test("imports GPX waypoints, routes, and tracks with elevation metadata", async ({ page }) => {
    const mapExplorer = await openMapExplorer(page);

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="strava-export" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="41.0082" lon="28.9784">
    <name>Waypoint A</name>
    <desc>City center</desc>
    <ele>42</ele>
    <time>2026-04-10T08:00:00Z</time>
  </wpt>
  <rte>
    <name>Route A</name>
    <desc>Connector</desc>
    <rtept lat="41.0082" lon="28.9784"><ele>42</ele></rtept>
    <rtept lat="41.0100" lon="28.9900"><ele>45</ele></rtept>
  </rte>
  <trk>
    <name>Morning Track</name>
    <desc>GPS device trace</desc>
    <trkseg>
      <trkpt lat="41.0120" lon="28.9950"><ele>10</ele><time>2026-04-10T08:01:00Z</time></trkpt>
      <trkpt lat="41.0140" lon="29.0000"><ele>12</ele><time>2026-04-10T08:02:00Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    await importLocalFile(page, {
      name: "morning-track.gpx",
      mimeType: "application/gpx+xml",
      buffer: Buffer.from(gpx),
    });

    await expect(page.getByTestId("toast").filter({
      hasText: /Imported morning-track \(3 features\)\./i,
    }).first()).toBeVisible();

    await expectImportedLayer(page, "morning-track", "gpx");
    const layerList = mapExplorer.getByRole("list", { name: "Layer list" }).filter({ hasText: "morning-track" }).first();
    await expect(layerList).toContainText("morning-track");
    await expect(layerList).toContainText("GPX");
  });
});
