import { describe, expect, it } from "vitest";
import type { Feature, FeatureCollection, LineString } from "geojson";
import { normalizeLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import {
  MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL,
  type OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import {
  buildOnTheFlyVectorTileLayerMetadata,
  buildPmtilesVectorTileLayerMetadata,
  buildScaleAppropriateVectorTiles,
  buildVectorTilePipeline,
  buildVectorTileRenderFeatureCollection,
  countFeatureCollectionCoordinates,
  simplifyFeatureCollectionForZoom,
  VECTOR_TILE_GENERALIZATION_CAVEAT,
} from "../tiling/VectorTilePipelineService";

function makeWavyLineFeatureCollection(featureCount = 8, pointCount = 240): FeatureCollection {
  const features: Feature<LineString>[] = [];
  for (let featureIndex = 0; featureIndex < featureCount; featureIndex += 1) {
    const baseLng = -2 + featureIndex * 0.45;
    const baseLat = 50 + featureIndex * 0.03;
    const coordinates: Array<[number, number]> = [];
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
      coordinates.push([
        baseLng + pointIndex * 0.004,
        baseLat + Math.sin(pointIndex / 4) * 0.08 + Math.cos(pointIndex / 11) * 0.03,
      ]);
    }
    features.push({
      type: "Feature",
      id: `line-${featureIndex}`,
      geometry: { type: "LineString", coordinates },
      properties: { id: featureIndex, name: `Line ${featureIndex}` },
    });
  }
  return { type: "FeatureCollection", features };
}

describe("VectorTilePipelineService", () => {
  it("reduces coordinate count at low zoom while preserving high zoom detail", () => {
    const source = makeWavyLineFeatureCollection();
    const originalCount = countFeatureCollectionCoordinates(source);
    const lowZoom = simplifyFeatureCollectionForZoom(source, 4);
    const highZoom = simplifyFeatureCollectionForZoom(source, 15);

    expect(countFeatureCollectionCoordinates(lowZoom)).toBeLessThan(originalCount);
    expect(countFeatureCollectionCoordinates(highZoom)).toBe(originalCount);
  });

  it("builds scale-specific tile summaries and viewport render slices", () => {
    const source = makeWavyLineFeatureCollection(12, 180);
    const lowZoom = buildScaleAppropriateVectorTiles(source, 4);
    const highZoom = buildScaleAppropriateVectorTiles(source, 12);
    const pipeline = buildVectorTilePipeline(source, { zoomLevels: [4, 8, 12, 15] });
    const slice = buildVectorTileRenderFeatureCollection(pipeline, {
      west: -2.1,
      south: 49.8,
      east: 2.8,
      north: 50.6,
    }, 4);

    expect(lowZoom.metadata.simplificationRatio).not.toBeNull();
    expect(lowZoom.metadata.simplificationRatio!).toBeLessThan(1);
    expect(highZoom.metadata.simplificationRatio).toBeGreaterThan(lowZoom.metadata.simplificationRatio!);
    expect(pipeline.metadata.caveatLabel).toBe(MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL);
    expect(slice.tileCount).toBeGreaterThan(0);
    expect(slice.featureCount).toBeGreaterThan(0);
    expect(slice.caveats).toContain(VECTOR_TILE_GENERALIZATION_CAVEAT);
  });

  it("describes PMTiles sources as tiled simplified metadata without feature-count claims", () => {
    const metadata = buildPmtilesVectorTileLayerMetadata({
      sourceUrl: "https://tiles.example.test/city.pmtiles",
      sourceLayer: "parcels",
      minZoom: 3,
      maxZoom: 14,
    });

    expect(metadata.sourceMode).toBe("pmtiles");
    expect(metadata.originalFeatureCount).toBeNull();
    expect(metadata.sourceUrl).toBe("https://tiles.example.test/city.pmtiles");
    expect(metadata.caveats).toContain(MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL);
  });

  it("feeds tiled simplified caveats into layer registry readiness", () => {
    const source = makeWavyLineFeatureCollection(2, 80);
    const layer: OverlayLayerConfig = {
      id: "tiled-lines",
      name: "Tiled lines",
      type: "geojson",
      visible: true,
      opacity: 1,
      sourceKind: "imported",
      sourceData: source,
      queryable: true,
      qaStatus: "passed",
      provenance: {
        label: "Unit test line source",
        sourceName: "Unit test",
        method: "Vector tile pipeline unit test",
      },
      metadata: {
        featureCount: source.features.length,
        geometryType: "LineString",
        fields: ["id", "name"],
        crsSummary: {
          crs: "EPSG:4326",
          status: "known",
          source: "explicit",
          notes: [],
        },
        licenseAttribution: {
          license: "ODbL",
          attribution: "Unit test",
          sourceName: "Unit test",
          requiresAttribution: true,
          source: "explicit",
          notes: [],
        },
        vectorTiles: buildOnTheFlyVectorTileLayerMetadata(source),
      },
    };

    const registry = normalizeLayerRegistryMetadata(layer);

    expect(registry.publicationReadiness.status).toBe("ready-with-caveats");
    expect(registry.publicationReadiness.caveats).toContain(MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL);
  });
});