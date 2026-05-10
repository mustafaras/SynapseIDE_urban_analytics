import type { Feature, FeatureCollection, Geometry } from "geojson";
import type {
  LayerSourceKind,
  OverlayLayerConfig,
  OverlaySourceData,
} from "@/centerpanel/components/map/mapTypes";
import { queryToSQL, isSafeSQL } from "@/engine/geoai/nlp/QueryToSQL";
import type { GeneratedSQL, QueryIntent } from "@/engine/geoai/nlp/types";
import type { AnalysisAdapterResult } from "./MapEngineAdapter";
import { adaptQueryResult } from "./MapEngineAdapter";
import { buildFeatureCollectionMetadata, getFeatureCollectionBounds, parseInlineGeoJSONSource } from "./MapDataImporter";

export type MapNLQueryScope = "visible" | "selected-aoi" | "current-extent" | "project";
export type MapNLQueryMode = "live" | "demo";
export type MapNLQueryTableKind = "geojson-overlay" | "worker-table";

export interface MapNLQueryLayer {
  id: string;
  name: string;
  tableAlias: string;
  tableKind: MapNLQueryTableKind;
  visible: boolean;
  sourceKind: LayerSourceKind;
  featureCount: number | null;
  geometryType: string;
  geometryColumn: string;
  fields: string[];
  crs: string | null;
  sourceData?: FeatureCollection;
  workerTableName?: string;
}

export interface MapNLUnavailableLayer {
  id: string;
  name: string;
  visible: boolean;
  type: OverlayLayerConfig["type"];
  sourceKind: LayerSourceKind;
  reason: string;
}

export interface MapNLQueryContext {
  scope: MapNLQueryScope;
  mode: MapNLQueryMode;
  scopeLabel: string;
  modeLabel: string;
  queryableLayers: MapNLQueryLayer[];
  unavailableLayers: MapNLUnavailableLayer[];
  selectedAoiFeature: Feature<Geometry> | null;
  currentMapBounds: [number, number, number, number] | null;
  allLayerCount: number;
}

export interface MapNLQueryPreview {
  id: string;
  request: string;
  scope: MapNLQueryScope;
  mode: MapNLQueryMode;
  scopeLabel: string;
  modeLabel: string;
  sql: string;
  predicate: string;
  expectedOutputType: string;
  generated: GeneratedSQL;
  sourceLayers: MapNLQueryLayer[];
  unavailableLayers: MapNLUnavailableLayer[];
  warnings: string[];
  blockers: string[];
  canRun: boolean;
  copyText: string;
}

export interface MapNLQueryRuntime {
  loadGeoJSON: (tableName: string, geojson: FeatureCollection) => Promise<void>;
  bindTableAlias: (alias: string, sourceTable: string) => Promise<void>;
  toGeoJSON: (sql: string) => Promise<FeatureCollection>;
}

export interface MapNLQueryExecutionResult {
  adapterResult: AnalysisAdapterResult;
  layer: OverlayLayerConfig;
  featureCollection: FeatureCollection;
  featureCount: number;
  geometryType: string;
  elapsedMs: number;
  followUpSuggestions: string[];
}

export interface BuildMapNLQueryContextOptions {
  scope?: MapNLQueryScope;
  mode?: MapNLQueryMode;
  selectedAoiFeature?: Feature<Geometry> | null;
  currentMapBounds?: [number, number, number, number] | null;
}

const DEFAULT_LIMIT = 500;
const SAFE_ALIAS_RE = /^[a-z_][a-z0-9_]*$/;

const SCOPE_LABELS: Record<MapNLQueryScope, string> = {
  visible: "Visible layers",
  "selected-aoi": "Selected AOI",
  "current-extent": "Current map extent",
  project: "Full project dataset",
};

const MODE_LABELS: Record<MapNLQueryMode, string> = {
  live: "Live project data",
  demo: "Explicit demo data",
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "area",
  "current",
  "data",
  "dataset",
  "find",
  "filter",
  "highlight",
  "in",
  "inside",
  "layer",
  "layers",
  "map",
  "of",
  "show",
  "that",
  "the",
  "this",
  "to",
  "with",
]);

