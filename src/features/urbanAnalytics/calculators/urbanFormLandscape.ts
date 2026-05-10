import { floorAreaRatio, groundSpaceIndex } from './morphology';
import { clamp, component, createIndicatorDefinition, createIndicatorResult, round, safeRatio } from '../indicators/shared';
import type { IndicatorCatalogDefinition } from '../indicators/types';

function describeSpacematrixPosition(fsi: number, gsi: number): string {
  if (fsi < 0.5 && gsi < 0.2) return 'Open low-rise fabric';
  if (fsi < 1.5 && gsi < 0.35) return 'Suburban low-rise fabric';
  if (fsi < 3 && gsi < 0.5) return 'Compact mid-rise fabric';
  if (fsi < 5 && gsi < 0.6) return 'Intense urban block fabric';
  return 'High-intensity core fabric';
}

function profileLetter(fsi: number, gsi: number): { letter: string; label: string; index: number } {
  if (fsi < 0.5 && gsi < 0.2) return { letter: 'A', label: 'Sparse fringe', index: 1 };
  if (fsi < 1.2 && gsi < 0.35) return { letter: 'B', label: 'Detached suburban', index: 2 };
  if (fsi < 2 && gsi < 0.5) return { letter: 'C', label: 'Perimeter or row-house fabric', index: 3 };
  if (fsi < 3.5 && gsi < 0.6) return { letter: 'D', label: 'Compact mid-rise fabric', index: 4 };
  if (fsi < 6) return { letter: 'E', label: 'Dense mixed-use core', index: 5 };
  return { letter: 'F', label: 'Hyper-dense core', index: 6 };
}

export interface SpacematrixPositionInput {
  grossFloorAreaM2: number;
  plotAreaM2: number;
  footprintAreaM2: number;
}

export function spacematrixPosition(input: SpacematrixPositionInput) {
  const fsi = floorAreaRatio({ totalFloorArea_m2: input.grossFloorAreaM2, lotArea_m2: input.plotAreaM2 }).value;
  const gsi = groundSpaceIndex({ footprintArea_m2: input.footprintAreaM2, lotArea_m2: input.plotAreaM2 }).value;
  const label = describeSpacematrixPosition(fsi, gsi);

  return createIndicatorResult('spacematrixPosition', fsi, 'FSI/GSI coordinate', {
    displayValue: `FSI ${fsi} · GSI ${gsi}`,
    classification: label,
    components: [
      component('fsi', 'Floor Space Index (FSI)', fsi),
      component('gsi', 'Ground Space Index (GSI)', gsi),
    ],
    metadata: { gsi, spacematrixLabel: label },
  });
}

export type BlockDensityProfileInput = SpacematrixPositionInput;

export function blockDensityProfile(input: BlockDensityProfileInput) {
  const base = spacematrixPosition(input);
  const gsi = Number(base.metadata?.gsi ?? 0);
  const profile = profileLetter(base.value, gsi);
  return createIndicatorResult('blockDensityProfile', profile.index, 'profile class [A-F]', {
    displayValue: `${profile.letter} · ${profile.label}`,
    classification: profile.label,
    components: [
      component('fsi', 'FSI', base.value),
      component('gsi', 'GSI', gsi),
    ],
    metadata: { profileLetter: profile.letter },
  });
}

export interface EdgeDensityInput {
  totalEdgeLengthM: number;
  landscapeAreaHa: number;
}

export function edgeDensity(input: EdgeDensityInput) {
  const value = input.landscapeAreaHa > 0 ? round(input.totalEdgeLengthM / input.landscapeAreaHa, 2) : 0;
  return createIndicatorResult('edgeDensity', value, 'm/ha', {
    displayValue: `${value} m/ha`,
  });
}

export interface PatchRichnessInput {
  patchTypeCount: number;
}

export function patchRichness(input: PatchRichnessInput) {
  const value = Math.max(0, Math.round(input.patchTypeCount));
  return createIndicatorResult('patchRichness', value, 'count', {
    displayValue: `${value} patch types`,
  });
}

export interface FractalDimensionInput {
  perimeterM: number;
  areaM2: number;
}

