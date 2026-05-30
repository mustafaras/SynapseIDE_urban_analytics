import type { Feature, FeatureCollection, GeoJsonProperties, Polygon } from "geojson";
import { loadCityJSON } from "@/features/urbanAnalytics/voxcity/CityJSONLoader";
import type { CityJSONLoadResult } from "@/features/urbanAnalytics/voxcity/cityJsonTypes";
import {
  cityJSONObjectsToFootprintCollection,
  geoBoundsOfCollection,
} from "../voxCityProjection";
import type { GeoTiffMetadata } from "../raster/GeoTiffParser";
import type {
  SourceHandle,
  SourceHandleScene3DRuntimeMode,
  SourceHandleVerticalDatumMetadata,
  SourceHandleVerticalDatumSource,
} from "../contracts/gisContracts";

export interface VerticalDatumInput {
  value?: string | null;
  source?: SourceHandleVerticalDatumSource;
  caveats?: readonly string[];
  context?: string;
}

export interface TerrainElevationGrid {
  sourceId: string;
  width: number;
  height: number;
  bbox: [number, number, number, number];
  values: readonly number[];
  crs: string | null;
  noData: number | null;
  verticalDatum: SourceHandleVerticalDatumMetadata;
  caveats: string[];
}

export interface TerrainSampleResult {
  coordinate: [number, number];
  elevationM: number | null;
  status: "sampled" | "outside-extent" | "nodata";
  verticalDatum: SourceHandleVerticalDatumMetadata;
  caveats: string[];
}

export interface GroundedTerrainCollectionResult {
  collection: FeatureCollection<Polygon, GeoJsonProperties>;
  samples: TerrainSampleResult[];
  caveats: string[];
}

export interface CreateTerrainGridInput {
  sourceId: string;
  width: number;
  height: number;
  bbox: [number, number, number, number];
  values: readonly number[];
  crs?: string | null;
  noData?: number | null;
  verticalDatum?: VerticalDatumInput;
  caveats?: readonly string[];
}

export interface CreateDemTerrainSourceHandleInput {
  sourceId: string;
  title: string;
  metadata: Pick<GeoTiffMetadata, "width" | "height" | "bbox" | "epsgCode" | "noData" | "sizeBytes">;
  terrain?: TerrainElevationGrid;
  sourceRef?: string;
  profiledAt?: string;
  verticalDatum?: VerticalDatumInput;
  caveats?: readonly string[];
}

export interface ImportCityJSONSceneSourceInput {
  json: string;
  sourceId: string;
  title: string;
  sourceRef?: string;
  runtimeMode?: SourceHandleScene3DRuntimeMode;
  verticalDatum?: VerticalDatumInput;
  terrain?: TerrainElevationGrid;
  profiledAt?: string;
}

export interface CityJSONSceneImportResult {
  loadResult: CityJSONLoadResult;
  footprintCollection: FeatureCollection<Polygon, GeoJsonProperties>;
  sourceHandle: SourceHandle;
  runtimeMode: SourceHandleScene3DRuntimeMode;
  caveats: string[];
}

export interface ImportTiles3DSceneSourceInput {
  tilesetJson: string | ArrayBuffer;
  sourceId: string;
  title: string;
  sourceRef?: string;
  runtimeMode?: SourceHandleScene3DRuntimeMode;
  verticalDatum?: VerticalDatumInput;
  profiledAt?: string;
}

export interface Tiles3DSceneImportResult {
  sourceHandle: SourceHandle;
  runtimeMode: SourceHandleScene3DRuntimeMode;
  caveats: string[];
}

type Tiles3DBoundingVolume = {
  region?: number[];
  box?: number[];
  sphere?: number[];
};

type Tiles3DTileLike = {
  boundingVolume?: Tiles3DBoundingVolume;
  geometricError?: number;
  refine?: string;
  content?: { uri?: string; url?: string } | { uri?: string; url?: string }[];
  children?: Tiles3DTileLike[];
};

type Tiles3DTilesetLike = {
  asset?: { version?: string };
  geometricError?: number;
  root?: Tiles3DTileLike;
};

const RAD_TO_DEG = 180 / Math.PI;

function nowIso(): string {
  return new Date().toISOString();
}

