/**
 * Composite indicator engine.
 *
 * Implements a browser-safe OECD/JRC-style workflow for:
 * - missing-data handling or imputation
 * - normalization
 * - equal, expert, PCA-derived, AHP, and budget-allocation weights
 * - additive or geometric aggregation
 * - Monte Carlo sensitivity and uncertainty summaries
 *
 * Simplifications relative to a full methodological audit workflow:
 * - Monte Carlo uncertainty is driven by indicator-value noise and weight
 *   perturbation rather than a full probabilistic measurement-error model.
 * - Sobol-style outputs are proxy indices based on Monte Carlo response
 *   correlations, not a quasi-random global variance decomposition.
 * - PCA-derived weights rely on first-component loading magnitudes only.
 */

import { pca } from "@/engine/spatial-stats/multivariate/PCA";

export type CompositeIndicatorDirection = "positive" | "negative";
export type CompositeImputationMethod =
  | "listwise_delete"
  | "mean"
  | "median";
export type CompositeNormalizationMethod =
  | "min_max"
  | "z_score"
  | "rank"
  | "percentile"
  | "distance_to_reference";
export type CompositeWeightingMethod =
  | "equal"
  | "expert"
  | "pca_derived"
  | "ahp"
  | "budget_allocation";
export type CompositeAggregationMethod = "additive" | "geometric";
export type CompositeRobustnessTier = "high" | "moderate" | "low";

export interface CompositeIndicatorDefinition {
  id: string;
  label: string;
  description?: string;
  unit?: string;
  source?: string;
  direction: CompositeIndicatorDirection;
  referenceValue?: number;
  group?: string;
}

export interface CompositeIndicatorUnit {
  id: string;
  label: string;
  geometry: GeoJSON.Geometry;
  values: Record<string, number | null | undefined>;
  group?: string;
  properties?: Record<string, string | number | boolean | null>;
}

export interface CompositeIndicatorDataset {
  id?: string;
  label?: string;
  indicators: CompositeIndicatorDefinition[];
  units: CompositeIndicatorUnit[];
}

export interface CompositeImputationConfig {
  method: CompositeImputationMethod;
}

export interface CompositeNormalizationConfig {
  method: CompositeNormalizationMethod;
  referenceValues?: Record<string, number>;
}

export interface CompositeWeightingConfig {
  method: CompositeWeightingMethod;
  manualWeights?: Record<string, number>;
  budgetAllocation?: Record<string, number>;
  ahpMatrix?: number[][];
}

export interface CompositeAggregationConfig {
  method: CompositeAggregationMethod;
  geometricFloor?: number;
}

export interface CompositeSensitivityConfig {
  runs: number;
  weightPerturbation: number;
  indicatorNoise: number;
  confidenceLevel?: number;
  topK?: number;
  randomSeed?: number;
}

export interface CompositeIndicatorAnalysisOptions {
  scenarioName?: string;
  selectedIndicatorIds: string[];
  imputation: CompositeImputationConfig;
  normalization: CompositeNormalizationConfig;
  weighting: CompositeWeightingConfig;
  aggregation: CompositeAggregationConfig;
  sensitivity: CompositeSensitivityConfig;
}

export interface CompositeIndicatorWeight {
  indicatorId: string;
  label: string;
  weight: number;
  method: CompositeWeightingMethod;
}

export interface CompositeIndicatorPcaDiagnostic {
  indicatorId: string;
  label: string;
  loading: number;
  absoluteLoading: number;
}

export interface CompositeIndicatorAHPDiagnostic {
  consistencyIndex: number;
  consistencyRatio: number;
  principalEigenvalue: number;
}

export interface CompositeIndicatorValueDetail {
  indicatorId: string;
  label: string;
  rawValue: number;
  normalizedValue: number;
  utilityValue: number;
  imputed: boolean;
  contribution: number;
}

export interface CompositeIndicatorConfidenceBand {
  lower: number;
  upper: number;
}

export interface CompositeIndicatorRankBand {
  lower: number;
  upper: number;
}

export interface CompositeIndicatorUnitResult {
  unitId: string;
  label: string;
  group?: string;
  geometry: GeoJSON.Geometry;
  score: number;
  scorePercent: number;
  rank: number;
  confidenceBand: CompositeIndicatorConfidenceBand;
  rankBand: CompositeIndicatorRankBand;
  meanScorePercent: number;
  scoreStdDev: number;
  meanRank: number;
  rankStdDev: number;
  topKInclusionFrequency: number;
  values: CompositeIndicatorValueDetail[];
  properties?: Record<string, string | number | boolean | null>;
}

export interface CompositeIndicatorDiagnostic {
  indicatorId: string;
  label: string;
  rawMean: number;
  rawMedian: number;
  rawMin: number;
  rawMax: number;
  missingCount: number;
  imputedCount: number;
  fillValue: number | null;
  normalizedMean: number;
  normalizedMin: number;
  normalizedMax: number;
  utilityMean: number;
  referenceValue: number | null;
  weight: number;
}

export interface CompositeIndicatorSobolProxy {
  indicatorId: string;
  label: string;
  firstOrderIndex: number;
  totalEffectProxy: number;
}

export interface CompositeIndicatorSensitivitySummary {
  runs: number;
  confidenceLevel: number;
  weightPerturbation: number;
  indicatorNoise: number;
  topK: number;
  meanKendallTauToBaseline: number;
  meanAbsoluteRankShift: number;
  topKStability: number;
  robustnessTier: CompositeRobustnessTier;
  sobolStyle: CompositeIndicatorSobolProxy[];
  notes: string[];
}

