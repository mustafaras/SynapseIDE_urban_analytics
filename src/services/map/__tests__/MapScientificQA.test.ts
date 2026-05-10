import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  evaluateAnalysisQAGate,
  evaluateMapScientificQASync,
} from "../MapScientificQA";

const validPolygonCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "parcel-1",
      properties: { value: 12 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [29, 41],
          [29.01, 41],
          [29.01, 41.01],
          [29, 41.01],
          [29, 41],
        ]],
      },
    },
  ],
};

const invalidBowtieCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "bad-1",
      properties: { value: 8 },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 1],
          [0, 0],
        ]],
      },
    },
  ],
};

const nonClosedRingCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "open-ring",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[
          [29, 41],
          [29.01, 41],
          [29.01, 41.01],
          [29, 41.01],
        ]],
      },
    },
  ],
};

const pointCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "point-1",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [29, 41],
      },
    },
  ],
};

function createLayer(
  id: string,
  sourceData: FeatureCollection,
  metadata: OverlayLayerConfig["metadata"] = {},
): OverlayLayerConfig {
  return {
    id,
    name: id,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceKind: "project",
    sourceData,
    metadata: {
      featureCount: sourceData.features.length,
      geometryType: sourceData.features[0]?.geometry?.type ?? "Unknown",
      datasetContext: {
        crs: "EPSG:4326",
        source: "City Open Data",
        license: "ODbL",
        updateDate: "2026-01-01",
      },
      updatedAt: "2026-01-01T00:00:00Z",
      ...metadata,
    },
    provenance: {
      label: "City Open Data",
      license: "ODbL",
      method: "imported",
      collectedAt: "2026-01-01",
    },
  };
}

describe("MapScientificQA", () => {
  it("passes a valid GeoJSON layer with CRS and lineage metadata", () => {
    const layer = createLayer("valid-parcels", validPolygonCollection);

    const qa = evaluateMapScientificQASync([layer], {
      viewportZoom: 12,
    });

    expect(qa.status).toBe("passed");
    expect(qa.issues).toHaveLength(0);
    expect(qa.layerSummaries[0]?.metadata.status).toBe("passed");
  });

  it("warns and adds a caveat when CRS metadata is missing", () => {
    const layer = createLayer("missing-crs", validPolygonCollection, {
      datasetContext: {
        source: "City Open Data",
        license: "ODbL",
        updateDate: "2026-01-01",
      },
    });

    const qa = evaluateMapScientificQASync([layer]);

    expect(qa.status).toBe("warning");
    expect(qa.issues.some((issue) => issue.code === "missing_crs")).toBe(true);
    expect(qa.layerSummaries[0]?.badges).toContain("missing_crs");
    expect(qa.layerSummaries[0]?.metadata.caveats.length).toBeGreaterThan(0);
  });

  it("flags invalid geometry at layer and feature level", () => {
    const layer = createLayer("invalid-bowtie", invalidBowtieCollection);

    const qa = evaluateMapScientificQASync([layer]);

    expect(qa.status).toBe("error");
    expect(qa.issues.some((issue) => issue.code === "self_intersection" && issue.featureId === "bad-1")).toBe(true);
    expect(qa.layerSummaries[0]?.badges).toContain("invalid_geometry");
    expect(qa.layerSummaries[0]?.featureIssueCount).toBeGreaterThan(0);
  });

  it("detects non-closed polygon rings", () => {
    const layer = createLayer("non-closed-ring", nonClosedRingCollection);

    const qa = evaluateMapScientificQASync([layer]);

    expect(qa.issues.some((issue) => issue.code === "non_closed_ring")).toBe(true);
    expect(qa.layerSummaries[0]?.status).toBe("error");
  });

  it("blocks analysis dispatch when required geometry types fail QA rules", () => {
    const layer = createLayer("point-input", pointCollection);
    const qa = evaluateMapScientificQASync([layer], {
      activeAnalysisInputLayerIds: [layer.id],
      expectedGeometryTypes: ["polygon"],
      workflowLabel: "Hot spot analysis",
    });

    const gate = evaluateAnalysisQAGate(qa, {
      layerIds: [layer.id],
      requiredGeometryTypes: ["polygon"],
      workflowLabel: "Hot spot analysis",
    });

    expect(qa.issues.some((issue) => issue.code === "geometry_type_mismatch")).toBe(true);
    expect(gate.blocked).toBe(true);
    expect(gate.blockingIssueIds.length).toBeGreaterThan(0);
  });
});
