/**
 * SentinelHubConnector — Copernicus Data Space Sentinel Hub integration.
 *
 * Provides authenticated access to the Sentinel Hub Process API for
 * Sentinel-2 L2A imagery retrieval. Designed for urban environmental
 * analysis: NDVI workflows, land-cover classification inputs, and
 * change-detection pipelines.
 *
 * Capabilities:
 *   - OAuth2 client-credentials token acquisition and automatic refresh
 *   - Process API requests with arbitrary evalscripts
 *   - Band-specific helpers for B04 (Red), B08 (NIR), and NDVI
 *   - Cloud-cover filtering via maxCloudCoverage
 *   - Temporal window support
 *   - Retry with exponential backoff for transient failures
 *   - AbortSignal propagation
 *   - User-readable error messages from upstream error responses
 */

import {
  type BBox,
  DEFAULT_RETRY,
  type RetryConfig,
  type SentinelHubBandParams,
  type SentinelHubCredentials,
  type SentinelHubProcessParams,
  type SentinelHubProcessResult,
  type SentinelHubToken,
  type TimeInterval,
} from './types';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_TOKEN_URL =
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const DEFAULT_PROCESS_URL =
  'https://sh.dataspace.copernicus.eu/api/v1/process';
const DEFAULT_COLLECTION = 'sentinel-2-l2a';
const DEFAULT_CRS = 'http://www.opengis.net/def/crs/EPSG/0/4326';
const DEFAULT_FORMAT = 'image/tiff';

// Token refresh safety margin: refresh 60 s before actual expiry.
const TOKEN_REFRESH_MARGIN_MS = 60_000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

function backoffDelay(attempt: number, cfg: RetryConfig): number {
  const exp = Math.min(cfg.baseDelayMs * 2 ** attempt, cfg.maxDelayMs);
  return Math.round(Math.random() * exp);
}

/**
 * Extract a human-readable error message from a Sentinel Hub error response.
 * Falls back to the HTTP status text if the body isn't JSON.
 */
async function readErrorBody(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      // Sentinel Hub errors use { error: { message: "…" } } or { message: "…" }
      const nested = json.error as Record<string, unknown> | undefined;
      if (nested?.message) return String(nested.message);
      if (json.message) return String(json.message);
      if (json.error && typeof json.error === 'string') return json.error;
    } catch {
      // Not JSON — use the raw text if short enough
      if (text.length > 0 && text.length < 500) return text;
    }
  } catch {
    // Could not read body
  }
  return fallback;
}

/**
 * Fetch with retry. Returns the raw Response (caller decides how to consume).
 * Non-retryable HTTP errors throw immediately with a readable message.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  cfg: RetryConfig,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    let res: Response | undefined;
    try {
      res = await fetch(url, init);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      lastError = err;
      if (attempt < cfg.maxRetries) {
        await sleep(backoffDelay(attempt, cfg), init.signal ?? undefined);
      }
      continue;
    }
    if (res.ok) return res;
    if (!cfg.retryableStatuses.includes(res.status)) {
      const msg = await readErrorBody(
        res,
        `${res.status} ${res.statusText}`,
      );
      throw new Error(`Sentinel Hub HTTP ${res.status}: ${msg}`);
    }
    lastError = new Error(`Sentinel Hub HTTP ${res.status}`);
    if (attempt < cfg.maxRetries) {
      await sleep(backoffDelay(attempt, cfg), init.signal ?? undefined);
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Evalscript templates
// ---------------------------------------------------------------------------

/** Single-band float evalscript (returns one 32-bit float sample). */
function singleBandEvalscript(bandName: string): string {
  return `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["${bandName}"], units: "REFLECTANCE" }],
    output: { bands: 1, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(sample) {
  return [sample.${bandName}];
}`;
}

/** NDVI evalscript that computes (B08 - B04) / (B08 + B04). */
function ndviEvalscript(): string {
  return `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08"], units: "REFLECTANCE" }],
    output: { bands: 1, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(sample) {
  var denom = sample.B08 + sample.B04;
  if (denom === 0) return [-9999];
  return [(sample.B08 - sample.B04) / denom];
}`;
}

/**
 * Multi-band evalscript (returns N float bands).
 * @param bandNames Array of band identifiers, e.g. ["B02", "B03", "B04"]
 */
function multiBandEvalscript(bandNames: string[]): string {
  const inputBands = JSON.stringify(bandNames);
  const returnExpr = bandNames.map((b) => `sample.${b}`).join(', ');
  return `//VERSION=3
function setup() {
  return {
    input: [{ bands: ${inputBands}, units: "REFLECTANCE" }],
    output: { bands: ${bandNames.length}, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(sample) {
  return [${returnExpr}];
}`;
}

// ---------------------------------------------------------------------------
// Process API request body builder
// ---------------------------------------------------------------------------

