import { simplify as simplifyGeoJson } from "@turf/turf";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL,
  type LayerCrsSummary,
  type MapVectorTileLayerMetadata,
  type MapVectorTileZoomLevelMetadata,
} from "@/centerpanel/components/map/mapTypes";
import type { SourceHandle, SourceHandleVectorTileMetadata } from "../contracts/gisContracts";
import { geomBbox, type ViewportExtent } from "../streaming/ExtentQueryEngine";

export const VECTOR_TILE_DEFAULT_ZOOM_LEVELS = [4, 8, 12, 15] as const;
export const VECTOR_TILE_DEFAULT_TILE_SIZE = 512;
export const VECTOR_TILE_FULL_PRECISION_ZOOM = 15;
export const VECTOR_TILE_MAX_TILES_PER_FEATURE = 64;
export const VECTOR_TILE_MAX_VIEWPORT_TILES = 256;

export const VECTOR_TILE_GENERALIZATION_CAVEAT =
  "Vector data is rendered as scale-appropriate tiles; low zooms use generalized geometry for display.";

export const VECTOR_TILE_METRIC_CAVEAT =
  "Source layer is tiled (simplified); low-zoom geometry is generalized, so metric results should be treated as approximate unless rerun against full-resolution source geometry.";

const WEB_MERCATOR_MAX_LATITUDE = 85.05112878;

export interface VectorTilePipelineOptions {
  zoomLevels?: readonly number[];
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
  sourceId?: string;
  sourceLayer?: string;
  sourceUrl?: string;
  maxTilesPerFeature?: number;
  toleranceByZoom?: Readonly<Record<number, number>>;
}

export interface VectorTileAddress {
  z: number;
  x: number;
  y: number;
  id: string;
}

export interface VectorTileFeatureEntry {
  featureIndex: number;
  feature: Feature;
}

export interface VectorTileFeatureBucket {
  address: VectorTileAddress;
  entries: VectorTileFeatureEntry[];
  featureCollection: FeatureCollection;
  featureCount: number;
  coordinateCount: number;
}

export interface VectorTileZoomBundle {
  zoom: number;
  tolerance: number;
  tiles: VectorTileFeatureBucket[];
  metadata: MapVectorTileZoomLevelMetadata;
}

export interface VectorTilePipeline {
  metadata: MapVectorTileLayerMetadata;
  zooms: VectorTileZoomBundle[];
}

export interface VectorTileRenderSlice {
  zoom: number;
  sourceZoom: number;
  featureCollection: FeatureCollection;
  tileCount: number;
  featureCount: number;
  coordinateCount: number;
  caveats: string[];
}

export interface PmtilesVectorTileMetadataInput {
  sourceUrl: string;
  sourceId?: string;
  sourceLayer?: string;
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
  caveats?: readonly string[];
}

export interface VectorTileSourceHandleInput {
  sourceId: string;
  sourceMode: "pmtiles" | "on-the-fly";
  crsSummary: LayerCrsSummary;
  featureCount: number | null;
  sourceRef?: string;
  sizeBytes?: number;
  sourceLayer?: string;
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
  caveats?: readonly string[];
}

export function resolveVectorTileTolerance(
  zoom: number,
  toleranceByZoom: Readonly<Record<number, number>> | undefined = undefined,
): number {
  const roundedZoom = clampZoom(zoom);
  const explicit = toleranceByZoom?.[roundedZoom];
  if (explicit != null) return Math.max(0, explicit);
  if (roundedZoom >= VECTOR_TILE_FULL_PRECISION_ZOOM) return 0;

  const zoomsBelowFullPrecision = VECTOR_TILE_FULL_PRECISION_ZOOM - roundedZoom;
  return Math.min(0.25, 0.000_025 * 2 ** zoomsBelowFullPrecision);
}

export function countGeometryCoordinates(geometry: Geometry | null | undefined): number {
  if (!geometry) return 0;

  function countPositions(value: unknown): number {
    if (!Array.isArray(value)) return 0;
    if (typeof value[0] === "number" && typeof value[1] === "number") return 1;
    return value.reduce<number>((sum, entry) => sum + countPositions(entry), 0);
  }

  if (geometry.type === "GeometryCollection") {
    return geometry.geometries.reduce((sum, child) => sum + countGeometryCoordinates(child), 0);
  }
  return "coordinates" in geometry ? countPositions(geometry.coordinates) : 0;
}

export function countFeatureCollectionCoordinates(featureCollection: FeatureCollection): number {
  return featureCollection.features.reduce((sum, feature) => sum + countGeometryCoordinates(feature.geometry), 0);
}

