import JSZip from "jszip";
import { booleanValid } from "@turf/boolean-valid";
import { kinks } from "@turf/kinks";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type {
  ExternalServiceLayerMetadata,
  ImportLayerSourceMetadata,
  LayerCrsSummary,
  LayerGeometrySummary,
  LayerLicenseAttributionSummary,
  LayerMetadata,
  LayerRenderBudgetMetadata,
  LayerSchemaSummary,
  LayerScientificQAMetadata,
  LayerSourceKind,
  MapRasterLayerMetadata,
  OverlayGeometryType,
  OverlayLayerConfig,
} from "../../centerpanel/components/map/mapTypes";
import { withNormalizedLayerRegistryMetadata } from "../../centerpanel/components/map/mapLayerMetadata";
import {
  type ColumnarDataQuality,
  type ColumnarGeometryEncoding,
  type ColumnarImportArtifact,
  type ColumnarPreviewRow,
  type ColumnarSchemaField,
  type ColumnarSizeComparison,
  type ColumnarSourceFormat,
  type GeoParquetMetadataSummary,
  prepareColumnarDatasetImport,
} from "../data/pipeline";
import type { SourceFormat, SourceHandle } from "./contracts/gisContracts";
import {
  applySourceHandleToLayer,
  createImportSourceHandle,
  MAP_SOURCE_INLINE_STORAGE_LIMIT_BYTES,
} from "./sources/MapSourceRegistry";
import {
  buildOnTheFlyVectorTileLayerMetadata,
} from "./tiling/VectorTilePipelineService";
import { createGeoTiffSampleImageDataUrl, defaultRasterRenderConfig } from "./raster/GeoTiffParser";
import type { GeoTiffInspection, RasterLayerRenderConfig } from "./raster/GeoTiffParser";
import { assessRasterQA } from "./raster/RasterQAService";
import { computeHistogram } from "./raster/RasterHistogramEngine";
import type { BandHistogramResult } from "./raster/RasterHistogramEngine";

export const MAX_IMPORT_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_GEOJSON_FILE_SIZE_BYTES = MAX_IMPORT_FILE_SIZE_BYTES;
export const IMPORT_PROGRESS_THRESHOLD_BYTES = 1 * 1024 * 1024;
export const MAP_GEOJSON_RENDER_FEATURE_BUDGET = 30_000;
export const MAP_GEOJSON_RENDER_COORDINATE_BUDGET = 150_000;
export const MAP_GEOJSON_RENDER_MEMORY_BUDGET_BYTES = 64 * 1024 * 1024;
export const MAP_GEOJSON_DEEP_TOPOLOGY_COORDINATE_BUDGET = 250_000;
export const MAP_GEOJSON_RENDER_PROPERTY_FIELD_BUDGET = 24;
export const MAP_GEOJSON_RENDER_PROPERTY_VALUE_CHAR_BUDGET = 160;
export const MAP_IMPORT_ACCEPT_ATTRIBUTE = [
  ".geojson",
  ".json",
  ".csv",
  ".arrow",
  ".feather",
  ".ipc",
  ".parquet",
  ".geoparquet",
  ".kml",
  ".kmz",
  ".gpx",
  ".shp",
  ".zip",
  ".gpkg",
  ".fgb",
  ".flatgeobuf",
  ".pmtiles",
  ".tif",
  ".tiff",
  "application/geo+json",
  "application/json",
  "text/csv",
  "application/vnd.apache.arrow.file",
  "application/vnd.apache.arrow.stream",
  "application/vnd.apache.parquet",
  "application/x-parquet",
  "application/vnd.google-earth.kml+xml",
  "application/vnd.google-earth.kmz",
  "application/gpx+xml",
  "image/tiff",
  "application/xml",
  "text/xml",
].join(",");

const LATITUDE_COLUMN_PRIORITY = ["latitude", "lat", "y"] as const;
const LONGITUDE_COLUMN_PRIORITY = ["longitude", "lng", "lon", "x"] as const;
const ESTIMATED_BYTES_PER_FEATURE = 256;
const ESTIMATED_BYTES_PER_COORDINATE = 32;
const ESTIMATED_BYTES_PER_PROPERTY_CELL = 48;
const PREFERRED_RENDER_PROPERTY_KEYS = [
  "id",
  "name",
  "label",
  "title",
  "category",
  "class",
  "type",
  "value",
  "score",
  "density",
  "population",
  "detection_class",
  "land_cover_class",
  "cluster_label",
  "query_intent",
];

export interface GeoJSONRenderNormalizationOptions {
  preservePropertyKeys?: readonly string[];
  propertyFieldLimit?: number;
  propertyValueCharLimit?: number;
}

export type MapImportFileKind = "geojson" | "csv" | "arrow" | "geoparquet" | "kml" | "kmz" | "gpx" | "shapefile" | "geopackage" | "geotiff";

export type SourceProfileSupportStatus = "supported" | "partial" | "unsupported";

export type SourceProfileStrategy = "full-parse" | "sampled" | "metadata-only" | "deferred";

export interface MapImportProgress {
  loaded: number;
  total: number;
  percent: number;
  stage?: string;
  rowCount?: number;
  estimatedMemoryBytes?: number;
}

export interface ImportedLayerSummary {
  sourceType: MapImportFileKind;
  importedFeatureCount: number;
  totalRecords?: number;
  skippedRecordCount?: number;
}

export interface SourceProfile {
  sourceHandle: SourceHandle;
  format: SourceFormat;
  sourceName: string;
  supportStatus: SourceProfileSupportStatus;
  canCommit: boolean;
  profileStrategy: SourceProfileStrategy;
  featureCount: number | null;
  totalRecords?: number;
  skippedRecordCount?: number;
  sizeBytes?: number;
  estimatedMemoryBytes?: number;
  extent?: [number, number, number, number];
  workerReady: boolean;
  crsSummary: LayerCrsSummary;
  geometrySummary?: LayerGeometrySummary;
  schemaSummary?: LayerSchemaSummary;
  rendering?: LayerRenderBudgetMetadata;
  license: string | null;
  attribution: string | null;
  caveats: string[];
  profiledAt: string;
}

export interface ImportedGeoJSONLayer {
  featureCollection: FeatureCollection;
  layer: OverlayLayerConfig;
  sourceHandle: SourceHandle;
  sourceProfile: SourceProfile;
  summary?: ImportedLayerSummary;
}

export interface ImportedRasterLayer {
  inspection: GeoTiffInspection;
  histogram: BandHistogramResult;
  renderConfig: RasterLayerRenderConfig;
  layer: OverlayLayerConfig;
  sourceHandle: SourceHandle;
  sourceProfile: SourceProfile;
  summary: ImportedLayerSummary & {
    sourceType: "geotiff";
    rasterPixelCount: number;
    sampledPixelCount: number;
  };
}

export interface CsvPreviewRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface CsvImportSession {
  kind: "csv";
  fileName: string;
  layerName: string;
  headers: string[];
  rows: string[][];
  delimiter: string;
  sourceSizeBytes: number;
  totalRows: number;
  previewRows: CsvPreviewRow[];
  latitudeCandidates: string[];
  longitudeCandidates: string[];
  suggestedLatitudeColumn: string | null;
  suggestedLongitudeColumn: string | null;
}

export interface CsvImportMapping {
  latitudeColumn: string;
  longitudeColumn: string;
}

export interface ColumnarImportSession {
  kind: "columnar";
  fileName: string;
  layerName: string;
  format: ColumnarSourceFormat;
  rowCount: number;
  importedFeatureCount: number;
  skippedRowCount: number;
  estimatedMemoryBytes: number;
  transferSizeBytes: number;
  geometryEncoding: ColumnarGeometryEncoding;
  geometryColumn?: string;
  longitudeColumn?: string;
  latitudeColumn?: string;
  schema: ColumnarSchemaField[];
  previewRows: ColumnarPreviewRow[];
  warnings: string[];
  workerTableName: string;
  geoParquet?: GeoParquetMetadataSummary;
  arrowIPC: Uint8Array;
  result: ImportedGeoJSONLayer;
  quality: ColumnarDataQuality;
  sizeComparison: ColumnarSizeComparison;
}

export interface GeoPackageLayerInfo {
  tableName: string;
  featureCount: number | null;
  geometryType: string | null;
  crsSummary: LayerCrsSummary;
}

export interface GeoPackageImportSession {
  kind: "geopackage";
  fileName: string;
  layers: GeoPackageLayerInfo[];
  /** Opaque data held in memory until user picks a layer */
  _data: ArrayBuffer;
}

export type PreparedMapImportResult =
  | {
      kind: "ready";
      result: ImportedGeoJSONLayer;
    }
  | {
      kind: "csv";
      session: CsvImportSession;
    }
  | {
      kind: "columnar";
      session: ColumnarImportSession;
    }
  | {
      kind: "profile";
      profile: SourceProfile;
    }
  | {
      kind: "raster";
      result: ImportedRasterLayer;
    }
  | {
      kind: "geopackage";
      session: GeoPackageImportSession;
    };

export class MapDataImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapDataImportError";
  }
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

function getFileExtension(filename: string): string {
  const match = /\.([^.]+)$/.exec(filename.toLowerCase());
  return match?.[1] ?? "";
}

