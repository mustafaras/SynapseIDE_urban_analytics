/**
 * System Dynamics Urban Change Model
 *
 * Teaching-oriented stock-and-flow model for long-run urban change. The model
 * keeps the equations explicit and interpretable so policy levers can be tied
 * directly to population, housing, employment, transport capacity, and green
 * space trajectories.
 */

export type SystemDynamicsStockId =
  | 'population'
  | 'housing'
  | 'employment'
  | 'transport_capacity'
  | 'green_space';

export type SystemDynamicsLeverId =
  | 'housingIncentive'
  | 'economicDevelopment'
  | 'transitInvestment'
  | 'greenProtection'
  | 'compactGrowth';

export interface SystemDynamicsStocks {
  population: number;
  housing: number;
  employment: number;
  transportCapacity: number;
  greenSpace: number;
}

export interface SystemDynamicsPolicyLevers {
  housingIncentive: number;
  economicDevelopment: number;
  transitInvestment: number;
  greenProtection: number;
  compactGrowth: number;
}

export interface SystemDynamicsPolicyLeverDefinition {
  id: SystemDynamicsLeverId;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  lowLabel: string;
  highLabel: string;
}

export interface SystemDynamicsScenarioPreset {
  id: string;
  label: string;
  description: string;
  policyLevers: SystemDynamicsPolicyLevers;
}

export interface SystemDynamicsDerivedIndicators {
  housingAdequacy: number;
  employmentAdequacy: number;
  jobsPerResident: number;
  jobsHousingBalance: number;
  transportAdequacy: number;
  greenSpacePerCapita: number;
  greenAdequacy: number;
  qualityOfLife: number;
}

export interface SystemDynamicsYearFlows {
  populationGrowth: number;
  populationDecline: number;
  housingConstruction: number;
  housingDemolition: number;
  employmentGrowth: number;
  employmentDecline: number;
  networkExpansion: number;
  networkWear: number;
  greenExpansion: number;
  landConversion: number;
}

export interface SystemDynamicsTracePoint {
  year: number;
  label: string;
  stocks: SystemDynamicsStocks;
  flows: SystemDynamicsYearFlows;
  indicators: SystemDynamicsDerivedIndicators;
}

export interface SystemDynamicsStabilitySummary {
  isStable: boolean;
  maxAnnualChangeRatio: number;
  warnings: string[];
}

export interface SystemDynamicsSummary {
  headline: string;
  keyTensions: string[];
  leadStock: SystemDynamicsStockId;
}

export interface SystemDynamicsDiagramPoint {
  x: number;
  y: number;
}

