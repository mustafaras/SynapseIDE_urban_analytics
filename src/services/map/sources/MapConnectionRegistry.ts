/* ==================================================================== */
/*  MapConnectionRegistry (Prompt 21)                                    */
/*                                                                        */
/*  Production path for environment-dependent external services          */
/*  (WMS / WMTS / WFS / XYZ / OSM / Overpass). It layers a provider       */
/*  registry + health checks + truthful dependency state on top of the   */
/*  existing `ExternalServiceConnector`. The single rule it enforces:     */
/*  external services fail VISIBLY and never claim false readiness, and   */
/*  secrets never enter layer metadata or evidence.                       */
/*                                                                        */
/*  - Failure classification (CORS / auth / rate-limit / offline / …) is  */
/*    shared with `MapCanvas` so the on-map failure surface and the       */
/*    layer/publication caveats describe the same thing.                  */
/*  - `dependencyStatus` / `credentialMode` / `corsMode` are written into */
/*    `ExternalServiceLayerMetadata`; `mapLayerMetadata` already turns an */
/*    offline/stale/unknown dependency into publication-readiness         */
/*    blockers/caveats, so no separate propagation is needed.             */
/* ==================================================================== */

import type {
  ExternalServiceLayerMetadata,
  LayerCrsSummary,
} from "@/centerpanel/components/map/mapTypes";
import type { SourceHandle } from "../contracts/gisContracts";
import {
  EXTERNAL_SERVICE_TIMEOUT_MS,
  ExternalServiceError,
  OVERPASS_CACHE_TTL_MS,
  fetchExternalService,
  normalizeXyzTileUrlTemplate,
  validateServiceUrl,
  type ExternalServiceKind,
} from "../ExternalServiceConnector";

/* -------------------------------------------------------------------- */
/*  Types                                                               */
/* -------------------------------------------------------------------- */

export type ExternalServiceDependencyStatus = NonNullable<ExternalServiceLayerMetadata["dependencyStatus"]>;
export type ExternalServiceCredentialMode = NonNullable<ExternalServiceLayerMetadata["credentialMode"]>;
export type ExternalServiceCorsMode = NonNullable<ExternalServiceLayerMetadata["corsMode"]>;

/** Specific, actionable failure states a broken external service can hit. */
export type ExternalServiceFailureKind =
  | "cors"
  | "auth"
  | "rate-limit"
  | "offline"
  | "timeout"
  | "invalid-url"
  | "parse"
  | "unknown";

export interface ExternalServiceFailure {
  kind: ExternalServiceFailureKind;
  /** One-line, operator-actionable reason. */
  reason: string;
  /** Failures always render as a non-usable dependency. */
  dependencyStatus: ExternalServiceDependencyStatus;
  httpStatus?: number;
}

export interface ExternalServiceHealth {
  dependencyStatus: ExternalServiceDependencyStatus;
  checkedAt: string;
  failureKind?: ExternalServiceFailureKind;
  offlineReason?: string;
  httpStatus?: number;
}

export type ExternalServiceHealthCheckMethod = "capabilities" | "tile-probe" | "post-query" | "head";

export interface MapConnectionProviderProfile {
  id: string;
  label: string;
  serviceKind: ExternalServiceKind;
  defaultCredentialMode: ExternalServiceCredentialMode;
  defaultCorsMode: ExternalServiceCorsMode;
  healthCheck: ExternalServiceHealthCheckMethod;
  /** Guidance shown when the provider is blocked (CORS/proxy/quota). */
  proxyGuidance: string;
  /** True for raster tile providers (visual reference, not queryable). */
  raster: boolean;
}

/** Durable, secret-free description of an external connection. */
export interface MapConnectionDescriptor {
  sourceId: string;
  providerId: string;
  serviceKind: ExternalServiceKind;
  endpoint: string;
  credentialMode: ExternalServiceCredentialMode;
  corsMode: ExternalServiceCorsMode;
  title?: string;
  layerName?: string;
  urlTemplate?: string;
  crs?: string;
  bounds?: [number, number, number, number];
  cacheTtlMs?: number;
  license?: string;
  attribution?: string;
}

