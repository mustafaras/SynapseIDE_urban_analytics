/**
 * Urban Indicator Calculators — barrel export & registry
 */

/* ── Morphology ─────────────────────────────────────────────────── */
export {
  floorAreaRatio,
  groundSpaceIndex,
  openSpaceRatio,
  mixedUseIndex,
  streetConnectivity,
} from './morphology';
export type {
  FARInput,
  GSIInput,
  OSRInput,
  MixedUseInput,
  StreetConnectivityInput,
} from './morphology';

/* ── Accessibility ──────────────────────────────────────────────── */
export {
  walkScore,
  transitAccessibility,
  cumulativeOpportunities,
  gravityAccessibility,
} from './accessibility';
export type {
  WalkScoreInput,
  TransitAccessibilityInput,
  CumulativeOpportunitiesInput,
  GravityAccessibilityInput,
} from './accessibility';

/* ── Environment ────────────────────────────────────────────────── */
export {
  ndvi,
  urbanHeatIslandIntensity,
  greenSpacePerCapita,
  treeCanopyCoverage,
  imperviousSurface,
} from './environment';
export type {
  NDVIInput,
  UHIInput,
  GreenSpacePerCapitaInput,
  TreeCanopyInput,
  ImperviousSurfaceInput,
} from './environment';

/* ── Socioeconomic ──────────────────────────────────────────────── */
export {
  giniCoefficient,
  shannonDiversity,
  simpsonDiversity,
  jobsHousingBalance,
  displacementRisk,
} from './socioeconomic';
export type {
  GiniInput,
  ShannonDiversityInput,
  SimpsonDiversityInput,
  JobsHousingInput,
  DisplacementRiskInput,
} from './socioeconomic';

/* ── Resilience ─────────────────────────────────────────────────── */
export {
  socialVulnerabilityIndex,
  floodExposure,
  adaptiveCapacity,
  compoundRiskIndex,
} from './resilience';
export type {
  SoVIInput,
  FloodExposureInput,
  AdaptiveCapacityInput,
  CompoundRiskInput,
} from './resilience';

/* ── SDG 11 ─────────────────────────────────────────────────────── */
export {
  sdg11_1_1,
  sdg11_2_1,
  sdg11_3_1,
  sdg11_5_1,
  sdg11_6_1,
  sdg11_6_2,
  sdg11_7_1,
} from './sdg11';
export type {
  SDG_11_1_1_Input,
  SDG_11_2_1_Input,
  SDG_11_3_1_Input,
  SDG_11_5_1_Input,
  SDG_11_6_1_Input,
  SDG_11_6_2_Input,
  SDG_11_7_1_Input,
} from './sdg11';

/* ── Prompt 36: Transport & Mobility ───────────────────────────── */
export {
  vehicleKmTravelled,
  modeSplit,
  transitServiceFrequency,
  cycleLaneConnectivity,
  parkingUtilisation,
  averageCommuteTime,
  roadSafetyIndex,
  lastMileAccess,
  TRANSPORT_MOBILITY_INDICATORS,
} from './transportMobility';
export type {
  VehicleKmTravelledInput,
  ModeSplitInput,
  TransitServiceFrequencyInput,
  CycleLaneConnectivityInput,
  ParkingUtilisationInput,
  AverageCommuteTimeInput,
  RoadSafetyIndexInput,
  LastMileAccessInput,
} from './transportMobility';

/* ── Prompt 36: Energy & Climate ───────────────────────────────── */
export {
  buildingEnergyIntensity,
  renewableEnergyShare,
  carbonFootprintPerCapita,
  urbanAlbedo,
  coolingDegreeDays,
  evapotranspiration,
  embodiedCarbon,
  ENERGY_CLIMATE_INDICATORS,
} from './energyClimate';
export type {
  BuildingEnergyIntensityInput,
  RenewableEnergyShareInput,
  CarbonFootprintPerCapitaInput,
  UrbanAlbedoInput,
  CoolingDegreeDaysInput,
  EvapotranspirationInput,
  EmbodiedCarbonInput,
} from './energyClimate';

/* ── Prompt 36: Urban Form & Landscape Ecology ─────────────────── */
export {
  spacematrixPosition,
  blockDensityProfile,
  edgeDensity,
  patchRichness,
  fractalDimension,
  skyViewFactor,
  streetWallContinuity,
  buildingHeightVariance,
  URBAN_FORM_LANDSCAPE_INDICATORS,
} from './urbanFormLandscape';
export type {
  SpacematrixPositionInput,
  BlockDensityProfileInput,
  EdgeDensityInput,
  PatchRichnessInput,
  FractalDimensionInput,
  SkyViewFactorInput,
  StreetWallContinuityInput,
  BuildingHeightVarianceInput,
} from './urbanFormLandscape';

