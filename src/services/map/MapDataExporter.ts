import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { downloadBlob, downloadText } from "../../centerpanel/lib/download";
import type {
  DrawnFeature,
  MapPin,
  OverlayLayerConfig,
} from "../../centerpanel/components/map/mapTypes";
import { exportFeatureCollectionToGeoParquet } from "../data/pipeline";
import { resolveGeoJSONSourceToFeatureCollection } from "./MapDataImporter";

export type MapExportTarget = "pins" | "drawings" | "visible-layers";
export type MapExportFormat = "geojson" | "geoparquet";

export interface MapDataExportOptions {
  format?: MapExportFormat;
  precision?: number;
  prettyPrint?: boolean;
  includeProperties?: boolean;
  filename?: string;
  crs?: string;
}

export interface MapDataExportResult {
  format: MapExportFormat;
  collection: FeatureCollection;
  filename: string;
  mimeType: string;
  byteLength: number;
  json?: string;
  bytes?: Uint8Array;
  skippedLayers: string[];
}

function defaultFilename(target: MapExportTarget, format: MapExportFormat): string {
  const extension = format === "geoparquet" ? "geoparquet" : "geojson";
  return `map_${target.replace(/[^a-z-]+/gi, "_")}_${Date.now()}.${extension}`;
}

function cloneProperties(
  properties: GeoJsonProperties | undefined | null,
  includeProperties: boolean,
): GeoJsonProperties | null {
  if (!includeProperties) return null;
  return properties == null ? {} : JSON.parse(JSON.stringify(properties)) as GeoJsonProperties;
}

function roundCoordinateValue(value: number, precision: number): number {
  return Number(value.toFixed(precision));
}

function roundGeometryCoordinates(
  coords: GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][],
  precision: number,
): GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][] {
  if (!Array.isArray(coords) || coords.length === 0) return coords;
  if (typeof coords[0] === "number") {
    return (coords as GeoJSON.Position).map((value) =>
      typeof value === "number" ? roundCoordinateValue(value, precision) : value,
    ) as GeoJSON.Position;
  }
  return (coords as Array<
    GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][]
  >).map((entry) =>
    roundGeometryCoordinates(
      entry as GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][],
      precision,
    ),
  ) as GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][];
}

export function roundGeometry(geometry: Geometry, precision: number): Geometry {
  switch (geometry.type) {
    case "Point":
      return { ...geometry, coordinates: roundGeometryCoordinates(geometry.coordinates, precision) as GeoJSON.Position };
    case "MultiPoint":
    case "LineString":
      return { ...geometry, coordinates: roundGeometryCoordinates(geometry.coordinates, precision) as GeoJSON.Position[] };
    case "MultiLineString":
    case "Polygon":
      return { ...geometry, coordinates: roundGeometryCoordinates(geometry.coordinates, precision) as GeoJSON.Position[][] };
    case "MultiPolygon":
      return { ...geometry, coordinates: roundGeometryCoordinates(geometry.coordinates, precision) as GeoJSON.Position[][][] };
    case "GeometryCollection":
      return {
        ...geometry,
        geometries: geometry.geometries.map((child) => roundGeometry(child, precision)),
      };
    default:
      return geometry;
  }
}

export function roundFeatureCollection(
  collection: FeatureCollection,
  precision: number,
  includeProperties: boolean,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: collection.features.flatMap((feature) => {
      if (!feature.geometry) {
        return [];
      }

      return [{
        ...feature,
        geometry: roundGeometry(feature.geometry, precision),
        properties: cloneProperties(feature.properties, includeProperties),
      }];
    }),
  };
}

function cloneFeatureCollection(
  collection: FeatureCollection,
  includeProperties: boolean,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: collection.features.flatMap((feature) => {
      if (!feature.geometry) {
        return [];
      }

      return [{
        ...feature,
        geometry: JSON.parse(JSON.stringify(feature.geometry)) as Geometry,
        properties: cloneProperties(feature.properties, includeProperties),
      }];
    }),
  };
}

export function exportPinsToFeatureCollection(
  pins: MapPin[],
  includeProperties = true,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: pins.map<Feature>((pin) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [pin.lng, pin.lat],
      },
      properties: includeProperties ? { label: pin.label ?? null } : null,
      id: pin.id,
    })),
  };
}

