import { describe, expect, it } from "vitest";
import {
  fcMissingCrs,
  fcPointsWGS84,
  fcPolygonsProjected,
} from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import { preflight } from "../crs/CrsPreflight";

describe("CrsPreflight", () => {
  it("blocks planar metric operations on EPSG:4326 with a reproject remedy", () => {
    const result = preflight(
      {
        id: "buffer",
        label: "Buffer",
        metric: "buffer",
        executionKind: "planar",
      },
      [{ id: "points", name: "WGS84 points", crs: "EPSG:4326" }],
      fcPointsWGS84,
    );

    expect(result.blocked).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.sourceCrs).toBe("EPSG:4326");
    expect(result.executionCrs).toBe("EPSG:32635");
    expect(result.executionKind).toBe("planar");
    expect(result.remedy).toBe("reproject");
    expect(result.reason).toContain("geographic CRS EPSG:4326");
  });

  it("allows planar metric operations on a projected CRS", () => {
    const result = preflight(
      {
        id: "area",
        label: "Area",
        metric: "area",
        executionKind: "planar",
      },
      [{ id: "polygons", name: "Projected polygons", crs: fcPolygonsProjected.declaredCrs }],
      fcPolygonsProjected.featureCollection,
    );

    expect(result).toMatchObject({
      ok: true,
      blocked: false,
      sourceCrs: "EPSG:32635",
      executionCrs: "EPSG:32635",
      executionKind: "planar",
      caveats: [],
    });
  });

  it("blocks unknown CRS metric operations with a declare-CRS remedy", () => {
    const result = preflight(
      {
        id: "difference",
        label: "Difference",
        metric: "difference",
        executionKind: "planar",
      },
      [{ id: "missing", name: "Missing CRS polygons", crs: fcMissingCrs.declaredCrs }],
      fcMissingCrs.featureCollection,
    );

    expect(result.blocked).toBe(true);
    expect(result.sourceCrs).toBeNull();
    expect(result.executionCrs).toBeNull();
    expect(result.remedy).toBe("declare-crs");
    expect(result.reason).toContain("lack CRS metadata");
  });

  it("allows geodesic WGS84 display measurement with an explicit caveat", () => {
    const result = preflight(
      {
        id: "measure-distance",
        label: "Distance measurement",
        metric: "distance",
        executionKind: "geodesic",
      },
      [{ id: "points", name: "WGS84 points", crs: "EPSG:4326" }],
      fcPointsWGS84,
    );

    expect(result.ok).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.executionKind).toBe("geodesic");
    expect(result.executionCrs).toBeNull();
    expect(result.caveats.join(" ")).toContain("geodesic WGS84 map-display positions");
  });

  it("enforces an Urban requiredCrs conflict", () => {
    const result = preflight(
      {
        id: "urban-method",
        label: "Urban method",
        metric: "method",
        executionKind: "planar",
        requiredCrs: "EPSG:3857",
      },
      [{ id: "polygons", name: "Projected polygons", crs: fcPolygonsProjected.declaredCrs }],
      fcPolygonsProjected.featureCollection,
    );

    expect(result.blocked).toBe(true);
    expect(result.remedy).toBe("reproject");
    expect(result.reason).toContain("requires EPSG:3857");
  });
});
