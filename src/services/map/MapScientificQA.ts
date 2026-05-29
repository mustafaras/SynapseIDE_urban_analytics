import { booleanValid } from "@turf/boolean-valid";
import { kinks } from "@turf/kinks";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type {
  LayerQaStatus,
  LayerScientificQABadge,
  LayerScientificQACategory,
  LayerScientificQACategorySummary,
  LayerScientificQAMetadata,
  LayerScientificQASeverity,
  LayerSourceKind,
  OverlayLayerConfig,
  OverlaySourceData,
} from "@/centerpanel/components/map/mapTypes";

export const MAP_SCIENTIFIC_QA_VERSION = 2;
export const DEFAULT_GEOMETRY_WORKER_FEATURE_THRESHOLD = 2_000;
export const MAX_REASONABLE_DECIMAL_PLACES = 8;

export const MAP_SCIENTIFIC_QA_CATEGORIES: readonly LayerScientificQACategory[] = [
  "crs",
  "geometry-validity",
  "schema",
  "scale",
  "missingness",
  "source-provenance",
  "attribution-license",
  "workflow-readiness",
  "export-readiness",
];

export type MapScientificQAIssueSeverity = "info" | "warning" | "error" | "blocker";

export type MapScientificQACategory = LayerScientificQACategory;
export type MapScientificQACategorySummary = LayerScientificQACategorySummary;
export type MapScientificQASeverity = LayerScientificQASeverity;

export type MapScientificQAIssueCategory =
  | "crs"
  | "geometry"
  | "geometry-type"
  | "coordinates"
  | "schema"
  | "scale"
  | "missingness"
  | "temporal"
  | "lineage"
  | "source-provenance"
  | "attribution-license"
  | "workflow-readiness"
  | "export-readiness"
  | "sample-data";

export type MapScientificQAGeometryFamily = "point" | "line" | "polygon" | "mixed" | "unknown";

export interface MapScientificQAIssue {
  id: string;
  code: string;
  category: MapScientificQAIssueCategory;
  severity: MapScientificQAIssueSeverity;
  title: string;
  explanation: string;
  suggestedFix: string;
  layerId?: string;
  layerName?: string;
  featureId?: string;
  featureIndex?: number;
  details?: Record<string, unknown>;
}

export interface MapScientificQAContext {
  viewportZoom?: number;
  activeAnalysisInputLayerIds?: string[];
  comparisonLayerIds?: string[];
  expectedGeometryTypes?: MapScientificQAGeometryFamily[];
  workflowLabel?: string;
  workerThresholdFeatures?: number;
  sampleWarningAcknowledged?: boolean;
}

export interface LayerScientificQASummary {
  layerId: string;
  layerName: string;
  status: LayerQaStatus;
  issueIds: string[];
  badges: LayerScientificQABadge[];
  caveats: string[];
  featureIssueCount: number;
  usedWorker: boolean;
  checkedAt: string;
  signature: string;
  geometryFamilies: MapScientificQAGeometryFamily[];
  vertexCount: number;
  featureCount: number;
  categorySummaries: MapScientificQACategorySummary[];
  metadata: LayerScientificQAMetadata;
}

export interface MapScientificQAState {
  status: LayerQaStatus;
  checkedAt: string;
  issues: MapScientificQAIssue[];
  layerSummaries: LayerScientificQASummary[];
  metadata: {
    generatedBy: "MapScientificQA";
    version: number;
    signature: string;
    visibleLayerCount: number;
    workerLayerCount: number;
    issueCounts: Record<MapScientificQAIssueSeverity, number>;
    categoryCounts?: Record<MapScientificQASeverity, number>;
    categorySummaries?: MapScientificQACategorySummary[];
  };
}

export interface MapScientificQAGateResult {
  blocked: boolean;
  title: string;
  message: string;
  blockingIssueIds: string[];
  warningIssueIds: string[];
  warnings: string[];
}

export interface MapScientificQAGeometryInput {
  layerId: string;
  layerName: string;
  featureCollection: FeatureCollection;
  crs: string | null;
}

export interface MapScientificQAGeometryResult {
  issues: MapScientificQAIssue[];
  featureCount: number;
  vertexCount: number;
  precisionOverrunCount: number;
  suspiciousCoordinateCount: number;
  geometryFamilies: MapScientificQAGeometryFamily[];
}

interface LayerEvaluationResult {
  issues: MapScientificQAIssue[];
  summary: LayerScientificQASummary;
}

interface CachedLayerEvaluation {
  signature: string;
  result: LayerEvaluationResult;
}

const severityRank: Record<MapScientificQAIssueSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  blocker: 3,
};

const qaSeverityRank: Record<MapScientificQASeverity, number> = {
  pass: 0,
  unknown: 1,
  warning: 2,
  blocked: 3,
};

const CATEGORY_PASS_REASONS: Record<MapScientificQACategory, string> = {
  crs: "No CRS metadata blocker was detected for the current context.",
  "geometry-validity": "No deterministic geometry validity blocker was detected.",
  schema: "Schema metadata is sufficient for map-side inspection.",
  scale: "No scale caveat was detected for the current viewport.",
  missingness: "Feature-count and completeness metadata are available or derivable.",
  "source-provenance": "Source and lineage metadata are available for review.",
  "attribution-license": "Attribution or license metadata is available.",
  "workflow-readiness": "No active workflow-readiness blocker was detected.",
  "export-readiness": "No publication/export blocker was detected from the current QA state.",
};

function issueToQASeverity(issue: MapScientificQAIssue): MapScientificQASeverity {
  if (issue.severity === "blocker" || issue.severity === "error") {
    return "blocked";
  }
  if (issue.severity === "warning") {
    return "warning";
  }
  return "unknown";
}

function maxQASeverity(severities: Iterable<MapScientificQASeverity>): MapScientificQASeverity {
  let maxSeverity: MapScientificQASeverity = "pass";
  for (const severity of severities) {
    if (qaSeverityRank[severity] > qaSeverityRank[maxSeverity]) {
      maxSeverity = severity;
    }
  }
  return maxSeverity;
}

function issueQACategories(issue: MapScientificQAIssue): MapScientificQACategory[] {
  switch (issue.category) {
    case "crs":
      return ["crs", "export-readiness"];
    case "geometry":
    case "coordinates":
      return ["geometry-validity", "workflow-readiness", "export-readiness"];
    case "geometry-type":
    case "workflow-readiness":
      return ["workflow-readiness"];
    case "schema":
      return ["schema", "export-readiness"];
    case "scale":
      return ["scale", "export-readiness"];
    case "missingness":
    case "temporal":
      return ["missingness", "export-readiness"];
    case "lineage":
    case "source-provenance":
    case "sample-data":
      return ["source-provenance", "export-readiness"];
    case "attribution-license":
      return ["attribution-license", "export-readiness"];
    case "export-readiness":
      return ["export-readiness"];
    default:
      return ["export-readiness"];
  }
}

function categoryIssueMatches(issue: MapScientificQAIssue, category: MapScientificQACategory): boolean {
  return issueQACategories(issue).includes(category);
}

function uniqueLimited(values: Array<string | undefined>, limit = 4): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

function schemaFieldCount(layer: OverlayLayerConfig): number {
  return Math.max(
    layer.metadata?.fields?.length ?? 0,
    layer.metadata?.schemaSummary?.fieldCount ?? 0,
    layer.metadata?.registry?.schemaSummary.fieldCount ?? 0,
  );
}

function hasLicenseOrAttribution(layer: OverlayLayerConfig): boolean {
  return Boolean(
    layer.provenance?.license
      || layer.provenance?.attribution
      || layer.metadata?.datasetContext?.license
      || layer.metadata?.licenseAttribution?.license
      || layer.metadata?.licenseAttribution?.attribution
      || layer.metadata?.registry?.licenseAttribution.license
      || layer.metadata?.registry?.licenseAttribution.attribution
      || layer.metadata?.analysisResult,
  );
}

function isFeatureLayer(layer: OverlayLayerConfig): boolean {
  return layer.type === "geojson" || layer.type === "heatmap";
}

