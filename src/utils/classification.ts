export type ClassificationMethod =
  | "equal-interval"
  | "quantile"
  | "natural-breaks"
  | "standard-deviation"
  | "manual";

export interface ClassificationClass {
  index: number;
  min: number;
  max: number;
  label: string;
  count: number;
}

export interface ClassificationResult {
  method: ClassificationMethod;
  classCount: number;
  min: number;
  max: number;
  mean: number;
  standardDeviation: number;
  breaks: number[];
  classes: ClassificationClass[];
}

export interface ClassificationOptions {
  method: ClassificationMethod;
  classCount: number;
  manualBreaks?: number[];
}

const STANDARD_DEVIATION_BREAKS = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2] as const;

function toSortedFinite(values: number[]): number[] {
  return values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function populationStandardDeviation(values: number[], meanValue: number): number {
  if (values.length <= 1) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - meanValue) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function clampClassCount(classCount: number, maxClasses: number): number {
  return Math.max(1, Math.min(Math.floor(classCount), maxClasses));
}

function formatNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (abs >= 1_000) return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (abs >= 100) return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (abs >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatZ(z: number | null): string {
  if (z == null) return "";
  return z > 0 ? `+${z}` : `${z}`;
}

function buildStandardDeviationLabel(lowerZ: number | null, upperZ: number | null): string {
  if (lowerZ == null && upperZ == null) return "All values";
  if (lowerZ == null) return `< μ ${formatZ(upperZ)}σ`;
  if (upperZ == null) return `≥ μ ${formatZ(lowerZ)}σ`;
  return `μ ${formatZ(lowerZ)}σ to μ ${formatZ(upperZ)}σ`;
}

function buildGenericLabel(min: number, max: number): string {
  return `${formatNumber(min)} – ${formatNumber(max)}`;
}

function finalizeUpperBounds(min: number, max: number, upperBounds: number[]): number[] {
  if (min === max) return [max];

  const normalized = upperBounds
    .filter((value) => Number.isFinite(value) && value > min && value < max)
    .sort((a, b) => a - b);

  const deduped: number[] = [];
  for (const value of normalized) {
    if (deduped.length === 0 || value > deduped[deduped.length - 1]!) {
      deduped.push(value);
    }
  }

  if (deduped.length === 0 || deduped[deduped.length - 1] !== max) {
    deduped.push(max);
  }

  return deduped;
}

function buildClasses(
  method: ClassificationMethod,
  values: number[],
  min: number,
  max: number,
  upperBounds: number[],
  _meanValue: number,
  _standardDeviation: number,
  stdDevZBreaks: Array<number | null> = [],
): ClassificationClass[] {
  const classes: ClassificationClass[] = [];
  let lowerBound = min;

  for (let index = 0; index < upperBounds.length; index += 1) {
    const upperBound = upperBounds[index]!;
    const count = values.filter((value) => {
      if (index === 0) return value <= upperBound;
      return value > classes[index - 1]!.max && value <= upperBound;
    }).length;

    const label =
      method === "standard-deviation"
        ? buildStandardDeviationLabel(stdDevZBreaks[index] ?? null, stdDevZBreaks[index + 1] ?? null)
        : buildGenericLabel(lowerBound, upperBound);

    classes.push({
      index,
      min: lowerBound,
      max: upperBound,
      label,
      count,
    });

    lowerBound = upperBound;
  }

  if (classes.length > 0) {
    classes[classes.length - 1] = {
      ...classes[classes.length - 1]!,
      max,
      label:
        method === "standard-deviation"
          ? buildStandardDeviationLabel(
            stdDevZBreaks[stdDevZBreaks.length - 2] ?? null,
            stdDevZBreaks[stdDevZBreaks.length - 1] ?? null,
          )
          : buildGenericLabel(classes[classes.length - 1]!.min, max),
    };
  }

  return classes;
}

function equalIntervalUpperBounds(values: number[], classCount: number): number[] {
  const min = values[0]!;
  const max = values[values.length - 1]!;
  if (min === max) return [max];

  const step = (max - min) / classCount;
  const upperBounds = Array.from({ length: classCount - 1 }, (_, index) => min + step * (index + 1));
  upperBounds.push(max);
  return finalizeUpperBounds(min, max, upperBounds);
}

function quantileUpperBounds(values: number[], classCount: number): number[] {
  const min = values[0]!;
  const max = values[values.length - 1]!;
  if (min === max) return [max];

  const upperBounds: number[] = [];
  for (let index = 1; index < classCount; index += 1) {
    const quantileIndex = Math.min(
      Math.ceil((index / classCount) * values.length) - 1,
      values.length - 1,
    );
    upperBounds.push(values[quantileIndex]!);
  }
  upperBounds.push(max);
  return finalizeUpperBounds(min, max, upperBounds);
}

function intervalSquaredError(
  prefixSum: Float64Array,
  prefixSquaredSum: Float64Array,
  start: number,
  end: number,
): number {
  const count = end - start + 1;
  if (count <= 0) return 0;
  const sum = prefixSum[end]! - prefixSum[start - 1]!;
  const squaredSum = prefixSquaredSum[end]! - prefixSquaredSum[start - 1]!;
  return squaredSum - (sum * sum) / count;
}

function computeFisherJenksLayer(
  previous: Float64Array,
  current: Float64Array,
  backtrack: Int32Array,
  prefixSum: Float64Array,
  prefixSquaredSum: Float64Array,
  left: number,
  right: number,
  optLeft: number,
  optRight: number,
): void {
  if (left > right) return;

  const mid = Math.floor((left + right) / 2);
  const maxSplit = Math.min(mid - 1, optRight);
  let bestSplit = optLeft;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let split = optLeft; split <= maxSplit; split += 1) {
    const score =
      previous[split]! +
      intervalSquaredError(prefixSum, prefixSquaredSum, split + 1, mid);
    if (score < bestScore) {
      bestScore = score;
      bestSplit = split;
    }
  }

  current[mid] = bestScore;
  backtrack[mid] = bestSplit;

  computeFisherJenksLayer(
    previous,
    current,
    backtrack,
    prefixSum,
    prefixSquaredSum,
    left,
    mid - 1,
    optLeft,
    bestSplit,
  );
  computeFisherJenksLayer(
    previous,
    current,
    backtrack,
    prefixSum,
    prefixSquaredSum,
    mid + 1,
    right,
    bestSplit,
    optRight,
  );
}

function fisherJenksUpperBounds(values: number[], classCount: number): number[] {
  const n = values.length;
  const min = values[0]!;
  const max = values[n - 1]!;
  if (n === 0 || min === max) return [max];

  const uniqueValueCount = new Set(values).size;
  const clusterCount = clampClassCount(classCount, uniqueValueCount);
  if (clusterCount <= 1) return [max];

  const prefixSum = new Float64Array(n + 1);
  const prefixSquaredSum = new Float64Array(n + 1);
  for (let index = 1; index <= n; index += 1) {
    const value = values[index - 1]!;
    prefixSum[index] = prefixSum[index - 1]! + value;
    prefixSquaredSum[index] = prefixSquaredSum[index - 1]! + value * value;
  }

  let previous = new Float64Array(n + 1);
  let current = new Float64Array(n + 1);
  previous.fill(Number.POSITIVE_INFINITY);
  previous[0] = 0;
  for (let end = 1; end <= n; end += 1) {
    previous[end] = intervalSquaredError(prefixSum, prefixSquaredSum, 1, end);
  }

  const backtracks = Array.from({ length: clusterCount + 1 }, () => new Int32Array(n + 1));
  for (let klass = 2; klass <= clusterCount; klass += 1) {
    current = new Float64Array(n + 1);
    current.fill(Number.POSITIVE_INFINITY);
    computeFisherJenksLayer(
      previous,
      current,
      backtracks[klass]!,
      prefixSum,
      prefixSquaredSum,
      klass,
      n,
      klass - 1,
      n - 1,
    );
    previous = current;
  }

  const bounds: number[] = [];
  let end = n;
  for (let klass = clusterCount; klass >= 2; klass -= 1) {
    bounds.push(values[end - 1]!);
    const split = backtracks[klass]![end]!;
    end = split > 0 ? split : klass - 1;
  }
  bounds.push(values[end - 1]!);

  return finalizeUpperBounds(min, max, bounds.reverse());
}

function naturalBreakUpperBounds(values: number[], classCount: number): number[] {
  const min = values[0]!;
  const max = values[values.length - 1]!;
  if (min === max) return [max];

  return fisherJenksUpperBounds(values, classCount);
}

function standardDeviationUpperBounds(
  values: number[],
  classCount: number,
  meanValue: number,
  standardDeviation: number,
): { upperBounds: number[]; zBreaks: Array<number | null> } {
  const min = values[0]!;
  const max = values[values.length - 1]!;
  if (min === max || standardDeviation === 0) {
    return { upperBounds: [max], zBreaks: [null, null] };
  }

  const boundaryCount = Math.max(1, classCount - 1);
  const startIndex = Math.max(0, Math.floor((STANDARD_DEVIATION_BREAKS.length - boundaryCount) / 2));
  const selected = [...STANDARD_DEVIATION_BREAKS.slice(startIndex, startIndex + boundaryCount)];
  const upperBounds = finalizeUpperBounds(
    min,
    max,
    selected.map((z) => meanValue + z * standardDeviation).concat(max),
  );

  const survivingBreaks = selected.filter((z) => {
    const boundary = meanValue + z * standardDeviation;
    return Number.isFinite(boundary) && boundary > min && boundary < max;
  });

  return {
    upperBounds,
    zBreaks: [null, ...survivingBreaks, null],
  };
}

function manualUpperBounds(values: number[], manualBreaks: number[]): number[] {
  const min = values[0]!;
  const max = values[values.length - 1]!;
  if (min === max) return [max];

  return finalizeUpperBounds(min, max, manualBreaks.concat(max));
}

export function parseManualBreaks(input: string): number[] {
  const tokens = input
    .split(/[\n,;]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) return [];

  const values = tokens.map((token) => Number(token));
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Manual breaks must contain only numeric values.");
  }

  return [...new Set(values)].sort((a, b) => a - b);
}

