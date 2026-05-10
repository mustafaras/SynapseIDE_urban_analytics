import {
  Binary,
  Field,
  Schema,
  Table,
  tableFromArrays,
  tableFromIPC,
  tableToIPC,
  vectorFromArray,
} from "apache-arrow";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import parquetWasmUrl from "parquet-wasm/esm/parquet_wasm_bg.wasm?url";

const PREVIEW_ROW_LIMIT = 5;
const SAMPLE_SCAN_LIMIT = 24;
const GEO_PARQUET_VERSION = "1.1.0";
const GEOMETRY_FIELD_HINTS = ["geometry", "geom", "geojson", "wkb_geometry", "shape", "wkt"];
const LONGITUDE_FIELD_HINTS = ["longitude", "lon", "lng", "x"];
const LATITUDE_FIELD_HINTS = ["latitude", "lat", "y"];

export type ColumnarSourceFormat = "arrow" | "geoparquet";
export type ColumnarGeometryEncoding = "wkb" | "geojson" | "wkt" | "lonlat" | "coordinates";
export type ColumnarSchemaRole = "geometry" | "coordinate" | "attribute";

export interface ColumnarSchemaField {
  name: string;
  type: string;
  nullable: boolean;
  role: ColumnarSchemaRole;
  previewValue: string;
  stats?: ColumnarFieldStats;
}

/** Per-field statistical profile computed during import. */
export interface ColumnarFieldStats {
  nullCount: number;
  nullPercent: number;
  uniqueCount: number;
  min?: string;
  max?: string;
  /** Top-5 value frequencies for categorical fields. */
  topValues?: Array<{ value: string; count: number }>;
  /** Mean for numeric fields. */
  mean?: number;
  /** Standard deviation for numeric fields. */
  stddev?: number;
}

export interface ColumnarPreviewRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface GeoParquetMetadataSummary {
  version?: string;
  primaryColumn?: string;
  geometryTypes: string[];
  bbox?: [number, number, number, number];
  crs?: string;
}

export interface ColumnarImportArtifact {
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
  featureCollection: FeatureCollection;
  arrowIPC: Uint8Array;
  /** Data quality assessment computed during import. */
  quality: ColumnarDataQuality;
  /** Columnar vs JSON size comparison. */
  sizeComparison: ColumnarSizeComparison;
}

/** Overall data quality metrics for the imported dataset. */
export interface ColumnarDataQuality {
  /** 0–100 overall quality score. */
  score: number;
  grade: "excellent" | "good" | "fair" | "poor";
  /** Fraction of total cells that are non-null (0–1). */
  completeness: number;
  /** Fraction of rows that decoded to valid spatial features (0–1). */
  validity: number;
  /** Number of attribute fields. */
  attributeFieldCount: number;
  /** Number of geometry fields. */
  geometryFieldCount: number;
  /** Fields with >50% null values. */
  sparseFields: string[];
  /** Fields with all values identical. */
  constantFields: string[];
}

/** Size comparison between columnar and equivalent GeoJSON. */
export interface ColumnarSizeComparison {
  columnarBytes: number;
  estimatedGeoJsonBytes: number;
  compressionRatio: number;
  savingsPercent: number;
}

export interface GeoParquetExportOptions {
  filename?: string;
  geometryColumnName?: string;
  includeProperties?: boolean;
  crs?: string;
}

export interface GeoParquetExportResult {
  bytes: Uint8Array;
  filename: string;
  rowCount: number;
  byteLength: number;
  geoMetadata: GeoParquetMetadataSummary;
}

interface GeometryResolution {
  mode: ColumnarGeometryEncoding;
  geometryColumn?: string;
  longitudeColumn?: string;
  latitudeColumn?: string;
  fieldRoles: Map<string, ColumnarSchemaRole>;
}

interface ParsedGeoMetadata {
  primaryColumn?: string;
  geometryTypes: string[];
  bbox?: [number, number, number, number];
  crs?: string;
  version?: string;
  columns: Record<string, unknown>;
}

interface ParsedColumnarTable {
  table: Table;
  arrowIPC: Uint8Array;
  geoMetadata?: ParsedGeoMetadata;
}

type ParquetModule = typeof import("parquet-wasm/esm");

let parquetModulePromise: Promise<ParquetModule> | null = null;
let parquetBrowserInitialized = false;

function getParquetModule(): Promise<ParquetModule> {
  if (!parquetModulePromise) {
    parquetModulePromise = (import.meta.env.VITEST
      ? import("parquet-wasm/node")
      : import("parquet-wasm/esm").then(async (parquet) => {
          if (!parquetBrowserInitialized) {
            await parquet.default(parquetWasmUrl);
            parquetBrowserInitialized = true;
          }
          return parquet;
        })) as Promise<ParquetModule>;
  }
  return parquetModulePromise;
}

interface WkbGeometryTypeDetails {
  baseType: number;
  hasZ: boolean;
  hasM: boolean;
  hasSrid: boolean;
}

interface WkbReader {
  view: DataView;
  offset: number;
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

function truncatePreview(text: string, maxLength = 72): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function normalizeFieldName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBinaryLike(value: unknown): value is Uint8Array | ArrayBuffer | number[] {
  return value instanceof Uint8Array || value instanceof ArrayBuffer || Array.isArray(value);
}

function toUint8Array(value: Uint8Array | ArrayBuffer | number[]): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return Uint8Array.from(value);
}

function normalizeJsonValue(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (value instanceof Uint8Array) return Array.from(value);
  if (value instanceof ArrayBuffer) return Array.from(new Uint8Array(value));
  if (Array.isArray(value)) return value.map((entry) => normalizeJsonValue(entry));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeJsonValue(entry)]),
    );
  }
  return String(value);
}

