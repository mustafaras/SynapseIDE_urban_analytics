import { streetConnectivity } from './morphology';
import { buildIndicatorQA, component, createIndicatorDefinition, createIndicatorResult, round, safeRatio, sum, wrapWithQA } from '../indicators/shared';
import type { IndicatorCatalogDefinition } from '../indicators/types';

export interface VehicleKmTravelledInput {
  arterialAADT: number;
  arterialLengthKm: number;
  collectorAADT: number;
  collectorLengthKm: number;
  localAADT: number;
  localLengthKm: number;
}

export function vehicleKmTravelled(input: VehicleKmTravelledInput) {
  const arterial = input.arterialAADT * input.arterialLengthKm;
  const collector = input.collectorAADT * input.collectorLengthKm;
  const local = input.localAADT * input.localLengthKm;
  const total = round(arterial + collector + local, 2);

  return createIndicatorResult('vehicleKmTravelled', total, 'veh-km/day', {
    displayValue: `${total.toLocaleString('en-US')} veh-km/day`,
    components: [
      component('arterial', 'Arterial VKT', round(arterial, 2), 'veh-km/day'),
      component('collector', 'Collector VKT', round(collector, 2), 'veh-km/day'),
      component('local', 'Local VKT', round(local, 2), 'veh-km/day'),
    ],
    metadata: {
      arterialShare: round(safeRatio(arterial, total) * 100, 1),
      collectorShare: round(safeRatio(collector, total) * 100, 1),
      localShare: round(safeRatio(local, total) * 100, 1),
    },
  });
}

export interface ModeSplitInput {
  walkTrips: number;
  cycleTrips: number;
  transitTrips: number;
  carTrips: number;
}

export function modeSplit(input: ModeSplitInput) {
  const totalTrips = sum([input.walkTrips, input.cycleTrips, input.transitTrips, input.carTrips]);
  if (totalTrips <= 0) {
    const qa = buildIndicatorQA('modeSplit', {
      inputs: { walkTrips: input.walkTrips, cycleTrips: input.cycleTrips, transitTrips: input.transitTrips, carTrips: input.carTrips },
      warnings: ['No observed trips provided; all mode-split shares are zero and the result is not analytically valid. Supply at least one positive trip count.'],
    });
    return wrapWithQA(
      createIndicatorResult('modeSplit', 0, '% sustainable share', {
        displayValue: 'No observed trips',
        classification: 'No sample',
        components: [
          component('walk', 'Walk', 0, '%'),
          component('cycle', 'Cycle', 0, '%'),
          component('transit', 'Transit', 0, '%'),
          component('car', 'Car', 0, '%'),
        ],
      }),
      qa,
    );
  }

  const walkShare = round((input.walkTrips / totalTrips) * 100, 1);
  const cycleShare = round((input.cycleTrips / totalTrips) * 100, 1);
  const transitShare = round((input.transitTrips / totalTrips) * 100, 1);
  const carShare = round((input.carTrips / totalTrips) * 100, 1);
  const sustainableShare = round(walkShare + cycleShare + transitShare, 1);

  const dominantMode = [
    { label: 'Walk', value: walkShare },
    { label: 'Cycle', value: cycleShare },
    { label: 'Transit', value: transitShare },
    { label: 'Car', value: carShare },
  ].sort((left, right) => right.value - left.value)[0]?.label ?? 'Mixed';

  const qa = buildIndicatorQA('modeSplit', {
    inputs: { walkTrips: input.walkTrips, cycleTrips: input.cycleTrips, transitTrips: input.transitTrips, carTrips: input.carTrips },
  });

  return wrapWithQA(
    createIndicatorResult('modeSplit', sustainableShare, '% sustainable share', {
      displayValue: `${walkShare}% walk · ${cycleShare}% cycle · ${transitShare}% transit · ${carShare}% car`,
      classification: sustainableShare >= 60 ? 'Active and transit oriented' : sustainableShare >= 40 ? 'Mixed mobility' : 'Car dependent',
      components: [
        component('walk', 'Walk', walkShare, '%'),
        component('cycle', 'Cycle', cycleShare, '%'),
        component('transit', 'Transit', transitShare, '%'),
        component('car', 'Car', carShare, '%'),
      ],
      metadata: {
        totalTrips,
        dominantMode,
      },
    }),
    qa,
  );
}