function nowIso(): string {
  return new Date().toISOString();
}

function escapeSqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function sanitizeMapNLTableAlias(value: string, fallback = "layer"): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const alias = cleaned.length > 0 ? cleaned : fallback;
  const prefixed = /^[a-z_]/.test(alias) ? alias : `l_${alias}`;
  return SAFE_ALIAS_RE.test(prefixed) ? prefixed : fallback;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9.%<>= ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function resolveLayerSourceKind(layer: OverlayLayerConfig): LayerSourceKind {
  if (layer.sourceKind) return layer.sourceKind;
  if ((layer.group ?? "data") === "analysis" || layer.metadata?.analysisResult) return "derived";
  if (layer.metadata?.eoSource?.isDemo || layer.metadata?.datasetContext?.datasetId) return "demo";
  if (layer.metadata?.eoSource || (typeof layer.sourceData === "string" && /^https?:\/\//i.test(layer.sourceData))) return "external";
  if (layer.sourceData) return "imported";
  return "project";
}

function isLayerInScope(layer: OverlayLayerConfig, sourceKind: LayerSourceKind, scope: MapNLQueryScope): boolean {
  if (scope === "project") {
    return sourceKind !== "external" || layer.visible;
  }
  return layer.visible;
}

function isLivePermittedSource(sourceKind: LayerSourceKind): boolean {
  return sourceKind === "project" || sourceKind === "imported" || sourceKind === "derived";
}

function isDemoPermittedSource(sourceKind: LayerSourceKind): boolean {
  return sourceKind === "demo";
}

function asFeatureCollection(sourceData: OverlaySourceData | undefined): FeatureCollection | null {
  if (!sourceData) return null;
  if (typeof sourceData === "string") {
    try {
      return parseInlineGeoJSONSource(sourceData);
    } catch {
      return null;
    }
  }
  if (sourceData.type === "FeatureCollection") return sourceData;
  if (sourceData.type === "Feature") {
    return { type: "FeatureCollection", features: [sourceData] };
  }
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: {}, geometry: sourceData }],
  };
}

function collectLayerFields(layer: OverlayLayerConfig, featureCollection: FeatureCollection | null): string[] {
  const fields = new Set(layer.metadata?.fields ?? []);
  featureCollection?.features.slice(0, 25).forEach((feature) => {
    Object.keys(feature.properties ?? {}).forEach((field) => fields.add(field));
  });
  return Array.from(fields).sort((left, right) => left.localeCompare(right));
}

function resolveGeometryType(layer: OverlayLayerConfig, featureCollection: FeatureCollection | null): string {
  const fromMetadata = layer.metadata?.geometryType;
  if (fromMetadata && fromMetadata.trim().length > 0) return fromMetadata;
  if (!featureCollection) return "Unknown";
  return buildFeatureCollectionMetadata(featureCollection).geometryType ?? "Unknown";
}

function resolveCrs(layer: OverlayLayerConfig): string | null {
  const value =
    layer.metadata?.datasetContext?.crs ??
    layer.metadata?.columnar?.crs ??
    layer.metadata?.eoSource?.crs ??
    layer.metadata?.externalService?.crs;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function makeUnavailableLayer(
  layer: OverlayLayerConfig,
  sourceKind: LayerSourceKind,
  reason: string,
): MapNLUnavailableLayer {
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    type: layer.type,
    sourceKind,
    reason,
  };
}