function formatPreviewValue(value: unknown): string {
  if (value == null) return "-";
  if (value instanceof Uint8Array) {
    return `WKB (${value.byteLength.toLocaleString()} B)`;
  }
  if (value instanceof ArrayBuffer) {
    return `Binary (${value.byteLength.toLocaleString()} B)`;
  }
  if (Array.isArray(value)) {
    return truncatePreview(JSON.stringify(value.map((entry) => normalizeJsonValue(entry))));
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "object") {
    return truncatePreview(JSON.stringify(normalizeJsonValue(value)));
  }
  return truncatePreview(String(value));
}

function buildColumnarFilename(targetName: string, extension: string): string {
  const baseName = stripExtension(targetName).trim() || "map_export";
  return `${baseName}.${extension}`;
}

export function buildColumnarWorkerTableName(label: string): string {
  const base = stripExtension(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const prefix = base.length > 0 ? base : "columnar_import";
  const safeBase = /^[a-z]/.test(prefix) ? prefix : `col_${prefix}`;
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "_").slice(0, 10)
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return `${safeBase}_${suffix}`;
}

function sampleFieldValue(table: Table, fieldName: string): unknown {
  const vector = table.getChild(fieldName);
  if (!vector) return null;
  const scanLimit = Math.min(table.numRows, SAMPLE_SCAN_LIMIT);
  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const value = vector.get(rowIndex);
    if (value != null) return value;
  }
  return null;
}

function isLikelyLongitudeField(name: string): boolean {
  return LONGITUDE_FIELD_HINTS.includes(normalizeFieldName(name));
}

function isLikelyLatitudeField(name: string): boolean {
  return LATITUDE_FIELD_HINTS.includes(normalizeFieldName(name));
}

function tryParseGeoJsonGeometry(value: unknown): Geometry | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
      return null;
    }
    try {
      return tryParseGeoJsonGeometry(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.type === "Feature" && record.geometry) {
    return tryParseGeoJsonGeometry(record.geometry);
  }
  if (typeof record.type === "string") {
    return record as unknown as Geometry;
  }
  return null;
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }

  const last = text.slice(start).trim();
  if (last.length > 0) parts.push(last);
  return parts;
}

function unwrapParentheses(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function extractParenthesizedGroups(text: string): string[] {
  const groups: string[] = [];
  let depth = 0;
  let groupStart = -1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(") {
      if (depth === 0) groupStart = index;
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0 && groupStart >= 0) {
        groups.push(unwrapParentheses(text.slice(groupStart, index + 1)));
        groupStart = -1;
      }
    }
  }

  return groups;
}

function parseCoordinateToken(token: string): GeoJSON.Position {
  const parts = token.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Coordinate tuple is incomplete.");
  }
  const longitude = Number(parts[0]);
  const latitude = Number(parts[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new Error("Coordinate tuple contains invalid numeric values.");
  }
  const third = parts[2] != null ? Number(parts[2]) : undefined;
  if (third != null && Number.isFinite(third)) {
    return [longitude, latitude, third];
  }
  return [longitude, latitude];
}

function parseCoordinateSequence(text: string): GeoJSON.Position[] {
  return splitTopLevel(text).map((token) => parseCoordinateToken(token));
}

function parseWktValue(input: string): Geometry {
  const trimmed = input.trim();
  const match = /^([A-Z]+(?:\s+Z)?)(?:\s+EMPTY)?\s*\((.*)\)$/i.exec(trimmed);
  if (!match) {
    throw new Error("Unsupported WKT geometry.");
  }

  const typeLabel = match[1].replace(/\s+Z$/i, "").toUpperCase();
  const body = match[2].trim();

  switch (typeLabel) {
    case "POINT":
      return { type: "Point", coordinates: parseCoordinateToken(body) };
    case "LINESTRING":
      return { type: "LineString", coordinates: parseCoordinateSequence(body) };
    case "POLYGON":
      return { type: "Polygon", coordinates: extractParenthesizedGroups(body).map(parseCoordinateSequence) };
    case "MULTIPOINT": {
      const groups = body.includes("(") ? extractParenthesizedGroups(body) : splitTopLevel(body);
      return { type: "MultiPoint", coordinates: groups.map(parseCoordinateToken) };
    }
    case "MULTILINESTRING":
      return { type: "MultiLineString", coordinates: extractParenthesizedGroups(body).map(parseCoordinateSequence) };
    case "MULTIPOLYGON":
      return {
        type: "MultiPolygon",
        coordinates: extractParenthesizedGroups(body).map((polygonBody) =>
          extractParenthesizedGroups(polygonBody).map(parseCoordinateSequence),
        ),
      };
    case "GEOMETRYCOLLECTION":
      return {
        type: "GeometryCollection",
        geometries: splitTopLevel(body).map((geometryText) => parseWktValue(geometryText)),
      };
    default:
      throw new Error(`Unsupported WKT geometry type: ${typeLabel}.`);
  }
}

function parseCoordinateArrayValue(value: unknown): Geometry | null {
  if (Array.isArray(value) && value.length >= 2 && isFiniteNumber(value[0]) && isFiniteNumber(value[1])) {
    const third = value[2];
    if (isFiniteNumber(third)) {
      return { type: "Point", coordinates: [value[0], value[1], third] };
    }
    return { type: "Point", coordinates: [value[0], value[1]] };
  }

  if (typeof value === "object" && value != null) {
    const record = value as Record<string, unknown>;
    const longitude = record.longitude ?? record.lon ?? record.lng ?? record.x;
    const latitude = record.latitude ?? record.lat ?? record.y;
    if (isFiniteNumber(longitude) && isFiniteNumber(latitude)) {
      return { type: "Point", coordinates: [longitude, latitude] };
    }
  }

  return null;
}

