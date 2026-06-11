// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  buildShapefileLayerFromFc,
  extractGeoPackageLayerCrsSummary,
  type GeoPackageLayerInfo,
  parsePrjText,
  profileSource,
} from "@/services/map/MapDataImporter";
import type { FeatureCollection } from "geojson";

// Minimal valid FeatureCollection for testing
const minimalFc: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { name: "test" },
    },
  ],
};

describe("parsePrjText", () => {
  it("extracts EPSG code when AUTHORITY block is present", () => {
    const prj = `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433],AUTHORITY["EPSG","4326"]]`;
    expect(parsePrjText(prj)).toBe("EPSG:4326");
  });

  it("returns null when AUTHORITY block is absent", () => {
    const prj = `GEOGCS["Unknown",DATUM["Unknown",SPHEROID["Unknown",6378137.0,298.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`;
    expect(parsePrjText(prj)).toBe(null);
  });

  it("handles whitespace inside AUTHORITY block", () => {
    const prj = `PROJCS["NAD83",GEOGCS["GCS_NAD83"],AUTHORITY["EPSG" , "26917"]]`;
    expect(parsePrjText(prj)).toBe("EPSG:26917");
  });
});

describe("buildShapefileLayerFromFc", () => {
  it("produces crsSummary.status 'known' when EPSG code is provided", () => {
    const result = buildShapefileLayerFromFc("test.shp", minimalFc, "EPSG:4326");
    expect(result.layer.metadata?.crsSummary?.status).toBe("known");
    expect(result.layer.metadata?.crsSummary?.crs).toBe("EPSG:4326");
  });

  it("produces crsSummary.status 'missing' when no EPSG code is provided", () => {
    const result = buildShapefileLayerFromFc("test.shp", minimalFc, null);
    expect(result.layer.metadata?.crsSummary?.status).toBe("missing");
    expect(result.layer.metadata?.crsSummary?.crs).toBe(null);
  });

  it("sets importFormat to 'shapefile' in metadata", () => {
    const result = buildShapefileLayerFromFc("roads.shp", minimalFc, "EPSG:4326");
    expect(result.layer.metadata?.importSource?.format).toBe("shapefile");
  });
});

describe("GeoPackageLayerInfo shape", () => {
  it("validates that GeoPackageLayerInfo has the expected fields", () => {
    const info: GeoPackageLayerInfo = {
      tableName: "buildings",
      featureCount: 1200,
      geometryType: "Polygon",
      crsSummary: {
        crs: "EPSG:32635",
        status: "known",
        source: "import-source",
        notes: [],
      },
    };
    expect(info.tableName).toBe("buildings");
    expect(info.featureCount).toBe(1200);
    expect(info.geometryType).toBe("Polygon");
    expect(info.crsSummary.crs).toBe("EPSG:32635");
  });

  it("allows null featureCount and geometryType", () => {
    const info: GeoPackageLayerInfo = {
      tableName: "unknown_layer",
      featureCount: null,
      geometryType: null,
      crsSummary: {
        crs: null,
        status: "missing",
        source: "import-source",
        notes: ["missing"],
      },
    };
    expect(info.featureCount).toBeNull();
    expect(info.geometryType).toBeNull();
    expect(info.crsSummary.status).toBe("missing");
  });

  it("extracts embedded CRS candidates from GeoPackage layer metadata", () => {
    const crs = extractGeoPackageLayerCrsSummary({
      name: "parcels",
      metadata: {
        srs_id: 32635,
      },
    });
    expect(crs.status).toBe("known");
    expect(crs.crs).toBe("EPSG:32635");
  });

  it("does not assume EPSG:4326 when GeoPackage CRS metadata is absent", () => {
    const crs = extractGeoPackageLayerCrsSummary({
      name: "parcels",
      data: minimalFc.features,
    });
    expect(crs.status).toBe("missing");
    expect(crs.crs).toBeNull();
  });
});

describe("profileSource support status for shapefile and geopackage", () => {
  // file-metadata profiles are always metadata-only preflight (canCommit: false),
  // but the supportStatus should reflect the format's full capability.
  it("returns supportStatus='supported' for shapefile format", () => {
    const profile = profileSource({
      kind: "file-metadata",
      sourceName: "test.shp",
      format: "shapefile",
      sizeBytes: 1000,
    });
    expect(profile.supportStatus).toBe("supported");
  });

  it("returns supportStatus='supported' for geopackage format", () => {
    const profile = profileSource({
      kind: "file-metadata",
      sourceName: "test.gpkg",
      format: "geopackage",
      sizeBytes: 4096,
    });
    expect(profile.supportStatus).toBe("supported");
  });

  it("returns supportStatus='supported' for a feature-collection profile of shapefile origin", () => {
    const result = buildShapefileLayerFromFc("test.shp", minimalFc, "EPSG:4326");
    // When profiled from an already-imported layer, canCommit is true
    const profile = profileSource({
      kind: "imported-layer",
      sourceName: "test.shp",
      result,
    });
    expect(profile.canCommit).toBe(true);
    expect(profile.supportStatus).toBe("supported");
  });
});
