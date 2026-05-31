/**
 * Prompt 45 — GeoTIFF metadata extraction and sampled raster read.
 *
 * Uses the `geotiff` npm package via dynamic import to keep the 4MB+ bundle
 * off the critical boot path.
 *
 * Anti-patterns avoided:
 *   - Never reads the full raster pixel array on the main thread.
 *   - Sampling is done at reduced resolution (≤ SAMPLE_PIXELS pixels).
 *   - noData is extracted and propagated; rendering without it emits a caveat.
 */

import type { RasterBandStats } from "./RasterHistogramEngine";
import type { ColorRampId } from "./RasterHistogramEngine";
import { DEFAULT_COLOR_RAMP } from "./RasterHistogramEngine";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

/** Maximum pixel count to sample per band for histogram/stats. */
export const SAMPLE_PIXELS = 65_536; // 256×256

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface GeoTiffBandInfo {
  index: number; // 0-based
  label: string; // "Band 1", "Red", "NDVI", …
  dtype: string; // "uint8", "float32", …
}

export interface GeoTiffMetadata {
  /** Image pixel dimensions. */
  width: number;
  height: number;
  /** Number of bands (SamplesPerPixel). */
  bandCount: number;
  /** Bands available for inspection. */
  bands: GeoTiffBandInfo[];
  /** GDAL_NODATA value or null if undeclared. */
  noData: number | null;
  /**
   * Geographic bounding box [west, south, east, north] in the native CRS.
   * null when ModelTiepoint / Pixel scale tags are absent.
   */
  bbox: [number, number, number, number] | null;
  /**
   * EPSG code extracted from GeoKeyDirectory, e.g. "EPSG:4326".
   * null when no geo-key is present.
   */
  epsgCode: string | null;
  /** Whether the raster was sampled (true) or the full extent is small enough. */
  sampled: boolean;
  /** Sample resolution used for histogram/stats. */
  sampleWidth: number;
  sampleHeight: number;
  /** File size hint in bytes (may be undefined). */
  sizeBytes?: number;
}

export interface GeoTiffBandSample {
  bandIndex: number;
  /** Sampled pixel values — never the full raster. */
  samples: Float64Array;
  stats: RasterBandStats;
}