export interface CompositeIndicatorConfigurationPackage {
  version: string;
  generatedAt: string;
  datasetId?: string;
  datasetLabel?: string;
  scenarioName?: string;
  selectedIndicatorIds: string[];
  imputation: CompositeImputationConfig;
  normalization: CompositeNormalizationConfig;
  weighting: CompositeWeightingConfig;
  aggregation: CompositeAggregationConfig;
  sensitivity: CompositeSensitivityConfig;
  derivedWeights: CompositeIndicatorWeight[];
  notes: string[];
}

export interface CompositeIndicatorResult {
  scenarioName?: string;
  datasetSummary: {
    unitCount: number;
    originalUnitCount: number;
    selectedIndicatorCount: number;
    missingCellCount: number;
    imputedCellCount: number;
    removedUnitCount: number;
  };
  selectedIndicators: CompositeIndicatorDefinition[];
  weights: CompositeIndicatorWeight[];
  units: CompositeIndicatorUnitResult[];
  diagnostics: CompositeIndicatorDiagnostic[];
  normalizationMethod: CompositeNormalizationMethod;
  weightingMethod: CompositeWeightingMethod;
  aggregationMethod: CompositeAggregationMethod;
  featureCollection: GeoJSON.FeatureCollection;
  valueField: string;
  confidenceLowerField: string;
  confidenceUpperField: string;
  rankField: string;
  rankLowerField: string;
  rankUpperField: string;
  sensitivity: CompositeIndicatorSensitivitySummary;
  configurationPackage: CompositeIndicatorConfigurationPackage;
  notes: string[];
  pcaDiagnostics?: {
    explainedVariance: number;
    retainedComponent: number;
    loadings: CompositeIndicatorPcaDiagnostic[];
  };
  ahpDiagnostics?: CompositeIndicatorAHPDiagnostic;
}

interface PreparedMatrix {
  units: CompositeIndicatorUnit[];
  matrix: number[][];
  imputedFlags: boolean[][];
  missingCellCount: number;
  imputedCellCount: number;
  removedUnitCount: number;
  fillValues: Array<number | null>;
  missingCounts: number[];
  imputedCounts: number[];
}

interface NormalizationOutput {
  normalizedMatrix: number[][];
  utilityMatrix: number[][];
  referenceValues: Array<number | null>;
}

interface DerivedWeights {
  weights: number[];
  pcaDiagnostics?: CompositeIndicatorResult["pcaDiagnostics"];
  ahpDiagnostics?: CompositeIndicatorAHPDiagnostic;
  notes: string[];
}

interface MonteCarloRun {
  scores: number[];
  scorePercents: number[];
  ranks: number[];
  weights: number[];
  meanAbsoluteRankShift: number;
  topKOverlap: number;
  kendallTau: number;
}

const DEFAULT_CONFIDENCE_LEVEL = 0.9;
const DEFAULT_SENSITIVITY_RUNS = 250;
const DEFAULT_WEIGHT_PERTURBATION = 0.12;
const DEFAULT_INDICATOR_NOISE = 0.03;
const DEFAULT_TOP_K = 3;
const DEFAULT_GEOMETRIC_FLOOR = 0.001;
const DEFAULT_SCORE_FIELD = "composite_score";
const DEFAULT_CONFIDENCE_LOWER_FIELD = "composite_ci_lower";
const DEFAULT_CONFIDENCE_UPPER_FIELD = "composite_ci_upper";
const DEFAULT_RANK_FIELD = "composite_rank";
const DEFAULT_RANK_LOWER_FIELD = "composite_rank_lower";
const DEFAULT_RANK_UPPER_FIELD = "composite_rank_upper";

const AHP_RANDOM_INDEX: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stableNumber(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return ((sorted[midpoint - 1] ?? 0) + (sorted[midpoint] ?? 0)) / 2;
  }

  return sorted[midpoint] ?? 0;
}

function quantile(values: number[], percentile: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const position = clamp(percentile, 0, 1) * (sorted.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = sorted[lowerIndex] ?? sorted[0] ?? 0;
  const upper = sorted[upperIndex] ?? sorted[sorted.length - 1] ?? lower;
  const fraction = position - lowerIndex;
  return lower + (upper - lower) * fraction;
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

function normalizeWeights(values: number[]): number[] {
  const cleaned = values.map((value) =>
    Number.isFinite(value) && value > 0 ? value : 0,
  );
  const total = sum(cleaned);
  if (total <= 0) {
    const equalWeight = cleaned.length === 0 ? 0 : 1 / cleaned.length;
    return cleaned.map(() => stableNumber(equalWeight, 8));
  }
  return cleaned.map((value) => stableNumber(value / total, 8));
}

function minMaxScale(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || maxValue <= minValue) {
    return values.map(() => 0.5);
  }

  return values.map((value) => (value - minValue) / (maxValue - minValue));
}

function rankValues(
  values: number[],
  direction: CompositeIndicatorDirection,
): number[] {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((left, right) => {
      return direction === "positive"
        ? right.value - left.value
        : left.value - right.value;
    });

  const ranks = new Array<number>(values.length);
  let cursor = 0;

  while (cursor < sorted.length) {
    let end = cursor;
    while (
      end + 1 < sorted.length &&
      Math.abs((sorted[end + 1]?.value ?? 0) - (sorted[cursor]?.value ?? 0)) < 1e-9
    ) {
      end += 1;
    }

    const averageRank = ((cursor + 1) + (end + 1)) / 2;
    for (let index = cursor; index <= end; index += 1) {
      const item = sorted[index];
      if (item) {
        ranks[item.index] = averageRank;
      }
    }
    cursor = end + 1;
  }

  return ranks;
}

function rankToDiscreteScore(rank: number, count: number): number {
  if (count <= 1) {
    return 1;
  }
  return 1 - (rank - 1) / (count - 1);
}

function pearsonCorrelation(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    return 0;
  }

  const leftMean = mean(left);
  const rightMean = mean(right);
  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = (left[index] ?? 0) - leftMean;
    const rightDelta = (right[index] ?? 0) - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta * leftDelta;
    rightVariance += rightDelta * rightDelta;
  }

  if (leftVariance <= 1e-12 || rightVariance <= 1e-12) {
    return 0;
  }

  return numerator / Math.sqrt(leftVariance * rightVariance);
}

