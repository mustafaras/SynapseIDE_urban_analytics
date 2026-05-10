/**
 * Cellular Automata Urban Growth Model
 *
 * Tractable binary urban-growth simulation intended for scenario comparison,
 * teaching, and interactive exploration. The implementation calibrates simple
 * transition heuristics from temporal land-use states, applies explicit
 * constraint surfaces during forward simulation, and reports compact
 * validation metrics against an observed target state.
 *
 * Simplifications relative to full SLEUTH-like systems are returned in the
 * result payload and surfaced in the UI. The model deliberately avoids
 * computationally expensive brute-force coefficient searches in favour of
 * empirical transition contrasts that are fast enough for interactive use.
 */

export type GridExtent = [west: number, south: number, east: number, north: number];

export interface CellularAutomataSurface {
  width: number;
  height: number;
  values: number[];
  extent?: GridExtent;
  label?: string;
}

export interface CellularAutomataState extends CellularAutomataSurface {
  step: number | string;
  label?: string;
}

export interface CellularAutomataConstraints {
  protectedAreas?: CellularAutomataSurface;
  water?: CellularAutomataSurface;
  slope?: CellularAutomataSurface;
  existingUrbanStructure?: CellularAutomataSurface;
}

export interface CellularAutomataCalibrationInput {
  historicalStates: CellularAutomataState[];
  suitabilitySurface: CellularAutomataSurface;
  constraints?: CellularAutomataConstraints;
  neighborhoodRadius?: 1 | 2;
  maxSlope?: number;
  urbanThreshold?: number;
}

export interface CellularAutomataCalibrationSummary {
  neighborhoodRadius: 1 | 2;
  urbanThreshold: number;
  maxSlope: number;
  growthRate: number;
  meanNewUrbanCells: number;
  spontaneousGrowthShare: number;
  suitabilityWeight: number;
  neighborhoodWeight: number;
  structureWeight: number;
  slopePenalty: number;
  neighborhoodThreshold: number;
  structureThreshold: number;
  minTransitionScore: number;
  transitionSampleSize: number;
  stableSampleSize: number;
}

export interface CellularAutomataSimulationOptions {
  suitabilitySurface: CellularAutomataSurface;
  constraints?: CellularAutomataConstraints;
  calibration?: CellularAutomataCalibrationSummary;
  historicalStates?: CellularAutomataState[];
  initialState?: CellularAutomataState;
  observedState?: CellularAutomataState;
  steps?: number;
  neighborhoodRadius?: 1 | 2;
  maxSlope?: number;
  urbanThreshold?: number;
  stochasticPerturbation?: number;
  growthMultiplier?: number;
  minTransitionScore?: number;
  seed?: number;
  scenarioName?: string;
}

export interface CellularAutomataConstraintSummary {
  protectedCells: number;
  waterCells: number;
  steepSlopeCells: number;
  structureLimitedCells: number;
}

export interface CellularAutomataStepSummary {
  step: number | string;
  label: string;
  newUrbanCells: number;
  totalUrbanCells: number;
  targetNewUrbanCells: number;
  eligibleCandidateCells: number;
  meanSelectedScore: number;
}

export interface CellularAutomataValidationSummary {
  figureOfMerit: number;
  overallAccuracy: number;
  kappa: number;
  kappaChange: number;
  fitQuality: "strong" | "moderate" | "weak";
  confusion: {
    urban: {
      truePositive: number;
      falsePositive: number;
      falseNegative: number;
      trueNegative: number;
    };
    change: {
      hits: number;
      misses: number;
      falseAlarms: number;
      correctRejections: number;
    };
  };
}

export interface CellularAutomataFrame {
  step: number | string;
  label?: string;
  featureCollection: GeoJSON.FeatureCollection;
  state?: CellularAutomataState;
  summary?: CellularAutomataStepSummary;
}

