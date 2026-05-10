import type { IndicatorResult } from '../../../lib/types';
import {
  cumulativeOpportunities,
  gravityAccessibility,
  transitAccessibility,
  walkScore,
} from '../../accessibility';
import {
  floorAreaRatio,
  groundSpaceIndex,
  mixedUseIndex,
  openSpaceRatio,
  streetConnectivity,
} from '../../morphology';
import {
  greenSpacePerCapita,
  imperviousSurface,
  ndvi,
  treeCanopyCoverage,
  urbanHeatIslandIntensity,
} from '../../environment';
import {
  displacementRisk,
  giniCoefficient,
  jobsHousingBalance,
  shannonDiversity,
  simpsonDiversity,
} from '../../socioeconomic';
import {
  adaptiveCapacity,
  compoundRiskIndex,
  floodExposure,
  socialVulnerabilityIndex,
} from '../../resilience';
import {
  sdg11_1_1,
  sdg11_2_1,
  sdg11_3_1,
  sdg11_5_1,
  sdg11_6_1,
  sdg11_6_2,
  sdg11_7_1,
} from '../../sdg11';

export interface IndicatorExpectation {
  kind: IndicatorResult['kind'];
  value: number;
  unit: string;
  precision?: number;
  metadata?: Record<string, unknown>;
}

export interface IndicatorCase {
  name: string;
  execute: () => IndicatorResult;
  expected: IndicatorExpectation;
}

export interface ConnectivityCase {
  name: string;
  execute: () => ReturnType<typeof streetConnectivity>;
  expected: {
    alpha: IndicatorExpectation;
    beta: IndicatorExpectation;
    gamma: IndicatorExpectation;
  };
}