export function findClassificationClassIndex(
  value: number,
  classification: Pick<ClassificationResult, "classes">,
): number {
  if (!Number.isFinite(value)) return -1;
  const { classes } = classification;
  for (let index = 0; index < classes.length; index += 1) {
    const classRange = classes[index]!;
    if (index === classes.length - 1 || value <= classRange.max) {
      return index;
    }
  }
  return classes.length - 1;
}

export function getClassificationLabel(
  value: number,
  classification: Pick<ClassificationResult, "classes">,
): string | null {
  const index = findClassificationClassIndex(value, classification);
  return index >= 0 ? classification.classes[index]!.label : null;
}

export function classifyNumericValues(
  inputValues: number[],
  options: ClassificationOptions,
): ClassificationResult {
  const values = toSortedFinite(inputValues);
  if (values.length === 0) {
    throw new Error("Classification requires at least one numeric value.");
  }

  const min = values[0]!;
  const max = values[values.length - 1]!;
  const meanValue = average(values);
  const standardDeviation = populationStandardDeviation(values, meanValue);
  const desiredClassCount = clampClassCount(options.classCount, values.length);

  let upperBounds: number[] = [max];
  let zBreaks: Array<number | null> = [];

  switch (options.method) {
    case "equal-interval":
      upperBounds = equalIntervalUpperBounds(values, desiredClassCount);
      break;
    case "quantile":
      upperBounds = quantileUpperBounds(values, desiredClassCount);
      break;
    case "natural-breaks":
      upperBounds = naturalBreakUpperBounds(values, desiredClassCount);
      break;
    case "standard-deviation": {
      const result = standardDeviationUpperBounds(values, desiredClassCount, meanValue, standardDeviation);
      upperBounds = result.upperBounds;
      zBreaks = result.zBreaks;
      break;
    }
    case "manual": {
      const manualBreaks = options.manualBreaks ?? [];
      if (manualBreaks.length !== desiredClassCount - 1) {
        throw new Error(`Manual classification requires exactly ${desiredClassCount - 1} break values.`);
      }
      upperBounds = manualUpperBounds(values, manualBreaks);
      break;
    }
    default:
      upperBounds = quantileUpperBounds(values, desiredClassCount);
  }

  const classes = buildClasses(
    options.method,
    values,
    min,
    max,
    upperBounds,
    meanValue,
    standardDeviation,
    zBreaks,
  );

  return {
    method: options.method,
    classCount: classes.length,
    min,
    max,
    mean: meanValue,
    standardDeviation,
    breaks: classes.map((entry) => entry.max),
    classes,
  };
}