function createLayerId(prefix = "import"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

function createEvidenceArtifactId(layerId: string): string {
  return `map-evidence-layer-${layerId.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

function uniqueTextList(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function buildImportCaveats(input: {
  sourceType: MapImportFileKind;
  declaredCrs?: string;
  totalRecords?: number;
  skippedRecordCount?: number;
  workerTransferStatus?: ImportLayerSourceMetadata["workerTransferStatus"];
}): string[] {
  const caveats: string[] = [];
  if (!input.declaredCrs) {
    caveats.push("Imported layer does not declare a CRS; analytical distance and area operations require CRS review.");
  }
  caveats.push("Imported file license and attribution are not declared by the browser import pipeline; review before publication.");
  if ((input.skippedRecordCount ?? 0) > 0 && input.totalRecords != null) {
    caveats.push(`${input.skippedRecordCount.toLocaleString()} of ${input.totalRecords.toLocaleString()} input record(s) were skipped during spatial import.`);
  }
  if (input.workerTransferStatus === "prepared") {
    caveats.push("Columnar worker transfer is prepared and will be confirmed when the layer is published to the map workspace.");
  }
  if (input.sourceType === "csv") {
    caveats.push("CSV point geometry was derived from selected latitude/longitude columns; verify coordinate semantics before analysis.");
  }
  return uniqueTextList(caveats);
}

function buildImportCrsSummary(sourceType: MapImportFileKind, declaredCrs?: string): LayerCrsSummary {
  if (declaredCrs) {
    return {
      crs: declaredCrs,
      status: "known",
      source: sourceType === "geoparquet" || sourceType === "arrow" ? "columnar" : "import-source",
      notes: ["CRS was copied from import metadata as a declaration; analytical suitability still requires QA review."],
    };
  }

  return {
    crs: null,
    status: "unknown",
    source: "import-source",
    notes: ["Imported file did not provide CRS metadata; CRS remains unknown until explicitly verified."],
  };
}

function buildProfileCrsSummary(input: {
  format: SourceFormat;
  declaredCrs?: string | null;
  source?: LayerCrsSummary["source"];
}): LayerCrsSummary {
  if (typeof input.declaredCrs === "string" && input.declaredCrs.trim().length > 0) {
    const crs = input.declaredCrs.trim();
    return {
      crs,
      status: "known",
      source: input.source ?? "import-source",
      notes: [`Source profile declares CRS ${crs}; verify suitability before analytical measurement.`],
    };
  }

  if (input.declaredCrs === null) {
    return {
      crs: null,
      status: "missing",
      source: input.source ?? "import-source",
      notes: ["Source profile explicitly has no declared CRS metadata."],
    };
  }

  return {
    crs: null,
    status: "unknown",
    source: input.source ?? "import-source",
    notes: [`${input.format.toUpperCase()} source profile did not provide CRS metadata.`],
  };
}

function sourceProfileSupportStatus(format: SourceFormat): SourceProfileSupportStatus {
  switch (format) {
    case "geojson":
    case "csv":
    case "arrow":
    case "geoparquet":
    case "kml":
    case "kmz":
    case "gpx":
    case "shapefile":
    case "geopackage":
      return "supported";
    case "flatgeobuf":
    case "pmtiles":
    case "wms":
    case "wfs":
    case "xyz":
    case "geotiff":
    case "cityjson":
    case "3d-tiles":
      return "partial";
    default:
      return "unsupported";
  }
}

function sourceProfileCanCommit(format: SourceFormat): boolean {
  return sourceProfileSupportStatus(format) === "supported";
}

function sourceProfileStrategy(format: SourceFormat, supportStatus: SourceProfileSupportStatus): SourceProfileStrategy {
  if (supportStatus !== "supported") return "metadata-only";
  if (format === "arrow" || format === "geoparquet") return "sampled";
  return "full-parse";
}

function shouldMarkWorkerReady(input: {
  featureCount: number | null;
  sizeBytes?: number;
  estimatedMemoryBytes?: number;
  format: SourceFormat;
  supportStatus: SourceProfileSupportStatus;
}): boolean {
  if (input.format === "arrow" || input.format === "geoparquet") return true;
  if (input.supportStatus === "partial" && (input.format === "flatgeobuf" || input.format === "pmtiles" || input.format === "geotiff")) {
    return true;
  }
  if ((input.featureCount ?? 0) > MAP_GEOJSON_RENDER_FEATURE_BUDGET) return true;
  if ((input.sizeBytes ?? 0) > MAP_SOURCE_INLINE_STORAGE_LIMIT_BYTES) return true;
  if ((input.estimatedMemoryBytes ?? 0) > MAP_GEOJSON_RENDER_MEMORY_BUDGET_BYTES) return true;
  return false;
}

function createProfileLayer(input: {
  idPrefix?: string;
  sourceName: string;
  kind: LayerSourceKind;
  format: SourceFormat;
  crsSummary: LayerCrsSummary;
  featureCount: number | null;
  geometrySummary?: LayerGeometrySummary;
  schemaSummary?: LayerSchemaSummary;
  extent?: [number, number, number, number];
  caveats: readonly string[];
  license?: string | null;
  attribution?: string | null;
  profiledAt: string;
}): OverlayLayerConfig {
  const layerId = createLayerId(input.idPrefix ?? "profile");
  const metadata: LayerMetadata = {
    updatedAt: input.profiledAt,
    crsSummary: input.crsSummary,
    ...(sourceProfileCanCommit(input.format) ? { importFormat: input.format as ImportLayerSourceMetadata["format"] } : {}),
    ...(input.featureCount != null ? { featureCount: input.featureCount } : {}),
    ...(input.geometrySummary ? { geometrySummary: input.geometrySummary } : {}),
    ...(input.schemaSummary ? { schemaSummary: input.schemaSummary } : {}),
    ...(input.extent ? { bounds: input.extent } : {}),
    licenseAttribution: {
      license: input.license ?? null,
      attribution: input.attribution ?? null,
      sourceName: input.sourceName,
      requiresAttribution: Boolean(input.attribution),
      source: input.license || input.attribution ? "import-source" : "unknown",
      notes: input.license || input.attribution
        ? ["License or attribution was read from source profile metadata."]
        : ["License and attribution are unknown from this source profile."],
    },
  };

  return {
    id: layerId,
    name: stripExtension(input.sourceName),
    type: "geojson",
    visible: false,
    opacity: 1,
    sourceKind: input.kind,
    qaStatus: input.caveats.length > 0 ? "warning" : "unchecked",
    provenance: {
      label: `${input.format.toUpperCase()} source profile`,
      sourceName: input.sourceName,
      method: "Browser source profiling",
      generatedAt: input.profiledAt,
      notes: [...input.caveats],
    },
    metadata,
    group: "data",
  };
}

function createSourceProfile(input: {
  sourceHandle: SourceHandle;
  format: SourceFormat;
  sourceName: string;
  supportStatus?: SourceProfileSupportStatus;
  canCommit?: boolean;
  profileStrategy?: SourceProfileStrategy;
  featureCount?: number | null;
  totalRecords?: number;
  skippedRecordCount?: number;
  sizeBytes?: number;
  estimatedMemoryBytes?: number;
  extent?: [number, number, number, number];
  geometrySummary?: LayerGeometrySummary;
  rendering?: LayerRenderBudgetMetadata;
  workerReady?: boolean;
  caveats?: readonly string[];
}): SourceProfile {
  const supportStatus = input.supportStatus ?? sourceProfileSupportStatus(input.format);
  const sizeBytes = input.sizeBytes ?? input.sourceHandle.sizeBytes;
  const featureCount = input.featureCount ?? input.sourceHandle.featureCount;
  const workerReady = input.workerReady ?? shouldMarkWorkerReady({
    featureCount,
    ...(sizeBytes != null ? { sizeBytes } : {}),
    ...(input.estimatedMemoryBytes != null ? { estimatedMemoryBytes: input.estimatedMemoryBytes } : {}),
    format: input.format,
    supportStatus,
  });
  const caveats = uniqueTextList([
    ...(input.caveats ?? []),
    ...input.sourceHandle.caveats,
    ...(workerReady ? ["Source is suitable for worker-backed import or analysis when committed."] : []),
    ...(supportStatus === "partial" ? ["This format can be profiled now; full commit support is handled by a later import hardening slice."] : []),
  ]);

  return {
    sourceHandle: input.sourceHandle,
    format: input.format,
    sourceName: input.sourceName,
    supportStatus,
    canCommit: input.canCommit ?? sourceProfileCanCommit(input.format),
    profileStrategy: input.profileStrategy ?? sourceProfileStrategy(input.format, supportStatus),
    featureCount,
    ...(input.totalRecords != null ? { totalRecords: input.totalRecords } : {}),
    ...(input.skippedRecordCount != null ? { skippedRecordCount: input.skippedRecordCount } : {}),
    ...(sizeBytes != null ? { sizeBytes } : {}),
    ...(input.estimatedMemoryBytes != null ? { estimatedMemoryBytes: input.estimatedMemoryBytes } : {}),
    ...(input.extent ? { extent: input.extent } : {}),
    workerReady,
    crsSummary: input.sourceHandle.crsSummary,
    ...(input.geometrySummary ? { geometrySummary: input.geometrySummary } : {}),
    ...(input.sourceHandle.schemaSummary ? { schemaSummary: input.sourceHandle.schemaSummary } : {}),
    ...(input.rendering ? { rendering: input.rendering } : {}),
    license: input.sourceHandle.license ?? null,
    attribution: input.sourceHandle.attribution ?? null,
    caveats,
    profiledAt: input.sourceHandle.profiledAt,
  };
}

function buildImportLicenseAttribution(fileName: string): LayerLicenseAttributionSummary {
  return {
    license: null,
    attribution: null,
    sourceName: fileName,
    requiresAttribution: false,
    source: "import-source",
    notes: ["License and attribution are unknown for this local import; review before publication."],
  };
}

function buildImportScientificQA(input: {
  layerId: string;
  sourceType: MapImportFileKind;
  importedAt: string;
  featureCount: number;
  fieldCount: number;
  declaredCrs?: string;
  caveats: string[];
  totalRecords?: number;
  skippedRecordCount?: number;
  workerTransferStatus?: ImportLayerSourceMetadata["workerTransferStatus"];
}): LayerScientificQAMetadata {
  const issueIds: string[] = [];
  if (!input.declaredCrs) issueIds.push(`import-crs-unknown-${input.layerId}`);
  issueIds.push(`import-license-unknown-${input.layerId}`);
  if ((input.skippedRecordCount ?? 0) > 0) issueIds.push(`import-skipped-records-${input.layerId}`);
  if (input.workerTransferStatus === "prepared") issueIds.push(`import-worker-pending-${input.layerId}`);

  return {
    status: issueIds.length > 0 ? "warning" : "passed",
    issueIds,
    badges: [
      ...(!input.declaredCrs ? ["missing_crs" as const] : []),
      ...(issueIds.length > 0 ? ["uncertain_output" as const] : []),
    ],
    checkedAt: input.importedAt,
    featureIssueCount: input.skippedRecordCount ?? 0,
    usedWorker: input.workerTransferStatus === "prepared" || input.workerTransferStatus === "ready",
    caveats: input.caveats,
    categorySummaries: [
      {
        category: "crs",
        severity: input.declaredCrs ? "pass" : "unknown",
        issueIds: input.declaredCrs ? [] : [`import-crs-unknown-${input.layerId}`],
        affectedLayerIds: [input.layerId],
        reasons: input.declaredCrs
          ? [`CRS declared as ${input.declaredCrs}.`]
          : ["Imported file did not provide CRS metadata."],
        recommendedFixes: input.declaredCrs ? [] : ["Assign or verify source CRS before analytical measurement."],
      },
      {
        category: "schema",
        severity: input.fieldCount > 0 ? "pass" : "unknown",
        issueIds: [],
        affectedLayerIds: [input.layerId],
        reasons: input.fieldCount > 0
          ? [`${input.fieldCount.toLocaleString()} attribute field(s) detected.`]
          : ["No attribute fields were detected during import."],
        recommendedFixes: input.fieldCount > 0 ? [] : ["Inspect source schema before query or indicator use."],
      },
      {
        category: "attribution-license",
        severity: "unknown",
        issueIds: [`import-license-unknown-${input.layerId}`],
        affectedLayerIds: [input.layerId],
        reasons: ["Browser import does not expose license or attribution metadata."],
        recommendedFixes: ["Add license and attribution before publication or report handoff."],
      },
      {
        category: "missingness",
        severity: (input.skippedRecordCount ?? 0) > 0 ? "warning" : "pass",
        issueIds: (input.skippedRecordCount ?? 0) > 0 ? [`import-skipped-records-${input.layerId}`] : [],
        affectedLayerIds: [input.layerId],
        reasons: (input.skippedRecordCount ?? 0) > 0 && input.totalRecords != null
          ? [`${input.skippedRecordCount?.toLocaleString()} of ${input.totalRecords.toLocaleString()} record(s) were skipped.`]
          : ["No skipped rows were reported by the importer."],
        recommendedFixes: (input.skippedRecordCount ?? 0) > 0 ? ["Inspect skipped rows and coordinate mappings before analysis."] : [],
      },
    ],
    signature: `import:${input.sourceType}:${input.layerId}:${input.featureCount}:${input.declaredCrs ?? "unknown"}:${input.skippedRecordCount ?? 0}:${input.workerTransferStatus ?? "not-required"}`,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validatePosition(position: unknown, context: string): asserts position is GeoJSON.Position {
  if (!Array.isArray(position) || position.length < 2) {
    throw new MapDataImportError(`${context} must contain at least two coordinate values.`);
  }
  if (!isFiniteCoordinate(position[0]) || !isFiniteCoordinate(position[1])) {
    throw new MapDataImportError(`${context} contains invalid numeric coordinates.`);
  }
}

function validateLineCoordinates(coords: unknown, context: string): asserts coords is GeoJSON.Position[] {
  if (!Array.isArray(coords) || coords.length < 2) {
    throw new MapDataImportError(`${context} must contain at least two positions.`);
  }
  coords.forEach((position, index) => validatePosition(position, `${context} position ${index + 1}`));
}

function positionsEqual(a: GeoJSON.Position, b: GeoJSON.Position): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function validateRing(coords: unknown, context: string): asserts coords is GeoJSON.Position[] {
  if (!Array.isArray(coords) || coords.length < 4) {
    throw new MapDataImportError(`${context} must contain at least four positions.`);
  }
  coords.forEach((position, index) => validatePosition(position, `${context} position ${index + 1}`));
  const first = coords[0] as GeoJSON.Position;
  const last = coords[coords.length - 1] as GeoJSON.Position;
  if (!positionsEqual(first, last)) {
    throw new MapDataImportError(`${context} is not closed. The first and last coordinates must match.`);
  }
}

function validateGeometryStructure(geometry: Geometry, context: string): void {
  switch (geometry.type) {
    case "Point":
      validatePosition(geometry.coordinates, `${context} point`);
      return;
    case "MultiPoint":
    case "LineString":
      validateLineCoordinates(geometry.coordinates, `${context} ${geometry.type}`);
      return;
    case "MultiLineString":
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
        throw new MapDataImportError(`${context} MultiLineString must contain at least one line.`);
      }
      geometry.coordinates.forEach((line, index) =>
        validateLineCoordinates(line, `${context} MultiLineString line ${index + 1}`),
      );
      return;
    case "Polygon":
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
        throw new MapDataImportError(`${context} Polygon must contain at least one ring.`);
      }
      geometry.coordinates.forEach((ring, index) =>
        validateRing(ring, `${context} Polygon ring ${index + 1}`),
      );
      return;
    case "MultiPolygon":
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
        throw new MapDataImportError(`${context} MultiPolygon must contain at least one polygon.`);
      }
      geometry.coordinates.forEach((polygon, polygonIndex) => {
        if (!Array.isArray(polygon) || polygon.length === 0) {
          throw new MapDataImportError(
            `${context} MultiPolygon polygon ${polygonIndex + 1} must contain at least one ring.`,
          );
        }
        polygon.forEach((ring, ringIndex) =>
          validateRing(
            ring,
            `${context} MultiPolygon polygon ${polygonIndex + 1} ring ${ringIndex + 1}`,
          ),
        );
      });
      return;
    case "GeometryCollection":
      if (!Array.isArray(geometry.geometries)) {
        throw new MapDataImportError(`${context} GeometryCollection must contain a geometries array.`);
      }
      geometry.geometries.forEach((child, index) =>
        validateGeometryStructure(child, `${context} GeometryCollection geometry ${index + 1}`),
      );
      return;
    default:
      throw new MapDataImportError(`${context} has unsupported geometry type.`);
  }
}

function countTopologyCoordinateArray(input: unknown): number {
  if (!Array.isArray(input) || input.length === 0) return 0;
  if (typeof input[0] === "number") return 1;
  return input.reduce((coordinateCount, entry) => coordinateCount + countTopologyCoordinateArray(entry), 0);
}

function countTopologyGeometryCoordinates(geometry: Geometry): number {
  if (geometry.type === "GeometryCollection") {
    return geometry.geometries.reduce(
      (coordinateCount, childGeometry) => coordinateCount + countTopologyGeometryCoordinates(childGeometry),
      0,
    );
  }
  return countTopologyCoordinateArray((geometry as Exclude<Geometry, GeoJSON.GeometryCollection>).coordinates);
}

function validateTopology(geometry: Geometry, context: string): boolean {
  if (countTopologyGeometryCoordinates(geometry) > MAP_GEOJSON_DEEP_TOPOLOGY_COORDINATE_BUDGET) {
    return false;
  }

  if (geometry.type === "GeometryCollection") {
    let allChecked = true;
    geometry.geometries.forEach((child, index) => {
      const childChecked = validateTopology(child, `${context} GeometryCollection geometry ${index + 1}`);
      allChecked = allChecked && childChecked;
    });
    return allChecked;
  }

  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    const intersections = kinks({ type: "Feature", geometry, properties: {} }).features.length;
    if (intersections > 0) {
      throw new MapDataImportError(`${context} contains self-intersections.`);
    }
  }

  if (!booleanValid(geometry)) {
    throw new MapDataImportError(`${context} is not a valid GeoJSON geometry.`);
  }

  return true;
}

function normalizeFeature(feature: Feature, index?: number): Feature {
  if (!feature.geometry) {
    throw new MapDataImportError(
      `Feature ${index != null ? index + 1 : ""} has null geometry, which is not supported.`.trim(),
    );
  }
  return {
    ...feature,
    properties: (feature.properties ?? {}) as GeoJsonProperties,
  };
}

export function normalizeGeoJSONInput(input: unknown): FeatureCollection {
  if (!isObject(input) || typeof input.type !== "string") {
    throw new MapDataImportError("GeoJSON root object must contain a valid type field.");
  }

  if (input.type === "FeatureCollection") {
    const featureCollectionInput = input as unknown as FeatureCollection;
    if (!Array.isArray(featureCollectionInput.features)) {
      throw new MapDataImportError("FeatureCollection.features must be an array.");
    }
    return {
      type: "FeatureCollection",
      features: featureCollectionInput.features.map((feature, index) =>
        normalizeFeature(feature, index),
      ),
    };
  }

  if (input.type === "Feature") {
    const featureInput = input as unknown as Feature;
    return {
      type: "FeatureCollection",
      features: [normalizeFeature(featureInput, 0)],
    };
  }

  const geometryInput = input as unknown as Geometry;

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: geometryInput,
        properties: {},
      },
    ],
  };
}

export interface FeatureCollectionValidationSummary {
  topologyCheckedFeatureCount: number;
  topologyDeferredFeatureCount: number;
}

export function validateFeatureCollection(featureCollection: FeatureCollection): FeatureCollectionValidationSummary {
  let topologyCheckedFeatureCount = 0;
  let topologyDeferredFeatureCount = 0;
  featureCollection.features.forEach((feature, index) => {
    if (!feature.geometry) {
      throw new MapDataImportError(`Feature ${index + 1} has null geometry, which is not supported.`);
    }
    validateGeometryStructure(feature.geometry, `Feature ${index + 1}`);
    if (validateTopology(feature.geometry, `Feature ${index + 1}`)) {
      topologyCheckedFeatureCount += 1;
    } else {
      topologyDeferredFeatureCount += 1;
    }
  });
  return { topologyCheckedFeatureCount, topologyDeferredFeatureCount };
}

function collectGeometryTypeLabels(featureCollection: FeatureCollection): Set<string> {
  const labels = new Set<string>();
  featureCollection.features.forEach((feature) => {
    const type = feature.geometry?.type;
    if (type) labels.add(type);
  });
  return labels;
}

function geometryHintFromLabels(labels: Set<string>): OverlayGeometryType {
  const values = Array.from(labels);
  if (values.length === 0) return "unknown";
  const normalized = new Set(
    values.map((value) => {
      if (value.includes("Point")) return "point";
      if (value.includes("Line")) return "line";
      if (value.includes("Polygon")) return "polygon";
      return "unknown";
    }),
  );
  if (normalized.size === 1) {
    return normalized.values().next().value as OverlayGeometryType;
  }
  return "mixed";
}

function geometryLabelFromHint(hint: OverlayGeometryType): string {
  switch (hint) {
    case "point":
      return "Point";
    case "line":
      return "LineString";
    case "polygon":
      return "Polygon";
    case "mixed":
      return "Mixed";
    default:
      return "Unknown";
  }
}

function visitCoordinateArray(input: unknown, visitor: (longitude: number, latitude: number) => void): number {
  if (!Array.isArray(input) || input.length === 0) return 0;
  if (typeof input[0] === "number") {
    const longitude = input[0];
    const latitude = input[1];
    if (typeof longitude === "number" && typeof latitude === "number" && Number.isFinite(longitude) && Number.isFinite(latitude)) {
      visitor(longitude, latitude);
      return 1;
    }
    return 0;
  }

  let coordinateCount = 0;
  for (const entry of input) {
    coordinateCount += visitCoordinateArray(entry, visitor);
  }
  return coordinateCount;
}

function visitGeometryCoordinates(geometry: Geometry | null | undefined, visitor: (longitude: number, latitude: number) => void): number {
  if (!geometry) return 0;
  if (geometry.type === "GeometryCollection") {
    return geometry.geometries.reduce(
      (coordinateCount, childGeometry) => coordinateCount + visitGeometryCoordinates(childGeometry, visitor),
      0,
    );
  }
  return visitCoordinateArray(
    (geometry as Exclude<Geometry, GeoJSON.GeometryCollection>).coordinates,
    visitor,
  );
}

function countGeometryCoordinates(geometry: Geometry | null | undefined): number {
  return visitGeometryCoordinates(geometry, () => undefined);
}

function estimateStringBytes(value: string): number {
  return value.length * 2;
}

function estimatePropertyValueBytes(value: unknown): number {
  if (value == null) return 4;
  if (typeof value === "string") return estimateStringBytes(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value).length;
  if (Array.isArray(value)) return Math.min(16_384, 16 + value.length * 32);
  if (typeof value === "object") return Math.min(16_384, 64 + Object.keys(value).length * 64);
  return String(value).length;
}

function estimateFeaturePropertyBytes(feature: Feature): number {
  return Object.entries(feature.properties ?? {}).reduce(
    (totalBytes, [key, value]) => totalBytes + estimateStringBytes(key) + estimatePropertyValueBytes(value) + ESTIMATED_BYTES_PER_PROPERTY_CELL,
    0,
  );
}

function normalizeRenderPropertyValue(value: unknown, valueCharLimit: number): string | number | boolean | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.length > valueCharLimit ? `${value.slice(0, valueCharLimit)}...` : value;
  }
  if (Array.isArray(value)) return `[${value.length} values]`;
  if (typeof value === "object") return "{...}";
  return String(value).slice(0, valueCharLimit);
}

function buildRenderProperties(
  properties: GeoJsonProperties | undefined,
  options: GeoJSONRenderNormalizationOptions,
): GeoJsonProperties {
  if (!properties) return null;

  const valueCharLimit = Math.max(32, options.propertyValueCharLimit ?? MAP_GEOJSON_RENDER_PROPERTY_VALUE_CHAR_BUDGET);
  const fieldLimit = Math.max(1, options.propertyFieldLimit ?? MAP_GEOJSON_RENDER_PROPERTY_FIELD_BUDGET);
  const preserveKeys = new Set([
    ...PREFERRED_RENDER_PROPERTY_KEYS,
    ...(options.preservePropertyKeys ?? []),
  ].filter((key) => key.trim().length > 0));
  const entries = Object.entries(properties);
  const selectedEntries: Array<[string, unknown]> = [];
  const usedKeys = new Set<string>();

  for (const [key, value] of entries) {
    if (!preserveKeys.has(key)) continue;
    selectedEntries.push([key, value]);
    usedKeys.add(key);
  }

  for (const [key, value] of entries) {
    if (selectedEntries.length >= fieldLimit) break;
    if (usedKeys.has(key)) continue;
    selectedEntries.push([key, value]);
    usedKeys.add(key);
  }

  return Object.fromEntries(
    selectedEntries.map(([key, value]) => [key, normalizeRenderPropertyValue(value, valueCharLimit)]),
  ) as GeoJsonProperties;
}

function buildRenderFeature(feature: Feature, geometry: Geometry | null, options: GeoJSONRenderNormalizationOptions): Feature {
  return {
    type: "Feature",
    ...(feature.id != null ? { id: feature.id } : {}),
    ...(feature.bbox ? { bbox: feature.bbox } : {}),
    geometry,
    properties: buildRenderProperties(feature.properties, options),
  };
}

export function buildFeatureCollectionRenderProfile(featureCollection: FeatureCollection): LayerRenderBudgetMetadata {
  const fieldNames = new Set<string>();
  let coordinateCount = 0;
  let propertyBytes = 0;

  for (const feature of featureCollection.features) {
    coordinateCount += countGeometryCoordinates(feature.geometry);
    const properties = feature.properties ?? {};
    propertyBytes += estimateFeaturePropertyBytes(feature);
    Object.keys(properties).forEach((fieldName) => fieldNames.add(fieldName));
  }

  const featureCount = featureCollection.features.length;
  const estimatedRenderBytes = Math.round(
    featureCount * ESTIMATED_BYTES_PER_FEATURE
      + coordinateCount * ESTIMATED_BYTES_PER_COORDINATE
      + propertyBytes,
  );
  const warnings: string[] = [];
  if (featureCount > MAP_GEOJSON_RENDER_FEATURE_BUDGET) {
    warnings.push(`Feature count ${featureCount.toLocaleString()} exceeds the interactive render budget of ${MAP_GEOJSON_RENDER_FEATURE_BUDGET.toLocaleString()}.`);
  }
  if (coordinateCount > MAP_GEOJSON_RENDER_COORDINATE_BUDGET) {
    warnings.push(`Coordinate count ${coordinateCount.toLocaleString()} exceeds the interactive render budget of ${MAP_GEOJSON_RENDER_COORDINATE_BUDGET.toLocaleString()}.`);
  }
  if (estimatedRenderBytes > MAP_GEOJSON_RENDER_MEMORY_BUDGET_BYTES) {
    warnings.push(`Estimated render memory ${Math.round(estimatedRenderBytes / 1024 / 1024).toLocaleString()} MB exceeds the browser render budget of ${Math.round(MAP_GEOJSON_RENDER_MEMORY_BUDGET_BYTES / 1024 / 1024).toLocaleString()} MB.`);
  }

  return {
    mode: warnings.length > 0 ? "preview" : "full",
    featureCount,
    coordinateCount,
    propertyFieldCount: fieldNames.size,
    estimatedRenderBytes,
    renderFeatureLimit: MAP_GEOJSON_RENDER_FEATURE_BUDGET,
    renderCoordinateLimit: MAP_GEOJSON_RENDER_COORDINATE_BUDGET,
    estimatedRenderByteLimit: MAP_GEOJSON_RENDER_MEMORY_BUDGET_BYTES,
    warnings,
  };
}

function samplePositions(positions: GeoJSON.Position[], stride: number, minLength: number): GeoJSON.Position[] {
  if (stride <= 1 || positions.length <= minLength) return positions;
  const lastIndex = positions.length - 1;
  const sampled = positions.filter((_, index) => index === 0 || index === lastIndex || index % stride === 0);
  if (sampled.length >= minLength) return sampled;
  return positions.slice(0, minLength);
}

function sampleRingPositions(ring: GeoJSON.Position[], stride: number): GeoJSON.Position[] {
  if (stride <= 1 || ring.length <= 4) return ring;
  const closed = ring.length > 1 && positionsEqual(ring[0] as GeoJSON.Position, ring[ring.length - 1] as GeoJSON.Position);
  const openRing = closed ? ring.slice(0, -1) : ring;
  const sampledOpenRing = samplePositions(openRing, stride, 3);
  const first = sampledOpenRing[0];
  if (!first) return ring;
  const closedRing = [...sampledOpenRing, [...first] as GeoJSON.Position];
  return closedRing.length >= 4 ? closedRing : ring.slice(0, 4);
}

function simplifyGeometryForRender(geometry: Geometry | null, coordinateStride: number): Geometry | null {
  if (!geometry || coordinateStride <= 1) return geometry;

  switch (geometry.type) {
    case "Point":
      return geometry;
    case "MultiPoint":
      return { ...geometry, coordinates: samplePositions(geometry.coordinates, coordinateStride, 1) };
    case "LineString":
      return { ...geometry, coordinates: samplePositions(geometry.coordinates, coordinateStride, 2) };
    case "MultiLineString":
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((line) => samplePositions(line, coordinateStride, 2)),
      };
    case "Polygon":
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((ring) => sampleRingPositions(ring, coordinateStride)),
      };
    case "MultiPolygon":
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((polygon) =>
          polygon.map((ring) => sampleRingPositions(ring, coordinateStride)),
        ),
      };
    case "GeometryCollection":
      return {
        ...geometry,
        geometries: geometry.geometries.map((childGeometry) => simplifyGeometryForRender(childGeometry, coordinateStride) ?? childGeometry),
      };
    default:
      return geometry;
  }
}

export function createRenderSafeFeatureCollection(
  featureCollection: FeatureCollection,
  options: GeoJSONRenderNormalizationOptions = {},
): FeatureCollection {
  const profile = buildFeatureCollectionRenderProfile(featureCollection);
  if (profile.mode === "full") return featureCollection;

  const featureStride = Math.max(1, Math.ceil(profile.featureCount / MAP_GEOJSON_RENDER_FEATURE_BUDGET));
  const coordinateStride = Math.max(1, Math.ceil(profile.coordinateCount / MAP_GEOJSON_RENDER_COORDINATE_BUDGET));
  const previewFeatures: Feature[] = [];
  let previewCoordinateCount = 0;

  for (let featureIndex = 0; featureIndex < featureCollection.features.length; featureIndex += featureStride) {
    const feature = featureCollection.features[featureIndex];
    if (!feature) continue;
    const geometry = simplifyGeometryForRender(feature.geometry, coordinateStride);
    const featureCoordinateCount = countGeometryCoordinates(geometry);
    if (
      previewFeatures.length > 0
      && previewCoordinateCount + featureCoordinateCount > MAP_GEOJSON_RENDER_COORDINATE_BUDGET
    ) {
      continue;
    }
    previewFeatures.push(buildRenderFeature(feature, geometry, options));
    previewCoordinateCount += featureCoordinateCount;
    if (
      previewFeatures.length >= MAP_GEOJSON_RENDER_FEATURE_BUDGET
      || previewCoordinateCount >= MAP_GEOJSON_RENDER_COORDINATE_BUDGET
    ) {
      break;
    }
  }

  if (previewFeatures.length === 0 && featureCollection.features[0]) {
    const feature = featureCollection.features[0];
    const geometry = simplifyGeometryForRender(feature.geometry, Math.max(coordinateStride, 2));
    previewFeatures.push(buildRenderFeature(feature, geometry, options));
  }

  return {
    ...featureCollection,
    features: previewFeatures,
  };
}

function countFeatureCollectionCoordinates(featureCollection: FeatureCollection): number {
  return featureCollection.features.reduce((sum, feature) => sum + countGeometryCoordinates(feature.geometry), 0);
}

function buildFeatureCollectionRenderingMetadata(featureCollection: FeatureCollection): LayerRenderBudgetMetadata {
  const rendering = buildFeatureCollectionRenderProfile(featureCollection);
  if (rendering.mode === "full") return rendering;

  const preview = createRenderSafeFeatureCollection(featureCollection);
  return {
    ...rendering,
    previewFeatureCount: preview.features.length,
    previewCoordinateCount: countFeatureCollectionCoordinates(preview),
  };
}

function isFeatureCollection(value: unknown): value is FeatureCollection {
  return isObject(value) && value.type === "FeatureCollection" && Array.isArray((value as FeatureCollection).features);
}

export function normalizeGeoJSONSourceDataForRender(
  sourceData: string | FeatureCollection | Feature | Geometry | undefined,
  options: GeoJSONRenderNormalizationOptions = {},
): string | FeatureCollection | Feature | Geometry | undefined {
  const normalized = normalizeGeoJSONSourceData(sourceData);
  return isFeatureCollection(normalized) ? createRenderSafeFeatureCollection(normalized, options) : normalized;
}

export function getFeatureCollectionBounds(
  featureCollection: FeatureCollection,
): [number, number, number, number] | undefined {
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let coordinateCount = 0;

  featureCollection.features.forEach((feature) => {
    coordinateCount += visitGeometryCoordinates(feature.geometry, (longitude, latitude) => {
      minLng = Math.min(minLng, longitude);
      minLat = Math.min(minLat, latitude);
      maxLng = Math.max(maxLng, longitude);
      maxLat = Math.max(maxLat, latitude);
    });
  });

  if (coordinateCount === 0) return undefined;

  return [minLng, minLat, maxLng, maxLat];
}

export function buildFeatureCollectionMetadata(featureCollection: FeatureCollection): LayerMetadata {
  const labels = collectGeometryTypeLabels(featureCollection);
  const hint = geometryHintFromLabels(labels);
  const fields = new Set<string>();
  const bounds = getFeatureCollectionBounds(featureCollection);
  const rendering = buildFeatureCollectionRenderingMetadata(featureCollection);
  featureCollection.features.forEach((feature) => {
    Object.keys(feature.properties ?? {}).forEach((key) => fields.add(key));
  });

  const fieldList = Array.from(fields).sort((a, b) => a.localeCompare(b));
  const geometryType = geometryLabelFromHint(hint);

  return {
    featureCount: featureCollection.features.length,
    geometryType,
    fields: fieldList,
    geometrySummary: {
      geometryType,
      geometryTypes: Array.from(labels).sort((a, b) => a.localeCompare(b)),
      featureCount: featureCollection.features.length,
      source: "feature-collection",
      notes: [],
      ...(bounds ? { bounds } : {}),
    },
    schemaSummary: {
      fieldCount: fieldList.length,
      fields: fieldList.map((name) => ({ name, role: "attribute" })),
      source: "feature-collection",
      notes: fieldList.length > 0 ? [] : ["Feature collection has no attribute fields."],
    },
    rendering,
    ...(bounds ? { bounds } : {}),
  };
}

export function parseGeoJSONText(raw: string): FeatureCollection {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new MapDataImportError("File contents are not valid JSON.");
  }

  const featureCollection = normalizeGeoJSONInput(parsed);
  validateFeatureCollection(featureCollection);
  return featureCollection;
}

export function parseInlineGeoJSONSource(raw: string): FeatureCollection | null {
  const trimmed = raw.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
    return null;
  }

  return parseGeoJSONText(trimmed);
}

export function normalizeGeoJSONSourceData(
  sourceData: string | FeatureCollection | Feature | Geometry | undefined,
): string | FeatureCollection | Feature | Geometry | undefined {
  if (typeof sourceData !== "string") {
    return sourceData;
  }

  return parseInlineGeoJSONSource(sourceData) ?? sourceData;
}

export async function resolveGeoJSONSourceToFeatureCollection(
  sourceData: string | FeatureCollection | Feature | Geometry | undefined,
  sourceLabel = "GeoJSON source",
): Promise<FeatureCollection> {
  if (!sourceData) {
    return { type: "FeatureCollection", features: [] };
  }

  if (typeof sourceData === "string") {
    const inline = parseInlineGeoJSONSource(sourceData);
    if (inline) {
      return inline;
    }

    const response = await fetch(sourceData);
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON from ${sourceLabel}.`);
    }
    const raw = await response.text();
    return parseGeoJSONText(raw);
  }

  const featureCollection = normalizeGeoJSONInput(sourceData);
  validateFeatureCollection(featureCollection);
  return featureCollection;
}