export interface TransitServiceFrequencyInput {
  totalPeakDepartures: number;
  observedStops: number;
}

export function transitServiceFrequency(input: TransitServiceFrequencyInput) {
  const frequency = input.observedStops > 0 ? round(input.totalPeakDepartures / input.observedStops, 2) : 0;
  return createIndicatorResult('transitServiceFrequency', frequency, 'veh/hour', {
    displayValue: `${frequency} veh/hour per stop`,
    metadata: {
      totalPeakDepartures: input.totalPeakDepartures,
      observedStops: input.observedStops,
    },
  });
}

export interface CycleLaneConnectivityInput {
  nodes: number;
  edges: number;
  components?: number;
}

export function cycleLaneConnectivity(input: CycleLaneConnectivityInput) {
  const connectivity = streetConnectivity({
    nodes: input.nodes,
    edges: input.edges,
    ...(input.components === undefined ? {} : { components: input.components }),
  });

  const alpha = connectivity.alpha.value;
  const beta = Math.min(connectivity.beta.value / 1.5, 1);
  const gamma = connectivity.gamma.value;
  const composite = round(((alpha + beta + gamma) / 3) * 100, 1);

  return createIndicatorResult('cycleLaneConnectivity', composite, 'index [0-100]', {
    displayValue: `Alpha ${connectivity.alpha.value} · Beta ${connectivity.beta.value} · Gamma ${connectivity.gamma.value}`,
    components: [
      component('alpha', 'Alpha connectivity', connectivity.alpha.value),
      component('beta', 'Beta complexity', connectivity.beta.value),
      component('gamma', 'Gamma connectivity', connectivity.gamma.value),
    ],
  });
}

export interface ParkingUtilisationInput {
  occupiedSpaces: number;
  totalSpaces: number;
}

export function parkingUtilisation(input: ParkingUtilisationInput) {
  const ratio = round(safeRatio(input.occupiedSpaces, input.totalSpaces), 3);
  return createIndicatorResult('parkingUtilisation', ratio, 'ratio', {
    displayValue: `${round(ratio * 100, 1)}% occupied`,
  });
}

export interface AverageCommuteTimeInput {
  walkTrips: number;
  walkMinutes: number;
  cycleTrips: number;
  cycleMinutes: number;
  transitTrips: number;
  transitMinutes: number;
  carTrips: number;
  carMinutes: number;
}

export function averageCommuteTime(input: AverageCommuteTimeInput) {
  const totalTrips = sum([input.walkTrips, input.cycleTrips, input.transitTrips, input.carTrips]);
  const weightedMinutes =
    input.walkTrips * input.walkMinutes +
    input.cycleTrips * input.cycleMinutes +
    input.transitTrips * input.transitMinutes +
    input.carTrips * input.carMinutes;
  const averageMinutes = totalTrips > 0 ? round(weightedMinutes / totalTrips, 2) : 0;

  return createIndicatorResult('averageCommuteTime', averageMinutes, 'minutes', {
    displayValue: `${averageMinutes} minutes`,
    metadata: { totalTrips },
  });
}

export interface RoadSafetyIndexInput {
  annualCrashes: number;
  severityWeight: number;
  roadLengthKm: number;
  averageDailyTraffic: number;
}

export function roadSafetyIndex(input: RoadSafetyIndexInput) {
  const denominator = input.roadLengthKm * input.averageDailyTraffic;
  const value = denominator > 0 ? round((input.annualCrashes * input.severityWeight * 1_000_000) / denominator, 3) : 0;
  return createIndicatorResult('roadSafetyIndex', value, 'index', {
    displayValue: `${value} severity-weighted crashes per million veh-km`,
  });
}

export interface LastMileAccessInput {
  populationWithin400m: number;
  totalPopulation: number;
}

export function lastMileAccess(input: LastMileAccessInput) {
  const access = round(safeRatio(input.populationWithin400m, input.totalPopulation) * 100, 2);
  return createIndicatorResult('lastMileAccess', access, '%', {
    displayValue: `${access}% within 400 m of transit`,
  });
}