function readUint8(reader: WkbReader): number {
  const value = reader.view.getUint8(reader.offset);
  reader.offset += 1;
  return value;
}

function readUint32(reader: WkbReader, littleEndian: boolean): number {
  const value = reader.view.getUint32(reader.offset, littleEndian);
  reader.offset += 4;
  return value;
}

function readFloat64(reader: WkbReader, littleEndian: boolean): number {
  const value = reader.view.getFloat64(reader.offset, littleEndian);
  reader.offset += 8;
  return value;
}

function parseWkbGeometryType(rawType: number): WkbGeometryTypeDetails {
  const hasZ = (rawType & 0x80000000) !== 0;
  const hasM = (rawType & 0x40000000) !== 0;
  const hasSrid = (rawType & 0x20000000) !== 0;
  let baseType = rawType & 0x000000ff;

  if (rawType >= 1000 && rawType < 4000) {
    baseType = rawType % 1000;
    return {
      baseType,
      hasZ: rawType >= 1000 && rawType < 2000 ? true : rawType >= 3000,
      hasM: rawType >= 2000,
      hasSrid,
    };
  }

  return { baseType, hasZ, hasM, hasSrid };
}

function readWkbPosition(reader: WkbReader, littleEndian: boolean, hasZ: boolean, hasM: boolean): GeoJSON.Position {
  const longitude = readFloat64(reader, littleEndian);
  const latitude = readFloat64(reader, littleEndian);
  if (hasZ) {
    const altitude = readFloat64(reader, littleEndian);
    if (hasM) {
      readFloat64(reader, littleEndian);
    }
    return [longitude, latitude, altitude];
  }
  if (hasM) {
    readFloat64(reader, littleEndian);
  }
  return [longitude, latitude];
}

function decodeWkbGeometryInternal(reader: WkbReader): Geometry {
  const littleEndian = readUint8(reader) === 1;
  const type = parseWkbGeometryType(readUint32(reader, littleEndian));

  if (type.hasSrid) {
    readUint32(reader, littleEndian);
  }

  switch (type.baseType) {
    case 1:
      return { type: "Point", coordinates: readWkbPosition(reader, littleEndian, type.hasZ, type.hasM) };
    case 2: {
      const count = readUint32(reader, littleEndian);
      const coordinates = Array.from({ length: count }, () => readWkbPosition(reader, littleEndian, type.hasZ, type.hasM));
      return { type: "LineString", coordinates };
    }
    case 3: {
      const ringCount = readUint32(reader, littleEndian);
      const coordinates = Array.from({ length: ringCount }, () => {
        const pointCount = readUint32(reader, littleEndian);
        return Array.from({ length: pointCount }, () => readWkbPosition(reader, littleEndian, type.hasZ, type.hasM));
      });
      return { type: "Polygon", coordinates };
    }
    case 4: {
      const count = readUint32(reader, littleEndian);
      const coordinates = Array.from({ length: count }, () => {
        const geometry = decodeWkbGeometryInternal(reader);
        if (geometry.type !== "Point") {
          throw new Error("Invalid MultiPoint WKB payload.");
        }
        return geometry.coordinates;
      });
      return { type: "MultiPoint", coordinates };
    }
    case 5: {
      const count = readUint32(reader, littleEndian);
      const coordinates = Array.from({ length: count }, () => {
        const geometry = decodeWkbGeometryInternal(reader);
        if (geometry.type !== "LineString") {
          throw new Error("Invalid MultiLineString WKB payload.");
        }
        return geometry.coordinates;
      });
      return { type: "MultiLineString", coordinates };
    }
    case 6: {
      const count = readUint32(reader, littleEndian);
      const coordinates = Array.from({ length: count }, () => {
        const geometry = decodeWkbGeometryInternal(reader);
        if (geometry.type !== "Polygon") {
          throw new Error("Invalid MultiPolygon WKB payload.");
        }
        return geometry.coordinates;
      });
      return { type: "MultiPolygon", coordinates };
    }
    case 7: {
      const count = readUint32(reader, littleEndian);
      return {
        type: "GeometryCollection",
        geometries: Array.from({ length: count }, () => decodeWkbGeometryInternal(reader)),
      };
    }
    default:
      throw new Error(`Unsupported WKB geometry type: ${type.baseType}.`);
  }
}

function decodeWkbGeometry(value: Uint8Array | ArrayBuffer | number[]): Geometry {
  const bytes = toUint8Array(value);
  return decodeWkbGeometryInternal({ view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), offset: 0 });
}

function positionHasAltitude(position: GeoJSON.Position): boolean {
  return position.length > 2 && isFiniteNumber(position[2]);
}

function geometryHasAltitude(geometry: Geometry): boolean {
  switch (geometry.type) {
    case "Point":
      return positionHasAltitude(geometry.coordinates);
    case "MultiPoint":
    case "LineString":
      return geometry.coordinates.some((position) => positionHasAltitude(position));
    case "MultiLineString":
    case "Polygon":
      return geometry.coordinates.some((line) => line.some((position) => positionHasAltitude(position)));
    case "MultiPolygon":
      return geometry.coordinates.some((polygon) => polygon.some((ring) => ring.some((position) => positionHasAltitude(position))));
    case "GeometryCollection":
      return geometry.geometries.some((child) => geometryHasAltitude(child));
    default:
      return false;
  }
}

function wkbTypeCode(baseType: number, hasAltitude: boolean): number {
  return hasAltitude ? baseType + 1000 : baseType;
}

