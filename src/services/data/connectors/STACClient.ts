/**
 * STACClient — SpatioTemporal Asset Catalog connector.
 *
 * Searches any STAC-compliant catalog (e.g. Planetary Computer, Element 84,
 * Radiant Earth) and normalizes items into the shared CatalogItem contract.
 *
 * Implements:
 *   - /search POST (STAC API - Items)
 *   - Bounding-box, temporal, collection, CQL2 filters
 *   - Pagination via "next" link relation
 *   - Retry with exponential back-off for transient failures
 *   - AbortSignal propagation for cancellable requests
 */

import {
  type BBox,
  type CatalogAsset,
  type CatalogItem,
  type CatalogSearchResult,
  DEFAULT_RETRY,
  type RetryConfig,
  type STACSearchParams,
  type TimeInterval,
} from './types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Sleep with abort support. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

/** Compute delay with full-jitter exponential back-off. */
function backoffDelay(attempt: number, cfg: RetryConfig): number {
  const exp = Math.min(cfg.baseDelayMs * 2 ** attempt, cfg.maxDelayMs);
  return Math.round(Math.random() * exp);
}

/** Fetch with retry. Returns parsed JSON. */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  cfg: RetryConfig,
): Promise<unknown> {
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
    if (res.ok) return res.json() as Promise<unknown>;
    if (!cfg.retryableStatuses.includes(res.status)) {
      throw new Error(
        `STAC HTTP ${res.status}: ${res.statusText} — ${url}`,
      );
    }
    lastError = new Error(`STAC HTTP ${res.status}`);
    if (attempt < cfg.maxRetries) {
      await sleep(backoffDelay(attempt, cfg), init.signal ?? undefined);
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Raw STAC JSON shape (minimal; only what we touch)
// ---------------------------------------------------------------------------

interface STACAssetRaw {
  href: string;
  type?: string;
  title?: string;
  roles?: string[];
  [k: string]: unknown;
}

interface STACItemRaw {
  id: string;
  collection?: string;
  bbox?: number[];
  geometry?: GeoJSON.Geometry | null;
  properties: Record<string, unknown>;
  assets?: Record<string, STACAssetRaw>;
  links?: Array<{ rel: string; href: string; [k: string]: unknown }>;
}

interface STACSearchResponseRaw {
  type: string;
  features: STACItemRaw[];
  links?: Array<{ rel: string; href: string; [k: string]: unknown }>;
  context?: { matched?: number; returned?: number };
  numberMatched?: number;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeBBox(raw: number[] | undefined): BBox {
  if (raw && raw.length >= 4) return [raw[0], raw[1], raw[2], raw[3]];
  return [0, 0, 0, 0];
}

function normalizeDatetime(props: Record<string, unknown>): TimeInterval | string {
  const dt = props.datetime as string | null | undefined;
  const start = props.start_datetime as string | undefined;
  const end = props.end_datetime as string | undefined;
  if (start && end) return { start, end };
  return dt ?? '';
}

function normalizeAssets(
  raw: Record<string, STACAssetRaw> | undefined,
): CatalogAsset[] {
  if (!raw) return [];
  return Object.entries(raw).map(([key, a]) => ({
    key,
    title: a.title ?? key,
    href: a.href,
    mediaType: a.type ?? 'application/octet-stream',
    extra: { roles: a.roles, ...stripKnown(a) },
  }));
}

function stripKnown(a: STACAssetRaw): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { href, type, title, roles, ...rest } = a;
  return rest;
}

function normalizeItem(raw: STACItemRaw, provider: string): CatalogItem {
  const props = raw.properties ?? {};
  const cloudCover = typeof props['eo:cloud_cover'] === 'number'
    ? (props['eo:cloud_cover'] as number)
    : null;
  const gsd = typeof props.gsd === 'number' ? (props.gsd as number) : null;
  const selfLink = raw.links?.find((l) => l.rel === 'self')?.href;

  return {
    id: raw.id,
    collection: raw.collection ?? (props.collection as string) ?? '',
    provider,
    bbox: normalizeBBox(raw.bbox),
    datetime: normalizeDatetime(props),
    crs: (props['proj:epsg'] != null ? `EPSG:${props['proj:epsg']}` : 'EPSG:4326'),
    assets: normalizeAssets(raw.assets),
    geometry: raw.geometry ?? null,
    properties: props,
    ...(cloudCover != null ? { cloudCover } : {}),
    ...(gsd != null ? { gsd } : {}),
    ...(selfLink ? { selfLink } : {}),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Format a `TimeInterval` as the STAC datetime string
 * `"start/end"` (ISO-8601 with `/` separator).
 */
export function formatDatetime(dt: TimeInterval): string {
  return `${dt.start}/${dt.end}`;
}

export interface STACClientOptions {
  retry?: Partial<RetryConfig>;
  signal?: AbortSignal;
  /** Provider label used in normalized items (default "stac") */
  providerLabel?: string;
}

/**
 * Search a STAC API catalog.
 *
 * @example
 * ```ts
 * const result = await stacSearch({
 *   endpoint: 'https://planetarycomputer.microsoft.com/api/stac/v1',
 *   collections: ['sentinel-2-l2a'],
 *   bbox: [28.5, 40.8, 29.3, 41.3],
 *   datetime: { start: '2024-06-01T00:00:00Z', end: '2024-06-30T23:59:59Z' },
 *   limit: 10,
 * });
 * ```
 */
export async function stacSearch(
  params: STACSearchParams,
  opts: STACClientOptions = {},
): Promise<CatalogSearchResult> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY, ...opts.retry };
  const provider = opts.providerLabel ?? 'stac';

  const body = buildSearchBody(params);

  const url = `${params.endpoint.replace(/\/+$/, '')}/search`;

  const raw = (await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/geo+json' },
      body: JSON.stringify(body),
      ...(opts.signal ? { signal: opts.signal } : {}),
    },
    cfg,
  )) as STACSearchResponseRaw;

  const items = (raw.features ?? []).map((f) => normalizeItem(f, provider));
  const matched =
    raw.numberMatched ??
    raw.context?.matched ??
    null;
  const nextLink = raw.links?.find((l) => l.rel === 'next');
  const nextToken = nextLink?.href ?? (nextLink as unknown as Record<string, unknown>)?.body as string | null ?? null;

  return { items, matched, nextToken };
}