function assertImportFileSize(file: File): void {
  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    throw new MapDataImportError("Spatial import exceeds the 50 MB file-size limit.");
  }
}

function assertGeoJSONFile(file: File): void {
  const lowerName = file.name.toLowerCase();
  if (!(lowerName.endsWith(".geojson") || lowerName.endsWith(".json"))) {
    throw new MapDataImportError("Unsupported file type. Please choose a .geojson or .json file.");
  }
  assertImportFileSize(file);
}

export function detectImportFileType(file: File): MapImportFileKind {
  const format = detectSourceProfileFormat(file);
  if (isMapImportFileKind(format)) {
    return format;
  }

  throw new MapDataImportError(
    "Unsupported file type. Please choose GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, GPX, Shapefile (.shp/.zip), GeoPackage (.gpkg), or GeoTIFF (.tif/.tiff).",
  );
}

function isMapImportFileKind(format: SourceFormat): format is MapImportFileKind {
  return format === "geojson" ||
    format === "csv" ||
    format === "arrow" ||
    format === "geoparquet" ||
    format === "kml" ||
    format === "kmz" ||
    format === "gpx" ||
    format === "shapefile" ||
    format === "geopackage" ||
    format === "geotiff";
}

export function detectSourceProfileFormat(file: File): SourceFormat {
  const extension = getFileExtension(file.name);
  const mime = file.type.toLowerCase();
  const normalizedName = file.name.toLowerCase();

  if (extension === "cityjson" || normalizedName.endsWith(".city.json") || mime.includes("cityjson")) {
    return "cityjson";
  }
  if (extension === "b3dm" || extension === "i3dm" || extension === "pnts" || extension === "cmpt" || normalizedName.endsWith("tileset.json")) {
    return "3d-tiles";
  }
  if (extension === "geojson" || extension === "json" || mime === "application/geo+json") {
    return "geojson";
  }
  if (extension === "csv" || mime === "text/csv") {
    return "csv";
  }
  if (extension === "arrow" || extension === "feather" || extension === "ipc" || mime.includes("arrow")) {
    return "arrow";
  }
  if (extension === "parquet" || extension === "geoparquet" || mime.includes("parquet")) {
    return "geoparquet";
  }
  if (extension === "kml" || mime.includes("kml")) {
    return "kml";
  }
  if (extension === "kmz" || mime.includes("kmz")) {
    return "kmz";
  }
  if (extension === "gpx" || mime.includes("gpx")) {
    return "gpx";
  }
  if (extension === "fgb" || extension === "flatgeobuf") {
    return "flatgeobuf";
  }
  if (extension === "pmtiles") {
    return "pmtiles";
  }
  if (extension === "tif" || extension === "tiff" || mime === "image/tiff" || mime.includes("geotiff")) {
    return "geotiff";
  }
  if (extension === "shp" || extension === "zip") {
    return "shapefile";
  }
  if (extension === "gpkg") {
    return "geopackage";
  }

  throw new MapDataImportError(
    "Unsupported file type. Please choose GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, GPX, Shapefile, GeoPackage, FlatGeobuf, PMTiles, GeoTIFF, CityJSON, or 3D Tiles.",
  );
}

