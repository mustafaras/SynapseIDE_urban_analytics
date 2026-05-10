import { average, clamp, component, createIndicatorDefinition, createIndicatorResult, round, safeRatio } from '../indicators/shared';
import type { IndicatorCatalogDefinition } from '../indicators/types';

function normalise100(value: number): number {
  return clamp(value, 0, 100);
}

export interface PlanningPermitEfficiencyInput {
  totalProcessingDays: number;
  permitCount: number;
}

export function planningPermitEfficiency(input: PlanningPermitEfficiencyInput) {
  const value = input.permitCount > 0 ? round(input.totalProcessingDays / input.permitCount, 1) : 0;
  return createIndicatorResult('planningPermitEfficiency', value, 'days', {
    displayValue: `${value} days`,
  });
}

export interface OpenDataMaturityInput {
  datasetCoverageScore: number;
  apiAvailabilityScore: number;
  updateFrequencyScore: number;
  metadataQualityScore: number;
}

export function openDataMaturity(input: OpenDataMaturityInput) {
  const parts = [
    normalise100(input.datasetCoverageScore),
    normalise100(input.apiAvailabilityScore),
    normalise100(input.updateFrequencyScore),
    normalise100(input.metadataQualityScore),
  ];
  const value = round(average(parts), 1);
  return createIndicatorResult('openDataMaturity', value, 'index [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('coverage', 'Dataset coverage', round(parts[0], 1), 'score'),
      component('api', 'API availability', round(parts[1], 1), 'score'),
      component('update', 'Update frequency', round(parts[2], 1), 'score'),
      component('metadata', 'Metadata quality', round(parts[3], 1), 'score'),
    ],
  });
}

export interface SmartCityReadinessInput {
  ictInfrastructureScore: number;
  digitalServicesScore: number;
  openDataScore: number;
  civicEngagementScore: number;
}

export function smartCityReadiness(input: SmartCityReadinessInput) {
  const parts = [
    normalise100(input.ictInfrastructureScore),
    normalise100(input.digitalServicesScore),
    normalise100(input.openDataScore),
    normalise100(input.civicEngagementScore),
  ];
  const value = round(average(parts), 1);
  return createIndicatorResult('smartCityReadiness', value, 'index [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('ict', 'ICT infrastructure', round(parts[0], 1), 'score'),
      component('services', 'Digital services', round(parts[1], 1), 'score'),
      component('data', 'Open data', round(parts[2], 1), 'score'),
      component('engagement', 'Digital engagement', round(parts[3], 1), 'score'),
    ],
  });
}

export interface PublicParticipationRateInput {
  totalParticipantsOrSubmissions: number;
  planningActionCount: number;
  population: number;
}

export function publicParticipationRate(input: PublicParticipationRateInput) {
  const perAction = input.planningActionCount > 0 ? input.totalParticipantsOrSubmissions / input.planningActionCount : 0;
  const value = round(safeRatio(perAction, input.population) * 1000, 3);
  return createIndicatorResult('publicParticipationRate', value, 'participants per action per 1,000 residents', {
    displayValue: `${value} per 1,000 residents`,
    metadata: { averageParticipantsPerAction: round(perAction, 2) },
  });
}

export interface IntermodalIntegrationInput {
  transferTimeScore: number;
  fareIntegrationScore: number;
  informationContinuityScore: number;
  stationDesignScore: number;
}

export function intermodalIntegration(input: IntermodalIntegrationInput) {
  const parts = [
    normalise100(input.transferTimeScore),
    normalise100(input.fareIntegrationScore),
    normalise100(input.informationContinuityScore),
    normalise100(input.stationDesignScore),
  ];
  const value = round(average(parts), 1);
  return createIndicatorResult('intermodalIntegration', value, 'index [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('time', 'Transfer time quality', round(parts[0], 1), 'score'),
      component('fare', 'Fare integration', round(parts[1], 1), 'score'),
      component('information', 'Information continuity', round(parts[2], 1), 'score'),
      component('design', 'Station and interchange design', round(parts[3], 1), 'score'),
    ],
  });
}

