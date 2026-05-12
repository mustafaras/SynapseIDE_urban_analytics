import { busTimestamp, synapseBus } from "@/services/synapseBus";
import { useMapExplorerStore } from "@/stores/useMapExplorerStore";
import type {
  EvidenceArtifactRegisterPayload,
  SynapseBusSubscription,
} from "@/types/synapse-bus";
import type {
  MapEvidenceQAState,
  MapEvidenceScalar,
  MapEvidenceSourceModule,
} from "@/centerpanel/components/map/mapTypes";

const MAX_FILE_PATH_LENGTH = 1024;
const MAX_TEXT_LENGTH = 240;
const MAX_REFERENCE_COUNT = 64;
const IDE_TO_MAP_INBOX_LIMIT = 32;

const IDE_REFERENCE_LIMITATION =
  "Map Explorer stores only IDE file/artifact references and scalar metadata; it does not read or mutate Synapse IDE buffers.";

export type MapIdeArtifactLanguage =
  | "python"
  | "json"
  | "geojson"
  | "csv"
  | "sql"
  | "markdown"
  | "typescript"
  | "yaml"
  | "plaintext"
  | "unknown";

export type MapIdeArtifactKind =
  | "map-manifest"
  | "urban-map-manifest"
  | "geojson-layer"
  | "csv-table"
  | "parquet-table"
  | "geopackage"
  | "python-script"
  | "sql-query"
  | "unsupported";

export type MapIdeArtifactRecognitionStatus = "recognized" | "invalid" | "unsupported";

export type MapIdeArtifactReadinessStatus =
  | "ready"
  | "needs-review"
  | "environment-dependent"
  | "unsupported"
  | "blocked";

export type MapIdeArtifactSourceModule =
  | "ide"
  | "synapse-ide"
  | "urban-analytics"
  | "system";

export interface MapIdeArtifactDataReference {
  kind: "file" | "url" | "map-layer" | "worker-table" | "query-result" | "manifest";
  path?: string;
  uri?: string;
  layerId?: string;
  workerTableName?: string;
  queryResultId?: string;
  format?: string;
  featureCount?: number;
  rowCount?: number;
}

export interface MapIdeArtifactCrsMetadata {
  declaredCrs?: string;
  requiredCrs?: string;
  status?: "known" | "missing" | "unknown";
  source?: "manifest" | "schema" | "data-reference" | "user" | "unknown";
  notes?: string[];
}

export interface MapIdeArtifactSchemaField {
  name: string;
  type?: string;
  role?: "geometry" | "longitude" | "latitude" | "attribute" | "identifier" | "temporal" | "unknown";
}

export interface MapIdeArtifactSchemaMetadata {
  fields?: MapIdeArtifactSchemaField[];
  geometryField?: string;
  geometryTypes?: string[];
  featureCount?: number;
  rowCount?: number;
}

export interface MapIdeArtifactUrbanContextReference {
  contextId?: string;
  flowId?: string;
  methodId?: string;
  runId?: string;
  studyAreaId?: string;
  layerIds?: string[];
  evidenceIds?: string[];
}

export interface MapIdeArtifactRecognitionPayload {
  filePath: string;
  language?: string;
  artifactKind?: string;
  dataReference?: MapIdeArtifactDataReference;
  crs?: MapIdeArtifactCrsMetadata;
  schema?: MapIdeArtifactSchemaMetadata;
  relatedUrbanContext?: MapIdeArtifactUrbanContextReference;
  sourceModule?: MapIdeArtifactSourceModule;
  relatedLayerIds?: string[];
  relatedRunIds?: string[];
  relatedArtifactIds?: string[];
  manifestMetadata?: Record<string, unknown>;
  title?: string;
  summary?: string;
  contentHash?: string;
  sizeBytes?: number;
  receivedAt?: string;
}

export interface MapIdeArtifactClassification {
  status: MapIdeArtifactRecognitionStatus;
  artifactKind: MapIdeArtifactKind;
  language: MapIdeArtifactLanguage;
  normalizedPath: string;
  filename: string;
  extension: string;
  warnings: string[];
  reason?: string;
}

export interface MapIdeArtifactReadiness {
  status: MapIdeArtifactReadinessStatus;
  canAddLayer: boolean;
  canActivateExistingLayer: boolean;
  validationRequired: boolean;
  reasons: string[];
  blockers: string[];
  warnings: string[];
  existingLayerIds: string[];
}