export interface GeoTiffInspection {
  metadata: GeoTiffMetadata;
  /** One sample per band. */
  bandSamples: GeoTiffBandSample[];
  /** Caveats: missing CRS, undeclared noData, sampled vs full, etc. */
  caveats: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Determine EPSG code from GeoTIFF GeoKeys (GTCitationGeoKey / ProjectedCRSGeoKey / GeographicTypeGeoKey). */
function extractEpsgFromGeoKeys(geoKeys: Record<string, unknown> | null): string | null {
  if (!geoKeys) return null;

  // ProjectedCSTypeGeoKey = 3072
  const proj = geoKeys[3072] as number | undefined;
  if (proj && proj > 0 && proj < 32768) return `EPSG:${proj}`;

  // GeographicTypeGeoKey = 2048
  const geog = geoKeys[2048] as number | undefined;
  if (geog && geog > 0 && geog < 32768) return `EPSG:${geog}`;

  return null;
}

function bandLabel(index: number, bandCount: number): string {
  if (bandCount === 1) return "Band 1";
  if (bandCount === 3) {
    return ["Red", "Green", "Blue"][index] ?? `Band ${index + 1}`;
  }
  if (bandCount === 4) {
    return ["Red", "Green", "Blue", "Alpha"][index] ?? `Band ${index + 1}`;
  }
  return `Band ${index + 1}`;
}

/** Compute sample dimensions so sampled pixel count ≤ SAMPLE_PIXELS. */
function sampleDimensions(
  width: number,
  height: number,
): { sampleWidth: number; sampleHeight: number; sampled: boolean } {
  const total = width * height;
  if (total <= SAMPLE_PIXELS) {
    return { sampleWidth: width, sampleHeight: height, sampled: false };
  }
  const ratio = Math.sqrt(SAMPLE_PIXELS / total);
  const sampleWidth = Math.max(1, Math.round(width * ratio));
  const sampleHeight = Math.max(1, Math.round(height * ratio));
  return { sampleWidth, sampleHeight, sampled: true };
}

/* ------------------------------------------------------------------ */
/*  parseGeoTiffArrayBuffer                                             */
/* ------------------------------------------------------------------ */

/**
 * Parse a GeoTIFF ArrayBuffer into metadata + per-band sampled stats.
 * Heavy work (pixel reads) is limited to SAMPLE_PIXELS per band.
 *
 * Call from a worker or after a user file pick — NOT on the hot path.
 */
export async function parseGeoTiffArrayBuffer(
  buffer: ArrayBuffer,
  sizeBytes?: number,
): Promise<GeoTiffInspection> {
  const { fromArrayBuffer } = (await import("geotiff")) as typeof import("geotiff");
  const { computeBandStats } = await import("./RasterHistogramEngine");

  const tiff = await fromArrayBuffer(buffer);
  const image = await tiff.getImage();

  const width = image.getWidth();
  const height = image.getHeight();
  const bandCount = image.getSamplesPerPixel();
  const noData = image.getGDALNoData();
  const bbox = image.getBoundingBox() as [number, number, number, number] | null;

  // Extract EPSG from geo keys
  let epsgCode: string | null = null;
  try {
    const geoKeys = image.getGeoKeys() as Record<string, unknown> | null;
    epsgCode = extractEpsgFromGeoKeys(geoKeys);
  } catch {
    // geo keys absent
  }

  const { sampleWidth, sampleHeight, sampled } = sampleDimensions(width, height);

  const bands: GeoTiffBandInfo[] = Array.from({ length: bandCount }, (_, i) => ({
    index: i,
    label: bandLabel(i, bandCount),
    dtype: "float32",
  }));

  const caveats: string[] = [];

  if (!epsgCode) {
    caveats.push("GeoTIFF does not declare a CRS (no GeoKeyDirectory or EPSG code found); spatial analysis requires CRS review.");
  }
  if (noData === null) {
    caveats.push("No GDAL_NODATA value declared; rendering and statistics assume all pixels are valid.");
  }
  if (sampled) {
    caveats.push(
      `Raster statistics are based on a ${sampleWidth}×${sampleHeight} sample (of ${width}×${height}); full-resolution stats require a worker pass.`,
    );
  }

  // Read sampled pixels for each band
  const bandSamples: GeoTiffBandSample[] = [];

  for (let b = 0; b < bandCount; b++) {
    let pixelValues: Float64Array;

    try {
      const result = await image.readRasters({
        samples: [b],
        width: sampleWidth,
        height: sampleHeight,
        interleave: false,
      });
      // geotiff returns TypedArray[] per band when interleave=false
      const raw = Array.isArray(result) ? result[0] : (result as ArrayLike<number>);
      pixelValues = new Float64Array(raw.length);
      for (let i = 0; i < raw.length; i++) pixelValues[i] = raw[i];
    } catch {
      pixelValues = new Float64Array(0);
    }

    const stats = computeBandStats(pixelValues, noData);

    bandSamples.push({
      bandIndex: b,
      samples: pixelValues,
      stats,
    });
  }

  const metadata: GeoTiffMetadata = {
    width,
    height,
    bandCount,
    bands,
    noData,
    bbox,
    epsgCode,
    sampled,
    sampleWidth,
    sampleHeight,
    sizeBytes,
  };

  return { metadata, bandSamples, caveats };
}

/* ------------------------------------------------------------------ */
/*  Raster layer config for map rendering                               */
/* ------------------------------------------------------------------ */

export interface RasterLayerRenderConfig {
  selectedBandIndex: number;
  colorRamp: ColorRampId;
  /** Opacity 0–1 */
  opacity: number;
  /** Override min for ramp mapping (null = use stats.min). */
  minOverride: number | null;
  /** Override max for ramp mapping (null = use stats.max). */
  maxOverride: number | null;
}

export function defaultRasterRenderConfig(): RasterLayerRenderConfig {
  return {
    selectedBandIndex: 0,
    colorRamp: DEFAULT_COLOR_RAMP,
    opacity: 0.85,
    minOverride: null,
    maxOverride: null,
  };
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rasterPreviewColor(value: number, min: number, max: number): string {
  const span = max - min;
  const t = span > 0 ? Math.max(0, Math.min(1, (value - min) / span)) : 0.5;
  const r = clampByte(24 + t * 184);
  const g = clampByte(84 + Math.sin(t * Math.PI) * 112);
  const b = clampByte(112 + (1 - t) * 96);
  return `rgb(${r} ${g} ${b})`;
}

function isNoDataValue(value: number, noData: number | null): boolean {
  if (noData === null) return false;
  if (Number.isNaN(noData)) return Number.isNaN(value);
  return Math.abs(value - noData) < 1e-10;
}

export function createGeoTiffSampleImageDataUrl(
  inspection: GeoTiffInspection,
  bandIndex = 0,
  maxDimension = 64,
): string {
  const band = inspection.bandSamples.find((entry) => entry.bandIndex === bandIndex)
    ?? inspection.bandSamples[0];
  const width = inspection.metadata.sampleWidth;
  const height = inspection.metadata.sampleHeight;
  const cellStepX = Math.max(1, Math.ceil(width / Math.max(1, maxDimension)));
  const cellStepY = Math.max(1, Math.ceil(height / Math.max(1, maxDimension)));
  const cols = Math.ceil(width / cellStepX);
  const rows = Math.ceil(height / cellStepY);
  const stats = band?.stats ?? { min: 0, max: 1, mean: 0, noDataCount: 0, sampleCount: 0, validCount: 0 };
  const samples = band?.samples ?? new Float64Array(0);
  const noData = inspection.metadata.noData;
  const rects: string[] = [];

  for (let row = 0; row < rows; row += 1) {
    const sampleY = Math.min(height - 1, row * cellStepY);
    for (let col = 0; col < cols; col += 1) {
      const sampleX = Math.min(width - 1, col * cellStepX);
      const value = samples[sampleY * width + sampleX] ?? Number.NaN;
      const fill = Number.isFinite(value) && !isNoDataValue(value, noData)
        ? rasterPreviewColor(value, stats.min, stats.max)
        : "rgb(37 44 58)";
      const opacity = Number.isFinite(value) && !isNoDataValue(value, noData) ? "1" : "0.28";
      rects.push(`<rect x="${col}" y="${row}" width="1" height="1" fill="${fill}" fill-opacity="${opacity}"/>`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols}" height="${rows}" viewBox="0 0 ${cols} ${rows}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
