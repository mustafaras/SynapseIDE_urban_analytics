import { describe, expect, it } from "vitest";
import type { OverlayLayerConfig } from "../mapTypes";
import {
  applyContentsToRenderLayer,
  applyDefinitionFilterToLayer,
  duplicateMapContentsLayer,
  evaluateContentsScaleRange,
  setMapLayerContentsState,
} from "../contents";

function layer(): OverlayLayerConfig {
  return {
    id: "contents-parcels",
    name: "Contents Parcels",
    type: "geojson",
    visible: true,
    opacity: 0.8,
    group: "data",
    sourceKind: "imported",
    queryable: true,
    provenance: {
      label: "Surveyed parcel layer",
      sourceName: "Municipal GIS",
      license: "ODbL",
      notes: ["Loaded for contents tests."],
    },
    sourceData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [29, 41] },
          properties: { zone: "residential", height: 8 },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [29.01, 41.01] },
          properties: { zone: "commercial", height: 18 },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [29.02, 41.02] },
          properties: { zone: "commercial", height: 24 },
        },
      ],
    },
    metadata: {
      sourceId: "source-contents-parcels",
      featureCount: 3,
      geometryType: "Point",
      fields: ["zone", "height"],
      scientificQA: {
        status: "warning",
        issueIds: ["source-caveat"],
        badges: ["uncertain_output"],
        checkedAt: "2026-05-26T10:00:00.000Z",
        featureIssueCount: 0,
        usedWorker: false,
        caveats: ["Source metadata needs review."],
        signature: "contents-layer",
      },
    },
  };
}

describe("professional contents layer semantics", () => {
  it("gates drawing by configured scale range without changing stored visibility", () => {
    const configured = setMapLayerContentsState(layer(), { minZoom: 12, maxZoom: 16 }, "2026-05-26T10:00:00.000Z");

    expect(evaluateContentsScaleRange(configured, 10)).toMatchObject({ inRange: false });
    expect(applyContentsToRenderLayer(configured, 10).visible).toBe(false);
    expect(applyContentsToRenderLayer(configured, 14).visible).toBe(true);
    expect(configured.visible).toBe(true);
  });

  it("narrows rendered features through a definition filter while retaining source data", () => {
    const configured = setMapLayerContentsState(layer(), {
      definitionFilter: { field: "zone", operator: "equals", value: "commercial" },
    }, "2026-05-26T10:00:00.000Z");

    const result = applyDefinitionFilterToLayer(configured);
    expect(result.totalFeatureCount).toBe(3);
    expect(result.filteredFeatureCount).toBe(2);
    expect((result.layer.sourceData as GeoJSON.FeatureCollection).features).toHaveLength(2);
    expect((configured.sourceData as GeoJSON.FeatureCollection).features).toHaveLength(3);
  });

  it("duplicates a layer as a second view while preserving provenance and source identity", () => {
    const configured = setMapLayerContentsState(layer(), {
      groupId: "group-review",
      groupLabel: "Review",
    }, "2026-05-26T10:00:00.000Z");
    const duplicate = duplicateMapContentsLayer(configured, {
      id: "contents-parcels-copy",
      createdAt: "2026-05-26T11:00:00.000Z",
    });

    expect(duplicate.id).toBe("contents-parcels-copy");
    expect(duplicate.name).toBe("Contents Parcels (copy)");
    expect(duplicate.metadata?.sourceId).toBe("source-contents-parcels");
    expect(duplicate.metadata?.contents?.groupLabel).toBe("Review");
    expect(duplicate.provenance).toEqual(configured.provenance);
    expect(duplicate.provenance).not.toBe(configured.provenance);
    expect(duplicate.sourceData).toBe(configured.sourceData);
  });
});
