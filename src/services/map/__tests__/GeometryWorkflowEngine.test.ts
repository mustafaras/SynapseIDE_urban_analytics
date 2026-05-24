import { describe, expect, it } from "vitest";
import {
  GeometryWorkflowError,
  computeGeometryWorkflow,
  type GeometryWorkflowProgress,
  type GeometryWorkflowRequest,
} from "../geometry/GeometryWorkflowEngine";
import { fcPolygonsProjected } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";

const EXECUTION_CRS = "EPSG:32635";

function polygonSource() {
  return structuredClone(fcPolygonsProjected.featureCollection);
}

describe("GeometryWorkflowEngine.computeGeometryWorkflow", () => {
  it("buffers a source off the main thread, reporting progress and a manifest-ready computation", async () => {
    const progress: GeometryWorkflowProgress[] = [];
    const request: GeometryWorkflowRequest = {
      op: "buffer",
      sources: [polygonSource()],
      params: { op: "buffer", meters: 250, segments: 16, dissolve: false, sourceLayerId: "parcels" },
      executionCrs: EXECUTION_CRS,
      sourceLayerIds: ["parcels"],
      preferGeos: true,
    };

    const result = await computeGeometryWorkflow(request, (p) => progress.push(p));

    expect(result.op).toBe("buffer");
    expect(result.featureCount).toBe(fcPolygonsProjected.featureCollection.features.length);
    expect(result.geometryClass).toBe("polygon");
    expect(result.backend).toBe("turf");
    expect(result.metrics.buffer_meters).toBe(250);
    expect(result.inputFeatureCount).toBe(fcPolygonsProjected.featureCollection.features.length);
    // Progress is reported and terminates at 100%.
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]?.percent).toBe(100);
  });

  it("echoes the execution CRS so the output CRS equals the execution CRS", async () => {
    const result = await computeGeometryWorkflow({
      op: "buffer",
      sources: [polygonSource()],
      params: { op: "buffer", meters: 100, segments: 8, dissolve: true, sourceLayerId: "parcels" },
      executionCrs: EXECUTION_CRS,
      sourceLayerIds: ["parcels"],
    });
    expect(result.executionCrs).toBe(EXECUTION_CRS);
    expect(result.metrics.geometry_backend).toBe("turf");
  });

  it("unions two polygon sources into a combined collection", async () => {
    const result = await computeGeometryWorkflow({
      op: "union",
      sources: [polygonSource(), polygonSource()],
      params: { op: "union", dissolve: false },
      executionCrs: EXECUTION_CRS,
      sourceLayerIds: ["a", "b"],
    });
    expect(result.op).toBe("union");
    expect(result.featureCount).toBe(fcPolygonsProjected.featureCollection.features.length * 2);
  });

  it("intersects overlapping polygons and returns attributed results", async () => {
    const result = await computeGeometryWorkflow({
      op: "intersect",
      sources: [polygonSource(), polygonSource()],
      params: { op: "intersect", preserveAttributes: "both" },
      executionCrs: EXECUTION_CRS,
      sourceLayerIds: ["a", "b"],
    });
    expect(result.op).toBe("intersect");
    expect(result.featureCount).toBeGreaterThan(0);
    expect(result.metrics.intersect_pairs).toBeGreaterThan(0);
  });

  it("throws GeometryWorkflowError on an empty source (induced failure surfaces an error)", async () => {
    await expect(
      computeGeometryWorkflow({
        op: "buffer",
        sources: [{ type: "FeatureCollection", features: [] }],
        params: { op: "buffer", meters: 250, segments: 16, dissolve: false, sourceLayerId: "parcels" },
        executionCrs: EXECUTION_CRS,
        sourceLayerIds: ["parcels"],
      }),
    ).rejects.toBeInstanceOf(GeometryWorkflowError);
  });

  it("throws when a binary op is missing its second source", async () => {
    await expect(
      computeGeometryWorkflow({
        op: "intersect",
        sources: [polygonSource()],
        params: { op: "intersect", preserveAttributes: "both" },
        executionCrs: EXECUTION_CRS,
        sourceLayerIds: ["a"],
      }),
    ).rejects.toBeInstanceOf(GeometryWorkflowError);
  });

  it("throws on a non-positive buffer distance", async () => {
    await expect(
      computeGeometryWorkflow({
        op: "buffer",
        sources: [polygonSource()],
        params: { op: "buffer", meters: 0, segments: 16, dissolve: false, sourceLayerId: "parcels" },
        executionCrs: EXECUTION_CRS,
        sourceLayerIds: ["parcels"],
      }),
    ).rejects.toBeInstanceOf(GeometryWorkflowError);
  });
});