export interface MapIdeArtifactRecognitionResult {
  ok: boolean;
  status: MapIdeArtifactRecognitionStatus;
  artifactKind: MapIdeArtifactKind;
  language: MapIdeArtifactLanguage;
  readiness: MapIdeArtifactReadiness;
  evidenceArtifactId: string | null;
  warnings: string[];
  reason?: string;
}

export type IdeToMapArtifactIncomingEvent = {
  kind: "evidence.register";
  receivedAt: string;
  payload: EvidenceArtifactRegisterPayload;
  result: MapIdeArtifactRecognitionResult;
};

export interface RecognizeMapIdeArtifactOptions {
  registerEvidence?: boolean;
}

const ARTIFACT_KIND_VALUES = [
  "map-manifest",
  "urban-map-manifest",
  "geojson-layer",
  "csv-table",
  "parquet-table",
  "geopackage",
  "python-script",
  "sql-query",
  "unsupported",
] as const satisfies readonly MapIdeArtifactKind[];

const LANGUAGE_VALUES = [
  "python",
  "json",
  "geojson",
  "csv",
  "sql",
  "markdown",
  "typescript",
  "yaml",
  "plaintext",
  "unknown",
] as const satisfies readonly MapIdeArtifactLanguage[];

const inbox: IdeToMapArtifactIncomingEvent[] = [];
const inboxListeners = new Set<(event: IdeToMapArtifactIncomingEvent) => void>();
const busSubscriptions: SynapseBusSubscription[] = [];
let installed = false;

function clipText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeFilePath(value: string): string {
  return value.trim().replace(/\\/g, "/").replace(/^\/+/, "");
}

function filenameFromPath(path: string): string {
  const parts = normalizeFilePath(path).split("/");
  return parts[parts.length - 1] || path;
}

function extensionFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".urban-map-manifest.json")) return ".urban-map-manifest.json";
  if (lower.endsWith(".map.json")) return ".map.json";
  if (lower.endsWith(".geoparquet")) return ".geoparquet";
  const dot = lower.lastIndexOf(".");
  return dot === -1 ? "" : lower.slice(dot);
}

function stableHash(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const text = clipText(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
    if (output.length >= MAX_REFERENCE_COUNT) break;
  }
  return output;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return unique(value.filter((entry): entry is string => typeof entry === "string"));
}

function normalizeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : undefined;
}

function normalizeArtifactKind(value: unknown): MapIdeArtifactKind | undefined {
  if (typeof value !== "string") return undefined;
  const lower = value.trim().toLowerCase();
  if (lower === "workflow-script") return "python-script";
  if (lower === "map-layer" || lower === "spatial-layer") return "geojson-layer";
  if (lower === "geoparquet" || lower === "parquet") return "parquet-table";
  if (ARTIFACT_KIND_VALUES.includes(lower as MapIdeArtifactKind)) {
    return lower as MapIdeArtifactKind;
  }
  return undefined;
}

function normalizeLanguage(value: unknown, fallback: MapIdeArtifactLanguage): MapIdeArtifactLanguage {
  if (typeof value !== "string") return fallback;
  const lower = value.trim().toLowerCase();
  if (lower === "py") return "python";
  if (lower === "ts") return "typescript";
  if (lower === "md") return "markdown";
  if (lower === "yml") return "yaml";
  if (LANGUAGE_VALUES.includes(lower as MapIdeArtifactLanguage)) {
    return lower as MapIdeArtifactLanguage;
  }
  return fallback;
}

function normalizeDataReference(input: unknown): MapIdeArtifactDataReference | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const record = input as Record<string, unknown>;
  const kind = clipText(record.kind, 40) as MapIdeArtifactDataReference["kind"];
  if (!["file", "url", "map-layer", "worker-table", "query-result", "manifest"].includes(kind)) return undefined;
  const reference: MapIdeArtifactDataReference = { kind };
  const path = clipText(record.path, MAX_FILE_PATH_LENGTH);
  const uri = clipText(record.uri, MAX_FILE_PATH_LENGTH);
  const layerId = clipText(record.layerId);
  const workerTableName = clipText(record.workerTableName);
  const queryResultId = clipText(record.queryResultId);
  const format = clipText(record.format, 80);
  const featureCount = normalizeNumber(record.featureCount);
  const rowCount = normalizeNumber(record.rowCount);
  if (path) reference.path = normalizeFilePath(path);
  if (uri) reference.uri = uri;
  if (layerId) reference.layerId = layerId;
  if (workerTableName) reference.workerTableName = workerTableName;
  if (queryResultId) reference.queryResultId = queryResultId;
  if (format) reference.format = format;
  if (featureCount !== undefined) reference.featureCount = featureCount;
  if (rowCount !== undefined) reference.rowCount = rowCount;
  return reference;
}