function uniqueTextList(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function createUnknownVerticalDatumCaveat(context: string | undefined): string {
  return context
    ? `${context}; verify the vertical datum before comparing terrain, building heights, or 3D Tiles elevations.`
    : "No vertical datum was declared; verify it before comparing terrain, building heights, or 3D Tiles elevations.";
}

export function buildVerticalDatumMetadata(input: VerticalDatumInput = {}): SourceHandleVerticalDatumMetadata {
  const value = input.value?.trim();
  const caveats = uniqueTextList(input.caveats ?? []);

  if (value) {
    return {
      status: "known",
      value,
      source: input.source ?? "user-declared",
      caveats,
    };
  }

  return {
    status: "unknown",
    value: null,
    source: input.source ?? "unavailable",
    caveats: uniqueTextList([...caveats, createUnknownVerticalDatumCaveat(input.context)]),
  };
}

function createCrsSummary(crs: string | null, source: "import-source" | "external-service") {
  return {
    crs,
    status: crs ? "known" as const : "unknown" as const,
    source,
    notes: crs
      ? [`3D source declared ${crs}.`]
      : ["3D source did not declare a CRS; spatial placement requires review."],
  };
}

function elevationRange(values: readonly number[], noData: number | null): [number, number] | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (noData !== null && Object.is(value, noData)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return min === Number.POSITIVE_INFINITY ? null : [min, max];
}

export function createTerrainElevationGrid(input: CreateTerrainGridInput): TerrainElevationGrid {
  if (input.width <= 0 || input.height <= 0) {
    throw new Error("Terrain grid dimensions must be positive.");
  }
  if (input.values.length !== input.width * input.height) {
    throw new Error("Terrain grid value count must equal width × height.");
  }

  const verticalDatum = buildVerticalDatumMetadata({
    source: "geotiff-metadata",
    context: "DEM terrain does not declare an explicit vertical datum",
    ...input.verticalDatum,
  });

  return {
    sourceId: input.sourceId,
    width: input.width,
    height: input.height,
    bbox: [...input.bbox],
    values: [...input.values],
    crs: input.crs ?? null,
    noData: input.noData ?? null,
    verticalDatum,
    caveats: uniqueTextList([...(input.caveats ?? []), ...verticalDatum.caveats]),
  };
}

function readTerrainValue(terrain: TerrainElevationGrid, col: number, row: number): number | null {
  const value = terrain.values[row * terrain.width + col];
  if (!Number.isFinite(value)) return null;
  if (terrain.noData !== null && Object.is(value, terrain.noData)) return null;
  return value;
}

export function sampleTerrainAtCoordinate(
  terrain: TerrainElevationGrid,
  coordinate: [number, number],
): TerrainSampleResult {
  const [west, south, east, north] = terrain.bbox;
  const [x, y] = coordinate;
  if (x < west || x > east || y < south || y > north) {
    return {
      coordinate,
      elevationM: null,
      status: "outside-extent",
      verticalDatum: terrain.verticalDatum,
      caveats: [`Coordinate ${x.toFixed(6)}, ${y.toFixed(6)} is outside DEM terrain extent.`],
    };
  }

  const nx = east === west ? 0 : (x - west) / (east - west);
  const ny = north === south ? 0 : (north - y) / (north - south);
  const gridX = nx * (terrain.width - 1);
  const gridY = ny * (terrain.height - 1);
  const x0 = Math.max(0, Math.min(terrain.width - 1, Math.floor(gridX)));
  const y0 = Math.max(0, Math.min(terrain.height - 1, Math.floor(gridY)));
  const x1 = Math.max(0, Math.min(terrain.width - 1, x0 + 1));
  const y1 = Math.max(0, Math.min(terrain.height - 1, y0 + 1));
  const q00 = readTerrainValue(terrain, x0, y0);
  const q10 = readTerrainValue(terrain, x1, y0);
  const q01 = readTerrainValue(terrain, x0, y1);
  const q11 = readTerrainValue(terrain, x1, y1);

  if (q00 === null || q10 === null || q01 === null || q11 === null) {
    return {
      coordinate,
      elevationM: null,
      status: "nodata",
      verticalDatum: terrain.verticalDatum,
      caveats: ["DEM terrain sample intersects noData or invalid cells; building base elevation is unknown."],
    };
  }

  const tx = gridX - x0;
  const ty = gridY - y0;
  const top = q00 * (1 - tx) + q10 * tx;
  const bottom = q01 * (1 - tx) + q11 * tx;
  const elevationM = top * (1 - ty) + bottom * ty;

  return {
    coordinate,
    elevationM,
    status: "sampled",
    verticalDatum: terrain.verticalDatum,
    caveats: [...terrain.verticalDatum.caveats],
  };
}

function featureBaseCoordinate(feature: Feature<Polygon, GeoJsonProperties>): [number, number] | null {
  const ring = feature.geometry.coordinates[0];
  if (!ring || ring.length === 0) return null;
  let xSum = 0;
  let ySum = 0;
  let count = 0;
  for (const coordinate of ring) {
    const [x, y] = coordinate;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    xSum += x;
    ySum += y;
    count += 1;
  }
  return count > 0 ? [xSum / count, ySum / count] : null;
}

export function groundFeatureCollectionOnTerrain(
  collection: FeatureCollection<Polygon, GeoJsonProperties>,
  terrain: TerrainElevationGrid,
): GroundedTerrainCollectionResult {
  const samples: TerrainSampleResult[] = [];
  const caveats: string[] = [];
  const features = collection.features.map((feature) => {
    const coordinate = featureBaseCoordinate(feature);
    if (!coordinate) {
      const nextCaveat = "Building footprint has no valid base coordinate for terrain sampling.";
      caveats.push(nextCaveat);
      return {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          scene3d_grounded: false,
          scene3d_base_elevation_m: null,
          scene3d_terrain_source_id: terrain.sourceId,
          scene3d_vertical_datum_status: terrain.verticalDatum.status,
          scene3d_vertical_datum: terrain.verticalDatum.value,
          scene3d_grounding_caveat: nextCaveat,
        },
      };
    }

    const sample = sampleTerrainAtCoordinate(terrain, coordinate);
    samples.push(sample);
    caveats.push(...sample.caveats);

    return {
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        scene3d_grounded: sample.status === "sampled",
        scene3d_base_elevation_m: sample.elevationM,
        scene3d_terrain_source_id: terrain.sourceId,
        scene3d_vertical_datum_status: sample.verticalDatum.status,
        scene3d_vertical_datum: sample.verticalDatum.value,
        scene3d_grounding_caveat: sample.status === "sampled" ? null : sample.caveats.join(" "),
      },
    };
  });

  return {
    collection: { type: "FeatureCollection", features },
    samples,
    caveats: uniqueTextList(caveats),
  };
}