/* ── Prompt 36: Social Infrastructure & Liveability ────────────── */
export {
  socialCohesionIndex,
  culturalFacilityAccess,
  childFriendlyScore,
  ageFriendlyScore,
  foodDesertIndex,
  publicSpaceQuality,
  nighttimeEconomy,
  SOCIAL_LIVEABILITY_INDICATORS,
} from './socialLiveability';
export type {
  SocialCohesionIndexInput,
  CulturalFacilityAccessInput,
  ChildFriendlyScoreInput,
  AgeFriendlyScoreInput,
  FoodDesertIndexInput,
  PublicSpaceQualityInput,
  NighttimeEconomyInput,
} from './socialLiveability';

/* ── Prompt 36: Water & Infrastructure ─────────────────────────── */
export {
  waterConsumptionPerCapita,
  stormwaterRunoffCoeff,
  sewerCapacityRatio,
  roadPavementCondition,
  utilityReliability,
  greenInfrastructureRatio,
  WATER_INFRASTRUCTURE_INDICATORS,
} from './waterInfrastructure';
export type {
  WaterConsumptionPerCapitaInput,
  StormwaterRunoffCoeffInput,
  SewerCapacityRatioInput,
  RoadPavementConditionInput,
  UtilityReliabilityInput,
  GreenInfrastructureRatioInput,
} from './waterInfrastructure';

/* ── Prompt 36: Governance & Innovation ────────────────────────── */
export {
  planningPermitEfficiency,
  openDataMaturity,
  smartCityReadiness,
  publicParticipationRate,
  intermodalIntegration,
  GOVERNANCE_INNOVATION_INDICATORS,
} from './governanceInnovation';
export type {
  PlanningPermitEfficiencyInput,
  OpenDataMaturityInput,
  SmartCityReadinessInput,
  PublicParticipationRateInput,
  IntermodalIntegrationInput,
} from './governanceInnovation';

/* ── Prompt 36: Heritage & Culture ─────────────────────────────── */
export {
  heritageDensity,
  facadeIntactness,
  culturalLandscapeDiversity,
  intangibleHeritageVitality,
  HERITAGE_CULTURE_INDICATORS,
} from './heritageCulture';
export type {
  HeritageDensityInput,
  FacadeIntactnessInput,
  CulturalLandscapeDiversityInput,
  IntangibleHeritageVitalityInput,
} from './heritageCulture';

/* ── Prompt 36: Pandemic Resilience ────────────────────────────── */
export {
  publicSpacePerCapitaAdj,
  essentialServiceProximity,
  housingDensityRisk,
  digitalAccessEquity,
  PANDEMIC_RESILIENCE_INDICATORS,
} from './pandemicResilience';
export type {
  PublicSpacePerCapitaAdjInput,
  EssentialServiceProximityInput,
  HousingDensityRiskInput,
  DigitalAccessEquityInput,
} from './pandemicResilience';

/* ── Calculator Registry ────────────────────────────────────────── */
import type { UrbanIndicatorKind } from '../lib/types';

import {
  cumulativeOpportunities,
  gravityAccessibility,
  transitAccessibility,
  walkScore,
} from './accessibility';
import {
  greenSpacePerCapita,
  imperviousSurface,
  ndvi,
  treeCanopyCoverage,
  urbanHeatIslandIntensity,
} from './environment';
import {
  floorAreaRatio,
  groundSpaceIndex,
  mixedUseIndex,
  openSpaceRatio,
  streetConnectivity,
} from './morphology';
import {
  adaptiveCapacity,
  compoundRiskIndex,
  floodExposure,
  socialVulnerabilityIndex,
} from './resilience';
import {
  sdg11_1_1,
  sdg11_2_1,
  sdg11_3_1,
  sdg11_5_1,
  sdg11_6_1,
  sdg11_6_2,
  sdg11_7_1,
} from './sdg11';
import {
  displacementRisk,
  giniCoefficient,
  jobsHousingBalance,
  shannonDiversity,
  simpsonDiversity,
} from './socioeconomic';
import {
  averageCommuteTime,
  cycleLaneConnectivity,
  lastMileAccess,
  modeSplit,
  parkingUtilisation,
  roadSafetyIndex,
  transitServiceFrequency,
  vehicleKmTravelled,
} from './transportMobility';
import {
  buildingEnergyIntensity,
  carbonFootprintPerCapita,
  coolingDegreeDays,
  embodiedCarbon,
  evapotranspiration,
  renewableEnergyShare,
  urbanAlbedo,
} from './energyClimate';
import {
  blockDensityProfile,
  buildingHeightVariance,
  edgeDensity,
  fractalDimension,
  patchRichness,
  skyViewFactor,
  spacematrixPosition,
  streetWallContinuity,
} from './urbanFormLandscape';
import {
  ageFriendlyScore,
  childFriendlyScore,
  culturalFacilityAccess,
  foodDesertIndex,
  nighttimeEconomy,
  publicSpaceQuality,
  socialCohesionIndex,
} from './socialLiveability';
import {
  greenInfrastructureRatio,
  roadPavementCondition,
  sewerCapacityRatio,
  stormwaterRunoffCoeff,
  utilityReliability,
  waterConsumptionPerCapita,
} from './waterInfrastructure';
import {
  intermodalIntegration,
  openDataMaturity,
  planningPermitEfficiency,
  publicParticipationRate,
  smartCityReadiness,
} from './governanceInnovation';
import {
  culturalLandscapeDiversity,
  facadeIntactness,
  heritageDensity,
  intangibleHeritageVitality,
} from './heritageCulture';
import {
  digitalAccessEquity,
  essentialServiceProximity,
  housingDensityRisk,
  publicSpacePerCapitaAdj,
} from './pandemicResilience';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CalcFn = (input: any) => import('../lib/types').IndicatorResult;