function classifyQueryableLayer(
  layer: OverlayLayerConfig,
  scope: MapNLQueryScope,
  mode: MapNLQueryMode,
  aliases: Map<string, number>,
): { queryable?: MapNLQueryLayer; unavailable?: MapNLUnavailableLayer } {
  const sourceKind = resolveLayerSourceKind(layer);
  if (!isLayerInScope(layer, sourceKind, scope)) {
    return { unavailable: makeUnavailableLayer(layer, sourceKind, "Outside the selected query scope.") };
  }
  if (layer.queryable === false) {
    return { unavailable: makeUnavailableLayer(layer, sourceKind, "Layer is marked non-queryable.") };
  }
  if (mode === "live" && !isLivePermittedSource(sourceKind)) {
    return {
      unavailable: makeUnavailableLayer(
        layer,
        sourceKind,
        sourceKind === "demo"
          ? "Demo/sample layers are excluded from live execution. Switch to Demo mode explicitly."
          : "External service layers are not executed by the live NL-to-SQL sandbox.",
      ),
    };
  }
  if (mode === "demo" && !isDemoPermittedSource(sourceKind)) {
    return {
      unavailable: makeUnavailableLayer(layer, sourceKind, "Demo mode only executes explicitly marked sample/demo layers."),
    };
  }
  if (layer.type !== "geojson" && layer.type !== "heatmap") {
    return { unavailable: makeUnavailableLayer(layer, sourceKind, "Only GeoJSON overlays and worker-backed spatial tables can be queried.") };
  }

  const workerTableName = layer.metadata?.columnar?.workerTableName;
  const featureCollection = asFeatureCollection(layer.sourceData);
  if (!featureCollection && !workerTableName) {
    return {
      unavailable: makeUnavailableLayer(
        layer,
        sourceKind,
        typeof layer.sourceData === "string"
          ? "Remote URL sources are listed but not executed without an imported worker table."
          : "Missing prerequisite: layer needs inline GeoJSON or a worker-backed spatial table.",
      ),
    };
  }

  const baseAlias = sanitizeMapNLTableAlias(layer.name || layer.id);
  const seen = aliases.get(baseAlias) ?? 0;
  aliases.set(baseAlias, seen + 1);
  const tableAlias = seen === 0 ? baseAlias : `${baseAlias}_${seen + 1}`;
  const geometryColumn = layer.metadata?.columnar?.geometryColumn?.trim() || "geometry";
  const fields = collectLayerFields(layer, featureCollection);
  const featureCount = layer.metadata?.featureCount ?? featureCollection?.features.length ?? layer.metadata?.columnar?.rowCount ?? null;
  const queryable: MapNLQueryLayer = {
    id: layer.id,
    name: layer.name,
    tableAlias,
    tableKind: workerTableName ? "worker-table" : "geojson-overlay",
    visible: layer.visible,
    sourceKind,
    featureCount,
    geometryType: resolveGeometryType(layer, featureCollection),
    geometryColumn,
    fields,
    crs: resolveCrs(layer),
    ...(featureCollection ? { sourceData: featureCollection } : {}),
    ...(workerTableName ? { workerTableName } : {}),
  };
  return { queryable };
}

export function buildMapNLQueryContext(
  layers: OverlayLayerConfig[],
  options: BuildMapNLQueryContextOptions = {},
): MapNLQueryContext {
  const scope = options.scope ?? "visible";
  const mode = options.mode ?? "live";
  const aliases = new Map<string, number>();
  const queryableLayers: MapNLQueryLayer[] = [];
  const unavailableLayers: MapNLUnavailableLayer[] = [];

  layers.forEach((layer) => {
    const result = classifyQueryableLayer(layer, scope, mode, aliases);
    if (result.queryable) queryableLayers.push(result.queryable);
    if (result.unavailable) unavailableLayers.push(result.unavailable);
  });

  return {
    scope,
    mode,
    scopeLabel: SCOPE_LABELS[scope],
    modeLabel: MODE_LABELS[mode],
    queryableLayers,
    unavailableLayers,
    selectedAoiFeature: options.selectedAoiFeature ?? null,
    currentMapBounds: options.currentMapBounds ?? null,
    allLayerCount: layers.length,
  };
}