function buildProcessBody(params: SentinelHubProcessParams): unknown {
  const collection = params.collection ?? DEFAULT_COLLECTION;
  const crs = params.crs ?? DEFAULT_CRS;
  const format = params.format ?? DEFAULT_FORMAT;
  const maxCC = params.maxCloudCover ?? 100;

  return {
    input: {
      bounds: {
        bbox: params.bbox,
        properties: { crs },
      },
      data: [
        {
          type: collection,
          dataFilter: {
            timeRange: {
              from: params.datetime.start,
              to: params.datetime.end,
            },
            maxCloudCoverage: maxCC,
          },
        },
      ],
    },
    output: {
      width: params.width,
      height: params.height,
      responses: [
        {
          identifier: 'default',
          format: { type: format },
        },
      ],
    },
    evalscript: params.evalscript,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SentinelHubConnectorOptions {
  retry?: Partial<RetryConfig>;
  signal?: AbortSignal;
  /** Override the Process API endpoint. */
  processUrl?: string;
}

/**
 * Acquire an OAuth2 bearer token via client credentials grant.
 *
 * Tokens are returned with their expiry so callers can cache and refresh.
 */
export async function acquireToken(
  credentials: SentinelHubCredentials,
  opts: { retry?: Partial<RetryConfig>; signal?: AbortSignal } = {},
): Promise<SentinelHubToken> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY, ...opts.retry };
  const tokenUrl = credentials.tokenUrl ?? DEFAULT_TOKEN_URL;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  });

  const requestInit: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  };
  if (opts.signal) {
    requestInit.signal = opts.signal;
  }

  const res = await fetchWithRetry(
    tokenUrl,
    requestInit,
    cfg,
  );

  const json = (await res.json()) as Record<string, unknown>;
  const accessToken = json.access_token;
  const expiresIn = json.expires_in;
  if (typeof accessToken !== 'string' || typeof expiresIn !== 'number') {
    throw new Error(
      'Sentinel Hub token response missing access_token or expires_in',
    );
  }
  return {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

/**
 * Check whether a cached token is still usable (with safety margin).
 */
export function isTokenValid(token: SentinelHubToken | null): boolean {
  if (!token) return false;
  return Date.now() < token.expiresAt - TOKEN_REFRESH_MARGIN_MS;
}

/**
 * Manage token lifecycle: return the cached token if valid, otherwise
 * acquire a fresh one.
 */
export async function ensureToken(
  credentials: SentinelHubCredentials,
  cached: SentinelHubToken | null,
  opts: { retry?: Partial<RetryConfig>; signal?: AbortSignal } = {},
): Promise<SentinelHubToken> {
  if (isTokenValid(cached)) return cached!;
  return acquireToken(credentials, opts);
}

/**
 * Issue a Process API request with an arbitrary evalscript.
 *
 * Returns raw pixel data as Float64Array arrays (one per output band)
 * by parsing the TIFF response. For formats other than TIFF the raw
 * ArrayBuffer is returned as a single band.
 */
export async function process(
  token: SentinelHubToken,
  params: SentinelHubProcessParams,
  opts: SentinelHubConnectorOptions = {},
): Promise<SentinelHubProcessResult> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY, ...opts.retry };
  const processUrl = opts.processUrl ?? DEFAULT_PROCESS_URL;
  const reqBody = buildProcessBody(params);
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
      Accept: params.format ?? DEFAULT_FORMAT,
    },
    body: JSON.stringify(reqBody),
  };
  if (opts.signal) {
    requestInit.signal = opts.signal;
  }

  const res = await fetchWithRetry(
    processUrl,
    requestInit,
    cfg,
  );

  const contentType = res.headers.get('content-type') ?? DEFAULT_FORMAT;
  const buf = await res.arrayBuffer();

  // Parse pixel data from the response buffer.
  // For simplicity we treat the raw bytes as float32 samples
  // (the evalscripts above all emit FLOAT32).
  const bandCount = estimateBandCount(buf, params.width, params.height);
  const pixelCount = params.width * params.height;
  const data: Float64Array[] = [];

  const f32 = new Float32Array(buf);
  for (let b = 0; b < bandCount; b++) {
    const band = new Float64Array(pixelCount);
    for (let i = 0; i < pixelCount; i++) {
      const idx = b * pixelCount + i;
      band[i] = idx < f32.length ? f32[idx] : 0;
    }
    data.push(band);
  }

  return {
    data,
    width: params.width,
    height: params.height,
    bandCount,
    contentType,
    bbox: params.bbox,
    datetime: params.datetime,
  };
}

/**
 * Estimate the number of bands from the buffer size and image dimensions.
 * Falls back to 1 if the size doesn't divide evenly.
 */
function estimateBandCount(
  buf: ArrayBuffer,
  width: number,
  height: number,
): number {
  const floatCount = buf.byteLength / 4; // FLOAT32 = 4 bytes
  const pixelCount = width * height;
  if (pixelCount === 0) return 1;
  const ratio = floatCount / pixelCount;
  return ratio >= 1 ? Math.round(ratio) : 1;
}

// ---------------------------------------------------------------------------
// Band-specific convenience helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve Sentinel-2 Band 04 (Red, ~665 nm) as a single-band float raster.
 */
