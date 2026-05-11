// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import type { FeatureCollection, GeoJsonProperties, Polygon } from "geojson";
import type { BuildingFeature } from "@/features/urbanAnalytics/voxcity/buildingTypes";
import {
  buildingFeaturesToGeoJSON,
  DEFAULT_VOXCITY_GEO_ANCHOR,
} from "../voxCityProjection";
import {
  cacheOverpassBuildingsResult,
  clampOverpassBounds,
  clearOverpassCache,
  createOsmBuildingsLayerConfig,
  createRemoteCityJSONLayerConfig,
  createWmsRasterLayerConfig,
  fetchExternalService,
  fetchWfsFeatureCollection,
  getCachedOverpassBuildingsForBounds,
  loadWmsCapabilities,
  overpassResponseToGeoJSON,
  refreshRasterLayerConfig,
  createWfsLayerConfig,
  createXyzRasterLayerConfig,
  normalizeXyzTileUrlTemplate,
  STAMEN_WATERCOLOR_TILE_URL,
  XYZ_PRESETS,
  type OverpassBuildingsResult,
} from "../ExternalServiceConnector";

describe("ExternalServiceConnector", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    clearOverpassCache();
  });

  it("parses WMS capabilities and rewrites stale request params for GetMap URLs", async () => {
    const xml = `<?xml version="1.0"?>
      <WMS_Capabilities version="1.3.0">
        <Service><Title>Metro GIS</Title></Service>
        <Capability>
          <Layer>
            <Title>Root</Title>
            <CRS>EPSG:3857</CRS>
            <Layer>
              <Name>planning:parcels</Name>
              <Title>Planning Parcels</Title>
              <Abstract>Parcel overlay</Abstract>
              <CRS>EPSG:4326</CRS>
            </Layer>
          </Layer>
        </Capability>
      </WMS_Capabilities>`;
    const fetchMock = vi.fn(async () => new Response(xml, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const capabilities = await loadWmsCapabilities("https://maps.example.test/wms?service=WMS&request=GetCapabilities");
    expect(capabilities.title).toBe("Metro GIS");
    expect(capabilities.layers).toHaveLength(1);
    expect(capabilities.layers[0]?.name).toBe("planning:parcels");

    const layer = createWmsRasterLayerConfig(capabilities, capabilities.layers[0]!);
    const tileUrl = new URL(String(layer.sourceData));
    expect(tileUrl.searchParams.get("request")).toBe("GetMap");
    expect(tileUrl.searchParams.get("layers")).toBe("planning:parcels");
    expect(tileUrl.searchParams.get("bbox")).toBe("{bbox-epsg-3857}");
    expect(String(layer.sourceData)).toContain("{bbox-epsg-3857}");
    expect(layer.metadata?.externalService).toMatchObject({
      kind: "wms",
      endpoint: capabilities.endpoint,
      dependencyStatus: "live",
      corsMode: "tile-client",
      credentialMode: "unknown",
    });
    expect(layer.metadata?.crsSummary).toMatchObject({ crs: "EPSG:3857", status: "known", source: "external-service" });
    expect(layer.metadata?.scientificQA?.status).toBe("warning");
    expect(layer.metadata?.scientificQA?.issueIds).toEqual(expect.arrayContaining([
      expect.stringContaining("external-attribution-unknown"),
    ]));
    expect(layer.metadata?.evidenceArtifactId).toBe(`map-evidence-layer-${layer.id}`);
    expect(layer.metadata?.registry?.evidenceArtifactId).toBe(`map-evidence-layer-${layer.id}`);
  });

  it("parses WMTS capabilities and creates a tile URL template", async () => {
    const xml = `<?xml version="1.0"?>
      <Capabilities version="1.0.0" xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1">
        <ows:ServiceIdentification><ows:Title>Metro WMTS</ows:Title></ows:ServiceIdentification>
        <Contents>
          <Layer>
            <ows:Title>Imagery</ows:Title>
            <ows:Abstract>Orthophoto tiles</ows:Abstract>
            <ows:Identifier>metro:imagery</ows:Identifier>
            <Style isDefault="true"><ows:Identifier>default</ows:Identifier></Style>
            <Format>image/png</Format>
            <TileMatrixSetLink><TileMatrixSet>GoogleMapsCompatible</TileMatrixSet></TileMatrixSetLink>
            <ResourceURL format="image/png" resourceType="tile" template="https://tiles.example.test/wmts/metro:imagery/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png" />
          </Layer>
          <TileMatrixSet>
            <ows:Identifier>GoogleMapsCompatible</ows:Identifier>
            <ows:SupportedCRS>urn:ogc:def:crs:EPSG::3857</ows:SupportedCRS>
          </TileMatrixSet>
        </Contents>
      </Capabilities>`;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(xml, { status: 200 })));

    const capabilities = await loadWmsCapabilities("https://tiles.example.test/wmts?service=WMTS");
    expect(capabilities.serviceType).toBe("wmts");
    expect(capabilities.layers[0]?.availableCrs).toEqual(["urn:ogc:def:crs:EPSG::3857"]);

    const layer = createWmsRasterLayerConfig(capabilities, capabilities.layers[0]!);
    expect(layer.provenance?.method).toBe("WMTS GetTile raster overlay");
    expect(layer.sourceData).toBe("https://tiles.example.test/wmts/metro:imagery/GoogleMapsCompatible/{z}/{y}/{x}.png");
    expect(layer.metadata?.externalService?.kind).toBe("wmts");
    expect(layer.metadata?.externalService?.dependencyStatus).toBe("live");
    expect(layer.metadata?.registry?.publicationReadiness.caveats).toEqual(expect.arrayContaining([
      expect.stringContaining("Raster tile layers are visual references"),
    ]));
  });

  it("preserves prefixed WMTS TileMatrix identifiers in MapLibre tile templates", async () => {
    const xml = `<?xml version="1.0"?>
      <Capabilities version="1.0.0" xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1">
        <Contents>
          <Layer>
            <ows:Title>Prefixed imagery</ows:Title>
            <ows:Identifier>prefixed:imagery</ows:Identifier>
            <Style isDefault="true"><ows:Identifier>default</ows:Identifier></Style>
            <Format>image/png</Format>
            <TileMatrixSetLink><TileMatrixSet>EPSG:3857</TileMatrixSet></TileMatrixSetLink>
            <ResourceURL resourceType="tile" template="https://tiles.example.test/wmts/{Layer}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png" />
          </Layer>
          <TileMatrixSet>
            <ows:Identifier>EPSG:3857</ows:Identifier>
            <ows:SupportedCRS>urn:ogc:def:crs:EPSG::3857</ows:SupportedCRS>
            <TileMatrix><ows:Identifier>EPSG:3857:0</ows:Identifier></TileMatrix>
            <TileMatrix><ows:Identifier>EPSG:3857:1</ows:Identifier></TileMatrix>
          </TileMatrixSet>
        </Contents>
      </Capabilities>`;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(xml, { status: 200 })));

    const capabilities = await loadWmsCapabilities("https://tiles.example.test/wmts?service=WMTS");
    const layer = createWmsRasterLayerConfig(capabilities, capabilities.layers[0]!);

    expect(layer.sourceData).toBe("https://tiles.example.test/wmts/prefixed:imagery/EPSG:3857/EPSG:3857:{z}/{y}/{x}.png");
  });

  it("requests WFS GeoJSON with the current bbox filter", async () => {
    const geojson = {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: { type: "Point", coordinates: [13.4, 52.5] }, properties: { id: 1 } }],
    };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(geojson), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWfsFeatureCollection(
      { version: "2.0.0", endpoint: "https://maps.example.test/wfs?request=GetCapabilities", title: "Metro WFS", featureTypes: [] },
      { name: "urban:buildings", title: "Buildings", availableCrs: ["EPSG:4326"] },
      [13.37, 52.51, 13.39, 52.53],
    );

    expect(result.features).toHaveLength(1);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestedUrl.searchParams.get("request")).toBe("GetFeature");
    expect(requestedUrl.searchParams.get("typeNames")).toBe("urban:buildings");
    expect(requestedUrl.searchParams.get("srsName")).toBe("EPSG:4326");
    expect(requestedUrl.searchParams.get("bbox")).toBe("13.37,52.51,13.39,52.53,EPSG:4326");

    const layer = createWfsLayerConfig(
      { version: "2.0.0", endpoint: "https://maps.example.test/wfs", title: "Metro WFS", featureTypes: [] },
      { name: "urban:buildings", title: "Buildings", availableCrs: ["EPSG:4326"] },
      result,
      [13.37, 52.51, 13.39, 52.53],
    );
    expect(layer.metadata?.externalService).toMatchObject({
      kind: "wfs",
      dependencyStatus: "live",
      bounds: [13.37, 52.51, 13.39, 52.53],
      crs: "EPSG:4326",
    });
    expect(layer.metadata?.crsSummary).toMatchObject({ crs: "EPSG:4326", status: "known" });
    expect(layer.metadata?.scientificQA?.categorySummaries?.map((entry) => entry.category)).toContain("source-provenance");
  });

  it("adds a cache-bust token when refreshing raster tile layers", () => {
    const layer = refreshRasterLayerConfig({
      id: "raster",
      name: "Raster",
      type: "raster-tile",
      visible: true,
      opacity: 1,
      sourceData: "https://tiles.example.test/{z}/{x}/{y}.png",
      sourceKind: "external",
    }, "refresh-1");

    expect(layer.sourceData).toBe("https://tiles.example.test/{z}/{x}/{y}.png?_synapseRefresh=refresh-1");
    expect(layer.metadata?.dataVersion).toBeDefined();
    expect(layer.metadata?.evidenceArtifactId).toBe("map-evidence-layer-raster");
  });

  it("rejects XYZ tile templates missing required z/x/y tokens", () => {
    expect(() => createXyzRasterLayerConfig(
      "Incomplete tiles",
      "https://tiles.example.test/{z}/{x}.png",
    )).toThrow(/\{y\}/);

    const layer = createXyzRasterLayerConfig(
      "Complete tiles",
      "https://tiles.example.test/{z}/{x}/{y}.png",
    );
    expect(layer.type).toBe("raster-tile");
    expect(layer.sourceData).toBe("https://tiles.example.test/{z}/{x}/{y}.png");
    expect(layer.metadata?.externalService).toMatchObject({ kind: "xyz", dependencyStatus: "live", crs: "EPSG:3857" });
    expect(layer.metadata?.licenseAttribution?.requiresAttribution).toBe(false);
    expect(layer.metadata?.scientificQA?.status).toBe("warning");
  });

  it("uses the current Stadia-hosted endpoint for the Stamen Watercolor preset", () => {
    const preset = XYZ_PRESETS.find((entry) => entry.id === "stamen-watercolor");

    expect(preset?.urlTemplate).toBe(STAMEN_WATERCOLOR_TILE_URL);
    expect(preset?.urlTemplate).not.toContain("stamen-tiles.a.ssl.fastly.net");
    const layer = createXyzRasterLayerConfig(preset!.name, preset!.urlTemplate, preset!.attribution);
    expect(layer.sourceData).toBe(preset?.urlTemplate);
    expect(layer.metadata?.externalService?.kind).toBe("xyz");
    expect(layer.metadata?.licenseAttribution?.attribution).toBe(preset?.attribution);
    expect(layer.metadata?.externalService?.attribution).toBe(preset?.attribution);
  });

  it("migrates legacy Stamen Watercolor tile templates to the current endpoint", () => {
    const legacyUrl = "https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg";

    expect(normalizeXyzTileUrlTemplate(legacyUrl)).toBe(STAMEN_WATERCOLOR_TILE_URL);
    const layer = createXyzRasterLayerConfig("Stamen Watercolor", legacyUrl);
    expect(layer.sourceData).toBe(STAMEN_WATERCOLOR_TILE_URL);
    expect(refreshRasterLayerConfig(layer, "refresh-1").sourceData).toBe(`${STAMEN_WATERCOLOR_TILE_URL}?_synapseRefresh=refresh-1`);
  });

  it("surfaces CORS-shaped network failures as actionable service errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));

    await expect(fetchExternalService("https://maps.example.test/wms")).rejects.toMatchObject({
      code: "cors",
      message: expect.stringContaining("blocked by CORS"),
    });
  });

  it("surfaces request timeouts with the configured timeout policy", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      }),
    ));

    const request = fetchExternalService("https://maps.example.test/wfs", {}, { timeoutMs: 25 }).catch((error) => error);
    await vi.advanceTimersByTimeAsync(25);

    await expect(request).resolves.toMatchObject({
      code: "timeout",
      message: expect.stringContaining("within 1 seconds"),
    });
    vi.useRealTimers();
  });

  it("normalizes Overpass building geometry, attributes, viewport clamp, and bbox cache", () => {
    const featureCollection = overpassResponseToGeoJSON({
      elements: [{
        type: "way",
        id: 42,
        tags: {
          building: "residential",
          "building:levels": "4",
          height: "13.5 m",
          "addr:housenumber": "12",
          "addr:street": "Main",
          start_date: "1984",
        },
        geometry: [
          { lon: 13.37, lat: 52.51 },
          { lon: 13.371, lat: 52.51 },
          { lon: 13.371, lat: 52.511 },
          { lon: 13.37, lat: 52.511 },
        ],
      }],
    });

    expect(featureCollection.features).toHaveLength(1);
    const feature = featureCollection.features[0]!;
    expect(feature.id).toBe("osm-way-42");
    expect(feature.properties?.building_id).toBe("osm-way-42");
    expect(feature.properties?.building).toBe("residential");
    expect(feature.properties?.["building:levels"]).toBe(4);
    expect(feature.properties?.height).toBe(13.5);
    expect(feature.properties?.["addr:housenumber"]).toBe("12");
    expect(feature.properties?.["addr:street"]).toBe("Main");
    expect(feature.properties?.start_date).toBe("1984");
    expect(feature.properties?.osm_id).toBe("way/42");
    expect(feature.geometry.coordinates[0]?.at(-1)).toEqual(feature.geometry.coordinates[0]?.[0]);

    const boundsInfo = clampOverpassBounds([13.0, 52.0, 14.0, 53.0], 4);
    expect(boundsInfo.wasClamped).toBe(true);
    expect(boundsInfo.areaKm2).toBeLessThanOrEqual(4.01);
    expect(getCachedOverpassBuildingsForBounds([13.0, 52.0, 14.0, 53.0])).toBeNull();

    const cachedResult: OverpassBuildingsResult = {
      featureCollection,
      requestedBounds: boundsInfo.requestedBounds,
      clampedBounds: boundsInfo.clampedBounds,
      areaKm2: boundsInfo.areaKm2,
      wasClamped: boundsInfo.wasClamped,
      cacheKey: boundsInfo.cacheKey,
      cacheHit: false,
      fetchedAt: "2026-01-01T00:00:00.000Z",
      provenance: "OpenStreetMap contributors",
    };
    cacheOverpassBuildingsResult(cachedResult);

    const cached = getCachedOverpassBuildingsForBounds([13.0, 52.0, 14.0, 53.0]);
    expect(cached?.cacheHit).toBe(true);

    const layer = createOsmBuildingsLayerConfig(cached!);
    expect(layer.metadata?.externalService).toMatchObject({
      kind: "overpass",
      dependencyStatus: "cached",
      cacheHit: true,
      license: "ODbL",
    });
    expect(layer.metadata?.licenseAttribution).toMatchObject({ license: "ODbL", attribution: expect.stringContaining("OpenStreetMap") });
    expect(layer.metadata?.scientificQA?.issueIds).toEqual(expect.arrayContaining([
      expect.stringContaining("external-dependency-review"),
    ]));
  });

  it("passes through already-geographic VoxCity coordinates when requested", () => {
    const building: BuildingFeature = {
      id: "geo-building",
      footprint: {
        outer: [[13.4, 52.5], [13.401, 52.5], [13.401, 52.501], [13.4, 52.501], [13.4, 52.5]],
      },
      attributes: {},
    };

    const anchored = buildingFeaturesToGeoJSON([building], DEFAULT_VOXCITY_GEO_ANCHOR);
    const passthrough = buildingFeaturesToGeoJSON([building], DEFAULT_VOXCITY_GEO_ANCHOR, { projectionMode: "passthrough" });

    expect(passthrough.features[0]?.geometry.coordinates[0]?.[0]).toEqual([13.4, 52.5]);
    expect(anchored.features[0]?.geometry.coordinates[0]?.[0]).not.toEqual([13.4, 52.5]);
  });

  it("keeps remote CityJSON CRS unknown when the source lacks a reference system", () => {
    const featureCollection: FeatureCollection<Polygon, GeoJsonProperties> = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [[[13.4, 52.5], [13.401, 52.5], [13.401, 52.501], [13.4, 52.501], [13.4, 52.5]]] },
        properties: { id: "city-object-1" },
      }],
    };

    const layer = createRemoteCityJSONLayerConfig({
      objects: [{
        id: "city-object-1",
        type: "Building",
        attributes: {},
        surfaces: [],
        bbox: [13.4, 52.5, 0, 13.401, 52.501, 18],
        children: [],
        parents: [],
        lod: "2.2",
      }],
      summary: {
        version: "2.0",
        referenceSystem: null,
        objectCount: 1,
        objectTypeCounts: { Building: 1 },
        semanticSurfaceCounts: {},
        attributeKeys: [],
        vertexCount: 4,
        bbox: [13.4, 52.5, 0, 13.401, 52.501, 18],
        parseTimeMs: 12,
      },
    }, "https://cityjson.example.test/model.json", featureCollection);

    expect(layer.metadata?.externalService?.kind).toBe("cityjson");
    expect(layer.metadata?.externalService?.crs).toBeUndefined();
    expect(layer.metadata?.crsSummary).toMatchObject({ crs: null, status: "unknown" });
    expect(layer.metadata?.scientificQA?.issueIds).toEqual(expect.arrayContaining([
      expect.stringContaining("external-crs-unknown"),
    ]));
    expect(layer.metadata?.datasetContext?.crs).toBeUndefined();
  });
});

const describeLive = process.env.RUN_EXTERNAL_SERVICE_SMOKE === "1" ? describe : describe.skip;

describeLive("ExternalServiceConnector live service smoke tests", () => {
  it("loads a public national mapping WMS capabilities document and creates a renderable raster template", async () => {
    const capabilities = await loadWmsCapabilities("https://sgx.geodatenzentrum.de/wms_topplus_open?service=WMS");
    expect(capabilities.layers.length).toBeGreaterThan(0);

    const layer = createWmsRasterLayerConfig(capabilities, capabilities.layers[0]!);
    expect(layer.type).toBe("raster-tile");
    expect(String(layer.sourceData)).toContain("GetMap");
  }, 20_000);

  it("validates a real XYZ tile endpoint with an HTTP response", async () => {
    const response = await fetchExternalService("https://tile.opentopomap.org/0/0/0.png", { method: "GET" }, { accept: "image/png", timeoutMs: 10_000 });
    expect(response.ok).toBe(true);
  }, 20_000);
});
