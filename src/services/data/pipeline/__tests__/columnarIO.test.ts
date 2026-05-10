import { describe, expect, it } from "vitest";
import { tableFromArrays, tableToIPC } from "apache-arrow";
import type { FeatureCollection } from "geojson";
import {
  exportFeatureCollectionToGeoParquet,
  prepareColumnarDatasetImport,
} from "../columnarIO";

function createLargePointCollection(count: number): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: Array.from({ length: count }, (_, index) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [28.9 + index * 0.0002, 41 + index * 0.00015],
      },
      properties: {
        station_id: `S-${index + 1}`,
        demand_index: Math.round((Math.sin(index / 12) + 1.3) * 1000),
        corridor: index % 4 === 0 ? "north" : index % 4 === 1 ? "east" : index % 4 === 2 ? "south" : "west",
        active: index % 3 === 0,
      },
    })),
  };
}

describe("columnarIO", () => {
  it("imports Arrow IPC with WKT geometry and builds a schema preview", async () => {
    const buffer = tableToIPC(tableFromArrays({
      geometry: [
        "POINT (28.9784 41.0082)",
        "POINT (29.015 41.042)",
      ],
      district: ["Historic Core", "Waterfront"],
      households: [1200, 980],
    }), "stream");

    const result = await prepareColumnarDatasetImport({
      buffer,
      format: "arrow",
      fileName: "districts.arrow",
    });

    expect(result.geometryEncoding).toBe("wkt");
    expect(result.importedFeatureCount).toBe(2);
    expect(result.featureCollection.features[0].geometry?.type).toBe("Point");
    expect(result.schema.find((field) => field.name === "geometry")?.role).toBe("geometry");
    expect(result.previewRows).toHaveLength(2);
  });

  it("skips invalid WKT rows while preserving valid features and warnings", async () => {
    const buffer = tableToIPC(tableFromArrays({
      geometry: [
        "POINT (28.9784 41.0082)",
        "INVALID (29.015 41.042)",
        "POINT (28.9912 41.0194)",
      ],
      district: ["Historic Core", "Broken Sample", "Innovation Belt"],
    }), "stream");

    const result = await prepareColumnarDatasetImport({
      buffer,
      format: "arrow",
      fileName: "districts-invalid.arrow",
    });

    expect(result.geometryEncoding).toBe("wkt");
    expect(result.rowCount).toBe(3);
    expect(result.importedFeatureCount).toBe(2);
    expect(result.skippedRowCount).toBe(1);
    expect(result.warnings[0]).toContain("Row 2:");
    expect(result.warnings[0]).toContain("Unsupported WKT geometry type: INVALID.");
    expect(result.featureCollection.features).toHaveLength(2);
  });

  it("round-trips GeoParquet geometry, properties, and spatial metadata", async () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [28.9784, 41.0082],
          },
          properties: {
            name: "Observation Node",
            score: 0.92,
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [28.97, 41.0],
              [28.99, 41.02],
            ],
          },
          properties: {
            name: "Connector",
            score: 0.81,
          },
        },
      ],
    };

    const exported = await exportFeatureCollectionToGeoParquet(collection, {
      filename: "mobility-observations",
      crs: "EPSG:4326",
    });
    const imported = await prepareColumnarDatasetImport({
      buffer: exported.bytes,
      format: "geoparquet",
      fileName: "mobility-observations.geoparquet",
    });

    expect(exported.filename.endsWith(".geoparquet")).toBe(true);
    expect(imported.geoParquet?.primaryColumn).toBe("geometry");
    expect(imported.importedFeatureCount).toBe(2);
    expect(imported.featureCollection.features[0].geometry).toEqual(collection.features[0].geometry);
    expect(imported.featureCollection.features[0].properties).toMatchObject({
      name: "Observation Node",
      score: 0.92,
    });
    expect(imported.geoParquet?.geometryTypes).toEqual(["LineString", "Point"]);
  });

  it("produces smaller columnar payloads than GeoJSON for a large synthetic dataset", async () => {
    const collection = createLargePointCollection(5000);
    const geojsonBytes = new TextEncoder().encode(JSON.stringify(collection)).byteLength;
    const geoparquet = await exportFeatureCollectionToGeoParquet(collection, { filename: "benchmark" });
    const arrowBuffer = tableToIPC(tableFromArrays({
      longitude: collection.features.map((feature) => (feature.geometry as GeoJSON.Point).coordinates[0]),
      latitude: collection.features.map((feature) => (feature.geometry as GeoJSON.Point).coordinates[1]),
      station_id: collection.features.map((feature) => String(feature.properties?.station_id ?? "")),
      demand_index: collection.features.map((feature) => Number(feature.properties?.demand_index ?? 0)),
      active: collection.features.map((feature) => Boolean(feature.properties?.active)),
    }), "stream");

    const imported = await prepareColumnarDatasetImport({
      buffer: arrowBuffer,
      format: "arrow",
      fileName: "benchmark.arrow",
    });

    expect(geoparquet.byteLength).toBeLessThan(geojsonBytes);
    expect(arrowBuffer.byteLength).toBeLessThan(geojsonBytes);
    expect(imported.rowCount).toBe(5000);
    expect(imported.estimatedMemoryBytes).toBeGreaterThan(arrowBuffer.byteLength);
  });

  it("computes per-field statistics during import", async () => {
    const buffer = tableToIPC(tableFromArrays({
      geometry: [
        "POINT (28.9784 41.0082)",
        "POINT (29.015 41.042)",
        "POINT (29.05 41.06)",
      ],
      district: ["Historic Core", "Waterfront", "Historic Core"],
      households: [1200, 980, 1500],
      notes: [null, null, "test"],
    }), "stream");

    const result = await prepareColumnarDatasetImport({
      buffer,
      format: "arrow",
      fileName: "stats-test.arrow",
    });

    const districtField = result.schema.find((f) => f.name === "district");
    expect(districtField?.stats).toBeDefined();
    expect(districtField?.stats?.nullCount).toBe(0);
    expect(districtField?.stats?.nullPercent).toBe(0);
    expect(districtField?.stats?.uniqueCount).toBe(2);
    expect(districtField?.stats?.topValues).toBeDefined();
    expect(districtField?.stats?.topValues?.length).toBeGreaterThan(0);

    const householdsField = result.schema.find((f) => f.name === "households");
    expect(householdsField?.stats).toBeDefined();
    expect(householdsField?.stats?.mean).toBeCloseTo(1226.67, 0);
    expect(householdsField?.stats?.stddev).toBeDefined();
    expect(householdsField?.stats?.min).toBeDefined();
    expect(householdsField?.stats?.max).toBeDefined();

    const notesField = result.schema.find((f) => f.name === "notes");
    expect(notesField?.stats?.nullPercent).toBeGreaterThan(0);
  });

  it("computes data quality score and grade", async () => {
    const buffer = tableToIPC(tableFromArrays({
      geometry: [
        "POINT (28.9784 41.0082)",
        "POINT (29.015 41.042)",
      ],
      district: ["Historic Core", "Waterfront"],
      households: [1200, 980],
    }), "stream");

    const result = await prepareColumnarDatasetImport({
      buffer,
      format: "arrow",
      fileName: "quality-test.arrow",
    });

    expect(result.quality).toBeDefined();
    expect(result.quality.score).toBeGreaterThanOrEqual(0);
    expect(result.quality.score).toBeLessThanOrEqual(100);
    expect(["excellent", "good", "fair", "poor"]).toContain(result.quality.grade);
    expect(result.quality.completeness).toBeGreaterThan(0);
    expect(result.quality.validity).toBe(1);
    expect(result.quality.attributeFieldCount).toBeGreaterThan(0);
    expect(result.quality.geometryFieldCount).toBeGreaterThan(0);
    expect(Array.isArray(result.quality.sparseFields)).toBe(true);
    expect(Array.isArray(result.quality.constantFields)).toBe(true);
  });

  it("computes size comparison between columnar and GeoJSON", async () => {
    const collection = createLargePointCollection(500);
    const exported = await exportFeatureCollectionToGeoParquet(collection, { filename: "size-cmp" });
    const imported = await prepareColumnarDatasetImport({
      buffer: exported.bytes,
      format: "geoparquet",
      fileName: "size-cmp.geoparquet",
    });

    expect(imported.sizeComparison).toBeDefined();
    expect(imported.sizeComparison.columnarBytes).toBeGreaterThan(0);
    expect(imported.sizeComparison.estimatedGeoJsonBytes).toBeGreaterThan(0);
    expect(imported.sizeComparison.compressionRatio).toBeGreaterThan(0);
    expect(imported.sizeComparison.savingsPercent).toBeGreaterThanOrEqual(0);
    expect(imported.sizeComparison.savingsPercent).toBeLessThanOrEqual(100);
  });

  it("flags sparse fields with >50% null values", async () => {
    const buffer = tableToIPC(tableFromArrays({
      geometry: [
        "POINT (28.97 41.00)",
        "POINT (29.01 41.04)",
        "POINT (29.05 41.06)",
        "POINT (29.09 41.08)",
      ],
      name: ["A", null, null, null],
      value: [100, 200, 300, 400],
    }), "stream");

    const result = await prepareColumnarDatasetImport({
      buffer,
      format: "arrow",
      fileName: "sparse-test.arrow",
    });

    expect(result.quality.sparseFields).toContain("name");
    expect(result.quality.sparseFields).not.toContain("value");
  });

  it("flags constant fields with single unique value", async () => {
    const buffer = tableToIPC(tableFromArrays({
      geometry: [
        "POINT (28.97 41.00)",
        "POINT (29.01 41.04)",
        "POINT (29.05 41.06)",
      ],
      status: ["active", "active", "active"],
      category: ["A", "B", "C"],
    }), "stream");

    const result = await prepareColumnarDatasetImport({
      buffer,
      format: "arrow",
      fileName: "constant-test.arrow",
    });

    expect(result.quality.constantFields).toContain("status");
    expect(result.quality.constantFields).not.toContain("category");
  });
});