/**
 * Fetch the next page given a `nextToken` returned by a previous search.
 */
export async function stacSearchNext(
  params: STACSearchParams,
  nextToken: string,
  opts: STACClientOptions = {},
): Promise<CatalogSearchResult> {
  // If nextToken is a full URL (OGC-style), follow it directly.
  if (nextToken.startsWith('http')) {
    const cfg: RetryConfig = { ...DEFAULT_RETRY, ...opts.retry };
    const provider = opts.providerLabel ?? 'stac';
    const raw = (await fetchWithRetry(
      nextToken,
      { method: 'GET', ...(opts.signal ? { signal: opts.signal } : {}) },
      cfg,
    )) as STACSearchResponseRaw;

    const items = (raw.features ?? []).map((f) => normalizeItem(f, provider));
    const matched = raw.numberMatched ?? raw.context?.matched ?? null;
    const next = raw.links?.find((l) => l.rel === 'next');
    return {
      items,
      matched,
      nextToken: next?.href ?? null,
    };
  }

  // Otherwise treat as an opaque token and re-issue the search.
  return stacSearch({ ...params, token: nextToken }, opts);
}

/**
 * Convenience: collect all pages up to `maxItems` items.
 */
export async function stacSearchAll(
  params: STACSearchParams,
  opts: STACClientOptions & { maxItems?: number } = {},
): Promise<CatalogItem[]> {
  const maxItems = opts.maxItems ?? 500;
  const collected: CatalogItem[] = [];
  let result = await stacSearch(params, opts);
  collected.push(...result.items);

  while (result.nextToken && collected.length < maxItems) {
    result = await stacSearchNext(params, result.nextToken, opts);
    collected.push(...result.items);
  }
  return collected.slice(0, maxItems);
}

/**
 * Fetch a single STAC item by its direct self-link URL.
 */
export async function stacGetItem(
  url: string,
  opts: STACClientOptions = {},
): Promise<CatalogItem> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY, ...opts.retry };
  const provider = opts.providerLabel ?? 'stac';
  const raw = (await fetchWithRetry(
    url,
    { method: 'GET', ...(opts.signal ? { signal: opts.signal } : {}) },
    cfg,
  )) as STACItemRaw;

  return normalizeItem(raw, provider);
}

// ---------------------------------------------------------------------------
// Search body builder
// ---------------------------------------------------------------------------

function buildSearchBody(p: STACSearchParams): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (p.collections?.length) body.collections = p.collections;
  if (p.bbox) body.bbox = p.bbox;
  if (p.datetime) body.datetime = formatDatetime(p.datetime);
  if (p.limit) body.limit = p.limit;
  if (p.query && Object.keys(p.query).length) body.query = p.query;
  if (p.fields) body.fields = p.fields;
  if (p.sortby?.length) body.sortby = p.sortby;
  if (p.token) body.token = p.token;
  return body;
}