export interface CellularAutomataResult {
  frames: CellularAutomataFrame[];
  valueField?: string;
  scenarioName?: string;
  calibration: CellularAutomataCalibrationSummary;
  predictedStates: CellularAutomataState[];
  observedState?: CellularAutomataState;
  validation?: CellularAutomataValidationSummary;
  constraintSummary: CellularAutomataConstraintSummary;
  stepSummaries: CellularAutomataStepSummary[];
  simplifications: string[];
}

type TransitionSample = {
  suitability: number;
  neighborhood: number;
  structure: number;
  slope: number;
};

const DEFAULT_SIMPLIFICATIONS = [
  "Binary urban versus non-urban transitions are simulated; multiple land-use classes are not modelled explicitly.",
  "Calibration uses empirical transition contrasts instead of exhaustive SLEUTH coefficient search and road-growth modules.",
  "A fixed Moore neighborhood and explicit suitability/constraint surfaces are used instead of multi-scale diffusion, breed, spread, and road-gravity rules.",
  "Growth demand is allocated stepwise with optional stochastic perturbation rather than through full Monte Carlo calibration ensembles.",
] as const;

const DEFAULT_EXTENT: GridExtent = [0, 0, 1, 1];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function assertMatchingGrid(
  reference: CellularAutomataSurface,
  candidate: CellularAutomataSurface | undefined,
  label: string,
): void {
  if (!candidate) {
    return;
  }
  if (reference.width !== candidate.width || reference.height !== candidate.height) {
    throw new RangeError(
      `${label} grid dimensions ${candidate.width}x${candidate.height} do not match reference ${reference.width}x${reference.height}.`,
    );
  }
  if (reference.values.length !== candidate.values.length) {
    throw new RangeError(`${label} has ${candidate.values.length} cells but expected ${reference.values.length}.`);
  }
}

function validateStateSeries(states: CellularAutomataState[]): void {
  if (states.length < 2) {
    throw new RangeError("Cellular automata calibration requires at least two historical states.");
  }
  const [first] = states;
  if (!first) {
    throw new RangeError("No historical states were provided.");
  }
  if (first.values.length !== first.width * first.height) {
    throw new RangeError("Historical state dimensions do not match the number of cells.");
  }
  for (const state of states.slice(1)) {
    assertMatchingGrid(first, state, "Historical state");
  }
}

function normalizeSurface(
  surface: CellularAutomataSurface,
  label: string,
): CellularAutomataSurface {
  if (surface.values.length !== surface.width * surface.height) {
    throw new RangeError(`${label} dimensions do not match the number of values.`);
  }
  return {
    ...surface,
    extent: surface.extent ?? DEFAULT_EXTENT,
    values: surface.values.map((value) => (Number.isFinite(value) ? value : 0)),
  };
}

function normalizeState(
  state: CellularAutomataState,
  label: string,
): CellularAutomataState {
  const normalized = normalizeSurface(state, label);
  return {
    ...normalized,
    step: state.step,
    label: state.label ?? String(state.step),
  };
}

function normalizeConstraints(
  constraints: CellularAutomataConstraints | undefined,
): CellularAutomataConstraints | undefined {
  if (!constraints) {
    return undefined;
  }

  const normalized: CellularAutomataConstraints = {};
  if (constraints.protectedAreas) {
    normalized.protectedAreas = normalizeSurface(
      constraints.protectedAreas,
      "Protected-area constraint",
    );
  }
  if (constraints.water) {
    normalized.water = normalizeSurface(constraints.water, "Water constraint");
  }
  if (constraints.slope) {
    normalized.slope = normalizeSurface(constraints.slope, "Slope constraint");
  }
  if (constraints.existingUrbanStructure) {
    normalized.existingUrbanStructure = normalizeSurface(
      constraints.existingUrbanStructure,
      "Existing urban-structure surface",
    );
  }

  return normalized;
}

function isUrban(value: number, threshold: number): boolean {
  return value >= threshold;
}

function getRow(index: number, width: number): number {
  return Math.floor(index / width);
}

function getColumn(index: number, width: number): number {
  return index % width;
}