export const GOVERNANCE_INNOVATION_INDICATORS: IndicatorCatalogDefinition[] = [
  createIndicatorDefinition<PlanningPermitEfficiencyInput>({
    kind: 'planningPermitEfficiency',
    title: 'Planning Permit Efficiency',
    groupId: 'governance_innovation',
    summary: 'Mean processing time for planning or building permits.',
    methodSummary: 'Total processing days are divided by the number of permits to estimate average permit-turnaround time.',
    formula: 'mean processing days',
    unit: 'days',
    inputFields: [
      { key: 'totalProcessingDays', label: 'Total Processing Days', description: 'Aggregate processing days across the permit sample.', unit: 'days', min: 0, step: 1, defaultValue: 18420 },
      { key: 'permitCount', label: 'Permit Count', description: 'Number of permits represented in the sample.', unit: 'permits', min: 1, step: 1, defaultValue: 248 },
    ],
    outputFields: [{ key: 'value', label: 'Average Permit Days', description: 'Mean permit processing time.', unit: 'days' }],
    classification: [
      { label: 'Highly efficient process', description: 'Permit processing is comparatively fast.', max: 30 },
      { label: 'Moderately efficient process', description: 'Processing times are workable but not especially fast.', min: 30, max: 60 },
      { label: 'Slow process', description: 'Permit processing is materially delayed.', min: 60, max: 120 },
      { label: 'Severely delayed process', description: 'Permit processing time is a major institutional bottleneck.', min: 120 },
    ],
    interpretationGuidance: [
      'Permit duration should be compared within permit type and regulatory complexity, not indiscriminately.',
      'Averages can hide very uneven experience between routine and complex permits.',
    ],
    methodologicalReference: 'World Bank Doing Business permit-processing benchmarking.',
    sectionId: 'urban_indicators',
    tags: ['governance', 'policy', 'indicators'],
    relatedFlowIds: ['review', 'scenario_comparison', 'system_dynamics'],
    education: {
      pathId: 'scenario_planning_decision_support',
      explainerId: 'system_dynamics',
      note: 'Permit-efficiency metrics help explain how institutional delay affects urban delivery capacity.',
    },
    dashboardBindingKind: 'metric',
    compute: planningPermitEfficiency,
  }),
  createIndicatorDefinition<OpenDataMaturityInput>({
    kind: 'openDataMaturity',
    title: 'Open Data Maturity',
    groupId: 'governance_innovation',
    summary: 'Composite maturity score for dataset coverage, APIs, update cadence, and metadata quality.',
    methodSummary: 'Core open-data governance dimensions are normalised to a 0–100 scale and averaged to produce a maturity score.',
    formula: 'mean(dataset coverage, API availability, update frequency, metadata quality)',
    unit: 'index [0-100]',
    inputFields: [
      { key: 'datasetCoverageScore', label: 'Dataset Coverage', description: 'Breadth of priority datasets published openly.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 69 },
      { key: 'apiAvailabilityScore', label: 'API Availability', description: 'Availability and reliability of machine-readable APIs.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 55 },
      { key: 'updateFrequencyScore', label: 'Update Frequency', description: 'Update regularity and freshness of published data.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 62 },
      { key: 'metadataQualityScore', label: 'Metadata Quality', description: 'Clarity and completeness of metadata documentation.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 71 },
    ],
    outputFields: [
      { key: 'value', label: 'Open-data Maturity Score', description: 'Composite open-data maturity score.', unit: 'index [0-100]' },
      { key: 'components', label: 'Governance Components', description: 'Coverage, API, update, and metadata components.' },
    ],
    classification: [
      { label: 'Low maturity', description: 'Open-data provision is narrow or operationally weak.', max: 40 },
      { label: 'Developing maturity', description: 'Open-data systems exist but remain uneven.', min: 40, max: 60 },
      { label: 'Strong maturity', description: 'Open-data provision is robust across several dimensions.', min: 60, max: 80 },
      { label: 'Advanced maturity', description: 'Open-data ecosystems are mature, reliable, and reusable.', min: 80 },
    ],
    interpretationGuidance: [
      'Coverage matters less if datasets are stale or poorly documented; component review is essential.',
      'Maturity should be paired with actual public or research reuse where possible.',
    ],
    methodologicalReference: 'OECD OURdata Index framing.',
    sectionId: 'urban_indicators',
    tags: ['governance', 'innovation', 'data_engineering', 'indicators'],
    relatedFlowIds: ['review', 'scenario_comparison'],
    education: {
      pathId: 'foundations_urban_analytics',
      explainerId: 'system_dynamics',
      note: 'Open-data maturity underpins reproducible analytics and trustworthy evidence-led planning.',
    },
    dashboardBindingKind: 'series',
    compute: openDataMaturity,
  }),
  createIndicatorDefinition<SmartCityReadinessInput>({
    kind: 'smartCityReadiness',
    title: 'Smart City Readiness',
    groupId: 'governance_innovation',
    summary: 'Composite readiness score for ICT infrastructure, digital services, open data, and engagement.',
    methodSummary: 'Four core smart-city capacity dimensions are normalised to a 0–100 scale and averaged.',
    formula: 'mean(ICT infrastructure, digital services, open data, engagement)',
    unit: 'index [0-100]',
    inputFields: [
      { key: 'ictInfrastructureScore', label: 'ICT Infrastructure', description: 'Strength of broadband, network, and platform infrastructure.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 76 },
      { key: 'digitalServicesScore', label: 'Digital Services', description: 'Availability and quality of digital public services.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 68 },
      { key: 'openDataScore', label: 'Open Data', description: 'Performance of open-data provisioning and reuse support.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 61 },
      { key: 'civicEngagementScore', label: 'Civic Engagement', description: 'Digital engagement and feedback capacity.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 59 },
    ],
    outputFields: [
      { key: 'value', label: 'Smart-city Readiness Score', description: 'Composite readiness score.', unit: 'index [0-100]' },
      { key: 'components', label: 'Readiness Components', description: 'ICT, services, data, and engagement components.' },
    ],
    classification: [
      { label: 'Early-stage readiness', description: 'Digital city capabilities remain limited.', max: 40 },
      { label: 'Developing readiness', description: 'Some capabilities exist but remain partial or fragmented.', min: 40, max: 60 },
      { label: 'Strong readiness', description: 'Digital systems and services are materially established.', min: 60, max: 80 },
      { label: 'Advanced readiness', description: 'Digital city infrastructure and governance are highly developed.', min: 80 },
    ],
    interpretationGuidance: [
      'Readiness is not the same as impact; quality of use and equity of access still matter.',
      'The indicator should be disaggregated when digital systems perform unevenly across districts or groups.',
    ],
    methodologicalReference: 'ITU (2023) smart-city readiness framing.',
    sectionId: 'urban_indicators',
    tags: ['governance', 'innovation', 'telecom', 'indicators'],
    relatedFlowIds: ['review', 'scenario_comparison', 'system_dynamics'],
    education: {
      pathId: 'scenario_planning_decision_support',
      explainerId: 'scenario_tradeoffs',
      note: 'Smart-city readiness is useful when discussing digital capability without reducing the city to technology alone.',
    },
    dashboardBindingKind: 'series',
    compute: smartCityReadiness,
  }),
  createIndicatorDefinition<PublicParticipationRateInput>({
    kind: 'publicParticipationRate',
    title: 'Public Participation Rate',
    groupId: 'governance_innovation',
    summary: 'Average planning-action participation expressed per 1,000 residents.',
    methodSummary: 'Participants or submissions are averaged per planning action and scaled per 1,000 residents.',
    formula: '(participants or submissions / planning actions) / population * 1,000',
    unit: 'participants per action per 1,000 residents',
    inputFields: [
      { key: 'totalParticipantsOrSubmissions', label: 'Participants or Submissions', description: 'Total attendance or submissions across the analysed planning actions.', unit: 'count', min: 0, step: 1, defaultValue: 6240 },
      { key: 'planningActionCount', label: 'Planning Actions', description: 'Number of planning actions or consultations represented.', unit: 'count', min: 1, step: 1, defaultValue: 18 },
      { key: 'population', label: 'Population', description: 'Resident population of the jurisdiction.', unit: 'people', min: 1, step: 1, defaultValue: 146000 },
    ],
    outputFields: [{ key: 'value', label: 'Participation Rate', description: 'Average participation per action per 1,000 residents.', unit: 'participants per action per 1,000 residents' }],
    classification: [
      { label: 'Low participation', description: 'Formal participation remains weak relative to population.', max: 0.5 },
      { label: 'Moderate participation', description: 'Participation is visible but not broad-based.', min: 0.5, max: 2 },
      { label: 'High participation', description: 'Public participation is comparatively strong.', min: 2, max: 5 },
      { label: 'Very high participation', description: 'Formal participation is unusually strong relative to population size.', min: 5 },
    ],
    interpretationGuidance: [
      'Define clearly whether attendance, written submissions, or both are included.',
      'High formal participation does not guarantee representativeness across social groups.',
    ],
    methodologicalReference: 'Arnstein (1969) ladder-informed participation measurement practice.',
    sectionId: 'urban_indicators',
    tags: ['governance', 'participation', 'equity', 'indicators'],
    relatedFlowIds: ['equity_audit', 'review', 'scenario_comparison'],
    education: {
      pathId: 'foundations_urban_analytics',
      explainerId: 'gini_coefficient',
      note: 'Participation rates become more useful when paired with questions of who is actually represented.',
    },
    dashboardBindingKind: 'metric',
    compute: publicParticipationRate,
  }),
  createIndicatorDefinition<IntermodalIntegrationInput>({
    kind: 'intermodalIntegration',
    title: 'Intermodal Integration',
    groupId: 'governance_innovation',
    summary: 'Composite score for transfer time, fare integration, information continuity, and interchange design.',
    methodSummary: 'Core transfer-quality dimensions are normalised to a 0–100 scale and averaged to estimate the seamlessness of intermodal travel.',
    formula: 'mean(transfer time, fare integration, information continuity, station design)',
    unit: 'index [0-100]',
    inputFields: [
      { key: 'transferTimeScore', label: 'Transfer Time', description: 'Quality of transfer times across modes.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 64 },
      { key: 'fareIntegrationScore', label: 'Fare Integration', description: 'Degree of fare-system continuity across modes.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 72 },
      { key: 'informationContinuityScore', label: 'Information Continuity', description: 'Continuity of passenger information across modes.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 58 },
      { key: 'stationDesignScore', label: 'Interchange Design', description: 'Quality of physical interchange design.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 61 },
    ],
    outputFields: [
      { key: 'value', label: 'Intermodal Integration Score', description: 'Composite transfer-seamlessness score.', unit: 'index [0-100]' },
      { key: 'components', label: 'Integration Components', description: 'Transfer time, fare, information, and design components.' },
    ],
    classification: [
      { label: 'Weak integration', description: 'Transfers remain fragmented across modes.', max: 40 },
      { label: 'Moderate integration', description: 'Some intermodal continuity exists but substantial friction remains.', min: 40, max: 60 },
      { label: 'Strong integration', description: 'Transfers are broadly coordinated and legible.', min: 60, max: 80 },
      { label: 'Seamless integration', description: 'Intermodal movement is highly coherent across fare, information, and transfer experience.', min: 80 },
    ],
    interpretationGuidance: [
      'A single composite score should not replace inspection of specific transfer pain points.',
      'Physical design, information, and fare systems often fail differently; keep the components visible.',
    ],
    methodologicalReference: 'Grotenhuis et al. (2007) intermodal transfer quality framing.',
    sectionId: 'urban_indicators',
    tags: ['mobility', 'transit', 'governance', 'indicators'],
    relatedFlowIds: ['accessibility', 'transit_gap', 'scenario_comparison'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'hansen_accessibility',
      note: 'Intermodal integration is useful when explaining why network coverage alone does not guarantee usable access.',
    },
    dashboardBindingKind: 'series',
    compute: intermodalIntegration,
  }),
];