export const legacyCalculatorCasesByDomain: Record<string, IndicatorCase[]> = {
  accessibility: [
    {
      name: 'walkScore computes a walkers-paradise score when all amenities are close',
      execute: () =>
        walkScore({
          groceryDist: 200,
          restaurantDist: 250,
          shoppingDist: 300,
          coffeeDist: 240,
          bankDist: 350,
          parkDist: 180,
          schoolDist: 390,
          bookstoreDist: 260,
          entertainmentDist: 340,
        }),
      expected: {
        kind: 'walk_score',
        value: 100,
        unit: 'score [0-100]',
        metadata: { band: 'walkers_paradise' },
      },
    },
    {
      name: 'transitAccessibility aggregates frequency with distance decay',
      execute: () =>
        transitAccessibility({
          stops: [
            { frequency: 20, distanceM: 0 },
            { frequency: 20, distanceM: 250 },
          ],
          bufferM: 500,
        }),
      expected: {
        kind: 'transit_score',
        value: 30,
        unit: 'composite score',
        metadata: { band: 'B', numStops: 2 },
      },
    },
    {
      name: 'cumulativeOpportunities rounds reachable opportunities and preserves metadata',
      execute: () =>
        cumulativeOpportunities({
          poiCount: 52.4,
          thresholdMinutes: 15,
          mode: 'walk',
        }),
      expected: {
        kind: 'cumulative_opportunities',
        value: 52,
        unit: 'count',
        metadata: {
          thresholdMinutes: 15,
          mode: 'walk',
          band: 'high',
        },
      },
    },
    {
      name: 'gravityAccessibility computes Hansen accessibility with exponential decay',
      execute: () =>
        gravityAccessibility({
          destinations: [
            { opportunities: 100, costMinutes: 10 },
            { opportunities: 50, costMinutes: 20 },
          ],
          beta: 0.1,
        }),
      expected: {
        kind: 'gravity_accessibility',
        value: 43.55,
        precision: 2,
        unit: 'index',
        metadata: { beta: 0.1, numDestinations: 2 },
      },
    },
  ],
  morphology: [
    {
      name: 'floorAreaRatio reports compact built intensity',
      execute: () => floorAreaRatio({ totalFloorArea_m2: 7500, lotArea_m2: 3000 }),
      expected: {
        kind: 'FAR',
        value: 2.5,
        precision: 3,
        unit: 'ratio',
        metadata: { band: 'high' },
      },
    },
    {
      name: 'groundSpaceIndex clamps coverage into the 0 to 1 range',
      execute: () => groundSpaceIndex({ footprintArea_m2: 900, lotArea_m2: 3000 }),
      expected: {
        kind: 'GSI',
        value: 0.3,
        precision: 3,
        unit: 'ratio',
        metadata: { band: 'medium' },
      },
    },
    {
      name: 'openSpaceRatio measures open ground relative to floor area',
      execute: () =>
        openSpaceRatio({
          lotArea_m2: 3000,
          footprintArea_m2: 900,
          totalFloorArea_m2: 7500,
        }),
      expected: {
        kind: 'OSR',
        value: 0.28,
        precision: 3,
        unit: 'ratio',
        metadata: { band: 'compact' },
      },
    },
    {
      name: 'mixedUseIndex reaches maximum diversity for equal proportions',
      execute: () => mixedUseIndex({ proportions: [0.25, 0.25, 0.25, 0.25] }),
      expected: {
        kind: 'MXI',
        value: 1,
        precision: 3,
        unit: 'index [0-1]',
        metadata: {
          band: 'high_diversity',
          rawEntropy: 1.386,
          numClasses: 4,
        },
      },
    },
  ],
  environment: [
    {
      name: 'ndvi classifies dense vegetation from strong spectral separation',
      execute: () => ndvi({ nir: 0.8, red: 0.2 }),
      expected: {
        kind: 'NDVI',
        value: 0.6,
        precision: 4,
        unit: 'index [-1,1]',
        metadata: { band: 'dense_vegetation' },
      },
    },
    {
      name: 'urbanHeatIslandIntensity reports a moderate urban heat burden',
      execute: () => urbanHeatIslandIntensity({ lstUrban: 33, lstRural: 31 }),
      expected: {
        kind: 'UHI_intensity',
        value: 2,
        precision: 2,
        unit: '°C (or K)',
        metadata: { band: 'moderate' },
      },
    },
    {
      name: 'greenSpacePerCapita benchmarks provision against WHO guidance',
      execute: () => greenSpacePerCapita({ greenArea_m2: 45000, population: 3000 }),
      expected: {
        kind: 'green_space_per_capita',
        value: 15,
        precision: 2,
        unit: 'm²/person',
        metadata: { band: 'adequate', whoMinimum: 9 },
      },
    },
    {
      name: 'treeCanopyCoverage recognises a good canopy threshold',
      execute: () => treeCanopyCoverage({ canopyArea_m2: 300, totalArea_m2: 1000 }),
      expected: {
        kind: 'tree_canopy_pct',
        value: 30,
        precision: 2,
        unit: '%',
        metadata: { band: 'good', target: 30 },
      },
    },
    {
      name: 'imperviousSurface flags high sealed-surface burden',
      execute: () => imperviousSurface({ imperviousArea_m2: 350, totalArea_m2: 1000 }),
      expected: {
        kind: 'impervious_pct',
        value: 35,
        precision: 2,
        unit: '%',
        metadata: { band: 'high', degradationThreshold: 25 },
      },
    },
  ],
  socioeconomic: [
    {
      name: 'giniCoefficient resolves moderate inequality for a simple income distribution',
      execute: () => giniCoefficient({ values: [10, 20, 30, 40] }),
      expected: {
        kind: 'gini_coefficient',
        value: 0.25,
        precision: 4,
        unit: 'index [0-1]',
        metadata: { band: 'moderate', n: 4 },
      },
    },
    {
      name: 'shannonDiversity reaches full diversity under equal shares',
      execute: () => shannonDiversity({ proportions: [0.25, 0.25, 0.25, 0.25] }),
      expected: {
        kind: 'shannon_entropy',
        value: 1,
        precision: 4,
        unit: 'index [0-1]',
        metadata: { band: 'high', rawH: 1.3863, k: 4 },
      },
    },
    {
      name: 'simpsonDiversity recognises high heterogeneity',
      execute: () => simpsonDiversity({ proportions: [0.25, 0.25, 0.25, 0.25] }),
      expected: {
        kind: 'simpson_diversity',
        value: 0.75,
        precision: 4,
        unit: 'index [0-1]',
        metadata: { band: 'high', k: 4 },
      },
    },
    {
      name: 'jobsHousingBalance detects a balanced employment-residential mix',
      execute: () => jobsHousingBalance({ jobs: 900, housingUnits: 1000 }),
      expected: {
        kind: 'jobs_housing_balance',
        value: 0.9,
        precision: 3,
        unit: 'ratio',
        metadata: { band: 'balanced', idealRange: '0.8–1.2' },
      },
    },
    {
      name: 'displacementRisk scores gentrification pressure from composite stressors',
      execute: () =>
        displacementRisk({
          renterPct: 80,
          lowIncomePct: 40,
          rentChangePct: 20,
          nonWhitePct: 60,
          transitProximityM: 300,
          devIntensity: 20,
        }),
      expected: {
        kind: 'displacement_risk',
        value: 59,
        unit: 'index [0-100]',
        metadata: { band: 'high' },
      },
    },
  ],
  resilience: [
    {
      name: 'socialVulnerabilityIndex averages demographic stress dimensions',
      execute: () =>
        socialVulnerabilityIndex({
          elderlyPct: 20,
          youngChildrenPct: 10,
          povertyPct: 30,
          linguisticIsolationPct: 5,
          renterPct: 60,
          disabilityPct: 12,
          noHighSchoolPct: 18,
        }),
      expected: {
        kind: 'social_vulnerability_index',
        value: 22,
        unit: 'index [0-100]',
        metadata: { band: 'low', dimensions: 7 },
      },
    },
    {
      name: 'floodExposure blends land, population, and asset exposure ratios',
      execute: () =>
        floodExposure({
          totalAreaKm2: 10,
          floodplainAreaKm2: 2,
          exposedPopulation: 1000,
          totalPopulation: 4000,
          exposedAssetValue: 20,
          totalAssetValue: 100,
        }),
      expected: {
        kind: 'flood_exposure',
        value: 22,
        unit: 'index [0-100]',
        metadata: {
          band: 'moderate',
          areaRatio: 0.2,
          popRatio: 0.25,
          assetRatio: 0.2,
        },
      },
    },
    {
      name: 'adaptiveCapacity combines education, income, health, and connectivity',
      execute: () =>
        adaptiveCapacity({
          tertiaryEduPct: 60,
          medianIncome: 50000,
          referenceIncome: 80000,
          hospitalBedsPer10k: 20,
          internetPct: 90,
          socialCapitalScore: 65,
        }),
      expected: {
        kind: 'adaptive_capacity',
        value: 64,
        unit: 'index [0-100]',
        metadata: { band: 'high' },
      },
    },
    {
      name: 'compoundRiskIndex combines hazard, vulnerability, and reduced capacity',
      execute: () =>
        compoundRiskIndex({
          hazardScore: 70,
          vulnerabilityScore: 55,
          adaptiveCapacityScore: 60,
        }),
      expected: {
        kind: 'compound_risk',
        value: 57,
        unit: 'index [0-100]',
        metadata: {
          band: 'high',
          weights: {
            hazard: 0.4,
            vulnerability: 0.35,
            lacCapacity: 0.25,
          },
        },
      },
    },
  ],
  sdg11: [
    {
      name: 'sdg11_1_1 reports moderate inadequate housing burden',
      execute: () => sdg11_1_1({ inadequateHousingPop: 5000, totalUrbanPop: 50000 }),
      expected: {
        kind: 'sdg_11_1_1',
        value: 10,
        precision: 2,
        unit: '%',
        metadata: { band: 'moderate' },
      },
    },
    {
      name: 'sdg11_2_1 recognises strong public transport access',
      execute: () => sdg11_2_1({ popWithAccess: 40000, totalUrbanPop: 50000 }),
      expected: {
        kind: 'sdg_11_2_1',
        value: 80,
        precision: 2,
        unit: '%',
        metadata: { band: 'good' },
      },
    },
    {
      name: 'sdg11_3_1 measures sprawling land-consumption relative to growth',
      execute: () =>
        sdg11_3_1({
          builtUpAreaT0: 100,
          builtUpAreaT1: 150,
          popT0: 1000,
          popT1: 1200,
          years: 10,
        }),
      expected: {
        kind: 'sdg_11_3_1',
        value: 2.224,
        precision: 3,
        unit: 'ratio',
        metadata: {
          band: 'high_sprawl',
          lcr: 0.0405,
          pgr: 0.0182,
        },
      },
    },
    {
      name: 'sdg11_5_1 converts disasters into a per-100k burden rate',
      execute: () => sdg11_5_1({ deaths: 10, affected: 40, totalPopulation: 200000 }),
      expected: {
        kind: 'sdg_11_5_1',
        value: 25,
        precision: 2,
        unit: 'per 100k',
        metadata: { band: 'poor', deaths: 10, affected: 40 },
      },
    },
    {
      name: 'sdg11_6_1 reports regular waste collection performance',
      execute: () => sdg11_6_1({ wasteCollected: 900, wasteGenerated: 1000 }),
      expected: {
        kind: 'sdg_11_6_1',
        value: 90,
        precision: 2,
        unit: '%',
        metadata: { band: 'good' },
      },
    },
    {
      name: 'sdg11_6_2 classifies particulate matter against WHO interim targets',
      execute: () => sdg11_6_2({ pm25Annual: 12.7 }),
      expected: {
        kind: 'sdg_11_6_2',
        value: 12.7,
        precision: 1,
        unit: 'µg/m³',
        metadata: { band: 'interim_3', whoGuideline: 5 },
      },
    },
    {
      name: 'sdg11_7_1 benchmarks public open-space share',
      execute: () => sdg11_7_1({ openSpaceArea: 15, builtUpArea: 60 }),
      expected: {
        kind: 'sdg_11_7_1',
        value: 25,
        precision: 2,
        unit: '%',
        metadata: { band: 'good' },
      },
    },
  ],
};