function writeUint8(bytes: number[], value: number): void {
  bytes.push(value & 0xff);
}

function writeUint32(bytes: number[], value: number): void {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, value, true);
  bytes.push(...new Uint8Array(buffer));
}

function writeFloat64(bytes: number[], value: number): void {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, true);
  bytes.push(...new Uint8Array(buffer));
}

function writeWkbPosition(bytes: number[], position: GeoJSON.Position, includeAltitude: boolean): void {
  writeFloat64(bytes, position[0]);
  writeFloat64(bytes, position[1]);
  if (includeAltitude) {
    writeFloat64(bytes, isFiniteNumber(position[2]) ? position[2] : 0);
  }
}

function encodeWkbGeometryInternal(bytes: number[], geometry: Geometry): void {
  writeUint8(bytes, 1);
  const includeAltitude = geometryHasAltitude(geometry);

  switch (geometry.type) {
    case "Point":
      writeUint32(bytes, wkbTypeCode(1, includeAltitude));
      writeWkbPosition(bytes, geometry.coordinates, includeAltitude);
      return;
    case "LineString":
      writeUint32(bytes, wkbTypeCode(2, includeAltitude));
      writeUint32(bytes, geometry.coordinates.length);
      geometry.coordinates.forEach((position) => writeWkbPosition(bytes, position, includeAltitude));
      return;
    case "Polygon":
      writeUint32(bytes, wkbTypeCode(3, includeAltitude));
      writeUint32(bytes, geometry.coordinates.length);
      geometry.coordinates.forEach((ring) => {
        writeUint32(bytes, ring.length);
        ring.forEach((position) => writeWkbPosition(bytes, position, includeAltitude));
      });
      return;
    case "MultiPoint":
      writeUint32(bytes, wkbTypeCode(4, includeAltitude));
      writeUint32(bytes, geometry.coordinates.length);
      geometry.coordinates.forEach((position) => {
        encodeWkbGeometryInternal(bytes, { type: "Point", coordinates: position });
      });
      return;
    case "MultiLineString":
      writeUint32(bytes, wkbTypeCode(5, includeAltitude));
      writeUint32(bytes, geometry.coordinates.length);
      geometry.coordinates.forEach((line) => {
        encodeWkbGeometryInternal(bytes, { type: "LineString", coordinates: line });
      });
      return;
    case "MultiPolygon":
      writeUint32(bytes, wkbTypeCode(6, includeAltitude));
      writeUint32(bytes, geometry.coordinates.length);
      geometry.coordinates.forEach((polygon) => {
        encodeWkbGeometryInternal(bytes, { type: "Polygon", coordinates: polygon });
      });
      return;
    case "GeometryCollection":
      writeUint32(bytes, wkbTypeCode(7, includeAltitude));
      writeUint32(bytes, geometry.geometries.length);
      geometry.geometries.forEach((child) => encodeWkbGeometryInternal(bytes, child));
      return;
    default:
      throw new Error("Unsupported geometry type for GeoParquet export.");
  }
}

function encodeWkbGeometry(geometry: Geometry): Uint8Array {
  const bytes: number[] = [];
  encodeWkbGeometryInternal(bytes, geometry);
  return Uint8Array.from(bytes);
}

function parseGeoMetadata(schema: Schema): ParsedGeoMetadata | undefined {
  const raw = schema.metadata.get("geo");
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const primaryColumn = typeof parsed.primary_column === "string" ? parsed.primary_column : undefined;
    const columns = typeof parsed.columns === "object" && parsed.columns != null
      ? parsed.columns as Record<string, unknown>
      : {};
    const primaryColumnMeta = primaryColumn && typeof columns[primaryColumn] === "object" && columns[primaryColumn] != null
      ? columns[primaryColumn] as Record<string, unknown>
      : undefined;
    const bbox = Array.isArray(primaryColumnMeta?.bbox) && primaryColumnMeta.bbox.length === 4
      ? primaryColumnMeta.bbox.map((value) => Number(value)) as [number, number, number, number]
      : undefined;
    const geometryTypes = Array.isArray(primaryColumnMeta?.geometry_types)
      ? primaryColumnMeta.geometry_types.filter((value): value is string => typeof value === "string")
      : [];
    const crsValue = primaryColumnMeta?.crs;
    let crs: string | undefined;
    if (typeof crsValue === "string") {
      crs = crsValue;
    } else if (typeof crsValue === "object" && crsValue != null) {
      const crsRecord = crsValue as Record<string, unknown>;
      const name = typeof crsRecord.name === "string"
        ? crsRecord.name
        : typeof (crsRecord.properties as Record<string, unknown> | undefined)?.name === "string"
          ? ((crsRecord.properties as Record<string, unknown>).name as string)
          : undefined;
      crs = name;
    }

    return {
      ...(primaryColumn ? { primaryColumn } : {}),
      geometryTypes,
      ...(bbox ? { bbox } : {}),
      ...(crs ? { crs } : {}),
      ...(typeof parsed.version === "string" ? { version: parsed.version } : {}),
      columns,
    };
  } catch {
    return undefined;
  }
}

function inferGeometryEncoding(fieldName: string, fieldType: string, sampleValue: unknown, fieldMetadata: Map<string, string>): ColumnarGeometryEncoding | null {
  const extensionName = fieldMetadata.get("ARROW:extension:name")?.toLowerCase();
  if (extensionName?.includes("geoarrow.wkb")) return "wkb";
  if (extensionName?.includes("geoarrow.wkt")) return "wkt";
  if (sampleValue instanceof Uint8Array || fieldType.includes("Binary")) return "wkb";
  if (tryParseGeoJsonGeometry(sampleValue)) return "geojson";
  if (typeof sampleValue === "string" && /^[A-Z]+/i.test(sampleValue.trim())) return "wkt";
  if (parseCoordinateArrayValue(sampleValue)) return "coordinates";
  if (GEOMETRY_FIELD_HINTS.includes(normalizeFieldName(fieldName))) return "geojson";
  return null;
}

