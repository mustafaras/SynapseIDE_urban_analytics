import { describe, expect, it } from "vitest";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import type { OverlayLayerConfig } from "@/centerpanel/components/map/mapTypes";
import {
  applyMapWorkflowPreview,
  buildMapWorkflowContext,
  buildMapWorkflowPreviewLayer,
  createDefaultDraft,
  generateMapWorkflowPreview,
  MAP_WORKFLOW_PREVIEW_LAYER_ID,
  type MapWorkflowBufferDraft,
  type MapWorkflowComparisonDraft,
  type MapWorkflowIntersectDraft,
} from "../MapWorkflowService";

const fixedNow = new Date("2026-05-01T12:00:00.000Z");

function polygonFeature(id: string, ring: Array<[number, number]>, properties: Record<string, unknown> = {}): Feature<Polygon> {
  return {
    type: "Feature",
    id,
    properties,
    geometry: {
      type: "Polygon",
      coordinates: [[...ring, ring[0]!]],
    },
  };
}

function pointFeature(id: string, coordinate: [number, number], properties: Record<string, unknown> = {}): Feature<Geometry> {
  return {
    type: "Feature",
    id,
    properties,
    geometry: {
      type: "Point",
      coordinates: coordinate,
    },
  };
}

function featureCollection(features: Feature[]): FeatureCollection {
  return { type: "FeatureCollection", features };
}

function layer(id: string, collection: FeatureCollection, geometryType = "Polygon"): OverlayLayerConfig {
  return {
    id,
    name: `Layer ${id}`,
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: collection,
    sourceKind: "project",
    queryable: true,
    metadata: {
      geometryType,
      featureCount: collection.features.length,
      fields: ["name"],
      datasetContext: {
        crs: "EPSG:4326",
      },
    },
  };
}