function normalizeCrsMetadata(input: unknown): MapIdeArtifactCrsMetadata | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const record = input as Record<string, unknown>;
  const metadata: MapIdeArtifactCrsMetadata = {};
  const declaredCrs = clipText(record.declaredCrs ?? record.crs, 80);
  const requiredCrs = clipText(record.requiredCrs, 80);
  const status = clipText(record.status, 40) as MapIdeArtifactCrsMetadata["status"];
  const source = clipText(record.source, 40) as MapIdeArtifactCrsMetadata["source"];
  const notes = normalizeStringList(record.notes);
  if (declaredCrs) metadata.declaredCrs = declaredCrs;
  if (requiredCrs) metadata.requiredCrs = requiredCrs;
  if (status === "known" || status === "missing" || status === "unknown") metadata.status = status;
  if (["manifest", "schema", "data-reference", "user", "unknown"].includes(source)) metadata.source = source;
  if (notes.length > 0) metadata.notes = notes;
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function normalizeSchemaMetadata(input: unknown): MapIdeArtifactSchemaMetadata | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const record = input as Record<string, unknown>;
  const fields: MapIdeArtifactSchemaField[] = [];
  if (Array.isArray(record.fields)) {
    for (const entry of record.fields) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const fieldRecord = entry as Record<string, unknown>;
      const name = clipText(fieldRecord.name, 120);
      if (!name) continue;
      const field: MapIdeArtifactSchemaField = { name };
      const type = clipText(fieldRecord.type, 80);
      const role = clipText(fieldRecord.role, 40) as MapIdeArtifactSchemaField["role"];
      if (type) field.type = type;
      if (["geometry", "longitude", "latitude", "attribute", "identifier", "temporal", "unknown"].includes(role)) {
        field.role = role;
      }
      fields.push(field);
      if (fields.length >= MAX_REFERENCE_COUNT) break;
    }
  }

  const metadata: MapIdeArtifactSchemaMetadata = {};
  const geometryField = clipText(record.geometryField, 120);
  const geometryTypes = normalizeStringList(record.geometryTypes);
  const featureCount = normalizeNumber(record.featureCount);
  const rowCount = normalizeNumber(record.rowCount);
  if (fields.length > 0) metadata.fields = fields;
  if (geometryField) metadata.geometryField = geometryField;
  if (geometryTypes.length > 0) metadata.geometryTypes = geometryTypes;
  if (featureCount !== undefined) metadata.featureCount = featureCount;
  if (rowCount !== undefined) metadata.rowCount = rowCount;
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function normalizeUrbanContext(input: unknown): MapIdeArtifactUrbanContextReference | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const record = input as Record<string, unknown>;
  const context: MapIdeArtifactUrbanContextReference = {};
  const contextId = clipText(record.contextId);
  const flowId = clipText(record.flowId);
  const methodId = clipText(record.methodId);
  const runId = clipText(record.runId);
  const studyAreaId = clipText(record.studyAreaId);
  const layerIds = normalizeStringList(record.layerIds);
  const evidenceIds = normalizeStringList(record.evidenceIds);
  if (contextId) context.contextId = contextId;
  if (flowId) context.flowId = flowId;
  if (methodId) context.methodId = methodId;
  if (runId) context.runId = runId;
  if (studyAreaId) context.studyAreaId = studyAreaId;
  if (layerIds.length > 0) context.layerIds = layerIds;
  if (evidenceIds.length > 0) context.evidenceIds = evidenceIds;
  return Object.keys(context).length > 0 ? context : undefined;
}

function metadataString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = clipText(record[key]);
    if (value) return value;
  }
  return "";
}

function metadataStringList(record: Record<string, unknown>, ...keys: string[]): string[] {
  for (const key of keys) {
    const values = normalizeStringList(record[key]);
    if (values.length > 0) return values;
  }
  return [];
}

function normalizeManifestMetadata(input: unknown): Record<string, unknown> | undefined {
  return input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : undefined;
}