function scoreLayerForText(layer: MapNLQueryLayer, requestText: string, referencedLayers: string[]): number {
  const haystack = `${normalizeSearchText(layer.name)} ${normalizeSearchText(layer.tableAlias)} ${layer.fields.map(normalizeSearchText).join(" ")}`;
  const layerTokens = tokenize(`${layer.name} ${layer.tableAlias}`);
  const requestTokens = new Set(tokenize(requestText));
  let score = 0;

  for (const ref of referencedLayers) {
    const normalizedRef = normalizeSearchText(ref);
    if (normalizedRef && (haystack.includes(normalizedRef) || normalizeSearchText(layer.tableAlias) === normalizedRef)) {
      score += 8;
    }
  }
  for (const token of layerTokens) {
    if (requestTokens.has(token) || requestTokens.has(token.replace(/s$/, ""))) {
      score += 2;
    }
  }
  if (requestText.includes(normalizeSearchText(layer.name))) score += 4;
  return score;
}

function selectSourceLayers(
  request: string,
  layers: MapNLQueryLayer[],
  generated: GeneratedSQL,
  desiredCount: number,
): { selected: MapNLQueryLayer[]; warnings: string[] } {
  const warnings: string[] = [];
  const requestText = normalizeSearchText(request);
  const scored = layers
    .map((layer, index) => ({
      layer,
      index,
      score: scoreLayerForText(layer, requestText, generated.referencedLayers),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const selected = scored
    .filter((entry) => entry.score > 0)
    .slice(0, desiredCount)
    .map((entry) => entry.layer);

  if (selected.length < desiredCount) {
    const fallback = layers.filter((layer) => !selected.some((entry) => entry.id === layer.id)).slice(0, desiredCount - selected.length);
    selected.push(...fallback);
    if (fallback.length > 0) {
      warnings.push("Some source layers were selected by map order because the request did not name enough available layers.");
    }
  }

  return { selected, warnings };
}

function geometryExpression(alias: string, layer: MapNLQueryLayer): string {
  return `${alias}.${quoteIdent(layer.geometryColumn)}`;
}

function projectionForLayer(alias: string, layer: MapNLQueryLayer): string {
  if (layer.geometryColumn === "geometry") {
    return `${alias}.*`;
  }
  return `${geometryExpression(alias, layer)} AS geometry, ${alias}.* EXCLUDE (${quoteIdent(layer.geometryColumn)})`;
}

function findField(layer: MapNLQueryLayer, request: string, candidates: string[]): string | null {
  const requestText = normalizeSearchText(request);
  const fields = layer.fields.length > 0 ? layer.fields : candidates;
  for (const field of fields) {
    const normalized = normalizeSearchText(field);
    if (normalized && requestText.includes(normalized)) return field;
  }
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeSearchText(candidate);
    const field = fields.find((entry) => normalizeSearchText(entry).includes(normalizedCandidate));
    if (field) return field;
  }
  return fields[0] ?? null;
}

function extractDistanceMetres(generated: GeneratedSQL): number {
  return generated.interpretation.distancesDetected[0]?.metres ?? 500;
}

function extractThreshold(request: string): { operator: ">=" | "<=" | ">" | "<"; value: number; raw: string } | null {
  const direct = request.match(/\b(above|over|greater than|more than|at least|>=|>|below|under|less than|at most|<=|<)\s*(\d+(?:\.\d+)?)\s*(%)?/i);
  if (!direct) return null;
  const word = direct[1].toLowerCase();
  const rawNumber = Number.parseFloat(direct[2]);
  if (!Number.isFinite(rawNumber)) return null;
  const operator = word === "below" || word === "under" || word === "less than" || word === "at most" || word === "<=" || word === "<"
    ? word === "<" ? "<" : "<="
    : word === ">" ? ">" : ">=";
  const value = direct[3] === "%" && rawNumber > 1 ? rawNumber / 100 : rawNumber;
  return { operator, value, raw: direct[0] };
}

function buildScopeGeometry(context: MapNLQueryContext): Feature<Geometry> | null {
  if (context.scope === "selected-aoi") {
    return context.selectedAoiFeature;
  }
  if (context.scope === "current-extent" && context.currentMapBounds) {
    const [west, south, east, north] = context.currentMapBounds;
    return {
      type: "Feature",
      properties: { scope: "current-map-extent" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ]],
      },
    };
  }
  return null;
}