function kendallTau(leftScores: number[], rightScores: number[]): number {
  if (leftScores.length !== rightScores.length || leftScores.length <= 1) {
    return 1;
  }

  let concordant = 0;
  let discordant = 0;

  for (let leftIndex = 0; leftIndex < leftScores.length - 1; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < leftScores.length; rightIndex += 1) {
      const leftDelta = (leftScores[leftIndex] ?? 0) - (leftScores[rightIndex] ?? 0);
      const rightDelta = (rightScores[leftIndex] ?? 0) - (rightScores[rightIndex] ?? 0);
      const sign = Math.sign(leftDelta * rightDelta);
      if (sign > 0) {
        concordant += 1;
      } else if (sign < 0) {
        discordant += 1;
      }
    }
  }

  const denominator = concordant + discordant;
  if (denominator === 0) {
    return 1;
  }

  return (concordant - discordant) / denominator;
}

function buildRanksFromScores(scores: number[]): number[] {
  return rankValues(scores, "positive");
}

function topKOverlap(
  baselineRanks: number[],
  candidateRanks: number[],
  topK: number,
): number {
  const baselineIds = new Set<number>();
  const candidateIds = new Set<number>();

  baselineRanks.forEach((rank, index) => {
    if (rank <= topK) {
      baselineIds.add(index);
    }
  });
  candidateRanks.forEach((rank, index) => {
    if (rank <= topK) {
      candidateIds.add(index);
    }
  });

  if (baselineIds.size === 0) {
    return 1;
  }

  let overlap = 0;
  for (const index of baselineIds) {
    if (candidateIds.has(index)) {
      overlap += 1;
    }
  }

  return overlap / baselineIds.size;
}

class SeededRandom {
  private state: number;
  private spare: number | null;