export const connectivityCases: ConnectivityCase[] = [
  {
    name: 'streetConnectivity computes alpha beta and gamma graph indices',
    execute: () => streetConnectivity({ nodes: 10, edges: 15, components: 1 }),
    expected: {
      alpha: {
        kind: 'street_connectivity_alpha',
        value: 0.4,
        precision: 3,
        unit: 'ratio [0-1]',
        metadata: { band: 'moderate' },
      },
      beta: {
        kind: 'street_connectivity_beta',
        value: 1.5,
        precision: 3,
        unit: 'ratio',
        metadata: { band: 'complex' },
      },
      gamma: {
        kind: 'street_connectivity_gamma',
        value: 0.625,
        precision: 3,
        unit: 'ratio [0-1]',
        metadata: { band: 'moderate' },
      },
    },
  },
];

export const legacyEdgeCasesByDomain: Record<string, IndicatorCase[]> = {
  accessibility: [
    {
      name: 'gravityAccessibility returns an explicit no-destinations fallback',
      execute: () => gravityAccessibility({ destinations: [] }),
      expected: {
        kind: 'gravity_accessibility',
        value: 0,
        unit: 'index',
        metadata: { error: 'no destinations' },
      },
    },
  ],
  morphology: [
    {
      name: 'floorAreaRatio guards against zero lot area',
      execute: () => floorAreaRatio({ totalFloorArea_m2: 5000, lotArea_m2: 0 }),
      expected: {
        kind: 'FAR',
        value: 0,
        unit: 'ratio',
        metadata: { error: 'lotArea must be > 0' },
      },
    },
  ],
  environment: [
    {
      name: 'ndvi guards against a zero denominator',
      execute: () => ndvi({ nir: 0, red: 0 }),
      expected: {
        kind: 'NDVI',
        value: 0,
        unit: 'index [-1,1]',
        metadata: { error: 'NIR + RED = 0' },
      },
    },
    {
      name: 'treeCanopyCoverage clamps physically impossible canopy ratios',
      execute: () => treeCanopyCoverage({ canopyArea_m2: 1200, totalArea_m2: 1000 }),
      expected: {
        kind: 'tree_canopy_pct',
        value: 100,
        precision: 2,
        unit: '%',
        metadata: { band: 'excellent', target: 30 },
      },
    },
  ],
  socioeconomic: [
    {
      name: 'giniCoefficient returns a structured empty-input fallback',
      execute: () => giniCoefficient({ values: [] }),
      expected: {
        kind: 'gini_coefficient',
        value: 0,
        unit: 'index [0-1]',
        metadata: { error: 'empty input' },
      },
    },
  ],
  resilience: [
    {
      name: 'compoundRiskIndex clamps invalid hazard and capacity ranges',
      execute: () =>
        compoundRiskIndex({
          hazardScore: 120,
          vulnerabilityScore: -10,
          adaptiveCapacityScore: 200,
        }),
      expected: {
        kind: 'compound_risk',
        value: 40,
        unit: 'index [0-100]',
        metadata: {
          band: 'moderate',
          weights: {
            hazard: 0.4,
            vulnerability: 0.35,
            lacCapacity: 0.25,
          },
        },
      },
    },
  ],
  sdg11: [
    {
      name: 'sdg11_3_1 exposes a stable-population diagnostic when growth is flat',
      execute: () =>
        sdg11_3_1({
          builtUpAreaT0: 100,
          builtUpAreaT1: 120,
          popT0: 5000,
          popT1: 5000,
          years: 5,
        }),
      expected: {
        kind: 'sdg_11_3_1',
        value: Number.POSITIVE_INFINITY,
        unit: 'ratio',
        metadata: {
          band: 'population_stable',
          lcr: 0.0365,
          pgr: 0,
        },
      },
    },
  ],
};