export function simplifyFeatureCollectionForZoom(
  featureCollection: FeatureCollection,
  zoom: number,
  options: Pick<VectorTilePipelineOptions, "toleranceByZoom"> = {},
): FeatureCollection {
  const tolerance = resolveVectorTileTolerance(zoom, options.toleranceByZoom);
  if (tolerance <= 0) return cloneFeatureCollection(featureCollection);

  return {
    type: "FeatureCollection",
    features: featureCollection.features.map((feature) => simplifyFeature(feature, tolerance)),
  };
}

export function buildScaleAppropriateVectorTiles(
  featureCollection: FeatureCollection,
  zoom: number,
  options: Pick<VectorTilePipelineOptions, "maxTilesPerFeature" | "toleranceByZoom"> = {},
): VectorTileZoomBundle {
  const sourceZoom = clampZoom(zoom);
  const maxTilesPerFeature = options.maxTilesPerFeature ?? VECTOR_TILE_MAX_TILES_PER_FEATURE;
  const tolerance = resolveVectorTileTolerance(sourceZoom, options.toleranceByZoom);
  const originalCoordinateCount = countFeatureCollectionCoordinates(featureCollection);
  const simplified = simplifyFeatureCollectionForZoom(featureCollection, sourceZoom, options);
  const simplifiedCoordinateCount = countFeatureCollectionCoordinates(simplified);
  const bucketsById = new Map<string, { address: VectorTileAddress; entries: VectorTileFeatureEntry[] }>();

  simplified.features.forEach((feature, featureIndex) => {
    if (!feature.geometry) return;
    const bbox = geomBbox(feature.geometry);
    if (!bbox) return;
    const addresses = tileAddressesForBounds(bbox, sourceZoom, maxTilesPerFeature);
    for (const address of addresses) {
      const existing = bucketsById.get(address.id);
      if (existing) {
        existing.entries.push({ featureIndex, feature });
      } else {
        bucketsById.set(address.id, { address, entries: [{ featureIndex, feature }] });
      }
    }
  });

  const tiles = Array.from(bucketsById.values())
    .sort((a, b) => a.address.id.localeCompare(b.address.id))
    .map(({ address, entries }) => buildTileBucket(address, entries));

  return {
    zoom: sourceZoom,
    tolerance,
    tiles,
    metadata: {
      zoom: sourceZoom,
      tolerance,
      tileCount: tiles.length,
      featureCount: simplified.features.length,
      originalCoordinateCount,
      simplifiedCoordinateCount,
      simplificationRatio: originalCoordinateCount > 0
        ? simplifiedCoordinateCount / originalCoordinateCount
        : null,
    },
  };
}

export function buildVectorTilePipeline(
  featureCollection: FeatureCollection,
  options: VectorTilePipelineOptions = {},
): VectorTilePipeline {
  const zoomLevels = normalizeZoomLevels(options);
  const zooms = zoomLevels.map((zoom) => buildScaleAppropriateVectorTiles(featureCollection, zoom, options));
  const minZoom = Math.min(...zoomLevels);
  const maxZoom = Math.max(...zoomLevels);
  const tileSize = options.tileSize ?? VECTOR_TILE_DEFAULT_TILE_SIZE;
  const originalCoordinateCount = countFeatureCollectionCoordinates(featureCollection);
  const caveats = uniqueTexts([
    MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL,
    VECTOR_TILE_GENERALIZATION_CAVEAT,
    ...(options.sourceUrl ? [`Tile source: ${options.sourceUrl}`] : []),
  ]);

  return {
    metadata: {
      version: 1,
      sourceMode: "on-the-fly",
      sourceFormat: "geojson",
      generalization: "zoom-dependent",
      caveatLabel: MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL,
      caveats,
      minZoom,
      maxZoom,
      tileSize,
      originalFeatureCount: featureCollection.features.length,
      originalCoordinateCount,
      zoomLevels: zooms.map((entry) => entry.metadata),
      ...(options.sourceId ? { sourceId: options.sourceId } : {}),
      ...(options.sourceLayer ? { sourceLayer: options.sourceLayer } : {}),
      ...(options.sourceUrl ? { sourceUrl: options.sourceUrl } : {}),
    },
    zooms,
  };
}

export function buildOnTheFlyVectorTileLayerMetadata(
  featureCollection: FeatureCollection,
  options: VectorTilePipelineOptions = {},
): MapVectorTileLayerMetadata {
  return buildVectorTilePipeline(featureCollection, options).metadata;
}

