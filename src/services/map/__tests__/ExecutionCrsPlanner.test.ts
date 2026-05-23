import { describe, expect, it } from "vitest";
import {
  fcMissingCrs,
  fcPointsWGS84,
  fcPolygonsProjected,
} from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";
import {
  extentFromAoi,
  planExecutionCrs,
} from "../crs/ExecutionCrsPlanner";
import {
  isProjected,
  localUtmFor,
  project,
} from "../crs/MapProjectionService";

describe("ExecutionCrsPlanner", () => {
  it("selects Istanbul UTM 35N for WGS84 planar metric work", () => {
    const plan = planExecutionCrs({
      sourceCrs: "EPSG:4326",
      aoi: fcPointsWGS84,
      executionKind: "planar",
    });

    expect(localUtmFor(29, 41)).toBe("EPSG:32635");
    expect(plan).toMatchObject({
      sourceCrs: "EPSG:4326",
      displayCrs: "EPSG:4326",
      executionCrs: "EPSG:32635",
      executionKind: "planar",
    });
    expect(isProjected(plan.executionCrs)).toBe(true);
    expect(plan.planningExtent).toEqual(extentFromAoi(fcPointsWGS84));
  });

  it("does not fabricate an execution CRS for missing source metadata", () => {
    const plan = planExecutionCrs({
      sourceCrs: fcMissingCrs.declaredCrs,
      aoi: fcMissingCrs.featureCollection,
      executionKind: "planar",
    });

    expect(plan.sourceCrs).toBeNull();
    expect(plan.executionCrs).toBeNull();
    expect(plan.executionKind).toBe("planar");
  });

  it("keeps projected source CRS as the planar execution CRS", () => {
    const plan = planExecutionCrs({
      sourceCrs: fcPolygonsProjected.declaredCrs,
      aoi: fcPolygonsProjected.featureCollection,
      executionKind: "planar",
    });

    expect(plan.executionCrs).toBe("EPSG:32635");
    expect(isProjected(plan.executionCrs)).toBe(true);
  });

  it("projects coordinates through the selected execution CRS", () => {
    const executionCrs = planExecutionCrs({
      sourceCrs: "EPSG:4326",
      aoi: fcPointsWGS84,
      executionKind: "planar",
    }).executionCrs;

    expect(executionCrs).toBe("EPSG:32635");
    const projected = project([29, 41], "EPSG:4326", executionCrs!);
    expect(Number.isFinite(projected[0])).toBe(true);
    expect(Number.isFinite(projected[1])).toBe(true);
    expect(projected[0]).toBeGreaterThan(500_000);
    expect(projected[1]).toBeGreaterThan(4_000_000);
  });
});