/**
 * EmergingHotSpots - space-time hot spot mining.
 *
 * Extends per-time-step Getis-Ord Gi* results into a transparent
 * emerging hot spot classification using Mann-Kendall trend testing on
 * each location's Gi* z-score trajectory.
 *
 * Category scheme follows the strengthening plan:
 *   - new
 *   - consecutive
 *   - intensifying
 *   - persistent
 *   - diminishing
 *   - sporadic
 *   - oscillating
 *   - historical
 *
 * Locations that do not satisfy any of the eight categories are
 * returned with a null category and an explicit reason in the
 * diagnostics. This keeps the classifier transparent without inventing
 * a ninth named class outside the plan.
 */

import { giStar, type HotSpotResult } from "../autocorrelation/GetisOrdGi";
import type { HotSpotConfidence, SpatialWeightsMatrix } from "../types";

const Z_99 = 2.5758293035489004;
const Z_95 = 1.959963984540054;
const Z_90 = 1.6448536269514729;
const DEFAULT_SIGNIFICANCE = 0.05;
const DEFAULT_PERSISTENT_SHARE = 0.9;

export type EmergingHotSpotCategory =
  | "new"
  | "consecutive"
  | "intensifying"
  | "persistent"
  | "diminishing"
  | "sporadic"
  | "oscillating"
  | "historical";

export type EmergingTrendDirection = "up" | "down" | "flat";

export interface EmergingHotSpotTimeStepInput {
  key: string | number;
  label?: string;
  values: ArrayLike<number>;
}

export interface MannKendallResult {
  sampleSize: number;
  s: number;
  variance: number;
  zScore: number;
  pValue: number;
  tau: number;
  alpha: number;
  trend: EmergingTrendDirection;
}

export interface EmergingHotSpotSeriesStep {
  key: string;
  label: string;
  value: number;
  giStar: number;
  zScore: number;
  pValue: number;
  confidence: HotSpotConfidence;
  isHotSpot: boolean;
  isColdSpot: boolean;
}

export interface EmergingHotSpotDiagnostics {
  timeStepCount: number;
  hotCount: number;
  coldCount: number;
  hotShare: number;
  coldShare: number;
  hotRunCount: number;
  coldRunCount: number;
  longestHotRun: number;
  longestColdRun: number;
  consecutiveHotEnding: number;
  consecutiveColdEnding: number;
  everHotSpot: boolean;
  everColdSpot: boolean;
  finalConfidence: HotSpotConfidence;
  finalIsHotSpot: boolean;
  finalIsColdSpot: boolean;
  finalIsSignificant: boolean;
  strongestHotZScore: number | null;
  strongestColdZScore: number | null;
  mannKendall: MannKendallResult;
  classificationReason: string;
}

export interface EmergingHotSpotLocationResult {
  index: number;
  category: EmergingHotSpotCategory | null;
  categoryLabel: string | null;
  categoryColor: string | null;
  series: EmergingHotSpotSeriesStep[];
  diagnostics: EmergingHotSpotDiagnostics;
}

export interface EmergingHotSpotTimeStepResult {
  key: string;
  label: string;
  hotSpotResult: HotSpotResult;
}

export interface EmergingHotSpotLegendEntry {
  category: EmergingHotSpotCategory;
  label: string;
  color: string;
  description: string;
}

export interface EmergingHotSpotResult {
  timeSteps: EmergingHotSpotTimeStepResult[];
  locations: EmergingHotSpotLocationResult[];
  summary: Record<EmergingHotSpotCategory, number>;
  unclassifiedCount: number;
  legend: EmergingHotSpotLegendEntry[];
  featureCount: number;
  timeStepCount: number;
  significanceThreshold: number;
  trendAlpha: number;
  persistentShare: number;
}

export interface EmergingHotSpotAnalysisOptions {
  significanceThreshold?: number;
  trendAlpha?: number;
  selfWeight?: boolean;
  persistentShare?: number;
}

export interface TrendMapProperties {
  index: number;
  emerging_hotspot_category: EmergingHotSpotCategory | null;
  emerging_hotspot_label: string | null;
  emerging_hotspot_reason: string;
  mann_kendall_trend: EmergingTrendDirection;
  mann_kendall_z: number;
  mann_kendall_p: number;
  mann_kendall_tau: number;
  hot_step_count: number;
  cold_step_count: number;
  hot_step_share: number;
  cold_step_share: number;
  consecutive_hot_steps_ending: number;
  final_hotspot_confidence: HotSpotConfidence;
}