export interface MapConnectionInput {
  sourceId: string;
  serviceKind: ExternalServiceKind;
  endpoint: string;
  providerId?: string;
  credentialMode?: ExternalServiceCredentialMode;
  corsMode?: ExternalServiceCorsMode;
  title?: string;
  layerName?: string;
  urlTemplate?: string;
  crs?: string;
  bounds?: [number, number, number, number];
  cacheTtlMs?: number;
  license?: string;
  attribution?: string;
}

export interface CheckConnectionHealthOptions {
  /** Injectable fetch boundary (defaults to the real connector fetch). */
  fetcher?: typeof fetchExternalService;
  timeoutMs?: number;
  cacheHit?: boolean;
  now?: () => Date;
}

/* -------------------------------------------------------------------- */
/*  Provider registry                                                   */
/* -------------------------------------------------------------------- */

export const MAP_CONNECTION_PROVIDERS: Record<string, MapConnectionProviderProfile> = {
  wms: {
    id: "wms",
    label: "OGC WMS",
    serviceKind: "wms",
    defaultCredentialMode: "not-required",
    defaultCorsMode: "tile-client",
    healthCheck: "capabilities",
    proxyGuidance: "WMS GetMap tiles are fetched by the map client; a blocked endpoint needs a tile-friendly HTTPS CORS proxy or a server-side geospatial proxy.",
    raster: true,
  },
  wmts: {
    id: "wmts",
    label: "OGC WMTS",
    serviceKind: "wmts",
    defaultCredentialMode: "not-required",
    defaultCorsMode: "tile-client",
    healthCheck: "capabilities",
    proxyGuidance: "WMTS tiles are fetched by the map client; route a blocked endpoint through a tile-friendly HTTPS CORS proxy.",
    raster: true,
  },
  wfs: {
    id: "wfs",
    label: "OGC WFS",
    serviceKind: "wfs",
    defaultCredentialMode: "not-required",
    defaultCorsMode: "browser-fetch",
    healthCheck: "capabilities",
    proxyGuidance: "WFS GetFeature is fetched by the browser; use an HTTPS CORS proxy if the service does not send permissive CORS headers.",
    raster: false,
  },
  xyz: {
    id: "xyz",
    label: "XYZ tiles",
    serviceKind: "xyz",
    defaultCredentialMode: "unknown",
    defaultCorsMode: "tile-client",
    healthCheck: "tile-probe",
    proxyGuidance: "XYZ tiles are fetched by the map client; key-restricted providers must be reached through a referrer-restricted proxy (the key is never stored here).",
    raster: true,
  },
  osm: {
    id: "osm",
    label: "OpenStreetMap tiles",
    serviceKind: "xyz",
    defaultCredentialMode: "not-required",
    defaultCorsMode: "tile-client",
    healthCheck: "tile-probe",
    proxyGuidance: "Respect the OpenStreetMap tile usage policy; sustained use needs a self-hosted or commercial tile proxy.",
    raster: true,
  },
  overpass: {
    id: "overpass",
    label: "OpenStreetMap Overpass",
    serviceKind: "overpass",
    defaultCredentialMode: "not-required",
    defaultCorsMode: "browser-fetch",
    healthCheck: "post-query",
    proxyGuidance: "Overpass enforces rate limits and area caps; narrow the AOI or switch to a mirror endpoint when rate-limited.",
    raster: false,
  },
};

export function getMapConnectionProvider(providerOrKind: string): MapConnectionProviderProfile {
  const direct = MAP_CONNECTION_PROVIDERS[providerOrKind];
  if (direct) return direct;
  const byKind = Object.values(MAP_CONNECTION_PROVIDERS).find((profile) => profile.serviceKind === providerOrKind);
  if (byKind) return byKind;
  throw new ExternalServiceError("invalid-url", `Unknown external service provider "${providerOrKind}".`);
}

/* -------------------------------------------------------------------- */
/*  Secret hygiene — no credentials ever enter layer metadata           */
/* -------------------------------------------------------------------- */

// Note: `credentials?\b` is boundary-aware so the safe `credentialMode`
// descriptor field (which records only the mode, never a secret) is not
// mistaken for a credential value.
const SECRET_KEY_PATTERN = /(password|secret|token|api[_-]?key|apikey|authorization|auth[_-]?token|access[_-]?key|client[_-]?secret|bearer|credentials?\b)/i;