function buildScopePredicate(context: MapNLQueryContext, alias: string, layer: MapNLQueryLayer): string | null {
  const scopeGeometry = buildScopeGeometry(context);
  if (!scopeGeometry) return null;
  const literal = `ST_GeomFromGeoJSON(${escapeSqlString(JSON.stringify(scopeGeometry.geometry))})`;
  return `ST_Intersects(${geometryExpression(alias, layer)}, ${literal})`;
}

function buildWhereClause(parts: Array<string | null>): string {
  const filters = parts.filter((part): part is string => Boolean(part && part.trim().length > 0));
  return filters.length > 0 ? `\nWHERE ${filters.join("\n  AND ")}` : "";
}

function buildSingleLayerSQL(args: {
  request: string;
  layer: MapNLQueryLayer;
  generated: GeneratedSQL;
  context: MapNLQueryContext;
}): { sql: string; predicate: string; spatialFunctions: string[] } {
  const alias = "a";
  const threshold = extractThreshold(args.request);
  const confidenceField = findField(args.layer, args.request, ["confidence", "probability", "score"]);
  const densityField = findField(args.layer, args.request, ["density", "population_density", "pop_density"]);
  const treeField = findField(args.layer, args.request, ["tree_cover", "tree_canopy", "tree_canopy_pct", "canopy"]);
  const attributeField = confidenceField ?? findField(args.layer, args.request, args.generated.interpretation.recognisedAttributes);
  const whereParts = [buildScopePredicate(args.context, alias, args.layer)];
  const orderParts: string[] = [];
  const predicateParts: string[] = [];

  if (threshold && attributeField) {
    whereParts.push(`TRY_CAST(${alias}.${quoteIdent(attributeField)} AS DOUBLE) ${threshold.operator} ${threshold.value}`);
    predicateParts.push(`${attributeField} ${threshold.operator} ${threshold.value}`);
  } else if (normalizeSearchText(args.request).includes("high") && densityField) {
    whereParts.push(`TRY_CAST(${alias}.${quoteIdent(densityField)} AS DOUBLE) IS NOT NULL`);
    orderParts.push(`TRY_CAST(${alias}.${quoteIdent(densityField)} AS DOUBLE) DESC`);
    predicateParts.push(`rank high ${densityField}`);
  }

  if (normalizeSearchText(args.request).includes("low") && treeField && treeField !== densityField) {
    whereParts.push(`TRY_CAST(${alias}.${quoteIdent(treeField)} AS DOUBLE) IS NOT NULL`);
    orderParts.push(`TRY_CAST(${alias}.${quoteIdent(treeField)} AS DOUBLE) ASC`);
    predicateParts.push(`rank low ${treeField}`);
  }

  const orderClause = orderParts.length > 0 ? `\nORDER BY ${orderParts.join(", ")}` : "";
  const sql = [
    `SELECT ${projectionForLayer(alias, args.layer)}`,
    `FROM ${args.layer.tableAlias} ${alias}${buildWhereClause(whereParts)}${orderClause}`,
    `LIMIT ${DEFAULT_LIMIT}`,
  ].join("\n");
  return {
    sql,
    predicate: predicateParts.length > 0 ? predicateParts.join("; ") : `Select features from ${args.layer.name}`,
    spatialFunctions: whereParts[0] ? ["ST_Intersects"] : [],
  };
}

