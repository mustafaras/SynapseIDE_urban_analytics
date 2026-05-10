/**
 * Shared catalog and connector contracts for the data ecosystem.
 *
 * These types decouple connectors (STAC, Sentinel, Planetary Computer, WFS …)
 * from consuming analytics / UI layers, establishing a stable internal schema
 * that can evolve independently from upstream API changes.
 */

// ---------------------------------------------------------------------------
// Geometry primitives (GeoJSON-aligned)
// ---------------------------------------------------------------------------

/** [west, south, east, north] — standard GeoJSON bbox ordering. */
export type BBox = [west: number, south: number, east: number, north: number];

/** ISO-8601 time interval, e.g. "2023-01-01T00:00:00Z/2023-12-31T23:59:59Z" */
export type TimeInterval = { start: string; end: string };

// ---------------------------------------------------------------------------
// Catalog item — the internal normalized representation
// ---------------------------------------------------------------------------

export interface CatalogAsset {
  /** Machine-readable key, e.g. "visual", "B04", "ndvi" */
  key: string;
  /** Human-friendly label */
  title: string;
  /** Direct URL to the asset */
  href: string;
  /** MIME type, e.g. "image/tiff; application=geotiff; profile=cloud-optimized" */
  mediaType: string;
  /** Extra properties from the source (roles, eo:bands, etc.) */
  extra: Record<string, unknown>;
}

export interface CatalogItem {
  /** Unique identifier within the catalog */
  id: string;
  /** Source collection or dataset name */
  collection: string;
  /** Upstream provider key (e.g. "stac", "sentinel-hub", "planetary-computer") */
  provider: string;
  /** Spatial extent in [west, south, east, north] */
  bbox: BBox;
  /** Acquisition or validity time window */
  datetime: TimeInterval | string;
  /** Cloud cover percentage if available (0–100) */
  cloudCover?: number;
  /** Spatial resolution in meters if known */
  gsd?: number;
  /** CRS string (EPSG code) */
  crs: string;
  /** Available downloadable/streamable assets */
  assets: CatalogAsset[];
  /** Geometry as GeoJSON (typically a polygon footprint) */
  geometry: GeoJSON.Geometry | null;
  /** Arbitrary additional properties from the source */
  properties: Record<string, unknown>;
  /** Link back to the raw source item */
  selfLink?: string;
}

export interface CatalogSearchResult {
  items: CatalogItem[];
  /** Total matched items on the server (may exceed items.length) */
  matched: number | null;
  /** Opaque cursor for pagination */
  nextToken: string | null;
}

// ---------------------------------------------------------------------------
// STAC-specific search parameters
// ---------------------------------------------------------------------------

export interface STACSearchParams {
  /** STAC API root URL */
  endpoint: string;
  /** Collection IDs to search within */
  collections?: string[];
  /** Spatial filter */
  bbox?: BBox;
  /** Temporal filter */
  datetime?: TimeInterval;
  /** Maximum items per page */
  limit?: number;
  /** CQL2 or free-form query filters */
  query?: Record<string, unknown>;
  /** Fields to include/exclude */
  fields?: { include?: string[]; exclude?: string[] };
  /** Sort specification */
  sortby?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  /** Pagination token */
  token?: string;
}

// ---------------------------------------------------------------------------
// COG read parameters
// ---------------------------------------------------------------------------

/** Pixel window: [xOffset, yOffset, width, height] */
export type PixelWindow = [x: number, y: number, w: number, h: number];

export interface COGReadParams {
  /** URL of the COG asset */
  url: string;
  /** Optional overview level (0 = full res) */
  overviewLevel?: number;
  /** Optional pixel window to read */
  window?: PixelWindow;
  /** Band indices to read (1-based); default = all */
  bands?: number[];
  /** Optional AbortSignal for cancellation */
  signal?: AbortSignal;
}

export interface COGMetadata {
  width: number;
  height: number;
  bandCount: number;
  /** Data type per band, e.g. "uint8", "float32" */
  dtype: string;
  /** TIFF compression code from the primary IFD */
  compression: number;
  /** EPSG code or WKT */
  crs: string;
  /** [originX, pixelWidth, rotX, originY, rotY, pixelHeight] */
  transform: [number, number, number, number, number, number];
  /** Bounding box derived from transform + dimensions */
  bbox: BBox;
  /** Number of overview levels */
  overviewCount: number;
  /** Tile size in pixels [tileWidth, tileHeight] */
  tileSize: [number, number];
  /** NoData value per band */
  noData: (number | null)[];
}

export interface COGReadResult {
  /** Pixel data — one typed array per band */
  data: Float64Array[];
  /** Width of the returned tile/window */
  width: number;
  /** Height of the returned tile/window */
  height: number;
  /** Metadata of the full raster */
  metadata: COGMetadata;
}

// ---------------------------------------------------------------------------
// Sentinel Hub connector parameters
// ---------------------------------------------------------------------------

/** Sentinel Hub OAuth credentials. */
export interface SentinelHubCredentials {
  clientId: string;
  clientSecret: string;
  /** Override token endpoint (default Copernicus Data Space). */
  tokenUrl?: string;
}

/** A cached bearer token with its expiry. */
export interface SentinelHubToken {
  accessToken: string;
  /** Unix-ms when the token expires. */
  expiresAt: number;
}

/** Evalscript-based processing request parameters. */
export interface SentinelHubProcessParams {
  /** Bounding box in [west, south, east, north]. */
  bbox: BBox;
  /** CRS for the bbox (default EPSG:4326). */
  crs?: string;
  /** Temporal filter. */
  datetime: TimeInterval;
  /** Evalscript source code (custom). */
  evalscript: string;
  /** Output width in pixels. */
  width: number;
  /** Output height in pixels. */
  height: number;
  /** Maximum cloud cover percentage (0–100, default 100). */
  maxCloudCover?: number;
  /** Data collection identifier (default "sentinel-2-l2a"). */
  collection?: string;
  /** Output format MIME type (default "image/tiff"). */
  format?: string;
}

/** Result returned by the Process API wrapper. */
export interface SentinelHubProcessResult {
  /** Raw pixel data as a flat Float64Array per output band. */
  data: Float64Array[];
  /** Width of the returned raster in pixels. */
  width: number;
  /** Height of the returned raster in pixels. */
  height: number;
  /** Number of bands in the output. */
  bandCount: number;
  /** Content type of the raw response (e.g. "image/tiff"). */
  contentType: string;
  /** Bounding box of the request area. */
  bbox: BBox;
  /** Temporal window of the request. */
  datetime: TimeInterval;
}

/** Parameters for band-specific retrieval helpers (B04, B08, NDVI…). */
export interface SentinelHubBandParams {
  bbox: BBox;
  datetime: TimeInterval;
  width: number;
  height: number;
  maxCloudCover?: number;
  collection?: string;
}

// ---------------------------------------------------------------------------
// Retry / backoff configuration
// ---------------------------------------------------------------------------

export interface RetryConfig {
  /** Maximum number of retries (default 3) */
  maxRetries: number;
  /** Base delay in ms (exponential backoff: delay * 2^attempt) */
  baseDelayMs: number;
  /** Maximum delay cap in ms */
  maxDelayMs: number;
  /** HTTP status codes eligible for retry */
  retryableStatuses: number[];
}

export const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 10_000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};
