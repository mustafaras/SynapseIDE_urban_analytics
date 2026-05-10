import { clamp, buildIndicatorQA, component, createIndicatorDefinition, createIndicatorResult, round, safeRatio, sum, wrapWithQA } from '../indicators/shared';
import type { IndicatorCatalogDefinition } from '../indicators/types';

export interface BuildingEnergyIntensityInput {
  annualEnergyKWh: number;
  floorAreaM2: number;
}

export function buildingEnergyIntensity(input: BuildingEnergyIntensityInput) {
  const value = input.floorAreaM2 > 0 ? round(input.annualEnergyKWh / input.floorAreaM2, 2) : 0;
  const qa = buildIndicatorQA('buildingEnergyIntensity', {
    inputs: { annualEnergyKWh: input.annualEnergyKWh, floorAreaM2: input.floorAreaM2 },
    requiredPositive: ['floorAreaM2'],
  });
  return wrapWithQA(
    createIndicatorResult('buildingEnergyIntensity', value, 'kWh/m²/yr', {
      displayValue: `${value} kWh/m²/yr`,
    }),
    qa,
  );
}

export interface RenewableEnergyShareInput {
  renewableEnergyKWh: number;
  totalEnergyKWh: number;
}

export function renewableEnergyShare(input: RenewableEnergyShareInput) {
  const value = round(safeRatio(input.renewableEnergyKWh, input.totalEnergyKWh) * 100, 2);
  return createIndicatorResult('renewableEnergyShare', value, '%', {
    displayValue: `${value}% renewable`,
  });
}

export interface CarbonFootprintPerCapitaInput {
  buildingEmissionsTCO2e: number;
  transportEmissionsTCO2e: number;
  wasteEmissionsTCO2e: number;
  population: number;
}

export function carbonFootprintPerCapita(input: CarbonFootprintPerCapitaInput) {
  const totalEmissions = sum([
    input.buildingEmissionsTCO2e,
    input.transportEmissionsTCO2e,
    input.wasteEmissionsTCO2e,
  ]);
  const value = input.population > 0 ? round(totalEmissions / input.population, 3) : 0;
  const qa = buildIndicatorQA('carbonFootprintPerCapita', {
    inputs: {
      buildingEmissionsTCO2e: input.buildingEmissionsTCO2e,
      transportEmissionsTCO2e: input.transportEmissionsTCO2e,
      wasteEmissionsTCO2e: input.wasteEmissionsTCO2e,
      population: input.population,
    },
    requiredPositive: ['population'],
  });
  return wrapWithQA(
    createIndicatorResult('carbonFootprintPerCapita', value, 'tCO₂e/cap/yr', {
      displayValue: `${value} tCO₂e/cap/yr`,
      components: [
        component('building', 'Building emissions', round(input.buildingEmissionsTCO2e, 2), 'tCO₂e/yr'),
        component('transport', 'Transport emissions', round(input.transportEmissionsTCO2e, 2), 'tCO₂e/yr'),
        component('waste', 'Waste emissions', round(input.wasteEmissionsTCO2e, 2), 'tCO₂e/yr'),
      ],
    }),
    qa,
  );
}

export interface UrbanAlbedoInput {
  reflectedShortwave: number;
  incomingShortwave: number;
}

export function urbanAlbedo(input: UrbanAlbedoInput) {
  const value = round(clamp(safeRatio(input.reflectedShortwave, input.incomingShortwave), 0, 1), 3);
  return createIndicatorResult('urbanAlbedo', value, 'ratio [0-1]', {
    displayValue: `${value}`,
  });
}

export interface CoolingDegreeDaysInput {
  meanWarmSeasonTempC: number;
  baseTempC: number;
  warmSeasonDays: number;
}

export function coolingDegreeDays(input: CoolingDegreeDaysInput) {
  const excess = Math.max(input.meanWarmSeasonTempC - input.baseTempC, 0);
  const value = round(excess * input.warmSeasonDays, 1);
  return createIndicatorResult('coolingDegreeDays', value, 'degree-days', {
    displayValue: `${value} degree-days`,
    metadata: { excessTempC: round(excess, 2) },
  });
}

export interface EvapotranspirationInput {
  netRadiationMJm2Day: number;
  soilHeatFluxMJm2Day: number;
  meanTemperatureC: number;
  windSpeed2m: number;
  saturationVapourPressureKPa: number;
  actualVapourPressureKPa: number;
  slopeVapourPressureCurve: number;
  psychrometricConstant: number;
}

