import { component, createIndicatorDefinition, createIndicatorResult, round, safeRatio } from '../indicators/shared';
import type { IndicatorCatalogDefinition } from '../indicators/types';

function computeGini(values: number[]): number {
  const filtered = values.filter((value) => Number.isFinite(value) && value >= 0);
  if (filtered.length === 0) {
    return 0;
  }
  const mean = filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
  if (mean === 0) {
    return 0;
  }
  let numerator = 0;
  for (const left of filtered) {
    for (const right of filtered) {
      numerator += Math.abs(left - right);
    }
  }
  return numerator / (2 * filtered.length * filtered.length * mean);
}

export interface PublicSpacePerCapitaAdjInput {
  usableOutdoorSpaceM2: number;
  population: number;
}

export function publicSpacePerCapitaAdj(input: PublicSpacePerCapitaAdjInput) {
  const value = input.population > 0 ? round(input.usableOutdoorSpaceM2 / input.population, 2) : 0;
  return createIndicatorResult('publicSpacePerCapita_adj', value, 'm2/cap', {
    displayValue: `${value} m2/cap`,
    metadata: { distancingThresholdM2PerCap: 2 },
  });
}

export interface EssentialServiceProximityInput {
  populationWithin15MinWalk: number;
  totalPopulation: number;
}

export function essentialServiceProximity(input: EssentialServiceProximityInput) {
  const value = round(safeRatio(input.populationWithin15MinWalk, input.totalPopulation) * 100, 2);
  return createIndicatorResult('essentialServiceProximity', value, '%', {
    displayValue: `${value}% within 15-minute access`,
  });
}

export interface HousingDensityRiskInput {
  overcrowdingIndex: number;
  buildingAgeRisk: number;
  ventilationRisk: number;
}

export function housingDensityRisk(input: HousingDensityRiskInput) {
  const value = round(input.overcrowdingIndex * input.buildingAgeRisk * input.ventilationRisk * 100, 1);
  return createIndicatorResult('housingDensityRisk', value, 'composite [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('crowding', 'Overcrowding index', round(input.overcrowdingIndex, 3)),
      component('age', 'Building age risk', round(input.buildingAgeRisk, 3)),
      component('ventilation', 'Ventilation risk', round(input.ventilationRisk, 3)),
    ],
  });
}

export interface DigitalAccessEquityInput {
  decile1: number;
  decile2: number;
  decile3: number;
  decile4: number;
  decile5: number;
  decile6: number;
  decile7: number;
  decile8: number;
  decile9: number;
  decile10: number;
}

export function digitalAccessEquity(input: DigitalAccessEquityInput) {
  const values = [
    input.decile1,
    input.decile2,
    input.decile3,
    input.decile4,
    input.decile5,
    input.decile6,
    input.decile7,
    input.decile8,
    input.decile9,
    input.decile10,
  ];
  const value = round(computeGini(values), 3);
  return createIndicatorResult('digitalAccessEquity', value, 'Gini [0-1]', {
    displayValue: `${value} Gini`,
  });
}

