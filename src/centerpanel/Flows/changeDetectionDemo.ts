export type ChangeDetectionMethod = "post_classification" | "image_differencing" | "cva";

export interface ChangeDetectionScenarioConfig {
  t0Source: string;
  t0Date: string;
  t1Source: string;
  t1Date: string;
  method: ChangeDetectionMethod;
  changeThreshold: number;
  classLabels: string[];
  validationSampleSize: number;
}

export interface ChangeDetectionTransitionEntry {
  from: string;
  to: string;
  count: number;
  share: number;
}

export interface ChangeDetectionScenarioSummary {
  totalCells: number;
  changedCellCount: number;
  unchangedCellCount: number;
  changedShare: number;
  transitionMatrix: number[][];
  dominantTransitions: ChangeDetectionTransitionEntry[];
  spatialFocus: string;
}

export interface ChangeDetectionScenarioValidationInput {
  prediction: Uint8Array;
  truth: Uint8Array;
  classLabels: string[];
  numClasses: number;
}

export interface ChangeDetectionScenario {
  summary: ChangeDetectionScenarioSummary;
  validation: ChangeDetectionScenarioValidationInput;
}

const DEFAULT_CLASS_LABELS = [
  "Built-up",
  "Vegetation",
  "Water",
  "Bare Soil",
  "Agriculture",
  "Road / Impervious",
];