function defaultCategorySeverity(
  category: MapScientificQACategory,
  layer: OverlayLayerConfig | null,
  geometryResult: MapScientificQAGeometryResult | null,
  geometryFamilies: MapScientificQAGeometryFamily[],
): Pick<MapScientificQACategorySummary, "severity" | "reasons" | "recommendedFixes"> {
  if (!layer) {
    return {
      severity: "pass",
      reasons: [CATEGORY_PASS_REASONS[category]],
      recommendedFixes: [],
    };
  }

  if (category === "crs" && !resolveLayerCrs(layer)) {
    return {
      severity: "unknown",
      reasons: ["CRS metadata is missing, so analytical projection readiness is unknown."],
      recommendedFixes: ["Attach a documented EPSG or OGC CRS identifier before analysis or publication."],
    };
  }

  if (category === "geometry-validity" && isFeatureLayer(layer) && !geometryResult) {
    return {
      severity: "unknown",
      reasons: ["Feature-level geometry validation could not inspect source features in this session."],
      recommendedFixes: ["Load inline GeoJSON or attach a geometry validation report to the layer metadata."],
    };
  }

  if (category === "geometry-validity" && geometryFamilies.includes("unknown")) {
    return {
      severity: "unknown",
      reasons: ["Geometry family metadata is unknown."],
      recommendedFixes: ["Attach geometry type metadata or reload a source with inspectable features."],
    };
  }

  if (category === "schema" && isFeatureLayer(layer) && schemaFieldCount(layer) === 0) {
    return {
      severity: "unknown",
      reasons: ["Queryable feature schema metadata is missing."],
      recommendedFixes: ["Add field names or a schema summary before using this layer in queries, reports, or analysis dispatch."],
    };
  }

  if (category === "missingness" && layer.metadata?.featureCount == null && !geometryResult) {
    return {
      severity: "unknown",
      reasons: ["Feature count or completeness metadata is missing."],
      recommendedFixes: ["Attach feature count and skipped-row/completeness notes before treating this layer as analysis-ready."],
    };
  }

  if (category === "attribution-license" && !hasLicenseOrAttribution(layer)) {
    return {
      severity: "warning",
      reasons: ["No license or attribution metadata is available for this layer."],
      recommendedFixes: ["Record license and attribution before report, dashboard, or publication export use."],
    };
  }

  return {
    severity: "pass",
    reasons: [CATEGORY_PASS_REASONS[category]],
    recommendedFixes: [],
  };
}

function buildCategorySummaries(input: {
  issues: MapScientificQAIssue[];
  layer?: OverlayLayerConfig;
  geometryResult?: MapScientificQAGeometryResult | null;
  geometryFamilies?: MapScientificQAGeometryFamily[];
}): MapScientificQACategorySummary[] {
  const layer = input.layer ?? null;
  const geometryResult = input.geometryResult ?? null;
  const geometryFamilies = input.geometryFamilies ?? [];
  return MAP_SCIENTIFIC_QA_CATEGORIES.map((category) => {
    const categoryIssues = input.issues.filter((issue) => categoryIssueMatches(issue, category));
    if (categoryIssues.length === 0) {
      const fallback = defaultCategorySeverity(category, layer, geometryResult, geometryFamilies);
      return {
        category,
        severity: fallback.severity,
        issueIds: [],
        affectedLayerIds: layer ? [layer.id] : [],
        reasons: fallback.reasons,
        recommendedFixes: fallback.recommendedFixes,
      };
    }

    return {
      category,
      severity: maxQASeverity(categoryIssues.map(issueToQASeverity)),
      issueIds: uniqueLimited(categoryIssues.map((issue) => issue.id), 12),
      affectedLayerIds: uniqueLimited(categoryIssues.map((issue) => issue.layerId ?? layer?.id), 12),
      reasons: uniqueLimited(categoryIssues.map((issue) => issue.explanation)),
      recommendedFixes: uniqueLimited(categoryIssues.map((issue) => issue.suggestedFix)),
    };
  });
}

function mergeCategorySummaries(summaries: MapScientificQACategorySummary[]): MapScientificQACategorySummary[] {
  return MAP_SCIENTIFIC_QA_CATEGORIES.map((category) => {
    const entries = summaries.filter((summary) => summary.category === category);
    if (entries.length === 0) {
      return {
        category,
        severity: "pass",
        issueIds: [],
        affectedLayerIds: [],
        reasons: [CATEGORY_PASS_REASONS[category]],
        recommendedFixes: [],
      };
    }
    return {
      category,
      severity: maxQASeverity(entries.map((entry) => entry.severity)),
      issueIds: uniqueLimited(entries.flatMap((entry) => entry.issueIds), 24),
      affectedLayerIds: uniqueLimited(entries.flatMap((entry) => entry.affectedLayerIds), 24),
      reasons: uniqueLimited(entries.flatMap((entry) => entry.reasons)),
      recommendedFixes: uniqueLimited(entries.flatMap((entry) => entry.recommendedFixes)),
    };
  });
}

