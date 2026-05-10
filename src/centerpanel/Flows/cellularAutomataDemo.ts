import type {
  CellularAutomataConstraints,
  CellularAutomataState,
  CellularAutomataSurface,
  GridExtent,
} from "@/engine/simulation";

export interface CellularAutomataDemoDataset {
  width: number;
  height: number;
  extent: GridExtent;
  suitabilitySurface: CellularAutomataSurface;
  constraints: Required<CellularAutomataConstraints>;
  historicalStates: CellularAutomataState[];
  observedState: CellularAutomataState;
}

const WIDTH = 22;
const HEIGHT = 16;
const EXTENT: GridExtent = [28.96, 40.99, 29.06, 41.07];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function indexOf(row: number, column: number): number {
  return row * WIDTH + column;
}

function computeNeighborhoodShare(values: number[], index: number): number {
  const row = Math.floor(index / WIDTH);
  const column = index % WIDTH;
  let total = 0;
  let urban = 0;

  for (let y = Math.max(0, row - 1); y <= Math.min(HEIGHT - 1, row + 1); y += 1) {
    for (let x = Math.max(0, column - 1); x <= Math.min(WIDTH - 1, column + 1); x += 1) {
      if (x === column && y === row) {
        continue;
      }
      total += 1;
      if ((values[indexOf(y, x)] ?? 0) >= 0.5) {
        urban += 1;
      }
    }
  }

  return total > 0 ? urban / total : 0;
}

function gaussian(x: number, y: number, centerX: number, centerY: number, spread: number): number {
  const dx = x - centerX;
  const dy = y - centerY;
  return Math.exp(-(dx * dx + dy * dy) / spread);
}

function createSurface(
  label: string,
  computeValue: (x: number, y: number, row: number, column: number) => number,
): CellularAutomataSurface {
  const values: number[] = [];

  for (let row = 0; row < HEIGHT; row += 1) {
    for (let column = 0; column < WIDTH; column += 1) {
      const x = column / (WIDTH - 1);
      const y = row / (HEIGHT - 1);
      values.push(clamp01(computeValue(x, y, row, column)));
    }
  }

  return {
    width: WIDTH,
    height: HEIGHT,
    extent: EXTENT,
    label,
    values,
  };
}

function expandUrbanState(
  previous: number[],
  suitability: CellularAutomataSurface,
  constraints: Required<CellularAutomataConstraints>,
  options: {
    step: number;
    label: string;
    targetNewCells: number;
    scoreThreshold: number;
    minNeighborhood: number;
    structureThreshold: number;
    leapfrog?: Array<[row: number, column: number]>;
  },
): CellularAutomataState {
  const next = [...previous];
  const candidates: Array<{ index: number; score: number }> = [];

  for (let index = 0; index < previous.length; index += 1) {
    if (previous[index] >= 0.5) {
      continue;
    }
    if (
      (constraints.protectedAreas.values[index] ?? 0) >= 0.5 ||
      (constraints.water.values[index] ?? 0) >= 0.5 ||
      (constraints.slope.values[index] ?? 0) > 0.72
    ) {
      continue;
    }

    const neighbor = computeNeighborhoodShare(previous, index);
    const structure = constraints.existingUrbanStructure.values[index] ?? 0;
    const score =
      (suitability.values[index] ?? 0) * 0.46 +
      neighbor * 0.34 +
      structure * 0.2 -
      (constraints.slope.values[index] ?? 0) * 0.14;

    if (score >= options.scoreThreshold &&
      (neighbor >= options.minNeighborhood || structure >= options.structureThreshold)) {
      candidates.push({ index, score });
    }
  }

  candidates.sort((left, right) => right.score - left.score);

  for (const candidate of candidates.slice(0, options.targetNewCells)) {
    next[candidate.index] = 1;
  }

  for (const [row, column] of options.leapfrog ?? []) {
    const index = indexOf(row, column);
    if (
      (constraints.protectedAreas.values[index] ?? 0) < 0.5 &&
      (constraints.water.values[index] ?? 0) < 0.5
    ) {
      next[index] = 1;
    }
  }

  return {
    width: WIDTH,
    height: HEIGHT,
    extent: EXTENT,
    step: options.step,
    label: options.label,
    values: next,
  };
}