function inferKindAndLanguage(
  filename: string,
  manifestMetadata: Record<string, unknown> | undefined,
): Pick<MapIdeArtifactClassification, "artifactKind" | "language" | "extension"> {
  const lower = filename.toLowerCase();
  const extension = extensionFromFilename(filename);

  if (extension === ".urban-map-manifest.json") {
    return { artifactKind: "urban-map-manifest", language: "json", extension };
  }
  if (extension === ".map.json" || lower.endsWith(".map.manifest.json")) {
    return { artifactKind: "map-manifest", language: "json", extension };
  }
  if (extension === ".geojson") {
    return { artifactKind: "geojson-layer", language: "geojson", extension };
  }
  if (extension === ".csv") {
    return { artifactKind: "csv-table", language: "csv", extension };
  }
  if (extension === ".parquet" || extension === ".geoparquet") {
    return { artifactKind: "parquet-table", language: "plaintext", extension };
  }
  if (extension === ".gpkg") {
    return { artifactKind: "geopackage", language: "plaintext", extension };
  }
  if (extension === ".py") {
    return { artifactKind: "python-script", language: "python", extension };
  }
  if (extension === ".sql") {
    return { artifactKind: "sql-query", language: "sql", extension };
  }
  if (extension === ".json" && manifestMetadata && metadataString(manifestMetadata, "mapContextId", "mapManifestId", "workflowId")) {
    return { artifactKind: "map-manifest", language: "json", extension };
  }

  return { artifactKind: "unsupported", language: "unknown", extension };
}

export function classifyMapIdeArtifact(
  payload: MapIdeArtifactRecognitionPayload,
): MapIdeArtifactClassification {
  const warnings: string[] = [];
  if (typeof payload.filePath !== "string") {
    return {
      status: "invalid",
      artifactKind: "unsupported",
      language: "unknown",
      normalizedPath: "",
      filename: "",
      extension: "",
      warnings,
      reason: "Incoming IDE artifact reference is missing a file path.",
    };
  }

  const normalizedPath = normalizeFilePath(payload.filePath);
  const filename = filenameFromPath(normalizedPath);
  if (!normalizedPath) {
    return {
      status: "invalid",
      artifactKind: "unsupported",
      language: "unknown",
      normalizedPath,
      filename,
      extension: "",
      warnings,
      reason: "Incoming IDE artifact reference is missing a file path.",
    };
  }
  if (normalizedPath.length > MAX_FILE_PATH_LENGTH || normalizedPath.includes("\0")) {
    return {
      status: "invalid",
      artifactKind: "unsupported",
      language: "unknown",
      normalizedPath,
      filename,
      extension: extensionFromFilename(filename),
      warnings,
      reason: "Incoming IDE artifact file path is invalid or too long.",
    };
  }

  const manifestMetadata = normalizeManifestMetadata(payload.manifestMetadata);
  const inferred = inferKindAndLanguage(filename, manifestMetadata);
  const explicitKind = normalizeArtifactKind(payload.artifactKind);
  const artifactKind = explicitKind ?? inferred.artifactKind;
  const language = normalizeLanguage(payload.language, inferred.language);

  if (explicitKind && explicitKind !== inferred.artifactKind && inferred.artifactKind !== "unsupported") {
    warnings.push(`IDE artifact kind hint "${explicitKind}" differs from file extension inference "${inferred.artifactKind}".`);
  }

  if (artifactKind === "unsupported") {
    return {
      status: "unsupported",
      artifactKind,
      language,
      normalizedPath,
      filename,
      extension: inferred.extension,
      warnings,
      reason: `Unsupported IDE artifact type for "${filename}".`,
    };
  }

  return {
    status: "recognized",
    artifactKind,
    language,
    normalizedPath,
    filename,
    extension: inferred.extension,
    warnings,
  };
}

function findExistingLayerIds(payload: MapIdeArtifactRecognitionPayload): string[] {
  const layerIds = unique([
    ...(payload.relatedLayerIds ?? []),
    ...(payload.relatedUrbanContext?.layerIds ?? []),
    ...(payload.dataReference?.layerId ? [payload.dataReference.layerId] : []),
  ]);
  if (layerIds.length === 0) return [];
  const existing = new Set(useMapExplorerStore.getState().overlayLayers.map((layer) => layer.id));
  return layerIds.filter((layerId) => existing.has(layerId));
}