const EMERGING_HOT_SPOT_LEGEND: EmergingHotSpotLegendEntry[] = [
  {
    category: "new",
    label: "New Hot Spot",
    color: "#F59E0B",
    description: "The latest interval is the first statistically significant hot spot.",
  },
  {
    category: "consecutive",
    label: "Consecutive Hot Spot",
    color: "#FB923C",
    description: "Recent hot spots form one uninterrupted run, but do not cover 90% of the series.",
  },
  {
    category: "intensifying",
    label: "Intensifying Hot Spot",
    color: "#DC2626",
    description: "Hot spot in at least 90% of intervals with a significant upward Gi* trend.",
  },
  {
    category: "persistent",
    label: "Persistent Hot Spot",
    color: "#B91C1C",
    description: "Hot spot in at least 90% of intervals with no significant Gi* trend.",
  },
  {
    category: "diminishing",
    label: "Diminishing Hot Spot",
    color: "#2563EB",
    description: "Hot spot in at least 90% of intervals with a significant downward Gi* trend.",
  },
  {
    category: "sporadic",
    label: "Sporadic Hot Spot",
    color: "#8B5CF6",
    description: "Hot spots recur intermittently without any significant cold spot history.",
  },
  {
    category: "oscillating",
    label: "Oscillating Hot Spot",
    color: "#14B8A6",
    description: "The latest interval is a hot spot and earlier intervals included significant cold spots.",
  },
  {
    category: "historical",
    label: "Historical Hot Spot",
    color: "#6B7280",
    description: "Hot spot in at least 90% of intervals, but not in the latest interval.",
  },
];

function normalCDF(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1 + sign * y);
}

function twoTailedP(z: number): number {
  return 2 * (1 - normalCDF(Math.abs(z)));
}

function toConfidence(zScore: number): HotSpotConfidence {
  const absZ = Math.abs(zScore);
  if (absZ >= Z_99) return zScore > 0 ? "hot-99" : "cold-99";
  if (absZ >= Z_95) return zScore > 0 ? "hot-95" : "cold-95";
  if (absZ >= Z_90) return zScore > 0 ? "hot-90" : "cold-90";
  return "not-significant";
}

function inferStepLabel(step: EmergingHotSpotTimeStepInput): string {
  if (step.label && step.label.trim().length > 0) {
    return step.label;
  }

  const key = String(step.key);
  const numericKey = Number(key);
  if (Number.isInteger(numericKey) && key.trim().length > 0) {
    return `Step ${numericKey}`;
  }

  return key;
}

function countRuns(flags: boolean[]): number {
  let runs = 0;
  let previous = false;

  flags.forEach((flag) => {
    if (flag && !previous) {
      runs += 1;
    }
    previous = flag;
  });

  return runs;
}

function longestRun(flags: boolean[]): number {
  let longest = 0;
  let current = 0;

  flags.forEach((flag) => {
    if (flag) {
      current += 1;
      if (current > longest) {
        longest = current;
      }
    } else {
      current = 0;
    }
  });

  return longest;
}

function trailingRun(flags: boolean[]): number {
  let count = 0;
  for (let index = flags.length - 1; index >= 0; index -= 1) {
    if (!flags[index]) {
      break;
    }
    count += 1;
  }
  return count;
}

function createEmptySummary(): Record<EmergingHotSpotCategory, number> {
  return {
    new: 0,
    consecutive: 0,
    intensifying: 0,
    persistent: 0,
    diminishing: 0,
    sporadic: 0,
    oscillating: 0,
    historical: 0,
  };
}

function findLegendEntry(
  category: EmergingHotSpotCategory | null,
): EmergingHotSpotLegendEntry | null {
  if (!category) {
    return null;
  }
  return EMERGING_HOT_SPOT_LEGEND.find((entry) => entry.category === category) ?? null;
}