function readFile(
  file: File,
  mode: "text" | "array-buffer",
  onProgress?: (progress: MapImportProgress) => void,
): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new MapDataImportError("Unable to read the selected file."));
    };

    reader.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent: event.total > 0 ? (event.loaded / event.total) * 100 : 0,
      });
    };

    reader.onload = () => {
      if (mode === "text") {
        resolve(typeof reader.result === "string" ? reader.result : "");
        return;
      }
      resolve(reader.result instanceof ArrayBuffer ? reader.result : new ArrayBuffer(0));
    };

    if (mode === "text") {
      reader.readAsText(file);
      return;
    }

    reader.readAsArrayBuffer(file);
  });
}

function readFileAsText(
  file: File,
  onProgress?: (progress: MapImportProgress) => void,
): Promise<string> {
  return readFile(file, "text", onProgress) as Promise<string>;
}

function readFileAsArrayBuffer(
  file: File,
  onProgress?: (progress: MapImportProgress) => void,
): Promise<ArrayBuffer> {
  return readFile(file, "array-buffer", onProgress) as Promise<ArrayBuffer>;
}

function buildImportedLayer(
  fileName: string,
  featureCollection: FeatureCollection,
  sourceType: MapImportFileKind,
  summaryOverrides?: Partial<ImportedLayerSummary>,
  metadataOverrides?: Partial<LayerMetadata>,
  sourceHandleOptions?: {
    sourceSizeBytes?: number;
    sourceRef?: string;
  },
): ImportedGeoJSONLayer {
  const layerId = createLayerId();
  const importedAt = nowIsoTimestamp();
  const featureMetadata = buildFeatureCollectionMetadata(featureCollection);
  const rendering = featureMetadata.rendering ?? buildFeatureCollectionRenderProfile(featureCollection);
  const declaredCrs = metadataOverrides?.crsSummary?.crs ?? metadataOverrides?.columnar?.crs;
  const totalRecords = summaryOverrides?.totalRecords;
  const skippedRecordCount = summaryOverrides?.skippedRecordCount;
  const importedFeatureCount = summaryOverrides?.importedFeatureCount ?? featureCollection.features.length;
  const workerTransferStatus: ImportLayerSourceMetadata["workerTransferStatus"] =
    sourceType === "arrow" || sourceType === "geoparquet" ? "prepared" : "not-required";
  const vectorTiles = rendering.mode === "preview"
    ? buildOnTheFlyVectorTileLayerMetadata(featureCollection, { sourceLayer: "default" })
    : null;
  const caveats = buildImportCaveats({
    sourceType,
    ...(declaredCrs ? { declaredCrs } : {}),
    ...(totalRecords != null ? { totalRecords } : {}),
    ...(skippedRecordCount != null ? { skippedRecordCount } : {}),
    workerTransferStatus,
  });
  if (rendering.mode === "preview") {
    caveats.push("Layer exceeds the interactive browser render budget; the map canvas uses a bounded visual preview while the original source remains available for metadata, export, and worker-backed analysis.");
  }
  if (vectorTiles) {
    caveats.push(...vectorTiles.caveats);
  }
  if (rendering.coordinateCount > MAP_GEOJSON_DEEP_TOPOLOGY_COORDINATE_BUDGET) {
    caveats.push("Deep topology QA was deferred for this large geometry set; structural GeoJSON validation completed, and detailed topology review should run in a worker-backed QA pass before publication.");
  }
  const metadata = {
    ...featureMetadata,
    importFormat: sourceType,
    updatedAt: importedAt,
    dataVersion: importedAt,
    importSource: {
      format: sourceType,
      fileName,
      sourceName: fileName,
      importedAt,
      importedFeatureCount,
      ...(sourceHandleOptions?.sourceSizeBytes != null ? { fileSizeBytes: sourceHandleOptions.sourceSizeBytes } : {}),
      ...(totalRecords != null ? { totalRecords } : {}),
      ...(skippedRecordCount != null ? { skippedRecordCount } : {}),
      ...(declaredCrs ? { declaredCrs } : {}),
      sourceConfidence: declaredCrs ? "declared" : "derived-from-file",
      workerTransferStatus,
      ...(metadataOverrides?.columnar?.workerTableName ? { workerTableName: metadataOverrides.columnar.workerTableName } : {}),
      caveats,
    },
    crsSummary: buildImportCrsSummary(sourceType, declaredCrs),
    licenseAttribution: buildImportLicenseAttribution(fileName),
    scientificQA: buildImportScientificQA({
      layerId,
      sourceType,
      importedAt,
      featureCount: featureCollection.features.length,
      fieldCount: Object.keys(featureCollection.features[0]?.properties ?? {}).length,
      ...(declaredCrs ? { declaredCrs } : {}),
      caveats,
      ...(totalRecords != null ? { totalRecords } : {}),
      ...(skippedRecordCount != null ? { skippedRecordCount } : {}),
      workerTransferStatus,
    }),
    evidenceArtifactId: createEvidenceArtifactId(layerId),
    ...(vectorTiles ? { vectorTiles } : {}),
    ...metadataOverrides,
  };

  const baseLayer: OverlayLayerConfig = {
    id: layerId,
    name: stripExtension(fileName),
    type: "geojson",
    visible: true,
    opacity: 1,
    sourceData: featureCollection,
    sourceKind: "imported",
    qaStatus: metadata.scientificQA.status,
    queryable: true,
    provenance: {
      label: `${sourceType.toUpperCase()} import`,
      sourceName: fileName,
      method: "Browser spatial file import",
      collectedAt: importedAt,
      generatedAt: importedAt,
      notes: caveats,
    },
    metadata,
    group: "data",
  };

  const sourceHandle = createImportSourceHandle({
    layer: baseLayer,
    format: sourceType,
    ...(sourceHandleOptions?.sourceSizeBytes != null ? { sourceSizeBytes: sourceHandleOptions.sourceSizeBytes } : {}),
    ...(sourceHandleOptions?.sourceRef ? { sourceRef: sourceHandleOptions.sourceRef } : {}),
  });
  if (vectorTiles) {
    sourceHandle.vectorTile = {
      sourceMode: vectorTiles.sourceMode,
      generalization: vectorTiles.generalization,
      minZoom: vectorTiles.minZoom,
      maxZoom: vectorTiles.maxZoom,
      tileSize: vectorTiles.tileSize,
      ...(vectorTiles.sourceLayer ? { sourceLayer: vectorTiles.sourceLayer } : {}),
    };
    sourceHandle.caveats = uniqueTextList([...sourceHandle.caveats, ...vectorTiles.caveats]);
  }

  const metadataWithSource = {
    ...metadata,
    sourceId: sourceHandle.sourceId,
    sourceStorageMode: sourceHandle.storageMode,
    sourceRestoreStatus: sourceHandle.restoreStatus,
    importSource: {
      ...metadata.importSource,
      sourceId: sourceHandle.sourceId,
      ...(sourceHandle.sizeBytes != null ? { fileSizeBytes: sourceHandle.sizeBytes } : {}),
    },
    ...(vectorTiles ? { vectorTiles: { ...vectorTiles, sourceId: sourceHandle.sourceId } } : {}),
  } satisfies LayerMetadata;

  const layer = withNormalizedLayerRegistryMetadata(
    applySourceHandleToLayer({
      ...baseLayer,
      metadata: metadataWithSource,
    }, sourceHandle),
  );

  const sourceProfile = createSourceProfile({
    sourceHandle,
    format: sourceType,
    sourceName: fileName,
    supportStatus: "supported",
    canCommit: true,
    profileStrategy: sourceType === "arrow" || sourceType === "geoparquet" ? "sampled" : "full-parse",
    featureCount: importedFeatureCount,
    ...(totalRecords != null ? { totalRecords } : {}),
    ...(skippedRecordCount != null ? { skippedRecordCount } : {}),
    ...(sourceHandle.sizeBytes != null ? { sizeBytes: sourceHandle.sizeBytes } : {}),
    estimatedMemoryBytes: rendering.estimatedRenderBytes,
    ...(metadataWithSource.bounds ? { extent: metadataWithSource.bounds } : {}),
    ...(metadataWithSource.geometrySummary ? { geometrySummary: metadataWithSource.geometrySummary } : {}),
    rendering,
    caveats,
  });

  return {
    featureCollection,
    layer,
    sourceHandle,
    sourceProfile,
    summary: {
      sourceType,
      importedFeatureCount: featureCollection.features.length,
      ...summaryOverrides,
    },
  };
}

