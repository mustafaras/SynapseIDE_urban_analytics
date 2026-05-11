import JSZip from "jszip";
import { booleanValid } from "@turf/boolean-valid";
import { kinks } from "@turf/kinks";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type {
  ImportLayerSourceMetadata,
  LayerCrsSummary,
  LayerLicenseAttributionSummary,
  LayerMetadata,
  LayerScientificQAMetadata,
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

export const MAX_IMPORT_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_GEOJSON_FILE_SIZE_BYTES = MAX_IMPORT_FILE_SIZE_BYTES;
export const IMPORT_PROGRESS_THRESHOLD_BYTES = 1 * 1024 * 1024;
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
  "application/xml",
  "text/xml",
].join(",");

const LATITUDE_COLUMN_PRIORITY = ["latitude", "lat", "y"] as const;
const LONGITUDE_COLUMN_PRIORITY = ["longitude", "lng", "lon", "x"] as const;

export type MapImportFileKind = "geojson" | "csv" | "arrow" | "geoparquet" | "kml" | "kmz" | "gpx";

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

export interface ImportedGeoJSONLayer {
  featureCollection: FeatureCollection;
  layer: OverlayLayerConfig;
  summary?: ImportedLayerSummary;
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

function validateTopology(geometry: Geometry, context: string): void {
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((child, index) =>
      validateTopology(child, `${context} GeometryCollection geometry ${index + 1}`),
    );
    return;
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

export function validateFeatureCollection(featureCollection: FeatureCollection): void {
  featureCollection.features.forEach((feature, index) => {
    if (!feature.geometry) {
      throw new MapDataImportError(`Feature ${index + 1} has null geometry, which is not supported.`);
    }
    validateGeometryStructure(feature.geometry, `Feature ${index + 1}`);
    validateTopology(feature.geometry, `Feature ${index + 1}`);
  });
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

function appendCoords(
  coords: GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][],
  bucket: Array<[number, number]>,
): void {
  if (!Array.isArray(coords) || coords.length === 0) return;
  if (typeof coords[0] === "number") {
    bucket.push([coords[0], coords[1]] as [number, number]);
    return;
  }
  (coords as Array<GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][]>).forEach((entry) =>
    appendCoords(entry as GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][], bucket),
  );
}

export function getFeatureCollectionBounds(
  featureCollection: FeatureCollection,
): [number, number, number, number] | undefined {
  const coords: Array<[number, number]> = [];
  featureCollection.features.forEach((feature) => {
    if (!feature.geometry) return;
    switch (feature.geometry.type) {
      case "Point":
      case "MultiPoint":
      case "LineString":
      case "MultiLineString":
      case "Polygon":
      case "MultiPolygon":
        appendCoords(
          (feature.geometry as
            | GeoJSON.Point
            | GeoJSON.MultiPoint
            | GeoJSON.LineString
            | GeoJSON.MultiLineString
            | GeoJSON.Polygon
            | GeoJSON.MultiPolygon).coordinates,
          coords,
        );
        break;
      case "GeometryCollection":
        feature.geometry.geometries.forEach((geometry) => {
          if (geometry.type !== "GeometryCollection") {
            appendCoords(
              (geometry as
                | GeoJSON.Point
                | GeoJSON.MultiPoint
                | GeoJSON.LineString
                | GeoJSON.MultiLineString
                | GeoJSON.Polygon
                | GeoJSON.MultiPolygon).coordinates,
              coords,
            );
          }
        });
        break;
      default:
        break;
    }
  });

  if (coords.length === 0) return undefined;

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  coords.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });

  return [minLng, minLat, maxLng, maxLat];
}

export function buildFeatureCollectionMetadata(featureCollection: FeatureCollection): LayerMetadata {
  const labels = collectGeometryTypeLabels(featureCollection);
  const hint = geometryHintFromLabels(labels);
  const fields = new Set<string>();
  const bounds = getFeatureCollectionBounds(featureCollection);
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

  return parseGeoJSONText(JSON.stringify(sourceData));
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
  const extension = getFileExtension(file.name);
  const mime = file.type.toLowerCase();

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

  throw new MapDataImportError(
    "Unsupported file type. Please choose GeoJSON, CSV, Arrow, GeoParquet, KML, KMZ, or GPX.",
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
): ImportedGeoJSONLayer {
  const layerId = createLayerId();
  const importedAt = nowIsoTimestamp();
  const declaredCrs = metadataOverrides?.crsSummary?.crs ?? metadataOverrides?.columnar?.crs;
  const totalRecords = summaryOverrides?.totalRecords;
  const skippedRecordCount = summaryOverrides?.skippedRecordCount;
  const importedFeatureCount = summaryOverrides?.importedFeatureCount ?? featureCollection.features.length;
  const workerTransferStatus: ImportLayerSourceMetadata["workerTransferStatus"] =
    sourceType === "arrow" || sourceType === "geoparquet" ? "prepared" : "not-required";
  const caveats = buildImportCaveats({
    sourceType,
    ...(declaredCrs ? { declaredCrs } : {}),
    ...(totalRecords != null ? { totalRecords } : {}),
    ...(skippedRecordCount != null ? { skippedRecordCount } : {}),
    workerTransferStatus,
  });
  const metadata = {
    ...buildFeatureCollectionMetadata(featureCollection),
    importFormat: sourceType,
    updatedAt: importedAt,
    dataVersion: importedAt,
    importSource: {
      format: sourceType,
      fileName,
      sourceName: fileName,
      importedAt,
      importedFeatureCount,
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
    ...metadataOverrides,
  };

  const layer = withNormalizedLayerRegistryMetadata({
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
  });

  return {
    featureCollection,
    layer,
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
  });
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
  return buildImportedLayer(file.name, featureCollection, "geojson");
}

export async function prepareMapImportFile(
  file: File,
  options?: {
    onProgress?: (progress: MapImportProgress) => void;
  },
): Promise<PreparedMapImportResult> {
  assertImportFileSize(file);
  const fileType = detectImportFileType(file);

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

  if (fileType === "kmz") {
    const data = await readFileAsArrayBuffer(file, options?.onProgress);
    const featureCollection = await parseKMZArrayBuffer(data);
    return {
      kind: "ready",
      result: buildImportedLayer(file.name, featureCollection, "kmz"),
    };
  }

  const raw = await readFileAsText(file, options?.onProgress);
  const featureCollection =
    fileType === "kml" ? parseKMLText(raw) : parseGPXText(raw);

  return {
    kind: "ready",
    result: buildImportedLayer(file.name, featureCollection, fileType),
  };
}