function buildTwoLayerSQL(args: {
  primary: MapNLQueryLayer;
  secondary: MapNLQueryLayer;
  generated: GeneratedSQL;
  context: MapNLQueryContext;
  request: string;
}): { sql: string; predicate: string; spatialFunctions: string[] } {
  const intent = args.generated.parse.intent;
  const requestText = normalizeSearchText(args.request);
  const distance = extractDistanceMetres(args.generated);
  const primaryGeom = geometryExpression("a", args.primary);
  const secondaryGeom = geometryExpression("b", args.secondary);
  const scopePredicate = buildScopePredicate(args.context, "a", args.primary);

  if (intent === "proximity" || requestText.includes("within") || requestText.includes("near")) {
    const sql = [
      `SELECT ${projectionForLayer("a", args.primary)},`,
      `       ST_Distance(${primaryGeom}, ${secondaryGeom}) AS distance_m`,
      `FROM ${args.primary.tableAlias} a`,
      `JOIN ${args.secondary.tableAlias} b ON ST_DWithin(${primaryGeom}, ${secondaryGeom}, ${distance})${buildWhereClause([scopePredicate])}`,
      `ORDER BY distance_m`,
      `LIMIT ${DEFAULT_LIMIT}`,
    ].join("\n");
    return {
      sql,
      predicate: `${args.primary.name} within ${distance} metres of ${args.secondary.name}`,
      spatialFunctions: scopePredicate ? ["ST_DWithin", "ST_Distance", "ST_Intersects"] : ["ST_DWithin", "ST_Distance"],
    };
  }

  const relation = intent === "containment" || requestText.includes("inside") ? "ST_Within" : "ST_Intersects";
  const sql = [
    `SELECT ${projectionForLayer("a", args.primary)}`,
    `FROM ${args.primary.tableAlias} a`,
    `JOIN ${args.secondary.tableAlias} b ON ${relation}(${primaryGeom}, ${secondaryGeom})${buildWhereClause([scopePredicate])}`,
    `LIMIT ${DEFAULT_LIMIT}`,
  ].join("\n");
  return {
    sql,
    predicate: `${relation} between ${args.primary.name} and ${args.secondary.name}`,
    spatialFunctions: scopePredicate ? [relation, "ST_Intersects"] : [relation],
  };
}

function requiredLayerCount(intent: QueryIntent, request: string): number {
  const text = normalizeSearchText(request);
  if (intent === "proximity" || intent === "spatial_join" || intent === "containment") return 2;
  if (text.includes("compare") || text.includes("intersect") || text.includes("overlay")) return 2;
  return 1;
}