function buildColumnarMetadata(artifact: ColumnarImportArtifact): NonNullable<LayerMetadata["columnar"]> {
  return {
    format: artifact.format,
    ...(artifact.geometryColumn ? { geometryColumn: artifact.geometryColumn } : {}),
    geometryEncoding: artifact.geometryEncoding,
    rowCount: artifact.rowCount,
    estimatedMemoryBytes: artifact.estimatedMemoryBytes,
    transferSizeBytes: artifact.transferSizeBytes,
    workerTableName: artifact.workerTableName,
    ...(artifact.geoParquet?.version ? { geoParquetVersion: artifact.geoParquet.version } : {}),
    ...(artifact.geoParquet?.geometryTypes.length ? { geometryTypes: artifact.geoParquet.geometryTypes } : {}),
    ...(artifact.geoParquet?.crs ? { crs: artifact.geoParquet.crs } : {}),
  };
}

function createColumnarImportSession(fileName: string, artifact: ColumnarImportArtifact): ColumnarImportSession {
  if (artifact.importedFeatureCount === 0) {
    throw new MapDataImportError("Columnar dataset did not contain any valid spatial rows.");
  }

  validateFeatureCollection(artifact.featureCollection);

  const result = buildImportedLayer(
    fileName,
    artifact.featureCollection,
    artifact.format,
    {
      totalRecords: artifact.rowCount,
      skippedRecordCount: artifact.skippedRowCount,
      importedFeatureCount: artifact.importedFeatureCount,
    },
    {
      columnar: buildColumnarMetadata(artifact),
    },
    {
      sourceSizeBytes: artifact.transferSizeBytes,
    },
  );

  return {
    kind: "columnar",
    fileName,
    layerName: stripExtension(fileName),
    format: artifact.format,
    rowCount: artifact.rowCount,
    importedFeatureCount: artifact.importedFeatureCount,
    skippedRowCount: artifact.skippedRowCount,
    estimatedMemoryBytes: artifact.estimatedMemoryBytes,
    transferSizeBytes: artifact.transferSizeBytes,
    geometryEncoding: artifact.geometryEncoding,
    ...(artifact.geometryColumn ? { geometryColumn: artifact.geometryColumn } : {}),
    ...(artifact.longitudeColumn ? { longitudeColumn: artifact.longitudeColumn } : {}),
    ...(artifact.latitudeColumn ? { latitudeColumn: artifact.latitudeColumn } : {}),
    schema: artifact.schema,
    previewRows: artifact.previewRows,
    warnings: artifact.warnings,
    workerTableName: artifact.workerTableName,
    ...(artifact.geoParquet ? { geoParquet: artifact.geoParquet } : {}),
    arrowIPC: artifact.arrowIPC,
    result,
    quality: artifact.quality,
    sizeComparison: artifact.sizeComparison,
  };
}

function normalizeCsvHeader(header: string, index: number): string {
  const trimmed = header.trim().replace(/^\uFEFF/, "");
  return trimmed.length > 0 ? trimmed : `column_${index + 1}`;
}

function makeUniqueHeaders(headers: string[]): string[] {
  const counts = new Map<string, number>();
  return headers.map((header) => {
    const seen = counts.get(header) ?? 0;
    counts.set(header, seen + 1);
    if (seen === 0) return header;
    return `${header}_${seen + 1}`;
  });
}

function normalizeHeaderForDetection(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function rankCoordinateCandidates(headers: string[], priority: readonly string[]): string[] {
  const ranked = headers
    .map((header) => ({
      header,
      rank: priority.indexOf(normalizeHeaderForDetection(header) as (typeof priority)[number]),
    }))
    .filter((entry) => entry.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.header.localeCompare(b.header));
  return ranked.map((entry) => entry.header);
}

function autoDetectCoordinateColumns(headers: string[]): {
  latitudeCandidates: string[];
  longitudeCandidates: string[];
  suggestedLatitudeColumn: string | null;
  suggestedLongitudeColumn: string | null;
} {
  const latitudeCandidates = rankCoordinateCandidates(headers, LATITUDE_COLUMN_PRIORITY);
  const longitudeCandidates = rankCoordinateCandidates(headers, LONGITUDE_COLUMN_PRIORITY);

  return {
    latitudeCandidates,
    longitudeCandidates,
    suggestedLatitudeColumn: latitudeCandidates[0] ?? null,
    suggestedLongitudeColumn: longitudeCandidates[0] ?? null,
  };
}

function detectCsvDelimiter(raw: string): string {
  const sampleLines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 5);

  const delimiters = [",", ";", "\t", "|"];
  let bestDelimiter = ",";
  let bestScore = Number.NEGATIVE_INFINITY;

  delimiters.forEach((delimiter) => {
    const score = sampleLines.reduce((total, line) => {
      let inQuotes = false;
      let count = 0;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (char === "\"") {
          if (inQuotes && line[index + 1] === "\"") {
            index += 1;
            continue;
          }
          inQuotes = !inQuotes;
          continue;
        }
        if (!inQuotes && char === delimiter) {
          count += 1;
        }
      }
      return total + count;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  });

  return bestDelimiter;
}

function parseCsvRows(raw: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  const pushCell = (): void => {
    currentRow.push(currentCell);
    currentCell = "";
  };

  const pushRow = (): void => {
    pushCell();
    rows.push(currentRow);
    currentRow = [];
  };

  const normalized = raw.replace(/^\uFEFF/, "");

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];

    if (inQuotes) {
      if (char === "\"") {
        if (normalized[index + 1] === "\"") {
          currentCell += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      pushCell();
      continue;
    }

    if (char === "\n") {
      pushRow();
      continue;
    }

    if (char === "\r") {
      if (normalized[index + 1] === "\n") {
        index += 1;
      }
      pushRow();
      continue;
    }

    currentCell += char;
  }

  if (inQuotes) {
    throw new MapDataImportError("CSV import failed because a quoted value was not closed.");
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    pushRow();
  }

  return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
}

function padRow(row: string[], targetLength: number): string[] {
  if (row.length >= targetLength) return row.slice(0, targetLength);
  return [...row, ...new Array(targetLength - row.length).fill("") as string[]];
}

export function createCsvImportSession(raw: string, fileName: string): CsvImportSession {
  const delimiter = detectCsvDelimiter(raw);
  const parsedRows = parseCsvRows(raw, delimiter);

  if (parsedRows.length < 2) {
    throw new MapDataImportError("CSV import requires a header row and at least one data row.");
  }

  const headers = makeUniqueHeaders(parsedRows[0].map((header, index) => normalizeCsvHeader(header, index)));
  const rows = parsedRows.slice(1).map((row) => padRow(row, headers.length));
  const detection = autoDetectCoordinateColumns(headers);
  const previewRows = rows.slice(0, 5).map((row, index) => ({
    rowNumber: index + 2,
    values: headers.reduce<Record<string, string>>((record, header, headerIndex) => {
      record[header] = row[headerIndex] ?? "";
      return record;
    }, {}),
  }));

  return {
    kind: "csv",
    fileName,
    layerName: stripExtension(fileName),
    headers,
    rows,
    delimiter,
    sourceSizeBytes: estimateStringBytes(raw),
    totalRows: rows.length,
    previewRows,
    latitudeCandidates: detection.latitudeCandidates,
    longitudeCandidates: detection.longitudeCandidates,
    suggestedLatitudeColumn: detection.suggestedLatitudeColumn,
    suggestedLongitudeColumn: detection.suggestedLongitudeColumn,
  };
}

function assertCsvMapping(session: CsvImportSession, mapping: CsvImportMapping): void {
  if (!session.headers.includes(mapping.latitudeColumn)) {
    throw new MapDataImportError("Selected latitude column was not found in the CSV headers.");
  }
  if (!session.headers.includes(mapping.longitudeColumn)) {
    throw new MapDataImportError("Selected longitude column was not found in the CSV headers.");
  }
  if (mapping.latitudeColumn === mapping.longitudeColumn) {
    throw new MapDataImportError("Latitude and longitude columns must be different.");
  }
}

function coerceCsvPropertyValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function completeCsvImport(
  session: CsvImportSession,
  mapping: CsvImportMapping,
): ImportedGeoJSONLayer {
  assertCsvMapping(session, mapping);

  const latitudeIndex = session.headers.indexOf(mapping.latitudeColumn);
  const longitudeIndex = session.headers.indexOf(mapping.longitudeColumn);
  const features: Feature[] = [];
  let skippedRecordCount = 0;

  session.rows.forEach((row) => {
    const latitudeRaw = (row[latitudeIndex] ?? "").trim();
    const longitudeRaw = (row[longitudeIndex] ?? "").trim();
    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);

    if (
      latitudeRaw.length === 0 ||
      longitudeRaw.length === 0 ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      skippedRecordCount += 1;
      return;
    }

    const properties = session.headers.reduce<Record<string, string | null>>((record, header, headerIndex) => {
      if (headerIndex === latitudeIndex || headerIndex === longitudeIndex) {
        return record;
      }
      record[header] = coerceCsvPropertyValue(row[headerIndex] ?? "");
      return record;
    }, {});

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      properties,
    });
  });

  if (features.length === 0) {
    throw new MapDataImportError("CSV import did not contain any rows with valid numeric coordinates.");
  }

  const featureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features,
  };
  validateFeatureCollection(featureCollection);

  return buildImportedLayer(session.fileName, featureCollection, "csv", {
    totalRecords: session.totalRows,
    skippedRecordCount,
    importedFeatureCount: features.length,
  }, undefined, {
    sourceSizeBytes: session.sourceSizeBytes,
  });
}

export type SourceProfileInput =
  | {
      kind: "feature-collection";
      sourceName: string;
      featureCollection: FeatureCollection;
      format?: SourceFormat;
      declaredCrs?: string | null;
      sizeBytes?: number;
      license?: string | null;
      attribution?: string | null;
      caveats?: readonly string[];
    }
  | {
      kind: "csv";
      sourceName: string;
      raw: string;
      mapping?: CsvImportMapping;
    }
  | {
      kind: "csv-session";
      session: CsvImportSession;
      mapping?: CsvImportMapping;
    }
  | {
      kind: "imported-layer";
      result: ImportedGeoJSONLayer;
    }
  | {
      kind: "external-service";
      sourceName?: string;
      metadata: ExternalServiceLayerMetadata;
    }
  | {
      kind: "file-metadata";
      sourceName: string;
      format: SourceFormat;
      sizeBytes?: number;
      sourceRef?: string;
      declaredCrs?: string | null;
      supportStatus?: SourceProfileSupportStatus;
      caveats?: readonly string[];
    };

function effectiveCsvMapping(session: CsvImportSession, mapping?: CsvImportMapping): CsvImportMapping | null {
  const latitudeColumn = mapping?.latitudeColumn ?? session.suggestedLatitudeColumn;
  const longitudeColumn = mapping?.longitudeColumn ?? session.suggestedLongitudeColumn;
  if (!latitudeColumn || !longitudeColumn || latitudeColumn === longitudeColumn) return null;
  if (!session.headers.includes(latitudeColumn) || !session.headers.includes(longitudeColumn)) return null;
  return { latitudeColumn, longitudeColumn };
}

function countCsvSpatialRows(session: CsvImportSession, mapping: CsvImportMapping): {
  importedFeatureCount: number;
  skippedRecordCount: number;
} {
  const latitudeIndex = session.headers.indexOf(mapping.latitudeColumn);
  const longitudeIndex = session.headers.indexOf(mapping.longitudeColumn);
  let importedFeatureCount = 0;
  let skippedRecordCount = 0;

  for (const row of session.rows) {
    const latitudeRaw = (row[latitudeIndex] ?? "").trim();
    const longitudeRaw = (row[longitudeIndex] ?? "").trim();
    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);
    if (
      latitudeRaw.length === 0 ||
      longitudeRaw.length === 0 ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      skippedRecordCount += 1;
      continue;
    }
    importedFeatureCount += 1;
  }

  return { importedFeatureCount, skippedRecordCount };
}

