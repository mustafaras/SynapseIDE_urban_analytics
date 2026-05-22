import { describe, expect, it } from "vitest";
import {
  BUILDING_FOOTPRINT_COUNT,
  buildingFootprints,
  CSV_POINTS_MALFORMED_ROW_COUNT,
  csvPointsRaw,
  externalServiceStub,
  FC_LARGE_DEFAULT_COUNT,
  FC_MISSING_CRS_COUNT,
  FC_POINTS_WGS84_COUNT,
  FC_POLYGONS_PROJECTED_COUNT,
  fcInvalidGeometry,
  fcLarge,
  fcMissingCrs,
  fcPointsWGS84,
  fcPolygonsProjected,
} from "./fixtures/gisFixtures";

describe("gisFixtures — shared GIS test fixtures load and hold their contract", () => {
  it("fcPointsWGS84 has 25 points with the known schema", () => {
    expect(fcPointsWGS84.features).toHaveLength(FC_POINTS_WGS84_COUNT);
    const first = fcPointsWGS84.features[0]!;
    expect(first.geometry.type).toBe("Point");
    expect(Object.keys(first.properties)).toEqual(["id", "name", "value", "date"]);
    expect(typeof first.properties.value).toBe("number");
  });

  it("fcPolygonsProjected declares a projected CRS (UTM 35N)", () => {
    expect(fcPolygonsProjected.declaredCrs).toBe("EPSG:32635");
    expect(fcPolygonsProjected.featureCollection.features).toHaveLength(FC_POLYGONS_PROJECTED_COUNT);
    expect(fcPolygonsProjected.featureCollection.features[0]!.geometry.type).toBe("Polygon");
  });

  it("fcMissingCrs carries no CRS metadata", () => {
    expect(fcMissingCrs.declaredCrs).toBeNull();
    expect(fcMissingCrs.featureCollection.features).toHaveLength(FC_MISSING_CRS_COUNT);
  });

  it("fcInvalidGeometry includes a self-intersection and a null geometry", () => {
    expect(fcInvalidGeometry.features).toHaveLength(2);
    const nullGeom = fcInvalidGeometry.features.find((feature) => feature.geometry === null);
    expect(nullGeom).toBeDefined();
  });

  it("fcLarge generates the requested number of features deterministically", () => {
    const small = fcLarge(1_000);
    expect(small.features).toHaveLength(1_000);
    // Deterministic: same index -> same coordinate.
    expect(fcLarge(1_000).features[500]!.geometry.coordinates).toEqual(
      small.features[500]!.geometry.coordinates,
    );
    expect(FC_LARGE_DEFAULT_COUNT).toBe(100_000);
  });

  it("csvPointsRaw contains exactly 3 malformed rows", () => {
    const dataRows = csvPointsRaw.split("\n").slice(1); // drop header
    const malformed = dataRows.filter((row) => {
      const [, , lat, lon] = row.split(",");
      return !lat || !lon || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon));
    });
    expect(malformed).toHaveLength(CSV_POINTS_MALFORMED_ROW_COUNT);
  });

  it("externalServiceStub models an offline WMS", () => {
    expect(externalServiceStub.kind).toBe("wms");
    expect(externalServiceStub.dependencyStatus).toBe("offline");
    expect(externalServiceStub.offlineReason).toMatch(/unreachable/i);
  });

  it("buildingFootprints expose height and floors for extrusion", () => {
    expect(buildingFootprints.features).toHaveLength(BUILDING_FOOTPRINT_COUNT);
    for (const feature of buildingFootprints.features) {
      expect(typeof feature.properties.height).toBe("number");
      expect(typeof feature.properties.floors).toBe("number");
    }
  });
});