export function fractalDimension(input: FractalDimensionInput) {
  const value = input.areaM2 > 0 && input.perimeterM > 0
    ? round((2 * Math.log(0.25 * input.perimeterM)) / Math.log(input.areaM2), 3)
    : 0;
  return createIndicatorResult('fractalDimension', value, 'dimensionless', {
    displayValue: `${value}`,
  });
}

export interface SkyViewFactorInput {
  visibleSkySolidAngleSr: number;
}

export function skyViewFactor(input: SkyViewFactorInput) {
  const hemisphere = 2 * Math.PI;
  const value = round(clamp(input.visibleSkySolidAngleSr / hemisphere, 0, 1), 3);
  return createIndicatorResult('skyViewFactor', value, 'ratio [0-1]', {
    displayValue: `${value}`,
  });
}

export interface StreetWallContinuityInput {
  continuousFrontageM: number;
  totalFrontageM: number;
}

export function streetWallContinuity(input: StreetWallContinuityInput) {
  const value = round(safeRatio(input.continuousFrontageM, input.totalFrontageM) * 100, 2);
  return createIndicatorResult('streetWallContinuity', value, '%', {
    displayValue: `${value}% continuous frontage`,
  });
}

export interface BuildingHeightVarianceInput {
  meanHeightM: number;
  stdDevHeightM: number;
}

export function buildingHeightVariance(input: BuildingHeightVarianceInput) {
  const value = input.meanHeightM > 0 ? round(input.stdDevHeightM / input.meanHeightM, 3) : 0;
  return createIndicatorResult('buildingHeightVariance', value, 'coefficient of variation', {
    displayValue: `${value}`,
  });
}