export const TRANSPORT_MOBILITY_INDICATORS: IndicatorCatalogDefinition[] = [
  createIndicatorDefinition<VehicleKmTravelledInput>({
    kind: 'vehicleKmTravelled',
    title: 'Vehicle Kilometres Travelled',
    groupId: 'transport_mobility',
    summary: 'Aggregated daily vehicle exposure across arterial, collector, and local streets.',
    methodSummary: 'Summation of class-specific AADT multiplied by lane-centre length to estimate network-wide vehicle activity.',
    formula: 'VKT = Σ(AADTᵢ × Lᵢ)',
    unit: 'veh-km/day',
    inputFields: [
      { key: 'arterialAADT', label: 'Arterial AADT', description: 'Average annual daily traffic on arterial streets.', unit: 'veh/day', min: 0, step: 100, defaultValue: 24000 },
      { key: 'arterialLengthKm', label: 'Arterial Length', description: 'Total arterial centreline length inside the study area.', unit: 'km', min: 0, step: 0.1, defaultValue: 18 },
      { key: 'collectorAADT', label: 'Collector AADT', description: 'Average annual daily traffic on collector streets.', unit: 'veh/day', min: 0, step: 100, defaultValue: 12000 },
      { key: 'collectorLengthKm', label: 'Collector Length', description: 'Total collector centreline length.', unit: 'km', min: 0, step: 0.1, defaultValue: 26 },
      { key: 'localAADT', label: 'Local Street AADT', description: 'Average annual daily traffic on local streets.', unit: 'veh/day', min: 0, step: 100, defaultValue: 3000 },
      { key: 'localLengthKm', label: 'Local Street Length', description: 'Total local-street centreline length.', unit: 'km', min: 0, step: 0.1, defaultValue: 42 },
    ],
    outputFields: [
      { key: 'value', label: 'Daily VKT', description: 'Total class-weighted daily vehicle kilometres travelled.', unit: 'veh-km/day' },
      { key: 'components', label: 'Class Breakdown', description: 'Arterial, collector, and local contributions to total VKT.' },
    ],
    classification: [
      { label: 'Low traffic load', description: 'Daily network vehicle movement remains relatively limited.', max: 200000 },
      { label: 'Moderate traffic load', description: 'The street network supports a typical urban daily movement profile.', min: 200000, max: 500000 },
      { label: 'High traffic load', description: 'Vehicle throughput is substantial and likely to produce congestion or emissions pressure.', min: 500000, max: 1000000 },
      { label: 'Very high traffic load', description: 'Network utilisation is intensive and merits mitigation or scenario testing.', min: 1000000 },
    ],
    interpretationGuidance: [
      'Interpret VKT as activity exposure, not as a direct welfare metric.',
      'Compare scenarios using consistent roadway classes and AADT vintages.',
      'Use alongside mode split and road safety to avoid mobility-only narratives.',
    ],
    methodologicalReference: 'FHWA (2019). Traffic Monitoring Guide.',
    sectionId: 'urban_indicators',
    tags: ['mobility', 'traffic', 'indicators', 'policy'],
    relatedFlowIds: ['accessibility', 'scenario_comparison', 'system_dynamics'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'scenario_tradeoffs',
      note: 'Use VKT to compare mode-shift or congestion-pricing scenarios in transport studios.',
    },
    dashboardBindingKind: 'metric',
    compute: vehicleKmTravelled,
  }),
  createIndicatorDefinition<ModeSplitInput>({
    kind: 'modeSplit',
    title: 'Mode Split',
    groupId: 'transport_mobility',
    summary: 'Observed travel shares for walking, cycling, transit, and private car trips.',
    methodSummary: 'Trips are normalised into a proportion vector, with sustainable-mode share used as the primary scalar summary.',
    formula: 'shareₘ = tripsₘ / Σ trips',
    unit: '% sustainable share',
    inputFields: [
      { key: 'walkTrips', label: 'Walk Trips', description: 'Observed walking trips in the sample.', unit: 'trips', min: 0, step: 1, defaultValue: 1800 },
      { key: 'cycleTrips', label: 'Cycle Trips', description: 'Observed cycling trips in the sample.', unit: 'trips', min: 0, step: 1, defaultValue: 450 },
      { key: 'transitTrips', label: 'Transit Trips', description: 'Observed public transport trips.', unit: 'trips', min: 0, step: 1, defaultValue: 2400 },
      { key: 'carTrips', label: 'Car Trips', description: 'Observed private motor-vehicle trips.', unit: 'trips', min: 0, step: 1, defaultValue: 2900 },
    ],
    outputFields: [
      { key: 'value', label: 'Sustainable Share', description: 'Combined walk, cycle, and transit share.', unit: '%' },
      { key: 'components', label: 'Mode Shares', description: 'Per-mode shares retained as a four-part vector.' },
    ],
    classification: [
      { label: 'Car dependent', description: 'Private motor modes dominate daily mobility.', max: 40 },
      { label: 'Mixed mobility', description: 'No single mobility regime dominates the network.', min: 40, max: 60 },
      { label: 'Active and transit oriented', description: 'Walking, cycling, and transit collectively lead the trip mix.', min: 60 },
    ],
    interpretationGuidance: [
      'Review individual mode shares before drawing policy conclusions from the sustainable-mode summary.',
      'Journey-to-work mode split often understates care, leisure, and service-access trips.',
      'Compare time periods only when survey methodology and weighting remain consistent.',
    ],
    methodologicalReference: 'Census journey-to-work mode-share practice and metropolitan household travel surveys.',
    sectionId: 'urban_indicators',
    tags: ['mobility', 'transit', 'pedestrian', 'cycling', 'indicators'],
    relatedFlowIds: ['accessibility', 'equity_audit', 'scenario_comparison'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'hansen_accessibility',
      note: 'Mode split contextualises whether accessibility gains come from sustainable or car-led mobility patterns.',
    },
    dashboardBindingKind: 'series',
    compute: modeSplit,
  }),
  createIndicatorDefinition<TransitServiceFrequencyInput>({
    kind: 'transitServiceFrequency',
    title: 'Transit Service Frequency',
    groupId: 'transport_mobility',
    summary: 'Average peak-hour departures per observed stop or interchange.',
    methodSummary: 'Peak departures are divided by the number of observed stops to produce a tractable service-frequency indicator for dashboarding and scenario review.',
    formula: 'f̄ = total peak departures / observed stops',
    unit: 'veh/hour',
    inputFields: [
      { key: 'totalPeakDepartures', label: 'Peak Departures', description: 'Total departures observed during the peak analysis hour.', unit: 'veh/hour', min: 0, step: 1, defaultValue: 96 },
      { key: 'observedStops', label: 'Observed Stops', description: 'Stops or boarding points included in the peak sample.', unit: 'count', min: 1, step: 1, defaultValue: 12 },
    ],
    outputFields: [
      { key: 'value', label: 'Average Frequency', description: 'Mean service frequency per stop during the peak hour.', unit: 'veh/hour' },
    ],
    classification: [
      { label: 'Sparse service', description: 'Peak service is infrequent and may constrain reliability or transfers.', max: 4 },
      { label: 'Basic service', description: 'Peak service exists but may not support strong spontaneous use.', min: 4, max: 8 },
      { label: 'Frequent service', description: 'Headways support practical everyday transit use.', min: 8, max: 12 },
      { label: 'Turn-up-and-go service', description: 'High-frequency service supports low waiting times and seamless transfers.', min: 12 },
    ],
    interpretationGuidance: [
      'Pair service frequency with last-mile access so stop coverage and service quality are not conflated.',
      'Peak-hour averages can hide severe off-peak service deficits.',
    ],
    methodologicalReference: 'GTFS-derived peak headway practice.',
    sectionId: 'urban_indicators',
    tags: ['transit', 'mobility', 'accessibility', 'indicators'],
    relatedFlowIds: ['accessibility', 'equity_audit'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'hansen_accessibility',
      note: 'Use frequency to distinguish nominal coverage from service that is actually usable at peak time.',
    },
    dashboardBindingKind: 'metric',
    compute: transitServiceFrequency,
  }),
  createIndicatorDefinition<CycleLaneConnectivityInput>({
    kind: 'cycleLaneConnectivity',
    title: 'Cycle Lane Connectivity',
    groupId: 'transport_mobility',
    summary: 'Composite connectivity score for the cycling network derived from alpha, beta, and gamma graph metrics.',
    methodSummary: 'Cycle infrastructure is treated as a planar graph; alpha, beta, and gamma are summarised into a normalised connectivity score while retaining each component for audit.',
    formula: 'Connectivity = mean(α, min(β/1.5, 1), γ) × 100',
    unit: 'index [0-100]',
    inputFields: [
      { key: 'nodes', label: 'Cycle Network Nodes', description: 'Intersections and dead ends in the cycle network graph.', unit: 'count', min: 2, step: 1, defaultValue: 120 },
      { key: 'edges', label: 'Cycle Network Edges', description: 'Cycle-network links connecting graph nodes.', unit: 'count', min: 1, step: 1, defaultValue: 168 },
      { key: 'components', label: 'Connected Components', description: 'Disconnected cycling subnetworks in the system.', unit: 'count', min: 1, step: 1, defaultValue: 2 },
    ],
    outputFields: [
      { key: 'value', label: 'Connectivity Score', description: 'Normalised score derived from graph-theoretic cycle-network metrics.', unit: 'index [0-100]' },
      { key: 'components', label: 'Graph Metrics', description: 'Alpha, beta, and gamma values retained for diagnostics.' },
    ],
    classification: [
      { label: 'Fragmented network', description: 'Cycling routes are discontinuous and circuit options are limited.', max: 35 },
      { label: 'Partially connected', description: 'Cycling infrastructure supports some route choice but contains notable gaps.', min: 35, max: 60 },
      { label: 'Well connected', description: 'The cycle network supports multiple route options and resilient circulation.', min: 60, max: 80 },
      { label: 'Highly connected', description: 'Cycling infrastructure behaves as an integrated urban mobility network.', min: 80 },
    ],
    interpretationGuidance: [
      'Graph connectivity should be read together with route comfort and traffic stress.',
      'Disconnected components often indicate neighbourhood-level exclusion even when total lane length appears large.',
    ],
    methodologicalReference: 'Dill, J. (2004). Measuring network connectivity for bicycling and walking.',
    sectionId: 'urban_indicators',
    tags: ['cycling', 'mobility', 'network_analysis', 'indicators'],
    relatedFlowIds: ['accessibility', 'scenario_comparison'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'scenario_tradeoffs',
      note: 'Use cycle-network connectivity to compare retrofit packages or corridor investments.',
    },
    dashboardBindingKind: 'series',
    compute: cycleLaneConnectivity,
  }),
  createIndicatorDefinition<ParkingUtilisationInput>({
    kind: 'parkingUtilisation',
    title: 'Parking Utilisation',
    groupId: 'transport_mobility',
    summary: 'Observed occupancy of the available parking supply.',
    methodSummary: 'Occupied spaces are divided by total marked supply to reveal underuse, efficient use, or oversubscription.',
    formula: 'Utilisation = occupied spaces / total spaces',
    unit: 'ratio',
    inputFields: [
      { key: 'occupiedSpaces', label: 'Occupied Spaces', description: 'Parking stalls occupied during the observation period.', unit: 'spaces', min: 0, step: 1, defaultValue: 268 },
      { key: 'totalSpaces', label: 'Total Spaces', description: 'Marked or legal parking spaces in the sample.', unit: 'spaces', min: 1, step: 1, defaultValue: 320 },
    ],
    outputFields: [
      { key: 'value', label: 'Occupancy Ratio', description: 'Occupied spaces divided by supplied spaces.', unit: 'ratio' },
    ],
    classification: [
      { label: 'Underused supply', description: 'Parking inventory is lightly used and may signal oversupply.', max: 0.6 },
      { label: 'Efficient utilisation', description: 'Occupancy remains robust without indicating severe scarcity.', min: 0.6, max: 0.85 },
      { label: 'Stressed supply', description: 'Occupancy is near practical capacity and spillover pressure may emerge.', min: 0.85, max: 0.95 },
      { label: 'Oversubscribed supply', description: 'Parking demand routinely exceeds comfortable operating levels.', min: 0.95 },
    ],
    interpretationGuidance: [
      'Single-period occupancy can miss turnover and illegal parking behaviour.',
      'Interpret together with mode split to avoid maximising parking at the expense of sustainable access.',
    ],
    methodologicalReference: 'Shoup, D. (2005). The High Cost of Free Parking.',
    sectionId: 'urban_indicators',
    tags: ['mobility', 'parking', 'policy', 'indicators'],
    relatedFlowIds: ['accessibility', 'scenario_comparison'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'scenario_tradeoffs',
      note: 'Parking utilisation is useful when discussing curb reform, TOD, and travel-demand management.',
    },
    dashboardBindingKind: 'metric',
    compute: parkingUtilisation,
  }),
  createIndicatorDefinition<AverageCommuteTimeInput>({
    kind: 'averageCommuteTime',
    title: 'Average Commute Time',
    groupId: 'transport_mobility',
    summary: 'Population-weighted mean commute duration across major travel modes.',
    methodSummary: 'Mode-specific trip counts weight average mode durations to produce a cross-modal commute mean.',
    formula: 'T̄ = Σ(tripsₘ × durationₘ) / Σ tripsₘ',
    unit: 'minutes',
    inputFields: [
      { key: 'walkTrips', label: 'Walk Trips', description: 'Observed walking commute trips.', unit: 'trips', min: 0, step: 1, defaultValue: 1800 },
      { key: 'walkMinutes', label: 'Walk Duration', description: 'Mean walk-commute duration.', unit: 'min', min: 0, step: 0.1, defaultValue: 18 },
      { key: 'cycleTrips', label: 'Cycle Trips', description: 'Observed cycling commute trips.', unit: 'trips', min: 0, step: 1, defaultValue: 420 },
      { key: 'cycleMinutes', label: 'Cycle Duration', description: 'Mean cycle-commute duration.', unit: 'min', min: 0, step: 0.1, defaultValue: 21 },
      { key: 'transitTrips', label: 'Transit Trips', description: 'Observed transit commute trips.', unit: 'trips', min: 0, step: 1, defaultValue: 2400 },
      { key: 'transitMinutes', label: 'Transit Duration', description: 'Mean transit-commute duration.', unit: 'min', min: 0, step: 0.1, defaultValue: 41 },
      { key: 'carTrips', label: 'Car Trips', description: 'Observed car commute trips.', unit: 'trips', min: 0, step: 1, defaultValue: 2900 },
      { key: 'carMinutes', label: 'Car Duration', description: 'Mean car-commute duration.', unit: 'min', min: 0, step: 0.1, defaultValue: 33 },
    ],
    outputFields: [
      { key: 'value', label: 'Weighted Mean Commute', description: 'Average commute duration across the observed trip mix.', unit: 'minutes' },
    ],
    classification: [
      { label: 'Short commute structure', description: 'Daily mobility is relatively local and time-efficient.', max: 20 },
      { label: 'Moderate commute structure', description: 'Commute durations are manageable but still influential in daily scheduling.', min: 20, max: 35 },
      { label: 'Long commute structure', description: 'Travel time likely constrains labour access and wellbeing.', min: 35, max: 50 },
      { label: 'Severe commute burden', description: 'Daily mobility consumes substantial household time budgets.', min: 50 },
    ],
    interpretationGuidance: [
      'Average commute time masks who experiences the longest burdens.',
      'Read alongside mode split and service frequency to understand why time burdens emerge.',
    ],
    methodologicalReference: 'Population-weighted commute duration in travel surveys and census journey-to-work tables.',
    sectionId: 'urban_indicators',
    tags: ['mobility', 'transit', 'equity', 'indicators'],
    relatedFlowIds: ['accessibility', 'equity_audit'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'hansen_accessibility',
      note: 'Commute time is a useful counterpoint when accessibility looks acceptable but daily burden remains high.',
    },
    dashboardBindingKind: 'metric',
    compute: averageCommuteTime,
  }),
  createIndicatorDefinition<RoadSafetyIndexInput>({
    kind: 'roadSafetyIndex',
    title: 'Road Safety Index',
    groupId: 'transport_mobility',
    summary: 'Severity-weighted crash burden normalised by network length and traffic exposure.',
    methodSummary: 'Crash counts are weighted by severity and divided by exposure (road length × AADT) to create a comparable safety index.',
    formula: 'RSI = crashes × severity / (L × AADT)',
    unit: 'index',
    inputFields: [
      { key: 'annualCrashes', label: 'Annual Crashes', description: 'Reported crashes during the analysis year.', unit: 'crashes', min: 0, step: 1, defaultValue: 84 },
      { key: 'severityWeight', label: 'Severity Weight', description: 'Average severity multiplier applied to crashes.', unit: 'weight', min: 0, step: 0.1, defaultValue: 2.6 },
      { key: 'roadLengthKm', label: 'Road Length', description: 'Observed network length included in the crash record.', unit: 'km', min: 0.1, step: 0.1, defaultValue: 48 },
      { key: 'averageDailyTraffic', label: 'Average Daily Traffic', description: 'Representative AADT for the analysed network.', unit: 'veh/day', min: 1, step: 100, defaultValue: 16500 },
    ],
    outputFields: [
      { key: 'value', label: 'Safety Index', description: 'Severity-weighted crash burden normalised per million veh-km.', unit: 'index' },
    ],
    classification: [
      { label: 'Low crash burden', description: 'Observed crash burden is comparatively restrained for the analysed exposure.', max: 0.5 },
      { label: 'Moderate crash burden', description: 'Crash exposure warrants monitoring and targeted safety treatments.', min: 0.5, max: 1.5 },
      { label: 'High crash burden', description: 'Safety treatments should be prioritised on the network or corridor.', min: 1.5, max: 3 },
      { label: 'Critical crash burden', description: 'Road-safety performance is poor relative to traffic exposure.', min: 3 },
    ],
    interpretationGuidance: [
      'Keep severity definitions stable; otherwise the index is not comparable across time.',
      'Use corridor-level diagnostics after network screening to avoid masking hot spots.',
    ],
    methodologicalReference: 'WHO (2018). Global Status Report on Road Safety.',
    sectionId: 'urban_indicators',
    tags: ['mobility', 'safety', 'traffic', 'indicators'],
    relatedFlowIds: ['accessibility', 'scenario_comparison', 'equity_audit'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'scenario_tradeoffs',
      note: 'Safety performance is useful when evaluating whether corridor upgrades truly improve mobility quality.',
    },
    dashboardBindingKind: 'metric',
    compute: roadSafetyIndex,
  }),
  createIndicatorDefinition<LastMileAccessInput>({
    kind: 'lastMileAccess',
    title: 'Last-Mile Transit Access',
    groupId: 'transport_mobility',
    summary: 'Share of residents living within a 400 m walk of a transit stop.',
    methodSummary: 'Population coverage within a 400 m catchment is divided by total population to express first/last-mile accessibility.',
    formula: 'Access = population within 400 m / total population × 100',
    unit: '%',
    inputFields: [
      { key: 'populationWithin400m', label: 'Population Within 400 m', description: 'Residents falling inside the 400 m pedestrian catchment.', unit: 'people', min: 0, step: 1, defaultValue: 85200 },
      { key: 'totalPopulation', label: 'Total Population', description: 'Total residential population in the study area.', unit: 'people', min: 1, step: 1, defaultValue: 112000 },
    ],
    outputFields: [
      { key: 'value', label: 'Population Coverage', description: 'Share of residents within a 400 m walk to transit.', unit: '%' },
    ],
    classification: [
      { label: 'Limited coverage', description: 'Many residents remain beyond a practical walking catchment to transit.', max: 40 },
      { label: 'Partial coverage', description: 'Transit is locally present, with spatial coverage still incomplete.', min: 40, max: 60 },
      { label: 'Strong coverage', description: 'Most residents live within a usable first/last-mile transit catchment.', min: 60, max: 80 },
      { label: 'Near-universal coverage', description: 'Transit catchments cover nearly all residents in the study area.', min: 80 },
    ],
    interpretationGuidance: [
      'Spatial coverage does not guarantee service quality or barrier-free access.',
      'Compare with service frequency to separate stop location from timetable quality.',
    ],
    methodologicalReference: 'Cervero, R. (2013). Transport infrastructure and the last mile problem.',
    sectionId: 'urban_indicators',
    tags: ['transit', 'mobility', 'accessibility', 'equity', 'indicators'],
    relatedFlowIds: ['accessibility', 'facility_optimisation', 'equity_audit'],
    education: {
      pathId: 'accessibility_equity_analysis',
      explainerId: 'hansen_accessibility',
      note: 'Coverage metrics help students distinguish network reach from service quality and travel-time performance.',
    },
    dashboardBindingKind: 'metric',
    compute: lastMileAccess,
  }),
];
