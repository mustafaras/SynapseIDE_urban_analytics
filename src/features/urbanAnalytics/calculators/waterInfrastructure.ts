import { component, createIndicatorDefinition, createIndicatorResult, round, safeRatio } from '../indicators/shared';
import type { IndicatorCatalogDefinition } from '../indicators/types';

export interface WaterConsumptionPerCapitaInput {
  dailyWaterSupplyLitres: number;
  population: number;
}

export function waterConsumptionPerCapita(input: WaterConsumptionPerCapitaInput) {
  const value = input.population > 0 ? round(input.dailyWaterSupplyLitres / input.population, 2) : 0;
  return createIndicatorResult('waterConsumptionPerCapita', value, 'litres/cap/day', {
    displayValue: `${value} litres/cap/day`,
  });
}

export interface StormwaterRunoffCoeffInput {
  imperviousCoeff: number;
  imperviousAreaM2: number;
  mixedCoeff: number;
  mixedAreaM2: number;
  permeableCoeff: number;
  permeableAreaM2: number;
}

export function stormwaterRunoffCoeff(input: StormwaterRunoffCoeffInput) {
  const weightedRunoff =
    input.imperviousCoeff * input.imperviousAreaM2 +
    input.mixedCoeff * input.mixedAreaM2 +
    input.permeableCoeff * input.permeableAreaM2;
  const totalArea = input.imperviousAreaM2 + input.mixedAreaM2 + input.permeableAreaM2;
  const value = totalArea > 0 ? round(weightedRunoff / totalArea, 3) : 0;

  return createIndicatorResult('stormwaterRunoffCoeff', value, 'ratio [0-1]', {
    displayValue: `${value}`,
    components: [
      component('impervious', 'Impervious class contribution', round(input.imperviousCoeff * input.imperviousAreaM2, 2)),
      component('mixed', 'Mixed-surface contribution', round(input.mixedCoeff * input.mixedAreaM2, 2)),
      component('permeable', 'Permeable-surface contribution', round(input.permeableCoeff * input.permeableAreaM2, 2)),
    ],
  });
}

export interface SewerCapacityRatioInput {
  peakFlowM3s: number;
  designCapacityM3s: number;
}

export function sewerCapacityRatio(input: SewerCapacityRatioInput) {
  const value = round(safeRatio(input.peakFlowM3s, input.designCapacityM3s), 3);
  return createIndicatorResult('sewerCapacityRatio', value, 'ratio', {
    displayValue: `${value}`,
  });
}

export interface RoadPavementConditionInput {
  arterialPci: number;
  arterialLaneKm: number;
  collectorPci: number;
  collectorLaneKm: number;
  localPci: number;
  localLaneKm: number;
}

export function roadPavementCondition(input: RoadPavementConditionInput) {
  const totalLaneKm = input.arterialLaneKm + input.collectorLaneKm + input.localLaneKm;
  const weightedPci =
    input.arterialPci * input.arterialLaneKm +
    input.collectorPci * input.collectorLaneKm +
    input.localPci * input.localLaneKm;
  const value = totalLaneKm > 0 ? round(weightedPci / totalLaneKm, 1) : 0;
  return createIndicatorResult('roadPavementCondition', value, 'PCI [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('arterial', 'Arterial PCI', round(input.arterialPci, 1), 'PCI'),
      component('collector', 'Collector PCI', round(input.collectorPci, 1), 'PCI'),
      component('local', 'Local PCI', round(input.localPci, 1), 'PCI'),
    ],
  });
}

export interface UtilityReliabilityInput {
  outageHoursPerYear: number;
  totalHoursPerYear: number;
}

export function utilityReliability(input: UtilityReliabilityInput) {
  const uptime = 1 - safeRatio(input.outageHoursPerYear, input.totalHoursPerYear);
  const value = round(Math.max(uptime, 0), 4);
  return createIndicatorResult('utilityReliability', value, 'ratio [0-1]', {
    displayValue: `${round(value * 100, 2)}% reliable`,
  });
}

export interface GreenInfrastructureRatioInput {
  greenSurfaceM2: number;
  permeableSurfaceM2: number;
  overlapSurfaceM2: number;
  totalAreaM2: number;
}