function resolveLods(loadResult: CityJSONLoadResult): string[] {
  return [...new Set(loadResult.objects.map((object) => object.lod).filter(Boolean))]
    .sort((a, b) => parseFloat(a) - parseFloat(b));
}

function withSceneSourceProperties(
  collection: FeatureCollection<Polygon, GeoJsonProperties>,
  sourceId: string,
  runtimeMode: SourceHandleScene3DRuntimeMode,
): FeatureCollection<Polygon, GeoJsonProperties> {
  return {
    ...collection,
    features: collection.features.map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        scene3d_source_id: sourceId,
        scene3d_runtime_mode: runtimeMode,
      },
    })),
  };
}

export function buildCityJSONSceneImportFromResult(
  loadResult: CityJSONLoadResult,
  input: Omit<ImportCityJSONSceneSourceInput, "json">,
): CityJSONSceneImportResult {
  const profiledAt = input.profiledAt ?? nowIso();
  const runtimeMode = input.runtimeMode ?? (input.sourceRef ? "real" : "sample");
  const referenceSystem = loadResult.summary.referenceSystem?.trim() || null;
  const projectionMode = referenceSystem?.includes("4326") ? "passthrough" : "anchored";
  const footprints = cityJSONObjectsToFootprintCollection(loadResult.objects, undefined, { projectionMode });
  const sourcedFootprints = withSceneSourceProperties(footprints, input.sourceId, runtimeMode);
  const grounded = input.terrain
    ? groundFeatureCollectionOnTerrain(sourcedFootprints, input.terrain)
    : { collection: sourcedFootprints, samples: [], caveats: [] } satisfies GroundedTerrainCollectionResult;
  const verticalDatum = buildVerticalDatumMetadata({
    source: input.verticalDatum?.source ?? "cityjson-metadata",
    context: referenceSystem
      ? `CityJSON declares ${referenceSystem}, but no explicit vertical datum was recorded`
      : "CityJSON metadata does not declare a reference system or vertical datum",
    ...input.verticalDatum,
  });
  const caveats = uniqueTextList([
    ...verticalDatum.caveats,
    ...grounded.caveats,
    ...(projectionMode === "anchored"
      ? ["CityJSON footprints are anchored into EPSG:4326 for map preview; verify the declared CRS before metric analysis."]
      : []),
  ]);
  const bbox2d = geoBoundsOfCollection(grounded.collection);
  const bbox3d = loadResult.summary.bbox ?? (bbox2d ? [bbox2d[0], bbox2d[1], 0, bbox2d[2], bbox2d[3], 0] : null);

  const sourceHandle: SourceHandle = {
    sourceId: input.sourceId,
    kind: input.sourceRef ? "external" : "imported",
    storageMode: input.sourceRef ? "url-refetch" : "metadata-only",
    restoreStatus: input.sourceRef ? "external-reference" : "metadata-only",
    format: "cityjson",
    crsSummary: createCrsSummary(referenceSystem, input.sourceRef ? "external-service" : "import-source"),
    featureCount: loadResult.summary.objectCount,
    scene3d: {
      sourceKind: "cityjson",
      runtimeMode,
      verticalDatum,
      objectCount: loadResult.summary.objectCount,
      lods: resolveLods(loadResult),
      bbox3d,
    },
    caveats,
    profiledAt,
  };

  if (input.sourceRef) sourceHandle.sourceRef = input.sourceRef;

  return {
    loadResult,
    footprintCollection: grounded.collection,
    sourceHandle,
    runtimeMode,
    caveats,
  };
}