export function mannKendall(
  series: ArrayLike<number>,
  alpha = DEFAULT_SIGNIFICANCE,
): MannKendallResult {
  const values = Array.from(series, (value) => Number(value)).filter((value) => Number.isFinite(value));
  const n = values.length;

  if (n < 2) {
    return {
      sampleSize: n,
      s: 0,
      variance: 0,
      zScore: 0,
      pValue: 1,
      tau: 0,
      alpha,
      trend: "flat",
    };
  }

  let s = 0;
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (values[j] > values[i]) {
        s += 1;
      } else if (values[j] < values[i]) {
        s -= 1;
      }
    }
  }

  const tieCounts = new Map<number, number>();
  values.forEach((value) => {
    tieCounts.set(value, (tieCounts.get(value) ?? 0) + 1);
  });

  let variance = n * (n - 1) * (2 * n + 5);
  tieCounts.forEach((count) => {
    if (count > 1) {
      variance -= count * (count - 1) * (2 * count + 5);
    }
  });
  variance /= 18;

  let zScore = 0;
  if (variance > 0) {
    if (s > 0) {
      zScore = (s - 1) / Math.sqrt(variance);
    } else if (s < 0) {
      zScore = (s + 1) / Math.sqrt(variance);
    }
  }

  const pValue = variance > 0 ? twoTailedP(zScore) : 1;
  const denominator = (n * (n - 1)) / 2;
  const tau = denominator > 0 ? s / denominator : 0;
  const trend =
    pValue <= alpha
      ? zScore > 0
        ? "up"
        : "down"
      : "flat";

  return {
    sampleSize: n,
    s,
    variance,
    zScore,
    pValue,
    tau,
    alpha,
    trend,
  };
}

interface ClassificationResolution {
  category: EmergingHotSpotCategory | null;
  reason: string;
}

export function classifyEmergingHotSpot(
  diagnostics: Omit<EmergingHotSpotDiagnostics, "classificationReason">,
  persistentShare = DEFAULT_PERSISTENT_SHARE,
): ClassificationResolution {
  if (diagnostics.finalIsHotSpot) {
    if (diagnostics.everColdSpot) {
      return {
        category: "oscillating",
        reason: "The latest interval is a hot spot and earlier intervals included significant cold spots.",
      };
    }

    if (diagnostics.hotCount === 1) {
      return {
        category: "new",
        reason: "The latest interval is the first statistically significant hot spot in the series.",
      };
    }

    if (diagnostics.hotShare >= persistentShare) {
      if (diagnostics.mannKendall.trend === "up") {
        return {
          category: "intensifying",
          reason: "Hot spots cover at least 90% of intervals and the Gi* trend is significantly increasing.",
        };
      }
      if (diagnostics.mannKendall.trend === "down") {
        return {
          category: "diminishing",
          reason: "Hot spots cover at least 90% of intervals and the Gi* trend is significantly decreasing.",
        };
      }
      return {
        category: "persistent",
        reason: "Hot spots cover at least 90% of intervals with no significant monotonic Gi* trend.",
      };
    }

    if (diagnostics.consecutiveHotEnding === diagnostics.hotCount) {
      return {
        category: "consecutive",
        reason: "The current hot spot belongs to one uninterrupted hot streak, but the streak does not cover 90% of the series.",
      };
    }

    return {
      category: "sporadic",
      reason: "Hot spots recur intermittently and there is no significant cold spot history.",
    };
  }

  if (diagnostics.hotShare >= persistentShare) {
    return {
      category: "historical",
      reason: "Hot spots cover at least 90% of intervals, but the latest interval is not a hot spot.",
    };
  }

  return {
    category: null,
    reason: "No emerging hot spot category was assigned because the series does not satisfy any planned class definition.",
  };
}

