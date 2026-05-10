import { average, clamp, component, createIndicatorDefinition, createIndicatorResult, round, safeRatio } from '../indicators/shared';
import type { IndicatorCatalogDefinition } from '../indicators/types';

function normaliseScore(value: number, max = 100): number {
  return clamp((value / max) * 100, 0, 100);
}

export interface SocialCohesionIndexInput {
  civicParticipationPct: number;
  trustScore: number;
  volunteeringPct: number;
  neighbourSupportScore: number;
}

export function socialCohesionIndex(input: SocialCohesionIndexInput) {
  const parts = [
    normaliseScore(input.civicParticipationPct),
    normaliseScore(input.trustScore),
    normaliseScore(input.volunteeringPct),
    normaliseScore(input.neighbourSupportScore),
  ];
  const value = round(average(parts), 1);
  return createIndicatorResult('socialCohesionIndex', value, 'index [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('participation', 'Civic participation', round(parts[0], 1), 'score'),
      component('trust', 'Trust', round(parts[1], 1), 'score'),
      component('volunteering', 'Volunteering', round(parts[2], 1), 'score'),
      component('support', 'Neighbour support', round(parts[3], 1), 'score'),
    ],
  });
}

export interface CulturalFacilityAccessInput {
  museumOpportunities: number;
  museumTravelMinutes: number;
  libraryOpportunities: number;
  libraryTravelMinutes: number;
  theatreOpportunities: number;
  theatreTravelMinutes: number;
  beta: number;
}

export function culturalFacilityAccess(input: CulturalFacilityAccessInput) {
  const museum = input.museumOpportunities * Math.exp(-input.beta * input.museumTravelMinutes);
  const library = input.libraryOpportunities * Math.exp(-input.beta * input.libraryTravelMinutes);
  const theatre = input.theatreOpportunities * Math.exp(-input.beta * input.theatreTravelMinutes);
  const value = round(museum + library + theatre, 2);
  return createIndicatorResult('culturalFacilityAccess', value, 'gravity score', {
    displayValue: `${value} gravity score`,
    components: [
      component('museum', 'Museum access', round(museum, 2), 'score'),
      component('library', 'Library access', round(library, 2), 'score'),
      component('theatre', 'Theatre access', round(theatre, 2), 'score'),
    ],
  });
}

export interface ChildFriendlyScoreInput {
  playSpaceScore: number;
  schoolProximityScore: number;
  trafficSafetyScore: number;
  airQualityScore: number;
  independentMobilityScore: number;
}

export function childFriendlyScore(input: ChildFriendlyScoreInput) {
  const parts = [
    input.playSpaceScore,
    input.schoolProximityScore,
    input.trafficSafetyScore,
    input.airQualityScore,
    input.independentMobilityScore,
  ].map((value) => normaliseScore(value));
  const value = round(average(parts), 1);
  return createIndicatorResult('childFriendlyScore', value, 'index [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('play', 'Play space', round(parts[0], 1), 'score'),
      component('school', 'School proximity', round(parts[1], 1), 'score'),
      component('safety', 'Traffic safety', round(parts[2], 1), 'score'),
      component('air', 'Air quality', round(parts[3], 1), 'score'),
      component('mobility', 'Independent mobility', round(parts[4], 1), 'score'),
    ],
  });
}

export interface AgeFriendlyScoreInput {
  transportScore: number;
  housingScore: number;
  participationScore: number;
  respectScore: number;
  civicInclusionScore: number;
  communicationScore: number;
  healthServicesScore: number;
  outdoorSpaceScore: number;
}

export function ageFriendlyScore(input: AgeFriendlyScoreInput) {
  const parts = [
    input.transportScore,
    input.housingScore,
    input.participationScore,
    input.respectScore,
    input.civicInclusionScore,
    input.communicationScore,
    input.healthServicesScore,
    input.outdoorSpaceScore,
  ].map((value) => normaliseScore(value));
  const value = round(average(parts), 1);
  return createIndicatorResult('ageFriendlyScore', value, 'index [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('transport', 'Transport', round(parts[0], 1), 'score'),
      component('housing', 'Housing', round(parts[1], 1), 'score'),
      component('participation', 'Participation', round(parts[2], 1), 'score'),
      component('respect', 'Respect and inclusion', round(parts[3], 1), 'score'),
      component('civic', 'Civic inclusion', round(parts[4], 1), 'score'),
      component('communication', 'Communication', round(parts[5], 1), 'score'),
      component('health', 'Community and health support', round(parts[6], 1), 'score'),
      component('outdoor', 'Outdoor space', round(parts[7], 1), 'score'),
    ],
  });
}