export async function importCityJSONSceneSource(
  input: ImportCityJSONSceneSourceInput,
): Promise<CityJSONSceneImportResult> {
  const loadResult = await loadCityJSON(input.json);
  return buildCityJSONSceneImportFromResult(loadResult, input);
}

export function createDemTerrainSourceHandle(input: CreateDemTerrainSourceHandleInput): SourceHandle {
  const profiledAt = input.profiledAt ?? nowIso();
  const verticalDatum = input.terrain?.verticalDatum ?? buildVerticalDatumMetadata({
    source: input.verticalDatum?.source ?? "geotiff-metadata",
    context: "DEM GeoTIFF metadata does not declare an explicit vertical datum",
    ...input.verticalDatum,
  });
  const range = input.terrain ? elevationRange(input.terrain.values, input.terrain.noData) : null;
  const caveats = uniqueTextList([
    ...(input.caveats ?? []),
    ...verticalDatum.caveats,
    ...(input.metadata.epsgCode ? [] : ["DEM GeoTIFF does not declare an EPSG CRS; terrain placement requires review."]),
    ...(input.metadata.noData === null ? ["DEM GeoTIFF has no noData value; terrain sampling assumes every cell is valid."] : []),
  ]);

  const handle: SourceHandle = {
    sourceId: input.sourceId,
    kind: input.sourceRef ? "external" : "imported",
    storageMode: input.sourceRef ? "url-refetch" : "metadata-only",
    restoreStatus: input.sourceRef ? "external-reference" : "metadata-only",
    format: "geotiff",
    crsSummary: createCrsSummary(input.metadata.epsgCode, input.sourceRef ? "external-service" : "import-source"),
    featureCount: null,
    scene3d: {
      sourceKind: "terrain-dem",
      runtimeMode: input.sourceRef ? "real" : "metadata-only",
      verticalDatum,
      objectCount: null,
      lods: [],
      bbox3d: input.metadata.bbox ? [input.metadata.bbox[0], input.metadata.bbox[1], range?.[0] ?? 0, input.metadata.bbox[2], input.metadata.bbox[3], range?.[1] ?? 0] : null,
      terrain: {
        sourceKind: "dem-geotiff",
        width: input.metadata.width,
        height: input.metadata.height,
        bbox: input.metadata.bbox,
        elevationRangeM: range,
        sampleCount: input.terrain?.values.length ?? null,
      },
    },
    caveats,
    profiledAt,
  };

  if (input.metadata.sizeBytes != null) handle.sizeBytes = input.metadata.sizeBytes;
  if (input.sourceRef) handle.sourceRef = input.sourceRef;
  return handle;
}