function buildCsvProfileSchemaSummary(session: CsvImportSession, mapping: CsvImportMapping | null): LayerSchemaSummary {
  return {
    fieldCount: session.headers.length,
    fields: session.headers.map((name) => ({
      name,
      role: mapping && (name === mapping.latitudeColumn || name === mapping.longitudeColumn) ? "geometry" : "attribute",
      type: "string",
      nullable: true,
    })),
    source: "import-source",
    notes: ["CSV schema was inferred from the header row before commit."],
  };
}

export function profileCsvImportSession(session: CsvImportSession, mapping?: CsvImportMapping): SourceProfile {
  const resolvedMapping = effectiveCsvMapping(session, mapping);
  const rowCounts = resolvedMapping ? countCsvSpatialRows(session, resolvedMapping) : null;
  const crsSummary = buildProfileCrsSummary({ format: "csv" });
  const schemaSummary = buildCsvProfileSchemaSummary(session, resolvedMapping);
  const geometrySummary: LayerGeometrySummary = {
    geometryType: "Point",
    geometryTypes: ["Point"],
    featureCount: rowCounts?.importedFeatureCount ?? null,
    source: "import-source",
    notes: [resolvedMapping
      ? `Point geometry will be derived from ${resolvedMapping.longitudeColumn} / ${resolvedMapping.latitudeColumn}.`
      : "Point geometry is pending distinct latitude and longitude column selection."],
  };
  const profiledAt = nowIsoTimestamp();
  const caveats = uniqueTextList([
    "CSV point geometry will be derived from latitude/longitude columns; verify coordinate semantics before analysis.",
    "CSV import does not declare CRS metadata; CRS remains unknown until reviewed.",
    "Local CSV import does not declare license or attribution metadata.",
    ...(resolvedMapping ? [] : ["Choose distinct latitude and longitude columns before commit."]),
    ...(rowCounts && rowCounts.skippedRecordCount > 0
      ? [`${rowCounts.skippedRecordCount.toLocaleString()} skipped rows will be excluded because coordinates are missing or invalid.`]
      : []),
  ]);
  const layer = createProfileLayer({
    idPrefix: "csv-profile",
    sourceName: session.fileName,
    kind: "imported",
    format: "csv",
    crsSummary,
    featureCount: rowCounts?.importedFeatureCount ?? null,
    geometrySummary,
    schemaSummary,
    caveats,
    profiledAt,
  });
  const sourceHandle = createImportSourceHandle({
    layer,
    format: "csv",
    sourceSizeBytes: session.sourceSizeBytes,
    caveats,
    profiledAt,
  });
  sourceHandle.crsSummary = crsSummary;

  return createSourceProfile({
    sourceHandle,
    format: "csv",
    sourceName: session.fileName,
    supportStatus: "supported",
    canCommit: Boolean(resolvedMapping && rowCounts && rowCounts.importedFeatureCount > 0),
    // Counts every already-parsed session row for an exact skipped-row total; this is a
    // full pass over the in-memory session, not a bounded sample, so report it truthfully.
    profileStrategy: "full-parse",
    featureCount: rowCounts?.importedFeatureCount ?? null,
    totalRecords: session.totalRows,
    ...(rowCounts ? { skippedRecordCount: rowCounts.skippedRecordCount } : {}),
    sizeBytes: session.sourceSizeBytes,
    estimatedMemoryBytes: Math.max(session.sourceSizeBytes, session.totalRows * ESTIMATED_BYTES_PER_FEATURE),
    geometrySummary,
    caveats,
  });
}

function profileFeatureCollectionSource(input: Extract<SourceProfileInput, { kind: "feature-collection" }>): SourceProfile {
  const format = input.format ?? "geojson";
  const featureMetadata = buildFeatureCollectionMetadata(input.featureCollection);
  const rendering = featureMetadata.rendering ?? buildFeatureCollectionRenderProfile(input.featureCollection);
  const crsSummary = buildProfileCrsSummary({ format, declaredCrs: input.declaredCrs });
  const profiledAt = nowIsoTimestamp();
  const sizeBytes = input.sizeBytes ?? rendering.estimatedRenderBytes;
  const caveats = uniqueTextList([
    ...(input.caveats ?? []),
    ...(input.featureCollection.features.length === 0 ? ["Source profile contains no features to commit."] : []),
    ...(crsSummary.status === "known" ? [] : [crsSummary.status === "missing" ? "Source CRS metadata is missing." : "Source CRS metadata is unknown." ]),
    ...(input.license || input.attribution ? [] : ["License and attribution are unknown for this source profile."]),
    ...rendering.warnings,
  ]);
  const layer = createProfileLayer({
    idPrefix: "source-profile",
    sourceName: input.sourceName,
    kind: "imported",
    format,
    crsSummary,
    featureCount: input.featureCollection.features.length,
    ...(featureMetadata.geometrySummary ? { geometrySummary: featureMetadata.geometrySummary } : {}),
    ...(featureMetadata.schemaSummary ? { schemaSummary: featureMetadata.schemaSummary } : {}),
    ...(featureMetadata.bounds ? { extent: featureMetadata.bounds } : {}),
    caveats,
    ...(input.license != null ? { license: input.license } : {}),
    ...(input.attribution != null ? { attribution: input.attribution } : {}),
    profiledAt,
  });
  const sourceHandle = createImportSourceHandle({
    layer,
    format,
    sourceSizeBytes: sizeBytes,
    caveats,
    profiledAt,
  });
  sourceHandle.crsSummary = crsSummary;

  return createSourceProfile({
    sourceHandle,
    format,
    sourceName: input.sourceName,
    supportStatus: sourceProfileSupportStatus(format),
    canCommit: sourceProfileCanCommit(format) && input.featureCollection.features.length > 0,
    profileStrategy: "full-parse",
    featureCount: input.featureCollection.features.length,
    sizeBytes,
    estimatedMemoryBytes: rendering.estimatedRenderBytes,
    ...(featureMetadata.geometrySummary ? { geometrySummary: featureMetadata.geometrySummary } : {}),
    ...(featureMetadata.bounds ? { extent: featureMetadata.bounds } : {}),
    rendering,
    caveats,
  });
}

function externalServiceFormat(kind: ExternalServiceLayerMetadata["kind"]): SourceFormat {
  switch (kind) {
    case "wms":
      return "wms";
    case "wfs":
      return "wfs";
    case "cityjson":
      return "cityjson";
    case "xyz":
    case "wmts":
    case "overpass":
    default:
      return "xyz";
  }
}

function profileExternalServiceSource(input: Extract<SourceProfileInput, { kind: "external-service" }>): SourceProfile {
  const format = externalServiceFormat(input.metadata.kind);
  const sourceName = input.sourceName ?? input.metadata.title ?? input.metadata.layerName ?? input.metadata.endpoint;
  const profiledAt = nowIsoTimestamp();
  const crsSummary = buildProfileCrsSummary({
    format,
    declaredCrs: input.metadata.crs,
    source: "external-service",
  });
  const caveats = uniqueTextList([
    ...(input.metadata.caveats ?? []),
    ...(input.metadata.dependencyStatus === "offline" ? [input.metadata.offlineReason ?? "External service is offline or unreachable."] : []),
    "External service source is environment-dependent; validate CORS, credentials, and provider availability before publication.",
  ]);
  const sourceHandle: SourceHandle = {
    sourceId: `source-profile-${format}-${sanitizeSourceName(sourceName)}`,
    kind: "external",
    storageMode: "external-service",
    restoreStatus: input.metadata.dependencyStatus === "offline" ? "unavailable" : "external-reference",
    format,
    crsSummary,
    featureCount: null,
    sourceRef: input.metadata.endpoint,
    caveats,
    profiledAt,
  };
  if (input.metadata.license) sourceHandle.license = input.metadata.license;
  if (input.metadata.attribution) sourceHandle.attribution = input.metadata.attribution;

  return createSourceProfile({
    sourceHandle,
    format,
    sourceName,
    supportStatus: "partial",
    canCommit: input.metadata.dependencyStatus !== "offline",
    profileStrategy: "metadata-only",
    featureCount: null,
    ...(input.metadata.bounds ? { extent: input.metadata.bounds } : {}),
    workerReady: false,
    caveats,
  });
}

function profileFileMetadataSource(input: Extract<SourceProfileInput, { kind: "file-metadata" }>): SourceProfile {
  const supportStatus = input.supportStatus ?? sourceProfileSupportStatus(input.format);
  const profiledAt = nowIsoTimestamp();
  const crsSummary = buildProfileCrsSummary({ format: input.format, declaredCrs: input.declaredCrs });
  const caveats = uniqueTextList([
    ...(input.caveats ?? []),
    ...(supportStatus === "supported" ? [] : [`${input.format.toUpperCase()} profiling is metadata-only in this slice; full import is not committed yet.`]),
    ...(crsSummary.status === "known" ? [] : ["CRS is not available from file metadata preflight."]),
  ]);
  const sourceHandle: SourceHandle = {
    sourceId: `source-profile-${input.format}-${sanitizeSourceName(input.sourceName)}`,
    kind: "imported",
    storageMode: input.sourceRef ? "url-refetch" : "metadata-only",
    restoreStatus: input.sourceRef ? "external-reference" : "metadata-only",
    format: input.format,
    crsSummary,
    featureCount: null,
    caveats,
    profiledAt,
  };
  if (input.sizeBytes != null) sourceHandle.sizeBytes = input.sizeBytes;
  if (input.sourceRef) sourceHandle.sourceRef = input.sourceRef;

  return createSourceProfile({
    sourceHandle,
    format: input.format,
    sourceName: input.sourceName,
    supportStatus,
    canCommit: false,
    profileStrategy: "metadata-only",
    featureCount: null,
    ...(input.sizeBytes != null ? { sizeBytes: input.sizeBytes } : {}),
    caveats,
  });
}

export function profileSource(input: SourceProfileInput): SourceProfile {
  switch (input.kind) {
    case "feature-collection":
      return profileFeatureCollectionSource(input);
    case "csv":
      return profileCsvImportSession(createCsvImportSession(input.raw, input.sourceName), input.mapping);
    case "csv-session":
      return profileCsvImportSession(input.session, input.mapping);
    case "imported-layer":
      return input.result.sourceProfile;
    case "external-service":
      return profileExternalServiceSource(input);
    case "file-metadata":
    default:
      return profileFileMetadataSource(input);
  }
}

function sanitizeSourceName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "source";
}

function requireDomParser(): DOMParser {
  if (typeof DOMParser === "undefined") {
    throw new MapDataImportError("XML parsing requires DOMParser support in this environment.");
  }
  return new DOMParser();
}

function parseXmlDocument(raw: string, label: string): Document {
  const parser = requireDomParser();
  const document = parser.parseFromString(raw, "application/xml");
  const parserErrors = Array.from(document.getElementsByTagName("parsererror"));
  if (parserErrors.length > 0 || document.documentElement.localName === "parsererror") {
    throw new MapDataImportError(`${label} file is not valid XML.`);
  }
  return document;
}

function getChildElementsByLocalName(parent: Element, localName: string): Element[] {
  return Array.from(parent.children).filter((child) => child.localName === localName);
}

function getElementsByLocalName(root: Document | Element, localName: string): Element[] {
  return Array.from(root.getElementsByTagName("*")).filter((node) => node.localName === localName);
}

function getFirstChildText(parent: Element, localName: string): string | undefined {
  const child = getChildElementsByLocalName(parent, localName)[0];
  const value = child?.textContent?.trim();
  return value ? value : undefined;
}

function getFirstDescendantText(parent: Element, localName: string): string | undefined {
  const child = getElementsByLocalName(parent, localName)[0];
  const value = child?.textContent?.trim();
  return value ? value : undefined;
}

function closeRingIfNeeded(ring: GeoJSON.Position[]): GeoJSON.Position[] {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!positionsEqual(first, last)) {
    return [...ring, [...first] as GeoJSON.Position];
  }
  return ring;
}

function parseCoordinateTuple(value: string, context: string): GeoJSON.Position {
  const parts = value.split(",").map((entry) => entry.trim());
  if (parts.length < 2) {
    throw new MapDataImportError(`${context} contains an invalid coordinate tuple.`);
  }
  const longitude = Number(parts[0]);
  const latitude = Number(parts[1]);
  const altitude = parts[2] != null && parts[2] !== "" ? Number(parts[2]) : undefined;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new MapDataImportError(`${context} contains invalid numeric coordinates.`);
  }
  if (altitude != null && Number.isFinite(altitude)) {
    return [longitude, latitude, altitude];
  }
  return [longitude, latitude];
}

function parseKmlCoordinates(raw: string, context: string): GeoJSON.Position[] {
  const tuples = raw
    .trim()
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (tuples.length === 0) {
    throw new MapDataImportError(`${context} does not contain any coordinates.`);
  }

  return tuples.map((tuple) => parseCoordinateTuple(tuple, context));
}

function cloneFeatureTemplate(properties: GeoJsonProperties): Record<string, unknown> {
  return properties == null ? {} : JSON.parse(JSON.stringify(properties)) as Record<string, unknown>;
}