/** Remove any credential-like keys from a free-form record (defensive). */
export function stripSecretKeys<T extends Record<string, unknown>>(record: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SECRET_KEY_PATTERN.test(key)) continue;
    cleaned[key] = value;
  }
  return cleaned as Partial<T>;
}

/** True when no secret-like key is present anywhere in the value. */
export function containsNoSecrets(value: unknown, depth = 0): boolean {
  if (depth > 6 || value == null) return true;
  if (Array.isArray(value)) return value.every((entry) => containsNoSecrets(entry, depth + 1));
  if (typeof value !== "object") return true;
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) return false;
    if (!containsNoSecrets(entry, depth + 1)) return false;
  }
  return true;
}

function assertSecretFreeServiceUrl(rawUrl: string, label: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return;
  }
  const hasCredentialQuery = Array.from(url.searchParams.keys()).some((key) => SECRET_KEY_PATTERN.test(key));
  if (url.username || url.password || hasCredentialQuery) {
    throw new ExternalServiceError(
      "invalid-url",
      `${label} cannot include embedded credentials or credential-like query parameters. Use a secured connector or proxy; secrets are not stored in catalog records.`,
    );
  }
}

/* -------------------------------------------------------------------- */
/*  Failure classification (shared with MapCanvas)                      */
/* -------------------------------------------------------------------- */

const FAILURE_REASONS: Record<ExternalServiceFailureKind, string> = {
  cors: "The browser was blocked from reaching this service (likely CORS). Route it through an HTTPS CORS proxy or a server-side geospatial proxy.",
  auth: "The service rejected the request as unauthorized. Provide credentials through a secured connector (never stored in layer metadata) or use an authorized proxy.",
  "rate-limit": "The service is rate-limiting requests. Reduce request frequency, narrow the AOI, or use a provider with a higher quota.",
  offline: "The service is unreachable or returned a server error. Verify the endpoint URL and that the service is online.",
  timeout: "The service did not respond in time. Try a smaller AOI or a faster endpoint.",
  "invalid-url": "The service URL is invalid. Correct the endpoint or tile template before retrying.",
  parse: "The service responded but the payload could not be parsed. Confirm the service type and version.",
  unknown: "The external service request failed for an unknown reason. Check the endpoint and try again.",
};

function extractHttpStatus(message: string): number | undefined {
  const match = message.match(/\b([1-5]\d\d)\b/);
  return match ? Number(match[1]) : undefined;
}

function classifyHttpStatus(status: number): ExternalServiceFailureKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate-limit";
  if (status === 408 || status === 504) return "timeout";
  if (status >= 500) return "offline";
  return "offline";
}

/**
 * Map an error / HTTP status into a specific, actionable failure state.
 * Used by both the registry (to set `dependencyStatus`/`offlineReason`)
 * and `MapCanvas` (to render the on-map failure instead of a blank tile).
 */
export function classifyExternalServiceFailure(error: unknown, httpStatus?: number): ExternalServiceFailure {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const status = httpStatus ?? extractHttpStatus(message);

  let kind: ExternalServiceFailureKind;
  if (error instanceof ExternalServiceError) {
    kind = error.code === "http"
      ? (status != null ? classifyHttpStatus(status) : "offline")
      : error.code === "empty"
        ? "offline"
        : error.code;
  } else if (status != null) {
    kind = classifyHttpStatus(status);
  } else if (/abort|did not respond|timed? ?out/i.test(message)) {
    kind = "timeout";
  } else if (error instanceof TypeError || /failed to fetch|networkerror|network request|load failed/i.test(message)) {
    kind = "cors";
  } else if (/unauthorized|forbidden|401|403/i.test(message)) {
    kind = "auth";
  } else if (/rate.?limit|too many requests|429/i.test(message)) {
    kind = "rate-limit";
  } else if (/cors/i.test(message)) {
    kind = "cors";
  } else if (/offline|unreachable|dns|connection refused/i.test(message)) {
    kind = "offline";
  } else {
    kind = "unknown";
  }

  return {
    kind,
    reason: FAILURE_REASONS[kind],
    dependencyStatus: "offline",
    ...(status != null ? { httpStatus: status } : {}),
  };
}

/* -------------------------------------------------------------------- */
/*  Health checks                                                       */
/* -------------------------------------------------------------------- */