export const URBAN_FORM_LANDSCAPE_INDICATORS: IndicatorCatalogDefinition[] = [
  createIndicatorDefinition<SpacematrixPositionInput>({
    kind: 'spacematrixPosition',
    title: 'Spacematrix Position',
    groupId: 'urban_form_landscape',
    summary: 'FSI-GSI coordinate locating the built fabric within the Spacematrix space.',
    methodSummary: 'Gross floor area and footprint coverage are normalised by plot area to produce a two-dimensional Spacematrix coordinate.',
    formula: 'Spacematrix coordinate = (FSI, GSI)',
    unit: 'FSI/GSI coordinate',
    inputFields: [
      { key: 'grossFloorAreaM2', label: 'Gross Floor Area', description: 'Total gross built floor area represented by the block or parcel set.', unit: 'm²', min: 0, step: 1, defaultValue: 46200 },
      { key: 'plotAreaM2', label: 'Plot Area', description: 'Total plot or block area.', unit: 'm²', min: 1, step: 1, defaultValue: 18400 },
      { key: 'footprintAreaM2', label: 'Footprint Area', description: 'Ground-level building coverage.', unit: 'm²', min: 0, step: 1, defaultValue: 7200 },
    ],
    outputFields: [
      { key: 'value', label: 'FSI', description: 'Floor Space Index component of the Spacematrix coordinate.' },
      { key: 'components', label: 'FSI and GSI', description: 'Both axes of the Spacematrix coordinate are preserved.' },
    ],
    classification: [
      { label: 'Open low-rise fabric', description: 'Low intensity with limited ground coverage.', max: 0.5 },
      { label: 'Suburban low-rise fabric', description: 'Low to moderate intensity with moderate coverage.', min: 0.5, max: 1.5 },
      { label: 'Compact mid-rise fabric', description: 'Moderate to high intensity with meaningful ground coverage.', min: 1.5, max: 3 },
      { label: 'Intense urban block fabric', description: 'Strong density and compactness within the urban block.', min: 3, max: 5 },
      { label: 'High-intensity core fabric', description: 'Very high built intensity associated with core urban locations.', min: 5 },
    ],
    interpretationGuidance: [
      'Do not read FSI without GSI; the same intensity can have very different ground occupation patterns.',
      'Spacematrix coordinates are best interpreted comparatively across neighbourhoods or scenarios.',
    ],
    methodologicalReference: 'Berghauser Pont, M. & Haupt, P. (2010). Spacematrix.',
    sectionId: 'urban_indicators',
    tags: ['density', 'morphology', 'built_form', 'indicators'],
    relatedFlowIds: ['urban_morphology', 'voxcity_3d', 'scenario_comparison'],
    education: {
      pathId: 'urban_morphology_form',
      explainerId: 'spacematrix_density',
      note: 'Spacematrix position is a foundational teaching device for discussing density as form rather than a single number.',
    },
    dashboardBindingKind: 'series',
    compute: spacematrixPosition,
  }),
  createIndicatorDefinition<BlockDensityProfileInput>({
    kind: 'blockDensityProfile',
    title: 'Block Density Profile',
    groupId: 'urban_form_landscape',
    summary: 'A-F typological profile derived from the Spacematrix coordinate.',
    methodSummary: 'FSI and GSI are translated into a compact six-class block-density typology for comparative urban-form interpretation.',
    formula: 'Profile = typology(FSI × GSI)',
    unit: 'profile class [A-F]',
    inputFields: [
      { key: 'grossFloorAreaM2', label: 'Gross Floor Area', description: 'Total gross built floor area represented by the block or parcel set.', unit: 'm²', min: 0, step: 1, defaultValue: 46200 },
      { key: 'plotAreaM2', label: 'Plot Area', description: 'Total plot or block area.', unit: 'm²', min: 1, step: 1, defaultValue: 18400 },
      { key: 'footprintAreaM2', label: 'Footprint Area', description: 'Ground-level building coverage.', unit: 'm²', min: 0, step: 1, defaultValue: 7200 },
    ],
    outputFields: [
      { key: 'value', label: 'Profile Index', description: 'Ordinal numeric encoding of the A-F density profile.' },
      { key: 'displayValue', label: 'Profile Label', description: 'Letter code and typological label.' },
    ],
    classification: [
      { label: 'Sparse fringe', description: 'Very low intensity and limited coverage.', max: 1.5 },
      { label: 'Detached suburban', description: 'Low-rise fabric with dispersed block structure.', min: 1.5, max: 2.5 },
      { label: 'Perimeter or row-house fabric', description: 'Intermediate compactness with moderate built intensity.', min: 2.5, max: 3.5 },
      { label: 'Compact mid-rise fabric', description: 'Higher intensity compact blocks.', min: 3.5, max: 4.5 },
      { label: 'Dense mixed-use core', description: 'Strong centrality and mixed-use intensity.', min: 4.5, max: 5.5 },
      { label: 'Hyper-dense core', description: 'Very high intensity core fabric.', min: 5.5 },
    ],
    interpretationGuidance: [
      'This typology is descriptive and should not be read as a universal quality ranking.',
      'Use it to compare spatial form families across study areas or scenario outputs.',
    ],
    methodologicalReference: 'Meta Berghauser Pont et al. (2019) built-form typology practice.',
    sectionId: 'urban_indicators',
    tags: ['density', 'morphology', 'built_form', 'indicators'],
    relatedFlowIds: ['urban_morphology', 'voxcity_3d', 'scenario_comparison'],
    education: {
      pathId: 'urban_morphology_form',
      explainerId: 'spacematrix_density',
      note: 'Density profiles help students translate raw ratios into interpretable urban-form families.',
    },
    dashboardBindingKind: 'text',
    compute: blockDensityProfile,
  }),
  createIndicatorDefinition<EdgeDensityInput>({
    kind: 'edgeDensity',
    title: 'Edge Density',
    groupId: 'urban_form_landscape',
    summary: 'Length of patch edges normalised by landscape area.',
    methodSummary: 'All landscape edges are summed and divided by total landscape area in hectares to describe patch fragmentation and fine-grain texture.',
    formula: 'ED = total edge length / landscape area',
    unit: 'm/ha',
    inputFields: [
      { key: 'totalEdgeLengthM', label: 'Total Edge Length', description: 'All patch-edge lengths in the study landscape.', unit: 'm', min: 0, step: 1, defaultValue: 6840 },
      { key: 'landscapeAreaHa', label: 'Landscape Area', description: 'Total landscape area in hectares.', unit: 'ha', min: 0.1, step: 0.1, defaultValue: 48 },
    ],
    outputFields: [{ key: 'value', label: 'Edge Density', description: 'Landscape edge length per hectare.', unit: 'm/ha' }],
    classification: [
      { label: 'Coarse landscape structure', description: 'Patches are large and edges are relatively sparse.', max: 50 },
      { label: 'Moderate edge structure', description: 'Landscape grain is mixed with intermediate fragmentation.', min: 50, max: 100 },
      { label: 'Fine-grained landscape', description: 'Patch interfaces are frequent and spatial grain is finer.', min: 100, max: 200 },
      { label: 'Highly fragmented landscape', description: 'Patch interfaces are dense and the landscape is strongly segmented.', min: 200 },
    ],
    interpretationGuidance: [
      'Edge density should be interpreted alongside patch richness and land-cover meaning, not as a standalone quality metric.',
      'Higher edge density can be ecologically positive or negative depending on habitat sensitivity.',
    ],
    methodologicalReference: 'McGarigal, K. et al. (2012). FRAGSTATS.',
    sectionId: 'urban_indicators',
    tags: ['green_infra', 'land_use', 'remote_sensing', 'indicators'],
    relatedFlowIds: ['site_suitability', 'change_detection', 'scenario_comparison'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'ndvi',
      note: 'Edge density helps discuss ecological fragmentation and land-cover transitions in studio diagnostics.',
    },
    dashboardBindingKind: 'metric',
    compute: edgeDensity,
  }),
  createIndicatorDefinition<PatchRichnessInput>({
    kind: 'patchRichness',
    title: 'Patch Richness',
    groupId: 'urban_form_landscape',
    summary: 'Count of distinct landscape patch or land-cover types.',
    methodSummary: 'Distinct patch classes are counted to describe compositional heterogeneity in the analysed landscape.',
    formula: 'Patch richness = count of distinct patch types',
    unit: 'count',
    inputFields: [
      { key: 'patchTypeCount', label: 'Patch Types', description: 'Distinct patch or land-cover classes represented in the landscape.', unit: 'count', min: 0, step: 1, defaultValue: 7 },
    ],
    outputFields: [{ key: 'value', label: 'Distinct Patch Types', description: 'Number of landscape patch types.', unit: 'count' }],
    classification: [
      { label: 'Low compositional richness', description: 'The landscape contains only a few distinct patch classes.', max: 3 },
      { label: 'Moderate compositional richness', description: 'The landscape shows a moderate range of patch classes.', min: 3, max: 6 },
      { label: 'High compositional richness', description: 'The landscape contains a wide range of patch types.', min: 6, max: 10 },
      { label: 'Very high compositional richness', description: 'The landscape is highly diverse in patch composition.', min: 10 },
    ],
    interpretationGuidance: [
      'Patch richness says nothing about abundance or evenness; pair it with edge density or diversity metrics.',
      'Richer landscapes are not always ecologically healthier if patch classes represent fragmentation or disturbance.',
    ],
    methodologicalReference: 'McGarigal, K. et al. (2012). FRAGSTATS patch-richness metric.',
    sectionId: 'urban_indicators',
    tags: ['green_infra', 'land_use', 'remote_sensing', 'indicators'],
    relatedFlowIds: ['change_detection', 'site_suitability'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'ndvi',
      note: 'Patch richness is best used as part of a wider landscape-ecology interpretation set.',
    },
    dashboardBindingKind: 'metric',
    compute: patchRichness,
  }),
  createIndicatorDefinition<FractalDimensionInput>({
    kind: 'fractalDimension',
    title: 'Fractal Dimension',
    groupId: 'urban_form_landscape',
    summary: 'Area-perimeter fractal dimension indicating plan-form complexity.',
    methodSummary: 'Perimeter and area are combined into an area-perimeter fractal estimate, capturing how irregular or articulated a form is.',
    formula: 'D = 2 ln(0.25P) / ln(A)',
    unit: 'dimensionless',
    inputFields: [
      { key: 'perimeterM', label: 'Perimeter', description: 'Perimeter of the analysed patch or block.', unit: 'm', min: 0.1, step: 0.1, defaultValue: 1280 },
      { key: 'areaM2', label: 'Area', description: 'Area of the analysed patch or block.', unit: 'm²', min: 1, step: 1, defaultValue: 56200 },
    ],
    outputFields: [{ key: 'value', label: 'Fractal Dimension', description: 'Area-perimeter complexity estimate.' }],
    classification: [
      { label: 'Simple form', description: 'The analysed form is comparatively regular and compact.', max: 1.1 },
      { label: 'Moderately articulated form', description: 'The form contains some geometric irregularity.', min: 1.1, max: 1.3 },
      { label: 'Complex form', description: 'Perimeter complexity is high relative to area.', min: 1.3, max: 1.5 },
      { label: 'Highly irregular form', description: 'The analysed geometry is strongly articulated or fragmented.', min: 1.5 },
    ],
    interpretationGuidance: [
      'Use with caution for very small polygons where digitising error can dominate the estimate.',
      'Fractal dimension is best suited to comparative morphology, not normative scoring.',
    ],
    methodologicalReference: 'Batty, M. & Longley, P. (1994). Fractal Cities.',
    sectionId: 'urban_indicators',
    tags: ['morphology', 'built_form', 'indicators'],
    relatedFlowIds: ['urban_morphology', 'voxcity_3d'],
    education: {
      pathId: 'urban_morphology_form',
      explainerId: 'building_extrusion',
      note: 'Fractal dimension helps compare regular blocks with irregular or highly articulated urban fabrics.',
    },
    dashboardBindingKind: 'metric',
    compute: fractalDimension,
  }),
  createIndicatorDefinition<SkyViewFactorInput>({
    kind: 'skyViewFactor',
    title: 'Sky View Factor',
    groupId: 'urban_form_landscape',
    summary: 'Visible sky share derived from the hemisphere solid angle.',
    methodSummary: 'The visible sky solid angle is normalised by the full hemisphere to quantify canyon openness.',
    formula: 'SVF = visible sky solid angle / (2π)',
    unit: 'ratio [0-1]',
    inputFields: [
      { key: 'visibleSkySolidAngleSr', label: 'Visible Sky Solid Angle', description: 'Visible portion of the hemisphere expressed in steradians.', unit: 'sr', min: 0, max: 6.283185307179586, step: 0.01, defaultValue: 2.74 },
    ],
    outputFields: [{ key: 'value', label: 'Sky View Factor', description: 'Visible sky ratio on a 0–1 scale.', unit: 'ratio [0-1]' }],
    classification: [
      { label: 'Canyon condition', description: 'Street or courtyard enclosure strongly limits visible sky.', max: 0.3 },
      { label: 'Enclosed condition', description: 'Visible sky remains limited by built form.', min: 0.3, max: 0.5 },
      { label: 'Balanced openness', description: 'Visible sky and enclosure are both meaningful in the urban section.', min: 0.5, max: 0.7 },
      { label: 'Open condition', description: 'The analysed space is relatively open to the sky hemisphere.', min: 0.7 },
    ],
    interpretationGuidance: [
      'SVF is strongly related to thermal comfort, radiative exchange, and urban-canyon behaviour.',
      'Interpret together with street orientation and material albedo rather than as a standalone climate score.',
    ],
    methodologicalReference: 'Oke, T. R. et al. (2017). Urban climate and sky-view factor practice.',
    sectionId: 'urban_indicators',
    tags: ['climate', 'morphology', 'solar', 'indicators'],
    relatedFlowIds: ['sunlight_sim', 'voxcity_3d', 'vulnerability'],
    education: {
      pathId: 'urban_modelling_3d',
      explainerId: 'sunlight_exposure',
      note: 'Sky view factor helps connect built form to daylight and thermal-exposure teaching scenarios.',
    },
    dashboardBindingKind: 'metric',
    compute: skyViewFactor,
  }),
  createIndicatorDefinition<StreetWallContinuityInput>({
    kind: 'streetWallContinuity',
    title: 'Street Wall Continuity',
    groupId: 'urban_form_landscape',
    summary: 'Share of street frontage maintained by a continuous facade line close to the lot edge.',
    methodSummary: 'Continuous facade frontage is divided by total frontage to indicate how strongly the street wall is spatially defined.',
    formula: 'Continuity = continuous frontage / total frontage × 100',
    unit: '%',
    inputFields: [
      { key: 'continuousFrontageM', label: 'Continuous Frontage', description: 'Facade length remaining within the street-wall threshold.', unit: 'm', min: 0, step: 0.1, defaultValue: 620 },
      { key: 'totalFrontageM', label: 'Total Frontage', description: 'Total analysed frontage length.', unit: 'm', min: 0.1, step: 0.1, defaultValue: 910 },
    ],
    outputFields: [{ key: 'value', label: 'Street Wall Continuity', description: 'Share of frontage with a continuous facade line.', unit: '%' }],
    classification: [
      { label: 'Fragmented frontage', description: 'Street edges are discontinuous and spatial definition is weak.', max: 40 },
      { label: 'Partial continuity', description: 'Some street-wall structure exists but interruptions remain prominent.', min: 40, max: 60 },
      { label: 'Continuous frontage', description: 'The street edge is legible and coherent across most of the analysed frontage.', min: 60, max: 80 },
      { label: 'Strong urban edge', description: 'A highly continuous street wall defines the public realm.', min: 80 },
    ],
    interpretationGuidance: [
      'Continuity should be paired with ground-floor use and pedestrian comfort rather than read as a universal design ideal.',
      'A high value can still produce poor public-realm quality if facades are blank or inaccessible.',
    ],
    methodologicalReference: 'Gehl, J. (2010). Cities for People.',
    sectionId: 'urban_indicators',
    tags: ['built_form', 'morphology', 'pedestrian', 'indicators'],
    relatedFlowIds: ['urban_morphology', 'voxcity_3d', 'accessibility'],
    education: {
      pathId: 'urban_morphology_form',
      explainerId: 'spacematrix_density',
      note: 'Street-wall continuity is useful when linking built form to walkability and public-space quality.',
    },
    dashboardBindingKind: 'metric',
    compute: streetWallContinuity,
  }),
  createIndicatorDefinition<BuildingHeightVarianceInput>({
    kind: 'buildingHeightVariance',
    title: 'Building Height Variance',
    groupId: 'urban_form_landscape',
    summary: 'Coefficient of variation of building heights.',
    methodSummary: 'Height standard deviation is normalised by mean height to express relative vertical variation in the built fabric.',
    formula: 'CV = standard deviation of height / mean height',
    unit: 'coefficient of variation',
    inputFields: [
      { key: 'meanHeightM', label: 'Mean Height', description: 'Average building height across the analysed sample.', unit: 'm', min: 0.1, step: 0.1, defaultValue: 17.8 },
      { key: 'stdDevHeightM', label: 'Height Standard Deviation', description: 'Standard deviation of building heights.', unit: 'm', min: 0, step: 0.1, defaultValue: 6.2 },
    ],
    outputFields: [{ key: 'value', label: 'Height Variation CV', description: 'Relative height variation across the building stock.' }],
    classification: [
      { label: 'Uniform skyline', description: 'Building heights are relatively consistent.', max: 0.15 },
      { label: 'Moderately varied skyline', description: 'Vertical diversity is present but not dominant.', min: 0.15, max: 0.35 },
      { label: 'Varied skyline', description: 'Vertical differentiation is substantial across the study area.', min: 0.35, max: 0.6 },
      { label: 'Highly varied skyline', description: 'The built fabric shows strong vertical heterogeneity.', min: 0.6 },
    ],
    interpretationGuidance: [
      'Height variance is descriptive; a more varied skyline is not inherently better or worse.',
      'Pair with street width, SVF, or shadow analysis for performance-based interpretation.',
    ],
    methodologicalReference: 'Yoshida, H. & Omae, M. (2005). Skyline variation and urban-form metrics.',
    sectionId: 'urban_indicators',
    tags: ['morphology', 'built_form', '3d_modeling', 'indicators'],
    relatedFlowIds: ['voxcity_3d', 'sunlight_sim', 'urban_morphology'],
    education: {
      pathId: 'urban_modelling_3d',
      explainerId: 'building_extrusion',
      note: 'Height variance helps interpret skyline diversity and daylight trade-offs in three-dimensional urban form.',
    },
    dashboardBindingKind: 'metric',
    compute: buildingHeightVariance,
  }),
];