function parseKmlGeometryElement(
  element: Element,
  properties: GeoJsonProperties,
): Feature[] {
  switch (element.localName) {
    case "Point": {
      const coordinates = getFirstDescendantText(element, "coordinates");
      if (!coordinates) return [];
      return [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: parseCoordinateTuple(coordinates.trim(), "KML Point"),
          },
          properties: cloneFeatureTemplate(properties),
        },
      ];
    }
    case "LineString": {
      const coordinates = getFirstDescendantText(element, "coordinates");
      if (!coordinates) return [];
      return [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: parseKmlCoordinates(coordinates, "KML LineString"),
          },
          properties: cloneFeatureTemplate(properties),
        },
      ];
    }
    case "Polygon": {
      const outerRing = getChildElementsByLocalName(element, "outerBoundaryIs")[0];
      const outerCoordinates = outerRing
        ? getFirstDescendantText(outerRing, "coordinates")
        : undefined;
      if (!outerCoordinates) return [];

      const rings: GeoJSON.Position[][] = [
        closeRingIfNeeded(parseKmlCoordinates(outerCoordinates, "KML Polygon outer ring")),
      ];

      getChildElementsByLocalName(element, "innerBoundaryIs").forEach((innerBoundary, index) => {
        const innerCoordinates = getFirstDescendantText(innerBoundary, "coordinates");
        if (!innerCoordinates) return;
        rings.push(
          closeRingIfNeeded(parseKmlCoordinates(innerCoordinates, `KML Polygon inner ring ${index + 1}`)),
        );
      });

      return [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: rings,
          },
          properties: cloneFeatureTemplate(properties),
        },
      ];
    }
    case "MultiGeometry":
      return Array.from(element.children).flatMap((child) =>
        parseKmlGeometryElement(child, properties),
      );
    default:
      return [];
  }
}

export function parseKMLText(raw: string): FeatureCollection {
  const document = parseXmlDocument(raw, "KML");
  const placemarks = getElementsByLocalName(document, "Placemark");
  const features = placemarks.flatMap((placemark) => {
    const properties: GeoJsonProperties = {};
    const name = getFirstChildText(placemark, "name");
    const description = getFirstChildText(placemark, "description");
    if (name) properties.name = name;
    if (description) properties.description = description;
    return Array.from(placemark.children).flatMap((child) =>
      parseKmlGeometryElement(child, properties),
    );
  });

  if (features.length === 0) {
    throw new MapDataImportError("KML import did not contain any supported Placemark geometries.");
  }

  const featureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features,
  };
  validateFeatureCollection(featureCollection);
  return featureCollection;
}

interface GpxPointData {
  coordinates: GeoJSON.Position;
  ele?: number;
  time?: string;
}

function parseGpxPoint(element: Element, context: string): GpxPointData {
  const latitude = Number(element.getAttribute("lat"));
  const longitude = Number(element.getAttribute("lon"));
  const elevationText = getFirstChildText(element, "ele");
  const elevation = elevationText != null ? Number(elevationText) : undefined;
  const time = getFirstChildText(element, "time");

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new MapDataImportError(`${context} is missing valid lat/lon attributes.`);
  }

  const hasElevation = elevation != null && Number.isFinite(elevation);

  return {
    coordinates: hasElevation ? [longitude, latitude, elevation] : [longitude, latitude],
    ...(hasElevation ? { ele: elevation } : {}),
    ...(time ? { time } : {}),
  };
}

function appendPointSeriesProperties(
  properties: GeoJsonProperties,
  points: GpxPointData[],
): Record<string, unknown> {
  const elevations = points
    .map((point) => point.ele)
    .filter((value): value is number => value != null);
  const times = points
    .map((point) => point.time)
    .filter((value): value is string => Boolean(value));

  const next = cloneFeatureTemplate(properties);
  if (elevations.length > 0) next.ele = elevations;
  if (times.length > 0) next.time = times;
  return next;
}

export function parseGPXText(raw: string): FeatureCollection {
  const document = parseXmlDocument(raw, "GPX");
  const features: Feature[] = [];

  getElementsByLocalName(document, "wpt").forEach((waypoint) => {
    const point = parseGpxPoint(waypoint, "GPX waypoint");
    const properties: GeoJsonProperties = {};
    const name = getFirstChildText(waypoint, "name");
    const description = getFirstChildText(waypoint, "desc");
    if (name) properties.name = name;
    if (description) properties.desc = description;
    if (point.ele != null) properties.ele = point.ele;
    if (point.time) properties.time = point.time;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: point.coordinates,
      },
      properties,
    });
  });

  getElementsByLocalName(document, "rte").forEach((route) => {
    const routePoints = getChildElementsByLocalName(route, "rtept").map((point, index) =>
      parseGpxPoint(point, `GPX route point ${index + 1}`),
    );
    if (routePoints.length < 2) return;

    const properties: GeoJsonProperties = {};
    const name = getFirstChildText(route, "name");
    const description = getFirstChildText(route, "desc");
    if (name) properties.name = name;
    if (description) properties.desc = description;

    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routePoints.map((point) => point.coordinates),
      },
      properties: appendPointSeriesProperties(properties, routePoints),
    });
  });

  getElementsByLocalName(document, "trk").forEach((track) => {
    const baseProperties: GeoJsonProperties = {};
    const name = getFirstChildText(track, "name");
    const description = getFirstChildText(track, "desc");
    if (name) baseProperties.name = name;
    if (description) baseProperties.desc = description;

    const segments = getChildElementsByLocalName(track, "trkseg");
    segments.forEach((segment, segmentIndex) => {
      const points = getChildElementsByLocalName(segment, "trkpt").map((point, pointIndex) =>
        parseGpxPoint(point, `GPX track segment ${segmentIndex + 1} point ${pointIndex + 1}`),
      );
      if (points.length < 2) return;

      const properties = appendPointSeriesProperties(baseProperties, points);
      if (segments.length > 1) {
        properties.segmentIndex = segmentIndex + 1;
      }

      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: points.map((point) => point.coordinates),
        },
        properties,
      });
    });
  });

  if (features.length === 0) {
    throw new MapDataImportError("GPX import did not contain any supported waypoints, routes, or tracks.");
  }

  const featureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features,
  };
  validateFeatureCollection(featureCollection);
  return featureCollection;
}

export async function parseKMZArrayBuffer(data: ArrayBuffer): Promise<FeatureCollection> {
  const archive = await JSZip.loadAsync(data);
  const kmlFile = Object.values(archive.files)
    .filter((entry) => !entry.dir && entry.name.toLowerCase().endsWith(".kml"))
    .sort((left, right) => {
      const leftScore = left.name.toLowerCase().endsWith("doc.kml") ? -1 : 0;
      const rightScore = right.name.toLowerCase().endsWith("doc.kml") ? -1 : 0;
      return leftScore - rightScore || left.name.localeCompare(right.name);
    })[0];

  if (!kmlFile) {
    throw new MapDataImportError("KMZ import did not contain a KML document.");
  }

  const raw = await kmlFile.async("string");
  return parseKMLText(raw);
}

export async function importGeoJSONFile(
  file: File,
  options?: {
    onProgress?: (progress: MapImportProgress) => void;
  },
): Promise<ImportedGeoJSONLayer> {
  assertGeoJSONFile(file);
  const raw = await readFileAsText(file, options?.onProgress);
  const featureCollection = parseGeoJSONText(raw);
  return buildImportedLayer(file.name, featureCollection, "geojson", undefined, undefined, {
    sourceSizeBytes: file.size,
  });
}

/**
 * Extracts an EPSG code from a Shapefile .prj WKT string.
 * Looks for AUTHORITY["EPSG","<code>"] and returns "EPSG:<code>", or null if not found.
 */
export function parsePrjText(prjText: string): string | null {
  const match = /AUTHORITY\["EPSG"\s*,\s*"(\d+)"\]/i.exec(prjText);
  return match ? `EPSG:${match[1]}` : null;
}

/**
 * Builds an ImportedGeoJSONLayer from a FeatureCollection with explicit CRS information.
 * Extracted as a testable helper for Shapefile import logic.
 */
export function buildShapefileLayerFromFc(
  fileName: string,
  featureCollection: FeatureCollection,
  epsgCode: string | null,
): ImportedGeoJSONLayer {
  const crsSummary: LayerCrsSummary = epsgCode
    ? {
        crs: epsgCode,
        status: "known",
        source: "import-source",
        notes: ["CRS read from Shapefile .prj file; verify suitability before analytical measurement."],
      }
    : {
        crs: null,
        status: "missing",
        source: "import-source",
        notes: ["Shapefile .prj was not present or could not be read; CRS unknown."],
      };

  return buildImportedLayer(
    fileName,
    featureCollection,
    "shapefile",
    undefined,
    { crsSummary },
  );
}

const GEO_PACKAGE_CRS_KEYS = [
  "crs",
  "coordinateReferenceSystem",
  "coordinate_reference_system",
  "epsg",
  "epsgCode",
  "srs",
  "srsId",
  "srs_id",
  "spatialReference",
  "spatial_reference",
  "projection",
  "proj",
] as const;

const GEO_PACKAGE_CRS_SCAN_SKIP_KEYS = new Set([
  "data",
  "features",
  "properties",
  "geometry",
  "coordinates",
]);

function normalizeEpsgCandidate(value: unknown): string | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return `EPSG:${value}`;
  }
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const authority = parsePrjText(trimmed);
  if (authority) {
    return authority;
  }

  const epsgMatch = /\bEPSG(?::|\/|\s+)?(\d{3,6})\b/i.exec(trimmed);
  if (epsgMatch?.[1]) {
    return `EPSG:${epsgMatch[1]}`;
  }

  if (/^\d{3,6}$/.test(trimmed)) {
    return `EPSG:${trimmed}`;
  }

  return null;
}

function findGeoPackageEpsgCode(value: unknown, depth = 0): string | null {
  if (depth > 5) {
    return null;
  }

  const direct = normalizeEpsgCandidate(value);
  if (direct) {
    return direct;
  }

  if (Array.isArray(value)) {
    for (const entry of value.slice(0, 24)) {
      const nested = findGeoPackageEpsgCode(entry, depth + 1);
      if (nested) return nested;
    }
    return null;
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of GEO_PACKAGE_CRS_KEYS) {
    const nested = findGeoPackageEpsgCode(record[key], depth + 1);
    if (nested) return nested;
  }

  for (const [key, nestedValue] of Object.entries(record)) {
    if (GEO_PACKAGE_CRS_SCAN_SKIP_KEYS.has(key)) {
      continue;
    }
    const nested = findGeoPackageEpsgCode(nestedValue, depth + 1);
    if (nested) return nested;
  }

  return null;
}

export function extractGeoPackageLayerCrsSummary(layer: Record<string, unknown>): LayerCrsSummary {
  const epsgCode = findGeoPackageEpsgCode(layer);
  if (epsgCode) {
    return {
      crs: epsgCode,
      status: "known",
      source: "import-source",
      notes: ["CRS read from GeoPackage layer metadata; verify suitability before analytical measurement."],
    };
  }

  return {
    crs: null,
    status: "missing",
    source: "import-source",
    notes: ["GeoPackage layer did not expose embedded CRS metadata through the browser loader; declare CRS before metric analysis."],
  };
}

/**
 * Parses a zipped Shapefile (or bare .shp) using shpjs.
 * Returns an ImportedGeoJSONLayer with CRS derived from the embedded .prj file.
 */