export function initialConnectionHealth(checkedAt = new Date().toISOString()): ExternalServiceHealth {
  return { dependencyStatus: "unknown", checkedAt };
}

function appendServiceQuery(rawUrl: string, params: Record<string, string>): string {
  const validation = validateServiceUrl(rawUrl);
  if (!validation.ok || !validation.url) {
    throw new ExternalServiceError("invalid-url", validation.error ?? "Service URL is invalid.");
  }
  const url = validation.url;
  for (const [key, value] of Object.entries(params)) {
    const existing = Array.from(url.searchParams.keys()).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    url.searchParams.set(existing ?? key, value);
  }
  return url.toString();
}

interface HealthProbe {
  url: string;
  init: RequestInit;
  accept: string;
}

function buildHealthProbe(descriptor: MapConnectionDescriptor, profile: MapConnectionProviderProfile): HealthProbe {
  switch (profile.healthCheck) {
    case "capabilities": {
      const service = profile.serviceKind === "wfs" ? "WFS" : profile.serviceKind === "wmts" ? "WMTS" : "WMS";
      return {
        url: appendServiceQuery(descriptor.endpoint, { service, request: "GetCapabilities" }),
        init: {},
        accept: "application/xml,text/xml,*/*",
      };
    }
    case "tile-probe": {
      const template = descriptor.urlTemplate ?? descriptor.endpoint;
      const sampleTile = normalizeXyzTileUrlTemplate(template)
        .replace(/\{z\}/gi, "0")
        .replace(/\{x\}/gi, "0")
        .replace(/\{y\}/gi, "0");
      return { url: sampleTile, init: {}, accept: "image/png,image/*,*/*" };
    }
    case "post-query": {
      return {
        url: descriptor.endpoint,
        init: {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: new URLSearchParams({ data: "[out:json][timeout:5];out count;" }).toString(),
        },
        accept: "application/json",
      };
    }
    case "head":
    default:
      return { url: descriptor.endpoint, init: { method: "HEAD" }, accept: "*/*" };
  }
}

/**
 * Probe a connection's health. The fetch boundary is injectable so unit
 * tests classify offline/CORS/auth/rate-limit deterministically without
 * touching the network.
 */
export async function checkConnectionHealth(
  descriptor: MapConnectionDescriptor,
  options: CheckConnectionHealthOptions = {},
): Promise<ExternalServiceHealth> {
  const fetcher = options.fetcher ?? fetchExternalService;
  const checkedAt = (options.now?.() ?? new Date()).toISOString();
  const profile = getMapConnectionProvider(descriptor.providerId);
  let probe: HealthProbe;
  try {
    probe = buildHealthProbe(descriptor, profile);
  } catch (error) {
    const failure = classifyExternalServiceFailure(error);
    return {
      dependencyStatus: "offline",
      checkedAt,
      failureKind: failure.kind,
      offlineReason: failure.reason,
    };
  }

  try {
    await fetcher(probe.url, probe.init, {
      timeoutMs: options.timeoutMs ?? EXTERNAL_SERVICE_TIMEOUT_MS,
      accept: probe.accept,
    });
    return { dependencyStatus: options.cacheHit ? "cached" : "live", checkedAt };
  } catch (error) {
    const failure = classifyExternalServiceFailure(error);
    return {
      dependencyStatus: "offline",
      checkedAt,
      failureKind: failure.kind,
      offlineReason: failure.reason,
      ...(failure.httpStatus != null ? { httpStatus: failure.httpStatus } : {}),
    };
  }
}

/** Downgrade a previously-live dependency to `stale` once its TTL lapses. */
export function resolveDependencyStatusForTime(
  metadata: ExternalServiceLayerMetadata,
  now: Date = new Date(),
): ExternalServiceDependencyStatus {
  const current = metadata.dependencyStatus ?? "unknown";
  if (current === "offline" || current === "unknown") return current;
  if (!metadata.staleAt) return current;
  const staleTime = new Date(metadata.staleAt).getTime();
  if (Number.isFinite(staleTime) && now.getTime() >= staleTime) {
    return "stale";
  }
  return current;
}

/* -------------------------------------------------------------------- */
/*  Caveats + metadata construction                                     */
/* -------------------------------------------------------------------- */