  constructor(seed = 123456789) {
    this.state = seed >>> 0;
    this.spare = null;
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  normal(): number {
    if (this.spare != null) {
      const next = this.spare;
      this.spare = null;
      return next;
    }

    let left = 0;
    let right = 0;
    let radius = 0;

    do {
      left = this.next() * 2 - 1;
      right = this.next() * 2 - 1;
      radius = left * left + right * right;
    } while (radius === 0 || radius >= 1);

    const multiplier = Math.sqrt((-2 * Math.log(radius)) / radius);
    this.spare = right * multiplier;
    return left * multiplier;
  }
}

function validateAnalysisInputs(
  dataset: CompositeIndicatorDataset,
  options: CompositeIndicatorAnalysisOptions,
): CompositeIndicatorDefinition[] {
  if (dataset.units.length < 2) {
    throw new RangeError("Composite indicator analysis requires at least two spatial units.");
  }

  const selectedIndicatorIds = [...new Set(options.selectedIndicatorIds)];
  if (selectedIndicatorIds.length < 2) {
    throw new RangeError("Select at least two indicators to build a composite index.");
  }

  const definitions = selectedIndicatorIds.map((indicatorId) => {
    const definition = dataset.indicators.find((entry) => entry.id === indicatorId);
    if (!definition) {
      throw new RangeError(`Unknown indicator "${indicatorId}".`);
    }
    return definition;
  });

  return definitions;
}

function prepareMatrix(
  dataset: CompositeIndicatorDataset,
  definitions: CompositeIndicatorDefinition[],
  imputation: CompositeImputationConfig,
): PreparedMatrix {
  const missingCounts = definitions.map(() => 0);
  const imputedCounts = definitions.map(() => 0);
  let missingCellCount = 0;

  const selectedUnits: CompositeIndicatorUnit[] = [];
  const rawRows: Array<Array<number | null>> = [];

  for (const unit of dataset.units) {
    const row = definitions.map((definition, definitionIndex) => {
      const rawValue = unit.values[definition.id];
      const value = typeof rawValue === "number" && Number.isFinite(rawValue)
        ? rawValue
        : null;
      if (value == null) {
        missingCounts[definitionIndex] = (missingCounts[definitionIndex] ?? 0) + 1;
        missingCellCount += 1;
      }
      return value;
    });

    if (imputation.method === "listwise_delete" && row.some((value) => value == null)) {
      continue;
    }

    selectedUnits.push(unit);
    rawRows.push(row);
  }

  if (selectedUnits.length < 2) {
    throw new RangeError(
      "The selected indicators leave fewer than two usable spatial units after missing-data handling.",
    );
  }

  const removedUnitCount = dataset.units.length - selectedUnits.length;
  const fillValues = definitions.map((_, definitionIndex) => {
    if (imputation.method === "listwise_delete") {
      return null;
    }

    const observedValues = rawRows
      .map((row) => row[definitionIndex])
      .filter((value): value is number => value != null);
    if (observedValues.length === 0) {
      return 0;
    }

    return imputation.method === "median"
      ? median(observedValues)
      : mean(observedValues);
  });

  const imputedFlags: boolean[][] = rawRows.map((row) =>
    row.map((value) => value == null),
  );
  const matrix = rawRows.map((row) =>
    row.map((value, definitionIndex) => {
      if (value != null) {
        return value;
      }

      imputedCounts[definitionIndex] = (imputedCounts[definitionIndex] ?? 0) + 1;
      const fillValue = fillValues[definitionIndex] ?? 0;
      return fillValue;
    }),
  );

  return {
    units: selectedUnits,
    matrix,
    imputedFlags,
    missingCellCount,
    imputedCellCount: sum(imputedCounts),
    removedUnitCount,
    fillValues,
    missingCounts,
    imputedCounts,
  };
}

function normalizeMatrix(
  matrix: number[][],
  definitions: CompositeIndicatorDefinition[],
  config: CompositeNormalizationConfig,
): NormalizationOutput {
  const normalizedMatrix = matrix.map((row) => row.map(() => 0));
  const utilityMatrix = matrix.map((row) => row.map(() => 0));
  const referenceValues: Array<number | null> = definitions.map(() => null);

  for (let definitionIndex = 0; definitionIndex < definitions.length; definitionIndex += 1) {
    const definition = definitions[definitionIndex]!;
    const column = matrix.map((row) => row[definitionIndex] ?? 0);
    const direction = definition.direction;
    const minValue = Math.min(...column);
    const maxValue = Math.max(...column);
    const meanValue = mean(column);
    const stdValue = standardDeviation(column);
    const ranks = rankValues(column, direction);

    let normalizedColumn: number[] = [];
    let utilityColumn: number[] = [];

    switch (config.method) {
      case "min_max": {
        normalizedColumn =
          maxValue <= minValue
            ? column.map(() => 0.5)
            : column.map((value) => {
                const ratio = (value - minValue) / (maxValue - minValue);
                return direction === "positive" ? ratio : 1 - ratio;
              });
        utilityColumn = [...normalizedColumn];
        break;
      }

      case "z_score": {
        normalizedColumn = column.map((value) => {
          const zScore = stdValue <= 1e-12 ? 0 : (value - meanValue) / stdValue;
          return direction === "positive" ? zScore : -zScore;
        });
        utilityColumn = minMaxScale(normalizedColumn);
        break;
      }

      case "rank": {
        normalizedColumn = ranks.map((rank) => rankToDiscreteScore(rank, column.length));
        utilityColumn = [...normalizedColumn];
        break;
      }

      case "percentile": {
        normalizedColumn = ranks.map((rank) => {
          if (column.length <= 1) {
            return 1;
          }
          return 1 - (rank - 1) / column.length;
        });
        utilityColumn = [...normalizedColumn];
        break;
      }

      case "distance_to_reference": {
        const referenceValue =
          config.referenceValues?.[definition.id] ??
          definition.referenceValue ??
          meanValue;
        referenceValues[definitionIndex] = referenceValue;
        const distances = column.map((value) => Math.abs(value - referenceValue));
        const maxDistance = Math.max(...distances);
        normalizedColumn =
          maxDistance <= 1e-12
            ? column.map(() => 1)
            : distances.map((distance) => 1 - distance / maxDistance);
        utilityColumn = [...normalizedColumn];
        break;
      }

      default: {
        normalizedColumn = minMaxScale(column);
        utilityColumn = [...normalizedColumn];
      }
    }

    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
      normalizedMatrix[rowIndex]![definitionIndex] = stableNumber(normalizedColumn[rowIndex] ?? 0, 8);
      utilityMatrix[rowIndex]![definitionIndex] = stableNumber(clamp(utilityColumn[rowIndex] ?? 0, 0, 1), 8);
    }
  }

  return {
    normalizedMatrix,
    utilityMatrix,
    referenceValues,
  };
}

function orientMatrixForPca(
  matrix: number[][],
  definitions: CompositeIndicatorDefinition[],
): number[][] {
  return matrix.map((row) =>
    row.map((value, index) =>
      definitions[index]?.direction === "negative" ? -value : value,
    ),
  );
}

function deriveAhpWeights(matrix: number[][]): {
  weights: number[];
  diagnostics: CompositeIndicatorAHPDiagnostic;
} {
  const size = matrix.length;
  if (size === 0 || matrix.some((row) => row.length !== size)) {
    throw new RangeError("AHP pairwise matrix must be square.");
  }

  const geometricMeans = matrix.map((row) => {
    const product = row.reduce((value, next) => value * Math.max(next, 1e-9), 1);
    return product ** (1 / size);
  });
  const weights = normalizeWeights(geometricMeans);
  const weightedSums = matrix.map((row) =>
    row.reduce((value, next, index) => value + next * (weights[index] ?? 0), 0),
  );
  const lambdaMax = mean(
    weightedSums.map((value, index) => value / Math.max(weights[index] ?? 0, 1e-9)),
  );
  const consistencyIndex = size <= 1 ? 0 : (lambdaMax - size) / (size - 1);
  const randomIndex = AHP_RANDOM_INDEX[size] ?? AHP_RANDOM_INDEX[10];
  const consistencyRatio =
    !randomIndex || randomIndex <= 1e-12 ? 0 : consistencyIndex / randomIndex;

  return {
    weights,
    diagnostics: {
      consistencyIndex: stableNumber(consistencyIndex, 6),
      consistencyRatio: stableNumber(consistencyRatio, 6),
      principalEigenvalue: stableNumber(lambdaMax, 6),
    },
  };
}