function hasCsvCoordinateSchema(schema: MapIdeArtifactSchemaMetadata | undefined): boolean {
  const roles = schema?.fields?.map((field) => field.role) ?? [];
  return roles.includes("longitude") && roles.includes("latitude");
}

function assessReadiness(
  payload: MapIdeArtifactRecognitionPayload,
  classification: MapIdeArtifactClassification,
): MapIdeArtifactReadiness {
  const warnings = [...classification.warnings];
  const reasons: string[] = [];
  const blockers: string[] = [];
  const existingLayerIds = findExistingLayerIds(payload);
  const crs = payload.crs;
  const schema = payload.schema;
  let status: MapIdeArtifactReadinessStatus = "needs-review";
  let canActivateExistingLayer = false;

  if (classification.status === "invalid") {
    return {
      status: "blocked",
      canAddLayer: false,
      canActivateExistingLayer: false,
      validationRequired: true,
      reasons: classification.reason ? [classification.reason] : [],
      blockers: classification.reason ? [classification.reason] : [],
      warnings,
      existingLayerIds: [],
    };
  }

  if (classification.status === "unsupported") {
    return {
      status: "unsupported",
      canAddLayer: false,
      canActivateExistingLayer: false,
      validationRequired: true,
      reasons: classification.reason ? [classification.reason] : [],
      blockers: [],
      warnings,
      existingLayerIds: [],
    };
  }

  if (existingLayerIds.length > 0) {
    status = "ready";
    canActivateExistingLayer = true;
    reasons.push("Reference links to an existing Map Explorer layer; no new layer materialization is required.");
  }

  if (classification.artifactKind === "geojson-layer") {
    if (!crs?.declaredCrs) warnings.push("GeoJSON reference has no declared CRS; analytical CRS readiness remains unknown until import validation.");
    if (!schema?.geometryTypes?.length && schema?.featureCount === undefined) {
      warnings.push("GeoJSON geometry and feature-count metadata are not declared; Map Explorer must validate the file before layer creation.");
    }
    if (status !== "ready") {
      reasons.push("GeoJSON can become a map layer only after Map Explorer imports and validates geometry, CRS, schema, and provenance.");
    }
  } else if (classification.artifactKind === "csv-table") {
    if (!hasCsvCoordinateSchema(schema)) warnings.push("CSV references need latitude/longitude or geometry-column mapping before layer creation.");
    if (!crs?.declaredCrs) warnings.push("CSV coordinate CRS is not declared; defaulting to readiness review instead of analytical readiness.");
    reasons.push("CSV import requires explicit coordinate/schema mapping and preview validation.");
  } else if (classification.artifactKind === "parquet-table") {
    if (!schema?.geometryField && !payload.dataReference?.workerTableName) {
      warnings.push("Parquet reference does not declare a GeoParquet geometry field or worker table name.");
    }
    if (status !== "ready") status = "environment-dependent";
    reasons.push("Columnar spatial import depends on GeoParquet metadata and worker/WASM availability.");
  } else if (classification.artifactKind === "geopackage") {
    status = existingLayerIds.length > 0 ? "ready" : "environment-dependent";
    warnings.push("GeoPackage is recognized as a spatial reference, but direct browser import is not currently exposed by MapDataImporter.");
    reasons.push("GeoPackage must be converted or handled by an environment-dependent importer before becoming a layer.");
  } else if (classification.artifactKind === "python-script" || classification.artifactKind === "sql-query") {
    if (status !== "ready") status = "needs-review";
    warnings.push("Code artifacts are evidence and reproducibility references, not map layers by themselves.");
    reasons.push("Map Explorer will store the code reference as evidence; layer creation requires a validated data output reference.");
  } else {
    if (status !== "ready") status = "needs-review";
    reasons.push("Manifest references can describe map artifacts, but Map Explorer must resolve and validate referenced data before layer creation.");
  }

  return {
    status,
    canAddLayer: false,
    canActivateExistingLayer,
    validationRequired: status !== "ready",
    reasons: unique(reasons),
    blockers: unique(blockers),
    warnings: unique(warnings),
    existingLayerIds,
  };
}

function qaStateForReadiness(readiness: MapIdeArtifactReadiness): MapEvidenceQAState {
  if (readiness.status === "ready") return "passed";
  if (readiness.status === "blocked") return "blocked";
  if (readiness.status === "unsupported") return "blocked";
  return "warning";
}