function uniqueText(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

export function connectionCaveats(
  descriptor: MapConnectionDescriptor,
  health: ExternalServiceHealth,
  extra: string[] = [],
): string[] {
  const profile = getMapConnectionProvider(descriptor.providerId);
  const caveats: string[] = [
    "External service availability, permissions, CORS policy, and rate limits can change outside this project session.",
    "Browser credentials are not embedded in layer or evidence metadata; secured services need explicit review before reuse.",
  ];
  if (profile.raster) {
    caveats.push("Raster tile layers are visual references; feature-level geometry and attributes are not queryable from this layer.");
  }
  if (!descriptor.crs) {
    caveats.push("External layer does not declare a usable CRS; CRS remains unknown until source metadata is verified.");
  }
  if (descriptor.credentialMode === "browser-managed") {
    caveats.push("This connection relies on browser-managed credentials; they are never stored in layer metadata or evidence.");
  }
  if (descriptor.credentialMode === "unknown") {
    caveats.push("Credential requirements are unknown until a successful authenticated request completes.");
  }
  if (health.dependencyStatus === "offline") {
    caveats.push(health.offlineReason ?? "External service is currently offline or unreachable.");
    caveats.push(profile.proxyGuidance);
  }
  if (health.dependencyStatus === "stale") {
    caveats.push("External service layer is stale and should be refreshed before analytical use.");
  }
  if (health.dependencyStatus === "unknown") {
    caveats.push("External service availability has not been verified in this browser session.");
  }
  return uniqueText([...caveats, ...extra]);
}

/**
 * Build the secret-free `ExternalServiceLayerMetadata` for a connection +
 * health result. The output carries `dependencyStatus`/`credentialMode`/
 * `corsMode`/`offlineReason`/`caveats`, which `mapLayerMetadata` turns into
 * publication-readiness blockers/caveats (offline → blocked).
 */
export function buildConnectionLayerMetadata(
  descriptor: MapConnectionDescriptor,
  health: ExternalServiceHealth,
  options: { extraCaveats?: string[] } = {},
): ExternalServiceLayerMetadata {
  const refreshedAt = health.checkedAt;
  const cacheTtlMs = descriptor.cacheTtlMs ?? OVERPASS_CACHE_TTL_MS;
  const caveats = connectionCaveats(descriptor, health, options.extraCaveats ?? []);
  const metadata: ExternalServiceLayerMetadata = {
    kind: descriptor.serviceKind,
    endpoint: descriptor.endpoint,
    ...(descriptor.title ? { title: descriptor.title } : {}),
    ...(descriptor.layerName ? { layerName: descriptor.layerName } : {}),
    ...(descriptor.urlTemplate ? { urlTemplate: descriptor.urlTemplate } : {}),
    ...(descriptor.bounds ? { bounds: descriptor.bounds } : {}),
    ...(descriptor.crs ? { crs: descriptor.crs } : {}),
    refreshedAt,
    dependencyStatus: health.dependencyStatus,
    lastRequestAt: refreshedAt,
    cacheTtlMs,
    staleAt: new Date(new Date(refreshedAt).getTime() + cacheTtlMs).toISOString(),
    ...(health.offlineReason ? { offlineReason: health.offlineReason } : {}),
    credentialMode: descriptor.credentialMode,
    corsMode: descriptor.corsMode,
    ...(descriptor.license ? { license: descriptor.license } : {}),
    ...(descriptor.attribution ? { attribution: descriptor.attribution } : {}),
    caveats,
  };
  return metadata;
}

/** Build a durable, secret-free SourceHandle for project save/restore. */
export function buildConnectionSourceHandle(
  descriptor: MapConnectionDescriptor,
  health: ExternalServiceHealth,
): SourceHandle {
  const crsSummary: LayerCrsSummary = descriptor.crs
    ? { crs: descriptor.crs, status: "known", source: "external-service", notes: [] }
    : { crs: null, status: "unknown", source: "external-service", notes: ["External service did not declare a CRS."] };
  return {
    sourceId: descriptor.sourceId,
    kind: "external",
    storageMode: "external-service",
    restoreStatus: "external-reference",
    crsSummary,
    featureCount: null,
    sourceRef: descriptor.endpoint,
    ...(descriptor.license ? { license: descriptor.license } : {}),
    ...(descriptor.attribution ? { attribution: descriptor.attribution } : {}),
    caveats: connectionCaveats(descriptor, health),
    profiledAt: health.checkedAt,
  };
}

/* -------------------------------------------------------------------- */
/*  Descriptor construction (secret-stripping at the boundary)          */
/* -------------------------------------------------------------------- */

export function createConnectionDescriptor(input: MapConnectionInput): MapConnectionDescriptor {
  const validation = validateServiceUrl(input.urlTemplate ?? input.endpoint);
  if (!validation.ok) {
    throw new ExternalServiceError("invalid-url", validation.error ?? "Service URL is invalid.");
  }
  assertSecretFreeServiceUrl(input.endpoint, "Service endpoint");
  if (input.urlTemplate) {
    assertSecretFreeServiceUrl(input.urlTemplate, "Tile URL template");
  }
  const providerId = input.providerId ?? input.serviceKind;
  const profile = getMapConnectionProvider(providerId);
  // The descriptor is assembled from explicit, secret-free fields below; any
  // credential-like keys a caller passes are never copied across. Use
  // `stripSecretKeys` / `containsNoSecrets` for free-form records.
  return {
    sourceId: input.sourceId,
    providerId: profile.id,
    serviceKind: profile.serviceKind,
    endpoint: input.endpoint,
    credentialMode: input.credentialMode ?? profile.defaultCredentialMode,
    corsMode: input.corsMode ?? profile.defaultCorsMode,
    ...(input.title ? { title: input.title } : {}),
    ...(input.layerName ? { layerName: input.layerName } : {}),
    ...(input.urlTemplate ? { urlTemplate: input.urlTemplate } : {}),
    ...(input.crs ? { crs: input.crs } : {}),
    ...(input.bounds ? { bounds: input.bounds } : {}),
    ...(input.cacheTtlMs != null ? { cacheTtlMs: input.cacheTtlMs } : {}),
    ...(input.license ? { license: input.license } : {}),
    ...(input.attribution ? { attribution: input.attribution } : {}),
  };
}

/* -------------------------------------------------------------------- */
/*  Connection metadata cache (cache / restore)                         */
/* -------------------------------------------------------------------- */

interface ConnectionCacheEntry {
  descriptor: MapConnectionDescriptor;
  metadata: ExternalServiceLayerMetadata;
  health: ExternalServiceHealth;
}

const connectionCache = new Map<string, ConnectionCacheEntry>();

export function cacheConnectionMetadata(
  descriptor: MapConnectionDescriptor,
  metadata: ExternalServiceLayerMetadata,
  health: ExternalServiceHealth,
): void {
  connectionCache.set(descriptor.sourceId, { descriptor, metadata, health });
}

export function getCachedConnection(sourceId: string): ConnectionCacheEntry | null {
  return connectionCache.get(sourceId) ?? null;
}

/**
 * Restore connection metadata for a session, re-deriving the dependency
 * status against the current clock (a cached/live connection past its TTL
 * becomes `stale` rather than silently claiming freshness).
 */
export function restoreConnectionMetadata(
  sourceId: string,
  now: Date = new Date(),
): ExternalServiceLayerMetadata | null {
  const entry = connectionCache.get(sourceId);
  if (!entry) return null;
  const dependencyStatus = resolveDependencyStatusForTime(entry.metadata, now);
  if (dependencyStatus === entry.metadata.dependencyStatus) {
    return entry.metadata;
  }
  const health: ExternalServiceHealth = { ...entry.health, dependencyStatus };
  return buildConnectionLayerMetadata(entry.descriptor, health);
}

export function clearConnectionCache(): void {
  connectionCache.clear();
}

export const MapConnectionRegistry = {
  providers: MAP_CONNECTION_PROVIDERS,
  getProvider: getMapConnectionProvider,
  createDescriptor: createConnectionDescriptor,
  classifyFailure: classifyExternalServiceFailure,
  checkHealth: checkConnectionHealth,
  initialHealth: initialConnectionHealth,
  resolveDependencyStatusForTime,
  connectionCaveats,
  buildLayerMetadata: buildConnectionLayerMetadata,
  buildSourceHandle: buildConnectionSourceHandle,
  stripSecretKeys,
  containsNoSecrets,
  cache: cacheConnectionMetadata,
  getCached: getCachedConnection,
  restore: restoreConnectionMetadata,
  clearCache: clearConnectionCache,
};