export interface FoodDesertIndexInput {
  populationBeyondFreshFoodCatchment: number;
  totalPopulation: number;
}

export function foodDesertIndex(input: FoodDesertIndexInput) {
  const value = round(safeRatio(input.populationBeyondFreshFoodCatchment, input.totalPopulation) * 100, 2);
  return createIndicatorResult('foodDesertIndex', value, '%', {
    displayValue: `${value}% beyond 500 m of fresh food retail`,
  });
}

export interface PublicSpaceQualityInput {
  cleanlinessScore: number;
  amenityScore: number;
  safetyScore: number;
  comfortScore: number;
}

export function publicSpaceQuality(input: PublicSpaceQualityInput) {
  const parts = [
    input.cleanlinessScore,
    input.amenityScore,
    input.safetyScore,
    input.comfortScore,
  ].map((value) => normaliseScore(value));
  const value = round(average(parts), 1);
  return createIndicatorResult('publicSpaceQuality', value, 'index [0-100]', {
    displayValue: `${value}/100`,
    components: [
      component('cleanliness', 'Cleanliness', round(parts[0], 1), 'score'),
      component('amenity', 'Amenity', round(parts[1], 1), 'score'),
      component('safety', 'Safety', round(parts[2], 1), 'score'),
      component('comfort', 'Comfort', round(parts[3], 1), 'score'),
    ],
  });
}

export interface NighttimeEconomyInput {
  establishmentsOpenLate: number;
  commercialAreaKm2: number;
}

export function nighttimeEconomy(input: NighttimeEconomyInput) {
  const value = input.commercialAreaKm2 > 0 ? round(input.establishmentsOpenLate / input.commercialAreaKm2, 2) : 0;
  return createIndicatorResult('nighttimeEconomy', value, 'establishments/km²', {
    displayValue: `${value} establishments/km² after 22:00`,
  });
}

