// @vitest-environment jsdom

import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import {
  buildFeatureCollectionMetadata,
  completeCsvImport,
  createCsvImportSession,
  detectImportFileType,
  getFeatureCollectionBounds,
  importGeoJSONFile,
  MapDataImportError,
  normalizeGeoJSONInput,
  parseGeoJSONText,
  parseGPXText,
  parseKMLText,
  parseKMZArrayBuffer,
  validateFeatureCollection,
} from "../MapDataImporter";
import {
  exportDrawingsToFeatureCollection,
  exportMapData,
  exportPinsToFeatureCollection,
  exportVisibleLayersToFeatureCollection,
  serializeFeatureCollection,
} from "../MapDataExporter";

describe("MapDataImporter", () => {
  it("wraps bare geometry in a FeatureCollection", () => {
    const collection = normalizeGeoJSONInput({
      type: "Point",
      coordinates: [29, 41],
    });
    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry?.type).toBe("Point");
  });

  it("wraps a single Feature in a FeatureCollection", () => {
    const collection = normalizeGeoJSONInput({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [2.35, 48.85],
      },
      properties: { name: "Paris" },
    });
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].properties).toEqual({ name: "Paris" });
  });

  it("rejects an unclosed polygon ring with a specific error", () => {
    const polygon = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
              ],
            ],
          },
          properties: {},
        },
      ],
    };

    expect(() => parseGeoJSONText(JSON.stringify(polygon))).toThrow(MapDataImportError);
    expect(() => parseGeoJSONText(JSON.stringify(polygon))).toThrow(/not closed/i);
  });

  it("rejects a self-intersecting polygon", () => {
    const bowtie = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [2, 2],
                [0, 2],
                [2, 0],
                [0, 0],
              ],
            ],
          },
          properties: {},
        },
      ],
    };

    expect(() => parseGeoJSONText(JSON.stringify(bowtie))).toThrow(/self-intersections/i);
  });

  it("builds metadata and bounds from a valid FeatureCollection", () => {
    const collection = parseGeoJSONText(JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [29.1, 41.1] },
          properties: { name: "A", population: 10 },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [29.2, 41.2] },
          properties: { name: "B", category: "test" },
        },
      ],
    }));

    const metadata = buildFeatureCollectionMetadata(collection);
    expect(metadata.featureCount).toBe(2);
    expect(metadata.geometryType).toBe("Point");
    expect(metadata.bounds).toEqual([29.1, 41.1, 29.2, 41.2]);
    expect(metadata.fields).toEqual(["category", "name", "population"]);
    expect(metadata.geometrySummary).toMatchObject({
      geometryType: "Point",
      geometryTypes: ["Point"],
      featureCount: 2,
      source: "feature-collection",
    });
    expect(metadata.schemaSummary).toMatchObject({
      fieldCount: 3,
      source: "feature-collection",
    });
  });

  it("returns undefined bounds for an empty collection", () => {
    const collection: FeatureCollection = { type: "FeatureCollection", features: [] };
    expect(getFeatureCollectionBounds(collection)).toBeUndefined();
    expect(() => validateFeatureCollection(collection)).not.toThrow();
  });

  it("creates CSV point features and reports skipped invalid rows", () => {
    const session = createCsvImportSession(
      "Name,Latitude,Longitude,Category\nPark A,41.015,28.979,green\nPark B,,29.001,green\nPark C,41.022,invalid,green",
      "parks.csv",
    );

    expect(session.suggestedLatitudeColumn).toBe("Latitude");
    expect(session.suggestedLongitudeColumn).toBe("Longitude");
    expect(session.previewRows).toHaveLength(3);

    const result = completeCsvImport(session, {
      latitudeColumn: "Latitude",
      longitudeColumn: "Longitude",
    });

    expect(result.featureCollection.features).toHaveLength(1);
    expect(result.summary).toMatchObject({
      sourceType: "csv",
      importedFeatureCount: 1,
      totalRecords: 3,
      skippedRecordCount: 2,
    });
    expect(result.featureCollection.features[0].properties).toEqual({
      Name: "Park A",
      Category: "green",
    });
    expect(result.layer.metadata?.importSource).toMatchObject({
      format: "csv",
      fileName: "parks.csv",
      importedFeatureCount: 1,
      totalRecords: 3,
      skippedRecordCount: 2,
      workerTransferStatus: "not-required",
    });
    expect(result.layer.metadata?.crsSummary).toMatchObject({ status: "unknown", source: "import-source" });
    expect(result.layer.metadata?.licenseAttribution).toMatchObject({ license: null, attribution: null, source: "import-source" });
    expect(result.layer.metadata?.scientificQA?.status).toBe("warning");
    expect(result.layer.metadata?.scientificQA?.issueIds).toEqual(expect.arrayContaining([
      expect.stringContaining("import-crs-unknown"),
      expect.stringContaining("import-license-unknown"),
      expect.stringContaining("import-skipped-records"),
    ]));
    expect(result.layer.metadata?.evidenceArtifactId).toBe(`map-evidence-layer-${result.layer.id}`);
    expect(result.layer.metadata?.registry?.evidenceArtifactId).toBe(`map-evidence-layer-${result.layer.id}`);
  });

  it("marks local GeoJSON imports as evidence candidates without inferring CRS certainty", async () => {
    const file = new File([JSON.stringify({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [[[28.9, 41], [29, 41], [29, 41.1], [28.9, 41.1], [28.9, 41]]] },
        properties: { district: "A", score: 0.72 },
      }],
    })], "districts.geojson", { type: "application/geo+json" });

    const result = await importGeoJSONFile(file);

    expect(result.layer.sourceKind).toBe("imported");
    expect(result.layer.qaStatus).toBe("warning");
    expect(result.layer.provenance).toMatchObject({
      label: "GEOJSON import",
      sourceName: "districts.geojson",
      method: "Browser spatial file import",
    });
    expect(result.layer.metadata?.importSource).toMatchObject({
      format: "geojson",
      sourceName: "districts.geojson",
      importedFeatureCount: 1,
      sourceConfidence: "derived-from-file",
    });
    expect(result.layer.metadata?.crsSummary).toMatchObject({
      crs: null,
      status: "unknown",
      source: "import-source",
    });
    expect(result.layer.metadata?.schemaSummary?.fieldCount).toBe(2);
    expect(result.layer.metadata?.geometrySummary).toMatchObject({ geometryType: "Polygon", featureCount: 1 });
    expect(result.layer.metadata?.registry?.publicationReadiness.status).toBe("needs-review");
    expect(result.layer.metadata?.registry?.sourceKind).toBe("imported");
  });

  it("detects CSV coordinate columns across common aliases and casing", () => {
    const cases = [
      {
        raw: "name,latitude,longitude\nA,41.01,28.97",
        latitude: "latitude",
        longitude: "longitude",
      },
      {
        raw: "name,LAT,LON\nA,41.01,28.97",
        latitude: "LAT",
        longitude: "LON",
      },
      {
        raw: "name,y,x\nA,41.01,28.97",
        latitude: "y",
        longitude: "x",
      },
      {
        raw: "name,Latitude,Longitude\nA,41.01,28.97",
        latitude: "Latitude",
        longitude: "Longitude",
      },
    ];

    cases.forEach((testCase, index) => {
      const session = createCsvImportSession(testCase.raw, `case-${index}.csv`);
      expect(session.suggestedLatitudeColumn).toBe(testCase.latitude);
      expect(session.suggestedLongitudeColumn).toBe(testCase.longitude);
      expect(session.latitudeCandidates).toContain(testCase.latitude);
      expect(session.longitudeCandidates).toContain(testCase.longitude);
    });
  });

  it("imports a 10,000 row lat/lng CSV as points under the urban-scale budget", () => {
    const rows = ["id,lat,lng,name"];
    for (let index = 0; index < 10_000; index += 1) {
      rows.push(`${index},${41 + index * 0.000001},${29 + index * 0.000001},Sensor ${index}`);
    }

    const startedAt = performance.now();
    const session = createCsvImportSession(rows.join("\n"), "sensors.csv");
    const result = completeCsvImport(session, {
      latitudeColumn: "lat",
      longitudeColumn: "lng",
    });
    const elapsedMs = performance.now() - startedAt;

    expect(result.featureCollection.features).toHaveLength(10_000);
    expect(result.summary).toMatchObject({
      sourceType: "csv",
      importedFeatureCount: 10_000,
      totalRecords: 10_000,
      skippedRecordCount: 0,
    });
    expect(elapsedMs).toBeLessThan(2_000);
  });

  it("detects CSV, KML, KMZ, and GPX files by extension or MIME type", () => {
    expect(detectImportFileType(new File(["a,b\n1,2"], "points.csv", { type: "text/csv" }))).toBe("csv");
    expect(detectImportFileType(new File(["<kml />"], "map.kml", { type: "application/xml" }))).toBe("kml");
    expect(detectImportFileType(new File([new Uint8Array([1])], "map.kmz", { type: "application/vnd.google-earth.kmz" }))).toBe("kmz");
    expect(detectImportFileType(new File(["<gpx />"], "track.gpx", { type: "application/gpx+xml" }))).toBe("gpx");
  });

  it("parses KML placemarks with namespace-aware geometry extraction", () => {
    const collection = parseKMLText(`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Observation Point</name>
      <description>Primary survey node</description>
      <Point>
        <coordinates>28.9784,41.0082,12</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Study Polygon</name>
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
</kml>`);

    expect(collection.features).toHaveLength(2);
    expect(collection.features[0].geometry?.type).toBe("Point");
    expect(collection.features[0].properties).toMatchObject({
      name: "Observation Point",
      description: "Primary survey node",
    });
    expect(collection.features[1].geometry?.type).toBe("Polygon");
  });

  it("parses GPX waypoints, routes, and tracks with elevation metadata", () => {
    const collection = parseGPXText(`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test-suite" xmlns="http://www.topografix.com/GPX/1/1">
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
    <name>Track A</name>
    <desc>Morning walk</desc>
    <trkseg>
      <trkpt lat="41.0120" lon="28.9950"><ele>10</ele><time>2026-04-10T08:01:00Z</time></trkpt>
      <trkpt lat="41.0140" lon="29.0000"><ele>12</ele><time>2026-04-10T08:02:00Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`);

    expect(collection.features).toHaveLength(3);
    expect(collection.features[0].geometry?.type).toBe("Point");
    expect(collection.features[0].properties).toMatchObject({
      name: "Waypoint A",
      desc: "City center",
      ele: 42,
      time: "2026-04-10T08:00:00Z",
    });
    expect(collection.features[1].geometry?.type).toBe("LineString");
    expect(collection.features[1].properties).toMatchObject({
      name: "Route A",
      desc: "Connector",
      ele: [42, 45],
    });
    expect(collection.features[2].properties).toMatchObject({
      name: "Track A",
      desc: "Morning walk",
      ele: [10, 12],
      time: ["2026-04-10T08:01:00Z", "2026-04-10T08:02:00Z"],
    });
  });

  it("parses KMZ archives by extracting the embedded KML document", async () => {
    const archive = new JSZip();
    archive.file(
      "doc.kml",
      `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <name>KMZ Point</name>
    <Point><coordinates>28.9784,41.0082</coordinates></Point>
  </Placemark>
</kml>`,
    );

    const data = await archive.generateAsync({ type: "arraybuffer" });
    const collection = await parseKMZArrayBuffer(data);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].properties).toMatchObject({ name: "KMZ Point" });
    expect(collection.features[0].geometry?.type).toBe("Point");
  });

  it("round-trips an imported GeoJSON file through visible-layer export", async () => {
    const raw = JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [28.9784, 41.0082],
          },
          properties: {
            name: "Observation",
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
    });

    const file = new File([raw], "study-area.geojson", {
      type: "application/geo+json",
    });

    const imported = await importGeoJSONFile(file);
    const exported = await exportMapData({
      target: "visible-layers",
      pins: [],
      drawings: [],
      overlayLayers: [imported.layer],
      options: {
        precision: 6,
        prettyPrint: false,
        includeProperties: true,
      },
    });

    expect(exported.format).toBe("geojson");
    expect(exported.filename.endsWith(".geojson")).toBe(true);
    expect(parseGeoJSONText(exported.json ?? "")).toEqual(parseGeoJSONText(raw));
  });
});