function detectGeometryResolution(table: Table, geoMetadata?: ParsedGeoMetadata): GeometryResolution {
  const fieldRoles = new Map<string, ColumnarSchemaRole>();
  const fields = table.schema.fields;

  const chooseGeometryField = (fieldName: string | undefined): GeometryResolution | null => {
    if (!fieldName) return null;
    const field = fields.find((entry) => entry.name === fieldName);
    if (!field) return null;
    const sampleValue = sampleFieldValue(table, field.name);
    const encoding = inferGeometryEncoding(field.name, String(field.type), sampleValue, field.metadata);
    if (!encoding) return null;
    fieldRoles.set(field.name, "geometry");
    return { mode: encoding, geometryColumn: field.name, fieldRoles };
  };

  const explicit = chooseGeometryField(geoMetadata?.primaryColumn);
  if (explicit) return explicit;

  for (const field of fields) {
    const normalizedName = normalizeFieldName(field.name);
    const hinted = GEOMETRY_FIELD_HINTS.includes(normalizedName);
    const sampleValue = sampleFieldValue(table, field.name);
    const encoding = inferGeometryEncoding(field.name, String(field.type), sampleValue, field.metadata);
    if (hinted && encoding) {
      fieldRoles.set(field.name, "geometry");
      return { mode: encoding, geometryColumn: field.name, fieldRoles };
    }
  }

  let longitudeColumn: string | undefined;
  let latitudeColumn: string | undefined;

  for (const field of fields) {
    const sampleValue = sampleFieldValue(table, field.name);
    if (sampleValue != null && !isFiniteNumber(sampleValue)) {
      continue;
    }
    if (!longitudeColumn && isLikelyLongitudeField(field.name)) {
      longitudeColumn = field.name;
      continue;
    }
    if (!latitudeColumn && isLikelyLatitudeField(field.name)) {
      latitudeColumn = field.name;
    }
  }

  if (longitudeColumn && latitudeColumn) {
    fieldRoles.set(longitudeColumn, "coordinate");
    fieldRoles.set(latitudeColumn, "coordinate");
    return {
      mode: "lonlat",
      longitudeColumn,
      latitudeColumn,
      fieldRoles,
    };
  }

  throw new Error("Columnar dataset does not expose a supported geometry column or latitude/longitude pair.");
}

function resolveGeometryValue(table: Table, resolution: GeometryResolution, rowIndex: number): Geometry {
  if (resolution.mode === "lonlat") {
    const longitude = table.getChild(resolution.longitudeColumn ?? "")?.get(rowIndex);
    const latitude = table.getChild(resolution.latitudeColumn ?? "")?.get(rowIndex);
    if (!isFiniteNumber(longitude) || !isFiniteNumber(latitude)) {
      throw new Error("Coordinate columns contain invalid numeric values.");
    }
    return {
      type: "Point",
      coordinates: [longitude, latitude],
    };
  }

  const rawValue = table.getChild(resolution.geometryColumn ?? "")?.get(rowIndex);
  if (rawValue == null) {
    throw new Error("Geometry value is null.");
  }

  switch (resolution.mode) {
    case "wkb":
      if (!isBinaryLike(rawValue)) {
        throw new Error("Geometry column is not WKB-encoded.");
      }
      return decodeWkbGeometry(rawValue);
    case "geojson": {
      const geometry = tryParseGeoJsonGeometry(rawValue);
      if (!geometry) {
        throw new Error("Geometry column is not valid GeoJSON.");
      }
      return geometry;
    }
    case "wkt":
      if (typeof rawValue !== "string") {
        throw new Error("Geometry column is not WKT text.");
      }
      return parseWktValue(rawValue);
    case "coordinates": {
      const geometry = parseCoordinateArrayValue(rawValue);
      if (!geometry) {
        throw new Error("Coordinate array column is not supported.");
      }
      return geometry;
    }
    default:
      throw new Error("Unsupported geometry encoding.");
  }
}

function estimateMaterializedMemoryBytes(rowCount: number, fieldCount: number, inputBytes: number, format: ColumnarSourceFormat): number {
  const rowFootprint = Math.max(fieldCount * 28, 112);
  const factor = format === "geoparquet" ? 2.6 : 2.1;
  return Math.max(
    Math.round(inputBytes * factor),
    rowCount * rowFootprint,
  );
}

function buildSchemaPreview(table: Table, resolution: GeometryResolution): ColumnarSchemaField[] {
  return table.schema.fields.map((field) => {
    const role: ColumnarSchemaRole = resolution.fieldRoles.get(field.name) ?? (field.name === resolution.geometryColumn ? "geometry" : "attribute");
    return {
      name: field.name,
      type: String(field.type),
      nullable: field.nullable,
      role,
      previewValue: formatPreviewValue(sampleFieldValue(table, field.name)),
      stats: computeFieldStats(table, field.name, role),
    };
  });
}

function buildPreviewRows(table: Table): ColumnarPreviewRow[] {
  const rowLimit = Math.min(table.numRows, PREVIEW_ROW_LIMIT);
  return Array.from({ length: rowLimit }, (_, rowIndex) => ({
    rowNumber: rowIndex + 1,
    values: Object.fromEntries(
      table.schema.fields.map((field) => [
        field.name,
        formatPreviewValue(table.getChild(field.name)?.get(rowIndex)),
      ]),
    ),
  }));
}