function categoryCounts(summaries: MapScientificQACategorySummary[]): Record<MapScientificQASeverity, number> {
  return {
    pass: summaries.filter((summary) => summary.severity === "pass").length,
    warning: summaries.filter((summary) => summary.severity === "warning").length,
    blocked: summaries.filter((summary) => summary.severity === "blocked").length,
    unknown: summaries.filter((summary) => summary.severity === "unknown").length,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeCrs(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
}

function resolveLayerCrs(layer: OverlayLayerConfig): string | null {
  const metadata = layer.metadata;
  const candidates = [
    metadata?.crsSummary?.status === "known" ? metadata.crsSummary.crs : null,
    metadata?.importSource?.declaredCrs,
    metadata?.datasetContext?.crs,
    metadata?.columnar?.crs,
    metadata?.eoSource?.crs,
    metadata?.externalService?.crs,
    metadata?.registry?.crsSummary.status === "known" ? metadata.registry.crsSummary.crs : null,
  ];

  for (const candidate of candidates) {
    const crs = normalizeCrs(candidate);
    if (crs) {
      return crs;
    }
  }
  return null;
}

function resolveLayerSourceKind(layer: OverlayLayerConfig): LayerSourceKind {
  if (layer.sourceKind) {
    return layer.sourceKind;
  }
  if ((layer.group ?? "data") === "analysis" || layer.metadata?.analysisResult) {
    return "derived";
  }
  if (layer.metadata?.eoSource?.isDemo || layer.metadata?.datasetContext?.datasetId) {
    return "demo";
  }
  if (layer.metadata?.eoSource || (typeof layer.sourceData === "string" && /^https?:\/\//i.test(layer.sourceData))) {
    return "external";
  }
  if (layer.sourceData) {
    return "imported";
  }
  return "project";
}

function isDemoLayer(layer: OverlayLayerConfig): boolean {
  return resolveLayerSourceKind(layer) === "demo" || layer.metadata?.eoSource?.isDemo === true;
}

function sanitizeIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "unknown";
}

function createIssue(input: {
  code: string;
  category: MapScientificQAIssueCategory;
  severity: MapScientificQAIssueSeverity;
  title: string;
  explanation: string;
  suggestedFix: string;
  layerId?: string;
  layerName?: string;
  featureId?: string;
  featureIndex?: number;
  details?: Record<string, unknown>;
}): MapScientificQAIssue {
  const idParts = [
    "qa",
    input.layerId ?? "stack",
    input.featureIndex != null ? `f${input.featureIndex}` : input.featureId ?? "layer",
    input.code,
  ];
  return {
    id: idParts.map((part) => sanitizeIdPart(String(part))).join(":"),
    code: input.code,
    category: input.category,
    severity: input.severity,
    title: input.title,
    explanation: input.explanation,
    suggestedFix: input.suggestedFix,
    ...(input.layerId ? { layerId: input.layerId } : {}),
    ...(input.layerName ? { layerName: input.layerName } : {}),
    ...(input.featureId ? { featureId: input.featureId } : {}),
    ...(input.featureIndex != null ? { featureIndex: input.featureIndex } : {}),
    ...(input.details ? { details: input.details } : {}),
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function decimalPlaces(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const text = Math.abs(value).toString().toLowerCase();
  if (!text.includes("e")) {
    return text.includes(".") ? text.split(".")[1]!.length : 0;
  }
  const [mantissa, exponent] = text.split("e");
  const mantissaDecimals = mantissa?.includes(".") ? mantissa.split(".")[1]!.length : 0;
  const exponentValue = Number(exponent);
  return Math.max(0, mantissaDecimals - exponentValue);
}

function positionKey(position: Position): string {
  return `${position[0]},${position[1]}`;
}

function positionsEqual(left: Position, right: Position): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function isPosition(value: unknown): value is Position {
  return Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === "number"
    && typeof value[1] === "number";
}

function featureId(feature: Feature, index: number): string | undefined {
  const properties = isObject(feature.properties) ? feature.properties : {};
  const candidate = feature.id
    ?? properties.id
    ?? properties.feature_id
    ?? properties.objectid
    ?? properties.name;
  return candidate == null ? undefined : String(candidate || index + 1);
}

function geometryFamilyFromType(type: Geometry["type"]): MapScientificQAGeometryFamily {
  if (type.includes("Point")) {
    return "point";
  }
  if (type.includes("Line")) {
    return "line";
  }
  if (type.includes("Polygon")) {
    return "polygon";
  }
  return "unknown";
}

function summarizeGeometryFamilies(families: Set<MapScientificQAGeometryFamily>): MapScientificQAGeometryFamily[] {
  const normalized = [...families].filter((family) => family !== "unknown");
  if (normalized.length === 0) {
    return ["unknown"];
  }
  return normalized.length > 1 ? ["mixed"] : normalized;
}

function visitGeometryCoordinates(geometry: Geometry, visitor: (position: Position) => void): void {
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((entry) => visitGeometryCoordinates(entry, visitor));
    return;
  }

  const walk = (value: unknown): void => {
    if (isPosition(value)) {
      visitor(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
    }
  };

  walk(geometry.coordinates);
}

function isEmptyGeometry(geometry: Geometry): boolean {
  if (geometry.type === "GeometryCollection") {
    return geometry.geometries.length === 0 || geometry.geometries.every(isEmptyGeometry);
  }
  return !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0;
}

function addFeatureIssue(
  issues: MapScientificQAIssue[],
  input: Omit<Parameters<typeof createIssue>[0], "layerId" | "layerName"> & {
    layerId: string;
    layerName: string;
  },
): void {
  issues.push(createIssue(input));
}

function checkDuplicatePositions(
  positions: Position[],
  includeClosingVertex: boolean,
): { duplicateCount: number; consecutiveDuplicateCount: number } {
  const seen = new Set<string>();
  let duplicateCount = 0;
  let consecutiveDuplicateCount = 0;
  const limit = includeClosingVertex ? positions.length : Math.max(0, positions.length - 1);

  for (let index = 0; index < limit; index += 1) {
    const position = positions[index]!;
    const key = positionKey(position);
    if (seen.has(key)) {
      duplicateCount += 1;
    }
    seen.add(key);

    if (index > 0 && positionsEqual(position, positions[index - 1]!)) {
      consecutiveDuplicateCount += 1;
    }
  }

  return { duplicateCount, consecutiveDuplicateCount };
}

function checkRing(
  ring: Position[],
  context: {
    layerId: string;
    layerName: string;
    featureId?: string;
    featureIndex: number;
    label: string;
  },
  issues: MapScientificQAIssue[],
): void {
  if (ring.length < 4) {
    addFeatureIssue(issues, {
      code: "empty_or_short_ring",
      category: "geometry",
      severity: "error",
      title: "Polygon ring is too short",
      explanation: `${context.label} has fewer than four vertices, so it cannot describe a closed area.`,
      suggestedFix: "Repair or remove the feature, then reload the layer with a valid polygon ring.",
      layerId: context.layerId,
      layerName: context.layerName,
      ...(context.featureId ? { featureId: context.featureId } : {}),
      featureIndex: context.featureIndex,
    });
    return;
  }

  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (!positionsEqual(first, last)) {
    addFeatureIssue(issues, {
      code: "non_closed_ring",
      category: "geometry",
      severity: "error",
      title: "Polygon ring is not closed",
      explanation: `${context.label} has different first and last coordinates, which invalidates area calculations.`,
      suggestedFix: "Close the ring by repeating the first coordinate as the last coordinate before running analysis.",
      layerId: context.layerId,
      layerName: context.layerName,
      ...(context.featureId ? { featureId: context.featureId } : {}),
      featureIndex: context.featureIndex,
    });
  }

  const duplicates = checkDuplicatePositions(ring, false);
  if (duplicates.duplicateCount > 0 || duplicates.consecutiveDuplicateCount > 0) {
    addFeatureIssue(issues, {
      code: "duplicate_vertices",
      category: "geometry",
      severity: "warning",
      title: "Duplicate vertices detected",
      explanation: `${context.label} repeats ${duplicates.duplicateCount + duplicates.consecutiveDuplicateCount} vertex position(s), which can distort simplification and topology checks.`,
      suggestedFix: "Deduplicate vertices while preserving the intended shape, then rerun the QA check.",
      layerId: context.layerId,
      layerName: context.layerName,
      ...(context.featureId ? { featureId: context.featureId } : {}),
      featureIndex: context.featureIndex,
      details: duplicates,
    });
  }
}

function checkLinePositions(
  positions: Position[],
  context: {
    layerId: string;
    layerName: string;
    featureId?: string;
    featureIndex: number;
    label: string;
  },
  issues: MapScientificQAIssue[],
): void {
  if (positions.length < 2) {
    addFeatureIssue(issues, {
      code: "empty_or_short_line",
      category: "geometry",
      severity: "error",
      title: "Line geometry is too short",
      explanation: `${context.label} has fewer than two valid coordinate positions.`,
      suggestedFix: "Remove the empty line or digitize at least two positions.",
      layerId: context.layerId,
      layerName: context.layerName,
      ...(context.featureId ? { featureId: context.featureId } : {}),
      featureIndex: context.featureIndex,
    });
    return;
  }

  const duplicates = checkDuplicatePositions(positions, true);
  if (duplicates.duplicateCount > 0 || duplicates.consecutiveDuplicateCount > 0) {
    addFeatureIssue(issues, {
      code: "duplicate_vertices",
      category: "geometry",
      severity: "warning",
      title: "Duplicate vertices detected",
      explanation: `${context.label} repeats ${duplicates.duplicateCount + duplicates.consecutiveDuplicateCount} vertex position(s).`,
      suggestedFix: "Simplify or clean the linework before using it for distance or network analysis.",
      layerId: context.layerId,
      layerName: context.layerName,
      ...(context.featureId ? { featureId: context.featureId } : {}),
      featureIndex: context.featureIndex,
      details: duplicates,
    });
  }
}

function checkGeometryStructure(
  geometry: Geometry,
  context: {
    layerId: string;
    layerName: string;
    featureId?: string;
    featureIndex: number;
  },
  issues: MapScientificQAIssue[],
): void {
  if (isEmptyGeometry(geometry)) {
    addFeatureIssue(issues, {
      code: "empty_geometry",
      category: "geometry",
      severity: "error",
      title: "Empty geometry",
      explanation: "The feature has no usable coordinate positions, so it cannot participate in spatial analysis.",
      suggestedFix: "Remove the feature or replace it with a valid geometry.",
      layerId: context.layerId,
      layerName: context.layerName,
      ...(context.featureId ? { featureId: context.featureId } : {}),
      featureIndex: context.featureIndex,
    });
    return;
  }

  switch (geometry.type) {
    case "LineString":
      checkLinePositions(geometry.coordinates, { ...context, label: "LineString" }, issues);
      return;
    case "MultiLineString":
      geometry.coordinates.forEach((line, index) =>
        checkLinePositions(line, { ...context, label: `MultiLineString part ${index + 1}` }, issues),
      );
      return;
    case "Polygon":
      geometry.coordinates.forEach((ring, index) =>
        checkRing(ring, { ...context, label: `Polygon ring ${index + 1}` }, issues),
      );
      return;
    case "MultiPolygon":
      geometry.coordinates.forEach((polygon, polygonIndex) =>
        polygon.forEach((ring, ringIndex) =>
          checkRing(
            ring,
            { ...context, label: `MultiPolygon polygon ${polygonIndex + 1} ring ${ringIndex + 1}` },
            issues,
          ),
        ),
      );
      return;
    case "GeometryCollection":
      geometry.geometries.forEach((entry) => checkGeometryStructure(entry, context, issues));
      return;
    case "Point":
    case "MultiPoint":
      return;
    default:
      addFeatureIssue(issues, {
        code: "unsupported_geometry_type",
        category: "geometry",
        severity: "error",
        title: "Unsupported geometry type",
        explanation: `Geometry type ${(geometry as Geometry).type} is not supported by this map QA routine.`,
        suggestedFix: "Convert the layer to valid GeoJSON Point, LineString, Polygon, Multi* or GeometryCollection geometry.",
        layerId: context.layerId,
        layerName: context.layerName,
        ...(context.featureId ? { featureId: context.featureId } : {}),
        featureIndex: context.featureIndex,
      });
  }
}

function checkTopology(
  geometry: Geometry,
  context: {
    layerId: string;
    layerName: string;
    featureId?: string;
    featureIndex: number;
  },
  issues: MapScientificQAIssue[],
): void {
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((entry) => checkTopology(entry, context, issues));
    return;
  }

  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    try {
      const intersectionCount = geometry.type === "MultiPolygon"
        ? geometry.coordinates.reduce((count, coordinates) => {
            const polygon: Geometry = { type: "Polygon", coordinates };
            return count + kinks({ type: "Feature", geometry: polygon, properties: {} }).features.length;
          }, 0)
        : kinks({ type: "Feature", geometry, properties: {} }).features.length;
      if (intersectionCount > 0) {
        addFeatureIssue(issues, {
          code: "self_intersection",
          category: "geometry",
          severity: "error",
          title: "Self-intersecting geometry",
          explanation: `The polygon crosses itself at ${intersectionCount} detected location(s), making area and overlay results unreliable.`,
          suggestedFix: "Run a make-valid or polygon repair operation, then inspect the corrected rings before analysis.",
          layerId: context.layerId,
          layerName: context.layerName,
          ...(context.featureId ? { featureId: context.featureId } : {}),
          featureIndex: context.featureIndex,
          details: { intersectionCount },
        });
      }
    } catch {
      addFeatureIssue(issues, {
        code: "topology_check_failed",
        category: "geometry",
        severity: "warning",
        title: "Topology validation could not finish",
        explanation: "The polygon structure is malformed enough that the self-intersection check could not complete.",
        suggestedFix: "Repair the GeoJSON structure and rerun QA.",
        layerId: context.layerId,
        layerName: context.layerName,
        ...(context.featureId ? { featureId: context.featureId } : {}),
        featureIndex: context.featureIndex,
      });
    }
  }

  try {
    if (!booleanValid(geometry)) {
      addFeatureIssue(issues, {
        code: "invalid_geojson_geometry",
        category: "geometry",
        severity: "error",
        title: "Invalid GeoJSON geometry",
        explanation: "The geometry failed the deterministic GeoJSON validity check.",
        suggestedFix: "Repair the feature in a GIS editor or regenerate it from a valid source dataset.",
        layerId: context.layerId,
        layerName: context.layerName,
        ...(context.featureId ? { featureId: context.featureId } : {}),
        featureIndex: context.featureIndex,
      });
    }
  } catch {
    addFeatureIssue(issues, {
      code: "validity_check_failed",
      category: "geometry",
      severity: "warning",
      title: "Geometry validity check could not finish",
      explanation: "The feature has malformed coordinates that prevented a full validity check.",
      suggestedFix: "Normalize the GeoJSON geometry structure, then rerun QA.",
      layerId: context.layerId,
      layerName: context.layerName,
      ...(context.featureId ? { featureId: context.featureId } : {}),
      featureIndex: context.featureIndex,
    });
  }
}

function asFeatureCollection(sourceData: OverlaySourceData | undefined): FeatureCollection | null {
  if (!sourceData) {
    return null;
  }

  let input: unknown = sourceData;
  if (typeof sourceData === "string") {
    const trimmed = sourceData.trim();
    if (!trimmed.startsWith("{")) {
      return null;
    }
    try {
      input = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (!isObject(input) || typeof input.type !== "string") {
    return null;
  }

  if (input.type === "FeatureCollection" && Array.isArray(input.features)) {
    return input as unknown as FeatureCollection;
  }

  if (input.type === "Feature" && isObject(input.geometry)) {
    return { type: "FeatureCollection", features: [input as unknown as Feature] };
  }

  if (isObject(input) && typeof input.type === "string") {
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: input as unknown as Geometry, properties: {} }],
    };
  }

  return null;
}

function summarizeSourceForSignature(sourceData: OverlaySourceData | undefined): unknown {
  const collection = asFeatureCollection(sourceData);
  if (!collection) {
    return typeof sourceData === "string" ? sourceData : null;
  }

  const featureCount = collection.features.length;
  const sampleIndexes = Array.from(new Set([
    0,
    Math.floor(featureCount / 2),
    Math.max(0, featureCount - 1),
  ])).filter((index) => index >= 0 && index < featureCount);

  return {
    featureCount,
    samples: sampleIndexes.map((index) => collection.features[index]),
  };
}

function buildLayerSignature(layer: OverlayLayerConfig, context: MapScientificQAContext): string {
  const metadata = layer.metadata ?? {};
  return stableStringify({
    layer: {
      id: layer.id,
      name: layer.name,
      type: layer.type,
      visible: layer.visible,
      group: layer.group,
      sourceKind: layer.sourceKind,
      queryable: layer.queryable,
      metadata: {
        featureCount: metadata.featureCount,
        geometryType: metadata.geometryType,
        bounds: metadata.bounds,
        fields: metadata.fields,
        importFormat: metadata.importFormat,
        dataVersion: metadata.dataVersion,
        analysisResult: metadata.analysisResult
          ? {
              engine: metadata.analysisResult.engine,
              runTimestamp: metadata.analysisResult.runTimestamp,
              sourceLayerIds: metadata.analysisResult.sourceLayerIds,
              sourceDataVersion: metadata.analysisResult.sourceDataVersion,
              stale: metadata.analysisResult.stale,
              visualizationKind: metadata.analysisResult.visualization.kind,
            }
          : null,
        datasetContext: metadata.datasetContext,
        columnar: metadata.columnar,
        eoSource: metadata.eoSource,
        externalService: metadata.externalService,
        importSource: metadata.importSource
          ? {
              declaredCrs: metadata.importSource.declaredCrs,
              format: metadata.importSource.format,
              importedAt: metadata.importSource.importedAt,
              sourceConfidence: metadata.importSource.sourceConfidence,
            }
          : null,
        crsSummary: metadata.crsSummary,
        geometrySummary: metadata.geometrySummary,
        // `scientificQA` is generated from this signature and must not feed
        // back into it; including it makes every completed QA pass appear new.
        registry: metadata.registry
          ? {
              crsSummary: metadata.registry.crsSummary,
              geometrySummary: metadata.registry.geometrySummary,
              qaStatus: metadata.registry.qaStatus,
              publicationReadiness: metadata.registry.publicationReadiness,
              readiness: metadata.registry.readiness,
            }
          : null,
      },
      provenance: layer.provenance,
      source: summarizeSourceForSignature(layer.sourceData),
    },
    context: {
      viewportZoom: context.viewportZoom,
      active: context.activeAnalysisInputLayerIds?.includes(layer.id) ?? false,
      expectedGeometryTypes: context.expectedGeometryTypes,
      workflowLabel: context.workflowLabel,
    },
  });
}

export function runMapScientificQAGeometryChecks(input: MapScientificQAGeometryInput): MapScientificQAGeometryResult {
  const issues: MapScientificQAIssue[] = [];
  const families = new Set<MapScientificQAGeometryFamily>();
  let vertexCount = 0;
  let precisionOverrunCount = 0;
  let suspiciousCoordinateCount = 0;

  input.featureCollection.features.forEach((feature, index) => {
    const id = featureId(feature, index);
    const context = {
      layerId: input.layerId,
      layerName: input.layerName,
      ...(id ? { featureId: id } : {}),
      featureIndex: index,
    };

    if (!feature.geometry) {
      addFeatureIssue(issues, {
        code: "empty_geometry",
        category: "geometry",
        severity: "error",
        title: "Missing feature geometry",
        explanation: "The feature has null geometry and cannot be rendered or analyzed.",
        suggestedFix: "Remove the feature or add a valid GeoJSON geometry.",
        ...context,
      });
      return;
    }

    const geometry = feature.geometry;
    if (geometry.type === "GeometryCollection") {
      geometry.geometries.forEach((entry) => families.add(geometryFamilyFromType(entry.type)));
    } else {
      families.add(geometryFamilyFromType(geometry.type));
    }

    checkGeometryStructure(geometry, context, issues);
    checkTopology(geometry, context, issues);

    let invalidCoordinateReported = false;
    let suspiciousCoordinateReported = false;
    visitGeometryCoordinates(geometry, (position) => {
      vertexCount += 1;
      const lng = Number(position[0]);
      const lat = Number(position[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        if (!invalidCoordinateReported) {
          invalidCoordinateReported = true;
          addFeatureIssue(issues, {
            code: "invalid_numeric_coordinate",
            category: "coordinates",
            severity: "error",
            title: "Invalid numeric coordinate",
            explanation: "At least one coordinate contains NaN, Infinity, or a non-finite value.",
            suggestedFix: "Filter invalid rows or replace malformed coordinates before loading the layer.",
            ...context,
          });
        }
        return;
      }

      if (decimalPlaces(lng) > MAX_REASONABLE_DECIMAL_PLACES || decimalPlaces(lat) > MAX_REASONABLE_DECIMAL_PLACES) {
        precisionOverrunCount += 1;
      }

      const looksProjected = Math.abs(lng) > 180 || Math.abs(lat) > 90;
      const severelyOutOfRange = Math.abs(lng) > 360 || Math.abs(lat) > 180;
      if (looksProjected && (!input.crs || input.crs === "EPSG:4326")) {
        suspiciousCoordinateCount += 1;
        if (severelyOutOfRange && !suspiciousCoordinateReported) {
          suspiciousCoordinateReported = true;
          addFeatureIssue(issues, {
            code: "suspicious_coordinate_range",
            category: "coordinates",
            severity: "error",
            title: "Suspicious coordinate range",
            explanation: "Coordinates fall far outside longitude/latitude limits while the layer has no projected CRS metadata.",
            suggestedFix: "Confirm the source CRS and reproject the layer to EPSG:4326 for map display and browser analysis.",
            ...context,
            details: { lng, lat },
          });
        }
      }
    });
  });

  if (precisionOverrunCount > 0) {
    issues.push(createIssue({
      code: "excessive_coordinate_precision",
      category: "coordinates",
      severity: "warning",
      title: "Excessive coordinate precision",
      explanation: `${precisionOverrunCount.toLocaleString()} coordinate position(s) exceed ${MAX_REASONABLE_DECIMAL_PLACES} decimal places. This can inflate file size without improving urban-scale analysis.`,
      suggestedFix: "Round coordinates to a documented precision, usually 6 to 8 decimal places for WGS84 urban layers.",
      layerId: input.layerId,
      layerName: input.layerName,
      details: { precisionOverrunCount, maxDecimalPlaces: MAX_REASONABLE_DECIMAL_PLACES },
    }));
  }

  if (suspiciousCoordinateCount > 0) {
    issues.push(createIssue({
      code: "suspicious_coordinate_range_layer",
      category: "coordinates",
      severity: "warning",
      title: "Suspicious coordinate ranges",
      explanation: `${suspiciousCoordinateCount.toLocaleString()} coordinate position(s) look projected or outside valid WGS84 ranges.`,
      suggestedFix: "Verify CRS metadata and reproject to EPSG:4326 before map analysis.",
      layerId: input.layerId,
      layerName: input.layerName,
      details: { suspiciousCoordinateCount },
    }));
  }

  return {
    issues,
    featureCount: input.featureCollection.features.length,
    vertexCount,
    precisionOverrunCount,
    suspiciousCoordinateCount,
    geometryFamilies: summarizeGeometryFamilies(families),
  };
}

function issueStatus(issues: MapScientificQAIssue[]): LayerQaStatus {
  if (issues.some((issue) => issue.severity === "blocker" || issue.severity === "error")) {
    return "error";
  }
  if (issues.some((issue) => issue.severity === "warning")) {
    return "warning";
  }
  return "passed";
}

function caveatsFromIssues(issues: MapScientificQAIssue[]): string[] {
  return issues
    .filter((issue) => issue.severity !== "info")
    .slice(0, 4)
    .map((issue) => issue.explanation);
}

function badgesFromIssues(layer: OverlayLayerConfig, issues: MapScientificQAIssue[]): LayerScientificQABadge[] {
  const badges = new Set<LayerScientificQABadge>();

  if (issues.some((issue) => issue.category === "geometry" && (issue.severity === "error" || issue.severity === "blocker"))) {
    badges.add("invalid_geometry");
  }
  if (issues.some((issue) => issue.code === "missing_crs" || issue.code === "unknown_crs")) {
    badges.add("missing_crs");
  }
  if (isDemoLayer(layer)) {
    badges.add("sample_data");
  }
  if (layer.metadata?.analysisResult?.stale) {
    badges.add("stale_result");
  }
  if (issues.some((issue) => issue.severity === "warning" || issue.category === "lineage" || issue.category === "scale")) {
    badges.add("uncertain_output");
  }

  return [...badges];
}

function buildLayerMetadata(summary: Omit<LayerScientificQASummary, "metadata">): LayerScientificQAMetadata {
  return {
    status: summary.status,
    issueIds: summary.issueIds,
    badges: summary.badges,
    checkedAt: summary.checkedAt,
    featureIssueCount: summary.featureIssueCount,
    usedWorker: summary.usedWorker,
    caveats: summary.caveats,
    categorySummaries: summary.categorySummaries,
    signature: summary.signature,
  };
}

function parseResolutionMeters(label: string | undefined): number | null {
  if (!label) {
    return null;
  }
  const match = /(\d+(?:\.\d+)?)\s*(km|m|cm|ft|feet|meter|metre|meters|metres)?/i.exec(label);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return null;
  }
  const unit = (match[2] ?? "m").toLowerCase();
  if (unit === "km") {
    return value * 1000;
  }
  if (unit === "cm") {
    return value / 100;
  }
  if (unit === "ft" || unit === "feet") {
    return value * 0.3048;
  }
  return value;
}

function addMetadataIssues(layer: OverlayLayerConfig, issues: MapScientificQAIssue[]): void {
  const crs = resolveLayerCrs(layer);
  if (!crs) {
    issues.push(createIssue({
      code: "missing_crs",
      category: "crs",
      severity: "warning",
      title: "Missing CRS metadata",
      explanation: "The layer has no explicit CRS or projection metadata. Rendering assumes EPSG:4326, but scientific analysis needs a documented CRS.",
      suggestedFix: "Add an EPSG code or source projection note before using this layer in measurements, overlays, or model inputs.",
      layerId: layer.id,
      layerName: layer.name,
    }));
  } else if (!/^EPSG:\d+$/i.test(crs) && !/^OGC:CRS84$/i.test(crs)) {
    issues.push(createIssue({
      code: "unknown_crs",
      category: "crs",
      severity: "warning",
      title: "Unrecognized CRS metadata",
      explanation: `The CRS value "${crs}" is present but not normalized to a recognizable EPSG or OGC identifier.`,
      suggestedFix: "Normalize the projection metadata to an EPSG code and document any axis-order assumptions.",
      layerId: layer.id,
      layerName: layer.name,
      details: { crs },
    }));
  }

  const provenance = layer.provenance;
  const hasSource = Boolean(
    provenance?.label
      || provenance?.sourceName
      || provenance?.sourceUrl
      || layer.metadata?.datasetContext?.source
      || layer.metadata?.eoSource?.provider
      || layer.metadata?.externalService?.endpoint,
  );
  const hasTimestamp = Boolean(
    provenance?.collectedAt
      || provenance?.generatedAt
      || layer.metadata?.datasetContext?.updateDate
      || layer.metadata?.eoSource?.timeLabel
      || layer.metadata?.eoSource?.sourceRef
      || layer.metadata?.externalService?.refreshedAt
      || layer.metadata?.analysisResult?.runTimestamp,
  );
  const hasLicense = Boolean(
    provenance?.license
      || provenance?.attribution
      || layer.metadata?.datasetContext?.license
      || layer.metadata?.licenseAttribution?.license
      || layer.metadata?.licenseAttribution?.attribution
      || layer.metadata?.registry?.licenseAttribution.license
      || layer.metadata?.registry?.licenseAttribution.attribution
      || layer.metadata?.analysisResult,
  );
  const hasLineage = Boolean(
    provenance?.method
      || provenance?.notes?.length
      || layer.metadata?.analysisResult?.parameterSummary
      || layer.metadata?.datasetContext?.schemaSummary?.length
      || layer.metadata?.columnar?.geoParquetVersion,
  );
  const missingLineage = [
    !hasSource ? "source" : null,
    !hasTimestamp ? "timestamp" : null,
    !hasLineage ? "provenance" : null,
  ].filter((entry): entry is string => Boolean(entry));

  if (missingLineage.length > 0) {
    issues.push(createIssue({
      code: "missing_lineage_metadata",
      category: "source-provenance",
      severity: "warning",
      title: "Incomplete lineage metadata",
      explanation: `The layer is missing ${missingLineage.join(", ")} metadata, limiting reproducibility and publication readiness.`,
      suggestedFix: "Record the source, timestamp, and processing lineage in layer metadata before publishing results.",
      layerId: layer.id,
      layerName: layer.name,
      details: { missing: missingLineage },
    }));
  }

  if (!hasLicense) {
    issues.push(createIssue({
      code: "missing_attribution_license",
      category: "attribution-license",
      severity: "warning",
      title: "Missing license or attribution",
      explanation: "The layer has no license or attribution metadata, so report, dashboard, and publication reuse cannot be audited.",
      suggestedFix: "Attach source license and attribution text before using this layer in formal outputs.",
      layerId: layer.id,
      layerName: layer.name,
    }));
  }

  if (isFeatureLayer(layer) && schemaFieldCount(layer) === 0) {
    issues.push(createIssue({
      code: "missing_schema_metadata",
      category: "schema",
      severity: "warning",
      title: "Missing schema metadata",
      explanation: "Queryable feature layers need field metadata before query, workflow, or report handoff readiness can be trusted.",
      suggestedFix: "Attach field names, geometry field, and known required attributes to the layer schema summary.",
      layerId: layer.id,
      layerName: layer.name,
    }));
  }

  if (layer.metadata?.analysisResult?.stale) {
    issues.push(createIssue({
      code: "stale_analysis_result",
      category: "lineage",
      severity: "warning",
      title: "Stale analysis result",
      explanation: "The source layer changed after this analysis result was computed.",
      suggestedFix: "Re-run the analysis or mark the output as historical before using it in reports.",
      layerId: layer.id,
      layerName: layer.name,
    }));
  }
}

function addScaleIssues(
  layer: OverlayLayerConfig,
  geometry: MapScientificQAGeometryResult | null,
  context: MapScientificQAContext,
  issues: MapScientificQAIssue[],
): void {
  const zoom = context.viewportZoom;
  if (zoom == null || !Number.isFinite(zoom)) {
    return;
  }

  if (geometry && geometry.vertexCount > 10_000 && zoom < 9) {
    issues.push(createIssue({
      code: "vector_detail_view_scale_mismatch",
      category: "scale",
      severity: "warning",
      title: "Vector detail exceeds viewport scale",
      explanation: `${geometry.vertexCount.toLocaleString()} vertices are loaded while the map is zoomed out. Small geometry artifacts may dominate analysis and rendering cost.`,
      suggestedFix: "Use a generalized layer at broad zooms, or restrict analysis to the current map view before dispatch.",
      layerId: layer.id,
      layerName: layer.name,
      details: { vertexCount: geometry.vertexCount, zoom },
    }));
  }

  if (layer.type === "raster-tile") {
    const resolutionMeters = parseResolutionMeters(layer.metadata?.eoSource?.resolutionLabel);
    if (resolutionMeters == null) {
      issues.push(createIssue({
        code: "missing_raster_resolution",
        category: "scale",
        severity: "warning",
        title: "Missing raster resolution metadata",
        explanation: "The raster layer does not report pixel resolution, so scale-sensitive comparisons cannot be audited.",
        suggestedFix: "Attach pixel size or ground sampling distance metadata to the raster source.",
        layerId: layer.id,
        layerName: layer.name,
      }));
      return;
    }

    if (resolutionMeters > 100 && zoom >= 15) {
      issues.push(createIssue({
        code: "coarse_raster_high_zoom",
        category: "scale",
        severity: "warning",
        title: "Raster is too coarse for current zoom",
        explanation: `The raster resolution is about ${resolutionMeters.toFixed(1)} m while the viewport is at zoom ${zoom.toFixed(1)}.`,
        suggestedFix: "Use a higher-resolution raster or reduce analysis scale.",
        layerId: layer.id,
        layerName: layer.name,
        details: { resolutionMeters, zoom },
      }));
    }

    if (resolutionMeters < 1 && zoom <= 8) {
      issues.push(createIssue({
        code: "fine_raster_low_zoom",
        category: "scale",
        severity: "warning",
        title: "High-resolution raster used at broad scale",
        explanation: `Sub-meter raster resolution is being viewed at zoom ${zoom.toFixed(1)}, where aggregation or tiling artifacts may dominate.`,
        suggestedFix: "Aggregate to the analysis scale or zoom into the study area before comparison.",
        layerId: layer.id,
        layerName: layer.name,
        details: { resolutionMeters, zoom },
      }));
    }
  }
}

function addGeometryTypeIssues(
  layer: OverlayLayerConfig,
  geometryFamilies: MapScientificQAGeometryFamily[],
  context: MapScientificQAContext,
  issues: MapScientificQAIssue[],
): void {
  const expected = context.expectedGeometryTypes;
  const activeLayerIds = new Set(context.activeAnalysisInputLayerIds ?? []);
  if (!expected?.length || !activeLayerIds.has(layer.id)) {
    return;
  }

  const compatible = geometryFamilies.some((family) =>
    expected.includes(family) || family === "mixed",
  );
  if (!compatible) {
    issues.push(createIssue({
      code: "geometry_type_mismatch",
      category: "geometry-type",
      severity: "blocker",
      title: "Geometry type does not match workflow input",
      explanation: `${context.workflowLabel ?? "The selected workflow"} expects ${expected.join(" or ")} geometries, but this layer is ${geometryFamilies.join(", ")}.`,
      suggestedFix: "Choose a compatible layer or transform the input geometry before dispatching analysis.",
      layerId: layer.id,
      layerName: layer.name,
      details: { expected, actual: geometryFamilies },
    }));
  }
}

function countFeatureIssues(issues: MapScientificQAIssue[]): number {
  return issues.filter((issue) => issue.featureIndex != null || issue.featureId != null).length;
}

async function runGeometryWorker(input: MapScientificQAGeometryInput): Promise<MapScientificQAGeometryResult> {
  return await new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./MapScientificQA.worker.ts", import.meta.url), { type: "module" });
    const cleanup = () => {
      worker.terminate();
    };
    worker.onmessage = (event: MessageEvent<MapScientificQAGeometryResult>) => {
      cleanup();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || "Scientific geometry QA worker failed."));
    };
    worker.postMessage(input);
  });
}