describe("MapWorkflowService", () => {
  it("creates an AOI preview from the current viewport and exposes a transient preview layer", () => {
    const context = buildMapWorkflowContext([], {
      viewportBounds: [28.9, 40.9, 29.1, 41.1],
      now: fixedNow,
    });
    const draft = createDefaultDraft("aoi");

    const preview = generateMapWorkflowPreview(draft, context);
    const previewLayer = buildMapWorkflowPreviewLayer(preview, context);

    expect(preview.canApply).toBe(true);
    expect(preview.manifest).toMatchObject({
      status: "preview",
      workflowKind: "aoi",
      outputLayerIds: [MAP_WORKFLOW_PREVIEW_LAYER_ID],
    });
    expect(preview.expectedOutput).toMatchObject({
      layerName: "Custom AOI",
      geometryClass: "polygon",
      reportCompatible: true,
    });
    expect(JSON.stringify(preview.manifest)).not.toContain("coordinates");
    expect(preview.nextRequiredStep).toBeNull();
    expect(preview.featureCollection?.features[0]?.properties).toMatchObject({
      aoi_source: "viewport",
      aoi_label: "Custom AOI",
    });
    expect(preview.metrics.area_km2).toBeGreaterThan(0);
    expect(previewLayer).toMatchObject({
      id: MAP_WORKFLOW_PREVIEW_LAYER_ID,
      visible: true,
      queryable: false,
      sourceKind: "derived",
      group: "analysis",
      qaStatus: "passed",
    });
  });

  it("validates selected-feature buffer parameters before producing a result", () => {
    const selected = pointFeature("stop-1", [29, 41], {
      name: "Transit stop",
      __selection_layer_id: "transit-stops",
    });
    const context = buildMapWorkflowContext([], {
      selectedFeatures: [selected],
      selectedLayerIds: ["transit-stops"],
      now: fixedNow,
    });
    const draft: MapWorkflowBufferDraft = {
      ...(createDefaultDraft("buffer") as MapWorkflowBufferDraft),
      sourceMode: "selected-features",
      sourceLayerId: null,
      distance: 0,
      unit: "meters",
    };

    const blocked = generateMapWorkflowPreview(draft, context);
    expect(blocked.canApply).toBe(false);
    expect(blocked.issues.some((issue) => issue.code === "buffer-zero")).toBe(true);
    expect(blocked.manifest.status).toBe("blocked");
    expect(blocked.manifest.qaSummary.blockerCount).toBeGreaterThan(0);
    expect(blocked.manifest.outputLayerIds).toEqual([]);

    const valid = generateMapWorkflowPreview({ ...draft, distance: 250 }, context);
    const applied = applyMapWorkflowPreview(valid, context);

    expect(valid.canApply).toBe(true);
    expect(valid.metrics.source_scope).toBe("selected features");
    expect(valid.featureCount).toBe(1);
    expect(valid.manifest.sourceLayerIds).toEqual(["transit-stops"]);
    expect(applied?.manifest).toMatchObject({
      status: "applied",
      workflowId: valid.manifest.workflowId,
      outputLayerIds: [applied?.layer.id],
    });
    expect(applied?.layer.metadata?.reproducibilityManifest?.manifestId).toBe(applied?.manifest.manifestId);
    expect(applied?.reportItem.manifest.manifestId).toBe(applied?.manifest.manifestId);
    expect(applied?.reportItem.sourceLayerIds).toEqual(["transit-stops"]);
    expect(applied?.layer.provenance?.sourceLayerIds).toEqual(["transit-stops"]);
  });

  it("registers intersection outputs with provenance, QA, and report metadata", () => {
    const layerA = layer("districts", featureCollection([
      polygonFeature("a", [[0, 0], [2, 0], [2, 2], [0, 2]], { name: "A" }),
    ]));
    const layerB = layer("policy-zone", featureCollection([
      polygonFeature("b", [[1, 1], [3, 1], [3, 3], [1, 3]], { name: "B" }),
    ]));
    const context = buildMapWorkflowContext([layerA, layerB], { now: fixedNow });
    const draft: MapWorkflowIntersectDraft = {
      ...(createDefaultDraft("intersect") as MapWorkflowIntersectDraft),
      layerAId: "districts",
      layerBId: "policy-zone",
      name: "District policy overlap",
    };

    const preview = generateMapWorkflowPreview(draft, context);
    const applied = applyMapWorkflowPreview(preview, context);

    expect(preview.canApply).toBe(true);
    expect(preview.featureCount).toBe(1);
    expect(applied?.layer).toMatchObject({
      name: "District policy overlap",
      sourceKind: "derived",
      group: "analysis",
      qaStatus: "passed",
      queryable: true,
    });
    expect(applied?.layer.provenance?.sourceLayerIds).toEqual(["districts", "policy-zone"]);
    expect(applied?.layer.metadata?.scientificQA?.signature).toContain("wf:intersect");
    expect(applied?.reportItem).toMatchObject({
      workflow: "intersect",
      derivedLayerId: applied?.layer.id,
      sourceLayerIds: ["districts", "policy-zone"],
    });
  });

  it("builds comparison preview state and a reportable comparison item", () => {
    const layerA = layer("baseline", featureCollection([
      polygonFeature("base", [[0, 0], [1, 0], [1, 1], [0, 1]], { name: "Baseline" }),
    ]));
    const layerB = layer("scenario", featureCollection([
      polygonFeature("scenario", [[0, 0], [1.2, 0], [1.2, 1.2], [0, 1.2]], { name: "Scenario" }),
    ]));
    const context = buildMapWorkflowContext([layerA, layerB], { now: fixedNow });
    const draft: MapWorkflowComparisonDraft = {
      ...(createDefaultDraft("comparison") as MapWorkflowComparisonDraft),
      layerAId: "baseline",
      layerBId: "scenario",
      view: "swipe",
      swipePosition: 0.35,
      name: "Baseline vs scenario",
    };

    const preview = generateMapWorkflowPreview(draft, context);
    const applied = applyMapWorkflowPreview(preview, context);

    expect(preview.canApply).toBe(true);
    expect(preview.featureCollection).toBeNull();
    expect(preview.comparisonState).toMatchObject({
      view: "swipe",
      layerAId: "baseline",
      layerBId: "scenario",
      swipePosition: 0.35,
    });
    expect(applied?.layer).toMatchObject({
      name: "Baseline vs scenario",
      visible: false,
      sourceKind: "derived",
      group: "analysis",
      qaStatus: "passed",
    });
    expect(applied?.reportItem.comparisonState).toMatchObject({
      view: "swipe",
      layerAName: "Layer baseline",
      layerBName: "Layer scenario",
    });
  });
});