export function greenInfrastructureRatio(input: GreenInfrastructureRatioInput) {
  const unionArea = input.greenSurfaceM2 + input.permeableSurfaceM2 - input.overlapSurfaceM2;
  const value = round(safeRatio(unionArea, input.totalAreaM2), 3);
  return createIndicatorResult('greenInfrastructureRatio', value, 'ratio [0-1]', {
    displayValue: `${value}`,
    metadata: { unionAreaM2: round(unionArea, 2) },
  });
}

export const WATER_INFRASTRUCTURE_INDICATORS: IndicatorCatalogDefinition[] = [
  createIndicatorDefinition<WaterConsumptionPerCapitaInput>({
    kind: 'waterConsumptionPerCapita',
    title: 'Water Consumption Per Capita',
    groupId: 'water_infrastructure',
    summary: 'Average daily potable-water supply per resident.',
    methodSummary: 'Daily supplied water volume is normalised by resident population to benchmark water-demand intensity.',
    formula: 'Q_supply / population',
    unit: 'litres/cap/day',
    inputFields: [
      { key: 'dailyWaterSupplyLitres', label: 'Daily Water Supply', description: 'Total daily potable-water supply.', unit: 'litres/day', min: 0, step: 100, defaultValue: 28640000 },
      { key: 'population', label: 'Population', description: 'Resident population served by the system.', unit: 'people', min: 1, step: 1, defaultValue: 145000 },
    ],
    outputFields: [{ key: 'value', label: 'Water Use Per Resident', description: 'Daily water consumption per resident.', unit: 'litres/cap/day' }],
    classification: [
      { label: 'Low consumption profile', description: 'Daily supply per resident is comparatively restrained.', max: 120 },
      { label: 'Moderate consumption profile', description: 'Consumption is within mainstream urban service ranges.', min: 120, max: 180 },
      { label: 'High consumption profile', description: 'Demand per resident is elevated.', min: 180, max: 250 },
      { label: 'Very high consumption profile', description: 'Demand per resident is strongly water intensive.', min: 250 },
    ],
    interpretationGuidance: [
      'High values may reflect leakage, climate, commercial load, or behaviour; do not read the metric in isolation.',
      'Report whether supply includes industrial or institutional consumption.',
    ],
    methodologicalReference: 'WHO / IWA water-demand benchmarking practice.',
    sectionId: 'urban_indicators',
    tags: ['water', 'indicators', 'policy'],
    relatedFlowIds: ['system_dynamics', 'scenario_comparison', 'review'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'scenario_tradeoffs',
      note: 'Per-capita demand is a simple bridge between household behaviour, network stress, and climate adaptation.',
    },
    dashboardBindingKind: 'metric',
    compute: waterConsumptionPerCapita,
  }),
  createIndicatorDefinition<StormwaterRunoffCoeffInput>({
    kind: 'stormwaterRunoffCoeff',
    title: 'Stormwater Runoff Coefficient',
    groupId: 'water_infrastructure',
    summary: 'Area-weighted runoff coefficient for the analysed surface mix.',
    methodSummary: 'Runoff coefficients for major surface classes are weighted by area and divided by the total catchment area.',
    formula: 'C = sum(c_i * A_i) / A_total',
    unit: 'ratio [0-1]',
    inputFields: [
      { key: 'imperviousCoeff', label: 'Impervious Coefficient', description: 'Runoff coefficient for impervious cover.', unit: 'ratio', min: 0, max: 1, step: 0.01, defaultValue: 0.92 },
      { key: 'imperviousAreaM2', label: 'Impervious Area', description: 'Impervious surface area.', unit: 'm2', min: 0, step: 1, defaultValue: 624000 },
      { key: 'mixedCoeff', label: 'Mixed Surface Coefficient', description: 'Runoff coefficient for mixed or semi-permeable cover.', unit: 'ratio', min: 0, max: 1, step: 0.01, defaultValue: 0.55 },
      { key: 'mixedAreaM2', label: 'Mixed Surface Area', description: 'Area of mixed or semi-permeable surfaces.', unit: 'm2', min: 0, step: 1, defaultValue: 184000 },
      { key: 'permeableCoeff', label: 'Permeable Coefficient', description: 'Runoff coefficient for permeable surfaces.', unit: 'ratio', min: 0, max: 1, step: 0.01, defaultValue: 0.18 },
      { key: 'permeableAreaM2', label: 'Permeable Area', description: 'Area of permeable surfaces.', unit: 'm2', min: 0, step: 1, defaultValue: 132000 },
    ],
    outputFields: [
      { key: 'value', label: 'Runoff Coefficient', description: 'Area-weighted runoff coefficient of the catchment.', unit: 'ratio [0-1]' },
      { key: 'components', label: 'Surface Contributions', description: 'Weighted runoff contributions by surface class.' },
    ],
    classification: [
      { label: 'Highly infiltrative catchment', description: 'Most surfaces are permeable and attenuate runoff.', max: 0.25 },
      { label: 'Mixed runoff profile', description: 'The catchment contains a balanced mix of permeable and sealed surfaces.', min: 0.25, max: 0.5 },
      { label: 'Runoff-intensive catchment', description: 'Sealed or semi-sealed surfaces dominate runoff response.', min: 0.5, max: 0.75 },
      { label: 'Highly sealed catchment', description: 'The catchment generates rapid runoff and requires strong drainage management.', min: 0.75 },
    ],
    interpretationGuidance: [
      'The coefficient depends strongly on land-cover classification and should be reported with the adopted class assumptions.',
      'Use with detention and flood-exposure metrics to avoid over-interpreting one hydrologic screening number.',
    ],
    methodologicalReference: 'Rational Method (Kuichling, 1889).',
    sectionId: 'urban_indicators',
    tags: ['water', 'flood', 'green_infra', 'indicators'],
    relatedFlowIds: ['site_suitability', 'vulnerability', 'scenario_comparison'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'scenario_tradeoffs',
      note: 'The runoff coefficient is a compact way to compare grey drainage and green-infrastructure scenarios.',
    },
    dashboardBindingKind: 'series',
    compute: stormwaterRunoffCoeff,
  }),
  createIndicatorDefinition<SewerCapacityRatioInput>({
    kind: 'sewerCapacityRatio',
    title: 'Sewer Capacity Ratio',
    groupId: 'water_infrastructure',
    summary: 'Peak sewer flow divided by design capacity.',
    methodSummary: 'Observed or modelled peak wet-weather flow is divided by design capacity to screen surcharge risk.',
    formula: 'peak flow / design capacity',
    unit: 'ratio',
    inputFields: [
      { key: 'peakFlowM3s', label: 'Peak Flow', description: 'Observed or simulated peak sewer flow.', unit: 'm3/s', min: 0, step: 0.01, defaultValue: 4.8 },
      { key: 'designCapacityM3s', label: 'Design Capacity', description: 'Hydraulic design capacity of the sewer system.', unit: 'm3/s', min: 0.01, step: 0.01, defaultValue: 5.6 },
    ],
    outputFields: [{ key: 'value', label: 'Capacity Ratio', description: 'Ratio between peak flow and design capacity.', unit: 'ratio' }],
    classification: [
      { label: 'Comfortable headroom', description: 'System capacity remains comfortably above peak loading.', max: 0.7 },
      { label: 'Managed loading', description: 'The system is busy but retains operational headroom.', min: 0.7, max: 0.9 },
      { label: 'Near capacity', description: 'The sewer approaches design capacity during peak conditions.', min: 0.9, max: 1 },
      { label: 'Over capacity', description: 'Peak loading exceeds design capacity and surcharge risk is material.', min: 1 },
    ],
    interpretationGuidance: [
      'Peak-flow assumptions should be documented clearly, especially when derived from modelled storm scenarios.',
      'A ratio near 1 does not automatically imply failure, but it does imply low resilience to uncertainty.',
    ],
    methodologicalReference: 'Local engineering design-capacity standards.',
    sectionId: 'urban_indicators',
    tags: ['water', 'flood', 'indicators', 'policy'],
    relatedFlowIds: ['vulnerability', 'system_dynamics', 'review'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'system_dynamics',
      note: 'Capacity ratios are useful when teaching why seemingly small hydrologic deltas can trigger infrastructure stress.',
    },
    dashboardBindingKind: 'metric',
    compute: sewerCapacityRatio,
  }),
  createIndicatorDefinition<RoadPavementConditionInput>({
    kind: 'roadPavementCondition',
    title: 'Road Pavement Condition',
    groupId: 'water_infrastructure',
    summary: 'Lane-kilometre weighted PCI mean for the network.',
    methodSummary: 'PCI values for arterial, collector, and local roads are weighted by lane-kilometres to produce a network mean.',
    formula: 'weighted mean PCI',
    unit: 'PCI [0-100]',
    inputFields: [
      { key: 'arterialPci', label: 'Arterial PCI', description: 'PCI score for the arterial network.', unit: 'PCI', min: 0, max: 100, step: 0.1, defaultValue: 71 },
      { key: 'arterialLaneKm', label: 'Arterial Lane-km', description: 'Lane-kilometres of arterial pavement.', unit: 'lane-km', min: 0, step: 0.1, defaultValue: 84 },
      { key: 'collectorPci', label: 'Collector PCI', description: 'PCI score for collector roads.', unit: 'PCI', min: 0, max: 100, step: 0.1, defaultValue: 64 },
      { key: 'collectorLaneKm', label: 'Collector Lane-km', description: 'Lane-kilometres of collector pavement.', unit: 'lane-km', min: 0, step: 0.1, defaultValue: 118 },
      { key: 'localPci', label: 'Local PCI', description: 'PCI score for local roads.', unit: 'PCI', min: 0, max: 100, step: 0.1, defaultValue: 57 },
      { key: 'localLaneKm', label: 'Local Lane-km', description: 'Lane-kilometres of local pavement.', unit: 'lane-km', min: 0, step: 0.1, defaultValue: 224 },
    ],
    outputFields: [
      { key: 'value', label: 'Network PCI', description: 'Lane-km weighted pavement-condition index for the network.', unit: 'PCI [0-100]' },
      { key: 'components', label: 'Class PCI Values', description: 'Pavement condition retained by road class.' },
    ],
    classification: [
      { label: 'Poor network condition', description: 'Rehabilitation needs are widespread.', max: 40 },
      { label: 'Fair network condition', description: 'The network is serviceable but materially worn.', min: 40, max: 60 },
      { label: 'Good network condition', description: 'Most roads remain in good operational condition.', min: 60, max: 80 },
      { label: 'Very good network condition', description: 'The network is strongly maintained and performs well.', min: 80 },
    ],
    interpretationGuidance: [
      'A network mean can hide severe deterioration on critical corridors; keep class-level context visible.',
      'PCI does not capture all resilience or safety issues such as drainage failure or rutting severity.',
    ],
    methodologicalReference: 'ASTM D6433 Pavement Condition Index.',
    sectionId: 'urban_indicators',
    tags: ['mobility', 'policy', 'indicators'],
    relatedFlowIds: ['review', 'scenario_comparison', 'system_dynamics'],
    education: {
      pathId: 'scenario_planning_decision_support',
      explainerId: 'scenario_tradeoffs',
      note: 'Road-condition metrics help students connect maintenance backlog with mobility performance and budget trade-offs.',
    },
    dashboardBindingKind: 'series',
    compute: roadPavementCondition,
  }),
  createIndicatorDefinition<UtilityReliabilityInput>({
    kind: 'utilityReliability',
    title: 'Utility Reliability',
    groupId: 'water_infrastructure',
    summary: 'Annual uptime ratio after accounting for outage hours.',
    methodSummary: 'Annual outage duration is divided by total annual hours and subtracted from one to produce a service-reliability ratio.',
    formula: '1 - (outage hours / total hours)',
    unit: 'ratio [0-1]',
    inputFields: [
      { key: 'outageHoursPerYear', label: 'Outage Hours', description: 'Total annual outage duration.', unit: 'hours/year', min: 0, step: 0.1, defaultValue: 18.5 },
      { key: 'totalHoursPerYear', label: 'Total Hours', description: 'Total service hours in the analysis year.', unit: 'hours/year', min: 1, step: 1, defaultValue: 8760 },
    ],
    outputFields: [{ key: 'value', label: 'Reliability Ratio', description: 'Annual utility-reliability ratio.', unit: 'ratio [0-1]' }],
    classification: [
      { label: 'Fragile reliability', description: 'Annual uptime is weak for a core utility service.', max: 0.97 },
      { label: 'Managed reliability', description: 'Reliability is acceptable but interruptions remain material.', min: 0.97, max: 0.99 },
      { label: 'Strong reliability', description: 'Annual uptime is high for the analysed utility service.', min: 0.99, max: 0.999 },
      { label: 'Very high reliability', description: 'Interruptions are rare within the analysis year.', min: 0.999 },
    ],
    interpretationGuidance: [
      'State which utility is being assessed; reliability expectations differ between power, water, and telecom services.',
      'A high annual ratio can still hide concentrated outages affecting specific communities.',
    ],
    methodologicalReference: 'IEEE 1366-style service reliability practice.',
    sectionId: 'urban_indicators',
    tags: ['water', 'energy', 'telecom', 'indicators'],
    relatedFlowIds: ['review', 'system_dynamics', 'vulnerability'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'system_dynamics',
      note: 'Reliability ratios show how seemingly small downtime values still matter for critical service resilience.',
    },
    dashboardBindingKind: 'metric',
    compute: utilityReliability,
  }),
  createIndicatorDefinition<GreenInfrastructureRatioInput>({
    kind: 'greenInfrastructureRatio',
    title: 'Green Infrastructure Ratio',
    groupId: 'water_infrastructure',
    summary: 'Union share of green and permeable surfaces within the study area.',
    methodSummary: 'Green and permeable surfaces are combined as a union area and divided by total site area to approximate green-infrastructure provision.',
    formula: '(permeable + green surface) / total area',
    unit: 'ratio [0-1]',
    inputFields: [
      { key: 'greenSurfaceM2', label: 'Green Surface', description: 'Vegetated or explicitly green-infrastructure surface area.', unit: 'm2', min: 0, step: 1, defaultValue: 218000 },
      { key: 'permeableSurfaceM2', label: 'Permeable Surface', description: 'Permeable surface area regardless of greenness.', unit: 'm2', min: 0, step: 1, defaultValue: 276000 },
      { key: 'overlapSurfaceM2', label: 'Overlap Surface', description: 'Area counted as both green and permeable.', unit: 'm2', min: 0, step: 1, defaultValue: 182000 },
      { key: 'totalAreaM2', label: 'Total Area', description: 'Total study-area surface.', unit: 'm2', min: 1, step: 1, defaultValue: 940000 },
    ],
    outputFields: [{ key: 'value', label: 'Green-infrastructure Ratio', description: 'Share of the site covered by green or permeable surfaces.', unit: 'ratio [0-1]' }],
    classification: [
      { label: 'Low green-infrastructure provision', description: 'Green and permeable coverage remains limited.', max: 0.2 },
      { label: 'Moderate green-infrastructure provision', description: 'Coverage is material but not dominant.', min: 0.2, max: 0.4 },
      { label: 'Strong green-infrastructure provision', description: 'A large share of the site supports permeable or green function.', min: 0.4, max: 0.6 },
      { label: 'Highly greened and permeable system', description: 'Green or permeable surfaces dominate the site fabric.', min: 0.6 },
    ],
    interpretationGuidance: [
      'The ratio is sensitive to how overlap is handled; report that assumption explicitly.',
      'A high ratio does not automatically imply ecological quality or equitable distribution.',
    ],
    methodologicalReference: 'EPA (2021) green-infrastructure accounting practice.',
    sectionId: 'urban_indicators',
    tags: ['green_infra', 'water', 'biodiversity', 'indicators'],
    relatedFlowIds: ['site_suitability', 'green_deficit', 'scenario_comparison'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'ndvi',
      note: 'This indicator helps connect green cover, infiltration, and resilience without collapsing them into a single land-cover label.',
    },
    dashboardBindingKind: 'metric',
    compute: greenInfrastructureRatio,
  }),
];