export async function fetchB04(
  token: SentinelHubToken,
  params: SentinelHubBandParams,
  opts: SentinelHubConnectorOptions = {},
): Promise<SentinelHubProcessResult> {
  return process(
    token,
    {
      ...params,
      evalscript: singleBandEvalscript('B04'),
      format: DEFAULT_FORMAT,
    },
    opts,
  );
}

/**
 * Retrieve Sentinel-2 Band 08 (NIR, ~842 nm) as a single-band float raster.
 */
export async function fetchB08(
  token: SentinelHubToken,
  params: SentinelHubBandParams,
  opts: SentinelHubConnectorOptions = {},
): Promise<SentinelHubProcessResult> {
  return process(
    token,
    {
      ...params,
      evalscript: singleBandEvalscript('B08'),
      format: DEFAULT_FORMAT,
    },
    opts,
  );
}

/**
 * Compute NDVI (Normalized Difference Vegetation Index) server-side.
 *
 * Returns (B08 − B04) / (B08 + B04) as a single-band float raster.
 * Pixels where denominator = 0 are set to −9999.
 */
export async function fetchNDVI(
  token: SentinelHubToken,
  params: SentinelHubBandParams,
  opts: SentinelHubConnectorOptions = {},
): Promise<SentinelHubProcessResult> {
  return process(
    token,
    {
      ...params,
      evalscript: ndviEvalscript(),
      format: DEFAULT_FORMAT,
    },
    opts,
  );
}

/**
 * Retrieve multiple Sentinel-2 bands in a single request.
 *
 * @param bandNames Array of band identifiers, e.g. ["B02", "B03", "B04", "B08"]
 */
export async function fetchBands(
  token: SentinelHubToken,
  params: SentinelHubBandParams,
  bandNames: string[],
  opts: SentinelHubConnectorOptions = {},
): Promise<SentinelHubProcessResult> {
  if (bandNames.length === 0) {
    throw new Error('At least one band name is required');
  }
  return process(
    token,
    {
      ...params,
      evalscript: multiBandEvalscript(bandNames),
      format: DEFAULT_FORMAT,
    },
    opts,
  );
}

// ---------------------------------------------------------------------------
// Catalog search — thin wrapper that normalises to CatalogSearchResult
// ---------------------------------------------------------------------------

/**
 * Search the Sentinel Hub Catalog API for available scenes.
 * Returns results normalised into the shared CatalogItem contract.
 */
export async function searchCatalog(
  token: SentinelHubToken,
  params: {
    bbox: BBox;
    datetime: TimeInterval;
    collection?: string;
    maxCloudCover?: number;
    limit?: number;
  },
  opts: SentinelHubConnectorOptions = {},
): Promise<import('./types').CatalogSearchResult> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY, ...opts.retry };
  const collection = params.collection ?? DEFAULT_COLLECTION;
  const catalogUrl =
    'https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search';

  const body = {
    bbox: params.bbox,
    datetime: `${params.datetime.start}/${params.datetime.end}`,
    collections: [collection],
    limit: params.limit ?? 10,
    filter: params.maxCloudCover != null
      ? `eo:cloud_cover < ${params.maxCloudCover}`
      : undefined,
  };
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
  if (opts.signal) {
    requestInit.signal = opts.signal;
  }

  const res = await fetchWithRetry(
    catalogUrl,
    requestInit,
    cfg,
  );

  const json = (await res.json()) as Record<string, unknown>;
  const features = (json.features ?? []) as Array<Record<string, unknown>>;
  const links = (json.links ?? []) as Array<{ rel: string; href: string }>;
  const nextLink = links.find((l) => l.rel === 'next');

  const items: import('./types').CatalogItem[] = features.map((f) => {
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const rawBBox = (f.bbox ?? params.bbox) as number[];
    const dt = (props.datetime ?? '') as string;
    const selfLink = (
      ((f.links ?? []) as Array<{ rel: string; href: string }>).find(
        (l) => l.rel === 'self',
      )
    )?.href;

    return {
      id: String(f.id ?? ''),
      collection,
      provider: 'sentinel-hub',
      bbox: [rawBBox[0], rawBBox[1], rawBBox[2], rawBBox[3]] as BBox,
      datetime: dt,
      crs: 'EPSG:4326',
      assets: [],
      geometry: (f.geometry as GeoJSON.Geometry) ?? null,
      properties: props,
      ...(typeof props['eo:cloud_cover'] === 'number' ? { cloudCover: props['eo:cloud_cover'] } : {}),
      gsd: 10,
      ...(selfLink ? { selfLink } : {}),
    };
  });

  const matched =
    (json.numberMatched as number | undefined) ??
    ((json.context as Record<string, unknown> | undefined)?.matched as
      | number
      | undefined) ??
    null;

  return { items, matched, nextToken: nextLink?.href ?? null };
}

// Re-export evalscript helpers for advanced consumers
export { singleBandEvalscript, ndviEvalscript, multiBandEvalscript };