function tilesetBuffer(input: string | ArrayBuffer): ArrayBuffer {
  if (typeof input !== "string") return input;
  return new TextEncoder().encode(input).buffer;
}

function countTiles(tile: Tiles3DTileLike | undefined): { tileCount: number; contentCount: number } {
  if (!tile) return { tileCount: 0, contentCount: 0 };
  const content = Array.isArray(tile.content) ? tile.content : tile.content ? [tile.content] : [];
  return (tile.children ?? []).reduce(
    (acc, child) => {
      const childCounts = countTiles(child);
      return {
        tileCount: acc.tileCount + childCounts.tileCount,
        contentCount: acc.contentCount + childCounts.contentCount,
      };
    },
    { tileCount: 1, contentCount: content.length },
  );
}

function bbox3dFromTileset(tile: Tiles3DTileLike | undefined): [number, number, number, number, number, number] | null {
  const volume = tile?.boundingVolume;
  if (!volume) return null;
  if (volume.region && volume.region.length >= 6) {
    const [west, south, east, north, minZ, maxZ] = volume.region;
    return [west * RAD_TO_DEG, south * RAD_TO_DEG, minZ, east * RAD_TO_DEG, north * RAD_TO_DEG, maxZ];
  }
  if (volume.box && volume.box.length >= 12) {
    const [centerX, centerY, centerZ] = volume.box;
    return [centerX, centerY, centerZ, centerX, centerY, centerZ];
  }
  if (volume.sphere && volume.sphere.length >= 4) {
    const [centerX, centerY, centerZ, radius] = volume.sphere;
    return [centerX - radius, centerY - radius, centerZ - radius, centerX + radius, centerY + radius, centerZ + radius];
  }
  return null;
}

export async function importTiles3DSceneSource(
  input: ImportTiles3DSceneSourceInput,
): Promise<Tiles3DSceneImportResult> {
  const { parse } = await import("@loaders.gl/core");
  const { Tiles3DLoader } = await import("@loaders.gl/3d-tiles");
  const parsed = await parse(
    tilesetBuffer(input.tilesetJson),
    Tiles3DLoader,
    { "3d-tiles": { isTileset: true, loadGLTF: false } },
    { url: input.sourceRef ?? "tileset.json" },
  ) as Tiles3DTilesetLike;
  const profiledAt = input.profiledAt ?? nowIso();
  const runtimeMode = input.runtimeMode ?? (input.sourceRef ? "real" : "metadata-only");
  const verticalDatum = buildVerticalDatumMetadata({
    source: input.verticalDatum?.source ?? "3d-tiles-metadata",
    context: "3D Tiles tileset metadata does not declare an explicit vertical datum",
    ...input.verticalDatum,
  });
  const counts = countTiles(parsed.root);
  const caveats = uniqueTextList([...verticalDatum.caveats]);

  const sourceHandle: SourceHandle = {
    sourceId: input.sourceId,
    kind: input.sourceRef ? "external" : "imported",
    storageMode: input.sourceRef ? "url-refetch" : "metadata-only",
    restoreStatus: input.sourceRef ? "external-reference" : "metadata-only",
    format: "3d-tiles",
    crsSummary: createCrsSummary(null, input.sourceRef ? "external-service" : "import-source"),
    featureCount: counts.tileCount,
    scene3d: {
      sourceKind: "3d-tiles",
      runtimeMode,
      verticalDatum,
      objectCount: null,
      lods: [],
      bbox3d: bbox3dFromTileset(parsed.root),
      tileset: {
        assetVersion: parsed.asset?.version ?? null,
        rootGeometricError: parsed.root?.geometricError ?? parsed.geometricError ?? null,
        tileCount: counts.tileCount,
        contentCount: counts.contentCount,
        rootRefine: parsed.root?.refine ?? null,
      },
    },
    caveats,
    profiledAt,
  };

  if (input.sourceRef) sourceHandle.sourceRef = input.sourceRef;
  return { sourceHandle, runtimeMode, caveats };
}