async function evaluateLayer(
  layer: OverlayLayerConfig,
  context: MapScientificQAContext,
  signature: string,
): Promise<LayerEvaluationResult> {
  const issues: MapScientificQAIssue[] = [];
  const crs = resolveLayerCrs(layer);
  let geometryResult: MapScientificQAGeometryResult | null = null;
  let usedWorker = false;

  addMetadataIssues(layer, issues);

  const collection = asFeatureCollection(layer.sourceData);
  if (collection) {
    const workerThreshold = context.workerThresholdFeatures ?? DEFAULT_GEOMETRY_WORKER_FEATURE_THRESHOLD;
    const workerInput: MapScientificQAGeometryInput = {
      layerId: layer.id,
      layerName: layer.name,
      featureCollection: collection,
      crs,
    };

    if (collection.features.length > workerThreshold && typeof Worker !== "undefined") {
      try {
        geometryResult = await runGeometryWorker(workerInput);
        usedWorker = true;
      } catch {
        geometryResult = runMapScientificQAGeometryChecks(workerInput);
      }
    } else {
      geometryResult = runMapScientificQAGeometryChecks(workerInput);
    }

    issues.push(...geometryResult.issues);
  } else if (layer.type === "geojson" || layer.type === "heatmap") {
    issues.push(createIssue({
      code: "geometry_validation_deferred",
      category: "geometry",
      severity: "info",
      title: "Geometry validation deferred",
      explanation: "The layer source is remote or metadata-only, so feature-level geometry validation cannot run deterministically in this session.",
      suggestedFix: "Load the layer as inline GeoJSON or attach a validation report to the layer metadata.",
      layerId: layer.id,
      layerName: layer.name,
    }));
  }

  const geometryFamilies = geometryResult?.geometryFamilies
    ?? (layer.metadata?.geometryType ? [geometryFamilyFromMetadata(layer.metadata.geometryType)] : ["unknown"]);

  addGeometryTypeIssues(layer, geometryFamilies, context, issues);
  addScaleIssues(layer, geometryResult, context, issues);

  const status = issueStatus(issues);
  const checkedAt = nowIso();
  const categorySummaries = buildCategorySummaries({
    issues,
    layer,
    geometryResult,
    geometryFamilies,
  });
  const summaryBase: Omit<LayerScientificQASummary, "metadata"> = {
    layerId: layer.id,
    layerName: layer.name,
    status,
    issueIds: issues.map((issue) => issue.id),
    badges: badgesFromIssues(layer, issues),
    caveats: caveatsFromIssues(issues),
    featureIssueCount: countFeatureIssues(issues),
    usedWorker,
    checkedAt,
    signature,
    geometryFamilies,
    vertexCount: geometryResult?.vertexCount ?? 0,
    featureCount: geometryResult?.featureCount ?? layer.metadata?.featureCount ?? 0,
    categorySummaries,
  };
  const summary: LayerScientificQASummary = {
    ...summaryBase,
    metadata: buildLayerMetadata(summaryBase),
  };

  return { issues, summary };
}

