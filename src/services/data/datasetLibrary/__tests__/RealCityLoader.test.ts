import { describe, expect, it, vi } from "vitest";
import type { FeatureCollection, GeoJsonProperties, LineString, MultiPolygon, Polygon } from "geojson";
import type {
  OverpassBuildingsResult,
  OverpassRoadsResult,
} from "../../../map/ExternalServiceConnector";
import { buildRealOsmCityLayers } from "../realCityLoader";

const WINDOW: [number, number, number, number] = [-73.99, 40.72, -73.97, 40.74];

function buildingsResult(): OverpassBuildingsResult {
  const featureCollection: FeatureCollection<Polygon | MultiPolygon, GeoJsonProperties> = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "osm-way-1",
        geometry: {
          type: "Polygon",
          coordinates: [[[-73.98, 40.73], [-73.979, 40.73], [-73.979, 40.731], [-73.98, 40.731], [-73.98, 40.73]]],
        },
        properties: { building: "yes", osm_id: "way/1" },
      },
    ],
  };
  return {
    featureCollection,
    requestedBounds: WINDOW,
    clampedBounds: WINDOW,
    areaKm2: 3.6,
    wasClamped: true,
    cacheKey: "k",
    cacheHit: false,
    fetchedAt: "2026-05-25T10:00:00.000Z",
    endpoint: "https://overpass.test/api/interpreter",
    provenance: "OpenStreetMap contributors — © ODbL",
  };
}

function roadsResult(): OverpassRoadsResult {
  const featureCollection: FeatureCollection<LineString, GeoJsonProperties> = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "osm-way-2",
        geometry: { type: "LineString", coordinates: [[-73.985, 40.725], [-73.975, 40.735]] },
        properties: { highway: "primary", name: "Broadway", osm_id: "way/2" },
      },
      {
        type: "Feature",
        id: "osm-way-3",
        geometry: { type: "LineString", coordinates: [[-73.98, 40.72], [-73.978, 40.74]] },
        properties: { highway: "secondary", name: "5th Ave", osm_id: "way/3" },
      },
    ],
  };
  return {
    featureCollection,
    requestedBounds: WINDOW,
    clampedBounds: WINDOW,
    areaKm2: 3.6,
    wasClamped: true,
    cacheKey: "k",
    cacheHit: false,
    fetchedAt: "2026-05-25T10:00:00.000Z",
    endpoint: "https://overpass.test/api/interpreter",
    provenance: "OpenStreetMap contributors — © ODbL",
  };
}

describe("realCityLoader.buildRealOsmCityLayers", () => {
  it("builds real OSM building + road layers for a catalog city within a CRS-safe window", async () => {
    const buildingsFetcher = vi.fn().mockResolvedValue(buildingsResult());
    const roadsFetcher = vi.fn().mockResolvedValue(roadsResult());

    const result = await buildRealOsmCityLayers("new_york_city", { buildingsFetcher, roadsFetcher });

    // A central window was queried (the NYC bbox is far larger than the cap).
    expect(buildingsFetcher).toHaveBeenCalledTimes(1);
    expect(roadsFetcher).toHaveBeenCalledTimes(1);
    expect(result.wasClamped).toBe(true);
    expect(result.city).toBe("New York City");
    expect(result.roadCount).toBe(2);
    expect(result.buildingCount).toBe(1);

    // Two real, honestly-labelled external layers (roads then buildings).
    expect(result.layers).toHaveLength(2);
    const [roadLayer, buildingLayer] = result.layers;
    expect(roadLayer?.name).toBe("New York City — OSM Road Network");
    expect(buildingLayer?.name).toBe("New York City — OSM Building Footprints");
    for (const layer of result.layers) {
      expect(layer.sourceKind).toBe("external");
      expect(layer.group).toBe("data");
      expect(layer.metadata?.externalService?.kind).toBe("overpass");
      expect(layer.metadata?.licenseAttribution?.license).toBe("ODbL");
      expect(layer.metadata?.crsSummary?.crs).toBe("EPSG:4326");
    }
    // Roads are real LineString geometry; buildings are polygons.
    expect(roadLayer?.metadata?.geometryType).toMatch(/line/i);
  });

  it("rejects an unknown dataset id without calling Overpass", async () => {
    const buildingsFetcher = vi.fn();
    const roadsFetcher = vi.fn();
    await expect(
      buildRealOsmCityLayers("not_a_city" as Parameters<typeof buildRealOsmCityLayers>[0], { buildingsFetcher, roadsFetcher }),
    ).rejects.toThrow(/Unknown teaching dataset/);
    expect(buildingsFetcher).not.toHaveBeenCalled();
    expect(roadsFetcher).not.toHaveBeenCalled();
  });
});
