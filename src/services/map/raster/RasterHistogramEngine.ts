/**
 * Prompt 45 — Pure raster histogram + band stats engine.
 * Worker-safe: no DOM, no async I/O. All functions are pure.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface HistogramBin {
  /** Left edge of the bin (inclusive). */
  min: number;
  /** Right edge of the bin (exclusive for all but the last bin). */
  max: number;
  /** Centre value for display. */
  center: number;
  /** Pixel count in this bin (noData excluded). */
  count: number;
}

export interface RasterBandStats {
  /** Minimum valid pixel value (noData excluded). */
  min: number;
  /** Maximum valid pixel value (noData excluded). */
  max: number;
  /** Mean valid pixel value (noData excluded). */
  mean: number;
  /** How many pixels matched the noData value. */
  noDataCount: number;
  /** Total pixels sampled (including noData). */
  sampleCount: number;
  /** Valid pixel count (sampleCount − noDataCount). */
  validCount: number;
}

export interface BandHistogramResult {
  stats: RasterBandStats;
  bins: HistogramBin[];
  binCount: number;
  /** Sampled pixel count used for the histogram (== stats.validCount). */
  sampledCount: number;
}

/* ------------------------------------------------------------------ */
/*  computeBandStats                                                    */
/* ------------------------------------------------------------------ */

/** noData equality with float tolerance. */
function isNoData(value: number, noData: number | null): boolean {
  if (noData === null) return false;
  if (Number.isNaN(noData)) return Number.isNaN(value);
  return Math.abs(value - noData) < 1e-10;
}

/**
 * Compute min/max/mean for a TypedArray band sample.
 * noData pixels are excluded from all statistics.
 */
export function computeBandStats(
  samples: ArrayLike<number>,
  noData: number | null,
): RasterBandStats {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let validCount = 0;
  let noDataCount = 0;
  const total = samples.length;

  for (let i = 0; i < total; i++) {
    const v = samples[i];
    if (isNoData(v, noData)) {
      noDataCount++;
      continue;
    }
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
    validCount++;
  }

  if (validCount === 0) {
    return { min: 0, max: 0, mean: 0, noDataCount, sampleCount: total, validCount: 0 };
  }

  return {
    min,
    max,
    mean: sum / validCount,
    noDataCount,
    sampleCount: total,
    validCount,
  };
}

/* ------------------------------------------------------------------ */
/*  computeHistogram                                                    */
/* ------------------------------------------------------------------ */

/**
 * Build a `binCount`-bin histogram from a sampled band array.
 * noData pixels are excluded — bin counts reflect only valid pixels.
 *
 * Invariant: sum of all bin.count == stats.validCount.
 */
export function computeHistogram(
  samples: ArrayLike<number>,
  noData: number | null,
  binCount: number = 32,
  overrideMin?: number,
  overrideMax?: number,
): BandHistogramResult {
  const stats = computeBandStats(samples, noData);

  if (stats.validCount === 0) {
    const emptyBins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
      min: i,
      max: i + 1,
      center: i + 0.5,
      count: 0,
    }));
    return { stats, bins: emptyBins, binCount, sampledCount: 0 };
  }

  const rangeMin = overrideMin !== undefined ? overrideMin : stats.min;
  const rangeMax = overrideMax !== undefined ? overrideMax : stats.max;
  const range = rangeMax - rangeMin;

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => {
    const binMin = rangeMin + (i / binCount) * range;
    const binMax = rangeMin + ((i + 1) / binCount) * range;
    return { min: binMin, max: binMax, center: (binMin + binMax) / 2, count: 0 };
  });

  const total = samples.length;
  for (let i = 0; i < total; i++) {
    const v = samples[i];
    if (isNoData(v, noData)) continue;

    // Clamp to [0, binCount-1]
    let idx =
      range === 0
        ? 0
        : Math.floor(((v - rangeMin) / range) * binCount);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    bins[idx].count++;
  }

  return {
    stats,
    bins,
    binCount,
    sampledCount: stats.validCount,
  };
}

/* ------------------------------------------------------------------ */
/*  Color ramp utilities                                                */
/* ------------------------------------------------------------------ */

export type ColorRampId = "viridis" | "inferno" | "rdylgn" | "greys" | "plasma";

/** CSS color stops for each ramp — low to high. */
export const COLOR_RAMP_STOPS: Record<ColorRampId, [string, string][]> = {
  viridis: [
    ["0%", "#440154"],
    ["25%", "#31688e"],
    ["50%", "#35b779"],
    ["75%", "#90d743"],
    ["100%", "#fde725"],
  ],
  inferno: [
    ["0%", "#000004"],
    ["25%", "#57106e"],
    ["50%", "#bc3754"],
    ["75%", "#f98e09"],
    ["100%", "#fcffa4"],
  ],
  rdylgn: [
    ["0%", "#d73027"],
    ["25%", "#fdae61"],
    ["50%", "#ffffbf"],
    ["75%", "#a6d96a"],
    ["100%", "#1a9850"],
  ],
  greys: [
    ["0%", "#ffffff"],
    ["100%", "#252525"],
  ],
  plasma: [
    ["0%", "#0d0887"],
    ["25%", "#7e03a8"],
    ["50%", "#cc4778"],
    ["75%", "#f89540"],
    ["100%", "#f0f921"],
  ],
};

export const DEFAULT_COLOR_RAMP: ColorRampId = "viridis";

/** Build a CSS linear-gradient string from a ramp definition. */
export function buildRampGradient(rampId: ColorRampId): string {
  const stops = COLOR_RAMP_STOPS[rampId];
  const stopStr = stops.map(([pct, color]) => `${color} ${pct}`).join(", ");
  return `linear-gradient(to right, ${stopStr})`;
}