function countUrbanCells(values: number[], threshold: number): number {
  let total = 0;
  for (const value of values) {
    if (isUrban(value, threshold)) {
      total += 1;
    }
  }
  return total;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function quantile(values: number[], probability: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const position = clamp(probability, 0, 1) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) {
    return sorted[lower] ?? 0;
  }
  const lowerValue = sorted[lower] ?? 0;
  const upperValue = sorted[upper] ?? lowerValue;
  return lowerValue + (upperValue - lowerValue) * (position - lower);
}

function createSeededRandom(seed = 20260412): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function computeNeighborhoodShare(
  values: number[],
  width: number,
  height: number,
  index: number,
  radius: 1 | 2,
  threshold: number,
): number {
  const row = getRow(index, width);
  const column = getColumn(index, width);
  let urbanCount = 0;
  let total = 0;

  for (let y = Math.max(0, row - radius); y <= Math.min(height - 1, row + radius); y += 1) {
    for (let x = Math.max(0, column - radius); x <= Math.min(width - 1, column + radius); x += 1) {
      if (x === column && y === row) {
        continue;
      }
      total += 1;
      const neighborIndex = y * width + x;
      if (isUrban(values[neighborIndex] ?? 0, threshold)) {
        urbanCount += 1;
      }
    }
  }

  return total > 0 ? urbanCount / total : 0;
}

function buildConstraintSummary(
  suitabilitySurface: CellularAutomataSurface,
  constraints: CellularAutomataConstraints | undefined,
  maxSlope: number,
): CellularAutomataConstraintSummary {
  const protectedCells = constraints?.protectedAreas?.values.filter((value) => value >= 0.5).length ?? 0;
  const waterCells = constraints?.water?.values.filter((value) => value >= 0.5).length ?? 0;
  const steepSlopeCells = constraints?.slope?.values.filter((value) => value > maxSlope).length ?? 0;
  const structureLimitedCells = constraints?.existingUrbanStructure?.values.filter((value) => value < 0.2).length ?? 0;

  if (suitabilitySurface.values.length === 0) {
    return {
      protectedCells: 0,
      waterCells: 0,
      steepSlopeCells: 0,
      structureLimitedCells: 0,
    };
  }

  return {
    protectedCells,
    waterCells,
    steepSlopeCells,
    structureLimitedCells,
  };
}