function geometryFamilyFromMetadata(value: string): MapScientificQAGeometryFamily {
  const normalized = value.toLowerCase();
  if (normalized.includes("point")) {
    return "point";
  }
  if (normalized.includes("line")) {
    return "line";
  }
  if (normalized.includes("polygon")) {
    return "polygon";
  }
  if (normalized.includes("mixed")) {
    return "mixed";
  }
  return "unknown";
}

function extractDateCandidate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const match = /\d{4}-\d{2}-\d{2}(?:t\d{2}:\d{2}:\d{2}(?:\.\d+)?z?)?/i.exec(value);
  const candidate = match?.[0] ?? value;
  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveTemporalDate(layer: OverlayLayerConfig): Date | null {
  const candidates = [
    layer.provenance?.collectedAt,
    layer.provenance?.generatedAt,
    layer.metadata?.datasetContext?.updateDate,
    layer.metadata?.eoSource?.timeLabel,
    layer.metadata?.externalService?.refreshedAt,
    layer.metadata?.analysisResult?.runTimestamp,
    layer.metadata?.updatedAt,
  ];

  for (const candidate of candidates) {
    const date = extractDateCandidate(candidate);
    if (date) {
      return date;
    }
  }
  return null;
}

function evaluateGlobalIssues(
  layers: OverlayLayerConfig[],
  context: MapScientificQAContext,
): MapScientificQAIssue[] {
  const issues: MapScientificQAIssue[] = [];
  const visibleLayers = layers.filter((layer) => layer.visible);
  const visibleKnownCrs = visibleLayers
    .map((layer) => ({ layer, crs: resolveLayerCrs(layer) }))
    .filter((entry): entry is { layer: OverlayLayerConfig; crs: string } => Boolean(entry.crs));
  const crsValues = Array.from(new Set(visibleKnownCrs.map((entry) => entry.crs)));

  if (crsValues.length > 1) {
    issues.push(createIssue({
      code: "visible_crs_mismatch",
      category: "crs",
      severity: "error",
      title: "Visible layers use different CRS metadata",
      explanation: `Visible layers declare ${crsValues.join(", ")}. Browser map rendering assumes a common coordinate space, so overlay and measurement results may be invalid.`,
      suggestedFix: "Reproject layers to a common CRS, preferably EPSG:4326 for this map workspace, and document the reprojection step.",
      details: {
        crsValues,
        layers: visibleKnownCrs.map((entry) => ({ id: entry.layer.id, name: entry.layer.name, crs: entry.crs })),
      },
    }));
  }

  const activeIds = new Set(context.activeAnalysisInputLayerIds ?? []);
  const activeKnownCrs = visibleKnownCrs.filter((entry) => activeIds.has(entry.layer.id));
  if (activeKnownCrs.length > 1 && new Set(activeKnownCrs.map((entry) => entry.crs)).size > 1) {
    issues.push(createIssue({
      code: "analysis_input_crs_mismatch",
      category: "crs",
      severity: "blocker",
      title: "Analysis inputs use mismatched CRS",
      explanation: "The active analysis input layers do not share the same declared coordinate reference system.",
      suggestedFix: "Reproject active inputs to a single CRS before dispatching the workflow.",
      details: {
        layers: activeKnownCrs.map((entry) => ({ id: entry.layer.id, name: entry.layer.name, crs: entry.crs })),
      },
    }));
  }

  const comparisonIds = new Set(context.comparisonLayerIds ?? []);
  const comparisonCandidates = comparisonIds.size > 1
    ? visibleLayers.filter((layer) => comparisonIds.has(layer.id))
    : visibleLayers.filter((layer) => layer.metadata?.analysisResult?.visualization.kind === "temporal" || layer.metadata?.eoSource);
  const temporalEntries = comparisonCandidates
    .map((layer) => ({ layer, date: resolveTemporalDate(layer) }))
    .filter((entry): entry is { layer: OverlayLayerConfig; date: Date } => Boolean(entry.date));

  if (temporalEntries.length > 1) {
    const times = temporalEntries.map((entry) => entry.date.getTime());
    const spanDays = (Math.max(...times) - Math.min(...times)) / 86_400_000;
    if (spanDays > 365) {
      issues.push(createIssue({
        code: "temporal_mismatch",
        category: "temporal",
        severity: "warning",
        title: "Temporal mismatch in comparison layers",
        explanation: `Compared layers span about ${Math.round(spanDays).toLocaleString()} days, which may invalidate before/after or temporal overlay interpretation.`,
        suggestedFix: "Use time-aligned layers or explicitly label the comparison as multi-period context rather than direct change.",
        details: {
          spanDays: Math.round(spanDays),
          layers: temporalEntries.map((entry) => ({
            id: entry.layer.id,
            name: entry.layer.name,
            date: entry.date.toISOString(),
          })),
        },
      }));
    }
  }

  const demoLayers = visibleLayers.filter(isDemoLayer);
  const projectLikeLayers = visibleLayers.filter((layer) => !isDemoLayer(layer) && resolveLayerSourceKind(layer) !== "derived");
  if (demoLayers.length > 0 && projectLikeLayers.length > 0 && !context.sampleWarningAcknowledged) {
    issues.push(createIssue({
      code: "sample_data_mixed_with_project",
      category: "sample-data",
      severity: "warning",
      title: "Sample data mixed with project data",
      explanation: "At least one demo or teaching layer is visible alongside project data. Results may be illustrative rather than project-valid.",
      suggestedFix: "Acknowledge the sample-data caveat in the report or remove demo layers before analysis.",
      layerId: demoLayers[0]!.id,
      layerName: demoLayers[0]!.name,
      details: {
        sampleLayers: demoLayers.map((layer) => layer.name),
        projectLayers: projectLikeLayers.map((layer) => layer.name),
      },
    }));
  }

  return issues;
}

