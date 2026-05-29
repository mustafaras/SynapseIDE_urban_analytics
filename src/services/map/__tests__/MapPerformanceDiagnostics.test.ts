import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import { buildMapPerformanceDiagnostics } from "../MapPerformanceDiagnostics";

function layer(id: string, cache?: NonNullable<OverlayLayerConfig["metadata"]>["reprojectionCache"]): OverlayLayerConfig {
  return {
    id,
    name: `Layer ${id}`,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "derived",
    sourceData: { type: "FeatureCollection", features: [] },
    metadata: {
      featureCount: 0,
      geometryType: "Polygon",
      fields: [],
      ...(cache ? { reprojectionCache: cache } : {}),
    },
  };
}

describe("MapPerformanceDiagnostics reprojection cache", () => {
  it("aggregates reprojection cache stats from derived layer metadata", () => {
    const diagnostics = buildMapPerformanceDiagnostics({
      overlayLayers: [
        layer("a", {
          entries: 1,
          maxEntries: 12,
          hits: 1,
          misses: 0,
          bypasses: 0,
          evictions: 0,
          hitRate: 1,
          projectedFeatureCount: 10,
          projectedCoordinateCount: 50,
          sourceIds: ["source:a"],
          targetCrs: "EPSG:32635",
          lastRunAt: "2026-05-01T12:00:00.000Z",
        }),
        layer("b", {
          entries: 2,
          maxEntries: 12,
          hits: 0,
          misses: 1,
          bypasses: 0,
          evictions: 1,
          hitRate: 0,
          projectedFeatureCount: 5,
          projectedCoordinateCount: 25,
          sourceIds: ["source:b"],
          targetCrs: "EPSG:32636",
          lastRunAt: "2026-05-01T12:05:00.000Z",
        }),
      ],
    });

    expect(diagnostics.reprojectionCache).toMatchObject({
      layerCount: 2,
      entries: 2,
      maxEntries: 12,
      hits: 1,
      misses: 1,
      evictions: 1,
      hitRate: 0.5,
      projectedFeatureCount: 15,
      projectedCoordinateCount: 75,
      sourceIds: ["source:a", "source:b"],
      targetCrs: "EPSG:32636",
      lastRunAt: "2026-05-01T12:05:00.000Z",
    });
  });
});