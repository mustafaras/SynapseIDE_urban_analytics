import { describe, expect, it } from "vitest";
import { SAMPLE_CITYJSON_STRING } from "@/features/urbanAnalytics/voxcity/sampleCityJSON";
import { cloneSourceHandle } from "../sources/MapSourceRegistry";
import {
  buildVerticalDatumMetadata,
  createDemTerrainSourceHandle,
  createTerrainElevationGrid,
  groundFeatureCollectionOnTerrain,
  importCityJSONSceneSource,
  importTiles3DSceneSource,
  sampleTerrainAtCoordinate,
} from "../scene3d/MapTerrainCityModelService";

function createTestTerrain() {
  return createTerrainElevationGrid({
    sourceId: "terrain-dem-test",
    width: 2,
    height: 2,
    bbox: [0, 0, 10, 10],
    values: [10, 20, 30, 40],
    crs: "EPSG:4326",
    noData: null,
    verticalDatum: { value: "EGM96 geoid height", source: "user-declared" },
  });
}

describe("MapTerrainCityModelService", () => {
  it("samples DEM terrain at a building base coordinate", () => {
    const terrain = createTestTerrain();
    const sample = sampleTerrainAtCoordinate(terrain, [5, 5]);

    expect(sample.status).toBe("sampled");
    expect(sample.elevationM).toBe(25);
    expect(sample.verticalDatum).toMatchObject({ status: "known", value: "EGM96 geoid height" });

    const grounded = groundFeatureCollectionOnTerrain({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        id: "b1",
        geometry: {
          type: "Polygon",
          coordinates: [[[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]],
        },
        properties: { height: 12 },
      }],
    }, terrain);

    expect(grounded.samples[0]?.status).toBe("sampled");
    expect(grounded.collection.features[0]?.properties?.scene3d_grounded).toBe(true);
    expect(grounded.collection.features[0]?.properties?.scene3d_base_elevation_m).toEqual(expect.any(Number));
  });

  it("creates a DEM terrain source handle with vertical datum metadata", () => {
    const terrain = createTestTerrain();
    const handle = createDemTerrainSourceHandle({
      sourceId: "terrain-dem-test",
      title: "Test DEM",
      metadata: {
        width: 2,
        height: 2,
        bbox: [0, 0, 10, 10],
        epsgCode: "EPSG:4326",
        noData: null,
      },
      terrain,
    });

    expect(handle.format).toBe("geotiff");
    expect(handle.scene3d?.sourceKind).toBe("terrain-dem");
    expect(handle.scene3d?.verticalDatum).toMatchObject({ status: "known", value: "EGM96 geoid height" });
    expect(handle.scene3d?.terrain?.elevationRangeM).toEqual([10, 40]);
  });

  it("imports a small CityJSON file into a source handle and caveats unknown vertical datum", async () => {
    const result = await importCityJSONSceneSource({
      json: SAMPLE_CITYJSON_STRING,
      sourceId: "cityjson-sample-test",
      title: "Sample CityJSON",
      runtimeMode: "sample",
    });

    expect(result.sourceHandle.format).toBe("cityjson");
    expect(result.sourceHandle.featureCount).toBe(8);
    expect(result.sourceHandle.scene3d?.sourceKind).toBe("cityjson");
    expect(result.sourceHandle.scene3d?.runtimeMode).toBe("sample");
    expect(result.sourceHandle.scene3d?.verticalDatum.status).toBe("unknown");
    expect(result.sourceHandle.scene3d?.verticalDatum.caveats.join(" ")).toMatch(/vertical datum/i);
    expect(result.footprintCollection.features.length).toBeGreaterThan(0);
  });

  it("records an explicitly supplied CityJSON vertical datum", async () => {
    const result = await importCityJSONSceneSource({
      json: SAMPLE_CITYJSON_STRING,
      sourceId: "cityjson-known-datum-test",
      title: "Sample CityJSON with datum",
      runtimeMode: "real",
      verticalDatum: { value: "NAP height", source: "user-declared" },
    });

    expect(result.sourceHandle.scene3d?.verticalDatum).toMatchObject({
      status: "known",
      value: "NAP height",
      source: "user-declared",
    });
  });

  it("imports 3D Tiles tileset metadata through loaders.gl and caveats absent vertical datum", async () => {
    const tileset = JSON.stringify({
      asset: { version: "1.1" },
      geometricError: 200,
      root: {
        boundingVolume: { region: [0, 0, 0.01, 0.01, 3, 18] },
        geometricError: 50,
        refine: "ADD",
        content: { uri: "root.b3dm" },
        children: [{
          boundingVolume: { region: [0, 0, 0.005, 0.005, 3, 10] },
          geometricError: 0,
          content: { uri: "child.b3dm" },
        }],
      },
    });

    const result = await importTiles3DSceneSource({
      tilesetJson: tileset,
      sourceId: "tiles3d-test",
      title: "Tileset",
      runtimeMode: "metadata-only",
    });

    expect(result.sourceHandle.format).toBe("3d-tiles");
    expect(result.sourceHandle.scene3d?.sourceKind).toBe("3d-tiles");
    expect(result.sourceHandle.scene3d?.tileset?.tileCount).toBe(2);
    expect(result.sourceHandle.scene3d?.tileset?.contentCount).toBe(2);
    expect(result.sourceHandle.scene3d?.verticalDatum.status).toBe("unknown");
  });

  it("preserves 3D metadata when source handles are cloned", async () => {
    const terrain = createTestTerrain();
    const result = await importCityJSONSceneSource({
      json: SAMPLE_CITYJSON_STRING,
      sourceId: "cityjson-clone-test",
      title: "Sample CityJSON",
      terrain,
    });

    const cloned = cloneSourceHandle(result.sourceHandle);
    expect(cloned).not.toBe(result.sourceHandle);
    expect(cloned.scene3d?.verticalDatum).toEqual(result.sourceHandle.scene3d?.verticalDatum);
    expect(cloned.scene3d?.lods).toEqual(result.sourceHandle.scene3d?.lods);
  });

  it("builds an unknown vertical datum with a caveat when no datum is supplied", () => {
    const datum = buildVerticalDatumMetadata({ source: "3d-tiles-metadata" });
    expect(datum.status).toBe("unknown");
    expect(datum.value).toBeNull();
    expect(datum.caveats.join(" ")).toMatch(/vertical datum/i);
  });
});