const STATS_SCAN_LIMIT = 10_000;
const TOP_VALUES_LIMIT = 5;

function computeFieldStats(table: Table, fieldName: string, role: ColumnarSchemaRole): ColumnarFieldStats {
  const vector = table.getChild(fieldName);
  const rowCount = table.numRows;
  if (!vector || rowCount === 0) {
    return { nullCount: rowCount, nullPercent: 100, uniqueCount: 0 };
  }

  const scanLimit = Math.min(rowCount, STATS_SCAN_LIMIT);
  let nullCount = 0;
  const uniqueValues = new Set<string>();
  const valueCounts = new Map<string, number>();
  const numericValues: number[] = [];
  let minStr: string | undefined;
  let maxStr: string | undefined;

  for (let i = 0; i < scanLimit; i += 1) {
    const raw = vector.get(i);
    if (raw == null) {
      nullCount += 1;
      continue;
    }

    if (role === "geometry") continue;

    const stringified = typeof raw === "object" && !(raw instanceof Date)
      ? JSON.stringify(normalizeJsonValue(raw)).slice(0, 80)
      : String(raw);

    uniqueValues.add(stringified);

    if (typeof raw === "number" && Number.isFinite(raw)) {
      numericValues.push(raw);
    }

    if (minStr === undefined || stringified < minStr) minStr = stringified;
    if (maxStr === undefined || stringified > maxStr) maxStr = stringified;

    if (uniqueValues.size <= 100) {
      valueCounts.set(stringified, (valueCounts.get(stringified) ?? 0) + 1);
    }
  }

  if (rowCount > scanLimit) {
    nullCount = Math.round((nullCount / scanLimit) * rowCount);
  }

  const nullPercent = rowCount > 0 ? Math.round((nullCount / rowCount) * 100) : 0;

  const stats: ColumnarFieldStats = {
    nullCount,
    nullPercent,
    uniqueCount: uniqueValues.size,
  };

  if (role !== "geometry") {
    if (minStr !== undefined) stats.min = truncatePreview(minStr, 40);
    if (maxStr !== undefined) stats.max = truncatePreview(maxStr, 40);

    if (numericValues.length > 0) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      stats.mean = sum / numericValues.length;
      const variance = numericValues.reduce((acc, v) => acc + (v - stats.mean!) ** 2, 0) / numericValues.length;
      stats.stddev = Math.sqrt(variance);
    }

    if (uniqueValues.size <= 100 && valueCounts.size > 0) {
      stats.topValues = Array.from(valueCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, TOP_VALUES_LIMIT)
        .map(([value, count]) => ({ value: truncatePreview(value, 30), count }));
    }
  }

  return stats;
}

function computeDataQuality(
  table: Table,
  schema: ColumnarSchemaField[],
  importedFeatureCount: number,
): ColumnarDataQuality {
  const rowCount = table.numRows;
  const totalCells = rowCount * schema.length;
  let totalNulls = 0;
  const sparseFields: string[] = [];
  const constantFields: string[] = [];
  let geometryFieldCount = 0;
  let attributeFieldCount = 0;

  for (const field of schema) {
    if (field.role === "geometry" || field.role === "coordinate") {
      geometryFieldCount += 1;
      continue;
    }
    attributeFieldCount += 1;
    const nullCount = field.stats?.nullCount ?? 0;
    totalNulls += nullCount;
    if (field.stats) {
      if (field.stats.nullPercent > 50) sparseFields.push(field.name);
      if (field.stats.uniqueCount <= 1 && rowCount > 1) constantFields.push(field.name);
    }
  }

  const completeness = totalCells > 0 ? 1 - totalNulls / totalCells : 1;
  const validity = rowCount > 0 ? importedFeatureCount / rowCount : 1;

  const completenessScore = Math.min(completeness, 1) * 40;
  const validityScore = Math.min(validity, 1) * 40;
  const diversityPenalty = constantFields.length > 0 ? Math.min(constantFields.length * 3, 10) : 0;
  const sparsePenalty = sparseFields.length > 0 ? Math.min(sparseFields.length * 2, 10) : 0;
  const score = Math.round(Math.max(0, Math.min(100, completenessScore + validityScore + 20 - diversityPenalty - sparsePenalty)));

  const grade: ColumnarDataQuality["grade"] = score >= 85 ? "excellent" : score >= 65 ? "good" : score >= 40 ? "fair" : "poor";

  return { score, grade, completeness, validity, attributeFieldCount, geometryFieldCount, sparseFields, constantFields };
}

function computeSizeComparison(
  featureCollection: FeatureCollection,
  columnarBytes: number,
): ColumnarSizeComparison {
  const estimatedGeoJsonBytes = new TextEncoder().encode(JSON.stringify(featureCollection)).byteLength;
  const compressionRatio = estimatedGeoJsonBytes > 0 ? columnarBytes / estimatedGeoJsonBytes : 1;
  const savingsPercent = Math.max(0, Math.round((1 - compressionRatio) * 100));
  return { columnarBytes, estimatedGeoJsonBytes, compressionRatio, savingsPercent };
}

function toGeoJsonProperties(row: Record<string, unknown>): GeoJsonProperties {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, normalizeJsonValue(value)]),
  ) as GeoJsonProperties;
}

