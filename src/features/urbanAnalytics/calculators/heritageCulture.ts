import { average, component, createIndicatorDefinition, createIndicatorResult, round, safeRatio } from '../indicators/shared';
import type { IndicatorCatalogDefinition } from '../indicators/types';

export interface HeritageDensityInput {
  listedAssets: number;
  areaKm2: number;
}

export function heritageDensity(input: HeritageDensityInput) {
  const value = input.areaKm2 > 0 ? round(input.listedAssets / input.areaKm2, 2) : 0;
  return createIndicatorResult('heritageDensity', value, 'count/km2', {
    displayValue: `${value} listed assets/km2`,
  });
}

export interface FacadeIntactnessInput {
  preservedFacadeElements: number;
  totalOriginalFacadeElements: number;
}

export function facadeIntactness(input: FacadeIntactnessInput) {
  const value = round(safeRatio(input.preservedFacadeElements, input.totalOriginalFacadeElements) * 100, 2);
  return createIndicatorResult('facadeIntactness', value, '%', {
    displayValue: `${value}% preserved`,
  });
}

export interface CulturalLandscapeDiversityInput {
  historicCoreArea: number;
  waterfrontArea: number;
  agrarianArea: number;
  industrialArea: number;
  ecologicalArea: number;
}

export function culturalLandscapeDiversity(input: CulturalLandscapeDiversityInput) {
  const values = [
    input.historicCoreArea,
    input.waterfrontArea,
    input.agrarianArea,
    input.industrialArea,
    input.ecologicalArea,
  ].filter((value) => value > 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  const shannon = total > 0
    ? -values.reduce((accumulator, value) => {
        const share = value / total;
        return accumulator + share * Math.log(share);
      }, 0)
    : 0;
  const normalised = values.length > 1 ? round(shannon / Math.log(values.length), 3) : 0;

  return createIndicatorResult('culturalLandscapeDiversity', normalised, 'index [0-1]', {
    displayValue: `${normalised}`,
  });
}

export interface IntangibleHeritageVitalityInput {
  practitionerCount: number;
  benchmarkPractitionerCount: number;
  annualEventCount: number;
  benchmarkEventCount: number;
  apprenticeCount: number;
  benchmarkApprenticeCount: number;
}

export function intangibleHeritageVitality(input: IntangibleHeritageVitalityInput) {
  const practitionerScore = Math.min(safeRatio(input.practitionerCount, input.benchmarkPractitionerCount), 1) * 100;
  const eventScore = Math.min(safeRatio(input.annualEventCount, input.benchmarkEventCount), 1) * 100;
  const transmissionScore = Math.min(safeRatio(input.apprenticeCount, input.benchmarkApprenticeCount), 1) * 100;
  const value = round(average([practitionerScore, eventScore, transmissionScore]), 1);
  return createIndicatorResult('intangibleHeritageVitality', value, 'index [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('practitioners', 'Practitioner continuity', round(practitionerScore, 1), 'score'),
      component('events', 'Event frequency continuity', round(eventScore, 1), 'score'),
      component('transmission', 'Intergenerational transmission', round(transmissionScore, 1), 'score'),
    ],
  });
}