function deriveWeights(
  matrix: number[][],
  definitions: CompositeIndicatorDefinition[],
  config: CompositeWeightingConfig,
): DerivedWeights {
  const notes: string[] = [];
  const indicatorIds = definitions.map((definition) => definition.id);

  switch (config.method) {
    case "equal":
      return {
        weights: normalizeWeights(indicatorIds.map(() => 1)),
        notes,
      };

    case "expert": {
      const weights = normalizeWeights(
        indicatorIds.map((indicatorId) => config.manualWeights?.[indicatorId] ?? 0),
      );
      notes.push("Expert weights are analyst supplied and normalised to sum to 1.");
      return { weights, notes };
    }

    case "budget_allocation": {
      const weights = normalizeWeights(
        indicatorIds.map((indicatorId) => config.budgetAllocation?.[indicatorId] ?? 0),
      );
      notes.push("Budget allocation weights are derived from manual token allocation and normalised to sum to 1.");
      return { weights, notes };
    }

    case "pca_derived": {
      const pcaResult = pca(orientMatrixForPca(matrix, definitions), {
        maxComponents: 1,
        variableLabels: definitions.map((definition) => definition.label),
      });
      const loadings = definitions.map((definition, index) => {
        const loading = pcaResult.loadings[index]?.[0] ?? 0;
        return {
          indicatorId: definition.id,
          label: definition.label,
          loading: stableNumber(loading, 6),
          absoluteLoading: stableNumber(Math.abs(loading), 6),
        };
      });
      const weights = normalizeWeights(loadings.map((loading) => loading.absoluteLoading));
      notes.push("PCA-derived weights use the absolute loading magnitude of the first retained component.");
      return {
        weights,
        pcaDiagnostics: {
          explainedVariance: stableNumber(
            (pcaResult.varianceExplained[0] ?? 0) * 100,
            4,
          ),
          retainedComponent: 1,
          loadings,
        },
        notes,
      };
    }

    case "ahp": {
      const ahpMatrix = config.ahpMatrix;
      if (!ahpMatrix || ahpMatrix.length !== definitions.length) {
        throw new RangeError("AHP weighting requires a complete pairwise-comparison matrix.");
      }
      const { weights, diagnostics } = deriveAhpWeights(ahpMatrix);
      notes.push(
        diagnostics.consistencyRatio <= 0.1
          ? "AHP pairwise judgments are within common consistency thresholds."
          : "AHP consistency ratio is elevated; results remain usable for teaching/demo purposes but the pairwise matrix should be reviewed.",
      );
      return {
        weights,
        ahpDiagnostics: diagnostics,
        notes,
      };
    }

    default:
      return {
        weights: normalizeWeights(indicatorIds.map(() => 1)),
        notes,
      };
  }
}

function aggregateScores(
  utilityMatrix: number[][],
  weights: number[],
  config: CompositeAggregationConfig,
): number[] {
  const floor = config.geometricFloor ?? DEFAULT_GEOMETRIC_FLOOR;
  return utilityMatrix.map((row) => {
    if (config.method === "geometric") {
      const logSum = row.reduce(
        (value, utility, index) =>
          value + (weights[index] ?? 0) * Math.log(Math.max(utility, floor)),
        0,
      );
      return stableNumber(Math.exp(logSum), 8);
    }

    return stableNumber(
      row.reduce(
        (value, utility, index) => value + utility * (weights[index] ?? 0),
        0,
      ),
      8,
    );
  });
}

function samplePositiveWeights(
  baseWeights: number[],
  perturbation: number,
  random: SeededRandom,
): number[] {
  if (perturbation <= 1e-9) {
    return [...baseWeights];
  }

  const sampled = baseWeights.map((weight) =>
    Math.max(1e-6, weight * Math.exp(random.normal() * perturbation)),
  );
  return normalizeWeights(sampled);
}

function sampleMatrix(
  matrix: number[][],
  noiseRatio: number,
  random: SeededRandom,
): number[][] {
  if (noiseRatio <= 1e-9) {
    return matrix.map((row) => [...row]);
  }

  const columnStats = matrix[0]?.map((_, columnIndex) =>
    standardDeviation(matrix.map((row) => row[columnIndex] ?? 0)),
  ) ?? [];

  return matrix.map((row) =>
    row.map((value, columnIndex) => {
      const noise = (columnStats[columnIndex] ?? 0) * noiseRatio * random.normal();
      return value + noise;
    }),
  );
}