function sortIssues(issues: MapScientificQAIssue[]): MapScientificQAIssue[] {
  return [...issues].sort((left, right) => {
    const severityDiff = severityRank[right.severity] - severityRank[left.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    return left.id.localeCompare(right.id);
  });
}

function issueCounts(issues: MapScientificQAIssue[]): Record<MapScientificQAIssueSeverity, number> {
  return {
    info: issues.filter((issue) => issue.severity === "info").length,
    warning: issues.filter((issue) => issue.severity === "warning").length,
    error: issues.filter((issue) => issue.severity === "error").length,
    blocker: issues.filter((issue) => issue.severity === "blocker").length,
  };
}

function overallStatus(issues: MapScientificQAIssue[]): LayerQaStatus {
  if (issues.some((issue) => issue.severity === "blocker" || issue.severity === "error")) {
    return "error";
  }
  if (issues.some((issue) => issue.severity === "warning")) {
    return "warning";
  }
  return "passed";
}

export class MapScientificQAEngine {
  private readonly layerCache = new Map<string, CachedLayerEvaluation>();
  private lastSignature: string | null = null;
  private lastState: MapScientificQAState | null = null;

  async evaluate(layers: OverlayLayerConfig[], context: MapScientificQAContext = {}): Promise<MapScientificQAState> {
    const layerResults = await Promise.all(layers.map(async (layer) => {
      const signature = buildLayerSignature(layer, context);
      const cached = this.layerCache.get(layer.id);
      if (cached?.signature === signature) {
        return cached.result;
      }

      const result = await evaluateLayer(layer, context, signature);
      this.layerCache.set(layer.id, { signature, result });
      return result;
    }));

    const activeLayerIds = new Set(layers.map((layer) => layer.id));
    for (const layerId of this.layerCache.keys()) {
      if (!activeLayerIds.has(layerId)) {
        this.layerCache.delete(layerId);
      }
    }

    const globalIssues = evaluateGlobalIssues(layers, context);
    const issues = sortIssues([...layerResults.flatMap((result) => result.issues), ...globalIssues]);
    const summaries = layerResults.map((result) => result.summary);
    const categorySummaries = mergeCategorySummaries([
      ...summaries.flatMap((summary) => summary.categorySummaries),
      ...buildCategorySummaries({ issues: globalIssues }),
    ]);
    const signature = stableStringify({
      layerSignatures: summaries.map((summary) => [summary.layerId, summary.signature]),
      issueIds: issues.map((issue) => issue.id),
      categorySummaries: categorySummaries.map((summary) => [summary.category, summary.severity, summary.issueIds]),
      context: {
        comparisonLayerIds: context.comparisonLayerIds,
        sampleWarningAcknowledged: context.sampleWarningAcknowledged,
      },
    });

    if (this.lastSignature === signature && this.lastState) {
      return this.lastState;
    }

    const state: MapScientificQAState = {
      status: overallStatus(issues),
      checkedAt: nowIso(),
      issues,
      layerSummaries: summaries,
      metadata: {
        generatedBy: "MapScientificQA",
        version: MAP_SCIENTIFIC_QA_VERSION,
        signature,
        visibleLayerCount: layers.filter((layer) => layer.visible).length,
        workerLayerCount: summaries.filter((summary) => summary.usedWorker).length,
        issueCounts: issueCounts(issues),
        categoryCounts: categoryCounts(categorySummaries),
        categorySummaries,
      },
    };

    this.lastSignature = signature;
    this.lastState = state;
    return state;
  }

  evaluateSync(layers: OverlayLayerConfig[], context: MapScientificQAContext = {}): MapScientificQAState {
    const previousThreshold = context.workerThresholdFeatures;
    const syncContext: MapScientificQAContext = {
      ...context,
      workerThresholdFeatures: Number.POSITIVE_INFINITY,
    };
    void previousThreshold;

    const layerResults = layers.map((layer) => {
      const signature = buildLayerSignature(layer, syncContext);
      const result = evaluateLayerSync(layer, syncContext, signature);
      return result;
    });
    const globalIssues = evaluateGlobalIssues(layers, syncContext);
    const issues = sortIssues([...layerResults.flatMap((result) => result.issues), ...globalIssues]);
    const summaries = layerResults.map((result) => result.summary);
    const categorySummaries = mergeCategorySummaries([
      ...summaries.flatMap((summary) => summary.categorySummaries),
      ...buildCategorySummaries({ issues: globalIssues }),
    ]);
    const signature = stableStringify({
      layerSignatures: summaries.map((summary) => [summary.layerId, summary.signature]),
      issueIds: issues.map((issue) => issue.id),
      categorySummaries: categorySummaries.map((summary) => [summary.category, summary.severity, summary.issueIds]),
      context: {
        comparisonLayerIds: syncContext.comparisonLayerIds,
        sampleWarningAcknowledged: syncContext.sampleWarningAcknowledged,
      },
    });

    return {
      status: overallStatus(issues),
      checkedAt: nowIso(),
      issues,
      layerSummaries: summaries,
      metadata: {
        generatedBy: "MapScientificQA",
        version: MAP_SCIENTIFIC_QA_VERSION,
        signature,
        visibleLayerCount: layers.filter((layer) => layer.visible).length,
        workerLayerCount: 0,
        issueCounts: issueCounts(issues),
        categoryCounts: categoryCounts(categorySummaries),
        categorySummaries,
      },
    };
  }
}

function evaluateLayerSync(
  layer: OverlayLayerConfig,
  context: MapScientificQAContext,
  signature: string,
): LayerEvaluationResult {
  const issues: MapScientificQAIssue[] = [];
  const crs = resolveLayerCrs(layer);
  addMetadataIssues(layer, issues);

  const collection = asFeatureCollection(layer.sourceData);
  const geometryResult = collection
    ? runMapScientificQAGeometryChecks({
        layerId: layer.id,
        layerName: layer.name,
        featureCollection: collection,
        crs,
      })
    : null;

  if (geometryResult) {
    issues.push(...geometryResult.issues);
  }

  const geometryFamilies = geometryResult?.geometryFamilies
    ?? (layer.metadata?.geometryType ? [geometryFamilyFromMetadata(layer.metadata.geometryType)] : ["unknown"]);
  addGeometryTypeIssues(layer, geometryFamilies, context, issues);
  addScaleIssues(layer, geometryResult, context, issues);

  const status = issueStatus(issues);
  const checkedAt = nowIso();
  const categorySummaries = buildCategorySummaries({
    issues,
    layer,
    geometryResult,
    geometryFamilies,
  });
  const summaryBase: Omit<LayerScientificQASummary, "metadata"> = {
    layerId: layer.id,
    layerName: layer.name,
    status,
    issueIds: issues.map((issue) => issue.id),
    badges: badgesFromIssues(layer, issues),
    caveats: caveatsFromIssues(issues),
    featureIssueCount: countFeatureIssues(issues),
    usedWorker: false,
    checkedAt,
    signature,
    geometryFamilies,
    vertexCount: geometryResult?.vertexCount ?? 0,
    featureCount: geometryResult?.featureCount ?? layer.metadata?.featureCount ?? 0,
    categorySummaries,
  };
  return {
    issues,
    summary: {
      ...summaryBase,
      metadata: buildLayerMetadata(summaryBase),
    },
  };
}

const defaultScientificQAEngine = new MapScientificQAEngine();

export async function evaluateMapScientificQA(
  layers: OverlayLayerConfig[],
  context: MapScientificQAContext = {},
): Promise<MapScientificQAState> {
  return defaultScientificQAEngine.evaluate(layers, context);
}

export function evaluateMapScientificQASync(
  layers: OverlayLayerConfig[],
  context: MapScientificQAContext = {},
): MapScientificQAState {
  return defaultScientificQAEngine.evaluateSync(layers, context);
}

export function evaluateAnalysisQAGate(
  qaState: MapScientificQAState | null,
  input: {
    layerIds: string[];
    requiredGeometryTypes?: MapScientificQAGeometryFamily[];
    workflowLabel?: string;
  },
): MapScientificQAGateResult {
  if (!qaState || input.layerIds.length === 0) {
    return {
      blocked: false,
      title: "QA not blocking",
      message: "No active QA-blocking input layers were supplied.",
      blockingIssueIds: [],
      warningIssueIds: [],
      warnings: [],
    };
  }

  const layerIds = new Set(input.layerIds);
  const summaries = qaState.layerSummaries.filter((summary) => layerIds.has(summary.layerId));
  const relatedIssues = qaState.issues.filter((issue) => !issue.layerId || layerIds.has(issue.layerId));
  const blockingIssueIds = relatedIssues
    .filter((issue) => issue.severity === "blocker" || issue.severity === "error")
    .map((issue) => issue.id);
  const warningIssues = relatedIssues.filter((issue) => issue.severity === "warning");
  const warnings = warningIssues.map((issue) => `${issue.title}: ${issue.explanation}`);

  const required = input.requiredGeometryTypes;
  if (required?.length) {
    for (const summary of summaries) {
      const compatible = summary.geometryFamilies.some((family) =>
        family === "mixed" || required.includes(family),
      );
      if (!compatible) {
        blockingIssueIds.push(`geometry-family:${summary.layerId}`);
      }
    }
  }

  const blocked = blockingIssueIds.length > 0 || summaries.some((summary) => summary.status === "error");
  const workflowLabel = input.workflowLabel ?? "analysis";
  return {
    blocked,
    title: blocked ? "QA blocked analysis dispatch" : "QA warnings available",
    message: blocked
      ? `${workflowLabel} cannot run until blocking QA issues on the selected input layer(s) are resolved.`
      : warnings.length > 0
        ? `${workflowLabel} can run, but QA warnings should be reviewed.`
        : `${workflowLabel} inputs passed blocking QA checks.`,
    blockingIssueIds: Array.from(new Set(blockingIssueIds)),
    warningIssueIds: warningIssues.map((issue) => issue.id),
    warnings,
  };
}