function buildPreviewId(request: string, context: MapNLQueryContext): string {
  const seed = `${context.mode}:${context.scope}:${request}:${context.queryableLayers.map((layer) => layer.id).join(",")}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `map-nl-query-${(hash >>> 0).toString(16)}`;
}

function buildCopyText(preview: Pick<MapNLQueryPreview, "request" | "modeLabel" | "scopeLabel" | "sourceLayers" | "sql">): string {
  return [
    `Request: ${preview.request}`,
    `Mode: ${preview.modeLabel}`,
    `Scope: ${preview.scopeLabel}`,
    `Sources: ${preview.sourceLayers.map((layer) => `${layer.name} (${layer.tableAlias})`).join(", ") || "none"}`,
    "",
    preview.sql,
  ].join("\n");
}

export function generateMapNLQueryPreview(
  request: string,
  context: MapNLQueryContext,
): MapNLQueryPreview {
  const trimmedRequest = request.trim();
  const rawGenerated = queryToSQL(trimmedRequest || "show visible layers", { maxResultLimit: DEFAULT_LIMIT });
  const warnings = [...rawGenerated.parse.warnings];
  const blockers: string[] = [];

  if (trimmedRequest.length === 0) {
    blockers.push("Enter a natural-language map question before generating SQL.");
  }
  if (context.scope === "selected-aoi" && !context.selectedAoiFeature) {
    blockers.push("Selected AOI scope requires a drawn polygon AOI.");
  }
  if (context.scope === "current-extent" && !context.currentMapBounds) {
    blockers.push("Current extent scope requires an active map viewport.");
  }
  if (context.queryableLayers.length === 0) {
    blockers.push(context.mode === "demo"
      ? "Missing prerequisite: add an explicitly marked demo/sample layer for execution."
      : "Missing prerequisite: add a live queryable project overlay or worker-backed spatial table.");
  }
  const rawInputAccepted = rawGenerated.safe || rawGenerated.sql.trim().length > 0;
  if (!rawInputAccepted && rawGenerated.rejectionReason) {
    blockers.push(rawGenerated.rejectionReason);
  } else if (!rawGenerated.safe && rawGenerated.rejectionReason) {
    warnings.push(rawGenerated.rejectionReason);
  }

  const desiredCount = Math.min(requiredLayerCount(rawGenerated.parse.intent, trimmedRequest), context.queryableLayers.length);
  const selection = selectSourceLayers(trimmedRequest, context.queryableLayers, rawGenerated, Math.max(1, desiredCount));
  warnings.push(...selection.warnings);
  const sourceLayers = selection.selected.slice(0, Math.max(1, desiredCount));

  let sql = "";
  let predicate = "No executable predicate generated.";
  let spatialFunctions: string[] = [];
  if (sourceLayers.length >= 2 && desiredCount >= 2) {
    const built = buildTwoLayerSQL({
      primary: sourceLayers[0]!,
      secondary: sourceLayers[1]!,
      generated: rawGenerated,
      context,
      request: trimmedRequest,
    });
    sql = built.sql;
    predicate = built.predicate;
    spatialFunctions = built.spatialFunctions;
  } else if (sourceLayers.length >= 1) {
    const built = buildSingleLayerSQL({
      request: trimmedRequest,
      layer: sourceLayers[0]!,
      generated: rawGenerated,
      context,
    });
    sql = built.sql;
    predicate = built.predicate;
    spatialFunctions = built.spatialFunctions;
  }

  if (desiredCount >= 2 && sourceLayers.length < 2) {
    blockers.push("This request needs two source layers, but only one queryable layer is available in the selected scope.");
  }

  const safety = sql
    ? isSafeSQL(sql, { allowedTables: context.queryableLayers.map((layer) => layer.tableAlias), maxResultLimit: DEFAULT_LIMIT, allowSubqueries: false })
    : { safe: false, reason: "No SQL was generated." };
  if (!safety.safe && safety.reason) {
    blockers.push(safety.reason);
  }

  const generated: GeneratedSQL = {
    ...rawGenerated,
    sql,
    safe: rawInputAccepted && safety.safe,
    referencedLayers: sourceLayers.map((layer) => layer.tableAlias),
    spatialFunctions,
    interpretation: {
      ...rawGenerated.interpretation,
      recognisedLayers: sourceLayers.map((layer) => layer.name),
    },
    ...(!rawInputAccepted && rawGenerated.rejectionReason ? { rejectionReason: rawGenerated.rejectionReason } : {}),
    ...(rawInputAccepted && !safety.safe && safety.reason ? { rejectionReason: safety.reason } : {}),
  };

  const expectedOutputType = sourceLayers[0]?.geometryType ?? "Unknown";
  const previewBase = {
    id: buildPreviewId(trimmedRequest, context),
    request: trimmedRequest,
    scope: context.scope,
    mode: context.mode,
    scopeLabel: context.scopeLabel,
    modeLabel: context.modeLabel,
    sql,
    predicate,
    expectedOutputType,
    generated,
    sourceLayers,
    unavailableLayers: context.unavailableLayers,
    warnings: Array.from(new Set(warnings.filter((warning) => warning.trim().length > 0))),
    blockers: Array.from(new Set(blockers.filter((blocker) => blocker.trim().length > 0))),
  };
  const canRun = previewBase.blockers.length === 0 && generated.safe && sourceLayers.length > 0;
  return {
    ...previewBase,
    canRun,
    copyText: buildCopyText(previewBase),
  };
}

async function prepareRuntimeTables(preview: MapNLQueryPreview, runtime: MapNLQueryRuntime): Promise<void> {
  for (const layer of preview.sourceLayers) {
    if (layer.tableKind === "worker-table" && layer.workerTableName) {
      await runtime.bindTableAlias(layer.tableAlias, layer.workerTableName);
    } else if (layer.sourceData) {
      await runtime.loadGeoJSON(layer.tableAlias, layer.sourceData);
    } else {
      throw new Error(`Layer "${layer.name}" has no executable source table.`);
    }
  }
}

function executionScopeForPreview(preview: MapNLQueryPreview): "live-project-data" | "imported-worker-spatial-table" | "explicit-demo-data" {
  if (preview.mode === "demo") return "explicit-demo-data";
  if (preview.sourceLayers.every((layer) => layer.tableKind === "worker-table")) return "imported-worker-spatial-table";
  return "live-project-data";
}

export function buildMapNLFollowUpSuggestions(featureCount: number, geometryType: string): string[] {
  const type = geometryType.toLowerCase();
  if (featureCount === 0) {
    return [
      "Broaden the selected scope or relax the threshold.",
      "Copy the SQL and inspect whether source layer names match the visible map data.",
    ];
  }
  if (type.includes("point")) {
    return [
      "Cluster or heatmap these result points.",
      "Filter again by confidence, category, or distance.",
    ];
  }
  if (type.includes("polygon")) {
    return [
      "Style the result by a numeric field.",
      "Compare the result against zoning, districts, or environmental overlays.",
    ];
  }
  if (type.includes("line")) {
    return [
      "Summarize result length by district.",
      "Buffer selected segments and intersect nearby points of interest.",
    ];
  }
  return [
    "Inspect the attribute table and choose a follow-up filter.",
    "Save the generated SQL with the map result metadata.",
  ];
}

export async function executeMapNLQueryPreview(
  preview: MapNLQueryPreview,
  runtime: MapNLQueryRuntime,
): Promise<MapNLQueryExecutionResult> {
  if (!preview.canRun) {
    throw new Error(preview.blockers[0] ?? "The query preview is not executable.");
  }

  await prepareRuntimeTables(preview, runtime);
  const startedAt = performance.now();
  const featureCollection = await runtime.toGeoJSON(preview.sql);
  const elapsedMs = performance.now() - startedAt;
  const metadata = buildFeatureCollectionMetadata(featureCollection);
  const adapterResult = adaptQueryResult({
    featureCollection,
    result: preview.generated,
    queryText: preview.request,
    executionScope: executionScopeForPreview(preview),
    layerName: preview.request.slice(0, 72) || "Map scoped query",
    sourceLayerIds: preview.sourceLayers.map((layer) => layer.id),
    sourceTableIds: preview.sourceLayers.map((layer) => layer.tableAlias),
    runTimestamp: nowIso(),
    parameters: {
      request: preview.request,
      sql: preview.sql,
      predicate: preview.predicate,
      scope: preview.scope,
      scopeLabel: preview.scopeLabel,
      mode: preview.mode,
      modeLabel: preview.modeLabel,
      sourceLayerIds: preview.sourceLayers.map((layer) => layer.id),
      sourceTables: preview.sourceLayers.map((layer) => layer.tableAlias),
      unavailableLayerCount: preview.unavailableLayers.length,
      elapsedMs: Math.round(elapsedMs),
    },
    provenance: {
      label: `Map NL Query · ${preview.modeLabel} · ${preview.scopeLabel}`,
      method: "Deterministic map-scoped NL-to-SQL preview executed after analyst review.",
      generatedAt: nowIso(),
      sourceLayerIds: preview.sourceLayers.map((layer) => layer.id),
      notes: [
        `Predicate: ${preview.predicate}`,
        `SQL copied from inspected preview: ${preview.sql}`,
      ],
    },
  });

  const resultBounds = getFeatureCollectionBounds(featureCollection);
  const layer: OverlayLayerConfig = {
    ...adapterResult.layer,
    name: `NL Query: ${preview.request.slice(0, 48) || "Map result"}`,
    metadata: {
      ...(adapterResult.layer.metadata ?? {}),
      ...(typeof metadata.featureCount === "number" ? { featureCount: metadata.featureCount } : {}),
      ...(metadata.geometryType ? { geometryType: metadata.geometryType } : {}),
      ...(metadata.fields ? { fields: metadata.fields } : {}),
      ...(resultBounds ? { bounds: resultBounds } : {}),
    },
  };
  const finalAdapterResult: AnalysisAdapterResult = {
    ...adapterResult,
    layer,
  };
  const geometryType = metadata.geometryType ?? preview.expectedOutputType;

  return {
    adapterResult: finalAdapterResult,
    layer,
    featureCollection,
    featureCount: featureCollection.features.length,
    geometryType,
    elapsedMs,
    followUpSuggestions: buildMapNLFollowUpSuggestions(featureCollection.features.length, geometryType),
  };
}