function buildFeatureCollectionFromTable(table: Table, resolution: GeometryResolution): {
  featureCollection: FeatureCollection;
  importedFeatureCount: number;
  skippedRowCount: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  const features: Feature[] = [];
  const geometryColumn = resolution.geometryColumn;

  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex += 1) {
    try {
      const geometry = resolveGeometryValue(table, resolution, rowIndex);
      const properties: Record<string, unknown> = {};

      for (const field of table.schema.fields) {
        if (geometryColumn && field.name === geometryColumn) continue;
        const value = table.getChild(field.name)?.get(rowIndex);
        properties[field.name] = value;
      }

      features.push({
        type: "Feature",
        geometry,
        properties: toGeoJsonProperties(properties),
      });
    } catch (error) {
      if (warnings.length < 5) {
        warnings.push(`Row ${rowIndex + 1}: ${error instanceof Error ? error.message : "Invalid geometry."}`);
      }
    }
  }

  return {
    featureCollection: { type: "FeatureCollection", features },
    importedFeatureCount: features.length,
    skippedRowCount: table.numRows - features.length,
    warnings,
  };
}

function compressiblePropertyValue(value: unknown): string | number | boolean | null {
  const normalized = normalizeJsonValue(value);
  if (normalized == null) return null;
  if (typeof normalized === "string" || typeof normalized === "number" || typeof normalized === "boolean") {
    return normalized;
  }
  return JSON.stringify(normalized);
}

function selectPropertyColumnType(values: Array<string | number | boolean | null>): "number" | "boolean" | "string" {
  let sawNumber = false;
  let sawBoolean = false;
  let sawString = false;

  values.forEach((value) => {
    if (value == null) return;
    if (typeof value === "number") {
      sawNumber = true;
      return;
    }
    if (typeof value === "boolean") {
      sawBoolean = true;
      return;
    }
    sawString = true;
  });

  if (sawString || (sawNumber && sawBoolean)) return "string";
  if (sawBoolean) return "boolean";
  return "number";
}

function buildGeoParquetMetadata(collection: FeatureCollection, geometryColumnName: string, crs?: string): Record<string, unknown> {
  const geometryTypes = Array.from(new Set(
    collection.features
      .map((feature) => feature.geometry?.type)
      .filter((value): value is Geometry["type"] => value != null),
  )).sort((left, right) => left.localeCompare(right));

  const bbox = (() => {
    const coords: [number, number][] = [];
    collection.features.forEach((feature) => {
      const geometry = feature.geometry;
      if (!geometry) return;
      switch (geometry.type) {
        case "Point":
          coords.push([geometry.coordinates[0], geometry.coordinates[1]]);
          break;
        case "MultiPoint":
        case "LineString":
          geometry.coordinates.forEach((position) => coords.push([position[0], position[1]]));
          break;
        case "MultiLineString":
        case "Polygon":
          geometry.coordinates.forEach((line) => line.forEach((position) => coords.push([position[0], position[1]])));
          break;
        case "MultiPolygon":
          geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => ring.forEach((position) => coords.push([position[0], position[1]]))));
          break;
        case "GeometryCollection":
          geometry.geometries.forEach((child) => {
            const childCollection = buildGeoParquetMetadata({
              type: "FeatureCollection",
              features: [{ type: "Feature", geometry: child, properties: null }],
            }, geometryColumnName, crs);
            const childBbox = ((childCollection.columns as Record<string, unknown>)[geometryColumnName] as Record<string, unknown> | undefined)?.bbox;
            if (Array.isArray(childBbox) && childBbox.length === 4) {
              coords.push([Number(childBbox[0]), Number(childBbox[1])]);
              coords.push([Number(childBbox[2]), Number(childBbox[3])]);
            }
          });
          break;
        default:
          break;
      }
    });

    if (coords.length === 0) return undefined;
    const longitudes = coords.map(([longitude]) => longitude);
    const latitudes = coords.map(([, latitude]) => latitude);
    return [
      Math.min(...longitudes),
      Math.min(...latitudes),
      Math.max(...longitudes),
      Math.max(...latitudes),
    ] as [number, number, number, number];
  })();

  return {
    version: GEO_PARQUET_VERSION,
    primary_column: geometryColumnName,
    columns: {
      [geometryColumnName]: {
        encoding: "WKB",
        geometry_types: geometryTypes,
        ...(bbox ? { bbox } : {}),
        ...(crs && crs !== "EPSG:4326" && crs !== "OGC:CRS84"
          ? { crs: { type: "name", properties: { name: crs } } }
          : {}),
      },
    },
  };
}