export function buildEmergingHotSpotDiagnostics(
  series: EmergingHotSpotSeriesStep[],
  options: Pick<EmergingHotSpotAnalysisOptions, "trendAlpha" | "persistentShare"> = {},
): EmergingHotSpotDiagnostics {
  if (series.length === 0) {
    throw new RangeError("At least one time step is required to build emerging hot spot diagnostics.");
  }

  const hotFlags = series.map((step) => step.isHotSpot);
  const coldFlags = series.map((step) => step.isColdSpot);
  const hotCount = hotFlags.filter(Boolean).length;
  const coldCount = coldFlags.filter(Boolean).length;
  const timeStepCount = series.length;
  const mannKendallResult = mannKendall(
    series.map((step) => step.zScore),
    options.trendAlpha ?? DEFAULT_SIGNIFICANCE,
  );

  const baseDiagnostics = {
    timeStepCount,
    hotCount,
    coldCount,
    hotShare: hotCount / timeStepCount,
    coldShare: coldCount / timeStepCount,
    hotRunCount: countRuns(hotFlags),
    coldRunCount: countRuns(coldFlags),
    longestHotRun: longestRun(hotFlags),
    longestColdRun: longestRun(coldFlags),
    consecutiveHotEnding: trailingRun(hotFlags),
    consecutiveColdEnding: trailingRun(coldFlags),
    everHotSpot: hotCount > 0,
    everColdSpot: coldCount > 0,
    finalConfidence: series[timeStepCount - 1]!.confidence,
    finalIsHotSpot: series[timeStepCount - 1]!.isHotSpot,
    finalIsColdSpot: series[timeStepCount - 1]!.isColdSpot,
    finalIsSignificant: series[timeStepCount - 1]!.isHotSpot || series[timeStepCount - 1]!.isColdSpot,
    strongestHotZScore: hotCount > 0
      ? Math.max(...series.filter((step) => step.isHotSpot).map((step) => step.zScore))
      : null,
    strongestColdZScore: coldCount > 0
      ? Math.min(...series.filter((step) => step.isColdSpot).map((step) => step.zScore))
      : null,
    mannKendall: mannKendallResult,
  };

  const classification = classifyEmergingHotSpot(
    baseDiagnostics,
    options.persistentShare ?? DEFAULT_PERSISTENT_SHARE,
  );

  return {
    ...baseDiagnostics,
    classificationReason: classification.reason,
  };
}

function assertTimeSteps(
  timeSteps: EmergingHotSpotTimeStepInput[],
  expectedLength: number,
): void {
  if (timeSteps.length < 3) {
    throw new RangeError("Emerging hot spot analysis requires at least 3 time steps.");
  }

  timeSteps.forEach((step, index) => {
    if (step.values.length !== expectedLength) {
      throw new RangeError(
        `Time step ${index} has ${step.values.length} values, but ${expectedLength} were expected.`,
      );
    }
  });
}

export function analyse(
  timeSteps: EmergingHotSpotTimeStepInput[],
  weights: SpatialWeightsMatrix,
  options: EmergingHotSpotAnalysisOptions = {},
): EmergingHotSpotResult {
  assertTimeSteps(timeSteps, weights.n);

  const significanceThreshold = options.significanceThreshold ?? DEFAULT_SIGNIFICANCE;
  const trendAlpha = options.trendAlpha ?? significanceThreshold;
  const persistentShare = options.persistentShare ?? DEFAULT_PERSISTENT_SHARE;

  const timeStepResults = timeSteps.map((step) => ({
    key: String(step.key),
    label: inferStepLabel(step),
    hotSpotResult: giStar(
      step.values,
      weights,
      options.selfWeight === undefined ? {} : { selfWeight: options.selfWeight },
    ),
    values: step.values,
  }));

  const summary = createEmptySummary();
  let unclassifiedCount = 0;

  const locations: EmergingHotSpotLocationResult[] = Array.from({ length: weights.n }, (_, index) => {
    const series: EmergingHotSpotSeriesStep[] = timeStepResults.map((step) => {
      const feature = step.hotSpotResult.featureProperties[index]!;
      const isHotSpot =
        feature.pValue <= significanceThreshold &&
        (feature.confidence === "hot-90" || feature.confidence === "hot-95" || feature.confidence === "hot-99");
      const isColdSpot =
        feature.pValue <= significanceThreshold &&
        (feature.confidence === "cold-90" || feature.confidence === "cold-95" || feature.confidence === "cold-99");

      return {
        key: step.key,
        label: step.label,
        value: Number(step.values[index]),
        giStar: feature.giStar,
        zScore: feature.zScore,
        pValue: feature.pValue,
        confidence: feature.confidence,
        isHotSpot,
        isColdSpot,
      };
    });

    const diagnostics = buildEmergingHotSpotDiagnostics(series, {
      trendAlpha,
      persistentShare,
    });
    const classification = classifyEmergingHotSpot(diagnostics, persistentShare);
    const legendEntry = findLegendEntry(classification.category);

    if (classification.category) {
      summary[classification.category] += 1;
    } else {
      unclassifiedCount += 1;
    }

    return {
      index,
      category: classification.category,
      categoryLabel: legendEntry?.label ?? null,
      categoryColor: legendEntry?.color ?? null,
      series,
      diagnostics: {
        ...diagnostics,
        classificationReason: classification.reason,
      },
    };
  });

  return {
    timeSteps: timeStepResults.map(({ key, label, hotSpotResult }) => ({
      key,
      label,
      hotSpotResult,
    })),
    locations,
    summary,
    unclassifiedCount,
    legend: EMERGING_HOT_SPOT_LEGEND.map((entry) => ({ ...entry })),
    featureCount: weights.n,
    timeStepCount: timeSteps.length,
    significanceThreshold,
    trendAlpha,
    persistentShare,
  };
}