export function evapotranspiration(input: EvapotranspirationInput) {
  const numerator =
    0.408 * input.slopeVapourPressureCurve * (input.netRadiationMJm2Day - input.soilHeatFluxMJm2Day) +
    input.psychrometricConstant * (900 / (input.meanTemperatureC + 273)) * input.windSpeed2m * (input.saturationVapourPressureKPa - input.actualVapourPressureKPa);
  const denominator =
    input.slopeVapourPressureCurve + input.psychrometricConstant * (1 + 0.34 * input.windSpeed2m);
  const value = denominator > 0 ? round(Math.max(numerator / denominator, 0), 2) : 0;
  return createIndicatorResult('evapotranspiration', value, 'mm/day', {
    displayValue: `${value} mm/day`,
  });
}

export interface EmbodiedCarbonInput {
  structuralMassKg: number;
  structuralFactor: number;
  envelopeMassKg: number;
  envelopeFactor: number;
  interiorMassKg: number;
  interiorFactor: number;
  floorAreaM2: number;
}

export function embodiedCarbon(input: EmbodiedCarbonInput) {
  const structural = input.structuralMassKg * input.structuralFactor;
  const envelope = input.envelopeMassKg * input.envelopeFactor;
  const interior = input.interiorMassKg * input.interiorFactor;
  const total = structural + envelope + interior;
  const value = input.floorAreaM2 > 0 ? round(total / input.floorAreaM2, 2) : 0;
  return createIndicatorResult('embodiedCarbon', value, 'kgCO₂e/m²', {
    displayValue: `${value} kgCO₂e/m²`,
    components: [
      component('structural', 'Structural carbon', round(structural, 2), 'kgCO₂e'),
      component('envelope', 'Envelope carbon', round(envelope, 2), 'kgCO₂e'),
      component('interior', 'Interior carbon', round(interior, 2), 'kgCO₂e'),
    ],
    metadata: { totalEmbodiedCarbonKgCO2e: round(total, 2) },
  });
}

