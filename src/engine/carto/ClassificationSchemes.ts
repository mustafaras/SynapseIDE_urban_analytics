/**
 * Classification algorithms for cartographic visualization.
 *
 * Each function accepts a numeric array and a target number of classes,
 * returning break values and the corresponding class ranges.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ClassRange {
  min: number;
  max: number;
}

export interface ClassificationResult {
  /** Upper boundary of each class (length === numClasses). */
  breaks: number[];
  /** Closed-interval ranges per class. */
  classRanges: ClassRange[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function sorted(v: number[]): number[] {
  return [...v].sort((a, b) => a - b);
}

function mean(v: number[]): number {
  return v.reduce((s, x) => s + x, 0) / v.length;
}

function stddev(v: number[]): number {
  const m = mean(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);
}

function buildRanges(sortedVals: number[], breaks: number[]): ClassRange[] {
  const ranges: ClassRange[] = [];
  let prevMin = sortedVals[0];
  for (const b of breaks) {
    ranges.push({ min: prevMin, max: b });
    prevMin = b;
  }
  return ranges;
}

/* ------------------------------------------------------------------ */
/*  1. Natural Breaks (Fisher-Jenks optimisation)                      */
/* ------------------------------------------------------------------ */

export function naturalBreaks(
  values: number[],
  numClasses: number,
): ClassificationResult {
  const data = sorted(values);
  const n = data.length;
  if (n === 0 || numClasses < 1)
    return { breaks: [], classRanges: [] };
  if (numClasses >= n) {
    const brks = data.slice(0);
    return { breaks: brks, classRanges: buildRanges(data, brks) };
  }

  /* Matrices for lower-class-limits and variance combinations */
  const mat1: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(numClasses + 1).fill(0),
  );
  const mat2: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(numClasses + 1).fill(Infinity),
  );
  mat2[0]![0] = 0;

  for (let j = 1; j <= numClasses; j++) mat1[1]![j] = 1;
  for (let j = 1; j <= numClasses; j++) mat2[1]![j] = 0;

  for (let i = 2; i <= n; i++) {
    let sumZ = 0;
    let sumZ2 = 0;

    for (let m = 1; m <= i; m++) {
      const val = data[i - m]!;
      sumZ += val;
      sumZ2 += val * val;
      const variance = sumZ2 - (sumZ * sumZ) / m;

      if (m === i) {
        for (let j = 1; j <= numClasses; j++) {
          mat1[i]![j] = 1;
          mat2[i]![j] = variance;
        }
        break;
      }

      for (let j = 2; j <= numClasses; j++) {
        const prev = mat2[i - m]![j - 1]!;
        const total = prev + variance;
        if (total < mat2[i]![j]!) {
          mat1[i]![j] = i - m + 1;
          mat2[i]![j] = total;
        }
      }
    }
  }

  const breaks: number[] = new Array<number>(numClasses);
  breaks[numClasses - 1] = data[n - 1]!;

  let k = n;
  for (let j = numClasses; j >= 2; j--) {
    const lcl = mat1[k]![j]!;
    breaks[j - 2] = data[lcl - 2]!;
    k = lcl - 1;
  }

  return { breaks, classRanges: buildRanges(data, breaks) };
}

/* ------------------------------------------------------------------ */
/*  2. Quantile (equal-count bins)                                     */
/* ------------------------------------------------------------------ */

export function quantile(
  values: number[],
  numClasses: number,
): ClassificationResult {
  const data = sorted(values);
  const n = data.length;
  if (n === 0 || numClasses < 1) return { breaks: [], classRanges: [] };

  const breaks: number[] = [];
  for (let i = 1; i <= numClasses; i++) {
    const idx = Math.min(Math.ceil((i / numClasses) * n) - 1, n - 1);
    breaks.push(data[idx]!);
  }
  return { breaks, classRanges: buildRanges(data, breaks) };
}

/* ------------------------------------------------------------------ */
/*  3. Equal Interval (uniform value range)                            */
/* ------------------------------------------------------------------ */

export function equalInterval(
  values: number[],
  numClasses: number,
): ClassificationResult {
  const data = sorted(values);
  const n = data.length;
  if (n === 0 || numClasses < 1) return { breaks: [], classRanges: [] };

  const min = data[0]!;
  const max = data[n - 1]!;
  const step = (max - min) / numClasses;

  const breaks: number[] = [];
  for (let i = 1; i <= numClasses; i++) {
    breaks.push(i === numClasses ? max : min + step * i);
  }
  return { breaks, classRanges: buildRanges(data, breaks) };
}

/* ------------------------------------------------------------------ */
/*  4. Standard Deviation (mean ± σ classes)                           */
/* ------------------------------------------------------------------ */

export function standardDeviation(
  values: number[],
  numClasses: number,
): ClassificationResult {
  const data = sorted(values);
  const n = data.length;
  if (n === 0 || numClasses < 1) return { breaks: [], classRanges: [] };

  const m = mean(data);
  const sd = stddev(data);

  /* Symmetric classes of width 1σ centred on the mean. */
  const halfClasses = Math.floor(numClasses / 2);
  const breaks: number[] = [];

  for (let i = -halfClasses; i <= halfClasses; i++) {
    const b = m + i * sd;
    if (breaks.length < numClasses) breaks.push(b);
  }

  /* Ensure last break matches data maximum. */
  if (breaks.length > 0) breaks[breaks.length - 1] = data[n - 1]!;
  /* Ensure first range starts from data minimum. */
  return { breaks, classRanges: buildRanges(data, breaks) };
}

/* ------------------------------------------------------------------ */
/*  5. Head/Tail Breaks (Jiang 2013)                                   */
/* ------------------------------------------------------------------ */

export function headTailBreaks(values: number[]): ClassificationResult {
  const data = sorted(values);
  if (data.length === 0) return { breaks: [], classRanges: [] };

  const breaks: number[] = [];

  function recurse(arr: number[]): void {
    if (arr.length < 2) return;
    const m = mean(arr);
    breaks.push(m);
    const head = arr.filter((v) => v > m);
    if (head.length > 0 && head.length < arr.length) {
      recurse(head);
    }
  }

  recurse(data);
  /* Ensure the last break equals the dataset maximum. */
  if (breaks.length > 0) {
    breaks.push(data[data.length - 1]!);
  }
  return { breaks, classRanges: buildRanges(data, breaks) };
}

/* ------------------------------------------------------------------ */
/*  6. Pretty Breaks (round number boundaries)                         */
/* ------------------------------------------------------------------ */

export function prettyBreaks(
  values: number[],
  numClasses: number,
): ClassificationResult {
  const data = sorted(values);
  const n = data.length;
  if (n === 0 || numClasses < 1) return { breaks: [], classRanges: [] };

  const min = data[0]!;
  const max = data[n - 1]!;
  const range = max - min;
  const rawStep = range / numClasses;

  /* Round the step to the nearest "nice" number. */
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let niceStep: number;
  if (norm <= 1) niceStep = 1 * mag;
  else if (norm <= 2) niceStep = 2 * mag;
  else if (norm <= 5) niceStep = 5 * mag;
  else niceStep = 10 * mag;

  const niceMin = Math.floor(min / niceStep) * niceStep;

  const breaks: number[] = [];
  for (let i = 1; i <= numClasses; i++) {
    const b = niceMin + niceStep * i;
    breaks.push(b >= max ? max : b);
    if (b >= max) break;
  }
  /* Pad to numClasses if needed. */
  while (breaks.length < numClasses) breaks.push(max);
  /* Trim excess. */
  breaks.length = numClasses;

  return { breaks, classRanges: buildRanges(data, breaks) };
}
