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
  type MapWorkflowAOIDraft,
  type MapWorkflowBufferDraft,
  type MapWorkflowComparisonDraft,
  type MapWorkflowIntersectDraft,
} from "../MapWorkflowService";
import {
  buildOnTheFlyVectorTileLayerMetadata,
  VECTOR_TILE_METRIC_CAVEAT,
} from "../tiling/VectorTilePipelineService";
import { fcInvalidGeometry } from "@/centerpanel/components/map/__tests__/fixtures/gisFixtures";

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

function layer(
  id: string,
  collection: FeatureCollection,
  geometryType = "Polygon",
  crs = "EPSG:32635",
): OverlayLayerConfig {
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
        crs,
      },
      crsSummary: {
        crs,
        status: "known",
        source: "explicit",
        notes: ["Unit test fixture CRS."],
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

  it("creates an AOI preview from the Urban study area source", () => {
    const context = buildMapWorkflowContext([], {
      urbanStudyArea: {
        id: "urban-kadikoy",
        label: "Kadikoy study area",
        bounds: [28.97, 40.96, 29.09, 41.02],
        activeAoiId: "aoi-kadikoy",
      },
      now: fixedNow,
    });
    const draft: MapWorkflowAOIDraft = {
      ...(createDefaultDraft("aoi") as MapWorkflowAOIDraft),
      source: "urban-study-area",
      name: "Urban requested AOI",
    };

    const preview = generateMapWorkflowPreview(draft, context);

    expect(preview.canApply).toBe(true);
    expect(preview.featureCollection?.features[0]?.properties).toMatchObject({
      aoi_source: "urban-study-area",
      aoi_label: "Urban requested AOI",
      aoi_validation_status: "valid",
    });
    expect(String(preview.metrics.source_kind)).toContain("Urban");
    expect(preview.metrics.provenance_notes).toContain("urban-kadikoy");
  });

  it("blocks invalid drawn AOI geometry instead of silently accepting topology failures", () => {
    const invalidPolygon = fcInvalidGeometry.features.find((feature) => feature.properties?.issue === "self-intersection");
    const context = buildMapWorkflowContext([], {
      drawnPolygons: invalidPolygon?.geometry?.type === "Polygon"
        ? [invalidPolygon as Feature<Polygon>]
        : [],
      now: fixedNow,
    });
    const draft: MapWorkflowAOIDraft = {
      ...(createDefaultDraft("aoi") as MapWorkflowAOIDraft),
      source: "drawn-polygon",
    };

    const preview = generateMapWorkflowPreview(draft, context);

    expect(preview.canApply).toBe(false);
    expect(preview.issues.some((issue) => issue.code === "aoi-invalid-geometry")).toBe(true);
    expect(preview.manifest.qaSummary.blockers.join(" ")).toContain("Self-intersecting");
  });

  it("validates selected-feature buffer parameters before producing a result", () => {
    const selected = pointFeature("stop-1", [29, 41], {
      name: "Transit stop",
      __selection_layer_id: "transit-stops",
    });
    const sourceLayer = layer("transit-stops", featureCollection([selected]), "Point");
    const context = buildMapWorkflowContext([sourceLayer], {
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
    expect(valid.crsPreflight).toMatchObject({
      blocked: false,
      executionKind: "planar",
      executionCrs: "EPSG:32635",
    });
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

  it("blocks planar metric workflows when source CRS metadata is missing", () => {
    const missingCrsLayer = layer(
      "missing-crs-polygons",
      featureCollection([
        polygonFeature("missing", [[0, 0], [1, 0], [1, 1], [0, 1]], { name: "Missing CRS" }),
      ]),
      "Polygon",
      "",
    );
    const context = buildMapWorkflowContext([missingCrsLayer], { now: fixedNow });
    const draft: MapWorkflowBufferDraft = {
      ...(createDefaultDraft("buffer") as MapWorkflowBufferDraft),
      sourceLayerId: "missing-crs-polygons",
      distance: 100,
      unit: "meters",
    };

    const preview = generateMapWorkflowPreview(draft, context);

    expect(preview.canApply).toBe(false);
    expect(preview.featureCollection).toBeNull();
    expect(preview.crsPreflight).toMatchObject({
      blocked: true,
      sourceCrs: null,
      executionCrs: null,
      remedy: "declare-crs",
    });
    expect(preview.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "crs-declare-crs",
          severity: "blocker",
          remedy: "declare-crs",
        }),
      ]),
    );
    expect(preview.manifest.status).toBe("blocked");
    expect(preview.manifest.crsSummary.notes.join(" ")).toContain("Declare the CRS before running");
  });

  it("adds a caveat when metric workflows use tiled simplified source geometry", () => {
    const source = featureCollection([
      polygonFeature("tile-a", [[0, 0], [2, 0], [2, 2], [0, 2]], { name: "A" }),
    ]);
    const baseLayer = layer("tiled-source", source, "Polygon", "EPSG:32635");
    const tiledLayer: OverlayLayerConfig = {
      ...baseLayer,
      metadata: {
        ...(baseLayer.metadata ?? {}),
        vectorTiles: buildOnTheFlyVectorTileLayerMetadata(source),
      },
    };
    const context = buildMapWorkflowContext([tiledLayer], { now: fixedNow });
    const draft: MapWorkflowBufferDraft = {
      ...(createDefaultDraft("buffer") as MapWorkflowBufferDraft),
      sourceLayerId: "tiled-source",
      distance: 100,
      unit: "meters",
    };

    const preview = generateMapWorkflowPreview(draft, context);
    const applied = applyMapWorkflowPreview(preview, context);

    expect(preview.canApply).toBe(true);
    expect(preview.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "vector-tile-simplified-tiled-source",
          severity: "warning",
        }),
      ]),
    );
    expect(preview.manifest.qaSummary.caveats.join(" ")).toContain(VECTOR_TILE_METRIC_CAVEAT);
    expect(applied?.reportItem.caveats.join(" ")).toContain(VECTOR_TILE_METRIC_CAVEAT);
    expect(applied?.layer.metadata?.scientificQA?.badges).toContain("uncertain_output");
  });

  it("blocks workflow previews when an Urban method required CRS conflicts with the source CRS", () => {
    const projectedLayer = layer(
      "utm-polygons",
      featureCollection([
        polygonFeature("projected", [[0, 0], [1, 0], [1, 1], [0, 1]], { name: "Projected polygon" }),
      ]),
      "Polygon",
      "EPSG:32635",
    );
    const context = buildMapWorkflowContext([projectedLayer], {
      now: fixedNow,
      urbanRequiredCrs: "EPSG:3857",
    });
    const draft: MapWorkflowBufferDraft = {
      ...(createDefaultDraft("buffer") as MapWorkflowBufferDraft),
      sourceLayerId: "utm-polygons",
      distance: 100,
      unit: "meters",
    };

    const preview = generateMapWorkflowPreview(draft, context);

    expect(preview.canApply).toBe(false);
    expect(preview.crsPreflight).toMatchObject({
      blocked: true,
      remedy: "reproject",
      sourceCrs: "EPSG:32635",
    });
    expect(preview.crsPreflight.reason).toContain("requires EPSG:3857");
    expect(preview.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "crs-reproject",
          severity: "blocker",
          remedy: "reproject",
        }),
      ]),
    );
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