export const ENERGY_CLIMATE_INDICATORS: IndicatorCatalogDefinition[] = [
  createIndicatorDefinition<BuildingEnergyIntensityInput>({
    kind: 'buildingEnergyIntensity',
    title: 'Building Energy Intensity',
    groupId: 'energy_climate',
    summary: 'Annual operational energy use normalised by floor area.',
    methodSummary: 'Annual building energy demand is divided by gross floor area to benchmark operational efficiency across assets or districts.',
    formula: 'EUI = annual energy / floor area',
    unit: 'kWh/m²/yr',
    inputFields: [
      { key: 'annualEnergyKWh', label: 'Annual Energy Use', description: 'Metered or modelled annual operational energy.', unit: 'kWh/yr', min: 0, step: 100, defaultValue: 1880000 },
      { key: 'floorAreaM2', label: 'Floor Area', description: 'Gross internal floor area represented by the energy total.', unit: 'm²', min: 1, step: 1, defaultValue: 12800 },
    ],
    outputFields: [
      { key: 'value', label: 'Energy Use Intensity', description: 'Annual operational energy use per floor area.', unit: 'kWh/m²/yr' },
    ],
    classification: [
      { label: 'High-performance stock', description: 'Operational demand is low for the represented floor area.', max: 50 },
      { label: 'Efficient stock', description: 'Energy intensity is comparatively restrained.', min: 50, max: 100 },
      { label: 'Typical stock', description: 'Energy demand aligns with mainstream mixed-use or institutional assets.', min: 100, max: 200 },
      { label: 'Energy-intensive stock', description: 'Operational energy demand is high and should be targeted for retrofit.', min: 200 },
    ],
    interpretationGuidance: [
      'Benchmark within building type and climate zone before drawing performance conclusions.',
      'Operational intensity should be paired with embodied carbon when assessing lifecycle performance.',
    ],
    methodologicalReference: 'ASHRAE 90.1 energy-use intensity benchmarking practice.',
    sectionId: 'urban_indicators',
    tags: ['energy', 'climate', 'indicators', 'policy'],
    relatedFlowIds: ['system_dynamics', 'scenario_comparison', 'sunlight_sim'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'scenario_tradeoffs',
      note: 'Energy intensity helps compare retrofit, infill, and cooling strategies in climate-oriented studios.',
    },
    dashboardBindingKind: 'metric',
    compute: buildingEnergyIntensity,
  }),
  createIndicatorDefinition<RenewableEnergyShareInput>({
    kind: 'renewableEnergyShare',
    title: 'Renewable Energy Share',
    groupId: 'energy_climate',
    summary: 'Proportion of delivered operational energy sourced from renewable systems.',
    methodSummary: 'Renewable energy supply is divided by total delivered energy to express decarbonisation progress in operational terms.',
    formula: 'Renewable share = renewable energy / total energy × 100',
    unit: '%',
    inputFields: [
      { key: 'renewableEnergyKWh', label: 'Renewable Energy', description: 'Annual renewable electricity or thermal supply.', unit: 'kWh/yr', min: 0, step: 100, defaultValue: 540000 },
      { key: 'totalEnergyKWh', label: 'Total Energy', description: 'Total annual delivered energy.', unit: 'kWh/yr', min: 1, step: 100, defaultValue: 1880000 },
    ],
    outputFields: [
      { key: 'value', label: 'Renewable Share', description: 'Share of annual operational energy supplied by renewable sources.', unit: '%' },
    ],
    classification: [
      { label: 'Low renewable penetration', description: 'Renewable systems contribute only a small portion of annual demand.', max: 15 },
      { label: 'Emerging transition', description: 'Renewables are present but remain a minority share of the supply mix.', min: 15, max: 35 },
      { label: 'Strong transition', description: 'Renewables supply a substantial share of annual energy demand.', min: 35, max: 60 },
      { label: 'Majority-renewable system', description: 'Renewables have become the leading energy source.', min: 60 },
    ],
    interpretationGuidance: [
      'Share should be read with absolute demand; a high renewable share does not automatically imply low total energy use.',
      'Disclose whether on-site, district, or grid-purchased renewables are combined.',
    ],
    methodologicalReference: 'IRENA (2023). Renewable energy statistics and monitoring practice.',
    sectionId: 'urban_indicators',
    tags: ['energy', 'climate', 'carbon', 'indicators'],
    relatedFlowIds: ['system_dynamics', 'scenario_comparison'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'scenario_tradeoffs',
      note: 'Renewable share is useful when comparing district energy scenarios or retrofit packages.',
    },
    dashboardBindingKind: 'metric',
    compute: renewableEnergyShare,
  }),
  createIndicatorDefinition<CarbonFootprintPerCapitaInput>({
    kind: 'carbonFootprintPerCapita',
    title: 'Carbon Footprint Per Capita',
    groupId: 'energy_climate',
    summary: 'Per-resident greenhouse-gas burden aggregated across building, transport, and waste sectors.',
    methodSummary: 'Sector emissions are summed and normalised by resident population to create a per-capita emissions benchmark.',
    formula: 'tCO₂e/cap = Σ sector emissions / population',
    unit: 'tCO₂e/cap/yr',
    inputFields: [
      { key: 'buildingEmissionsTCO2e', label: 'Building Emissions', description: 'Annual operational building emissions.', unit: 'tCO₂e/yr', min: 0, step: 1, defaultValue: 62400 },
      { key: 'transportEmissionsTCO2e', label: 'Transport Emissions', description: 'Annual transport-related emissions.', unit: 'tCO₂e/yr', min: 0, step: 1, defaultValue: 45200 },
      { key: 'wasteEmissionsTCO2e', label: 'Waste Emissions', description: 'Annual waste-sector emissions.', unit: 'tCO₂e/yr', min: 0, step: 1, defaultValue: 8200 },
      { key: 'population', label: 'Population', description: 'Resident population associated with the emissions inventory.', unit: 'people', min: 1, step: 1, defaultValue: 28400 },
    ],
    outputFields: [
      { key: 'value', label: 'Per-capita Emissions', description: 'Annual greenhouse-gas emissions per resident.', unit: 'tCO₂e/cap/yr' },
      { key: 'components', label: 'Sector Contributions', description: 'Buildings, transport, and waste contributions to the total footprint.' },
    ],
    classification: [
      { label: 'Low carbon profile', description: 'Per-capita emissions are comparatively restrained.', max: 2 },
      { label: 'Moderate carbon profile', description: 'Per-capita emissions remain material but not extreme.', min: 2, max: 5 },
      { label: 'High carbon profile', description: 'Per-capita emissions warrant demand management or fuel switching.', min: 5, max: 8 },
      { label: 'Very high carbon profile', description: 'Per-capita greenhouse-gas burden is strongly carbon-intensive.', min: 8 },
    ],
    interpretationGuidance: [
      'Per-capita values should be paired with total emissions so large and small places are not confused.',
      'Sector breakdown matters for policy relevance; the same total can imply very different intervention pathways.',
    ],
    methodologicalReference: 'WRI GHG Protocol community-scale inventory practice.',
    sectionId: 'urban_indicators',
    tags: ['climate', 'carbon', 'energy', 'indicators'],
    relatedFlowIds: ['vulnerability', 'system_dynamics', 'scenario_comparison'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'system_dynamics',
      note: 'Per-capita emissions are useful when comparing sector-led mitigation strategies and rebound effects.',
    },
    dashboardBindingKind: 'series',
    compute: carbonFootprintPerCapita,
  }),
  createIndicatorDefinition<UrbanAlbedoInput>({
    kind: 'urbanAlbedo',
    title: 'Urban Albedo',
    groupId: 'energy_climate',
    summary: 'Surface reflectivity expressed as reflected shortwave radiation divided by incoming shortwave radiation.',
    methodSummary: 'Broadband shortwave reflectance is summarised as a 0–1 albedo ratio useful for screening heat-mitigation strategies.',
    formula: 'Albedo = reflected shortwave / incoming shortwave',
    unit: 'ratio [0-1]',
    inputFields: [
      { key: 'reflectedShortwave', label: 'Reflected Shortwave', description: 'Reflected shortwave energy at the surface.', unit: 'W/m²', min: 0, step: 1, defaultValue: 172 },
      { key: 'incomingShortwave', label: 'Incoming Shortwave', description: 'Incoming shortwave energy over the same surface.', unit: 'W/m²', min: 1, step: 1, defaultValue: 820 },
    ],
    outputFields: [
      { key: 'value', label: 'Albedo', description: 'Surface reflectivity expressed on a 0–1 scale.', unit: 'ratio [0-1]' },
    ],
    classification: [
      { label: 'Absorptive surface profile', description: 'Surface fabric absorbs much of the incoming shortwave radiation.', max: 0.15 },
      { label: 'Conventional urban profile', description: 'Reflectivity resembles typical urban roofing and paving.', min: 0.15, max: 0.25 },
      { label: 'Cool surface profile', description: 'Reflectivity is elevated enough to reduce absorbed heat load.', min: 0.25, max: 0.35 },
      { label: 'Highly reflective profile', description: 'Reflectivity is very high and may materially shift surface-temperature response.', min: 0.35 },
    ],
    interpretationGuidance: [
      'Albedo should be assessed with glare, thermal comfort, and canyon geometry rather than in isolation.',
      'Remote-sensing albedo represents surface behaviour, not necessarily pedestrian thermal experience.',
    ],
    methodologicalReference: 'Akbari, H. et al. (2009). Cool surfaces and albedo in urban heat mitigation.',
    sectionId: 'urban_indicators',
    tags: ['climate', 'heat_island', 'remote_sensing', 'indicators'],
    relatedFlowIds: ['sunlight_sim', 'vulnerability', 'scenario_comparison'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'ndvi',
      note: 'Urban albedo is a useful complement to greenness and heat-island diagnostics.',
    },
    dashboardBindingKind: 'metric',
    compute: urbanAlbedo,
  }),
  createIndicatorDefinition<CoolingDegreeDaysInput>({
    kind: 'coolingDegreeDays',
    title: 'Cooling Degree Days',
    groupId: 'energy_climate',
    summary: 'Approximate cumulative cooling demand over a warm season.',
    methodSummary: 'Mean warm-season temperature above a chosen base is multiplied by the number of warm-season days to produce an approximate cooling-load indicator.',
    formula: 'CDD = Σ max(Tmean - Tbase, 0)',
    unit: 'degree-days',
    inputFields: [
      { key: 'meanWarmSeasonTempC', label: 'Mean Warm-season Temperature', description: 'Average daily mean temperature across the warm season.', unit: '°C', min: -20, max: 60, step: 0.1, defaultValue: 27.4 },
      { key: 'baseTempC', label: 'Base Temperature', description: 'Cooling-demand threshold temperature.', unit: '°C', min: 0, max: 40, step: 0.1, defaultValue: 18 },
      { key: 'warmSeasonDays', label: 'Warm-season Days', description: 'Number of days represented by the averaging period.', unit: 'days', min: 1, step: 1, defaultValue: 153 },
    ],
    outputFields: [
      { key: 'value', label: 'Cooling Degree Days', description: 'Approximate cumulative cooling load over the warm season.', unit: 'degree-days' },
    ],
    classification: [
      { label: 'Low cooling burden', description: 'Seasonal cooling load is comparatively limited.', max: 200 },
      { label: 'Moderate cooling burden', description: 'Cooling is significant but not extreme.', min: 200, max: 500 },
      { label: 'High cooling burden', description: 'Cooling demand is substantial and can stress vulnerable households or infrastructure.', min: 500, max: 1000 },
      { label: 'Severe cooling burden', description: 'Warm-season heat stress is pronounced over the analysed period.', min: 1000 },
    ],
    interpretationGuidance: [
      'CDD is sensitive to the selected base temperature and should be reported with that assumption.',
      'The simplified seasonal formulation is best suited to screening and comparative analysis, not detailed mechanical design.',
    ],
    methodologicalReference: 'ASHRAE cooling degree-day practice.',
    sectionId: 'urban_indicators',
    tags: ['climate', 'energy', 'heat_island', 'indicators'],
    relatedFlowIds: ['vulnerability', 'system_dynamics', 'scenario_comparison'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'scenario_tradeoffs',
      note: 'Cooling degree days help communicate seasonal heat burden in adaptation and retrofit discussions.',
    },
    dashboardBindingKind: 'metric',
    compute: coolingDegreeDays,
  }),
  createIndicatorDefinition<EvapotranspirationInput>({
    kind: 'evapotranspiration',
    title: 'Reference Evapotranspiration',
    groupId: 'energy_climate',
    summary: 'Reference evapotranspiration calculated using the FAO-56 Penman-Monteith method.',
    methodSummary: 'Combines radiation, aerodynamic forcing, vapour-pressure deficit, and psychrometric terms to estimate reference evapotranspiration.',
    formula: 'ET₀ = [0.408Δ(Rn-G) + γ(900/(T+273))u₂(es-ea)] / [Δ + γ(1 + 0.34u₂)]',
    unit: 'mm/day',
    inputFields: [
      { key: 'netRadiationMJm2Day', label: 'Net Radiation', description: 'Net radiation at crop or surface level.', unit: 'MJ/m²/day', min: -10, max: 40, step: 0.1, defaultValue: 14.2 },
      { key: 'soilHeatFluxMJm2Day', label: 'Soil Heat Flux', description: 'Soil heat flux for the same timestep.', unit: 'MJ/m²/day', min: -10, max: 10, step: 0.1, defaultValue: 0.2 },
      { key: 'meanTemperatureC', label: 'Mean Temperature', description: 'Mean daily air temperature.', unit: '°C', min: -20, max: 60, step: 0.1, defaultValue: 26.1 },
      { key: 'windSpeed2m', label: 'Wind Speed at 2 m', description: 'Wind speed normalised to 2 m height.', unit: 'm/s', min: 0, max: 30, step: 0.1, defaultValue: 2.8 },
      { key: 'saturationVapourPressureKPa', label: 'Saturation Vapour Pressure', description: 'Saturation vapour pressure for the timestep.', unit: 'kPa', min: 0, max: 10, step: 0.01, defaultValue: 3.4 },
      { key: 'actualVapourPressureKPa', label: 'Actual Vapour Pressure', description: 'Observed actual vapour pressure.', unit: 'kPa', min: 0, max: 10, step: 0.01, defaultValue: 2.1 },
      { key: 'slopeVapourPressureCurve', label: 'Slope of Vapour-pressure Curve', description: 'Slope of the saturation vapour-pressure curve at mean temperature.', unit: 'kPa/°C', min: 0, max: 2, step: 0.001, defaultValue: 0.19 },
      { key: 'psychrometricConstant', label: 'Psychrometric Constant', description: 'Psychrometric constant for the site elevation and pressure.', unit: 'kPa/°C', min: 0, max: 1, step: 0.001, defaultValue: 0.066 },
    ],
    outputFields: [
      { key: 'value', label: 'Reference ET₀', description: 'Reference evapotranspiration rate.', unit: 'mm/day' },
    ],
    classification: [
      { label: 'Low evapotranspiration demand', description: 'Atmospheric demand for evapotranspiration is limited.', max: 2 },
      { label: 'Moderate evapotranspiration demand', description: 'Evapotranspiration demand is noticeable but not extreme.', min: 2, max: 4 },
      { label: 'High evapotranspiration demand', description: 'Atmospheric demand is high and can intensify irrigation stress.', min: 4, max: 6 },
      { label: 'Very high evapotranspiration demand', description: 'Strong atmospheric drying power is present during the analysed timestep.', min: 6 },
    ],
    interpretationGuidance: [
      'ET₀ is a reference-climate indicator, not a direct measurement of actual crop water use.',
      'Report input assumptions clearly; vapour pressure and radiation terms strongly shape the result.',
    ],
    methodologicalReference: 'Allen, R. G. et al. (1998). FAO-56 Crop Evapotranspiration.',
    sectionId: 'urban_indicators',
    tags: ['climate', 'water', 'green_infra', 'indicators'],
    relatedFlowIds: ['vulnerability', 'system_dynamics'],
    education: {
      pathId: 'environmental_resilience',
      explainerId: 'ndvi',
      note: 'ET₀ helps connect urban heat, irrigation demand, and green-infrastructure performance.',
    },
    dashboardBindingKind: 'metric',
    compute: evapotranspiration,
  }),
  createIndicatorDefinition<EmbodiedCarbonInput>({
    kind: 'embodiedCarbon',
    title: 'Embodied Carbon',
    groupId: 'energy_climate',
    summary: 'Material embodied-carbon burden normalised by delivered floor area.',
    methodSummary: 'Mass-by-material is multiplied by emission factors and normalised by floor area to provide a lifecycle-oriented carbon-intensity benchmark.',
    formula: 'Embodied carbon = Σ(massᵢ × EFᵢ) / floor area',
    unit: 'kgCO₂e/m²',
    inputFields: [
      { key: 'structuralMassKg', label: 'Structural Mass', description: 'Mass of structural materials such as concrete or steel.', unit: 'kg', min: 0, step: 1, defaultValue: 4200000 },
      { key: 'structuralFactor', label: 'Structural Emission Factor', description: 'Emission factor for the structural package.', unit: 'kgCO₂e/kg', min: 0, step: 0.01, defaultValue: 0.16 },
      { key: 'envelopeMassKg', label: 'Envelope Mass', description: 'Mass of facade and roof materials.', unit: 'kg', min: 0, step: 1, defaultValue: 860000 },
      { key: 'envelopeFactor', label: 'Envelope Emission Factor', description: 'Emission factor for the envelope package.', unit: 'kgCO₂e/kg', min: 0, step: 0.01, defaultValue: 0.42 },
      { key: 'interiorMassKg', label: 'Interior Mass', description: 'Mass of interior fit-out materials.', unit: 'kg', min: 0, step: 1, defaultValue: 520000 },
      { key: 'interiorFactor', label: 'Interior Emission Factor', description: 'Emission factor for the interior package.', unit: 'kgCO₂e/kg', min: 0, step: 0.01, defaultValue: 0.68 },
      { key: 'floorAreaM2', label: 'Floor Area', description: 'Gross floor area represented by the material inventory.', unit: 'm²', min: 1, step: 1, defaultValue: 12800 },
    ],
    outputFields: [
      { key: 'value', label: 'Embodied Carbon Intensity', description: 'Material carbon burden per floor area.', unit: 'kgCO₂e/m²' },
      { key: 'components', label: 'Material Contributions', description: 'Structural, envelope, and interior embodied-carbon totals.' },
    ],
    classification: [
      { label: 'Low embodied-carbon profile', description: 'Embodied-carbon intensity is comparatively restrained.', max: 300 },
      { label: 'Moderate embodied-carbon profile', description: 'Material carbon burden is material but manageable.', min: 300, max: 500 },
      { label: 'High embodied-carbon profile', description: 'Embodied carbon is significant and should influence material strategy.', min: 500, max: 800 },
      { label: 'Very high embodied-carbon profile', description: 'Material choices create a strongly carbon-intensive construction package.', min: 800 },
    ],
    interpretationGuidance: [
      'Emission factors should come from a clearly documented database or environmental product declaration set.',
      'Embodied and operational carbon should be reviewed together to avoid one-sided optimisation.',
    ],
    methodologicalReference: 'ICE Database v3.0 and embodied-carbon benchmarking practice.',
    sectionId: 'urban_indicators',
    tags: ['carbon', 'energy', 'built_form', 'indicators'],
    relatedFlowIds: ['scenario_comparison', 'system_dynamics', 'voxcity_3d'],
    education: {
      pathId: 'urban_morphology_form',
      explainerId: 'spacematrix_density',
      note: 'Embodied carbon introduces lifecycle trade-offs into built-form and density discussions.',
    },
    dashboardBindingKind: 'series',
    compute: embodiedCarbon,
  }),
];