export function buildCellularAutomataDemoDataset(): CellularAutomataDemoDataset {
  const slope = createSurface("Slope", (x, y) => {
    const northeastHill = gaussian(x, y, 0.82, 0.12, 0.024) * 0.45;
    return 0.14 + y * 0.46 + x * 0.16 + northeastHill;
  });

  const water = createSurface("Water", (x, y) => {
    const riverCenter = 0.73 + (x - 0.18) * 0.12;
    return y > 0.66 && Math.abs(y - riverCenter) < 0.075 ? 1 : 0;
  });

  const protectedAreas = createSurface("Protected Areas", (x, y) => {
    const reserve = x > 0.72 && y < 0.24 ? 1 : 0;
    const hillside = x > 0.84 && y < 0.42 ? 1 : 0;
    return reserve || hillside ? 1 : 0;
  });

  const existingUrbanStructure = createSurface("Existing Urban Structure", (x, y, row, column) => {
    const core = gaussian(x, y, 0.28, 0.52, 0.065);
    const corridor = Math.exp(-Math.pow(y - 0.5, 2) / 0.018) * (0.25 + x * 0.75);
    return core * 0.52 + corridor * 0.36 + (1 - (slope.values[indexOf(row, column)] ?? 0)) * 0.12;
  });

  const suitabilitySurface = createSurface("Suitability", (x, y, row, column) => {
    const core = gaussian(x, y, 0.28, 0.52, 0.055);
    const corridor = Math.exp(-Math.pow(y - 0.51, 2) / 0.014) * (0.18 + x * 0.82);
    const southernPlain = gaussian(x, y, 0.55, 0.78, 0.18) * 0.18;
    const slopePenalty = (slope.values[indexOf(row, column)] ?? 0) * 0.28;
    const waterPenalty = (water.values[indexOf(row, column)] ?? 0) * 0.75;
    const reservePenalty = (protectedAreas.values[indexOf(row, column)] ?? 0) * 0.68;
    return 0.28 + core * 0.32 + corridor * 0.32 + southernPlain - slopePenalty - waterPenalty - reservePenalty;
  });

  const baselineValues = new Array<number>(WIDTH * HEIGHT).fill(0);
  for (let row = 0; row < HEIGHT; row += 1) {
    for (let column = 0; column < WIDTH; column += 1) {
      const x = column / (WIDTH - 1);
      const y = row / (HEIGHT - 1);
      const core = gaussian(x, y, 0.27, 0.53, 0.045);
      const corridor = Math.exp(-Math.pow(y - 0.52, 2) / 0.011) * (0.15 + x * 0.5);
      const industrialPatch = x < 0.18 && y > 0.56 && y < 0.76 ? 0.7 : 0;
      if (core > 0.46 || corridor > 0.44 || industrialPatch > 0.5) {
        baselineValues[indexOf(row, column)] = 1;
      }
    }
  }

  const constraints: Required<CellularAutomataConstraints> = {
    protectedAreas,
    water,
    slope,
    existingUrbanStructure,
  };

  const state2008: CellularAutomataState = {
    width: WIDTH,
    height: HEIGHT,
    extent: EXTENT,
    step: 2008,
    label: "Observed 2008",
    values: baselineValues,
  };

  const state2014 = expandUrbanState(state2008.values, suitabilitySurface, constraints, {
    step: 2014,
    label: "Observed 2014",
    targetNewCells: 18,
    scoreThreshold: 0.44,
    minNeighborhood: 0.16,
    structureThreshold: 0.28,
  });

  const state2020 = expandUrbanState(state2014.values, suitabilitySurface, constraints, {
    step: 2020,
    label: "Observed 2020",
    targetNewCells: 24,
    scoreThreshold: 0.4,
    minNeighborhood: 0.12,
    structureThreshold: 0.22,
  });

  const observedState = expandUrbanState(state2020.values, suitabilitySurface, constraints, {
    step: 2026,
    label: "Observed 2026",
    targetNewCells: 28,
    scoreThreshold: 0.37,
    minNeighborhood: 0.08,
    structureThreshold: 0.18,
    leapfrog: [[8, 18], [9, 18]],
  });

  return {
    width: WIDTH,
    height: HEIGHT,
    extent: EXTENT,
    suitabilitySurface,
    constraints,
    historicalStates: [state2008, state2014, state2020],
    observedState,
  };
}