function mapEvidenceSourceModule(sourceModule: MapIdeArtifactSourceModule | undefined): MapEvidenceSourceModule {
  if (sourceModule === "urban-analytics") return "urban-analytics";
  if (sourceModule === "synapse-ide") return "synapse-ide";
  return "ide";
}

function scalarMetadata(
  payload: MapIdeArtifactRecognitionPayload,
  classification: MapIdeArtifactClassification,
  readiness: MapIdeArtifactReadiness,
): Record<string, MapEvidenceScalar> {
  const metadata: Record<string, MapEvidenceScalar> = {
    recognitionStatus: classification.status,
    artifactKind: classification.artifactKind,
    language: classification.language,
    fileExtension: classification.extension || null,
    readinessStatus: readiness.status,
    validationRequired: readiness.validationRequired,
    canAddLayer: readiness.canAddLayer,
    existingLayerCount: readiness.existingLayerIds.length,
  };
  if (payload.crs?.declaredCrs) metadata.declaredCrs = payload.crs.declaredCrs;
  if (payload.schema?.geometryField) metadata.geometryField = payload.schema.geometryField;
  if (payload.schema?.featureCount !== undefined) metadata.featureCount = payload.schema.featureCount;
  if (payload.schema?.rowCount !== undefined) metadata.rowCount = payload.schema.rowCount;
  if (payload.relatedUrbanContext?.contextId) metadata.urbanContextId = payload.relatedUrbanContext.contextId;
  if (payload.relatedUrbanContext?.flowId) metadata.urbanFlowId = payload.relatedUrbanContext.flowId;
  if (payload.relatedUrbanContext?.methodId) metadata.urbanMethodId = payload.relatedUrbanContext.methodId;
  if (payload.contentHash) metadata.contentHash = clipText(payload.contentHash, 160);
  if (payload.sizeBytes !== undefined && Number.isFinite(payload.sizeBytes) && payload.sizeBytes >= 0) {
    metadata.sizeBytes = Math.floor(payload.sizeBytes);
  }
  return metadata;
}

function buildCrsSummary(payload: MapIdeArtifactRecognitionPayload, readiness: MapIdeArtifactReadiness) {
  const notes = unique([
    ...(payload.crs?.notes ?? []),
    ...readiness.warnings.filter((warning) => warning.toLowerCase().includes("crs")),
    "IDE references do not grant Map Explorer analytical CRS readiness; import validation remains map-owned.",
  ]);
  if (!payload.crs?.declaredCrs && notes.length === 0 && readiness.existingLayerIds.length === 0) return undefined;
  return {
    ...(payload.crs?.declaredCrs ? { declaredCrs: payload.crs.declaredCrs } : {}),
    displayCrs: "EPSG:4326",
    sourceLayerCrs: readiness.existingLayerIds.map((layerId) => ({ layerId, crs: payload.crs?.declaredCrs ?? null })),
    missingLayerIds: payload.crs?.declaredCrs ? [] : readiness.existingLayerIds,
    notes,
  };
}

function buildGeometrySummary(payload: MapIdeArtifactRecognitionPayload, readiness: MapIdeArtifactReadiness) {
  const schema = payload.schema;
  if (!schema?.geometryTypes?.length && schema?.featureCount === undefined && readiness.existingLayerIds.length === 0) {
    return undefined;
  }
  return {
    geometryTypes: schema?.geometryTypes ?? [],
    ...(schema?.featureCount !== undefined ? { featureCount: schema.featureCount } : {}),
    source: "metadata" as const,
    notes: readiness.validationRequired
      ? ["Geometry metadata is declarative; raw geometry was not copied from the IDE and must be validated by Map Explorer import tools."]
      : ["Existing Map Explorer layer reference was used; no raw geometry was copied from the IDE."],
  };
}

