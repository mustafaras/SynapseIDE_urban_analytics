import {
  SCENARIO_METRICS,
  type ScenarioAlternativeDefinition,
  type ScenarioParameters,
  type ScenarioSpatialUnit,
} from "@/engine/simulation/ScenarioComparison";

function rectangle(minLng: number, minLat: number, maxLng: number, maxLat: number): GeoJSON.Polygon {
  return {
    type: "Polygon",
    coordinates: [[
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat],
    ]],
  };
}

function createMetrics(
  housingCapacity: number,
  greenNetwork: number,
  transitAccess: number,
  affordability: number,
  carbonIntensity: number,
  floodRisk: number,
) {
  return {
    housing_capacity: housingCapacity,
    green_network: greenNetwork,
    transit_access: transitAccess,
    affordability,
    carbon_intensity: carbonIntensity,
    flood_risk: floodRisk,
  };
}

export const SCENARIO_DEMO_BASELINE_NAME = "2026 Reference Conditions";

export const SCENARIO_DEMO_BASELINE_DESCRIPTION =
  "Embedded district-scale benchmark dataset covering housing capacity, green-network quality, transit access, affordability, carbon intensity, and flood risk. Use it to understand the scenario dashboard before connecting your own evidence base.";

export const SCENARIO_DEMO_BASELINE_UNITS: ScenarioSpatialUnit[] = [
  {
    unitId: "harbour-fringe",
    label: "Harbour Fringe",
    geometry: rectangle(28.960, 41.016, 28.992, 41.040),
    baselineMetrics: createMetrics(58, 32, 74, 44, 66, 61),
    responseProfile: {
      housingIntensity: 1.18,
      transitInvestment: 0.92,
      greeningProgram: 0.84,
      resilienceProgramme: 1.16,
      affordabilitySafeguards: 0.95,
      energyTransition: 1.03,
    },
  },
  {
    unitId: "civic-spine",
    label: "Civic Spine",
    geometry: rectangle(28.992, 41.016, 29.024, 41.040),
    baselineMetrics: createMetrics(64, 41, 82, 48, 58, 46),
    responseProfile: {
      housingIntensity: 1.05,
      transitInvestment: 1.12,
      greeningProgram: 0.78,
      resilienceProgramme: 0.88,
      affordabilitySafeguards: 0.98,
      energyTransition: 0.94,
    },
  },
  {
    unitId: "university-quarter",
    label: "University Quarter",
    geometry: rectangle(29.024, 41.016, 29.056, 41.040),
    baselineMetrics: createMetrics(56, 52, 76, 55, 52, 38),
    responseProfile: {
      housingIntensity: 0.94,
      transitInvestment: 1.02,
      greeningProgram: 1.04,
      resilienceProgramme: 0.82,
      affordabilitySafeguards: 1.12,
      energyTransition: 0.88,
    },
  },
  {
    unitId: "inner-ring-east",
    label: "Inner Ring East",
    geometry: rectangle(28.960, 40.992, 28.992, 41.016),
    baselineMetrics: createMetrics(71, 29, 63, 41, 69, 57),
    responseProfile: {
      housingIntensity: 1.21,
      transitInvestment: 0.86,
      greeningProgram: 0.76,
      resilienceProgramme: 1.04,
      affordabilitySafeguards: 0.91,
      energyTransition: 1.08,
    },
  },
  {
    unitId: "south-commons",
    label: "South Commons",
    geometry: rectangle(28.992, 40.992, 29.024, 41.016),
    baselineMetrics: createMetrics(49, 68, 58, 62, 47, 29),
    responseProfile: {
      housingIntensity: 0.88,
      transitInvestment: 0.94,
      greeningProgram: 1.18,
      resilienceProgramme: 1.06,
      affordabilitySafeguards: 1.09,
      energyTransition: 0.87,
    },
  },
  {
    unitId: "river-junction",
    label: "River Junction",
    geometry: rectangle(29.024, 40.992, 29.056, 41.016),
    baselineMetrics: createMetrics(53, 61, 67, 51, 55, 52),
    responseProfile: {
      housingIntensity: 0.96,
      transitInvestment: 1.01,
      greeningProgram: 1.08,
      resilienceProgramme: 1.18,
      affordabilitySafeguards: 1.02,
      energyTransition: 0.96,
    },
  },
];

export const SCENARIO_DEMO_SCENARIOS: ScenarioAlternativeDefinition[] = [
  {
    id: "compact-transit-growth",
    name: "Compact Transit Growth",
    description: "Densification around the existing transit spine with moderate social protections.",
    assumptions: "High housing yield, strong transit uplift, limited greening headroom.",
    parameters: {
      housingIntensity: 72,
      transitInvestment: 84,
      greeningProgram: 34,
      resilienceProgramme: 40,
      affordabilitySafeguards: 46,
      energyTransition: 62,
    },
  },
  {
    id: "green-resilience-retrofit",
    name: "Green Resilience Retrofit",
    description: "Neighbourhood retrofit strategy prioritising cooling, flood management, and public-space quality.",
    assumptions: "Lower development pressure, stronger adaptation and ecological investment.",
    parameters: {
      housingIntensity: 38,
      transitInvestment: 58,
      greeningProgram: 82,
      resilienceProgramme: 88,
      affordabilitySafeguards: 52,
      energyTransition: 70,
    },
  },
];

export const SCENARIO_DEMO_SELECTED_METRICS = SCENARIO_METRICS.map((metric) => metric.id);

function buildSeededRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;

  return () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return (state >>> 0) / 4294967295;
  };
}

function integerBetween(random: () => number, min: number, max: number): number {
  return Math.round(min + (max - min) * random());
}

export function buildScenarioParametersFromSeed(seed: string): ScenarioParameters {
  const random = buildSeededRandom(seed);
  return {
    housingIntensity: integerBetween(random, 28, 86),
    transitInvestment: integerBetween(random, 34, 92),
    greeningProgram: integerBetween(random, 24, 88),
    resilienceProgramme: integerBetween(random, 26, 90),
    affordabilitySafeguards: integerBetween(random, 22, 84),
    energyTransition: integerBetween(random, 30, 86),
  };
}