export const HERITAGE_CULTURE_INDICATORS: IndicatorCatalogDefinition[] = [
  createIndicatorDefinition<HeritageDensityInput>({
    kind: 'heritageDensity',
    title: 'Heritage Density',
    groupId: 'heritage_culture',
    summary: 'Listed heritage buildings and monuments per square kilometre.',
    methodSummary: 'The count of listed heritage assets is divided by land area to estimate heritage concentration.',
    formula: 'listed assets / area',
    unit: 'count/km2',
    inputFields: [
      { key: 'listedAssets', label: 'Listed Assets', description: 'Number of listed buildings, monuments, or equivalent heritage assets.', unit: 'count', min: 0, step: 1, defaultValue: 188 },
      { key: 'areaKm2', label: 'Area', description: 'Area of the heritage district or study zone.', unit: 'km2', min: 0.01, step: 0.01, defaultValue: 4.6 },
    ],
    outputFields: [{ key: 'value', label: 'Heritage Assets Per km2', description: 'Density of listed heritage assets.', unit: 'count/km2' }],
    classification: [
      { label: 'Low heritage density', description: 'Listed heritage assets are relatively sparse.', max: 10 },
      { label: 'Moderate heritage density', description: 'Heritage concentration is visible but not dominant.', min: 10, max: 40 },
      { label: 'High heritage density', description: 'The district contains a substantial concentration of heritage assets.', min: 40, max: 80 },
      { label: 'Very high heritage density', description: 'Heritage assets strongly structure the urban character.', min: 80 },
    ],
    interpretationGuidance: [
      'Density should be paired with heritage significance and condition; counts alone are not enough.',
      'Comparisons should respect differences in listing practice between jurisdictions.',
    ],
    methodologicalReference: 'UNESCO World Heritage Centre heritage inventory practice.',
    sectionId: 'urban_indicators',
    tags: ['heritage', 'placemaking', 'indicators'],
    relatedFlowIds: ['review', 'scenario_comparison', 'voxcity_3d'],
    education: {
      pathId: 'urban_morphology_form',
      explainerId: 'building_extrusion',
      note: 'Heritage density helps relate cultural significance to the physical concentration of built assets.',
    },
    dashboardBindingKind: 'metric',
    compute: heritageDensity,
  }),
  createIndicatorDefinition<FacadeIntactnessInput>({
    kind: 'facadeIntactness',
    title: 'Facade Intactness',
    groupId: 'heritage_culture',
    summary: 'Share of original facade elements preserved along heritage streets.',
    methodSummary: 'Preserved original facade elements are divided by the inventoried set of original facade elements.',
    formula: 'preserved elements / original elements * 100',
    unit: '%',
    inputFields: [
      { key: 'preservedFacadeElements', label: 'Preserved Elements', description: 'Number of original facade elements still preserved.', unit: 'count', min: 0, step: 1, defaultValue: 4280 },
      { key: 'totalOriginalFacadeElements', label: 'Original Elements', description: 'Total inventoried original facade elements.', unit: 'count', min: 1, step: 1, defaultValue: 5160 },
    ],
    outputFields: [{ key: 'value', label: 'Preserved Facade Share', description: 'Share of original facade elements preserved.', unit: '%' }],
    classification: [
      { label: 'Low intactness', description: 'A large share of original facade fabric has been lost or altered.', max: 40 },
      { label: 'Moderate intactness', description: 'Some historic facade character remains, but loss is material.', min: 40, max: 60 },
      { label: 'Strong intactness', description: 'Most original facade fabric remains legible.', min: 60, max: 80 },
      { label: 'Very strong intactness', description: 'Historic facade continuity is largely preserved.', min: 80 },
    ],
    interpretationGuidance: [
      'The indicator depends on inventory consistency; define clearly what counts as an original element.',
      'High intactness does not automatically imply good public access or active use.',
    ],
    methodologicalReference: 'ICOMOS (2011) heritage conservation assessment practice.',
    sectionId: 'urban_indicators',
    tags: ['heritage', 'built_form', 'indicators'],
    relatedFlowIds: ['review', 'voxcity_3d', 'scenario_comparison'],
    education: {
      pathId: 'urban_morphology_form',
      explainerId: 'building_extrusion',
      note: 'Facade intactness helps connect conservation quality with visible urban character.',
    },
    dashboardBindingKind: 'metric',
    compute: facadeIntactness,
  }),
  createIndicatorDefinition<CulturalLandscapeDiversityInput>({
    kind: 'culturalLandscapeDiversity',
    title: 'Cultural Landscape Diversity',
    groupId: 'heritage_culture',
    summary: 'Normalised Shannon diversity of landscape character types.',
    methodSummary: 'Landscape-character areas are transformed into shares and evaluated with a normalised Shannon entropy index.',
    formula: 'normalised Shannon entropy of landscape character shares',
    unit: 'index [0-1]',
    inputFields: [
      { key: 'historicCoreArea', label: 'Historic Core Area', description: 'Area of historic core landscape character.', unit: 'ha', min: 0, step: 0.1, defaultValue: 62 },
      { key: 'waterfrontArea', label: 'Waterfront Character Area', description: 'Area of waterfront cultural landscape.', unit: 'ha', min: 0, step: 0.1, defaultValue: 28 },
      { key: 'agrarianArea', label: 'Agrarian Character Area', description: 'Area of agrarian cultural landscape.', unit: 'ha', min: 0, step: 0.1, defaultValue: 21 },
      { key: 'industrialArea', label: 'Industrial Character Area', description: 'Area of industrial heritage landscape.', unit: 'ha', min: 0, step: 0.1, defaultValue: 16 },
      { key: 'ecologicalArea', label: 'Ecological Character Area', description: 'Area of ecological or parkland cultural landscape.', unit: 'ha', min: 0, step: 0.1, defaultValue: 37 },
    ],
    outputFields: [{ key: 'value', label: 'Landscape Diversity Index', description: 'Normalised Shannon diversity of landscape character types.', unit: 'index [0-1]' }],
    classification: [
      { label: 'Low diversity', description: 'One or two landscape characters dominate strongly.', max: 0.3 },
      { label: 'Moderate diversity', description: 'Several character types are present, but distribution remains uneven.', min: 0.3, max: 0.6 },
      { label: 'High diversity', description: 'Landscape character is varied across multiple types.', min: 0.6, max: 0.8 },
      { label: 'Very high diversity', description: 'Landscape character is highly mixed and balanced.', min: 0.8 },
    ],
    interpretationGuidance: [
      'Diversity alone does not tell you which character types are present or whether change is desirable.',
      'The result is sensitive to how landscape character categories are defined.',
    ],
    methodologicalReference: 'European Landscape Convention (2000) diversity framing.',
    sectionId: 'urban_indicators',
    tags: ['heritage', 'biodiversity', 'placemaking', 'indicators'],
    relatedFlowIds: ['change_detection', 'review', 'scenario_comparison'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'ndvi',
      note: 'Landscape diversity helps bridge cultural heritage and ecological pattern analysis.',
    },
    dashboardBindingKind: 'metric',
    compute: culturalLandscapeDiversity,
  }),
  createIndicatorDefinition<IntangibleHeritageVitalityInput>({
    kind: 'intangibleHeritageVitality',
    title: 'Intangible Heritage Vitality',
    groupId: 'heritage_culture',
    summary: 'Composite score based on practitioner continuity, event frequency, and intergenerational transmission.',
    methodSummary: 'Practitioner count, annual event continuity, and apprentice or transmission depth are benchmarked and averaged into a vitality score.',
    formula: 'mean(normalised practitioner count, event frequency, transmission)',
    unit: 'index [0-100]',
    inputFields: [
      { key: 'practitionerCount', label: 'Practitioner Count', description: 'Active practitioners or custodians of the tradition.', unit: 'count', min: 0, step: 1, defaultValue: 182 },
      { key: 'benchmarkPractitionerCount', label: 'Practitioner Benchmark', description: 'Benchmark practitioner count representing strong continuity.', unit: 'count', min: 1, step: 1, defaultValue: 220 },
      { key: 'annualEventCount', label: 'Annual Event Count', description: 'Number of annual events or public activations tied to the practice.', unit: 'count/year', min: 0, step: 1, defaultValue: 16 },
      { key: 'benchmarkEventCount', label: 'Event Benchmark', description: 'Benchmark annual event count representing strong continuity.', unit: 'count/year', min: 1, step: 1, defaultValue: 20 },
      { key: 'apprenticeCount', label: 'Apprentice Count', description: 'Active apprentices, trainees, or equivalent transmission participants.', unit: 'count', min: 0, step: 1, defaultValue: 68 },
      { key: 'benchmarkApprenticeCount', label: 'Transmission Benchmark', description: 'Benchmark apprentice count representing strong intergenerational transfer.', unit: 'count', min: 1, step: 1, defaultValue: 90 },
    ],
    outputFields: [
      { key: 'value', label: 'Vitality Score', description: 'Composite vitality score for living heritage continuity.', unit: 'index [0-100]' },
      { key: 'components', label: 'Vitality Components', description: 'Practitioner, event, and transmission components.' },
    ],
    classification: [
      { label: 'Fragile vitality', description: 'Living-heritage continuity is weak or at risk.', max: 40 },
      { label: 'Developing vitality', description: 'Living-heritage practices continue but remain vulnerable.', min: 40, max: 60 },
      { label: 'Strong vitality', description: 'Living traditions are active and socially sustained.', min: 60, max: 80 },
      { label: 'Very strong vitality', description: 'Living traditions show strong continuity and transmission.', min: 80 },
    ],
    interpretationGuidance: [
      'Benchmark assumptions should be documented; vitality is relative to local cultural context.',
      'Quantitative continuity does not replace interpretation by cultural custodians or practitioners.',
    ],
    methodologicalReference: 'UNESCO ICH (2003) safeguarding and vitality framing.',
    sectionId: 'urban_indicators',
    tags: ['heritage', 'placemaking', 'participation', 'indicators'],
    relatedFlowIds: ['review', 'equity_audit', 'scenario_comparison'],
    education: {
      pathId: 'foundations_urban_analytics',
      explainerId: 'scenario_tradeoffs',
      note: 'Intangible heritage introduces continuity, practice, and transmission into urban analysis beyond the building stock.',
    },
    dashboardBindingKind: 'series',
    compute: intangibleHeritageVitality,
  }),
];