function buildSensitivitySummary(
  baselineScores: number[],
  baselineRanks: number[],
  baselineWeights: number[],
  baselineUnits: CompositeIndicatorUnit[],
  definitions: CompositeIndicatorDefinition[],
  preparedMatrix: PreparedMatrix,
  options: CompositeIndicatorAnalysisOptions,
): {
  summary: CompositeIndicatorSensitivitySummary;
  bandsByUnitId: Map<string, {
    meanScorePercent: number;
    scoreStdDev: number;
    confidenceBand: CompositeIndicatorConfidenceBand;
    meanRank: number;
    rankStdDev: number;
    rankBand: CompositeIndicatorRankBand;
    topKInclusionFrequency: number;
  }>;
} {
  const runs = Math.max(1, Math.floor(options.sensitivity.runs || DEFAULT_SENSITIVITY_RUNS));
  const confidenceLevel = clamp(
    options.sensitivity.confidenceLevel ?? DEFAULT_CONFIDENCE_LEVEL,
    0.5,
    0.99,
  );
  const confidenceTail = (1 - confidenceLevel) / 2;
  const topK = clamp(
    Math.floor(options.sensitivity.topK || DEFAULT_TOP_K),
    1,
    Math.max(1, baselineUnits.length),
  );
  const weightPerturbation = Math.max(
    0,
    options.sensitivity.weightPerturbation ?? DEFAULT_WEIGHT_PERTURBATION,
  );
  const indicatorNoise = Math.max(
    0,
    options.sensitivity.indicatorNoise ?? DEFAULT_INDICATOR_NOISE,
  );
  const random = new SeededRandom(options.sensitivity.randomSeed ?? 20260412);
  const monteCarloRuns: MonteCarloRun[] = [];

  for (let iteration = 0; iteration < runs; iteration += 1) {
    const sampledMatrix = sampleMatrix(preparedMatrix.matrix, indicatorNoise, random);
    const normalization = normalizeMatrix(
      sampledMatrix,
      definitions,
      options.normalization,
    );

    let sampledWeights = baselineWeights;
    if (options.weighting.method === "pca_derived") {
      sampledWeights = deriveWeights(
        sampledMatrix,
        definitions,
        options.weighting,
      ).weights;
    }

    sampledWeights = samplePositiveWeights(sampledWeights, weightPerturbation, random);
    const scores = aggregateScores(normalization.utilityMatrix, sampledWeights, options.aggregation);
    const ranks = buildRanksFromScores(scores);

    monteCarloRuns.push({
      scores,
      scorePercents: scores.map((score) => stableNumber(score * 100, 6)),
      ranks,
      weights: sampledWeights,
      meanAbsoluteRankShift: mean(
        ranks.map((rank, index) => Math.abs(rank - (baselineRanks[index] ?? rank))),
      ),
      topKOverlap: topKOverlap(baselineRanks, ranks, topK),
      kendallTau: kendallTau(baselineScores, scores),
    });
  }

  const response = monteCarloRuns.map((run) => run.meanAbsoluteRankShift);
  const bandsByUnitId = new Map<
    string,
    {
      meanScorePercent: number;
      scoreStdDev: number;
      confidenceBand: CompositeIndicatorConfidenceBand;
      meanRank: number;
      rankStdDev: number;
      rankBand: CompositeIndicatorRankBand;
      topKInclusionFrequency: number;
    }
  >();

  baselineUnits.forEach((unit, unitIndex) => {
    const scoreSamples = monteCarloRuns.map((run) => run.scorePercents[unitIndex] ?? 0);
    const rankSamples = monteCarloRuns.map((run) => run.ranks[unitIndex] ?? 0);
    bandsByUnitId.set(unit.id, {
      meanScorePercent: stableNumber(mean(scoreSamples), 4),
      scoreStdDev: stableNumber(standardDeviation(scoreSamples), 4),
      confidenceBand: {
        lower: stableNumber(quantile(scoreSamples, confidenceTail), 4),
        upper: stableNumber(quantile(scoreSamples, 1 - confidenceTail), 4),
      },
      meanRank: stableNumber(mean(rankSamples), 4),
      rankStdDev: stableNumber(standardDeviation(rankSamples), 4),
      rankBand: {
        lower: stableNumber(quantile(rankSamples, confidenceTail), 4),
        upper: stableNumber(quantile(rankSamples, 1 - confidenceTail), 4),
      },
      topKInclusionFrequency: stableNumber(
        rankSamples.filter((rank) => rank <= topK).length / rankSamples.length,
        4,
      ),
    });
  });

  const sobolStyle = definitions.map((definition, definitionIndex) => {
    const weightSamples = monteCarloRuns.map((run) => run.weights[definitionIndex] ?? 0);
    const firstOrder = pearsonCorrelation(
      weightSamples,
      monteCarloRuns.map((run) => run.topKOverlap),
    ) ** 2;
    const totalEffect = pearsonCorrelation(
      weightSamples.map((value) => Math.abs(value - (baselineWeights[definitionIndex] ?? 0))),
      response,
    ) ** 2;
    return {
      indicatorId: definition.id,
      label: definition.label,
      firstOrderIndex: stableNumber(clamp(firstOrder, 0, 1), 4),
      totalEffectProxy: stableNumber(clamp(totalEffect, 0, 1), 4),
    };
  }).sort((left, right) => right.totalEffectProxy - left.totalEffectProxy);

  const meanKendallTauToBaseline = stableNumber(
    mean(monteCarloRuns.map((run) => run.kendallTau)),
    4,
  );
  const meanAbsoluteRankShift = stableNumber(
    mean(monteCarloRuns.map((run) => run.meanAbsoluteRankShift)),
    4,
  );
  const topKStability = stableNumber(
    mean(monteCarloRuns.map((run) => run.topKOverlap)),
    4,
  );

  let robustnessTier: CompositeRobustnessTier = "low";
  if (meanKendallTauToBaseline >= 0.85 && meanAbsoluteRankShift <= 1) {
    robustnessTier = "high";
  } else if (meanKendallTauToBaseline >= 0.65 && meanAbsoluteRankShift <= 2) {
    robustnessTier = "moderate";
  }

  return {
    summary: {
      runs,
      confidenceLevel: stableNumber(confidenceLevel, 4),
      weightPerturbation: stableNumber(weightPerturbation, 4),
      indicatorNoise: stableNumber(indicatorNoise, 4),
      topK,
      meanKendallTauToBaseline,
      meanAbsoluteRankShift,
      topKStability,
      robustnessTier,
      sobolStyle,
      notes: [
        "Confidence bands are empirical Monte Carlo quantiles around the baseline composite result.",
        "Sobol-style outputs are proxy indices derived from Monte Carlo response correlations rather than a full quasi-random variance decomposition.",
      ],
    },
    bandsByUnitId,
  };
}