function registerMapEvidenceCandidate(
  payload: MapIdeArtifactRecognitionPayload,
  classification: MapIdeArtifactClassification,
  readiness: MapIdeArtifactReadiness,
): string {
  const evidenceArtifactId = `map-ide-artifact-${stableHash(`${classification.artifactKind}:${classification.normalizedPath}`)}`;
  const linkedLayerIds = unique([
    ...(payload.relatedLayerIds ?? []),
    ...(payload.relatedUrbanContext?.layerIds ?? []),
    ...(payload.dataReference?.layerId ? [payload.dataReference.layerId] : []),
  ]);
  const relatedArtifactIds = unique([
    ...(payload.relatedArtifactIds ?? []),
    ...(payload.relatedUrbanContext?.evidenceIds ?? []),
  ]);
  const createdAt = payload.receivedAt ?? busTimestamp();
  const summary = clipText(
    payload.summary
      ?? `Recognized ${classification.artifactKind} reference from Synapse IDE for Map Explorer review.`,
    600,
  );
  const qaCaveats = unique([
    IDE_REFERENCE_LIMITATION,
    ...readiness.reasons,
    ...readiness.warnings,
  ]);

  useMapExplorerStore.getState().registerMapEvidenceArtifact({
    id: evidenceArtifactId,
    artifactId: evidenceArtifactId,
    kind: "ide-code-reference",
    title: clipText(payload.title, 180) || `${classification.filename} (${classification.artifactKind})`,
    ...(summary ? { summary } : {}),
    state: readiness.status === "blocked" || readiness.status === "unsupported" ? "blocked" : "active",
    sourceModule: mapEvidenceSourceModule(payload.sourceModule),
    sourceId: classification.normalizedPath,
    linkedLayerIds,
    linkedFileIds: [classification.normalizedPath],
    linkedArtifactIds: relatedArtifactIds,
    ideArtifactId: relatedArtifactIds[0] ?? evidenceArtifactId,
    linkedRunId: payload.relatedUrbanContext?.runId ?? payload.relatedRunIds?.[0],
    linkedWorkflowId: payload.relatedUrbanContext?.flowId,
    tags: ["ide-to-map", "prompt-19", classification.artifactKind],
    provenance: {
      sourceModule: mapEvidenceSourceModule(payload.sourceModule),
      sourceName: classification.filename,
      sourceUrl: classification.normalizedPath,
      createdAt,
      method: "IDE to Map artifact recognition",
      inputArtifactIds: relatedArtifactIds,
      sourceLayerIds: linkedLayerIds,
      notes: [IDE_REFERENCE_LIMITATION, ...readiness.reasons],
      crsSummary: buildCrsSummary(payload, readiness),
      geometrySummary: buildGeometrySummary(payload, readiness),
      ...(payload.relatedUrbanContext?.flowId ? { workflowId: payload.relatedUrbanContext.flowId } : {}),
      ...(payload.relatedUrbanContext?.runId ?? payload.relatedRunIds?.[0]
        ? { runId: payload.relatedUrbanContext?.runId ?? payload.relatedRunIds?.[0] }
        : {}),
    },
    qa: {
      state: qaStateForReadiness(readiness),
      issueCount: readiness.warnings.length + readiness.blockers.length,
      blockerCount: readiness.blockers.length,
      caveats: qaCaveats,
      checkedAt: busTimestamp(),
    },
    metadata: scalarMetadata(payload, classification, readiness),
    createdAt,
  });

  return evidenceArtifactId;
}

export function recognizeMapIdeArtifact(
  payload: MapIdeArtifactRecognitionPayload,
  options: RecognizeMapIdeArtifactOptions = {},
): MapIdeArtifactRecognitionResult {
  const dataReference = normalizeDataReference(payload.dataReference);
  const crs = normalizeCrsMetadata(payload.crs ?? payload.manifestMetadata);
  const schema = normalizeSchemaMetadata(payload.schema ?? payload.manifestMetadata);
  const relatedUrbanContext = normalizeUrbanContext(payload.relatedUrbanContext ?? payload.manifestMetadata);
  const normalizedPayload: MapIdeArtifactRecognitionPayload = {
    ...payload,
    ...(dataReference ? { dataReference } : {}),
    ...(crs ? { crs } : {}),
    ...(schema ? { schema } : {}),
    ...(relatedUrbanContext ? { relatedUrbanContext } : {}),
  };
  const classification = classifyMapIdeArtifact(normalizedPayload);
  const readiness = assessReadiness(normalizedPayload, classification);

  if (classification.status !== "recognized") {
    return {
      ok: false,
      status: classification.status,
      artifactKind: classification.artifactKind,
      language: classification.language,
      readiness,
      evidenceArtifactId: null,
      warnings: readiness.warnings,
      ...(classification.reason ? { reason: classification.reason } : {}),
    };
  }

  let evidenceArtifactId: string | null = null;
  if (options.registerEvidence !== false) {
    evidenceArtifactId = registerMapEvidenceCandidate(normalizedPayload, classification, readiness);
  }

  return {
    ok: true,
    status: "recognized",
    artifactKind: classification.artifactKind,
    language: classification.language,
    readiness,
    evidenceArtifactId,
    warnings: readiness.warnings,
  };
}