export const PANDEMIC_RESILIENCE_INDICATORS: IndicatorCatalogDefinition[] = [
  createIndicatorDefinition<PublicSpacePerCapitaAdjInput>({
    kind: 'publicSpacePerCapita_adj',
    title: 'Usable Public Space Per Capita',
    groupId: 'pandemic_resilience',
    summary: 'Usable outdoor public space normalised by population under distancing conditions.',
    methodSummary: 'Usable outdoor space is divided by population, with a reference threshold of 2 m2 per person for distancing adequacy.',
    formula: 'usable outdoor space / population',
    unit: 'm2/cap',
    inputFields: [
      { key: 'usableOutdoorSpaceM2', label: 'Usable Outdoor Space', description: 'Outdoor public space considered usable under distancing conditions.', unit: 'm2', min: 0, step: 1, defaultValue: 364000 },
      { key: 'population', label: 'Population', description: 'Resident population served by the space.', unit: 'people', min: 1, step: 1, defaultValue: 164000 },
    ],
    outputFields: [{ key: 'value', label: 'Usable Space Per Resident', description: 'Usable outdoor public space per resident.', unit: 'm2/cap' }],
    classification: [
      { label: 'Severe public-space deficit', description: 'Usable outdoor space is materially below distancing needs.', max: 1 },
      { label: 'Limited public-space provision', description: 'Space provision remains below the 2 m2 per person distancing reference.', min: 1, max: 2 },
      { label: 'Adequate public-space provision', description: 'Usable space broadly meets distancing needs.', min: 2, max: 4 },
      { label: 'Strong public-space provision', description: 'Outdoor-space provision is comparatively generous.', min: 4 },
    ],
    interpretationGuidance: [
      'Usable space should exclude inaccessible or functionally unusable areas where possible.',
      'Per-capita provision does not reveal whether space is evenly distributed across neighbourhoods.',
    ],
    methodologicalReference: 'Honey-Roses et al. (2020) public-space adequacy during COVID-19.',
    sectionId: 'urban_indicators',
    tags: ['health', 'placemaking', 'equity', 'indicators'],
    relatedFlowIds: ['equity_audit', 'vulnerability', 'scenario_comparison'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'scenario_tradeoffs',
      note: 'Public-space provision became a visible resilience issue during pandemic restrictions and remains relevant for health equity.',
    },
    dashboardBindingKind: 'metric',
    compute: publicSpacePerCapitaAdj,
  }),
  createIndicatorDefinition<EssentialServiceProximityInput>({
    kind: 'essentialServiceProximity',
    title: 'Essential Service Proximity',
    groupId: 'pandemic_resilience',
    summary: 'Share of residents within a 15-minute walk of pharmacy, grocery, and clinic access.',
    methodSummary: 'Population satisfying the combined essential-service access threshold is divided by total population.',
    formula: 'population within 15-minute walk / total population * 100',
    unit: '%',
    inputFields: [
      { key: 'populationWithin15MinWalk', label: 'Population Within Threshold', description: 'Residents within the 15-minute walking threshold for essential services.', unit: 'people', min: 0, step: 1, defaultValue: 128400 },
      { key: 'totalPopulation', label: 'Total Population', description: 'Total resident population in the study area.', unit: 'people', min: 1, step: 1, defaultValue: 164000 },
    ],
    outputFields: [{ key: 'value', label: 'Population Within Essential-service Access', description: 'Share of residents meeting the essential-service proximity threshold.', unit: '%' }],
    classification: [
      { label: 'Weak service proximity', description: 'A substantial share of residents lacks nearby essential-service access.', max: 50 },
      { label: 'Moderate service proximity', description: 'Essential-service access is present but uneven.', min: 50, max: 70 },
      { label: 'Strong service proximity', description: 'Most residents have nearby essential-service access.', min: 70, max: 90 },
      { label: 'Very strong service proximity', description: 'Essential-service access is broadly embedded in the neighbourhood fabric.', min: 90 },
    ],
    interpretationGuidance: [
      'The proximity result depends on whether all service types must be jointly reachable or are assessed separately.',
      'Walking proximity alone does not address affordability or operating hours.',
    ],
    methodologicalReference: 'Moreno et al. (2021) 15-minute city and essential-service proximity framing.',
    sectionId: 'urban_indicators',
    tags: ['health', 'accessibility', 'equity', 'indicators'],
    relatedFlowIds: ['accessibility', 'fifteen_min_city', 'equity_audit'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'hansen_accessibility',
      note: 'Essential-service proximity is a practical pandemic-era application of access analysis.',
    },
    dashboardBindingKind: 'metric',
    compute: essentialServiceProximity,
  }),
  createIndicatorDefinition<HousingDensityRiskInput>({
    kind: 'housingDensityRisk',
    title: 'Housing Density Risk',
    groupId: 'pandemic_resilience',
    summary: 'Composite risk score based on overcrowding, building age, and ventilation risk.',
    methodSummary: 'Overcrowding, age-related building risk, and ventilation risk are multiplied to produce a compact structural housing-risk measure.',
    formula: 'overcrowding * building age risk * ventilation risk * 100',
    unit: 'composite [0-100]',
    inputFields: [
      { key: 'overcrowdingIndex', label: 'Overcrowding Index', description: 'Crowding risk expressed on a 0-1 scale.', unit: 'ratio', min: 0, max: 1, step: 0.01, defaultValue: 0.58 },
      { key: 'buildingAgeRisk', label: 'Building Age Risk', description: 'Age-related housing risk expressed on a 0-1 scale.', unit: 'ratio', min: 0, max: 1, step: 0.01, defaultValue: 0.62 },
      { key: 'ventilationRisk', label: 'Ventilation Risk', description: 'Ventilation risk proxy expressed on a 0-1 scale.', unit: 'ratio', min: 0, max: 1, step: 0.01, defaultValue: 0.54 },
    ],
    outputFields: [
      { key: 'value', label: 'Housing-risk Score', description: 'Composite housing-density risk score.', unit: 'composite [0-100]' },
      { key: 'components', label: 'Risk Components', description: 'Overcrowding, age, and ventilation-risk components.' },
    ],
    classification: [
      { label: 'Low housing risk', description: 'Combined structural housing risk remains comparatively limited.', max: 15 },
      { label: 'Moderate housing risk', description: 'Some structural risk is present in the housing stock.', min: 15, max: 30 },
      { label: 'High housing risk', description: 'Housing conditions materially intensify epidemic vulnerability.', min: 30, max: 50 },
      { label: 'Severe housing risk', description: 'Multiple housing-related vulnerabilities compound strongly.', min: 50 },
    ],
    interpretationGuidance: [
      'Because the score is multiplicative, one weak dimension can materially lower total risk; inspect components directly.',
      'Proxy definitions for age and ventilation should be documented carefully.',
    ],
    methodologicalReference: 'Ahmad et al. (2020) crowding and housing vulnerability framing.',
    sectionId: 'urban_indicators',
    tags: ['health', 'housing', 'vulnerability', 'indicators'],
    relatedFlowIds: ['vulnerability', 'equity_audit', 'scenario_comparison'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'gini_coefficient',
      note: 'Housing density risk helps connect built conditions with unequal health exposure.',
    },
    dashboardBindingKind: 'series',
    compute: housingDensityRisk,
  }),
  createIndicatorDefinition<DigitalAccessEquityInput>({
    kind: 'digitalAccessEquity',
    title: 'Digital Access Equity',
    groupId: 'pandemic_resilience',
    summary: 'Income-decile Gini coefficient of broadband subscription rates.',
    methodSummary: 'Broadband subscription rates by income decile are evaluated using the Gini coefficient to quantify digital inequality.',
    formula: 'Gini(broadband subscription rates by income decile)',
    unit: 'Gini [0-1]',
    inputFields: [
      { key: 'decile1', label: 'Decile 1 Subscription Rate', description: 'Broadband subscription rate for the lowest income decile.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 48 },
      { key: 'decile2', label: 'Decile 2 Subscription Rate', description: 'Broadband subscription rate for decile 2.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 52 },
      { key: 'decile3', label: 'Decile 3 Subscription Rate', description: 'Broadband subscription rate for decile 3.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 57 },
      { key: 'decile4', label: 'Decile 4 Subscription Rate', description: 'Broadband subscription rate for decile 4.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 63 },
      { key: 'decile5', label: 'Decile 5 Subscription Rate', description: 'Broadband subscription rate for decile 5.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 69 },
      { key: 'decile6', label: 'Decile 6 Subscription Rate', description: 'Broadband subscription rate for decile 6.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 74 },
      { key: 'decile7', label: 'Decile 7 Subscription Rate', description: 'Broadband subscription rate for decile 7.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 79 },
      { key: 'decile8', label: 'Decile 8 Subscription Rate', description: 'Broadband subscription rate for decile 8.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 84 },
      { key: 'decile9', label: 'Decile 9 Subscription Rate', description: 'Broadband subscription rate for decile 9.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 88 },
      { key: 'decile10', label: 'Decile 10 Subscription Rate', description: 'Broadband subscription rate for the highest income decile.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 93 },
    ],
    outputFields: [{ key: 'value', label: 'Broadband Access Gini', description: 'Inequality of broadband subscription across income deciles.', unit: 'Gini [0-1]' }],
    classification: [
      { label: 'Low digital inequality', description: 'Broadband access is relatively even across income deciles.', max: 0.1 },
      { label: 'Moderate digital inequality', description: 'Noticeable but manageable digital inequality is present.', min: 0.1, max: 0.2 },
      { label: 'High digital inequality', description: 'Digital access differs substantially by income.', min: 0.2, max: 0.3 },
      { label: 'Severe digital inequality', description: 'Broadband access is strongly stratified by income.', min: 0.3 },
    ],
    interpretationGuidance: [
      'The Gini coefficient summarises inequality but does not show which deciles are most affected; retain the decile profile.',
      'Subscription rate is not the same as connection quality or device adequacy.',
    ],
    methodologicalReference: 'Beaunoyer et al. (2020) digital divide and inequity framing.',
    sectionId: 'urban_indicators',
    tags: ['health', 'telecom', 'equity', 'indicators'],
    relatedFlowIds: ['equity_audit', 'review', 'scenario_comparison'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'gini_coefficient',
      note: 'Digital access equity is a direct example of how distribution matters more than citywide averages.',
    },
    dashboardBindingKind: 'metric',
    compute: digitalAccessEquity,
  }),
];