export const analyseEmergingHotSpots = analyse;

export function trendMap(
  featureCollection: GeoJSON.FeatureCollection,
  result: EmergingHotSpotResult,
): GeoJSON.FeatureCollection {
  if (featureCollection.features.length !== result.locations.length) {
    throw new RangeError(
      `Trend map expects ${featureCollection.features.length} features but received ${result.locations.length} location diagnostics.`,
    );
  }

  return {
    type: "FeatureCollection",
    features: featureCollection.features.map((feature, index) => {
      const location = result.locations[index]!;
      const properties: TrendMapProperties = {
        index,
        emerging_hotspot_category: location.category,
        emerging_hotspot_label: location.categoryLabel,
        emerging_hotspot_reason: location.diagnostics.classificationReason,
        mann_kendall_trend: location.diagnostics.mannKendall.trend,
        mann_kendall_z: location.diagnostics.mannKendall.zScore,
        mann_kendall_p: location.diagnostics.mannKendall.pValue,
        mann_kendall_tau: location.diagnostics.mannKendall.tau,
        hot_step_count: location.diagnostics.hotCount,
        cold_step_count: location.diagnostics.coldCount,
        hot_step_share: location.diagnostics.hotShare,
        cold_step_share: location.diagnostics.coldShare,
        consecutive_hot_steps_ending: location.diagnostics.consecutiveHotEnding,
        final_hotspot_confidence: location.diagnostics.finalConfidence,
      };

      return {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          ...properties,
        },
      };
    }),
  };
}

export function emergingHotSpotLegend(): EmergingHotSpotLegendEntry[] {
  return EMERGING_HOT_SPOT_LEGEND.map((entry) => ({ ...entry }));
}

export function classifySeriesFromZScores(
  zScores: ArrayLike<number>,
  options: Pick<EmergingHotSpotAnalysisOptions, "significanceThreshold" | "trendAlpha" | "persistentShare"> = {},
): ClassificationResolution {
  const significanceThreshold = options.significanceThreshold ?? DEFAULT_SIGNIFICANCE;
  const series: EmergingHotSpotSeriesStep[] = Array.from(zScores, (zScore, index) => {
    const confidence = toConfidence(Number(zScore));
    const pValue = twoTailedP(Number(zScore));
    const isHotSpot =
      pValue <= significanceThreshold &&
      (confidence === "hot-90" || confidence === "hot-95" || confidence === "hot-99");
    const isColdSpot =
      pValue <= significanceThreshold &&
      (confidence === "cold-90" || confidence === "cold-95" || confidence === "cold-99");

    return {
      key: String(index),
      label: `Step ${index}`,
      value: Number(zScore),
      giStar: Number(zScore),
      zScore: Number(zScore),
      pValue,
      confidence,
      isHotSpot,
      isColdSpot,
    };
  });

  const diagnostics = buildEmergingHotSpotDiagnostics(series, {
    ...(options.trendAlpha === undefined ? {} : { trendAlpha: options.trendAlpha }),
    ...(options.persistentShare === undefined ? {} : { persistentShare: options.persistentShare }),
  });

  return classifyEmergingHotSpot(
    diagnostics,
    options.persistentShare ?? DEFAULT_PERSISTENT_SHARE,
  );
}