export function buildPmtilesVectorTileLayerMetadata(
  input: PmtilesVectorTileMetadataInput,
): MapVectorTileLayerMetadata {
  const minZoom = clampZoom(input.minZoom ?? 0);
  const maxZoom = Math.max(minZoom, clampZoom(input.maxZoom ?? 15));
  const caveats = uniqueTexts([
    MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL,
    VECTOR_TILE_GENERALIZATION_CAVEAT,
    "PMTiles vector layers may contain provider-defined simplification by zoom; inspect source metadata before precision-sensitive analysis.",
    ...(input.caveats ?? []),
  ]);

  return {
    version: 1,
    sourceMode: "pmtiles",
    sourceFormat: "pmtiles",
    generalization: "zoom-dependent",
    caveatLabel: MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL,
    caveats,
    minZoom,
    maxZoom,
    tileSize: input.tileSize ?? VECTOR_TILE_DEFAULT_TILE_SIZE,
    originalFeatureCount: null,
    originalCoordinateCount: null,
    zoomLevels: [],
    sourceUrl: input.sourceUrl,
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    ...(input.sourceLayer ? { sourceLayer: input.sourceLayer } : {}),
  };
}

export function buildVectorTileRenderFeatureCollection(
  pipeline: VectorTilePipeline,
  extent: ViewportExtent,
  zoom: number,
): VectorTileRenderSlice {
  const sourceZoom = resolveSourceZoom(pipeline.zooms, zoom);
  const bundle = pipeline.zooms.find((entry) => entry.zoom === sourceZoom) ?? pipeline.zooms[0];
  if (!bundle) {
    return {
      zoom: clampZoom(zoom),
      sourceZoom: clampZoom(zoom),
      featureCollection: { type: "FeatureCollection", features: [] },
      tileCount: 0,
      featureCount: 0,
      coordinateCount: 0,
      caveats: [...pipeline.metadata.caveats],
    };
  }

  const wantedTiles = new Set(tileAddressesForExtent(extent, bundle.zoom, VECTOR_TILE_MAX_VIEWPORT_TILES).map((tile) => tile.id));
  const seenFeatureIndexes = new Set<number>();
  const features: Feature[] = [];
  let tileCount = 0;

  for (const tile of bundle.tiles) {
    if (!wantedTiles.has(tile.address.id)) continue;
    tileCount += 1;
    for (const entry of tile.entries) {
      if (seenFeatureIndexes.has(entry.featureIndex)) continue;
      seenFeatureIndexes.add(entry.featureIndex);
      features.push(entry.feature);
    }
  }

  const featureCollection: FeatureCollection = { type: "FeatureCollection", features };
  return {
    zoom: clampZoom(zoom),
    sourceZoom: bundle.zoom,
    featureCollection,
    tileCount,
    featureCount: features.length,
    coordinateCount: countFeatureCollectionCoordinates(featureCollection),
    caveats: [...pipeline.metadata.caveats],
  };
}

export function buildVectorTileSourceHandle(input: VectorTileSourceHandleInput): SourceHandle {
  const minZoom = clampZoom(input.minZoom ?? 0);
  const maxZoom = Math.max(minZoom, clampZoom(input.maxZoom ?? VECTOR_TILE_FULL_PRECISION_ZOOM));
  const vectorTile: SourceHandleVectorTileMetadata = {
    sourceMode: input.sourceMode,
    generalization: "zoom-dependent",
    minZoom,
    maxZoom,
    tileSize: input.tileSize ?? VECTOR_TILE_DEFAULT_TILE_SIZE,
    ...(input.sourceLayer ? { sourceLayer: input.sourceLayer } : {}),
  };
  const caveats = uniqueTexts([
    MAP_VECTOR_TILE_SIMPLIFICATION_CAVEAT_LABEL,
    VECTOR_TILE_GENERALIZATION_CAVEAT,
    ...(input.caveats ?? []),
  ]);

  const handle: SourceHandle = {
    sourceId: input.sourceId,
    kind: input.sourceMode === "pmtiles" ? "external" : "imported",
    storageMode: input.sourceMode === "pmtiles" ? "url-refetch" : "worker-table",
    restoreStatus: input.sourceMode === "pmtiles" ? "recoverable" : "metadata-only",
    format: input.sourceMode === "pmtiles" ? "pmtiles" : "geojson",
    crsSummary: input.crsSummary,
    featureCount: input.featureCount,
    caveats,
    profiledAt: new Date().toISOString(),
    vectorTile,
  };

  if (input.sourceRef) handle.sourceRef = input.sourceRef;
  if (input.sizeBytes != null) handle.sizeBytes = input.sizeBytes;
  return handle;
}

function simplifyFeature(feature: Feature, tolerance: number): Feature {
  if (!feature.geometry || isPointGeometry(feature.geometry)) return cloneFeature(feature);
  try {
    const simplified = simplifyGeoJson(feature, {
      tolerance,
      highQuality: false,
      mutate: false,
    }) as Feature;
    return {
      ...simplified,
      ...(feature.id != null ? { id: feature.id } : {}),
      properties: simplified.properties ?? feature.properties ?? null,
    };
  } catch {
    return cloneFeature(feature);
  }
}

function isPointGeometry(geometry: Geometry): boolean {
  return geometry.type === "Point" || geometry.type === "MultiPoint";
}