describe("MapDataExporter", () => {
  it("exports pins as Point features", () => {
    const collection = exportPinsToFeatureCollection([
      { id: "pin-1", lng: 29, lat: 41, label: "Istanbul" },
    ]);
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry?.type).toBe("Point");
    expect(collection.features[0].properties).toEqual({ label: "Istanbul" });
  });

  it("exports drawings as GeoJSON features", () => {
    const collection = exportDrawingsToFeatureCollection([
      {
        id: "drawing-1",
        geometry: {
          type: "LineString",
          coordinates: [
            [29, 41],
            [29.1, 41.1],
          ],
        },
        properties: {
          label: "Transect",
          createdAt: "2026-04-10T00:00:00.000Z",
        },
      },
    ]);
    expect(collection.features[0].geometry?.type).toBe("LineString");
    expect(collection.features[0].properties).toMatchObject({ label: "Transect" });
  });

  it("serializes with coordinate precision and optional property stripping", () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [29.123456789, 41.987654321],
          },
          properties: { keep: true },
        },
      ],
    };

    const json = serializeFeatureCollection(collection, {
      precision: 3,
      prettyPrint: false,
      includeProperties: false,
    });
    expect(json).toContain("[29.123,41.988]");
    expect(json).toContain("\"properties\":null");
  });

  it("merges visible inline GeoJSON layers and skips non-GeoJSON layers", async () => {
    const result = await exportVisibleLayersToFeatureCollection([
      {
        id: "geojson-layer",
        name: "Parcels",
        type: "geojson",
        visible: true,
        opacity: 1,
        sourceData: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [1, 2] },
              properties: { name: "A" },
            },
          ],
        },
      },
      {
        id: "raster-layer",
        name: "Raster",
        type: "raster-tile",
        visible: true,
        opacity: 1,
        sourceData: "https://example.com/{z}/{x}/{y}.png",
      },
    ]);

    expect(result.collection.features).toHaveLength(1);
    expect(result.skippedLayers).toEqual(["Raster"]);
  });

  it("exports stringified inline GeoJSON layers without treating them as remote URLs", async () => {
    const result = await exportVisibleLayersToFeatureCollection([
      {
        id: "legacy-inline-layer",
        name: "Legacy Inline",
        type: "geojson",
        visible: true,
        opacity: 1,
        sourceData: JSON.stringify({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [29, 41] },
              properties: { name: "Legacy" },
            },
          ],
        }),
      },
    ]);

    expect(result.collection.features).toHaveLength(1);
    expect(result.skippedLayers).toEqual([]);
    expect(result.collection.features[0]?.properties).toMatchObject({ name: "Legacy" });
  });

  it("builds a downloadable GeoJSON export result", async () => {
    const result = await exportMapData({
      target: "visible-layers",
      pins: [],
      drawings: [],
      overlayLayers: [
        {
          id: "geojson-layer",
          name: "Parcels",
          type: "geojson",
          visible: true,
          opacity: 1,
          sourceData: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [1.1234567, 2.7654321] },
                properties: { name: "A" },
              },
            ],
          },
        },
      ],
      options: {
        precision: 6,
        prettyPrint: true,
        includeProperties: true,
      },
    });

    expect(result.filename.endsWith(".geojson")).toBe(true);
    expect(result.format).toBe("geojson");
    expect(result.collection.features).toHaveLength(1);
    expect(result.json).toContain("1.123457");
  });

  it("builds a downloadable GeoParquet export result", async () => {
    const result = await exportMapData({
      target: "visible-layers",
      pins: [],
      drawings: [],
      overlayLayers: [
        {
          id: "geojson-layer",
          name: "Transit Stops",
          type: "geojson",
          visible: true,
          opacity: 1,
          sourceData: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [29.01, 41.02] },
                properties: { name: "Stop A", riders: 1400 },
              },
            ],
          },
        },
      ],
      options: {
        format: "geoparquet",
        includeProperties: true,
      },
    });

    expect(result.format).toBe("geoparquet");
    expect(result.filename.endsWith(".geoparquet")).toBe(true);
    expect(result.bytes?.byteLength ?? 0).toBeGreaterThan(0);
    expect(result.collection.features).toHaveLength(1);
  });
});
