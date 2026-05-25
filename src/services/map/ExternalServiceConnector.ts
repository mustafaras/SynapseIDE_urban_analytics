import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  LineString,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";
import { loadCityJSON } from "@/features/urbanAnalytics/voxcity/CityJSONLoader";
import type { CityJSONLoadResult } from "@/features/urbanAnalytics/voxcity/cityJsonTypes";
import type {
  ExternalServiceLayerMetadata,
  LayerCrsSummary,
  LayerLicenseAttributionSummary,
  LayerScientificQAMetadata,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import { withNormalizedLayerRegistryMetadata } from "@/centerpanel/components/map/mapLayerMetadata";
import { buildFeatureCollectionMetadata } from "./MapDataImporter";
import {
  normalizeXyzTileUrlTemplate,
  STAMEN_WATERCOLOR_TILE_URL,
} from "./ExternalTileUrlTemplates";

export { normalizeXyzTileUrlTemplate, STAMEN_WATERCOLOR_TILE_URL } from "./ExternalTileUrlTemplates";

export const EXTERNAL_SERVICE_TIMEOUT_MS = 10_000;
export const OVERPASS_MAX_AREA_KM2 = 4;
export const OVERPASS_CACHE_TTL_MS = 10 * 60 * 1000;
export const OSM_BUILDING_PROVENANCE = "OpenStreetMap contributors — © ODbL";

const PROJECT_CLIENT_LABEL = "SynapseCore Urban Analytics Workbench/1.0";
const DEFAULT_OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

export type ExternalServiceKind = "wms" | "wmts" | "wfs" | "xyz" | "overpass" | "cityjson";

export interface UrlValidationResult {
  ok: boolean;
  url?: URL;
  error?: string;
  warnings: string[];
}

export interface ExternalFetchOptions {
  timeoutMs?: number;
  accept?: string;
  attribution?: string;
  signal?: AbortSignal;
}

export class ExternalServiceError extends Error {
  readonly code: "invalid-url" | "timeout" | "cors" | "http" | "parse" | "empty";

  constructor(code: ExternalServiceError["code"], message: string) {
    super(message);
    this.name = "ExternalServiceError";
    this.code = code;
  }
}

export interface ExternalLayerInfo {
  name: string;
  title: string;
  abstract?: string;
  availableCrs: string[];
  formats?: string[];
  defaultStyle?: string;
  resourceTemplate?: string;
  tileMatrixSets?: WmtsTileMatrixSetInfo[];
}

export interface WmtsTileMatrixSetInfo {
  id: string;
  supportedCrs: string;
  tileMatrixIds: string[];
  tileMatrixTemplate: string;
}

export interface WmsCapabilities {
  serviceType: "wms" | "wmts";
  version: string;
  endpoint: string;
  title: string;
  layers: ExternalLayerInfo[];
}

export interface WfsCapabilities {
  version: string;
  endpoint: string;
  title: string;
  featureTypes: ExternalLayerInfo[];
}

export interface XyzPreset {
  id: string;
  name: string;
  urlTemplate: string;
  attribution: string;
}

export interface OverpassBoundsResult {
  requestedBounds: [number, number, number, number];
  clampedBounds: [number, number, number, number];
  areaKm2: number;
  wasClamped: boolean;
  cacheKey: string;
}

export interface OverpassBuildingsResult {
  featureCollection: FeatureCollection<Polygon | MultiPolygon, GeoJsonProperties>;
  requestedBounds: [number, number, number, number];
  clampedBounds: [number, number, number, number];
  areaKm2: number;
  wasClamped: boolean;
  cacheKey: string;
  cacheHit: boolean;
  fetchedAt: string;
  endpoint?: string;
  provenance: string;
}

interface OverpassCacheEntry {
  expiresAt: number;
  result: OverpassBuildingsResult;
}

interface OverpassGeometryPoint {
  lat: number;
  lon: number;
}

interface OverpassMember {
  type: string;
  ref: number;
  role?: string;
  geometry?: OverpassGeometryPoint[];
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: OverpassGeometryPoint[];
  members?: OverpassMember[];
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

export const XYZ_PRESETS: XyzPreset[] = [
  {
    id: "opentopomap",
    name: "OpenTopoMap",
    urlTemplate: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap",
  },
  {
    id: "stamen-watercolor",
    name: "Stamen Watercolor",
    urlTemplate: STAMEN_WATERCOLOR_TILE_URL,
    attribution: "Map tiles © Stadia Maps, © Stamen Design, © OpenMapTiles, data © OpenStreetMap contributors",
  },
  {
    id: "esri-world-imagery",
    name: "ESRI World Imagery",
    urlTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Source: Esri, Maxar, Earthstar Geographics, and the GIS user community",
  },
];

const overpassCache = new Map<string, OverpassCacheEntry>();

function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

function createLayerId(prefix: string, sourceName: string): string {
  const cleanName = sourceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "layer";
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${cleanName}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${cleanName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEvidenceArtifactId(layerId: string): string {
  return `map-evidence-layer-${layerId.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

function uniqueTextList(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function externalServiceCaveats(input: {
  kind: ExternalServiceKind;
  dependencyStatus?: ExternalServiceLayerMetadata["dependencyStatus"];
  crs?: string;
  cacheHit?: boolean;
  wasClamped?: boolean;
  cityJsonReferenceSystemMissing?: boolean;
  extra?: string[];
}): string[] {
  const caveats: string[] = [];
  caveats.push("External service availability, permissions, CORS policy, and rate limits can change outside this project session.");
  caveats.push("Browser credentials are not embedded in evidence metadata; secured services need explicit review before reuse.");
  if (!input.crs) {
    caveats.push("External layer does not declare a usable CRS; CRS remains unknown until source metadata is verified.");
  }
  if (input.kind === "wms" || input.kind === "wmts" || input.kind === "xyz") {
    caveats.push("Raster tile layers are visual references; feature-level geometry and attributes are not queryable from this layer.");
  }
  if (input.cacheHit) {
    caveats.push("Layer was loaded from the in-browser service cache; refresh before time-sensitive interpretation.");
  }
  if (input.wasClamped) {
    caveats.push("Requested viewport was clamped to protect the external public endpoint; spatial extent differs from the original view.");
  }
  if (input.cityJsonReferenceSystemMissing) {
    caveats.push("CityJSON source did not declare a reference system; CRS metadata is intentionally unknown.");
  }
  if (input.dependencyStatus === "unknown") {
    caveats.push("External service dependency state is unknown until a successful refresh or fetch completes.");
  }
  return uniqueTextList([...caveats, ...(input.extra ?? [])]);
}

function buildExternalServiceMetadata(input: {
  kind: ExternalServiceKind;
  endpoint: string;
  title: string;
  serviceVersion?: string;
  layerName?: string;
  urlTemplate?: string;
  bounds?: [number, number, number, number];
  crs?: string;
  refreshedAt: string;
  dependencyStatus?: ExternalServiceLayerMetadata["dependencyStatus"];
  cacheTtlMs?: number;
  cacheHit?: boolean;
  license?: string;
  attribution?: string;
  caveats: string[];
}): ExternalServiceLayerMetadata {
  return {
    kind: input.kind,
    endpoint: input.endpoint,
    title: input.title,
    ...(input.serviceVersion ? { serviceVersion: input.serviceVersion } : {}),
    ...(input.layerName ? { layerName: input.layerName } : {}),
    ...(input.urlTemplate ? { urlTemplate: input.urlTemplate } : {}),
    ...(input.bounds ? { bounds: input.bounds } : {}),
    ...(input.crs ? { crs: input.crs } : {}),
    refreshedAt: input.refreshedAt,
    dependencyStatus: input.dependencyStatus ?? "live",
    lastRequestAt: input.refreshedAt,
    ...(input.cacheTtlMs != null ? { cacheTtlMs: input.cacheTtlMs } : {}),
    ...(input.cacheHit != null ? { cacheHit: input.cacheHit } : {}),
    staleAt: new Date(new Date(input.refreshedAt).getTime() + (input.cacheTtlMs ?? OVERPASS_CACHE_TTL_MS)).toISOString(),
    credentialMode: "unknown",
    corsMode: input.kind === "wms" || input.kind === "wmts" || input.kind === "xyz" ? "tile-client" : "browser-fetch",
    ...(input.license ? { license: input.license } : {}),
    ...(input.attribution ? { attribution: input.attribution } : {}),
    caveats: input.caveats,
  };
}

function buildExternalCrsSummary(crs: string | undefined, source: LayerCrsSummary["source"], notes: string[]): LayerCrsSummary {
  return crs
    ? { crs, status: "known", source, notes }
    : { crs: null, status: "unknown", source, notes };
}

function buildExternalLicenseAttribution(input: {
  sourceName: string;
  sourceUrl: string;
  license?: string;
  attribution?: string;
}): LayerLicenseAttributionSummary {
  return {
    license: input.license ?? null,
    attribution: input.attribution ?? null,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    requiresAttribution: Boolean(input.attribution || input.license),
    source: "external-service",
    notes: input.license || input.attribution
      ? ["Attribution metadata was copied from the external service or preset declaration."]
      : ["External service did not expose license or attribution metadata; review before publication."],
  };
}

function buildExternalScientificQA(input: {
  layerId: string;
  kind: ExternalServiceKind;
  checkedAt: string;
  queryable: boolean;
  crs?: string;
  hasLicenseOrAttribution: boolean;
  caveats: string[];
  dependencyStatus?: ExternalServiceLayerMetadata["dependencyStatus"];
  cacheHit?: boolean;
}): LayerScientificQAMetadata {
  const issueIds: string[] = [];
  const badges: LayerScientificQAMetadata["badges"] = [];
  if (!input.crs) {
    issueIds.push(`external-crs-unknown-${input.layerId}`);
    badges.push("missing_crs");
  }
  if (!input.hasLicenseOrAttribution) {
    issueIds.push(`external-attribution-unknown-${input.layerId}`);
  }
  if (input.dependencyStatus === "stale" || input.dependencyStatus === "offline" || input.cacheHit) {
    issueIds.push(`external-dependency-review-${input.layerId}`);
    badges.push("stale_result");
  }
  if (input.caveats.length > 0) {
    badges.push("uncertain_output");
  }

  return {
    status: input.dependencyStatus === "offline" ? "error" : issueIds.length > 0 ? "warning" : "passed",
    issueIds,
    badges: Array.from(new Set(badges)),
    checkedAt: input.checkedAt,
    featureIssueCount: 0,
    usedWorker: false,
    caveats: input.caveats,
    categorySummaries: [
      {
        category: "source-provenance",
        severity: input.dependencyStatus === "offline" ? "blocked" : input.dependencyStatus === "stale" || input.cacheHit ? "warning" : "pass",
        issueIds: input.dependencyStatus === "offline" || input.dependencyStatus === "stale" || input.cacheHit ? [`external-dependency-review-${input.layerId}`] : [],
        affectedLayerIds: [input.layerId],
        reasons: [`External dependency status: ${input.dependencyStatus ?? "live"}.`],
        recommendedFixes: input.dependencyStatus === "offline" ? ["Reconnect or remove the unavailable external dependency before publication."] : [],
      },
      {
        category: "crs",
        severity: input.crs ? "pass" : "unknown",
        issueIds: input.crs ? [] : [`external-crs-unknown-${input.layerId}`],
        affectedLayerIds: [input.layerId],
        reasons: input.crs ? [`CRS declared as ${input.crs}.`] : ["External service did not declare CRS metadata for this layer."],
        recommendedFixes: input.crs ? [] : ["Verify CRS from service documentation before analytical measurement."],
      },
      {
        category: "attribution-license",
        severity: input.hasLicenseOrAttribution ? "pass" : "unknown",
        issueIds: input.hasLicenseOrAttribution ? [] : [`external-attribution-unknown-${input.layerId}`],
        affectedLayerIds: [input.layerId],
        reasons: input.hasLicenseOrAttribution ? ["License or attribution metadata is present."] : ["License and attribution metadata is missing."],
        recommendedFixes: input.hasLicenseOrAttribution ? [] : ["Add provider attribution before publication or report handoff."],
      },
      {
        category: "schema",
        severity: input.queryable ? "pass" : "unknown",
        issueIds: [],
        affectedLayerIds: [input.layerId],
        reasons: input.queryable ? ["Layer is queryable in Map Explorer."] : ["Raster/service layer is not queryable from the map registry."],
        recommendedFixes: input.queryable ? [] : ["Use a feature service or downloaded dataset for feature-level analysis."],
      },
    ],
    signature: `external:${input.kind}:${input.layerId}:${input.crs ?? "unknown"}:${input.dependencyStatus ?? "live"}:${input.cacheHit ? "cached" : "fresh"}`,
  };
}

function withEvidenceMetadata(layer: OverlayLayerConfig): OverlayLayerConfig {
  return withNormalizedLayerRegistryMetadata({
    ...layer,
    metadata: {
      ...(layer.metadata ?? {}),
      evidenceArtifactId: layer.metadata?.evidenceArtifactId ?? createEvidenceArtifactId(layer.id),
    },
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
    || error instanceof Error && error.name === "AbortError";
}

function normalizeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "Unknown error");
}

function sanitizeExternalHeaderValue(value: string): string {
  return value
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\u00a9/g, "(c)")
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\t\x20-\x7e\x80-\xff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function setSafeExternalHeader(headers: Headers, name: string, value: string): void {
  const safeValue = sanitizeExternalHeaderValue(value);
  if (safeValue) {
    headers.set(name, safeValue);
  }
}

export function validateServiceUrl(rawUrl: string): UrlValidationResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a service URL before connecting.", warnings: [] };
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, error: "Service URL must use http or https.", warnings: [] };
    }
    const warnings = url.protocol === "https:"
      ? []
      : ["HTTPS is preferred. Browser security settings may block non-HTTPS services from a secure workspace."];
    return { ok: true, url, warnings };
  } catch {
    return { ok: false, error: "Service URL is not a valid URL.", warnings: [] };
  }
}

export function validateXyzUrlTemplate(rawUrl: string): UrlValidationResult {
  const normalizedUrl = normalizeXyzTileUrlTemplate(rawUrl);
  const requiredTokens = ["{z}", "{x}", "{y}"];
  const missingTokens = requiredTokens.filter((token) => !normalizedUrl.includes(token));
  if (missingTokens.length > 0) {
    return {
      ok: false,
      error: `XYZ tile URL template must include ${missingTokens.join(", ")} token${missingTokens.length === 1 ? "" : "s"}.`,
      warnings: [],
    };
  }

  return validateServiceUrl(normalizedUrl.replace("{z}", "0").replace("{x}", "0").replace("{y}", "0"));
}

function ensureValidServiceUrl(rawUrl: string): URL {
  const validation = validateServiceUrl(rawUrl);
  if (!validation.ok || !validation.url) {
    throw new ExternalServiceError("invalid-url", validation.error ?? "Service URL is invalid.");
  }
  return validation.url;
}

function ensureValidXyzUrlTemplate(rawUrl: string): void {
  const validation = validateXyzUrlTemplate(rawUrl);
  if (!validation.ok) {
    throw new ExternalServiceError("invalid-url", validation.error ?? "XYZ tile URL template is invalid.");
  }
}

function appendQuery(rawUrl: string, params: Record<string, string>): string {
  const url = ensureValidServiceUrl(rawUrl);
  for (const [key, value] of Object.entries(params)) {
    const existingKey = Array.from(url.searchParams.keys()).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    url.searchParams.set(existingKey ?? key, value);
  }
  return preserveMapLibreTemplateTokens(url.toString());
}

function preserveMapLibreTemplateTokens(url: string): string {
  return url.replace(/%7B/gi, "{").replace(/%7D/gi, "}");
}

export function cacheBustTileUrlTemplate(urlTemplate: string, token = Date.now().toString()): string {
  const url = ensureValidServiceUrl(normalizeXyzTileUrlTemplate(urlTemplate));
  url.searchParams.set("_synapseRefresh", token);
  return preserveMapLibreTemplateTokens(url.toString());
}

function mergeAbortSignals(controller: AbortController, signal?: AbortSignal): void {
  if (!signal) return;
  if (signal.aborted) {
    controller.abort();
    return;
  }
  signal.addEventListener("abort", () => controller.abort(), { once: true });
}

export async function fetchExternalService(
  rawUrl: string,
  init: RequestInit = {},
  options: ExternalFetchOptions = {},
): Promise<Response> {
  const url = ensureValidServiceUrl(rawUrl);
  const timeoutMs = options.timeoutMs ?? EXTERNAL_SERVICE_TIMEOUT_MS;
  const controller = new AbortController();
  mergeAbortSignals(controller, options.signal);
  const timeout = windowOrGlobalSetTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", options.accept ?? "*/*");
  }
  if (options.attribution && !headers.has("X-Synapse-Attribution")) {
    setSafeExternalHeader(headers, "X-Synapse-Attribution", options.attribution);
  }
  if (!headers.has("X-Synapse-Client")) {
    setSafeExternalHeader(headers, "X-Synapse-Client", PROJECT_CLIENT_LABEL);
  }

  try {
    const response = await fetch(url.toString(), {
      ...init,
      headers,
      signal: controller.signal,
      credentials: init.credentials ?? "omit",
    });
    if (!response.ok) {
      throw new ExternalServiceError(
        "http",
        `Service returned HTTP ${response.status}. Check the endpoint URL, layer name, or service permissions.`,
      );
    }
    return response;
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      throw error;
    }
    if (isAbortError(error)) {
      throw new ExternalServiceError(
        "timeout",
        `Service did not respond within ${Math.max(1, Math.ceil(timeoutMs / 1000))} seconds. Try a smaller AOI or a faster endpoint.`,
      );
    }
    if (error instanceof TypeError) {
      throw new ExternalServiceError(
        "cors",
        "The browser could not reach this service. It is likely blocked by CORS; use an HTTPS CORS proxy or a server-side geospatial proxy for this endpoint.",
      );
    }
    throw new ExternalServiceError("http", normalizeErrorMessage(error));
  } finally {
    windowOrGlobalClearTimeout(timeout);
  }
}

function windowOrGlobalSetTimeout(callback: () => void, timeoutMs: number): ReturnType<typeof setTimeout> {
  return setTimeout(callback, timeoutMs);
}

function windowOrGlobalClearTimeout(timeout: ReturnType<typeof setTimeout>): void {
  clearTimeout(timeout);
}

function parseXml(raw: string, label: string): Document {
  if (typeof DOMParser === "undefined") {
    throw new ExternalServiceError("parse", `${label} parsing requires DOMParser support.`);
  }
  const document = new DOMParser().parseFromString(raw, "application/xml");
  const errors = Array.from(document.getElementsByTagName("parsererror"));
  if (document.documentElement.localName === "parsererror" || errors.length > 0) {
    throw new ExternalServiceError("parse", `${label} capabilities response is not valid XML.`);
  }
  return document;
}

function childElements(parent: Element, localName: string): Element[] {
  return Array.from(parent.children).filter((child) => child.localName === localName);
}

function firstChildText(parent: Element | Document, localName: string): string | null {
  const root = parent instanceof Document ? parent.documentElement : parent;
  const direct = parent instanceof Document
    ? Array.from(root.getElementsByTagName("*")).find((node) => node.localName === localName)
    : childElements(root, localName)[0];
  const text = direct?.textContent?.trim();
  return text || null;
}

function uniqueSorted(values: Iterable<string | null | undefined>): string[] {
  return Array.from(new Set(Array.from(values).filter((value): value is string => Boolean(value?.trim()))))
    .sort((left, right) => left.localeCompare(right));
}

function parseWmsLayers(rootLayer: Element | null, inheritedCrs: string[] = []): ExternalLayerInfo[] {
  if (!rootLayer) return [];
  const directCrs = childElements(rootLayer, "CRS")
    .concat(childElements(rootLayer, "SRS"))
    .map((node) => node.textContent?.trim() ?? "");
  const availableCrs = uniqueSorted([...inheritedCrs, ...directCrs]);
  const name = firstChildText(rootLayer, "Name");
  const title = firstChildText(rootLayer, "Title") ?? name ?? "Untitled layer";
  const abstract = firstChildText(rootLayer, "Abstract") ?? undefined;
  const childLayers = childElements(rootLayer, "Layer").flatMap((layer) => parseWmsLayers(layer, availableCrs));
  const current = name
    ? [{ name, title, ...(abstract ? { abstract } : {}), availableCrs } satisfies ExternalLayerInfo]
    : [];
  return [...current, ...childLayers];
}

function deriveWmtsTileMatrixTemplate(tileMatrixIds: string[]): string {
  if (tileMatrixIds.length === 0 || tileMatrixIds.every((id) => /^\d+$/.test(id))) {
    return "{z}";
  }

  const parsed = tileMatrixIds
    .map((id) => id.match(/^(.*?)(\d+)$/))
    .filter((match): match is RegExpMatchArray => match !== null);
  if (parsed.length !== tileMatrixIds.length) {
    return "{z}";
  }

  const prefix = parsed[0]?.[1] ?? "";
  return parsed.every((match) => match[1] === prefix) ? `${prefix}{z}` : "{z}";
}

function parseWmtsTileMatrixSets(document: Document): Map<string, WmtsTileMatrixSetInfo> {
  const matrixSets = new Map<string, WmtsTileMatrixSetInfo>();
  for (const matrixSet of Array.from(document.getElementsByTagName("*")).filter((node) => node.localName === "TileMatrixSet")) {
    const id = firstChildText(matrixSet, "Identifier");
    const supportedCrs = firstChildText(matrixSet, "SupportedCRS");
    const tileMatrixIds = childElements(matrixSet, "TileMatrix")
      .map((tileMatrix) => firstChildText(tileMatrix, "Identifier"))
      .filter((tileMatrixId): tileMatrixId is string => tileMatrixId !== null);
    if (id && supportedCrs) {
      matrixSets.set(id, {
        id,
        supportedCrs,
        tileMatrixIds,
        tileMatrixTemplate: deriveWmtsTileMatrixTemplate(tileMatrixIds),
      });
    }
  }
  return matrixSets;
}

function parseWmtsLayers(document: Document): ExternalLayerInfo[] {
  const matrixSets = parseWmtsTileMatrixSets(document);
  return Array.from(document.getElementsByTagName("*"))
    .filter((node) => node.localName === "Layer")
    .map((layer) => {
      const name = firstChildText(layer, "Identifier") ?? firstChildText(layer, "Name") ?? "unnamed-layer";
      const title = firstChildText(layer, "Title") ?? name;
      const abstract = firstChildText(layer, "Abstract") ?? undefined;
      const formats = uniqueSorted(childElements(layer, "Format").map((node) => node.textContent?.trim() ?? ""));
      const styleElements = childElements(layer, "Style");
      const defaultStyle = (
        styleElements.find((style) => style.getAttribute("isDefault") === "true")
        ?? styleElements[0]
      );
      const resourceTemplate = Array.from(layer.children)
        .filter((node) => node.localName === "ResourceURL")
        .find((node) => (node.getAttribute("resourceType") ?? "tile") === "tile")
        ?.getAttribute("template") ?? undefined;
      const linkedTileMatrixSets = childElements(layer, "TileMatrixSetLink")
        .map((link) => firstChildText(link, "TileMatrixSet"))
        .filter((id): id is string => id !== null)
        .map((id) => matrixSets.get(id) ?? { id, supportedCrs: id, tileMatrixIds: [], tileMatrixTemplate: "{z}" });
      const availableCrs = uniqueSorted(linkedTileMatrixSets.map((matrixSet) => matrixSet.supportedCrs));
      const defaultStyleId = defaultStyle ? firstChildText(defaultStyle, "Identifier") ?? undefined : undefined;
      return {
        name,
        title,
        ...(abstract ? { abstract } : {}),
        availableCrs,
        formats,
        ...(defaultStyleId ? { defaultStyle: defaultStyleId } : {}),
        ...(resourceTemplate ? { resourceTemplate } : {}),
        tileMatrixSets: linkedTileMatrixSets,
      } satisfies ExternalLayerInfo;
    });
}

export async function loadWmsCapabilities(rawUrl: string): Promise<WmsCapabilities> {
  const requestedService = inferOgcService(rawUrl);
  const capabilitiesUrl = appendQuery(rawUrl, { service: requestedService, request: "GetCapabilities" });
  const response = await fetchExternalService(capabilitiesUrl, {}, { accept: "application/xml,text/xml,*/*" });
  const raw = await response.text();
  const document = parseXml(raw, "WMS/WMTS");
  const rootName = document.documentElement.localName.toLowerCase();
  const serviceType: "wms" | "wmts" = isWmtsCapabilities(document, rootName) ? "wmts" : "wms";
  const version = document.documentElement.getAttribute("version") ?? "1.3.0";
  const title = firstChildText(document, "Title") ?? (serviceType === "wmts" ? "WMTS service" : "WMS service");

  if (serviceType === "wmts") {
    return {
      serviceType,
      version,
      endpoint: rawUrl,
      title,
      layers: parseWmtsLayers(document),
    };
  }

  const capability = Array.from(document.getElementsByTagName("*")).find((node) => node.localName === "Capability");
  const rootLayer = capability ? childElements(capability, "Layer")[0] ?? null : null;
  return {
    serviceType,
    version,
    endpoint: rawUrl,
    title,
    layers: parseWmsLayers(rootLayer),
  };
}

function inferOgcService(rawUrl: string): "WMS" | "WMTS" {
  const url = ensureValidServiceUrl(rawUrl);
  const explicitService = Array.from(url.searchParams.entries())
    .find(([key]) => key.toLowerCase() === "service")?.[1]?.toUpperCase();
  if (explicitService === "WMTS") return "WMTS";
  return /wmts/i.test(url.pathname) ? "WMTS" : "WMS";
}

function isWmtsCapabilities(document: Document, rootName: string): boolean {
  const namespace = document.documentElement.namespaceURI ?? "";
  return rootName.includes("wmts")
    || /wmts/i.test(namespace)
    || Array.from(document.getElementsByTagName("*")).some((node) => node.localName === "TileMatrixSetLink");
}

export async function loadWfsCapabilities(rawUrl: string): Promise<WfsCapabilities> {
  const capabilitiesUrl = appendQuery(rawUrl, { service: "WFS", request: "GetCapabilities" });
  const response = await fetchExternalService(capabilitiesUrl, {}, { accept: "application/xml,text/xml,*/*" });
  const raw = await response.text();
  const document = parseXml(raw, "WFS");
  const version = document.documentElement.getAttribute("version") ?? "2.0.0";
  const title = firstChildText(document, "Title") ?? "WFS service";
  const featureTypes = Array.from(document.getElementsByTagName("*"))
    .filter((node) => node.localName === "FeatureType")
    .map((featureType) => {
      const name = firstChildText(featureType, "Name") ?? "unnamed-feature-type";
      const featureTitle = firstChildText(featureType, "Title") ?? name;
      const abstract = firstChildText(featureType, "Abstract") ?? undefined;
      const availableCrs = uniqueSorted([
        firstChildText(featureType, "DefaultCRS"),
        firstChildText(featureType, "DefaultSRS"),
        firstChildText(featureType, "SRS"),
        ...childElements(featureType, "OtherCRS").map((node) => node.textContent?.trim() ?? ""),
        ...childElements(featureType, "OtherSRS").map((node) => node.textContent?.trim() ?? ""),
      ]);
      return { name, title: featureTitle, ...(abstract ? { abstract } : {}), availableCrs } satisfies ExternalLayerInfo;
    });

  return { version, endpoint: rawUrl, title, featureTypes };
}

function resolvePreferredCrs(availableCrs: string[]): string {
  const normalized = availableCrs.map((crs) => crs.toUpperCase());
  if (normalized.some((crs) => crs.includes("3857") || crs.includes("900913"))) return "EPSG:3857";
  if (normalized.some((crs) => crs.includes("4326") || crs.includes("84"))) return "EPSG:4326";
  return "EPSG:3857";
}

function chooseWmtsTileMatrixSet(layer: ExternalLayerInfo): WmtsTileMatrixSetInfo {
  const candidates = layer.tileMatrixSets ?? [];
  const webMercator = candidates.find((candidate) =>
    /3857|900913|GoogleMapsCompatible|WebMercator/i.test(`${candidate.id} ${candidate.supportedCrs}`),
  );
  if (webMercator) return webMercator;
  const geographic = candidates.find((candidate) => /4326|CRS84|WGS84/i.test(`${candidate.id} ${candidate.supportedCrs}`));
  if (geographic) return geographic;
  return candidates[0] ?? { id: "GoogleMapsCompatible", supportedCrs: "EPSG:3857", tileMatrixIds: [], tileMatrixTemplate: "{z}" };
}

function replaceWmtsTemplateTokens(
  template: string,
  layer: ExternalLayerInfo,
  matrixSet: WmtsTileMatrixSetInfo,
  style: string,
): string {
  return template
    .replace(/\{TileMatrixSet\}/gi, matrixSet.id)
    .replace(/\{TileMatrix\}/gi, matrixSet.tileMatrixTemplate)
    .replace(/\{TileRow\}/gi, "{y}")
    .replace(/\{TileCol\}/gi, "{x}")
    .replace(/\{Layer\}/gi, layer.name)
    .replace(/\{Style\}/gi, style);
}

function createWmtsRasterLayerConfig(
  capabilities: WmsCapabilities,
  layer: ExternalLayerInfo,
): OverlayLayerConfig {
  const matrixSet = chooseWmtsTileMatrixSet(layer);
  const format = layer.formats?.[0] ?? "image/png";
  const style = layer.defaultStyle ?? "default";
  const tileUrl = layer.resourceTemplate
    ? replaceWmtsTemplateTokens(layer.resourceTemplate, layer, matrixSet, style)
    : appendQuery(capabilities.endpoint, {
      service: "WMTS",
      version: capabilities.version || "1.0.0",
      request: "GetTile",
      layer: layer.name,
      style,
      format,
      tileMatrixSet: matrixSet.id,
      tileMatrix: matrixSet.tileMatrixTemplate,
      tileRow: "{y}",
      tileCol: "{x}",
    });
  const layerId = createLayerId("external-wmts", layer.name);
  const refreshedAt = nowIsoTimestamp();
  const crs = matrixSet.supportedCrs;
  const caveats = externalServiceCaveats({ kind: "wmts", crs });
  const sourceName = capabilities.title;
  const scientificQA = buildExternalScientificQA({
    layerId,
    kind: "wmts",
    checkedAt: refreshedAt,
    queryable: false,
    crs,
    hasLicenseOrAttribution: false,
    caveats,
  });

  return withEvidenceMetadata({
    id: layerId,
    name: layer.title || layer.name,
    type: "raster-tile",
    visible: true,
    opacity: 0.82,
    sourceData: tileUrl,
    group: "data",
    sourceKind: "external",
    queryable: false,
    qaStatus: scientificQA.status,
    provenance: {
      label: capabilities.title,
      sourceName: capabilities.title,
      sourceUrl: capabilities.endpoint,
      method: "WMTS GetTile raster overlay",
      generatedAt: refreshedAt,
      notes: caveats,
    },
    metadata: {
      featureCount: 0,
      geometryType: "Raster tiles",
      updatedAt: refreshedAt,
      dataVersion: refreshedAt,
      externalService: buildExternalServiceMetadata({
        kind: "wmts",
        endpoint: capabilities.endpoint,
        title: sourceName,
        serviceVersion: capabilities.version || "1.0.0",
        layerName: layer.name,
        urlTemplate: tileUrl,
        crs,
        refreshedAt,
        caveats,
      }),
      crsSummary: buildExternalCrsSummary(crs, "external-service", ["WMTS tile matrix set declares the display CRS for tile retrieval."]),
      licenseAttribution: buildExternalLicenseAttribution({
        sourceName,
        sourceUrl: capabilities.endpoint,
      }),
      scientificQA,
      datasetContext: {
        layerTitle: layer.title,
        source: capabilities.title,
        crs,
        schemaSummary: [layer.name, `TileMatrixSet: ${matrixSet.id}`, ...(layer.abstract ? [layer.abstract] : [])],
      },
    },
  });
}

export function createWmsRasterLayerConfig(
  capabilities: WmsCapabilities,
  layer: ExternalLayerInfo,
): OverlayLayerConfig {
  if (capabilities.serviceType === "wmts") {
    return createWmtsRasterLayerConfig(capabilities, layer);
  }

  const crs = resolvePreferredCrs(layer.availableCrs);
  const version = capabilities.version || "1.3.0";
  const isWms13 = version.startsWith("1.3");
  const tileUrl = appendQuery(capabilities.endpoint, {
    service: "WMS",
    version,
    request: "GetMap",
    layers: layer.name,
    styles: "",
    format: "image/png",
    transparent: "true",
    width: "256",
    height: "256",
    [isWms13 ? "crs" : "srs"]: crs,
    bbox: crs === "EPSG:3857" ? "{bbox-epsg-3857}" : "{bbox-epsg-4326}",
  });
  const layerId = createLayerId("external-wms", layer.name);
  const refreshedAt = nowIsoTimestamp();
  const caveats = externalServiceCaveats({ kind: "wms", crs });
  const sourceName = capabilities.title;
  const scientificQA = buildExternalScientificQA({
    layerId,
    kind: "wms",
    checkedAt: refreshedAt,
    queryable: false,
    crs,
    hasLicenseOrAttribution: false,
    caveats,
  });

  return withEvidenceMetadata({
    id: layerId,
    name: layer.title || layer.name,
    type: "raster-tile",
    visible: true,
    opacity: 0.82,
    sourceData: tileUrl,
    group: "data",
    sourceKind: "external",
    queryable: false,
    qaStatus: scientificQA.status,
    provenance: {
      label: capabilities.title,
      sourceName: capabilities.title,
      sourceUrl: capabilities.endpoint,
      method: `${capabilities.serviceType.toUpperCase()} GetMap raster overlay`,
      generatedAt: refreshedAt,
      notes: caveats,
    },
    metadata: {
      featureCount: 0,
      geometryType: "Raster tiles",
      updatedAt: refreshedAt,
      dataVersion: refreshedAt,
      externalService: buildExternalServiceMetadata({
        kind: "wms",
        endpoint: capabilities.endpoint,
        title: sourceName,
        serviceVersion: version,
        layerName: layer.name,
        urlTemplate: tileUrl,
        crs,
        refreshedAt,
        caveats,
      }),
      crsSummary: buildExternalCrsSummary(crs, "external-service", ["WMS GetMap request declares the display CRS used for tile retrieval."]),
      licenseAttribution: buildExternalLicenseAttribution({
        sourceName,
        sourceUrl: capabilities.endpoint,
      }),
      scientificQA,
      datasetContext: {
        layerTitle: layer.title,
        source: capabilities.title,
        crs,
        schemaSummary: [layer.name, ...(layer.abstract ? [layer.abstract] : [])],
      },
    },
  });
}

export async function fetchWfsFeatureCollection(
  capabilities: WfsCapabilities,
  featureType: ExternalLayerInfo,
  bounds: [number, number, number, number],
): Promise<FeatureCollection> {
  const typeNameParameter = capabilities.version.startsWith("2") ? "typeNames" : "typeName";
  const featureUrl = appendQuery(capabilities.endpoint, {
    service: "WFS",
    version: capabilities.version || "2.0.0",
    request: "GetFeature",
    [typeNameParameter]: featureType.name,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    bbox: `${bounds.join(",")},EPSG:4326`,
  });
  const response = await fetchExternalService(featureUrl, {}, { accept: "application/json,application/geo+json,*/*" });
  const payload = await response.json() as unknown;
  if (!payload || typeof payload !== "object" || (payload as { type?: unknown }).type !== "FeatureCollection") {
    throw new ExternalServiceError("parse", "WFS response was not a GeoJSON FeatureCollection.");
  }
  return payload as FeatureCollection;
}

export function createWfsLayerConfig(
  capabilities: WfsCapabilities,
  featureType: ExternalLayerInfo,
  featureCollection: FeatureCollection,
  bounds?: [number, number, number, number],
  options: { id?: string; visible?: boolean; opacity?: number } = {},
): OverlayLayerConfig {
  const metadata = buildFeatureCollectionMetadata(featureCollection);
  const layerId = options.id ?? createLayerId("external-wfs", featureType.name);
  const refreshedAt = nowIsoTimestamp();
  const crs = "EPSG:4326";
  const caveats = externalServiceCaveats({ kind: "wfs", crs });
  const sourceName = capabilities.title;
  const scientificQA = buildExternalScientificQA({
    layerId,
    kind: "wfs",
    checkedAt: refreshedAt,
    queryable: true,
    crs,
    hasLicenseOrAttribution: false,
    caveats,
  });

  return withEvidenceMetadata({
    id: layerId,
    name: featureType.title || featureType.name,
    type: "geojson",
    visible: options.visible ?? true,
    opacity: options.opacity ?? 1,
    sourceData: featureCollection,
    group: "data",
    sourceKind: "external",
    queryable: true,
    qaStatus: scientificQA.status,
    provenance: {
      label: capabilities.title,
      sourceName: capabilities.title,
      sourceUrl: capabilities.endpoint,
      method: "WFS GetFeature GeoJSON with current map bbox filter",
      generatedAt: refreshedAt,
      notes: caveats,
    },
    metadata: {
      ...metadata,
      updatedAt: refreshedAt,
      dataVersion: refreshedAt,
      externalService: buildExternalServiceMetadata({
        kind: "wfs",
        endpoint: capabilities.endpoint,
        title: sourceName,
        serviceVersion: capabilities.version || "2.0.0",
        layerName: featureType.name,
        ...(bounds ? { bounds } : {}),
        crs,
        refreshedAt,
        caveats,
      }),
      crsSummary: buildExternalCrsSummary(crs, "external-service", ["WFS request explicitly requested srsName=EPSG:4326 for the returned GeoJSON features."]),
      licenseAttribution: buildExternalLicenseAttribution({
        sourceName,
        sourceUrl: capabilities.endpoint,
      }),
      scientificQA,
      datasetContext: {
        layerTitle: featureType.title,
        source: capabilities.title,
        crs,
        schemaSummary: featureType.abstract ? [featureType.abstract] : [],
      },
    },
  });
}

export function createXyzRasterLayerConfig(
  name: string,
  urlTemplate: string,
  attribution?: string,
): OverlayLayerConfig {
  const normalizedUrlTemplate = normalizeXyzTileUrlTemplate(urlTemplate);
  ensureValidXyzUrlTemplate(normalizedUrlTemplate);
  const layerId = createLayerId("external-xyz", name);
  const refreshedAt = nowIsoTimestamp();
  const crs = "EPSG:3857";
  const caveats = externalServiceCaveats({ kind: "xyz", crs });
  const scientificQA = buildExternalScientificQA({
    layerId,
    kind: "xyz",
    checkedAt: refreshedAt,
    queryable: false,
    crs,
    hasLicenseOrAttribution: Boolean(attribution),
    caveats,
  });

  return withEvidenceMetadata({
    id: layerId,
    name,
    type: "raster-tile",
    visible: true,
    opacity: 0.82,
    sourceData: normalizedUrlTemplate,
    group: "data",
    sourceKind: "external",
    queryable: false,
    qaStatus: scientificQA.status,
    provenance: {
      label: attribution ?? normalizedUrlTemplate,
      sourceName: name,
      sourceUrl: normalizedUrlTemplate,
      ...(attribution ? { attribution } : {}),
      method: "XYZ raster tile overlay",
      generatedAt: refreshedAt,
      notes: caveats,
    },
    metadata: {
      featureCount: 0,
      geometryType: "Raster tiles",
      updatedAt: refreshedAt,
      dataVersion: refreshedAt,
      externalService: buildExternalServiceMetadata({
        kind: "xyz",
        endpoint: normalizedUrlTemplate,
        title: name,
        urlTemplate: normalizedUrlTemplate,
        crs,
        refreshedAt,
        ...(attribution ? { attribution } : {}),
        caveats,
      }),
      crsSummary: buildExternalCrsSummary(crs, "external-service", ["XYZ web tile templates are treated as Web Mercator display tiles."]),
      licenseAttribution: buildExternalLicenseAttribution({
        sourceName: name,
        sourceUrl: normalizedUrlTemplate,
        ...(attribution ? { attribution } : {}),
      }),
      scientificQA,
      datasetContext: {
        layerTitle: name,
        source: attribution ?? normalizedUrlTemplate,
        crs,
      },
    },
  });
}

export function refreshRasterLayerConfig(layer: OverlayLayerConfig, token = Date.now().toString()): OverlayLayerConfig {
  if (layer.type !== "raster-tile" || typeof layer.sourceData !== "string") {
    throw new ExternalServiceError("invalid-url", "Only raster tile external layers can be refreshed with a tile cache-bust URL.");
  }
  const refreshedAt = nowIsoTimestamp();
  const refreshedUrl = cacheBustTileUrlTemplate(layer.sourceData, token);
  return withEvidenceMetadata({
    ...layer,
    sourceData: refreshedUrl,
    metadata: {
      ...(layer.metadata ?? {}),
      updatedAt: refreshedAt,
      dataVersion: refreshedAt,
      ...(layer.metadata?.externalService
        ? { externalService: {
          ...layer.metadata.externalService,
          urlTemplate: refreshedUrl,
          refreshedAt,
          lastRequestAt: refreshedAt,
          dependencyStatus: "live",
          cacheHit: false,
          staleAt: new Date(new Date(refreshedAt).getTime() + (layer.metadata.externalService.cacheTtlMs ?? OVERPASS_CACHE_TTL_MS)).toISOString(),
        } }
        : {}),
    },
  });
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function estimateBboxAreaKm2(bounds: [number, number, number, number]): number {
  const [west, south, east, north] = bounds;
  const midLat = toRadians((south + north) / 2);
  const widthKm = Math.abs(east - west) * 111.320 * Math.max(0.01, Math.cos(midLat));
  const heightKm = Math.abs(north - south) * 110.574;
  return widthKm * heightKm;
}

function clampLatitude(value: number): number {
  return Math.max(-85, Math.min(85, value));
}

function clampLongitude(value: number): number {
  return Math.max(-180, Math.min(180, value));
}

export function clampOverpassBounds(
  bounds: [number, number, number, number],
  maxAreaKm2 = OVERPASS_MAX_AREA_KM2,
): OverpassBoundsResult {
  const normalized: [number, number, number, number] = [
    Math.min(bounds[0], bounds[2]),
    Math.min(bounds[1], bounds[3]),
    Math.max(bounds[0], bounds[2]),
    Math.max(bounds[1], bounds[3]),
  ];
  const areaKm2 = estimateBboxAreaKm2(normalized);
  if (areaKm2 <= maxAreaKm2) {
    const clampedBounds: [number, number, number, number] = [
      clampLongitude(normalized[0]),
      clampLatitude(normalized[1]),
      clampLongitude(normalized[2]),
      clampLatitude(normalized[3]),
    ];
    return {
      requestedBounds: normalized,
      clampedBounds,
      areaKm2,
      wasClamped: false,
      cacheKey: quantizeBoundsKey(clampedBounds),
    };
  }

  const scale = Math.sqrt(maxAreaKm2 / areaKm2);
  const centerLng = (normalized[0] + normalized[2]) / 2;
  const centerLat = (normalized[1] + normalized[3]) / 2;
  const halfLng = ((normalized[2] - normalized[0]) * scale) / 2;
  const halfLat = ((normalized[3] - normalized[1]) * scale) / 2;
  const clampedBounds: [number, number, number, number] = [
    clampLongitude(centerLng - halfLng),
    clampLatitude(centerLat - halfLat),
    clampLongitude(centerLng + halfLng),
    clampLatitude(centerLat + halfLat),
  ];
  return {
    requestedBounds: normalized,
    clampedBounds,
    areaKm2: estimateBboxAreaKm2(clampedBounds),
    wasClamped: true,
    cacheKey: quantizeBoundsKey(clampedBounds),
  };
}

function quantizeBoundsKey(bounds: [number, number, number, number]): string {
  return bounds.map((value) => value.toFixed(4)).join(",");
}

function overpassRingFromGeometry(geometry: OverpassGeometryPoint[] | undefined): Position[] | null {
  if (!geometry || geometry.length < 3) return null;
  const ring: Position[] = geometry
    .filter((point) => Number.isFinite(point.lon) && Number.isFinite(point.lat))
    .map((point) => [point.lon, point.lat]);
  if (ring.length < 3) return null;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first?.[0] !== last?.[0] || first?.[1] !== last?.[1]) {
    ring.push([first![0], first![1]]);
  }
  return ring.length >= 4 ? ring : null;
}

function normalizeOsmProperties(element: OverpassElement): GeoJsonProperties {
  const tags = element.tags ?? {};
  const rawHeight = tags.height ?? tags["building:height"];
  const height = rawHeight ? Number(String(rawHeight).replace(/[^0-9.\-]/g, "")) : undefined;
  const levels = tags["building:levels"] ? Number(tags["building:levels"]) : undefined;
  const startYear = tags.start_date ? Number.parseInt(tags.start_date, 10) : undefined;
  const properties: GeoJsonProperties = {
    building: tags.building ?? "yes",
    "building:levels": Number.isFinite(levels) ? levels : tags["building:levels"] ?? null,
    height: Number.isFinite(height) ? height : null,
    "addr:housenumber": tags["addr:housenumber"] ?? null,
    "addr:street": tags["addr:street"] ?? null,
    start_date: tags.start_date ?? null,
    osm_id: `${element.type}/${element.id}`,
    building_id: `osm-${element.type}-${element.id}`,
    type: tags.building ?? "unknown",
    year: Number.isFinite(startYear) ? startYear : null,
    name: tags.name ?? null,
    source: "OpenStreetMap",
  };
  return properties;
}

function normalizeOverpassWay(element: OverpassElement): Feature<Polygon, GeoJsonProperties> | null {
  const ring = overpassRingFromGeometry(element.geometry);
  if (!ring) return null;
  return {
    type: "Feature",
    id: `osm-way-${element.id}`,
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: normalizeOsmProperties(element),
  };
}

function normalizeOverpassRelation(element: OverpassElement): Feature<Polygon | MultiPolygon, GeoJsonProperties> | null {
  const members = element.members ?? [];
  const outerRings = members
    .filter((member) => member.role === "outer" || !member.role)
    .map((member) => overpassRingFromGeometry(member.geometry))
    .filter((ring): ring is Position[] => ring !== null);
  const innerRings = members
    .filter((member) => member.role === "inner")
    .map((member) => overpassRingFromGeometry(member.geometry))
    .filter((ring): ring is Position[] => ring !== null);
  if (outerRings.length === 0) return null;
  const properties = normalizeOsmProperties(element);
  if (outerRings.length === 1) {
    return {
      type: "Feature",
      id: `osm-relation-${element.id}`,
      geometry: { type: "Polygon", coordinates: [outerRings[0]!, ...innerRings] },
      properties,
    };
  }
  return {
    type: "Feature",
    id: `osm-relation-${element.id}`,
    geometry: {
      type: "MultiPolygon",
      coordinates: outerRings.map((ring) => [ring]),
    },
    properties,
  };
}

export function overpassResponseToGeoJSON(
  response: OverpassResponse,
): FeatureCollection<Polygon | MultiPolygon, GeoJsonProperties> {
  const features = (response.elements ?? [])
    .filter((element) => element.type === "way" || element.type === "relation")
    .map((element) => element.type === "way" ? normalizeOverpassWay(element) : normalizeOverpassRelation(element))
    .filter((feature): feature is Feature<Polygon | MultiPolygon, GeoJsonProperties> => feature !== null);
  return { type: "FeatureCollection", features };
}

function buildOverpassQuery(bounds: [number, number, number, number]): string {
  const [west, south, east, north] = bounds;
  const bbox = `${south},${west},${north},${east}`;
  return `
[out:json][timeout:25];
(
  way["building"](${bbox});
  relation["building"](${bbox});
);
out body geom;
`;
}

export async function fetchOverpassBuildingsForBounds(
  bounds: [number, number, number, number],
  options: { endpoint?: string; timeoutMs?: number; bypassCache?: boolean } = {},
): Promise<OverpassBuildingsResult> {
  const boundsInfo = clampOverpassBounds(bounds);
  const cached = overpassCache.get(boundsInfo.cacheKey);
  if (!options.bypassCache && cached && cached.expiresAt > Date.now()) {
    return { ...cached.result, cacheHit: true };
  }

  const endpoint = options.endpoint ?? DEFAULT_OVERPASS_ENDPOINT;
  const response = await fetchExternalService(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({ data: buildOverpassQuery(boundsInfo.clampedBounds) }).toString(),
  }, {
    timeoutMs: options.timeoutMs ?? 30_000,
    accept: "application/json",
    attribution: OSM_BUILDING_PROVENANCE,
  });
  const payload = await response.json() as OverpassResponse;
  const featureCollection = overpassResponseToGeoJSON(payload);
  const result: OverpassBuildingsResult = {
    featureCollection,
    requestedBounds: boundsInfo.requestedBounds,
    clampedBounds: boundsInfo.clampedBounds,
    areaKm2: boundsInfo.areaKm2,
    wasClamped: boundsInfo.wasClamped,
    cacheKey: boundsInfo.cacheKey,
    cacheHit: false,
    fetchedAt: nowIsoTimestamp(),
    endpoint,
    provenance: OSM_BUILDING_PROVENANCE,
  };
  overpassCache.set(boundsInfo.cacheKey, {
    expiresAt: Date.now() + OVERPASS_CACHE_TTL_MS,
    result,
  });
  return result;
}

export function createOsmBuildingsLayerConfig(result: OverpassBuildingsResult): OverlayLayerConfig {
  const metadata = buildFeatureCollectionMetadata(result.featureCollection);
  const layerId = createLayerId("voxcity-osm-buildings", "osm-buildings");
  const endpoint = result.endpoint ?? DEFAULT_OVERPASS_ENDPOINT;
  const crs = "EPSG:4326";
  const caveats = externalServiceCaveats({
    kind: "overpass",
    crs,
    cacheHit: result.cacheHit,
    wasClamped: result.wasClamped,
  });
  const scientificQA = buildExternalScientificQA({
    layerId,
    kind: "overpass",
    checkedAt: result.fetchedAt,
    queryable: true,
    crs,
    hasLicenseOrAttribution: true,
    caveats,
    dependencyStatus: result.cacheHit ? "cached" : "live",
    cacheHit: result.cacheHit,
  });

  return withEvidenceMetadata({
    id: layerId,
    name: "OSM Building Footprints",
    type: "geojson",
    visible: true,
    opacity: 0.72,
    sourceData: result.featureCollection,
    group: "voxcity",
    sourceKind: "external",
    queryable: true,
    qaStatus: scientificQA.status,
    style: {
      "fill-color": [
        "interpolate",
        ["linear"],
        ["coalesce", ["to-number", ["get", "height"]], ["*", ["coalesce", ["to-number", ["get", "building:levels"]], 1], 3]],
        0,
        "#1E293B",
        10,
        "#0E7490",
        30,
        "#2563EB",
        60,
        "#7C3AED",
        120,
        "#DB2777",
      ],
      "fill-outline-color": "rgba(55, 148, 255, 0.72)",
    },
    provenance: {
      label: OSM_BUILDING_PROVENANCE,
      sourceName: "OpenStreetMap Overpass API",
      sourceUrl: endpoint,
      license: "ODbL",
      attribution: OSM_BUILDING_PROVENANCE,
      method: `Overpass building query clipped to ${result.areaKm2.toFixed(2)} km² bbox`,
      generatedAt: result.fetchedAt,
      notes: caveats,
    },
    metadata: {
      ...metadata,
      updatedAt: result.fetchedAt,
      dataVersion: result.fetchedAt,
      externalService: buildExternalServiceMetadata({
        kind: "overpass",
        endpoint,
        title: "OpenStreetMap Overpass API",
        bounds: result.requestedBounds,
        crs,
        refreshedAt: result.fetchedAt,
        dependencyStatus: result.cacheHit ? "cached" : "live",
        cacheTtlMs: OVERPASS_CACHE_TTL_MS,
        cacheHit: result.cacheHit,
        license: "ODbL",
        attribution: OSM_BUILDING_PROVENANCE,
        caveats,
      }),
      crsSummary: buildExternalCrsSummary(crs, "external-service", ["Overpass building coordinates are returned as longitude/latitude GeoJSON from OpenStreetMap."]),
      licenseAttribution: buildExternalLicenseAttribution({
        sourceName: "OpenStreetMap Overpass API",
        sourceUrl: endpoint,
        license: "ODbL",
        attribution: OSM_BUILDING_PROVENANCE,
      }),
      scientificQA,
      datasetContext: {
        layerTitle: "OSM Building Footprints",
        source: "OpenStreetMap Overpass API",
        license: "ODbL",
        crs: "EPSG:4326",
        spatialExtent: result.clampedBounds.map((value) => value.toFixed(4)).join(", "),
        schemaSummary: ["building", "building:levels", "height", "addr:housenumber", "addr:street", "start_date", "osm_id"],
      },
    },
  });
}

export function seedOverpassCacheForTests(result: OverpassBuildingsResult): void {
  overpassCache.set(result.cacheKey, {
    expiresAt: Date.now() + OVERPASS_CACHE_TTL_MS,
    result: { ...result, cacheHit: false },
  });
}

export function getCachedOverpassBuildingsForBounds(
  bounds: [number, number, number, number],
): OverpassBuildingsResult | null {
  const boundsInfo = clampOverpassBounds(bounds);
  const cached = overpassCache.get(boundsInfo.cacheKey);
  if (!cached || cached.expiresAt <= Date.now()) {
    return null;
  }
  return { ...cached.result, cacheHit: true };
}

export function cacheOverpassBuildingsResult(result: OverpassBuildingsResult): void {
  overpassCache.set(result.cacheKey, {
    expiresAt: Date.now() + OVERPASS_CACHE_TTL_MS,
    result: { ...result, cacheHit: false },
  });
}

export function clearOverpassCache(): void {
  overpassCache.clear();
}

/* -------------------------------------------------------------------- */
/*  Overpass roads (real OSM highway network)                           */
/* -------------------------------------------------------------------- */

export const OSM_ROADS_PROVENANCE = "OpenStreetMap contributors — © ODbL";

export interface OverpassRoadsResult {
  featureCollection: FeatureCollection<LineString, GeoJsonProperties>;
  requestedBounds: [number, number, number, number];
  clampedBounds: [number, number, number, number];
  areaKm2: number;
  wasClamped: boolean;
  cacheKey: string;
  cacheHit: boolean;
  fetchedAt: string;
  endpoint?: string;
  provenance: string;
}

interface OverpassRoadsCacheEntry {
  expiresAt: number;
  result: OverpassRoadsResult;
}

const overpassRoadsCache = new Map<string, OverpassRoadsCacheEntry>();

function buildOverpassRoadsQuery(bounds: [number, number, number, number]): string {
  const [west, south, east, north] = bounds;
  const bbox = `${south},${west},${north},${east}`;
  return `
[out:json][timeout:25];
(
  way["highway"](${bbox});
);
out body geom;
`;
}

function normalizeOsmRoadProperties(element: OverpassElement): GeoJsonProperties {
  const tags = element.tags ?? {};
  const lanes = tags.lanes ? Number(tags.lanes) : undefined;
  return {
    osm_id: `${element.type}/${element.id}`,
    road_id: `osm-${element.type}-${element.id}`,
    highway: tags.highway ?? "unknown",
    name: tags.name ?? null,
    surface: tags.surface ?? null,
    lanes: Number.isFinite(lanes) ? lanes : null,
    oneway: tags.oneway ?? null,
    maxspeed: tags.maxspeed ?? null,
    source: "OpenStreetMap",
  };
}

function overpassLineFromGeometry(geometry: OverpassGeometryPoint[] | undefined): Position[] | null {
  if (!geometry || geometry.length < 2) return null;
  const coordinates: Position[] = geometry
    .filter((point) => Number.isFinite(point.lon) && Number.isFinite(point.lat))
    .map((point) => [point.lon, point.lat]);
  return coordinates.length >= 2 ? coordinates : null;
}

export function overpassRoadsToGeoJSON(
  response: OverpassResponse,
): FeatureCollection<LineString, GeoJsonProperties> {
  const features = (response.elements ?? [])
    .filter((element) => element.type === "way")
    .map((element) => {
      const coordinates = overpassLineFromGeometry(element.geometry);
      if (!coordinates) return null;
      return {
        type: "Feature",
        id: `osm-way-${element.id}`,
        geometry: { type: "LineString", coordinates },
        properties: normalizeOsmRoadProperties(element),
      } satisfies Feature<LineString, GeoJsonProperties>;
    })
    .filter((feature): feature is Feature<LineString, GeoJsonProperties> => feature !== null);
  return { type: "FeatureCollection", features };
}

export async function fetchOverpassRoadsForBounds(
  bounds: [number, number, number, number],
  options: { endpoint?: string; timeoutMs?: number; bypassCache?: boolean } = {},
): Promise<OverpassRoadsResult> {
  const boundsInfo = clampOverpassBounds(bounds);
  const cached = overpassRoadsCache.get(boundsInfo.cacheKey);
  if (!options.bypassCache && cached && cached.expiresAt > Date.now()) {
    return { ...cached.result, cacheHit: true };
  }

  const endpoint = options.endpoint ?? DEFAULT_OVERPASS_ENDPOINT;
  const response = await fetchExternalService(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({ data: buildOverpassRoadsQuery(boundsInfo.clampedBounds) }).toString(),
  }, {
    timeoutMs: options.timeoutMs ?? 30_000,
    accept: "application/json",
    attribution: OSM_ROADS_PROVENANCE,
  });
  const payload = await response.json() as OverpassResponse;
  const featureCollection = overpassRoadsToGeoJSON(payload);
  const result: OverpassRoadsResult = {
    featureCollection,
    requestedBounds: boundsInfo.requestedBounds,
    clampedBounds: boundsInfo.clampedBounds,
    areaKm2: boundsInfo.areaKm2,
    wasClamped: boundsInfo.wasClamped,
    cacheKey: boundsInfo.cacheKey,
    cacheHit: false,
    fetchedAt: nowIsoTimestamp(),
    endpoint,
    provenance: OSM_ROADS_PROVENANCE,
  };
  overpassRoadsCache.set(boundsInfo.cacheKey, {
    expiresAt: Date.now() + OVERPASS_CACHE_TTL_MS,
    result,
  });
  return result;
}

export function clearOverpassRoadsCache(): void {
  overpassRoadsCache.clear();
}

export function createOsmRoadsLayerConfig(result: OverpassRoadsResult): OverlayLayerConfig {
  const metadata = buildFeatureCollectionMetadata(result.featureCollection);
  const layerId = createLayerId("osm-roads", "osm-roads");
  const endpoint = result.endpoint ?? DEFAULT_OVERPASS_ENDPOINT;
  const crs = "EPSG:4326";
  const caveats = externalServiceCaveats({
    kind: "overpass",
    crs,
    cacheHit: result.cacheHit,
    wasClamped: result.wasClamped,
  });
  const scientificQA = buildExternalScientificQA({
    layerId,
    kind: "overpass",
    checkedAt: result.fetchedAt,
    queryable: true,
    crs,
    hasLicenseOrAttribution: true,
    caveats,
    dependencyStatus: result.cacheHit ? "cached" : "live",
    cacheHit: result.cacheHit,
  });

  return withEvidenceMetadata({
    id: layerId,
    name: "OSM Road Network",
    type: "geojson",
    visible: true,
    opacity: 0.9,
    sourceData: result.featureCollection,
    group: "data",
    sourceKind: "external",
    queryable: true,
    qaStatus: scientificQA.status,
    style: {
      "line-color": "#38bdf8",
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10,
        0.4,
        14,
        1.4,
        17,
        3,
      ],
    },
    provenance: {
      label: OSM_ROADS_PROVENANCE,
      sourceName: "OpenStreetMap Overpass API",
      sourceUrl: endpoint,
      license: "ODbL",
      attribution: OSM_ROADS_PROVENANCE,
      method: `Overpass highway query clipped to ${result.areaKm2.toFixed(2)} km² bbox`,
      generatedAt: result.fetchedAt,
      notes: caveats,
    },
    metadata: {
      ...metadata,
      updatedAt: result.fetchedAt,
      dataVersion: result.fetchedAt,
      externalService: buildExternalServiceMetadata({
        kind: "overpass",
        endpoint,
        title: "OpenStreetMap Overpass API",
        bounds: result.requestedBounds,
        crs,
        refreshedAt: result.fetchedAt,
        dependencyStatus: result.cacheHit ? "cached" : "live",
        cacheTtlMs: OVERPASS_CACHE_TTL_MS,
        cacheHit: result.cacheHit,
        license: "ODbL",
        attribution: OSM_ROADS_PROVENANCE,
        caveats,
      }),
      crsSummary: buildExternalCrsSummary(crs, "external-service", ["Overpass road coordinates are returned as longitude/latitude GeoJSON from OpenStreetMap."]),
      licenseAttribution: buildExternalLicenseAttribution({
        sourceName: "OpenStreetMap Overpass API",
        sourceUrl: endpoint,
        license: "ODbL",
        attribution: OSM_ROADS_PROVENANCE,
      }),
      scientificQA,
      datasetContext: {
        layerTitle: "OSM Road Network",
        source: "OpenStreetMap Overpass API",
        license: "ODbL",
        crs: "EPSG:4326",
        spatialExtent: result.clampedBounds.map((value) => value.toFixed(4)).join(", "),
        schemaSummary: ["highway", "name", "surface", "lanes", "oneway", "maxspeed", "osm_id"],
      },
    },
  });
}

export async function loadRemoteCityJSON(rawUrl: string): Promise<CityJSONLoadResult> {
  const response = await fetchExternalService(rawUrl, {}, { accept: "application/json,*/*" });
  const raw = await response.text();
  return loadCityJSON(raw);
}

export function createRemoteCityJSONLayerConfig(
  result: CityJSONLoadResult,
  sourceUrl: string,
  featureCollection: FeatureCollection<Polygon, GeoJsonProperties>,
): OverlayLayerConfig {
  const metadata = buildFeatureCollectionMetadata(featureCollection);
  const lods = uniqueSorted(result.objects.map((object) => object.lod));
  const layerId = createLayerId("voxcity-cityjson-url", "cityjson");
  const refreshedAt = nowIsoTimestamp();
  const crs = result.summary.referenceSystem?.trim() || undefined;
  const caveats = externalServiceCaveats({
    kind: "cityjson",
    crs,
    cityJsonReferenceSystemMissing: !crs,
  });
  const scientificQA = buildExternalScientificQA({
    layerId,
    kind: "cityjson",
    checkedAt: refreshedAt,
    queryable: true,
    ...(crs ? { crs } : {}),
    hasLicenseOrAttribution: false,
    caveats,
  });

  return withEvidenceMetadata({
    id: layerId,
    name: `Remote CityJSON${lods.length > 0 ? ` LOD ${lods[lods.length - 1]}` : ""}`,
    type: "geojson",
    visible: true,
    opacity: 0.54,
    sourceData: featureCollection,
    group: "voxcity",
    sourceKind: "external",
    queryable: true,
    qaStatus: scientificQA.status,
    provenance: {
      label: sourceUrl,
      sourceName: "Remote CityJSON",
      sourceUrl,
      method: "CityJSON URL parsed into semantic 2D footprint surfaces",
      generatedAt: refreshedAt,
      notes: caveats,
    },
    metadata: {
      ...metadata,
      updatedAt: refreshedAt,
      dataVersion: refreshedAt,
      externalService: buildExternalServiceMetadata({
        kind: "cityjson",
        endpoint: sourceUrl,
        title: "Remote CityJSON",
        ...(crs ? { crs } : {}),
        refreshedAt,
        caveats,
      }),
      crsSummary: buildExternalCrsSummary(crs, "external-service", crs
        ? ["CityJSON source declared a reference system in its metadata."]
        : ["CityJSON source did not declare a reference system; CRS is intentionally unknown."],
      ),
      licenseAttribution: buildExternalLicenseAttribution({
        sourceName: "Remote CityJSON",
        sourceUrl,
      }),
      scientificQA,
      datasetContext: {
        layerTitle: "Remote CityJSON semantic surfaces",
        source: sourceUrl,
        ...(crs ? { crs } : {}),
        schemaSummary: [`LODs: ${lods.join(", ") || "none detected"}`, `${result.objects.length} city objects`],
      },
    },
  });
}

export const ExternalServiceConnector = {
  fetch: fetchExternalService,
  validateServiceUrl,
  validateXyzUrlTemplate,
  loadWmsCapabilities,
  loadWfsCapabilities,
  fetchWfsFeatureCollection,
  createWmsRasterLayerConfig,
  createWfsLayerConfig,
  createXyzRasterLayerConfig,
  refreshRasterLayerConfig,
  cacheBustTileUrlTemplate,
  clampOverpassBounds,
  overpassResponseToGeoJSON,
  fetchOverpassBuildingsForBounds,
  createOsmBuildingsLayerConfig,
  getCachedOverpassBuildingsForBounds,
  cacheOverpassBuildingsResult,
  clearOverpassCache,
  overpassRoadsToGeoJSON,
  fetchOverpassRoadsForBounds,
  createOsmRoadsLayerConfig,
  clearOverpassRoadsCache,
  loadRemoteCityJSON,
  createRemoteCityJSONLayerConfig,
};