function mapEvidenceRegisterPayload(
  payload: EvidenceArtifactRegisterPayload,
): MapIdeArtifactRecognitionPayload {
  const manifestMetadata = normalizeManifestMetadata(payload.manifestMetadata);
  const relatedFilePaths = payload.relatedFilePaths ?? [];
  const record = manifestMetadata ?? {};
  const filePath = relatedFilePaths[0] ?? metadataString(record, "filePath", "path", "sourceUri") ?? "";
  const relatedLayerIds = unique([
    ...(payload.relatedLayerIds ?? []),
    ...metadataStringList(record, "layerIds", "sourceLayerIds", "outputLayerIds"),
  ]);
  const relatedRunIds = unique([
    ...(payload.relatedRunIds ?? []),
    ...metadataStringList(record, "runIds"),
    ...(metadataString(record, "runId", "workflowId") ? [metadataString(record, "runId", "workflowId")] : []),
  ]);
  const relatedArtifactIds = unique([payload.artifactId, ...(payload.relatedArtifactIds ?? [])]);
  const dataReference = normalizeDataReference(record.dataReference) ?? normalizeDataReference({
    kind: relatedLayerIds.length > 0 ? "map-layer" : "file",
    path: filePath,
    layerId: relatedLayerIds[0],
    workerTableName: metadataString(record, "workerTableName"),
    format: payload.artifactKind,
  });

  const mapped: MapIdeArtifactRecognitionPayload = {
    filePath,
    relatedLayerIds,
    relatedRunIds,
    relatedArtifactIds,
    sourceModule: "ide",
    title: payload.title,
    receivedAt: payload.requestedAt,
  };
  if (payload.language) mapped.language = payload.language;
  if (payload.artifactKind) mapped.artifactKind = payload.artifactKind;
  if (manifestMetadata) mapped.manifestMetadata = manifestMetadata;
  if (payload.summary) mapped.summary = payload.summary;
  if (payload.contentHash) mapped.contentHash = payload.contentHash;
  if (typeof payload.sizeBytes === "number") mapped.sizeBytes = payload.sizeBytes;
  if (dataReference) mapped.dataReference = dataReference;
  return mapped;
}

function pushIncomingEvent(event: IdeToMapArtifactIncomingEvent): void {
  inbox.unshift(event);
  if (inbox.length > IDE_TO_MAP_INBOX_LIMIT) inbox.length = IDE_TO_MAP_INBOX_LIMIT;
  for (const listener of Array.from(inboxListeners)) {
    listener(event);
  }
}

function onEvidenceArtifactRegister(payload: EvidenceArtifactRegisterPayload): void {
  if (payload.source !== "ide" && payload.sourceModule !== "ide") return;
  const result = recognizeMapIdeArtifact(mapEvidenceRegisterPayload(payload));
  pushIncomingEvent({
    kind: "evidence.register",
    receivedAt: busTimestamp(),
    payload,
    result,
  });
}

export function installIdeToMapArtifactReceiver(): boolean {
  if (installed) return false;
  busSubscriptions.push(synapseBus.on("evidence.artifact.register", onEvidenceArtifactRegister));
  installed = true;
  return true;
}

export function isIdeToMapArtifactReceiverInstalled(): boolean {
  return installed;
}

export function _uninstallIdeToMapArtifactReceiverForTesting(): void {
  for (const subscription of busSubscriptions) {
    subscription.off();
  }
  busSubscriptions.length = 0;
  inbox.length = 0;
  inboxListeners.clear();
  installed = false;
}

export function getIdeToMapArtifactInbox(): IdeToMapArtifactIncomingEvent[] {
  return inbox.slice();
}

export function getLastIdeToMapArtifactEvent(): IdeToMapArtifactIncomingEvent | null {
  return inbox[0] ?? null;
}

export function subscribeIdeToMapArtifactInbox(
  listener: (event: IdeToMapArtifactIncomingEvent) => void,
): () => void {
  inboxListeners.add(listener);
  return () => {
    inboxListeners.delete(listener);
  };
}