interface SemanticIndices {
  built: number | null;
  vegetation: number | null;
  water: number | null;
  bare: number | null;
  agriculture: number | null;
  road: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeClassLabels(labels: string[]): string[] {
  const cleaned = labels
    .map((label) => label.trim())
    .filter((label, index, all) => label.length > 0 && all.indexOf(label) === index);

  if (cleaned.length >= 2) {
    return cleaned;
  }

  return [...DEFAULT_CLASS_LABELS];
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let next = (seed += 0x6d2b79f5);
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function normaliseWeights(weights: number[]): number[] {
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return weights.map(() => 1 / weights.length);
  }
  return weights.map((value) => value / total);
}

function pickIndex(weights: number[], rng: () => number): number {
  let target = rng();
  for (let index = 0; index < weights.length; index += 1) {
    target -= weights[index];
    if (target <= 0) {
      return index;
    }
  }
  return weights.length - 1;
}

function findSemanticIndex(labels: string[], pattern: RegExp): number | null {
  const matchIndex = labels.findIndex((label) => pattern.test(label));
  return matchIndex >= 0 ? matchIndex : null;
}

function resolveSemanticIndices(labels: string[]): SemanticIndices {
  return {
    built: findSemanticIndex(labels, /(built|urban)/i),
    vegetation: findSemanticIndex(labels, /(veget|green|forest|tree)/i),
    water: findSemanticIndex(labels, /water/i),
    bare: findSemanticIndex(labels, /(bare|soil|sand|earth)/i),
    agriculture: findSemanticIndex(labels, /(agric|crop|farm)/i),
    road: findSemanticIndex(labels, /(road|street|transport|impervious)/i),
  };
}

function buildBaseWeights(labels: string[], semantics: SemanticIndices): number[] {
  const weights = labels.map(() => 1);

  if (semantics.built != null) weights[semantics.built] = 1.9;
  if (semantics.vegetation != null) weights[semantics.vegetation] = 2.1;
  if (semantics.water != null) weights[semantics.water] = 0.7;
  if (semantics.bare != null) weights[semantics.bare] = 1.1;
  if (semantics.agriculture != null) weights[semantics.agriculture] = 1.5;
  if (semantics.road != null) weights[semantics.road] = 1.2;

  return normaliseWeights(weights);
}

function resolveChangeRate(method: ChangeDetectionMethod, threshold: number): number {
  const base = method === "post_classification"
    ? 0.18
    : method === "image_differencing"
      ? 0.22
      : 0.26;
  return clamp(base - threshold / 250, 0.08, 0.32);
}

function resolveClassSensitivity(classIndex: number, semantics: SemanticIndices): number {
  if (classIndex === semantics.water) return 0.35;
  if (classIndex === semantics.built) return 0.55;
  if (classIndex === semantics.road) return 0.45;
  if (classIndex === semantics.agriculture) return 1.15;
  if (classIndex === semantics.vegetation) return 0.95;
  if (classIndex === semantics.bare) return 0.9;
  return 0.8;
}

function chooseTransitionTarget(from: number, classCount: number, semantics: SemanticIndices, rng: () => number): number {
  const candidates: Array<{ target: number | null; weight: number }> = [];

  if (from === semantics.agriculture || from === semantics.vegetation) {
    candidates.push({ target: semantics.built, weight: 0.55 });
    candidates.push({ target: semantics.road, weight: 0.2 });
    candidates.push({ target: semantics.bare, weight: 0.15 });
  } else if (from === semantics.bare) {
    candidates.push({ target: semantics.built, weight: 0.45 });
    candidates.push({ target: semantics.road, weight: 0.3 });
    candidates.push({ target: semantics.vegetation, weight: 0.15 });
  } else if (from === semantics.built) {
    candidates.push({ target: semantics.road, weight: 0.4 });
    candidates.push({ target: semantics.vegetation, weight: 0.15 });
  } else if (from === semantics.water) {
    candidates.push({ target: semantics.vegetation, weight: 0.45 });
    candidates.push({ target: semantics.bare, weight: 0.25 });
  } else if (from === semantics.road) {
    candidates.push({ target: semantics.built, weight: 0.55 });
    candidates.push({ target: semantics.bare, weight: 0.2 });
  }

  const validCandidates = candidates.filter((candidate): candidate is { target: number; weight: number } => (
    candidate.target != null && candidate.target >= 0 && candidate.target < classCount && candidate.target !== from
  ));

  if (validCandidates.length === 0) {
    return (from + 1) % classCount;
  }

  return validCandidates[pickIndex(normaliseWeights(validCandidates.map((candidate) => candidate.weight)), rng)]!.target;
}

function buildTransitionMatrix(
  baseLabels: Uint8Array,
  nextLabels: Uint8Array,
  classCount: number,
): number[][] {
  const matrix = Array.from({ length: classCount }, () => Array.from({ length: classCount }, () => 0));
  for (let index = 0; index < baseLabels.length; index += 1) {
    matrix[baseLabels[index]][nextLabels[index]] += 1;
  }
  return matrix;
}

function sampleTruthLabels(nextLabels: Uint8Array, sampleSize: number, rng: () => number): Uint8Array {
  return Uint8Array.from(Array.from({ length: sampleSize }, () => {
    const sourceIndex = Math.floor(rng() * nextLabels.length);
    return nextLabels[sourceIndex] ?? 0;
  }));
}

function resolveValidationAccuracy(method: ChangeDetectionMethod, threshold: number): number {
  const base = method === "post_classification"
    ? 0.82
    : method === "image_differencing"
      ? 0.78
      : 0.74;
  return clamp(base + (threshold - 10) / 300, 0.65, 0.9);
}

function resolveClassAccuracyModifier(classIndex: number, semantics: SemanticIndices): number {
  if (classIndex === semantics.water) return 0.05;
  if (classIndex === semantics.built) return 0.03;
  if (classIndex === semantics.road) return -0.04;
  if (classIndex === semantics.agriculture) return -0.03;
  if (classIndex === semantics.vegetation) return -0.01;
  return 0;
}

function chooseConfusionTarget(from: number, classCount: number, semantics: SemanticIndices, rng: () => number): number {
  const candidates: Array<{ target: number | null; weight: number }> = [];

  if (from === semantics.built) {
    candidates.push({ target: semantics.road, weight: 0.55 });
    candidates.push({ target: semantics.bare, weight: 0.25 });
  } else if (from === semantics.road) {
    candidates.push({ target: semantics.built, weight: 0.5 });
    candidates.push({ target: semantics.bare, weight: 0.2 });
  } else if (from === semantics.vegetation) {
    candidates.push({ target: semantics.agriculture, weight: 0.45 });
    candidates.push({ target: semantics.bare, weight: 0.2 });
  } else if (from === semantics.agriculture) {
    candidates.push({ target: semantics.vegetation, weight: 0.45 });
    candidates.push({ target: semantics.built, weight: 0.2 });
  } else if (from === semantics.bare) {
    candidates.push({ target: semantics.built, weight: 0.35 });
    candidates.push({ target: semantics.road, weight: 0.35 });
  } else if (from === semantics.water) {
    candidates.push({ target: semantics.vegetation, weight: 0.2 });
  }

  const validCandidates = candidates.filter((candidate): candidate is { target: number; weight: number } => (
    candidate.target != null && candidate.target >= 0 && candidate.target < classCount && candidate.target !== from
  ));

  if (validCandidates.length === 0) {
    return (from + 1) % classCount;
  }

  return validCandidates[pickIndex(normaliseWeights(validCandidates.map((candidate) => candidate.weight)), rng)]!.target;
}

export function buildChangeDetectionScenario(config: ChangeDetectionScenarioConfig): ChangeDetectionScenario {
  const classLabels = sanitizeClassLabels(config.classLabels);
  const classCount = classLabels.length;
  const semantics = resolveSemanticIndices(classLabels);
  const seed = hashString([
    config.t0Source,
    config.t0Date,
    config.t1Source,
    config.t1Date,
    config.method,
    config.changeThreshold,
    classLabels.join("|"),
    config.validationSampleSize,
  ].join("::"));
  const rng = mulberry32(seed || 1);
  const totalCells = 576;
  const baseWeights = buildBaseWeights(classLabels, semantics);
  const changeRate = resolveChangeRate(config.method, config.changeThreshold);

  const baseLabels = Uint8Array.from(Array.from({ length: totalCells }, () => pickIndex(baseWeights, rng)));
  const nextLabels = Uint8Array.from(baseLabels);

  for (let index = 0; index < totalCells; index += 1) {
    const currentClass = baseLabels[index] ?? 0;
    const sensitivity = resolveClassSensitivity(currentClass, semantics);
    const localModifier = 0.78 + rng() * 0.44;

    if (rng() < changeRate * sensitivity * localModifier) {
      nextLabels[index] = chooseTransitionTarget(currentClass, classCount, semantics, rng);
    }
  }

  const transitionMatrix = buildTransitionMatrix(baseLabels, nextLabels, classCount);
  const changedCellCount = transitionMatrix.reduce((sum, row, fromIndex) => sum + row.reduce((rowSum, value, toIndex) => (
    rowSum + (fromIndex === toIndex ? 0 : value)
  ), 0), 0);
  const unchangedCellCount = totalCells - changedCellCount;
  const changedShare = changedCellCount / totalCells;

  const dominantTransitions = transitionMatrix.flatMap((row, fromIndex) =>
    row.map((count, toIndex) => ({ fromIndex, toIndex, count }))
      .filter((entry) => entry.fromIndex !== entry.toIndex && entry.count > 0),
  )
    .sort((left, right) => right.count - left.count)
    .slice(0, 4)
    .map((entry) => ({
      from: classLabels[entry.fromIndex] ?? `Class ${entry.fromIndex + 1}`,
      to: classLabels[entry.toIndex] ?? `Class ${entry.toIndex + 1}`,
      count: entry.count,
      share: changedCellCount > 0 ? entry.count / changedCellCount : 0,
    }));

  const sampleSize = clamp(Math.round(config.validationSampleSize), 50, 2000);
  const truth = sampleTruthLabels(nextLabels, sampleSize, rng);
  const prediction = Uint8Array.from(Array.from(truth, (truthClass) => {
    const accuracy = clamp(
      resolveValidationAccuracy(config.method, config.changeThreshold)
      + resolveClassAccuracyModifier(truthClass, semantics),
      0.55,
      0.96,
    );

    if (rng() <= accuracy) {
      return truthClass;
    }

    return chooseConfusionTarget(truthClass, classCount, semantics, rng);
  }));

  return {
    summary: {
      totalCells,
      changedCellCount,
      unchangedCellCount,
      changedShare,
      transitionMatrix,
      dominantTransitions,
      spatialFocus: "Change concentrates along the central infill corridor and the eastern logistics fringe in this teaching scenario.",
    },
    validation: {
      prediction,
      truth,
      classLabels,
      numClasses: classCount,
    },
  };
}