function cloneFeatureCollection(featureCollection: FeatureCollection): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: featureCollection.features.map(cloneFeature),
  };
}

function cloneFeature(feature: Feature): Feature {
  return {
    ...feature,
    properties: feature.properties ? { ...feature.properties } : feature.properties ?? null,
    geometry: feature.geometry ? JSON.parse(JSON.stringify(feature.geometry)) as Geometry : null,
  };
}

function buildTileBucket(address: VectorTileAddress, entries: VectorTileFeatureEntry[]): VectorTileFeatureBucket {
  const featureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: entries.map((entry) => entry.feature),
  };
  return {
    address,
    entries,
    featureCollection,
    featureCount: entries.length,
    coordinateCount: countFeatureCollectionCoordinates(featureCollection),
  };
}

function normalizeZoomLevels(options: VectorTilePipelineOptions): number[] {
  const minZoom = clampZoom(options.minZoom ?? 0);
  const maxZoom = Math.max(minZoom, clampZoom(options.maxZoom ?? VECTOR_TILE_FULL_PRECISION_ZOOM));
  const rawZooms = options.zoomLevels?.length ? options.zoomLevels : VECTOR_TILE_DEFAULT_ZOOM_LEVELS;
  const zooms = rawZooms
    .map(clampZoom)
    .filter((zoom) => zoom >= minZoom && zoom <= maxZoom);
  const unique = Array.from(new Set(zooms));
  if (!unique.includes(minZoom)) unique.push(minZoom);
  if (!unique.includes(maxZoom)) unique.push(maxZoom);
  return unique.sort((a, b) => a - b);
}

function resolveSourceZoom(bundles: readonly VectorTileZoomBundle[], zoom: number): number {
  const roundedZoom = clampZoom(zoom);
  const sorted = bundles.map((entry) => entry.zoom).sort((a, b) => a - b);
  let selected = sorted[0] ?? roundedZoom;
  for (const candidate of sorted) {
    if (candidate <= roundedZoom) selected = candidate;
  }
  return selected;
}

function tileAddressesForExtent(extent: ViewportExtent, zoom: number, maxTiles: number): VectorTileAddress[] {
  return tileAddressesForBounds([extent.west, extent.south, extent.east, extent.north], zoom, maxTiles);
}

function tileAddressesForBounds(
  bbox: [number, number, number, number],
  zoom: number,
  maxTiles: number,
): VectorTileAddress[] {
  const sourceZoom = clampZoom(zoom);
  const west = clampLongitude(Math.min(bbox[0], bbox[2]));
  const east = clampLongitude(Math.max(bbox[0], bbox[2]));
  const south = clampLatitude(Math.min(bbox[1], bbox[3]));
  const north = clampLatitude(Math.max(bbox[1], bbox[3]));
  const minX = longitudeToTileX(west, sourceZoom);
  const maxX = longitudeToTileX(east, sourceZoom);
  const northY = latitudeToTileY(north, sourceZoom);
  const southY = latitudeToTileY(south, sourceZoom);
  const minY = Math.min(northY, southY);
  const maxY = Math.max(northY, southY);
  const totalTiles = (maxX - minX + 1) * (maxY - minY + 1);

  if (totalTiles > maxTiles) {
    const centerLng = (west + east) / 2;
    const centerLat = (south + north) / 2;
    return [buildTileAddress(sourceZoom, longitudeToTileX(centerLng, sourceZoom), latitudeToTileY(centerLat, sourceZoom))];
  }

  const addresses: VectorTileAddress[] = [];
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      addresses.push(buildTileAddress(sourceZoom, x, y));
    }
  }
  return addresses;
}

function buildTileAddress(z: number, x: number, y: number): VectorTileAddress {
  return { z, x, y, id: `${z}/${x}/${y}` };
}

function longitudeToTileX(longitude: number, zoom: number): number {
  const tileCount = 2 ** zoom;
  return clampTileCoordinate(Math.floor(((clampLongitude(longitude) + 180) / 360) * tileCount), tileCount);
}

function latitudeToTileY(latitude: number, zoom: number): number {
  const tileCount = 2 ** zoom;
  const latRad = (clampLatitude(latitude) * Math.PI) / 180;
  const mercator = Math.log(Math.tan(latRad) + 1 / Math.cos(latRad));
  return clampTileCoordinate(Math.floor(((1 - mercator / Math.PI) / 2) * tileCount), tileCount);
}

function clampTileCoordinate(value: number, tileCount: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(tileCount - 1, Math.max(0, value));
}

function clampLongitude(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(180, Math.max(-180, value));
}

function clampLatitude(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(WEB_MERCATOR_MAX_LATITUDE, Math.max(-WEB_MERCATOR_MAX_LATITUDE, value));
}

function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(22, Math.max(0, Math.round(value)));
}

function uniqueTexts(values: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}