export const SOCIAL_LIVEABILITY_INDICATORS: IndicatorCatalogDefinition[] = [
  createIndicatorDefinition<SocialCohesionIndexInput>({
    kind: 'socialCohesionIndex',
    title: 'Social Cohesion Index',
    groupId: 'social_liveability',
    summary: 'Composite proxy for civic participation, trust, volunteering, and neighbour support.',
    methodSummary: 'Four social-capital dimensions are normalised to a 0–100 scale and averaged to provide a pragmatic cohesion benchmark.',
    formula: 'Cohesion = mean(participation, trust, volunteering, support)',
    unit: 'index [0-100]',
    inputFields: [
      { key: 'civicParticipationPct', label: 'Civic Participation', description: 'Share of residents participating in local associations or civic forums.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 41 },
      { key: 'trustScore', label: 'Interpersonal Trust', description: 'Survey-derived trust score normalised to 0–100.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 58 },
      { key: 'volunteeringPct', label: 'Volunteering Rate', description: 'Share of residents participating in volunteer work.', unit: '%', min: 0, max: 100, step: 0.1, defaultValue: 23 },
      { key: 'neighbourSupportScore', label: 'Neighbour Support', description: 'Perceived neighbourhood mutual-support score.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 63 },
    ],
    outputFields: [
      { key: 'value', label: 'Cohesion Index', description: 'Composite social-cohesion score.', unit: 'index [0-100]' },
      { key: 'components', label: 'Component Scores', description: 'Participation, trust, volunteering, and support contributions.' },
    ],
    classification: [
      { label: 'Low cohesion', description: 'Social-capital indicators remain weak or uneven.', max: 40 },
      { label: 'Moderate cohesion', description: 'Community ties exist but are not consistently strong.', min: 40, max: 60 },
      { label: 'High cohesion', description: 'Neighbourhood social-capital conditions are strong.', min: 60, max: 80 },
      { label: 'Very high cohesion', description: 'Community trust and participation are exceptionally strong.', min: 80 },
    ],
    interpretationGuidance: [
      'Composite cohesion scores should be contextualised with survey quality and representativeness.',
      'High cohesion does not automatically imply inclusion across all groups.',
    ],
    methodologicalReference: 'Putnam, R. (2000). Bowling Alone.',
    sectionId: 'urban_indicators',
    tags: ['governance', 'participation', 'equity', 'indicators'],
    relatedFlowIds: ['equity_audit', 'scenario_comparison', 'review'],
    education: {
      pathId: 'foundations_urban_analytics',
      explainerId: 'gini_coefficient',
      note: 'Social cohesion introduces qualitative urban wellbeing into otherwise infrastructure-heavy assessments.',
    },
    dashboardBindingKind: 'series',
    compute: socialCohesionIndex,
  }),
  createIndicatorDefinition<CulturalFacilityAccessInput>({
    kind: 'culturalFacilityAccess',
    title: 'Cultural Facility Access',
    groupId: 'social_liveability',
    summary: 'Gravity-based access to museums, libraries, and theatres.',
    methodSummary: 'Opportunity counts for key cultural facilities are weighted by travel impedance using an exponential decay function.',
    formula: 'Access = Σ(opportunitiesⱼ × e^(-β × travel timeⱼ))',
    unit: 'gravity score',
    inputFields: [
      { key: 'museumOpportunities', label: 'Museum Opportunities', description: 'Weighted opportunity count for museums or galleries.', unit: 'opportunities', min: 0, step: 1, defaultValue: 18 },
      { key: 'museumTravelMinutes', label: 'Museum Travel Time', description: 'Average travel time to museum opportunities.', unit: 'min', min: 0, step: 0.1, defaultValue: 22 },
      { key: 'libraryOpportunities', label: 'Library Opportunities', description: 'Weighted opportunity count for libraries.', unit: 'opportunities', min: 0, step: 1, defaultValue: 24 },
      { key: 'libraryTravelMinutes', label: 'Library Travel Time', description: 'Average travel time to libraries.', unit: 'min', min: 0, step: 0.1, defaultValue: 14 },
      { key: 'theatreOpportunities', label: 'Theatre Opportunities', description: 'Weighted opportunity count for theatres and live venues.', unit: 'opportunities', min: 0, step: 1, defaultValue: 12 },
      { key: 'theatreTravelMinutes', label: 'Theatre Travel Time', description: 'Average travel time to theatres.', unit: 'min', min: 0, step: 0.1, defaultValue: 26 },
      { key: 'beta', label: 'Decay Coefficient', description: 'Exponential impedance coefficient.', unit: 'β', min: 0.001, max: 1, step: 0.001, defaultValue: 0.06 },
    ],
    outputFields: [
      { key: 'value', label: 'Gravity Access Score', description: 'Composite gravity-style access score.' },
      { key: 'components', label: 'Facility Contributions', description: 'Museum, library, and theatre access components.' },
    ],
    classification: [
      { label: 'Limited cultural access', description: 'Cultural opportunities are few or difficult to reach.', max: 10 },
      { label: 'Moderate cultural access', description: 'Cultural access exists but is uneven or impedance-sensitive.', min: 10, max: 20 },
      { label: 'Strong cultural access', description: 'Cultural destinations are reachable with moderate impedance.', min: 20, max: 35 },
      { label: 'Highly connected cultural ecosystem', description: 'Cultural opportunities are abundant and highly reachable.', min: 35 },
    ],
    interpretationGuidance: [
      'Gravity access is sensitive to the chosen decay parameter and opportunity definition.',
      'Facility quantity does not capture cultural diversity or affordability by itself.',
    ],
    methodologicalReference: 'Bianchini, F. & Parkinson, M. (1993). Cultural policy and urban regeneration.',
    sectionId: 'urban_indicators',
    tags: ['heritage', 'placemaking', 'accessibility', 'indicators'],
    relatedFlowIds: ['accessibility', 'equity_audit', 'scenario_comparison'],
    education: {
      pathId: 'foundations_urban_analytics',
      explainerId: 'hansen_accessibility',
      note: 'This indicator adapts gravity accessibility logic to non-essential but socially significant urban services.',
    },
    dashboardBindingKind: 'series',
    compute: culturalFacilityAccess,
  }),
  createIndicatorDefinition<ChildFriendlyScoreInput>({
    kind: 'childFriendlyScore',
    title: 'Child-Friendly Score',
    groupId: 'social_liveability',
    summary: 'Composite liveability screen for children covering play, school access, safety, air quality, and independent mobility.',
    methodSummary: 'A reduced operational form of the UNICEF child-friendly-city lens, averaged across five practical neighbourhood dimensions.',
    formula: 'Child-friendly score = mean(play, school, safety, air, mobility)',
    unit: 'index [0-100]',
    inputFields: [
      { key: 'playSpaceScore', label: 'Play Space', description: 'Availability and quality of child-oriented play environments.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 72 },
      { key: 'schoolProximityScore', label: 'School Proximity', description: 'Accessibility of schools and childcare facilities.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 68 },
      { key: 'trafficSafetyScore', label: 'Traffic Safety', description: 'Safety of streets for children.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 54 },
      { key: 'airQualityScore', label: 'Air Quality', description: 'Child-relevant air-quality score.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 61 },
      { key: 'independentMobilityScore', label: 'Independent Mobility', description: 'Extent to which children can move safely and independently.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 49 },
    ],
    outputFields: [
      { key: 'value', label: 'Child-Friendly Score', description: 'Composite child-friendly liveability score.', unit: 'index [0-100]' },
      { key: 'components', label: 'Dimension Scores', description: 'Underlying neighbourhood dimensions for children.' },
    ],
    classification: [
      { label: 'Child-stress environment', description: 'Neighbourhood conditions are weak for child wellbeing and autonomy.', max: 40 },
      { label: 'Developing child-friendly environment', description: 'Some child-oriented conditions exist but important deficits remain.', min: 40, max: 60 },
      { label: 'Supportive child-friendly environment', description: 'Neighbourhood conditions are generally supportive for children.', min: 60, max: 80 },
      { label: 'Strong child-friendly environment', description: 'Neighbourhood conditions strongly support child wellbeing and daily independence.', min: 80 },
    ],
    interpretationGuidance: [
      'Use with qualitative audits or co-design inputs; child-friendliness cannot be fully captured by infrastructure metrics alone.',
      'Scores should be interpreted with age-group context and time-of-day differences.',
    ],
    methodologicalReference: 'UNICEF (2018). Child Friendly Cities Initiative.',
    sectionId: 'urban_indicators',
    tags: ['health', 'equity', 'pedestrian', 'indicators'],
    relatedFlowIds: ['accessibility', 'equity_audit', 'facility_optimisation'],
    education: {
      pathId: 'foundations_urban_analytics',
      explainerId: 'scenario_tradeoffs',
      note: 'Child-friendly scoring is useful when teaching how accessibility, safety, and environmental quality interact.',
    },
    dashboardBindingKind: 'series',
    compute: childFriendlyScore,
  }),
  createIndicatorDefinition<AgeFriendlyScoreInput>({
    kind: 'ageFriendlyScore',
    title: 'Age-Friendly Score',
    groupId: 'social_liveability',
    summary: 'Composite score aligned with the WHO age-friendly-city framework.',
    methodSummary: 'Eight WHO age-friendly domains are normalised to a common 0–100 scale and averaged.',
    formula: 'Age-friendly score = mean(8 WHO domain scores)',
    unit: 'index [0-100]',
    inputFields: [
      { key: 'transportScore', label: 'Transport', description: 'Age-friendly transport score.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 64 },
      { key: 'housingScore', label: 'Housing', description: 'Housing suitability for older adults.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 58 },
      { key: 'participationScore', label: 'Participation', description: 'Older-adult participation opportunities.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 55 },
      { key: 'respectScore', label: 'Respect and Inclusion', description: 'Perceived respect and social inclusion.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 62 },
      { key: 'civicInclusionScore', label: 'Civic Inclusion', description: 'Civic engagement and inclusion.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 49 },
      { key: 'communicationScore', label: 'Communication', description: 'Accessibility of information and communication channels.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 67 },
      { key: 'healthServicesScore', label: 'Health and Support Services', description: 'Availability of health and support services.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 60 },
      { key: 'outdoorSpaceScore', label: 'Outdoor Space', description: 'Outdoor-space and building accessibility.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 63 },
    ],
    outputFields: [
      { key: 'value', label: 'Age-Friendly Score', description: 'Composite age-friendly liveability score.', unit: 'index [0-100]' },
      { key: 'components', label: 'WHO Domain Scores', description: 'Eight WHO age-friendly-domain components.' },
    ],
    classification: [
      { label: 'Low age-friendliness', description: 'Older adults face substantial barriers in the urban environment.', max: 40 },
      { label: 'Moderate age-friendliness', description: 'Some age-friendly conditions exist but important accessibility gaps remain.', min: 40, max: 60 },
      { label: 'High age-friendliness', description: 'Many urban systems are reasonably supportive for ageing in place.', min: 60, max: 80 },
      { label: 'Strong age-friendly environment', description: 'The city strongly supports mobility, participation, and service access for older adults.', min: 80 },
    ],
    interpretationGuidance: [
      'Age-friendliness should be interpreted with disaggregated evidence, not only a composite score.',
      'Pair the score with transport, health-service, and public-space specifics when moving to policy actions.',
    ],
    methodologicalReference: 'WHO (2007). Global Age-friendly Cities Guide.',
    sectionId: 'urban_indicators',
    tags: ['health', 'equity', 'accessibility', 'indicators'],
    relatedFlowIds: ['accessibility', 'equity_audit', 'facility_optimisation'],
    education: {
      pathId: 'foundations_urban_analytics',
      explainerId: 'scenario_tradeoffs',
      note: 'Age-friendly scoring is a practical way to teach why accessibility extends beyond travel-time metrics.',
    },
    dashboardBindingKind: 'series',
    compute: ageFriendlyScore,
  }),
  createIndicatorDefinition<FoodDesertIndexInput>({
    kind: 'foodDesertIndex',
    title: 'Food Desert Index',
    groupId: 'social_liveability',
    summary: 'Share of residents living beyond the fresh-food walking catchment.',
    methodSummary: 'Population located outside the selected grocery or fresh-food catchment is divided by total population.',
    formula: 'Food desert index = population beyond catchment / total population × 100',
    unit: '%',
    inputFields: [
      { key: 'populationBeyondFreshFoodCatchment', label: 'Population Beyond Catchment', description: 'Residents beyond the 500 m fresh-food walking catchment.', unit: 'people', min: 0, step: 1, defaultValue: 26400 },
      { key: 'totalPopulation', label: 'Total Population', description: 'Total resident population in the study area.', unit: 'people', min: 1, step: 1, defaultValue: 112000 },
    ],
    outputFields: [{ key: 'value', label: 'Population Beyond Fresh-food Access', description: 'Share of residents beyond the selected catchment.', unit: '%' }],
    classification: [
      { label: 'Low food-access burden', description: 'Most residents live within the fresh-food catchment.', max: 10 },
      { label: 'Moderate food-access burden', description: 'Food-access gaps are present but not widespread.', min: 10, max: 25 },
      { label: 'High food-access burden', description: 'Food-access deficits affect a substantial portion of residents.', min: 25, max: 40 },
      { label: 'Severe food-access burden', description: 'Fresh-food access gaps are widespread in the study area.', min: 40 },
    ],
    interpretationGuidance: [
      'Distance to fresh food does not capture affordability or cultural relevance of available food supply.',
      'Interpret alongside mobility constraints and demographic vulnerability.',
    ],
    methodologicalReference: 'USDA Economic Research Service (2012) food-access screening practice.',
    sectionId: 'urban_indicators',
    tags: ['health', 'equity', 'accessibility', 'indicators'],
    relatedFlowIds: ['accessibility', 'equity_audit', 'facility_optimisation'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'hansen_accessibility',
      note: 'Food-desert mapping is a clear example of why access must be disaggregated socially and spatially.',
    },
    dashboardBindingKind: 'metric',
    compute: foodDesertIndex,
  }),
  createIndicatorDefinition<PublicSpaceQualityInput>({
    kind: 'publicSpaceQuality',
    title: 'Public Space Quality',
    groupId: 'social_liveability',
    summary: 'Expert-audit composite score for public-space cleanliness, amenity, safety, and comfort.',
    methodSummary: 'Audit dimensions are scored on a 0–100 basis and averaged to create a compact public-space quality index.',
    formula: 'Public-space quality = mean(cleanliness, amenity, safety, comfort)',
    unit: 'index [0-100]',
    inputFields: [
      { key: 'cleanlinessScore', label: 'Cleanliness', description: 'Observed cleanliness and maintenance score.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 66 },
      { key: 'amenityScore', label: 'Amenity', description: 'Amenities such as seating, shade, toilets, and water.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 58 },
      { key: 'safetyScore', label: 'Safety', description: 'Observed and perceived safety score.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 61 },
      { key: 'comfortScore', label: 'Comfort', description: 'Thermal, acoustic, and spatial comfort score.', unit: 'score', min: 0, max: 100, step: 0.1, defaultValue: 64 },
    ],
    outputFields: [
      { key: 'value', label: 'Public-space Quality Score', description: 'Composite quality score for the audited public space.', unit: 'index [0-100]' },
      { key: 'components', label: 'Audit Dimensions', description: 'Underlying audit dimensions retained for diagnostic review.' },
    ],
    classification: [
      { label: 'Poor public-space quality', description: 'The audited environment performs weakly on multiple quality dimensions.', max: 40 },
      { label: 'Developing quality', description: 'The space is usable but still constrained by quality deficits.', min: 40, max: 60 },
      { label: 'Good public-space quality', description: 'The space performs well across most audit dimensions.', min: 60, max: 80 },
      { label: 'Excellent public-space quality', description: 'The space performs strongly across comfort, safety, and amenity.', min: 80 },
    ],
    interpretationGuidance: [
      'Audit scores should be paired with user-group feedback where possible.',
      'Averaged quality can hide critical shortcomings in one dimension, such as safety or thermal comfort.',
    ],
    methodologicalReference: 'Gehl, J. & Svarre, B. (2013). How to Study Public Life.',
    sectionId: 'urban_indicators',
    tags: ['placemaking', 'health', 'safety', 'indicators'],
    relatedFlowIds: ['facility_optimisation', 'equity_audit', 'accessibility'],
    education: {
      pathId: 'foundations_urban_analytics',
      explainerId: 'scenario_tradeoffs',
      note: 'Public-space audit scoring is useful when teaching how qualitative field evidence joins quantitative spatial analysis.',
    },
    dashboardBindingKind: 'series',
    compute: publicSpaceQuality,
  }),
  createIndicatorDefinition<NighttimeEconomyInput>({
    kind: 'nighttimeEconomy',
    title: 'Nighttime Economy Density',
    groupId: 'social_liveability',
    summary: 'Density of commercial establishments active after 22:00.',
    methodSummary: 'The count of late-opening establishments is normalised by commercial land area to provide a compact nighttime-economy indicator.',
    formula: 'Nighttime economy = late-opening establishments / commercial area',
    unit: 'establishments/km²',
    inputFields: [
      { key: 'establishmentsOpenLate', label: 'Late-opening Establishments', description: 'Commercial establishments open after 22:00.', unit: 'count', min: 0, step: 1, defaultValue: 186 },
      { key: 'commercialAreaKm2', label: 'Commercial Area', description: 'Commercial land area associated with the establishment count.', unit: 'km²', min: 0.1, step: 0.1, defaultValue: 4.6 },
    ],
    outputFields: [{ key: 'value', label: 'Nighttime-economy Density', description: 'Density of late-opening establishments.', unit: 'establishments/km²' }],
    classification: [
      { label: 'Quiet nighttime economy', description: 'Limited late-opening activity is present.', max: 10 },
      { label: 'Emerging nighttime economy', description: 'Late-opening activity is visible but not strongly concentrated.', min: 10, max: 25 },
      { label: 'Active nighttime economy', description: 'Late-opening activity is a visible component of commercial life.', min: 25, max: 50 },
      { label: 'Intense nighttime economy', description: 'Late-opening activity is highly concentrated and likely policy-relevant.', min: 50 },
    ],
    interpretationGuidance: [
      'High density can reflect economic vitality, nuisance pressure, or both; interpret with safety and residential context.',
      'Venue density does not capture quality, diversity, or inclusiveness of nighttime activity.',
    ],
    methodologicalReference: 'Roberts, M. & Eldridge, A. (2009). Planning the Night-time City.',
    sectionId: 'urban_indicators',
    tags: ['economic', 'safety', 'placemaking', 'indicators'],
    relatedFlowIds: ['scenario_comparison', 'equity_audit', 'review'],
    education: {
      pathId: 'foundations_urban_analytics',
      explainerId: 'scenario_tradeoffs',
      note: 'Nighttime-economy density is valuable when discussing mixed-use vitality alongside nuisance and safety trade-offs.',
    },
    dashboardBindingKind: 'metric',
    compute: nighttimeEconomy,
  }),
];