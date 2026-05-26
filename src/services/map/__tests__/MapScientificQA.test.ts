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
      fields: ["value"],
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
    expect(qa.metadata.categorySummaries?.every((summary) => summary.severity === "pass")).toBe(true);
  });

  it("does not treat generated QA metadata as new layer input", () => {
    const layer = createLayer("stable-qa-layer", validPolygonCollection);
    const first = evaluateMapScientificQASync([layer], { viewportZoom: 12 });
    const second = evaluateMapScientificQASync([{
      ...layer,
      metadata: {
        ...layer.metadata,
        scientificQA: first.layerSummaries[0]!.metadata,
      },
    }], { viewportZoom: 12 });

    expect(second.layerSummaries[0]?.signature).toBe(first.layerSummaries[0]?.signature);
    expect(second.metadata.signature).toBe(first.metadata.signature);
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
    expect(qa.layerSummaries[0]?.metadata.categorySummaries?.find((summary) => summary.category === "crs")?.severity).toBe("warning");
  });

  it("honors normalized CRS metadata sources without marking CRS missing", () => {
    const metadataCases: Array<[string, OverlayLayerConfig["metadata"]]> = [
      [
        "crs-summary",
        {
          datasetContext: { source: "City Open Data", license: "ODbL", updateDate: "2026-01-01" },
          crsSummary: { crs: "EPSG:3857", status: "known", source: "explicit", notes: [] },
        },
      ],
      [
        "import-source",
        {
          datasetContext: { source: "City Open Data", license: "ODbL", updateDate: "2026-01-01" },
          importSource: {
            format: "geojson",
            fileName: "parcels.geojson",
            sourceName: "Parcel import",
            importedAt: "2026-01-01T00:00:00Z",
            importedFeatureCount: 1,
            declaredCrs: "EPSG:4326",
            sourceConfidence: "declared",
            caveats: [],
          },
        },
      ],
      [
        "registry-crs-summary",
        {
          datasetContext: { source: "City Open Data", license: "ODbL", updateDate: "2026-01-01" },
          registry: {
            sourceKind: "imported",
            provenance: { label: "Registry layer", license: "ODbL" },
            crsSummary: { crs: "EPSG:4326", status: "known", source: "explicit", notes: [] },
            geometrySummary: { geometryType: "Polygon", geometryTypes: ["Polygon"], featureCount: 1, source: "explicit", notes: [] },
            featureCount: 1,
            schemaSummary: { fieldCount: 1, fields: [{ name: "value", role: "attribute" }], source: "explicit", notes: [] },
            licenseAttribution: { license: "ODbL", attribution: "City Open Data", sourceName: "City Open Data", requiresAttribution: true, source: "explicit", notes: [] },
            qaStatus: "passed",
            queryable: true,
            publicationReadiness: { status: "ready", missingFields: [], blockingIssueIds: [], caveats: [] },
            readiness: {
              layerId: "registry-crs-summary",
              status: "ready",
              geometryReady: true,
              crsReady: true,
              metadataReady: true,
              queryReady: true,
              temporalReady: true,
              workerReady: true,
              missingFields: [],
              blockingIssueIds: [],
              caveats: [],
            },
            compatibility: { legacy: false, source: "explicit", missingMetadata: [] },
          },
        },
      ],
    ];

    metadataCases.forEach(([id, metadata]) => {
      const qa = evaluateMapScientificQASync([createLayer(id, validPolygonCollection, metadata)]);
      expect(qa.issues.some((issue) => issue.code === "missing_crs")).toBe(false);
      expect(qa.layerSummaries[0]?.metadata.categorySummaries?.find((summary) => summary.category === "crs")?.severity).toBe("pass");
    });
  });

  it("keeps missing schema metadata out of pass state", () => {
    const layer = createLayer("missing-schema", validPolygonCollection, {
      fields: [],
    });

    const qa = evaluateMapScientificQASync([layer]);
    const schemaSummary = qa.layerSummaries[0]?.metadata.categorySummaries?.find((summary) => summary.category === "schema");

    expect(qa.status).toBe("warning");
    expect(qa.issues.some((issue) => issue.code === "missing_schema_metadata")).toBe(true);
    expect(schemaSummary?.severity).toBe("warning");
    expect(schemaSummary?.recommendedFixes[0]).toContain("field names");
  });

  it("flags invalid geometry at layer and feature level", () => {
    const layer = createLayer("invalid-bowtie", invalidBowtieCollection);

    const qa = evaluateMapScientificQASync([layer]);

    expect(qa.status).toBe("error");
    expect(qa.issues.some((issue) => issue.code === "self_intersection" && issue.featureId === "bad-1")).toBe(true);
    expect(qa.layerSummaries[0]?.badges).toContain("invalid_geometry");
    expect(qa.layerSummaries[0]?.featureIssueCount).toBeGreaterThan(0);
    expect(qa.layerSummaries[0]?.metadata.categorySummaries?.find((summary) => summary.category === "export-readiness")?.severity).toBe("blocked");
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