const _scAlpha: CalcFn = (input) => streetConnectivity(input).alpha;
const _scBeta: CalcFn = (input) => streetConnectivity(input).beta;
const _scGamma: CalcFn = (input) => streetConnectivity(input).gamma;

/**
 * Maps each `UrbanIndicatorKind` to its calculator function.
 * Used by `useCalcStore.compute()` for dynamic dispatch.
 */
export const CALCULATOR_REGISTRY: Partial<Record<UrbanIndicatorKind, CalcFn>> = {
  /* Morphology */
  FAR: floorAreaRatio,
  GSI: groundSpaceIndex,
  OSR: openSpaceRatio,
  MXI: mixedUseIndex,
  street_connectivity_alpha: _scAlpha,
  street_connectivity_beta: _scBeta,
  street_connectivity_gamma: _scGamma,

  /* Accessibility */
  walk_score: walkScore,
  transit_score: transitAccessibility,
  cumulative_opportunities: cumulativeOpportunities,
  gravity_accessibility: gravityAccessibility,

  /* Environment */
  NDVI: ndvi,
  UHI_intensity: urbanHeatIslandIntensity,
  green_space_per_capita: greenSpacePerCapita,
  tree_canopy_pct: treeCanopyCoverage,
  impervious_pct: imperviousSurface,

  /* Socioeconomic */
  gini_coefficient: giniCoefficient,
  shannon_entropy: shannonDiversity,
  simpson_diversity: simpsonDiversity,
  jobs_housing_balance: jobsHousingBalance,
  displacement_risk: displacementRisk,

  /* Resilience */
  social_vulnerability_index: socialVulnerabilityIndex,
  flood_exposure: floodExposure,
  adaptive_capacity: adaptiveCapacity,
  compound_risk: compoundRiskIndex,

  /* SDG 11 */
  sdg_11_1_1: sdg11_1_1,
  sdg_11_2_1: sdg11_2_1,
  sdg_11_3_1: sdg11_3_1,
  sdg_11_5_1: sdg11_5_1,
  sdg_11_6_1: sdg11_6_1,
  sdg_11_6_2: sdg11_6_2,
  sdg_11_7_1: sdg11_7_1,

  /* Prompt 36 — Transport & Mobility */
  vehicleKmTravelled,
  modeSplit,
  transitServiceFrequency,
  cycleLaneConnectivity,
  parkingUtilisation,
  averageCommuteTime,
  roadSafetyIndex,
  lastMileAccess,

  /* Prompt 36 — Energy & Climate */
  buildingEnergyIntensity,
  renewableEnergyShare,
  carbonFootprintPerCapita,
  urbanAlbedo,
  coolingDegreeDays,
  evapotranspiration,
  embodiedCarbon,

  /* Prompt 36 — Urban Form & Landscape Ecology */
  spacematrixPosition,
  blockDensityProfile,
  edgeDensity,
  patchRichness,
  fractalDimension,
  skyViewFactor,
  streetWallContinuity,
  buildingHeightVariance,

  /* Prompt 36 — Social Infrastructure & Liveability */
  socialCohesionIndex,
  culturalFacilityAccess,
  childFriendlyScore,
  ageFriendlyScore,
  foodDesertIndex,
  publicSpaceQuality,
  nighttimeEconomy,

  /* Prompt 36 — Water & Infrastructure */
  waterConsumptionPerCapita,
  stormwaterRunoffCoeff,
  sewerCapacityRatio,
  roadPavementCondition,
  utilityReliability,
  greenInfrastructureRatio,

  /* Prompt 36 — Governance & Innovation */
  planningPermitEfficiency,
  openDataMaturity,
  smartCityReadiness,
  publicParticipationRate,
  intermodalIntegration,

  /* Prompt 36 — Heritage & Culture */
  heritageDensity,
  facadeIntactness,
  culturalLandscapeDiversity,
  intangibleHeritageVitality,

  /* Prompt 36 — Pandemic Resilience */
  publicSpacePerCapita_adj: publicSpacePerCapitaAdj,
  essentialServiceProximity,
  housingDensityRisk,
  digitalAccessEquity,
};