function buildFeatureCollection(
  units: CompositeIndicatorUnitResult[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: units.map((unit) => ({
      type: "Feature",
      id: unit.unitId,
      geometry: unit.geometry,
      properties: {
        unit_id: unit.unitId,
        unit_label: unit.label,
        unit_group: unit.group ?? null,
        [DEFAULT_SCORE_FIELD]: unit.scorePercent,
        [DEFAULT_CONFIDENCE_LOWER_FIELD]: unit.confidenceBand.lower,
        [DEFAULT_CONFIDENCE_UPPER_FIELD]: unit.confidenceBand.upper,
        [DEFAULT_RANK_FIELD]: unit.rank,
        [DEFAULT_RANK_LOWER_FIELD]: unit.rankBand.lower,
        [DEFAULT_RANK_UPPER_FIELD]: unit.rankBand.upper,
        top_k_frequency: unit.topKInclusionFrequency,
        score_std_dev: unit.scoreStdDev,
        ...Object.fromEntries(
          unit.values.flatMap((value) => [
            [`raw_${value.indicatorId}`, stableNumber(value.rawValue, 6)],
            [`norm_${value.indicatorId}`, stableNumber(value.normalizedValue, 6)],
            [`util_${value.indicatorId}`, stableNumber(value.utilityValue, 6)],
            [`contrib_${value.indicatorId}`, stableNumber(value.contribution, 6)],
          ]),
        ),
        ...(unit.properties ?? {}),
      },
    })),
  };
}