export function exportDrawingsToFeatureCollection(
  drawings: DrawnFeature[],
  includeProperties = true,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: drawings.map<Feature>((feature) => ({
      type: "Feature",
      geometry: JSON.parse(JSON.stringify(feature.geometry)) as Geometry,
      properties: includeProperties
        ? JSON.parse(JSON.stringify(feature.properties)) as GeoJsonProperties
        : null,
      id: feature.id,
    })),
  };
}

function mergeFeatureCollections(collections: FeatureCollection[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: collections.flatMap((collection) => collection.features),
  };
}

async function loadLayerFeatureCollection(layer: OverlayLayerConfig): Promise<FeatureCollection | null> {
  if (!layer.visible) return null;
  if (!(layer.type === "geojson" || layer.type === "heatmap")) return null;
  if (!layer.sourceData) return null;

  return resolveGeoJSONSourceToFeatureCollection(layer.sourceData, layer.name);
}

export async function exportVisibleLayersToFeatureCollection(
  overlayLayers: OverlayLayerConfig[],
  includeProperties = true,
): Promise<{ collection: FeatureCollection; skippedLayers: string[] }> {
  const collections: FeatureCollection[] = [];
  const skippedLayers: string[] = [];

  for (const layer of overlayLayers) {
    if (!layer.visible) continue;
    try {
      const collection = await loadLayerFeatureCollection(layer);
      if (!collection) {
        skippedLayers.push(layer.name);
        continue;
      }
      collections.push(roundFeatureCollection(collection, 12, includeProperties));
    } catch {
      skippedLayers.push(layer.name);
    }
  }

  return {
    collection: mergeFeatureCollections(collections),
    skippedLayers,
  };
}

export function serializeFeatureCollection(
  collection: FeatureCollection,
  options?: MapDataExportOptions,
): string {
  const precision = options?.precision ?? 6;
  const prettyPrint = options?.prettyPrint ?? true;
  const includeProperties = options?.includeProperties ?? true;
  const rounded = roundFeatureCollection(collection, precision, includeProperties);
  return JSON.stringify(rounded, null, prettyPrint ? 2 : 0);
}

export async function exportMapData(params: {
  target: MapExportTarget;
  pins: MapPin[];
  drawings: DrawnFeature[];
  overlayLayers: OverlayLayerConfig[];
  options?: MapDataExportOptions;
}): Promise<MapDataExportResult> {
  const includeProperties = params.options?.includeProperties ?? true;
  const format = params.options?.format ?? "geojson";
  let collection: FeatureCollection;
  let skippedLayers: string[] = [];

  if (params.target === "pins") {
    collection = exportPinsToFeatureCollection(params.pins, includeProperties);
  } else if (params.target === "drawings") {
    collection = exportDrawingsToFeatureCollection(params.drawings, includeProperties);
  } else {
    const result = await exportVisibleLayersToFeatureCollection(
      params.overlayLayers,
      includeProperties,
    );
    collection = result.collection;
    skippedLayers = result.skippedLayers;
  }

  const filename = params.options?.filename?.trim() || defaultFilename(params.target, format);

  if (format === "geoparquet") {
    const safeFilename = /\.(geoparquet|parquet)$/i.test(filename)
      ? filename
      : `${filename}.geoparquet`;
    const exportResult = await exportFeatureCollectionToGeoParquet(
      cloneFeatureCollection(collection, includeProperties),
      {
        filename: safeFilename,
        includeProperties,
        ...(params.options?.crs ? { crs: params.options.crs } : {}),
      },
    );

    return {
      format,
      collection: cloneFeatureCollection(collection, includeProperties),
      filename: exportResult.filename,
      mimeType: "application/vnd.apache.parquet",
      byteLength: exportResult.byteLength,
      bytes: exportResult.bytes,
      skippedLayers,
    };
  }

  const safeFilename = filename.toLowerCase().endsWith(".geojson")
    ? filename
    : `${filename}.geojson`;
  const json = serializeFeatureCollection(collection, params.options);

  return {
    format,
    collection: JSON.parse(json) as FeatureCollection,
    filename: safeFilename,
    mimeType: "application/geo+json;charset=utf-8",
    byteLength: new Blob([json]).size,
    json,
    skippedLayers,
  };
}

export function triggerGeoJSONDownload(filename: string, json: string): void {
  downloadText(filename, json, "application/geo+json;charset=utf-8");
}

export function triggerMapDataDownload(result: MapDataExportResult): void {
  if (result.format === "geojson") {
    triggerGeoJSONDownload(result.filename, result.json ?? "");
    return;
  }

  downloadBlob(
    result.filename,
    new Blob([result.bytes ?? new Uint8Array()], { type: result.mimeType }),
  );
}