function buildCellFeatureCollection(
  state: CellularAutomataState,
  options?: {
    scoreSurface?: number[];
    blockedCells?: Set<number>;
  },
): GeoJSON.FeatureCollection {
  const extent = state.extent ?? DEFAULT_EXTENT;
  const [west, south, east, north] = extent;
  const cellWidth = (east - west) / state.width;
  const cellHeight = (north - south) / state.height;
  const features: GeoJSON.Feature[] = [];

  for (let row = 0; row < state.height; row += 1) {
    const top = north - row * cellHeight;
    const bottom = north - (row + 1) * cellHeight;

    for (let column = 0; column < state.width; column += 1) {
      const index = row * state.width + column;
      const left = west + column * cellWidth;
      const right = west + (column + 1) * cellWidth;

      features.push({
        type: "Feature",
        id: `${String(state.step)}-${row}-${column}`,
        properties: {
          cell_id: `${row}-${column}`,
          row,
          column,
          urban_state: state.values[index] ?? 0,
          step: state.step,
          label: state.label ?? String(state.step),
          ...(options?.scoreSurface
            ? { transition_score: Number((options.scoreSurface[index] ?? 0).toFixed(4)) }
            : {}),
          ...(options?.blockedCells
            ? { constraint_blocked: options.blockedCells.has(index) }
            : {}),
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [left, bottom],
            [right, bottom],
            [right, top],
            [left, top],
            [left, bottom],
          ]],
        },
      });
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

function collectTransitionSamples(
  historicalStates: CellularAutomataState[],
  suitabilitySurface: CellularAutomataSurface,
  constraints: CellularAutomataConstraints | undefined,
  radius: 1 | 2,
  threshold: number,
  maxSlope: number,
): {
  positive: TransitionSample[];
  stable: TransitionSample[];
  meanNewUrbanCells: number;
  growthRate: number;
} {
  const positive: TransitionSample[] = [];
  const stable: TransitionSample[] = [];
  const newUrbanCounts: number[] = [];
  const growthRates: number[] = [];
  const size = suitabilitySurface.values.length;

  for (let pairIndex = 0; pairIndex < historicalStates.length - 1; pairIndex += 1) {
    const previous = historicalStates[pairIndex]!;
    const next = historicalStates[pairIndex + 1]!;
    let newUrbanCount = 0;
    let developableCount = 0;

    for (let index = 0; index < size; index += 1) {
      const previousUrban = isUrban(previous.values[index] ?? 0, threshold);
      const nextUrban = isUrban(next.values[index] ?? 0, threshold);
      const protectedBlocked = (constraints?.protectedAreas?.values[index] ?? 0) >= 0.5;
      const waterBlocked = (constraints?.water?.values[index] ?? 0) >= 0.5;
      const slopeValue = clamp01(constraints?.slope?.values[index] ?? 0);

      if (protectedBlocked || waterBlocked || slopeValue > maxSlope) {
        continue;
      }

      const suitability = clamp01(suitabilitySurface.values[index] ?? 0);
      const neighborhood = computeNeighborhoodShare(
        previous.values,
        previous.width,
        previous.height,
        index,
        radius,
        threshold,
      );
      const structure = clamp01(
        constraints?.existingUrbanStructure?.values[index] ?? neighborhood,
      );
      const sample: TransitionSample = {
        suitability,
        neighborhood,
        structure,
        slope: slopeValue,
      };

      if (!previousUrban) {
        developableCount += 1;
        if (nextUrban) {
          newUrbanCount += 1;
          positive.push(sample);
        } else {
          stable.push(sample);
        }
      }
    }

    newUrbanCounts.push(newUrbanCount);
    growthRates.push(developableCount > 0 ? newUrbanCount / developableCount : 0);
  }

  return {
    positive,
    stable,
    meanNewUrbanCells: mean(newUrbanCounts),
    growthRate: mean(growthRates),
  };
}

export function calibrateCellularAutomata(
  input: CellularAutomataCalibrationInput,
): CellularAutomataCalibrationSummary {
  validateStateSeries(input.historicalStates);
  const normalizedStates = input.historicalStates.map((state, index) =>
    normalizeState(state, `Historical state ${index + 1}`),
  );
  const suitabilitySurface = normalizeSurface(input.suitabilitySurface, "Suitability surface");
  const constraints = normalizeConstraints(input.constraints);

  assertMatchingGrid(normalizedStates[0]!, suitabilitySurface, "Suitability surface");
  assertMatchingGrid(normalizedStates[0]!, constraints?.protectedAreas, "Protected-area constraint");
  assertMatchingGrid(normalizedStates[0]!, constraints?.water, "Water constraint");
  assertMatchingGrid(normalizedStates[0]!, constraints?.slope, "Slope constraint");
  assertMatchingGrid(normalizedStates[0]!, constraints?.existingUrbanStructure, "Existing urban-structure surface");

  const neighborhoodRadius = input.neighborhoodRadius ?? 1;
  const urbanThreshold = clamp01(input.urbanThreshold ?? 0.5);
  const maxSlope = clamp01(input.maxSlope ?? 0.7);

  const samples = collectTransitionSamples(
    normalizedStates,
    suitabilitySurface,
    constraints,
    neighborhoodRadius,
    urbanThreshold,
    maxSlope,
  );

  const positiveSuitability = samples.positive.map((sample) => sample.suitability);
  const stableSuitability = samples.stable.map((sample) => sample.suitability);
  const positiveNeighborhood = samples.positive.map((sample) => sample.neighborhood);
  const stableNeighborhood = samples.stable.map((sample) => sample.neighborhood);
  const positiveStructure = samples.positive.map((sample) => sample.structure);
  const stableStructure = samples.stable.map((sample) => sample.structure);
  const positiveSlope = samples.positive.map((sample) => sample.slope);
  const stableSlope = samples.stable.map((sample) => sample.slope);

  const rawSuitabilityWeight = Math.max(mean(positiveSuitability) - mean(stableSuitability), 0.05);
  const rawNeighborhoodWeight = Math.max(mean(positiveNeighborhood) - mean(stableNeighborhood), 0.05);
  const rawStructureWeight = Math.max(mean(positiveStructure) - mean(stableStructure), 0.03);
  const rawWeightTotal = rawSuitabilityWeight + rawNeighborhoodWeight + rawStructureWeight;

  const suitabilityWeight = rawSuitabilityWeight / rawWeightTotal;
  const neighborhoodWeight = rawNeighborhoodWeight / rawWeightTotal;
  const structureWeight = rawStructureWeight / rawWeightTotal;

  const slopePenalty = clamp01((mean(stableSlope) - mean(positiveSlope) + 0.2) / 1.2);
  const spontaneousGrowthShare = clamp01(
    samples.positive.length > 0
      ? samples.positive.filter((sample) => sample.neighborhood < 0.2).length / samples.positive.length
      : 0.05,
  );

  const transitionScores = samples.positive.map((sample) =>
    suitabilityWeight * sample.suitability +
    neighborhoodWeight * sample.neighborhood +
    structureWeight * sample.structure -
    slopePenalty * sample.slope,
  );
  const stableScores = samples.stable.map((sample) =>
    suitabilityWeight * sample.suitability +
    neighborhoodWeight * sample.neighborhood +
    structureWeight * sample.structure -
    slopePenalty * sample.slope,
  );

  const minTransitionScore = clamp01(
    ((mean(transitionScores) + mean(stableScores)) / 2) - spontaneousGrowthShare * 0.08,
  );

  return {
    neighborhoodRadius,
    urbanThreshold,
    maxSlope,
    growthRate: clamp(samples.growthRate, 0.001, 0.95),
    meanNewUrbanCells: Math.max(1, Math.round(samples.meanNewUrbanCells)),
    spontaneousGrowthShare,
    suitabilityWeight: Number(suitabilityWeight.toFixed(4)),
    neighborhoodWeight: Number(neighborhoodWeight.toFixed(4)),
    structureWeight: Number(structureWeight.toFixed(4)),
    slopePenalty: Number(slopePenalty.toFixed(4)),
    neighborhoodThreshold: clamp01(quantile(positiveNeighborhood, 0.25) || 0.18),
    structureThreshold: clamp01(quantile(positiveStructure, 0.25) || 0.15),
    minTransitionScore: Number(minTransitionScore.toFixed(4)),
    transitionSampleSize: samples.positive.length,
    stableSampleSize: samples.stable.length,
  };
}

function computeTargetNewUrbanCells(
  currentUrbanCells: number,
  calibration: CellularAutomataCalibrationSummary,
  growthMultiplier: number,
): number {
  const demandFromRate = currentUrbanCells * calibration.growthRate * growthMultiplier;
  const demandFromHistory = calibration.meanNewUrbanCells * growthMultiplier;
  return Math.max(0, Math.round(demandFromRate * 0.45 + demandFromHistory * 0.55));
}

export function validateCellularAutomataPrediction(
  baseline: CellularAutomataState,
  predicted: CellularAutomataState,
  observed: CellularAutomataState,
  threshold = 0.5,
): CellularAutomataValidationSummary {
  assertMatchingGrid(baseline, predicted, "Predicted state");
  assertMatchingGrid(baseline, observed, "Observed state");

  let urbanTruePositive = 0;
  let urbanFalsePositive = 0;
  let urbanFalseNegative = 0;
  let urbanTrueNegative = 0;
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;

  for (let index = 0; index < baseline.values.length; index += 1) {
    const baselineUrban = isUrban(baseline.values[index] ?? 0, threshold);
    const predictedUrban = isUrban(predicted.values[index] ?? 0, threshold);
    const observedUrban = isUrban(observed.values[index] ?? 0, threshold);

    if (predictedUrban && observedUrban) {
      urbanTruePositive += 1;
    } else if (predictedUrban && !observedUrban) {
      urbanFalsePositive += 1;
    } else if (!predictedUrban && observedUrban) {
      urbanFalseNegative += 1;
    } else {
      urbanTrueNegative += 1;
    }

    const predictedChange = !baselineUrban && predictedUrban;
    const observedChange = !baselineUrban && observedUrban;

    if (predictedChange && observedChange) {
      hits += 1;
    } else if (!predictedChange && observedChange) {
      misses += 1;
    } else if (predictedChange && !observedChange) {
      falseAlarms += 1;
    } else {
      correctRejections += 1;
    }
  }

  const totalUrban = urbanTruePositive + urbanFalsePositive + urbanFalseNegative + urbanTrueNegative;
  const totalChange = hits + misses + falseAlarms + correctRejections;
  const overallAccuracy = totalUrban > 0 ? (urbanTruePositive + urbanTrueNegative) / totalUrban : 0;
  const figureOfMerit = hits + misses + falseAlarms > 0
    ? hits / (hits + misses + falseAlarms)
    : 0;

  const urbanPredictedPositive = urbanTruePositive + urbanFalsePositive;
  const urbanPredictedNegative = urbanFalseNegative + urbanTrueNegative;
  const urbanObservedPositive = urbanTruePositive + urbanFalseNegative;
  const urbanObservedNegative = urbanFalsePositive + urbanTrueNegative;
  const urbanExpectedAgreement = totalUrban > 0
    ? (
        (urbanPredictedPositive * urbanObservedPositive) +
        (urbanPredictedNegative * urbanObservedNegative)
      ) / (totalUrban * totalUrban)
    : 0;
  const kappa = 1 - urbanExpectedAgreement === 0
    ? 0
    : (overallAccuracy - urbanExpectedAgreement) / (1 - urbanExpectedAgreement);

  const changeObservedAgreement = totalChange > 0 ? (hits + correctRejections) / totalChange : 0;
  const changePredictedPositive = hits + falseAlarms;
  const changePredictedNegative = misses + correctRejections;
  const changeObservedPositive = hits + misses;
  const changeObservedNegative = falseAlarms + correctRejections;
  const changeExpectedAgreement = totalChange > 0
    ? (
        (changePredictedPositive * changeObservedPositive) +
        (changePredictedNegative * changeObservedNegative)
      ) / (totalChange * totalChange)
    : 0;
  const kappaChange = 1 - changeExpectedAgreement === 0
    ? 0
    : (changeObservedAgreement - changeExpectedAgreement) / (1 - changeExpectedAgreement);

  const fitScore = (figureOfMerit * 0.45) + (clamp01(kappa) * 0.35) + (clamp01(kappaChange) * 0.2);
  const fitQuality: CellularAutomataValidationSummary["fitQuality"] = fitScore >= 0.58
    ? "strong"
    : fitScore >= 0.36
    ? "moderate"
    : "weak";

  return {
    figureOfMerit: Number(figureOfMerit.toFixed(4)),
    overallAccuracy: Number(overallAccuracy.toFixed(4)),
    kappa: Number(kappa.toFixed(4)),
    kappaChange: Number(kappaChange.toFixed(4)),
    fitQuality,
    confusion: {
      urban: {
        truePositive: urbanTruePositive,
        falsePositive: urbanFalsePositive,
        falseNegative: urbanFalseNegative,
        trueNegative: urbanTrueNegative,
      },
      change: {
        hits,
        misses,
        falseAlarms,
        correctRejections,
      },
    },
  };
}

export function simulateCellularAutomata(
  options: CellularAutomataSimulationOptions,
): CellularAutomataResult {
  const historicalStates = options.historicalStates?.map((state, index) =>
    normalizeState(state, `Historical state ${index + 1}`),
  );
  const lastHistoricalState = historicalStates && historicalStates.length > 0
    ? historicalStates[historicalStates.length - 1]
    : undefined;
  const calibration = options.calibration ?? (() => {
    if (!historicalStates) {
      throw new RangeError("Provide either a calibration summary or historical states for calibration.");
    }
    return calibrateCellularAutomata({
      historicalStates,
      suitabilitySurface: options.suitabilitySurface,
      ...(options.constraints ? { constraints: options.constraints } : {}),
      ...(options.neighborhoodRadius ? { neighborhoodRadius: options.neighborhoodRadius } : {}),
      ...(options.maxSlope != null ? { maxSlope: options.maxSlope } : {}),
      ...(options.urbanThreshold != null ? { urbanThreshold: options.urbanThreshold } : {}),
    });
  })();

  const suitabilitySurface = normalizeSurface(options.suitabilitySurface, "Suitability surface");
  const constraints = normalizeConstraints(options.constraints);

  const initialState = normalizeState(
    options.initialState
      ?? lastHistoricalState
      ?? (() => { throw new RangeError("No initial state was provided."); })(),
    "Initial state",
  );

  assertMatchingGrid(initialState, suitabilitySurface, "Suitability surface");
  assertMatchingGrid(initialState, constraints?.protectedAreas, "Protected-area constraint");
  assertMatchingGrid(initialState, constraints?.water, "Water constraint");
  assertMatchingGrid(initialState, constraints?.slope, "Slope constraint");
  assertMatchingGrid(initialState, constraints?.existingUrbanStructure, "Existing urban-structure surface");

  const neighborhoodRadius = options.neighborhoodRadius ?? calibration.neighborhoodRadius;
  const urbanThreshold = clamp01(options.urbanThreshold ?? calibration.urbanThreshold);
  const maxSlope = clamp01(options.maxSlope ?? calibration.maxSlope);
  const stochasticPerturbation = clamp01(options.stochasticPerturbation ?? 0.18);
  const growthMultiplier = clamp(options.growthMultiplier ?? 1, 0, 4);
  const minTransitionScore = clamp01(options.minTransitionScore ?? calibration.minTransitionScore);
  const steps = Math.max(1, options.steps ?? 1);
  const random = createSeededRandom(options.seed ?? 20260412);

  const predictedStates: CellularAutomataState[] = [
    {
      ...initialState,
      values: [...initialState.values],
      label: initialState.label ?? "Initial state",
    },
  ];
  const frames: CellularAutomataFrame[] = [];
  const stepSummaries: CellularAutomataStepSummary[] = [];

  let currentValues = [...initialState.values];

  const pushFrame = (
    state: CellularAutomataState,
    summary: CellularAutomataStepSummary,
    scoreSurface?: number[],
    blockedCells?: Set<number>,
  ) => {
    const featureOptions = {
      ...(scoreSurface ? { scoreSurface } : {}),
      ...(blockedCells ? { blockedCells } : {}),
    };
    frames.push({
      step: state.step,
      ...(state.label ? { label: state.label } : {}),
      state,
      summary,
      featureCollection: buildCellFeatureCollection(
        state,
        Object.keys(featureOptions).length > 0 ? featureOptions : undefined,
      ),
    });
  };

  const initialSummary: CellularAutomataStepSummary = {
    step: initialState.step,
    label: initialState.label ?? String(initialState.step),
    newUrbanCells: 0,
    totalUrbanCells: countUrbanCells(currentValues, urbanThreshold),
    targetNewUrbanCells: 0,
    eligibleCandidateCells: 0,
    meanSelectedScore: 0,
  };
  stepSummaries.push(initialSummary);
  pushFrame(predictedStates[0]!, initialSummary);

  for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
    const currentUrbanCells = countUrbanCells(currentValues, urbanThreshold);
    const targetNewUrbanCells = computeTargetNewUrbanCells(
      currentUrbanCells,
      calibration,
      growthMultiplier,
    );
    const blockedCells = new Set<number>();
    const transitionScores = new Array<number>(currentValues.length).fill(0);
    const candidates: Array<{ index: number; score: number }> = [];

    for (let index = 0; index < currentValues.length; index += 1) {
      if (isUrban(currentValues[index] ?? 0, urbanThreshold)) {
        continue;
      }

      const protectedBlocked = (constraints?.protectedAreas?.values[index] ?? 0) >= 0.5;
      const waterBlocked = (constraints?.water?.values[index] ?? 0) >= 0.5;
      const slopeValue = clamp01(constraints?.slope?.values[index] ?? 0);

      if (protectedBlocked || waterBlocked || slopeValue > maxSlope) {
        blockedCells.add(index);
        continue;
      }

      const suitability = clamp01(suitabilitySurface.values[index] ?? 0);
      const neighborhood = computeNeighborhoodShare(
        currentValues,
        initialState.width,
        initialState.height,
        index,
        neighborhoodRadius,
        urbanThreshold,
      );
      const structure = clamp01(
        constraints?.existingUrbanStructure?.values[index] ?? neighborhood,
      );

      const structureEligible =
        structure >= calibration.structureThreshold ||
        neighborhood >= calibration.neighborhoodThreshold ||
        random() < calibration.spontaneousGrowthShare * (0.65 + stochasticPerturbation);

      if (!structureEligible) {
        blockedCells.add(index);
        continue;
      }

      const noise = (random() - 0.5) * 2 * stochasticPerturbation;
      const rawScore =
        (calibration.suitabilityWeight * suitability) +
        (calibration.neighborhoodWeight * neighborhood) +
        (calibration.structureWeight * structure) -
        (calibration.slopePenalty * slopeValue) +
        noise;
      const score = clamp01(rawScore);
      transitionScores[index] = score;
      candidates.push({ index, score });
    }

    candidates.sort((left, right) => right.score - left.score);
    const relaxedThreshold = clamp01(minTransitionScore - stochasticPerturbation * 0.1);
    const selectedCandidates = candidates
      .filter((candidate) => candidate.score >= relaxedThreshold)
      .slice(0, targetNewUrbanCells);

    if (selectedCandidates.length === 0 && candidates.length > 0 && targetNewUrbanCells > 0) {
      selectedCandidates.push(candidates[0]!);
    }

    const nextValues = [...currentValues];
    for (const candidate of selectedCandidates) {
      nextValues[candidate.index] = 1;
    }

    const nextState: CellularAutomataState = {
      width: initialState.width,
      height: initialState.height,
      values: nextValues,
      step: stepIndex + 1,
      label: `${options.scenarioName ?? "Simulation"} step ${stepIndex + 1}`,
      ...(initialState.extent ? { extent: initialState.extent } : {}),
    };
    const summary: CellularAutomataStepSummary = {
      step: nextState.step,
      label: nextState.label ?? String(nextState.step),
      newUrbanCells: selectedCandidates.length,
      totalUrbanCells: countUrbanCells(nextValues, urbanThreshold),
      targetNewUrbanCells,
      eligibleCandidateCells: candidates.length,
      meanSelectedScore: Number(mean(selectedCandidates.map((candidate) => candidate.score)).toFixed(4)),
    };

    predictedStates.push(nextState);
    stepSummaries.push(summary);
    pushFrame(nextState, summary, transitionScores, blockedCells);
    currentValues = nextValues;
  }

  const observedState = options.observedState
    ? normalizeState(options.observedState, "Observed state")
    : undefined;
  if (observedState) {
    assertMatchingGrid(initialState, observedState, "Observed state");
  }

  const validation = observedState
    ? validateCellularAutomataPrediction(
        predictedStates[0]!,
        predictedStates[predictedStates.length - 1]!,
        observedState,
        urbanThreshold,
      )
    : undefined;

  return {
    frames,
    valueField: "urban_state",
    calibration,
    predictedStates,
    constraintSummary: buildConstraintSummary(suitabilitySurface, constraints, maxSlope),
    stepSummaries,
    simplifications: [...DEFAULT_SIMPLIFICATIONS],
    ...(options.scenarioName ? { scenarioName: options.scenarioName } : {}),
    ...(observedState ? { observedState } : {}),
    ...(validation ? { validation } : {}),
  };
}

export function runCellularAutomataScenario(
  options: CellularAutomataSimulationOptions,
): CellularAutomataResult {
  return simulateCellularAutomata(options);
}

export const CELLULAR_AUTOMATA_SIMPLIFICATIONS = [...DEFAULT_SIMPLIFICATIONS];