async function parseShapefileZip(data: ArrayBuffer, fileName: string): Promise<ImportedGeoJSONLayer> {
  const shpjs = (await import("shpjs")).default;
  const JSZipMod = (await import("jszip")).default;

  let rawResult: FeatureCollection | FeatureCollection[];
  try {
    rawResult = await shpjs(data);
  } catch (err) {
    throw new MapDataImportError(
      `Shapefile import failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const featureCollection: FeatureCollection = Array.isArray(rawResult)
    ? (rawResult[0] ?? { type: "FeatureCollection", features: [] })
    : rawResult;

  // Attempt to read .prj from the zip for CRS detection
  let epsgCode: string | null = null;
  try {
    const archive = await JSZipMod.loadAsync(data);
    const prjEntry = Object.values(archive.files).find(
      (entry) => !entry.dir && entry.name.toLowerCase().endsWith(".prj"),
    );
    if (prjEntry) {
      const prjText = await prjEntry.async("string");
      epsgCode = parsePrjText(prjText);
    }
  } catch {
    // .prj not readable — CRS will be missing
  }

  validateFeatureCollection(featureCollection);
  return buildShapefileLayerFromFc(fileName, featureCollection, epsgCode);
}

/**
 * Parses a GeoPackage ArrayBuffer using @loaders.gl/geopackage.
 * Returns a GeoPackageImportSession listing available layers.
 */
async function parseGeoPackageArrayBuffer(data: ArrayBuffer, fileName: string): Promise<GeoPackageImportSession> {
  const { GeoPackageLoader } = await import("@loaders.gl/geopackage");
  const { load } = await import("@loaders.gl/core");

  let gpkg: unknown;
  try {
    gpkg = await load(new Uint8Array(data), GeoPackageLoader, { worker: false });
  } catch (err) {
    throw new MapDataImportError(
      `GeoPackage import failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // GeoPackageLoader returns an object with a layers array
  const gpkgObj = gpkg as Record<string, unknown>;
  const rawLayers = Array.isArray(gpkgObj["layers"]) ? (gpkgObj["layers"] as unknown[]) : [];

  const layers: GeoPackageLayerInfo[] = rawLayers.map((layer) => {
    const l = layer as Record<string, unknown>;
    const tableName = typeof l["name"] === "string" ? l["name"] : typeof l["id"] === "string" ? l["id"] : "unknown";
    const featureCount =
      typeof l["length"] === "number"
        ? l["length"]
        : Array.isArray(l["data"])
          ? (l["data"] as unknown[]).length
          : null;
    const geometryType =
      typeof l["schema"] === "object" && l["schema"] !== null
        ? (((l["schema"] as Record<string, unknown>)["metadata"] as Record<string, unknown> | undefined)?.["geometryType"] as string | undefined) ?? null
        : null;
    return {
      tableName,
      featureCount,
      geometryType,
      crsSummary: extractGeoPackageLayerCrsSummary(l),
    };
  });

  return {
    kind: "geopackage",
    fileName,
    layers,
    _data: data,
  };
}

/**
 * Commits a single named layer from a GeoPackageImportSession to an ImportedGeoJSONLayer.
 */
export async function commitGeoPackageLayer(
  session: GeoPackageImportSession,
  tableName: string,
): Promise<ImportedGeoJSONLayer> {
  const { GeoPackageLoader } = await import("@loaders.gl/geopackage");
  const { load } = await import("@loaders.gl/core");

  let gpkg: unknown;
  try {
    gpkg = await load(new Uint8Array(session._data), GeoPackageLoader, { worker: false, geopackage: { sqlJsCDN: undefined } });
  } catch (err) {
    throw new MapDataImportError(
      `GeoPackage layer commit failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const gpkgObj = gpkg as Record<string, unknown>;
  const rawLayers = Array.isArray(gpkgObj["layers"]) ? (gpkgObj["layers"] as unknown[]) : [];

  const targetLayer = rawLayers.find((layer) => {
    const l = layer as Record<string, unknown>;
    return l["name"] === tableName || l["id"] === tableName;
  }) as Record<string, unknown> | undefined;

  if (!targetLayer) {
    throw new MapDataImportError(`GeoPackage layer "${tableName}" was not found in the file.`);
  }

  // Extract features from the layer data
  const rawData = Array.isArray(targetLayer["data"])
    ? (targetLayer["data"] as unknown[])
    : [];

  const features: Feature[] = rawData.map((row) => {
    const r = row as Record<string, unknown>;
    const geometry = (r["geometry"] as Geometry | null | undefined) ?? null;
    const { geometry: _g, ...rest } = r;
    void _g;
    return {
      type: "Feature",
      geometry: geometry as Geometry,
      properties: rest as GeoJsonProperties,
    };
  }).filter((f) => f.geometry != null);

  const featureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  validateFeatureCollection(featureCollection);

  return buildImportedLayer(
    session.fileName,
    featureCollection,
    "geopackage",
    undefined,
    {
      crsSummary: extractGeoPackageLayerCrsSummary(targetLayer),
    },
  );
}

function buildGeoTiffCrsSummary(inspection: GeoTiffInspection): LayerCrsSummary {
  if (inspection.metadata.epsgCode) {
    return {
      crs: inspection.metadata.epsgCode,
      status: "known",
      source: "import-source",
      notes: ["CRS read from GeoTIFF GeoKey metadata; verify analytical suitability before metric use."],
    };
  }

  return {
    crs: null,
    status: "missing",
    source: "import-source",
    notes: ["GeoTIFF did not expose an EPSG CRS; declare CRS before spatial analysis or publication."],
  };
}

function rasterImageCoordinates(
  bbox: GeoTiffInspection["metadata"]["bbox"],
): MapRasterLayerMetadata["imageCoordinates"] | null {
  if (!bbox) return null;
  const [west, south, east, north] = bbox;
  return [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ];
}

function normalizeRasterQa(qa: LayerScientificQAMetadata, caveats: readonly string[]): LayerScientificQAMetadata {
  const status = qa.status === "passed" || qa.status === "warning" ? qa.status : "error";
  return {
    ...qa,
    status,
    caveats: uniqueTextList([...qa.caveats, ...caveats]),
  };
}

export function buildGeoTiffImportedRasterLayer(
  fileName: string,
  inspection: GeoTiffInspection,
  options?: {
    sourceSizeBytes?: number;
  },
): ImportedRasterLayer {
  const layerId = createLayerId("raster");
  const importedAt = nowIsoTimestamp();
  const renderConfig = defaultRasterRenderConfig();
  const selectedBandIndex = renderConfig.selectedBandIndex;
  const bandSample = inspection.bandSamples[selectedBandIndex] ?? inspection.bandSamples[0];
  const histogram = bandSample
    ? computeHistogram(bandSample.samples, inspection.metadata.noData, 32)
    : {
        stats: { min: 0, max: 0, mean: 0, noDataCount: 0, sampleCount: 0, validCount: 0 },
        bins: [],
        binCount: 32,
        sampledCount: 0,
      };
  const imageCoordinates = rasterImageCoordinates(inspection.metadata.bbox);
  const crsSummary = buildGeoTiffCrsSummary(inspection);
  const rasterCaveats = uniqueTextList([
    ...inspection.caveats,
    "GeoTIFF is rendered as a bounded sampled image preview; full-resolution raster analytics remain worker-gated.",
    ...(imageCoordinates ? [] : ["GeoTIFF did not expose a geographic bounding box; the raster layer is imported for inspection but remains hidden until georeferencing is repaired."]),
    "Imported file license and attribution are not declared by the browser import pipeline; review before publication.",
  ]);
  const rasterMetadata: MapRasterLayerMetadata = {
    version: 1,
    sourceFormat: "geotiff",
    renderMode: "sampled-image",
    width: inspection.metadata.width,
    height: inspection.metadata.height,
    bandCount: inspection.metadata.bandCount,
    selectedBandIndex,
    noData: inspection.metadata.noData,
    epsgCode: inspection.metadata.epsgCode,
    sampled: inspection.metadata.sampled,
    sampleWidth: inspection.metadata.sampleWidth,
    sampleHeight: inspection.metadata.sampleHeight,
    ...(imageCoordinates ? { imageCoordinates } : {}),
    caveats: rasterCaveats,
  };
  const scientificQA = normalizeRasterQa(assessRasterQA(inspection.metadata), rasterCaveats);
  const metadata: LayerMetadata = {
    geometryType: "Raster",
    geometrySummary: {
      geometryType: "Raster",
      geometryTypes: ["Raster"],
      featureCount: null,
      source: "import-source",
      notes: ["GeoTIFF geometry is represented as sampled raster pixels, not vector features."],
      ...(inspection.metadata.bbox ? { bounds: inspection.metadata.bbox } : {}),
    },
    ...(inspection.metadata.bbox ? { bounds: inspection.metadata.bbox } : {}),
    fields: inspection.metadata.bands.map((band) => band.label),
    importFormat: "geotiff",
    updatedAt: importedAt,
    dataVersion: `geotiff:${importedAt}`,
    importSource: {
      format: "geotiff",
      fileName,
      sourceName: fileName,
      importedAt,
      importedFeatureCount: 0,
      ...(options?.sourceSizeBytes != null ? { fileSizeBytes: options.sourceSizeBytes } : {}),
      ...(inspection.metadata.epsgCode ? { declaredCrs: inspection.metadata.epsgCode } : {}),
      sourceConfidence: inspection.metadata.epsgCode ? "declared" : "unknown",
      workerTransferStatus: "not-required",
      caveats: rasterCaveats,
    },
    crsSummary,
    schemaSummary: {
      fieldCount: inspection.metadata.bandCount,
      fields: inspection.metadata.bands.map((band) => ({
        name: band.label,
        role: "attribute",
        type: band.dtype,
      })),
      source: "import-source",
      notes: ["GeoTIFF band metadata is exposed as raster schema fields for inspection and reporting."],
    },
    licenseAttribution: buildImportLicenseAttribution(fileName),
    scientificQA,
    evidenceArtifactId: createEvidenceArtifactId(layerId),
    raster: rasterMetadata,
  };
  const layerBase: OverlayLayerConfig = {
    id: layerId,
    name: stripExtension(fileName),
    type: "raster-tile",
    visible: Boolean(imageCoordinates),
    opacity: renderConfig.opacity,
    sourceData: createGeoTiffSampleImageDataUrl(inspection, selectedBandIndex),
    sourceKind: "imported",
    qaStatus: scientificQA.status,
    queryable: false,
    provenance: {
      label: "GEOTIFF import",
      sourceName: fileName,
      method: "Browser GeoTIFF sampled raster import",
      collectedAt: importedAt,
      generatedAt: importedAt,
      notes: rasterCaveats,
    },
    metadata,
    group: "data",
  };
  const sourceHandle = createImportSourceHandle({
    layer: layerBase,
    format: "geotiff",
    ...(options?.sourceSizeBytes != null ? { sourceSizeBytes: options.sourceSizeBytes } : {}),
  });
  const metadataWithSource = {
    ...metadata,
    sourceId: sourceHandle.sourceId,
    sourceStorageMode: sourceHandle.storageMode,
    sourceRestoreStatus: sourceHandle.restoreStatus,
    importSource: {
      ...metadata.importSource,
      sourceId: sourceHandle.sourceId,
      ...(sourceHandle.sizeBytes != null ? { fileSizeBytes: sourceHandle.sizeBytes } : {}),
    },
  } satisfies LayerMetadata;
  const layer = withNormalizedLayerRegistryMetadata(
    applySourceHandleToLayer({
      ...layerBase,
      metadata: metadataWithSource,
    }, sourceHandle),
  );
  const pixelCount = inspection.metadata.width * inspection.metadata.height;
  const sourceProfile = createSourceProfile({
    sourceHandle,
    format: "geotiff",
    sourceName: fileName,
    supportStatus: "supported",
    canCommit: true,
    profileStrategy: "sampled",
    featureCount: null,
    ...(sourceHandle.sizeBytes != null ? { sizeBytes: sourceHandle.sizeBytes } : {}),
    estimatedMemoryBytes: inspection.bandSamples.reduce((sum, band) => sum + band.samples.byteLength, 0),
    ...(inspection.metadata.bbox ? { extent: inspection.metadata.bbox } : {}),
    ...(metadataWithSource.geometrySummary ? { geometrySummary: metadataWithSource.geometrySummary } : {}),
    workerReady: true,
    caveats: rasterCaveats,
  });

  return {
    inspection,
    histogram,
    renderConfig,
    layer,
    sourceHandle,
    sourceProfile,
    summary: {
      sourceType: "geotiff",
      importedFeatureCount: 0,
      rasterPixelCount: pixelCount,
      sampledPixelCount: inspection.metadata.sampleWidth * inspection.metadata.sampleHeight,
    },
  };
}

export async function prepareMapImportFile(
  file: File,
  options?: {
    onProgress?: (progress: MapImportProgress) => void;
  },
): Promise<PreparedMapImportResult> {
  const sourceFormat = detectSourceProfileFormat(file);

  if (!isMapImportFileKind(sourceFormat)) {
    return {
      kind: "profile",
      profile: profileSource({
        kind: "file-metadata",
        sourceName: file.name,
        format: sourceFormat,
        sizeBytes: file.size,
        supportStatus: sourceProfileSupportStatus(sourceFormat),
      }),
    };
  }

  assertImportFileSize(file);
  const fileType = sourceFormat;

  if (fileType === "geojson") {
    return {
      kind: "ready",
      result: await importGeoJSONFile(file, options),
    };
  }

  if (fileType === "csv") {
    const raw = await readFileAsText(file, options?.onProgress);
    return {
      kind: "csv",
      session: createCsvImportSession(raw, file.name),
    };
  }

  if (fileType === "arrow" || fileType === "geoparquet") {
    const data = new Uint8Array(await readFileAsArrayBuffer(file, options?.onProgress));
    options?.onProgress?.({
      loaded: file.size,
      total: file.size,
      percent: 62,
      stage: fileType === "arrow" ? "Inspecting Arrow schema" : "Reading GeoParquet metadata",
    });

    const artifact = await prepareColumnarDatasetImport({
      buffer: data,
      format: fileType,
      fileName: file.name,
    });

    options?.onProgress?.({
      loaded: file.size,
      total: file.size,
      percent: 100,
      stage: "Schema preview ready",
      rowCount: artifact.rowCount,
      estimatedMemoryBytes: artifact.estimatedMemoryBytes,
    });

    return {
      kind: "columnar",
      session: createColumnarImportSession(file.name, artifact),
    };
  }

  if (fileType === "geotiff") {
    const data = await readFileAsArrayBuffer(file, options?.onProgress);
    options?.onProgress?.({
      loaded: file.size,
      total: file.size,
      percent: 72,
      stage: "Sampling GeoTIFF bands",
      estimatedMemoryBytes: file.size,
    });
    const { parseGeoTiffArrayBuffer } = await import("./raster/GeoTiffParser");
    const inspection = await parseGeoTiffArrayBuffer(data, file.size);
    options?.onProgress?.({
      loaded: file.size,
      total: file.size,
      percent: 100,
      stage: "GeoTIFF preview ready",
      estimatedMemoryBytes: inspection.bandSamples.reduce((sum, band) => sum + band.samples.byteLength, 0),
    });
    return {
      kind: "raster",
      result: buildGeoTiffImportedRasterLayer(file.name, inspection, { sourceSizeBytes: file.size }),
    };
  }

  if (fileType === "kmz") {
    const data = await readFileAsArrayBuffer(file, options?.onProgress);
    const featureCollection = await parseKMZArrayBuffer(data);
    return {
      kind: "ready",
      result: buildImportedLayer(file.name, featureCollection, "kmz", undefined, undefined, {
        sourceSizeBytes: file.size,
      }),
    };
  }

  if (fileType === "shapefile") {
    const data = await readFileAsArrayBuffer(file, options?.onProgress);
    return {
      kind: "ready",
      result: await parseShapefileZip(data, file.name),
    };
  }

  if (fileType === "geopackage") {
    const data = await readFileAsArrayBuffer(file, options?.onProgress);
    const session = await parseGeoPackageArrayBuffer(data, file.name);
    if (session.layers.length === 1 && session.layers[0]) {
      // Single layer — commit immediately without requiring user selection
      return {
        kind: "ready",
        result: await commitGeoPackageLayer(session, session.layers[0].tableName),
      };
    }
    return {
      kind: "geopackage",
      session,
    };
  }

  const raw = await readFileAsText(file, options?.onProgress);
  const featureCollection =
    fileType === "kml" ? parseKMLText(raw) : parseGPXText(raw);

  return {
    kind: "ready",
    result: buildImportedLayer(file.name, featureCollection, fileType, undefined, undefined, {
      sourceSizeBytes: file.size,
    }),
  };
}
