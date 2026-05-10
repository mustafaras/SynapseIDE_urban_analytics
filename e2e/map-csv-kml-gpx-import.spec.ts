import { expect, test, type Page } from "@playwright/test";
import { openUrbanAnalyticsWorkbench, resetWorkbenchState, triggerDomClick } from "./helpers/urbanAnalytics";

async function openMapExplorer(page: Page) {
  await page.setViewportSize({ width: 1680, height: 1100 });
  await resetWorkbenchState(page);

  const urbanModal = await openUrbanAnalyticsWorkbench(page);
  await triggerDomClick(urbanModal.getByRole("button", { name: "Open Map Explorer (Ctrl+Shift+M)" }));

  const mapExplorer = page.getByRole("dialog", { name: "Map Explorer" }).first();
  await expect(mapExplorer).toBeVisible();
  await triggerDomClick(page.getByRole("button", { name: /Explore Layers|Switch map workspace to explore/i }).first());
  return mapExplorer;
}

async function importLocalFile(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  await triggerDomClick(page.getByRole("button", {
    name: /Import GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, and GPX files|Open spatial data import options/i,
  }));
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
    await mappingDialog.getByRole("button", { name: "Import", exact: true }).click();

    await expect(page.getByTestId("toast").filter({
      hasText: /Imported 3 of 5 points \(2 rows skipped due to invalid coordinates\)\./i,
    }).first()).toBeVisible();

    const layerList = page.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("parks");
    await expect(layerList).toContainText("CSV");
  });

  test("imports Google Earth style KML placemarks into the layer panel", async ({ page }) => {
    await openMapExplorer(page);

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <name>Field Survey</name>
      <Placemark>
        <name>Observation Point</name>
        <description>Primary survey node</description>
        <Point><coordinates>28.9784,41.0082,12</coordinates></Point>
      </Placemark>
      <Placemark>
        <name>Survey Route</name>
        <description>Walking trace</description>
        <LineString>
          <coordinates>28.9784,41.0082,12 28.9900,41.0100,15 29.0000,41.0200,18</coordinates>
        </LineString>
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
    </Folder>
  </Document>
</kml>`;

    await importLocalFile(page, {
      name: "field-survey.kml",
      mimeType: "application/vnd.google-earth.kml+xml",
      buffer: Buffer.from(kml),
    });

    await expect(page.getByTestId("toast").filter({
      hasText: /Imported field-survey \(3 features\)\./i,
    }).first()).toBeVisible();

    const layerList = page.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("field-survey");
    await expect(layerList).toContainText("KML");
  });

  test("imports GPX waypoints, routes, and tracks with elevation metadata", async ({ page }) => {
    await openMapExplorer(page);

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

    const layerList = page.getByRole("list", { name: "Layer list" });
    await expect(layerList).toContainText("morning-track");
    await expect(layerList).toContainText("GPX");
  });
});