export interface SystemDynamicsDiagramNode {
  id: string;
  label: string;
  kind: 'stock' | 'lever';
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SystemDynamicsDiagramLink {
  id: string;
  label: string;
  kind: 'flow' | 'influence';
  description: string;
  from: SystemDynamicsDiagramPoint;
  to: SystemDynamicsDiagramPoint;
  valve?: SystemDynamicsDiagramPoint;
  polarity?: 'positive' | 'negative';
}

export interface SystemDynamicsFeedbackArc {
  id: string;
  label: string;
  type: 'reinforcing' | 'balancing';
  description: string;
  path: string;
  labelPoint: SystemDynamicsDiagramPoint;
}

export interface SystemDynamicsStockFlowDiagram {
  width: number;
  height: number;
  nodes: SystemDynamicsDiagramNode[];
  links: SystemDynamicsDiagramLink[];
  feedbackArcs: SystemDynamicsFeedbackArc[];
}

export interface SystemDynamicsCausalNode {
  id: string;
  label: string;
  group: 'stock' | 'pressure' | 'lever';
  x: number;
  y: number;
}

export interface SystemDynamicsCausalEdge {
  id: string;
  from: string;
  to: string;
  polarity: 'positive' | 'negative';
  path: string;
  loopId?: string;
}

export interface SystemDynamicsLoopDefinition {
  id: string;
  label: string;
  type: 'reinforcing' | 'balancing';
  description: string;
}

export interface SystemDynamicsCausalLoopGraph {
  width: number;
  height: number;
  nodes: SystemDynamicsCausalNode[];
  edges: SystemDynamicsCausalEdge[];
  loops: SystemDynamicsLoopDefinition[];
}

export interface SystemDynamicsSimulationInput {
  scenarioName?: string;
  years?: number;
  initialStocks?: Partial<SystemDynamicsStocks>;
  policyLevers?: Partial<SystemDynamicsPolicyLevers>;
}

export interface SystemDynamicsResult {
  scenarioName: string;
  years: number;
  timeStepYears: number;
  initialStocks: SystemDynamicsStocks;
  policyLevers: SystemDynamicsPolicyLevers;
  traces: SystemDynamicsTracePoint[];
  finalStocks: SystemDynamicsStocks;
  stability: SystemDynamicsStabilitySummary;
  summary: SystemDynamicsSummary;
  stockFlowDiagram: SystemDynamicsStockFlowDiagram;
  causalLoopGraph: SystemDynamicsCausalLoopGraph;
}

const TARGET_HOUSEHOLD_SIZE = 2.35;
const TARGET_JOBS_PER_RESIDENT = 0.48;
const TARGET_TRANSPORT_CAPACITY_PER_RESIDENT = 0.68;
const TARGET_GREEN_SPACE_PER_CAPITA = 25;

export const DEFAULT_SYSTEM_DYNAMICS_STOCKS: SystemDynamicsStocks = {
  population: 950_000,
  housing: 430_000,
  employment: 470_000,
  transportCapacity: 650_000,
  greenSpace: 3_800,
};

export const DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS: SystemDynamicsPolicyLevers = {
  housingIncentive: 55,
  economicDevelopment: 52,
  transitInvestment: 58,
  greenProtection: 50,
  compactGrowth: 54,
};

export const SYSTEM_DYNAMICS_POLICY_LEVERS: SystemDynamicsPolicyLeverDefinition[] = [
  {
    id: 'housingIncentive',
    label: 'Housing incentive',
    description: 'Accelerates construction and redevelopment capacity in response to housing pressure.',
    min: 0,
    max: 100,
    step: 1,
    lowLabel: 'Restrictive permitting',
    highLabel: 'Aggressive construction support',
  },
  {
    id: 'economicDevelopment',
    label: 'Economic development',
    description: 'Boosts employment growth and attracts population through jobs and business activity.',
    min: 0,
    max: 100,
    step: 1,
    lowLabel: 'Low business support',
    highLabel: 'High job creation push',
  },
  {
    id: 'transitInvestment',
    label: 'Transit investment',
    description: 'Expands transport capacity and softens congestion-driven decline.',
    min: 0,
    max: 100,
    step: 1,
    lowLabel: 'Deferred maintenance',
    highLabel: 'Strong network expansion',
  },
  {
    id: 'greenProtection',
    label: 'Green protection',
    description: 'Preserves green space and supports ecological restoration instead of land conversion.',
    min: 0,
    max: 100,
    step: 1,
    lowLabel: 'Weak protection',
    highLabel: 'Strong conservation',
  },
  {
    id: 'compactGrowth',
    label: 'Compact growth',
    description: 'Shifts growth toward infill and infrastructure reuse rather than outward land consumption.',
    min: 0,
    max: 100,
    step: 1,
    lowLabel: 'Peripheral expansion',
    highLabel: 'Infill priority',
  },
];

export const SYSTEM_DYNAMICS_SCENARIO_PRESETS: SystemDynamicsScenarioPreset[] = [
  {
    id: 'balanced-transition',
    label: 'Balanced transition',
    description: 'Moderate growth, steady transit investment, and neutral green-space protection.',
    policyLevers: { ...DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS },
  },
  {
    id: 'growth-machine',
    label: 'Growth machine',
    description: 'Strong housing and jobs agenda with weaker ecological protection and low compact-growth discipline.',
    policyLevers: {
      housingIncentive: 82,
      economicDevelopment: 88,
      transitInvestment: 46,
      greenProtection: 18,
      compactGrowth: 24,
    },
  },
  {
    id: 'green-compact-deal',
    label: 'Green compact deal',
    description: 'Transit-oriented infill with strong green preservation and moderated expansion pressure.',
    policyLevers: {
      housingIncentive: 62,
      economicDevelopment: 58,
      transitInvestment: 84,
      greenProtection: 86,
      compactGrowth: 88,
    },
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampPositive(value: number): number {
  return Math.max(0, value);
}

function roundStock(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeLever(value: number): number {
  return clamp(value, 0, 100) / 100;
}

function mergeStocks(partial?: Partial<SystemDynamicsStocks>): SystemDynamicsStocks {
  return {
    population: clampPositive(partial?.population ?? DEFAULT_SYSTEM_DYNAMICS_STOCKS.population),
    housing: clampPositive(partial?.housing ?? DEFAULT_SYSTEM_DYNAMICS_STOCKS.housing),
    employment: clampPositive(partial?.employment ?? DEFAULT_SYSTEM_DYNAMICS_STOCKS.employment),
    transportCapacity: clampPositive(partial?.transportCapacity ?? DEFAULT_SYSTEM_DYNAMICS_STOCKS.transportCapacity),
    greenSpace: clampPositive(partial?.greenSpace ?? DEFAULT_SYSTEM_DYNAMICS_STOCKS.greenSpace),
  };
}

function mergePolicyLevers(partial?: Partial<SystemDynamicsPolicyLevers>): SystemDynamicsPolicyLevers {
  return {
    housingIncentive: clamp(partial?.housingIncentive ?? DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS.housingIncentive, 0, 100),
    economicDevelopment: clamp(partial?.economicDevelopment ?? DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS.economicDevelopment, 0, 100),
    transitInvestment: clamp(partial?.transitInvestment ?? DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS.transitInvestment, 0, 100),
    greenProtection: clamp(partial?.greenProtection ?? DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS.greenProtection, 0, 100),
    compactGrowth: clamp(partial?.compactGrowth ?? DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS.compactGrowth, 0, 100),
  };
}

function stockValueById(stocks: SystemDynamicsStocks, stockId: SystemDynamicsStockId): number {
  switch (stockId) {
    case 'population':
      return stocks.population;
    case 'housing':
      return stocks.housing;
    case 'employment':
      return stocks.employment;
    case 'transport_capacity':
      return stocks.transportCapacity;
    case 'green_space':
      return stocks.greenSpace;
    default:
      return 0;
  }
}

function computeIndicators(stocks: SystemDynamicsStocks): SystemDynamicsDerivedIndicators {
  const housingAdequacy = clamp(
    (stocks.housing * TARGET_HOUSEHOLD_SIZE) / Math.max(stocks.population, 1),
    0.25,
    2,
  );
  const jobsPerResident = stocks.employment / Math.max(stocks.population, 1);
  const employmentAdequacy = clamp(jobsPerResident / TARGET_JOBS_PER_RESIDENT, 0.25, 2);
  const jobsHousingBalance = stocks.employment / Math.max(stocks.housing, 1);
  const transportAdequacy = clamp(
    stocks.transportCapacity / Math.max(stocks.population * TARGET_TRANSPORT_CAPACITY_PER_RESIDENT, 1),
    0.25,
    2,
  );
  const greenSpacePerCapita = (stocks.greenSpace * 10_000) / Math.max(stocks.population, 1);
  const greenAdequacy = clamp(greenSpacePerCapita / TARGET_GREEN_SPACE_PER_CAPITA, 0.15, 2.2);
  const qualityOfLife = clamp(
    (housingAdequacy * 0.3)
      + (employmentAdequacy * 0.2)
      + (transportAdequacy * 0.25)
      + (greenAdequacy * 0.25),
    0.25,
    2,
  );

  return {
    housingAdequacy,
    employmentAdequacy,
    jobsPerResident,
    jobsHousingBalance,
    transportAdequacy,
    greenSpacePerCapita,
    greenAdequacy,
    qualityOfLife,
  };
}

function computeYearFlows(
  stocks: SystemDynamicsStocks,
  indicators: SystemDynamicsDerivedIndicators,
  levers: SystemDynamicsPolicyLevers,
): SystemDynamicsYearFlows {
  const housingIncentive = normalizeLever(levers.housingIncentive);
  const economicDevelopment = normalizeLever(levers.economicDevelopment);
  const transitInvestment = normalizeLever(levers.transitInvestment);
  const greenProtection = normalizeLever(levers.greenProtection);
  const compactGrowth = normalizeLever(levers.compactGrowth);

  const housingStress = clamp(1 - indicators.housingAdequacy, 0, 1.2);
  const employmentStress = clamp(1 - indicators.employmentAdequacy, 0, 1.2);
  const transportStress = clamp(1 - indicators.transportAdequacy, 0, 1.2);
  const greenStress = clamp(1 - indicators.greenAdequacy, 0, 1.2);
  const amenitySupport = clamp(indicators.qualityOfLife - 1, 0, 1);
  const developmentPressure = (housingIncentive + economicDevelopment) / 2;

  const populationGrowth = stocks.population * (
    0.004
    + (0.003 * economicDevelopment)
    + (0.002 * amenitySupport)
    + (0.0012 * transitInvestment)
  );
  const populationDecline = stocks.population * (
    0.002
    + (0.0035 * housingStress)
    + (0.0026 * transportStress)
    + (0.0018 * greenStress)
  );

  const housingConstruction = stocks.housing * (
    0.006
    + (0.014 * housingIncentive)
    + (0.008 * compactGrowth)
    + (0.005 * housingStress)
    + (0.0015 * transitInvestment)
  );
  const housingDemolition = stocks.housing * (
    0.0015
    + (0.0014 * compactGrowth)
    + (0.0018 * employmentStress)
  );

  const employmentGrowth = stocks.employment * (
    0.006
    + (0.015 * economicDevelopment)
    + (0.004 * transitInvestment)
    + (0.003 * clamp(indicators.housingAdequacy - 1, 0, 1))
  );
  const employmentDecline = stocks.employment * (
    0.0025
    + (0.002 * transportStress)
    + (0.0015 * housingStress)
  );

  const networkExpansion = stocks.transportCapacity * (
    0.004
    + (0.016 * transitInvestment)
    + (0.005 * compactGrowth)
    + (0.002 * developmentPressure)
  );
  const networkWear = stocks.transportCapacity * (
    0.003
    + (0.0032 * transportStress)
    + (0.001 * (1 - transitInvestment))
  );

  const greenExpansion = stocks.greenSpace * (
    0.0015
    + (0.013 * greenProtection)
    + (0.004 * compactGrowth)
  );
  const landConversionRate = clamp(
    0.0025
      + (0.0035 * developmentPressure)
      + (0.0032 * housingStress)
      - (0.0042 * greenProtection)
      - (0.0032 * compactGrowth),
    0.0002,
    0.014,
  );
  const landConversion = stocks.greenSpace * landConversionRate;

  return {
    populationGrowth,
    populationDecline,
    housingConstruction,
    housingDemolition,
    employmentGrowth,
    employmentDecline,
    networkExpansion,
    networkWear,
    greenExpansion,
    landConversion,
  };
}

function integrateStocks(
  stocks: SystemDynamicsStocks,
  flows: SystemDynamicsYearFlows,
): SystemDynamicsStocks {
  return {
    population: roundStock(clampPositive(stocks.population + flows.populationGrowth - flows.populationDecline)),
    housing: roundStock(clampPositive(stocks.housing + flows.housingConstruction - flows.housingDemolition)),
    employment: roundStock(clampPositive(stocks.employment + flows.employmentGrowth - flows.employmentDecline)),
    transportCapacity: roundStock(clampPositive(stocks.transportCapacity + flows.networkExpansion - flows.networkWear)),
    greenSpace: roundStock(clampPositive(stocks.greenSpace + flows.greenExpansion - flows.landConversion)),
  };
}

function buildStockFlowDiagram(): SystemDynamicsStockFlowDiagram {
  const nodes: SystemDynamicsDiagramNode[] = [
    { id: 'population', label: 'Population', kind: 'stock', description: 'Residents living in the urban region.', x: 60, y: 110, width: 132, height: 54 },
    { id: 'housing', label: 'Housing', kind: 'stock', description: 'Dwellings available to absorb growth and redevelopment.', x: 260, y: 110, width: 132, height: 54 },
    { id: 'employment', label: 'Employment', kind: 'stock', description: 'Jobs located in the regional economy.', x: 470, y: 110, width: 132, height: 54 },
    { id: 'transport_capacity', label: 'Transport Capacity', kind: 'stock', description: 'Network carrying capacity shaped by investment and wear.', x: 160, y: 300, width: 160, height: 54 },
    { id: 'green_space', label: 'Green Space', kind: 'stock', description: 'Protected and accessible urban ecological land.', x: 430, y: 300, width: 146, height: 54 },
    { id: 'housingIncentive', label: 'Housing Incentive', kind: 'lever', description: 'Planning and finance lever for construction support.', x: 250, y: 18, width: 146, height: 40 },
    { id: 'transitInvestment', label: 'Transit Investment', kind: 'lever', description: 'Infrastructure spending lever for network expansion.', x: 46, y: 228, width: 146, height: 40 },
    { id: 'greenProtection', label: 'Green Protection', kind: 'lever', description: 'Conservation lever limiting land conversion.', x: 492, y: 228, width: 138, height: 40 },
  ];

  const links: SystemDynamicsDiagramLink[] = [
    { id: 'population-growth', label: 'Population growth', kind: 'flow', description: 'Births and in-migration add to the population stock.', from: { x: 16, y: 137 }, to: { x: 60, y: 137 }, valve: { x: 38, y: 137 } },
    { id: 'population-decline', label: 'Population decline', kind: 'flow', description: 'Out-migration and decline remove population.', from: { x: 192, y: 137 }, to: { x: 230, y: 137 }, valve: { x: 210, y: 137 } },
    { id: 'housing-construction', label: 'Construction', kind: 'flow', description: 'Construction and redevelopment expand the housing stock.', from: { x: 210, y: 137 }, to: { x: 260, y: 137 }, valve: { x: 234, y: 137 } },
    { id: 'housing-demolition', label: 'Demolition', kind: 'flow', description: 'Demolition and obsolescence reduce housing units.', from: { x: 392, y: 137 }, to: { x: 434, y: 137 }, valve: { x: 412, y: 137 } },
    { id: 'employment-growth', label: 'Employment growth', kind: 'flow', description: 'Business formation and investment grow employment.', from: { x: 420, y: 137 }, to: { x: 470, y: 137 }, valve: { x: 446, y: 137 } },
    { id: 'employment-decline', label: 'Employment decline', kind: 'flow', description: 'Business closures and decline reduce jobs.', from: { x: 602, y: 137 }, to: { x: 652, y: 137 }, valve: { x: 626, y: 137 } },
    { id: 'network-expansion', label: 'Network expansion', kind: 'flow', description: 'Transit and network upgrades add capacity.', from: { x: 108, y: 327 }, to: { x: 160, y: 327 }, valve: { x: 134, y: 327 } },
    { id: 'network-wear', label: 'Wear & congestion', kind: 'flow', description: 'Congestion and deferred maintenance erode capacity.', from: { x: 320, y: 327 }, to: { x: 370, y: 327 }, valve: { x: 344, y: 327 } },
    { id: 'green-expansion', label: 'Greening', kind: 'flow', description: 'Restoration and park investment expand green space.', from: { x: 374, y: 327 }, to: { x: 430, y: 327 }, valve: { x: 402, y: 327 } },
    { id: 'land-conversion', label: 'Land conversion', kind: 'flow', description: 'Development pressure converts ecological land to urban uses.', from: { x: 576, y: 327 }, to: { x: 632, y: 327 }, valve: { x: 602, y: 327 } },
    { id: 'housing-influence', label: 'Supports construction', kind: 'influence', description: 'Housing incentive raises construction intensity.', from: { x: 324, y: 58 }, to: { x: 234, y: 120 }, polarity: 'positive' },
    { id: 'transit-influence', label: 'Funds expansion', kind: 'influence', description: 'Transit investment increases network expansion.', from: { x: 118, y: 268 }, to: { x: 134, y: 307 }, polarity: 'positive' },
    { id: 'green-influence', label: 'Limits conversion', kind: 'influence', description: 'Green protection slows conversion and supports greening.', from: { x: 560, y: 268 }, to: { x: 602, y: 307 }, polarity: 'negative' },
  ];

  const feedbackArcs: SystemDynamicsFeedbackArc[] = [
    {
      id: 'loop-housing-balance',
      label: 'B1 Housing balancing loop',
      type: 'balancing',
      description: 'Population pressure triggers housing construction, which restores adequacy and slows out-migration.',
      path: 'M 120 96 C 200 24, 344 26, 340 102',
      labelPoint: { x: 232, y: 42 },
    },
    {
      id: 'loop-transit-growth',
      label: 'R1 Access and jobs loop',
      type: 'reinforcing',
      description: 'Transit capacity and employment reinforce one another through accessibility and regional attractiveness.',
      path: 'M 520 174 C 520 250, 332 244, 256 182',
      labelPoint: { x: 394, y: 214 },
    },
    {
      id: 'loop-green-amenity',
      label: 'B2 Green amenity loop',
      type: 'balancing',
      description: 'Green loss reduces quality of life, which can dampen long-run population attraction.',
      path: 'M 502 292 C 472 212, 208 202, 132 164',
      labelPoint: { x: 292, y: 210 },
    },
  ];

  return {
    width: 680,
    height: 390,
    nodes,
    links,
    feedbackArcs,
  };
}

function buildCausalLoopGraph(): SystemDynamicsCausalLoopGraph {
  const nodes: SystemDynamicsCausalNode[] = [
    { id: 'population', label: 'Population', group: 'stock', x: 120, y: 84 },
    { id: 'housing', label: 'Housing', group: 'stock', x: 320, y: 86 },
    { id: 'employment', label: 'Employment', group: 'stock', x: 520, y: 86 },
    { id: 'transport_capacity', label: 'Transport Capacity', group: 'stock', x: 170, y: 264 },
    { id: 'green_space', label: 'Green Space', group: 'stock', x: 470, y: 264 },
    { id: 'quality_of_life', label: 'Quality of Life', group: 'pressure', x: 320, y: 190 },
    { id: 'housing_pressure', label: 'Housing Pressure', group: 'pressure', x: 224, y: 34 },
    { id: 'housingIncentive', label: 'Housing Incentive', group: 'lever', x: 318, y: 18 },
    { id: 'transitInvestment', label: 'Transit Investment', group: 'lever', x: 70, y: 198 },
    { id: 'greenProtection', label: 'Green Protection', group: 'lever', x: 574, y: 198 },
    { id: 'compactGrowth', label: 'Compact Growth', group: 'lever', x: 320, y: 326 },
  ];

  const loops: SystemDynamicsLoopDefinition[] = [
    {
      id: 'r1',
      label: 'R1 Access and employment',
      type: 'reinforcing',
      description: 'Better transport supports jobs, which attracts population and sustains demand for further transport investment.',
    },
    {
      id: 'b1',
      label: 'B1 Housing adequacy',
      type: 'balancing',
      description: 'Population growth raises housing pressure, which stimulates construction and reduces pressure again.',
    },
    {
      id: 'b2',
      label: 'B2 Ecological amenity',
      type: 'balancing',
      description: 'Green loss undermines quality of life and eventually softens population attraction.',
    },
  ];

  const edges: SystemDynamicsCausalEdge[] = [
    { id: 'population-to-pressure', from: 'population', to: 'housing_pressure', polarity: 'positive', path: 'M 142 62 C 168 44, 188 36, 206 34', loopId: 'b1' },
    { id: 'pressure-to-housing', from: 'housing_pressure', to: 'housing', polarity: 'positive', path: 'M 242 34 C 274 28, 288 42, 302 64', loopId: 'b1' },
    { id: 'housing-to-pressure', from: 'housing', to: 'housing_pressure', polarity: 'negative', path: 'M 308 74 C 292 54, 270 44, 246 40', loopId: 'b1' },
    { id: 'transport-to-employment', from: 'transport_capacity', to: 'employment', polarity: 'positive', path: 'M 196 240 C 268 150, 390 122, 494 98', loopId: 'r1' },
    { id: 'employment-to-population', from: 'employment', to: 'population', polarity: 'positive', path: 'M 498 92 C 404 32, 242 22, 142 72', loopId: 'r1' },
    { id: 'population-to-transport', from: 'population', to: 'transport_capacity', polarity: 'positive', path: 'M 122 104 C 120 164, 132 208, 156 236', loopId: 'r1' },
    { id: 'green-to-quality', from: 'green_space', to: 'quality_of_life', polarity: 'positive', path: 'M 446 246 C 420 212, 386 198, 346 192', loopId: 'b2' },
    { id: 'quality-to-population', from: 'quality_of_life', to: 'population', polarity: 'positive', path: 'M 294 176 C 244 148, 188 116, 142 94', loopId: 'b2' },
    { id: 'population-to-green', from: 'population', to: 'green_space', polarity: 'negative', path: 'M 140 96 C 224 174, 338 238, 444 254', loopId: 'b2' },
    { id: 'lever-housing', from: 'housingIncentive', to: 'housing', polarity: 'positive', path: 'M 318 38 C 320 54, 320 60, 320 68' },
    { id: 'lever-transit', from: 'transitInvestment', to: 'transport_capacity', polarity: 'positive', path: 'M 82 212 C 92 234, 110 248, 152 258' },
    { id: 'lever-green', from: 'greenProtection', to: 'green_space', polarity: 'positive', path: 'M 562 212 C 554 232, 536 246, 492 258' },
    { id: 'lever-compact', from: 'compactGrowth', to: 'green_space', polarity: 'positive', path: 'M 340 314 C 364 296, 394 282, 444 270' },
    { id: 'lever-compact-housing', from: 'compactGrowth', to: 'housing', polarity: 'positive', path: 'M 308 308 C 294 250, 298 174, 314 108' },
  ];

  return {
    width: 640,
    height: 360,
    nodes,
    edges,
    loops,
  };
}

function buildSummary(
  scenarioName: string,
  initialStocks: SystemDynamicsStocks,
  finalStocks: SystemDynamicsStocks,
  stability: SystemDynamicsStabilitySummary,
): SystemDynamicsSummary {
  const stockEntries: Array<[SystemDynamicsStockId, number]> = [
    ['population', (finalStocks.population - initialStocks.population) / Math.max(initialStocks.population, 1)],
    ['housing', (finalStocks.housing - initialStocks.housing) / Math.max(initialStocks.housing, 1)],
    ['employment', (finalStocks.employment - initialStocks.employment) / Math.max(initialStocks.employment, 1)],
    ['transport_capacity', (finalStocks.transportCapacity - initialStocks.transportCapacity) / Math.max(initialStocks.transportCapacity, 1)],
    ['green_space', (finalStocks.greenSpace - initialStocks.greenSpace) / Math.max(initialStocks.greenSpace, 1)],
  ];
  const leadStock = [...stockEntries].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'population';
  const populationChange = ((finalStocks.population - initialStocks.population) / Math.max(initialStocks.population, 1)) * 100;
  const greenChange = ((finalStocks.greenSpace - initialStocks.greenSpace) / Math.max(initialStocks.greenSpace, 1)) * 100;
  const housingChange = ((finalStocks.housing - initialStocks.housing) / Math.max(initialStocks.housing, 1)) * 100;
  const keyTensions = [
    `Population change: ${populationChange >= 0 ? '+' : ''}${populationChange.toFixed(1)}% over the simulated horizon.`,
    `Housing change: ${housingChange >= 0 ? '+' : ''}${housingChange.toFixed(1)}%; adequacy shifts with construction and demolition pressure.`,
    `Green-space change: ${greenChange >= 0 ? '+' : ''}${greenChange.toFixed(1)}%; this captures the core growth-versus-protection tension.`,
    stability.isStable
      ? `The annual Euler integration stayed stable with a maximum year-on-year change ratio of ${(stability.maxAnnualChangeRatio * 100).toFixed(1)}%.`
      : `Stability warning: ${stability.warnings.join(' ')}`,
  ];

  return {
    headline: `${scenarioName} traces long-run interactions between growth, infrastructure, and ecological protection using five coupled urban stocks.`,
    keyTensions,
    leadStock,
  };
}

export function simulateSystemDynamics(input: SystemDynamicsSimulationInput = {}): SystemDynamicsResult {
  const years = clamp(Math.round(input.years ?? 25), 5, 60);
  const initialStocks = mergeStocks(input.initialStocks);
  const policyLevers = mergePolicyLevers(input.policyLevers);
  const scenarioName = input.scenarioName?.trim() || 'System Dynamics Scenario';

  const traces: SystemDynamicsTracePoint[] = [];
  let currentStocks = initialStocks;
  let maxAnnualChangeRatio = 0;
  const warnings: string[] = [];

  for (let year = 0; year <= years; year += 1) {
    const indicators = computeIndicators(currentStocks);
    const flows = computeYearFlows(currentStocks, indicators, policyLevers);

    traces.push({
      year,
      label: year === 0 ? 'Baseline' : `Year ${year}`,
      stocks: currentStocks,
      flows,
      indicators,
    });

    if (year === years) {
      break;
    }

    const nextStocks = integrateStocks(currentStocks, flows);
    const annualRatios = [
      Math.abs(nextStocks.population - currentStocks.population) / Math.max(currentStocks.population, 1),
      Math.abs(nextStocks.housing - currentStocks.housing) / Math.max(currentStocks.housing, 1),
      Math.abs(nextStocks.employment - currentStocks.employment) / Math.max(currentStocks.employment, 1),
      Math.abs(nextStocks.transportCapacity - currentStocks.transportCapacity) / Math.max(currentStocks.transportCapacity, 1),
      Math.abs(nextStocks.greenSpace - currentStocks.greenSpace) / Math.max(currentStocks.greenSpace, 1),
    ];
    maxAnnualChangeRatio = Math.max(maxAnnualChangeRatio, ...annualRatios);

    currentStocks = nextStocks;
  }

  for (const trace of traces) {
    const values = [
      trace.stocks.population,
      trace.stocks.housing,
      trace.stocks.employment,
      trace.stocks.transportCapacity,
      trace.stocks.greenSpace,
    ];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      warnings.push(`Non-finite or negative stock value detected at year ${trace.year}.`);
      break;
    }
  }

  const finalStocks = traces[traces.length - 1]?.stocks ?? initialStocks;

  for (const stockId of ['population', 'housing', 'employment', 'transport_capacity', 'green_space'] as SystemDynamicsStockId[]) {
    const initialValue = stockValueById(initialStocks, stockId);
    const finalValue = stockValueById(finalStocks, stockId);
    const multiplier = finalValue / Math.max(initialValue, 1);
    if (multiplier > 4.5) {
      warnings.push(`${stockId.replace(/_/g, ' ')} exceeds a 4.5x increase; treat this scenario as unstable.`);
    }
    if (multiplier < 0.2) {
      warnings.push(`${stockId.replace(/_/g, ' ')} falls below 20% of its initial level; inspect lever settings.`);
    }
  }

  if (maxAnnualChangeRatio > 0.25) {
    warnings.push(`Maximum year-on-year stock change exceeds 25% (${(maxAnnualChangeRatio * 100).toFixed(1)}%).`);
  }

  const stability: SystemDynamicsStabilitySummary = {
    isStable: warnings.length === 0,
    maxAnnualChangeRatio,
    warnings,
  };

  return {
    scenarioName,
    years,
    timeStepYears: 1,
    initialStocks,
    policyLevers,
    traces,
    finalStocks,
    stability,
    summary: buildSummary(scenarioName, initialStocks, finalStocks, stability),
    stockFlowDiagram: buildStockFlowDiagram(),
    causalLoopGraph: buildCausalLoopGraph(),
  };
}