export function runCompositeIndicatorAnalysis(
  dataset: CompositeIndicatorDataset,
  options: CompositeIndicatorAnalysisOptions,
): CompositeIndicatorResult {
  const definitions = validateAnalysisInputs(dataset, options);
  const prepared = prepareMatrix(dataset, definitions, options.imputation);
  const normalization = normalizeMatrix(prepared.matrix, definitions, options.normalization);
  const derivedWeights = deriveWeights(prepared.matrix, definitions, options.weighting);
  const weights = normalizeWeights(derivedWeights.weights);
  const scores = aggregateScores(normalization.utilityMatrix, weights, options.aggregation);
  const scorePercents = scores.map((score) => stableNumber(score * 100, 4));
  const ranks = buildRanksFromScores(scores);
  const sensitivity = buildSensitivitySummary(
    scores,
    ranks,
    weights,
    prepared.units,
    definitions,
    prepared,
    options,
  );

  const weightLookup = new Map(
    definitions.map((definition, index) => [definition.id, weights[index] ?? 0]),
  );

  const diagnostics: CompositeIndicatorDiagnostic[] = definitions.map((definition, definitionIndex) => {
    const rawColumn = prepared.matrix.map((row) => row[definitionIndex] ?? 0);
    const normalizedColumn = normalization.normalizedMatrix.map((row) => row[definitionIndex] ?? 0);
    const utilityColumn = normalization.utilityMatrix.map((row) => row[definitionIndex] ?? 0);

    return {
      indicatorId: definition.id,
      label: definition.label,
      rawMean: stableNumber(mean(rawColumn), 4),
      rawMedian: stableNumber(median(rawColumn), 4),
      rawMin: stableNumber(Math.min(...rawColumn), 4),
      rawMax: stableNumber(Math.max(...rawColumn), 4),
      missingCount: prepared.missingCounts[definitionIndex] ?? 0,
      imputedCount: prepared.imputedCounts[definitionIndex] ?? 0,
      fillValue: prepared.fillValues[definitionIndex] == null
        ? null
        : stableNumber(prepared.fillValues[definitionIndex] ?? 0, 4),
      normalizedMean: stableNumber(mean(normalizedColumn), 4),
      normalizedMin: stableNumber(Math.min(...normalizedColumn), 4),
      normalizedMax: stableNumber(Math.max(...normalizedColumn), 4),
      utilityMean: stableNumber(mean(utilityColumn), 4),
      referenceValue: normalization.referenceValues[definitionIndex] == null
        ? null
        : stableNumber(normalization.referenceValues[definitionIndex] ?? 0, 4),
      weight: stableNumber(weightLookup.get(definition.id) ?? 0, 6),
    };
  });

  const units: CompositeIndicatorUnitResult[] = prepared.units
    .map((unit, unitIndex) => {
      const band = sensitivity.bandsByUnitId.get(unit.id);
      return {
        unitId: unit.id,
        label: unit.label,
        geometry: unit.geometry,
        score: stableNumber(scores[unitIndex] ?? 0, 6),
        scorePercent: stableNumber(scorePercents[unitIndex] ?? 0, 4),
        rank: stableNumber(ranks[unitIndex] ?? 0, 4),
        confidenceBand: band?.confidenceBand ?? {
          lower: stableNumber(scorePercents[unitIndex] ?? 0, 4),
          upper: stableNumber(scorePercents[unitIndex] ?? 0, 4),
        },
        rankBand: band?.rankBand ?? {
          lower: stableNumber(ranks[unitIndex] ?? 0, 4),
          upper: stableNumber(ranks[unitIndex] ?? 0, 4),
        },
        meanScorePercent: band?.meanScorePercent ?? stableNumber(scorePercents[unitIndex] ?? 0, 4),
        scoreStdDev: band?.scoreStdDev ?? 0,
        meanRank: band?.meanRank ?? stableNumber(ranks[unitIndex] ?? 0, 4),
        rankStdDev: band?.rankStdDev ?? 0,
        topKInclusionFrequency: band?.topKInclusionFrequency ?? 1,
        values: definitions.map((definition, definitionIndex) => ({
          indicatorId: definition.id,
          label: definition.label,
          rawValue: stableNumber(prepared.matrix[unitIndex]?.[definitionIndex] ?? 0, 6),
          normalizedValue: stableNumber(normalization.normalizedMatrix[unitIndex]?.[definitionIndex] ?? 0, 6),
          utilityValue: stableNumber(normalization.utilityMatrix[unitIndex]?.[definitionIndex] ?? 0, 6),
          imputed: Boolean(prepared.imputedFlags[unitIndex]?.[definitionIndex]),
          contribution: stableNumber(
            (normalization.utilityMatrix[unitIndex]?.[definitionIndex] ?? 0) *
              (weights[definitionIndex] ?? 0),
            6,
          ),
        })),
        ...(unit.group ? { group: unit.group } : {}),
        ...(unit.properties ? { properties: unit.properties } : {}),
      };
    })
    .sort((left, right) => left.rank - right.rank);

  const notes = [
    ...derivedWeights.notes,
    "Geometric aggregation uses an epsilon floor to avoid collapsing scores to zero when any utility is zero.",
    ...(options.normalization.method === "z_score"
      ? ["Z-score normalisation is rescaled to 0–1 utility values for aggregation and map display consistency."]
      : []),
    ...sensitivity.summary.notes,
  ];

  const resultWeights: CompositeIndicatorWeight[] = definitions.map((definition, index) => ({
    indicatorId: definition.id,
    label: definition.label,
    weight: stableNumber(weights[index] ?? 0, 6),
    method: options.weighting.method,
  }));

  const configurationPackage: CompositeIndicatorConfigurationPackage = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    selectedIndicatorIds: definitions.map((definition) => definition.id),
    imputation: { ...options.imputation },
    normalization: {
      ...options.normalization,
      ...(options.normalization.method === "distance_to_reference"
        ? {
            referenceValues: Object.fromEntries(
              definitions.map((definition, index) => [
                definition.id,
                normalization.referenceValues[index] ??
                  options.normalization.referenceValues?.[definition.id] ??
                  definition.referenceValue ??
                  0,
              ]),
            ),
          }
        : {}),
    },
    weighting: { ...options.weighting },
    aggregation: { ...options.aggregation },
    sensitivity: {
      runs: sensitivity.summary.runs,
      weightPerturbation: sensitivity.summary.weightPerturbation,
      indicatorNoise: sensitivity.summary.indicatorNoise,
      confidenceLevel: sensitivity.summary.confidenceLevel,
      topK: sensitivity.summary.topK,
      ...(options.sensitivity.randomSeed != null
        ? { randomSeed: options.sensitivity.randomSeed }
        : {}),
    },
    derivedWeights: resultWeights,
    notes,
    ...(dataset.id ? { datasetId: dataset.id } : {}),
    ...(dataset.label ? { datasetLabel: dataset.label } : {}),
    ...(options.scenarioName ? { scenarioName: options.scenarioName } : {}),
  };

  return {
    datasetSummary: {
      unitCount: prepared.units.length,
      originalUnitCount: dataset.units.length,
      selectedIndicatorCount: definitions.length,
      missingCellCount: prepared.missingCellCount,
      imputedCellCount: prepared.imputedCellCount,
      removedUnitCount: prepared.removedUnitCount,
    },
    selectedIndicators: definitions,
    weights: resultWeights,
    units,
    diagnostics,
    normalizationMethod: options.normalization.method,
    weightingMethod: options.weighting.method,
    aggregationMethod: options.aggregation.method,
    featureCollection: buildFeatureCollection(units),
    valueField: DEFAULT_SCORE_FIELD,
    confidenceLowerField: DEFAULT_CONFIDENCE_LOWER_FIELD,
    confidenceUpperField: DEFAULT_CONFIDENCE_UPPER_FIELD,
    rankField: DEFAULT_RANK_FIELD,
    rankLowerField: DEFAULT_RANK_LOWER_FIELD,
    rankUpperField: DEFAULT_RANK_UPPER_FIELD,
    sensitivity: sensitivity.summary,
    configurationPackage,
    notes,
    ...(options.scenarioName ? { scenarioName: options.scenarioName } : {}),
    ...(derivedWeights.pcaDiagnostics ? { pcaDiagnostics: derivedWeights.pcaDiagnostics } : {}),
    ...(derivedWeights.ahpDiagnostics ? { ahpDiagnostics: derivedWeights.ahpDiagnostics } : {}),
  };
}