function buildArrowTableFromFeatureCollection(
  collection: FeatureCollection,
  geometryColumnName: string,
  includeProperties: boolean,
  crs?: string,
): { table: Table; geoMetadata: GeoParquetMetadataSummary } {
  const features = collection.features.filter((feature) => feature.geometry != null);
  const propertyKeys = includeProperties
    ? Array.from(new Set(features.flatMap((feature) => Object.keys(feature.properties ?? {})))).sort((left, right) => left.localeCompare(right))
    : [];

  const attributeColumns: Record<string, readonly unknown[]> = {};

  const featureIds = features.map((feature) => (feature.id == null ? null : String(feature.id)));
  if (featureIds.some((value) => value != null)) {
    attributeColumns.feature_id = featureIds;
  }

  propertyKeys.forEach((key) => {
    const values = features.map((feature) => compressiblePropertyValue((feature.properties ?? {})[key]));
    const valueType = selectPropertyColumnType(values);
    if (valueType === "number") {
      attributeColumns[key] = values.map((value) => (typeof value === "number" ? value : value == null ? null : Number(value)));
      return;
    }
    if (valueType === "boolean") {
      attributeColumns[key] = values.map((value) => (typeof value === "boolean" ? value : value == null ? null : String(value) === "true"));
      return;
    }
    attributeColumns[key] = values.map((value) => (value == null ? null : String(value)));
  });

  const baseTable = Object.keys(attributeColumns).length > 0
    ? tableFromArrays(attributeColumns)
    : null;
  const geometryVector = vectorFromArray(
    features.map((feature) => encodeWkbGeometry(feature.geometry as Geometry)),
    new Binary(),
  );
  const geoMetadataJson = buildGeoParquetMetadata({ type: "FeatureCollection", features }, geometryColumnName, crs);
  const schema = new Schema(
    [
      new Field(geometryColumnName, geometryVector.type, false),
      ...(baseTable?.schema.fields ?? []),
    ],
    new Map([["geo", JSON.stringify(geoMetadataJson)]]),
  );
  const vectorColumns = {
    [geometryColumnName]: geometryVector,
    ...Object.fromEntries(
      (baseTable?.schema.fields ?? []).map((field) => [field.name, baseTable?.getChild(field.name)]),
    ),
  };

  return {
    table: new Table(schema, vectorColumns as never),
    geoMetadata: {
      version: GEO_PARQUET_VERSION,
      primaryColumn: geometryColumnName,
      geometryTypes: ((geoMetadataJson.columns as Record<string, unknown>)[geometryColumnName] as Record<string, unknown>).geometry_types as string[],
      ...((((geoMetadataJson.columns as Record<string, unknown>)[geometryColumnName] as Record<string, unknown>).bbox as [number, number, number, number] | undefined)
        ? { bbox: ((geoMetadataJson.columns as Record<string, unknown>)[geometryColumnName] as Record<string, unknown>).bbox as [number, number, number, number] }
        : {}),
      ...(crs ? { crs } : {}),
    },
  };
}

function parseArrowTable(buffer: Uint8Array): ParsedColumnarTable {
  const table = tableFromIPC(buffer);
  return {
    table,
    arrowIPC: tableToIPC(table, "stream"),
  };
}

async function parseGeoParquetTable(buffer: Uint8Array): Promise<ParsedColumnarTable> {
  const parquet = await getParquetModule();
  const wasmTable = parquet.readParquet(buffer);
  const arrowIPC = wasmTable.intoIPCStream();
  const table = tableFromIPC(arrowIPC);
  const geoMetadata = parseGeoMetadata(table.schema);
  return geoMetadata
    ? { table, arrowIPC, geoMetadata }
    : { table, arrowIPC };
}

export async function prepareColumnarDatasetImport(params: {
  buffer: Uint8Array;
  format: ColumnarSourceFormat;
  fileName: string;
}): Promise<ColumnarImportArtifact> {
  const parsed: ParsedColumnarTable = params.format === "arrow"
    ? parseArrowTable(params.buffer)
    : await parseGeoParquetTable(params.buffer);
  const resolution = detectGeometryResolution(parsed.table, parsed.geoMetadata);
  const schema = buildSchemaPreview(parsed.table, resolution);
  const previewRows = buildPreviewRows(parsed.table);
  const featureResult = buildFeatureCollectionFromTable(parsed.table, resolution);
  const quality = computeDataQuality(parsed.table, schema, featureResult.importedFeatureCount);
  const sizeComparison = computeSizeComparison(featureResult.featureCollection, params.buffer.byteLength);

  return {
    format: params.format,
    rowCount: parsed.table.numRows,
    importedFeatureCount: featureResult.importedFeatureCount,
    skippedRowCount: featureResult.skippedRowCount,
    estimatedMemoryBytes: estimateMaterializedMemoryBytes(parsed.table.numRows, parsed.table.numCols, params.buffer.byteLength, params.format),
    transferSizeBytes: parsed.arrowIPC.byteLength,
    geometryEncoding: resolution.mode,
    ...(resolution.geometryColumn ? { geometryColumn: resolution.geometryColumn } : {}),
    ...(resolution.longitudeColumn ? { longitudeColumn: resolution.longitudeColumn } : {}),
    ...(resolution.latitudeColumn ? { latitudeColumn: resolution.latitudeColumn } : {}),
    schema,
    previewRows,
    warnings: featureResult.warnings,
    workerTableName: buildColumnarWorkerTableName(params.fileName),
    ...(parsed.geoMetadata
      ? {
          geoParquet: {
            ...(parsed.geoMetadata.version ? { version: parsed.geoMetadata.version } : {}),
            ...(parsed.geoMetadata.primaryColumn ? { primaryColumn: parsed.geoMetadata.primaryColumn } : {}),
            geometryTypes: parsed.geoMetadata.geometryTypes,
            ...(parsed.geoMetadata.bbox ? { bbox: parsed.geoMetadata.bbox } : {}),
            ...(parsed.geoMetadata.crs ? { crs: parsed.geoMetadata.crs } : {}),
          },
        }
      : {}),
    featureCollection: featureResult.featureCollection,
    arrowIPC: parsed.arrowIPC,
    quality,
    sizeComparison,
  };
}

export async function exportFeatureCollectionToGeoParquet(
  collection: FeatureCollection,
  options?: GeoParquetExportOptions,
): Promise<GeoParquetExportResult> {
  const parquet = await getParquetModule();
  const geometryColumnName = options?.geometryColumnName?.trim() || "geometry";
  const includeProperties = options?.includeProperties ?? true;
  const { table, geoMetadata } = buildArrowTableFromFeatureCollection(
    collection,
    geometryColumnName,
    includeProperties,
    options?.crs,
  );
  const wasmTable = parquet.Table.fromIPCStream(tableToIPC(table, "stream"));
  const bytes = parquet.writeParquet(wasmTable);

  return {
    bytes,
    filename: buildColumnarFilename(options?.filename ?? "map_export", "geoparquet"),
    rowCount: collection.features.filter((feature) => feature.geometry != null).length,
    byteLength: bytes.byteLength,
    geoMetadata,
  };
}