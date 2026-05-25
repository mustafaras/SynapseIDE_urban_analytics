import type {
  UrbanMethodCapabilityStatus,
  UrbanMethodReadinessStatus,
  UrbanMethodValidityEnvelope,
} from '../lib/types';
import type { MapToUrbanContextPayload } from '@/services/map/bridge/MapUrbanBridgeService';

export type UrbanMethodMetadataSourceKind = 'method-card' | 'indicator' | 'workflow' | 'unknown';

export type UrbanMethodValidityValidationStatus = 'complete' | 'partial' | 'missing';

export interface UrbanMethodMetadataSource {
  id: string;
  title?: string;
  sourceKind?: UrbanMethodMetadataSourceKind;
  validityEnvelope?: Partial<UrbanMethodValidityEnvelope>;
  capabilityStatus?: UrbanMethodCapabilityStatus;
}

export interface UrbanMethodValidityValidationResult {
  status: UrbanMethodValidityValidationStatus;
  ok: boolean;
  missingFields: string[];
  warnings: string[];
  capabilityStatus: UrbanMethodCapabilityStatus;
  readinessStatus: UrbanMethodReadinessStatus;
  envelope: UrbanMethodValidityEnvelope;
}

export interface UrbanMapMethodRecommendation {
  methodId: string;
  methodTitle: string;
  status: UrbanMethodReadinessStatus;
  hint: string;
  attribution: string;
  layerIds: string[];
  aoiId: string | null;
  missingRequirements: string[];
}

const METHOD_VALIDITY_MISSING_WARNING =
  'Method validity metadata is missing; do not treat this method as ready for formal interpretation.';

const REQUIRED_NON_EMPTY_ARRAY_FIELDS: Array<keyof UrbanMethodValidityEnvelope> = [
  'validSpatialScales',
  'requiredDataTypes',
  'crsAssumptions',
  'temporalAssumptions',
  'assumptions',
  'limitations',
  'failureModes',
  'interpretationWarnings',
  'misuseWarnings',
];

const REQUIRED_ARRAY_FIELDS: Array<keyof UrbanMethodValidityEnvelope> = ['requiredFields', 'peerReferenceIds'];

const REQUIRED_SCALAR_FIELDS: Array<keyof UrbanMethodValidityEnvelope> = [
  'methodFamily',
  'maturityLevel',
  'capabilityStatus',
];

export const URBAN_METHOD_VALIDITY_ENVELOPE_PRESETS: Record<string, UrbanMethodValidityEnvelope> = {
  'card:ss-morans-i': {
    validSpatialScales: ['neighborhood', 'district', 'city', 'metropolitan', 'regional'],
    recommendedScales: ['district', 'city'],
    requiredDataTypes: ['vector-polygon-layer', 'tabular-attributes'],
    requiredFields: ['numeric_indicator'],
    requiredGeometryTypes: ['Polygon', 'MultiPolygon'],
    requiresProjectedCrs: false,
    crsAssumptions: [
      'Weights can be built from projected or geographic polygon layers, but distance-band weights require a CRS with interpretable distance units.',
      'All input features must share one CRS before contiguity or distance weights are computed.',
    ],
    requiredTemporalStructure: 'single-snapshot',
    temporalAssumptions: [
      'Global Moran statistics should compare observations from the same time period or a deliberately harmonized snapshot.',
    ],
    methodFamily: 'spatial-statistics',
    maturityLevel: 'reference',
    capabilityStatus: 'implemented',
    minimumFeatureCount: 30,
    assumptions: [
      'The analysis variable is continuous or ordinal enough for spatial autocorrelation testing.',
      'The selected spatial weights matrix represents a defensible neighborhood relationship for the study question.',
    ],
    limitations: [
      'Results are sensitive to the modifiable areal unit problem and spatial-weights choices.',
      'Global statistics can hide local clusters and outliers.',
    ],
    failureModes: [
      'Too few features, isolated polygons, constant values, or missing numeric attributes can make the statistic invalid.',
      'Unreviewed multiple testing in local follow-up analysis can create false positives.',
    ],
    interpretationWarnings: [
      'A significant result shows spatial patterning, not causal explanation.',
      'Report the weights definition and permutation settings with every interpretation.',
    ],
    misuseWarnings: [
      'Do not compare Moran statistics across datasets unless geometry, scale, weights, and attribute definitions are comparable.',
    ],
    peerReferenceIds: ['moran-1950', 'anselin-1995', 'anselin-rey-2014'],
  },
  'indicator:modeSplit': {
    validSpatialScales: ['neighborhood', 'district', 'city', 'metropolitan'],
    recommendedScales: ['district', 'city'],
    requiredDataTypes: ['tabular-attributes'],
    requiredFields: ['walkTrips', 'cycleTrips', 'transitTrips', 'carTrips'],
    crsAssumptions: [
      'Mode split itself is not CRS-sensitive, but any spatial aggregation feeding the counts must use a consistent study boundary.',
    ],
    requiredTemporalStructure: 'single-snapshot',
    temporalAssumptions: [
      'Trip counts should represent the same survey window or reporting period before shares are compared.',
    ],
    methodFamily: 'indicator',
    maturityLevel: 'established',
    capabilityStatus: 'implemented',
    assumptions: [
      'Observed trip counts are mutually exclusive across modes and cover the target population or sample frame.',
      'Input counts are non-negative and represent comparable trip definitions.',
    ],
    limitations: [
      'Aggregate shares can hide route quality, trip purpose, disability access, affordability, and time-of-day differences.',
      'Small or biased travel samples can distort sustainable-mode share.',
    ],
    failureModes: [
      'Zero total trips produce a no-sample result rather than a valid mode-share estimate.',
      'Overlapping mode categories double-count trips and invalidate the share calculation.',
    ],
    interpretationWarnings: [
      'Use mode split as one mobility indicator, not as a complete accessibility or welfare measure.',
      'Compare scenarios only when survey design and denominator definitions are consistent.',
    ],
    misuseWarnings: [
      'Do not infer individual behavior change or equity outcomes from aggregate mode shares alone.',
    ],
    peerReferenceIds: ['fhwa-traffic-monitoring-2019', 'oecd-jrc-2008'],
  },
  'flow:accessibility': {
    validSpatialScales: ['neighborhood', 'district', 'city', 'metropolitan'],
    recommendedScales: ['neighborhood', 'district', 'city'],
    requiredDataTypes: ['aoi', 'network-graph', 'vector-point-layer', 'tabular-attributes'],
    requiredFields: ['travel_mode', 'time_threshold', 'poi_category'],
    requiredGeometryTypes: ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'],
    requiresProjectedCrs: true,
    crsAssumptions: [
      'Travel-time or distance calculations require a projected CRS or a network service that handles geodesic routing correctly.',
      'POI, population, and service-area geometries must be aligned to the same study boundary before scoring.',
    ],
    requiredTemporalStructure: 'single-snapshot',
    temporalAssumptions: [
      'Network availability, service frequencies, population, and POIs should refer to the same planning period.',
      'Time-dependent transit schedules require explicit service-date handling; otherwise outputs are static approximations.',
    ],
    methodFamily: 'network-analysis',
    maturityLevel: 'established',
    capabilityStatus: 'implemented',
    minimumFeatureCount: 1,
    assumptions: [
      'Selected travel modes and thresholds match the accessibility question.',
      'POI coverage and population weighting are sufficient for the groups being compared.',
    ],
    limitations: [
      'Isochrone outputs depend on network completeness, impedance assumptions, and travel-mode simplifications.',
      'Accessibility indices do not guarantee actual service quality, affordability, safety, or capacity.',
    ],
    failureModes: [
      'Missing or disconnected network geometry can create false gaps or false access.',
      'Out-of-date POI inventories can misrepresent service availability.',
    ],
    interpretationWarnings: [
      'Treat accessibility as a planning-support indicator, not as a service-level guarantee.',
      'Equity conclusions require documented demographic denominators and coverage caveats.',
    ],
    misuseWarnings: [
      'Do not rank neighborhoods without reviewing boundary effects, POI completeness, and group-specific access barriers.',
    ],
    peerReferenceIds: ['hansen-1959', 'geurs-van-wee-2004'],
    ethicalGuardrails: [
      'Disaggregate cautiously when vulnerable groups could be stigmatized or exposed.',
      'Pair gap maps with local review before prioritizing investment or enforcement.',
    ],
  },
};

const MAP_CONTEXT_RECOMMENDATION_METHODS = [
  {
    methodId: 'ss-morans-i',
    methodTitle: "Spatial Autocorrelation (Moran's I)",
    presetKey: 'card:ss-morans-i',
  },
  {
    methodId: 'accessibility',
    methodTitle: 'Accessibility workflow',
    presetKey: 'flow:accessibility',
  },
] as const;

export function getUrbanMethodValidityEnvelopePreset(key: string): UrbanMethodValidityEnvelope | null {
  return URBAN_METHOD_VALIDITY_ENVELOPE_PRESETS[key] ?? null;
}

export function requireUrbanMethodValidityEnvelopePreset(key: string): UrbanMethodValidityEnvelope {
  const preset = getUrbanMethodValidityEnvelopePreset(key);
  if (!preset) {
    throw new Error(`Missing Urban method validity preset: ${key}`);
  }
  return preset;
}

export function applyUrbanMethodValidityPreset<
  T extends {
    validityEnvelope?: UrbanMethodValidityEnvelope;
    capabilityStatus?: UrbanMethodCapabilityStatus;
  },
>(item: T, presetKey: string): T {
  const preset = getUrbanMethodValidityEnvelopePreset(presetKey);
  if (!preset || item.validityEnvelope) {
    return item;
  }

  return {
    ...item,
    validityEnvelope: preset,
    capabilityStatus: item.capabilityStatus ?? preset.capabilityStatus,
  };
}

export function createUnknownUrbanMethodValidityEnvelope(
  source: Pick<UrbanMethodMetadataSource, 'id' | 'title' | 'capabilityStatus'>,
): UrbanMethodValidityEnvelope {
  const label = source.title ?? source.id;
  return {
    validSpatialScales: [],
    requiredDataTypes: [],
    requiredFields: [],
    crsAssumptions: [`CRS and projection assumptions have not been specified for ${label}.`],
    temporalAssumptions: [`Temporal assumptions have not been specified for ${label}.`],
    methodFamily: 'unknown',
    maturityLevel: 'unknown',
    capabilityStatus: source.capabilityStatus ?? 'residual_gap',
    assumptions: [`Method assumptions have not been specified for ${label}.`],
    limitations: [`Validity limits have not been specified for ${label}.`],
    failureModes: [`Failure modes have not been specified for ${label}.`],
    interpretationWarnings: [METHOD_VALIDITY_MISSING_WARNING],
    misuseWarnings: [`Do not use ${label} for formal decisions until validity metadata is completed and reviewed.`],
    peerReferenceIds: [],
  };
}

export function resolveUrbanMethodValidityEnvelope(source: UrbanMethodMetadataSource): UrbanMethodValidityEnvelope {
  if (source.validityEnvelope) {
    return normalizeUrbanMethodValidityEnvelope(source.validityEnvelope, source);
  }

  return createUnknownUrbanMethodValidityEnvelope(source);
}

export function validateUrbanMethodMetadata(
  source: UrbanMethodMetadataSource,
): UrbanMethodValidityValidationResult {
  const envelope = resolveUrbanMethodValidityEnvelope(source);
  const missingFields = source.validityEnvelope ? listMissingValidityFields(source.validityEnvelope) : ['validityEnvelope'];
  const status = !source.validityEnvelope ? 'missing' : missingFields.length > 0 ? 'partial' : 'complete';
  const capabilityStatus = source.capabilityStatus ?? envelope.capabilityStatus;
  const readinessStatus = inferReadinessStatus(capabilityStatus, status);
  const warnings = buildValidationWarnings(source, status, missingFields, capabilityStatus);

  return {
    status,
    ok: status === 'complete',
    missingFields,
    warnings,
    capabilityStatus,
    readinessStatus,
    envelope,
  };
}

export function validateUrbanMethodValidityEnvelope(
  envelope?: Partial<UrbanMethodValidityEnvelope>,
): UrbanMethodValidityValidationResult {
  return validateUrbanMethodMetadata({
    id: 'method',
    sourceKind: 'unknown',
    ...(envelope ? { validityEnvelope: envelope } : {}),
  });
}

function geometryMatchesRequirement(geometryType: string | undefined, requiredType: string): boolean {
  const geometry = geometryType?.toLowerCase() ?? '';
  const required = requiredType.toLowerCase();
  return geometry === required || geometry.includes(required);
}

function recommendationAttribution(
  payload: MapToUrbanContextPayload,
  layers: readonly MapToUrbanContextPayload['layerSummaries'][number][],
): string {
  const layerLabel = layers.map((layer) => layer.name).join(', ') || 'no matching layer';
  const aoiLabel = payload.aoiReference.label ?? payload.aoiReference.aoiId;
  return `based on: ${layerLabel}${aoiLabel ? ` / AOI ${aoiLabel}` : ''}`;
}

function recommendationMissingRequirements(
  payload: MapToUrbanContextPayload,
  layers: readonly MapToUrbanContextPayload['layerSummaries'][number][],
  envelope: UrbanMethodValidityEnvelope,
): string[] {
  const missing: string[] = [];
  const presentFields = new Set(
    layers.flatMap((layer) => layer.fieldSummary.fields.map((field) => field.name.toLowerCase())),
  );
  for (const field of envelope.requiredFields) {
    if (!presentFields.has(field.toLowerCase())) missing.push(`field ${field}`);
  }

  if (envelope.requiredDataTypes.includes('aoi') && payload.aoiReference.aoiId === null) {
    missing.push('active AOI');
  }

  if (layers.some((layer) => layer.crs.crs === null)) {
    missing.push('declared CRS');
  } else if (
    envelope.requiresProjectedCrs
    && layers.some((layer) => layer.crs.crs?.toUpperCase() === 'EPSG:4326' || layer.crs.crs?.toUpperCase() === 'OGC:CRS84')
  ) {
    missing.push('projected CRS');
  }

  if (envelope.minimumFeatureCount !== undefined) {
    const featureCount = layers.reduce((sum, layer) => sum + (layer.registry.featureCount ?? 0), 0);
    if (featureCount < envelope.minimumFeatureCount) {
      missing.push(`minimum ${envelope.minimumFeatureCount} features`);
    }
  }

  if (payload.qaSummary.blockingIssueIds.length > 0) {
    missing.push('resolved map QA blockers');
  }
  return missing;
}

/**
 * Interprets lightweight Map context into method-level hints. This function
 * is intentionally Urban-owned: Map supplies facts, while Urban determines
 * method compatibility and preserves caveats in each recommendation.
 */
export function recommendUrbanMethodsFromMapContext(
  payload: MapToUrbanContextPayload,
): UrbanMapMethodRecommendation[] {
  return MAP_CONTEXT_RECOMMENDATION_METHODS.flatMap((method) => {
    const envelope = requireUrbanMethodValidityEnvelopePreset(method.presetKey);
    const matchingLayers = envelope.requiredGeometryTypes?.length
      ? payload.layerSummaries.filter((layer) =>
          envelope.requiredGeometryTypes?.some((required) =>
            geometryMatchesRequirement(layer.registry.geometryType, required),
          ),
        )
      : payload.layerSummaries;
    if (matchingLayers.length === 0) {
      return [];
    }

    const attribution = recommendationAttribution(payload, matchingLayers);
    const missingRequirements = recommendationMissingRequirements(payload, matchingLayers, envelope);
    const hasDemoOrSynthetic = matchingLayers.some((layer) =>
      layer.registry.sourceKind === 'demo'
      || layer.registry.runtimeMode === 'demo'
      || layer.registry.runtimeMode === 'synthetic',
    );
    const hasUnknownProvenance = matchingLayers.some((layer) =>
      layer.registry.sourceKind === undefined || layer.registry.runtimeMode === 'unknown',
    );
    const hasQaWarning = payload.qaSummary.warningIssueIds.length > 0
      || matchingLayers.some((layer) => layer.qa.status === 'warning');

    let status: UrbanMethodReadinessStatus;
    if (missingRequirements.length > 0) {
      status = 'blocked';
    } else if (hasDemoOrSynthetic) {
      status = 'demo-only';
    } else if (hasUnknownProvenance) {
      status = 'needs-context';
    } else if (hasQaWarning) {
      status = 'ready-with-caveats';
    } else {
      status = 'ready';
    }

    const label = status === 'ready-with-caveats' ? 'ready with caveats' : status.replace('-', ' ');
    const requirementText = missingRequirements.length > 0
      ? `; missing: ${missingRequirements.join(', ')}`
      : hasDemoOrSynthetic
        ? '; demo/synthetic inputs remain labelled'
        : hasUnknownProvenance
          ? '; source/runtime mode remains unknown'
          : '';
    return [{
      methodId: method.methodId,
      methodTitle: method.methodTitle,
      status,
      hint: `${method.methodTitle}: ${label}${requirementText}; ${attribution}.`,
      attribution,
      layerIds: matchingLayers.map((layer) => layer.layerId),
      aoiId: payload.aoiReference.aoiId,
      missingRequirements,
    }];
  });
}

function normalizeUrbanMethodValidityEnvelope(
  envelope: Partial<UrbanMethodValidityEnvelope>,
  source: UrbanMethodMetadataSource,
): UrbanMethodValidityEnvelope {
  const fallback = createUnknownUrbanMethodValidityEnvelope(source);
  const normalized: UrbanMethodValidityEnvelope = {
    validSpatialScales: envelope.validSpatialScales ?? fallback.validSpatialScales,
    requiredDataTypes: envelope.requiredDataTypes ?? fallback.requiredDataTypes,
    requiredFields: envelope.requiredFields ?? fallback.requiredFields,
    crsAssumptions: envelope.crsAssumptions ?? fallback.crsAssumptions,
    temporalAssumptions: envelope.temporalAssumptions ?? fallback.temporalAssumptions,
    methodFamily: envelope.methodFamily ?? fallback.methodFamily,
    maturityLevel: envelope.maturityLevel ?? fallback.maturityLevel,
    capabilityStatus: source.capabilityStatus ?? envelope.capabilityStatus ?? fallback.capabilityStatus,
    assumptions: envelope.assumptions ?? fallback.assumptions,
    limitations: envelope.limitations ?? fallback.limitations,
    failureModes: envelope.failureModes ?? fallback.failureModes,
    interpretationWarnings: envelope.interpretationWarnings ?? fallback.interpretationWarnings,
    misuseWarnings: envelope.misuseWarnings ?? fallback.misuseWarnings,
    peerReferenceIds: envelope.peerReferenceIds ?? fallback.peerReferenceIds,
  };

  const recommendedScales = envelope.recommendedScales ?? envelope.validSpatialScales;
  if (recommendedScales) {
    normalized.recommendedScales = recommendedScales;
  }

  if (envelope.requiredGeometryTypes) {
    normalized.requiredGeometryTypes = envelope.requiredGeometryTypes;
  }

  if (envelope.requiredCrs) {
    normalized.requiredCrs = envelope.requiredCrs;
  }

  if (envelope.requiresProjectedCrs !== undefined) {
    normalized.requiresProjectedCrs = envelope.requiresProjectedCrs;
  }

  if (envelope.requiredTemporalStructure) {
    normalized.requiredTemporalStructure = envelope.requiredTemporalStructure;
  }

  if (envelope.minimumFeatureCount !== undefined) {
    normalized.minimumFeatureCount = envelope.minimumFeatureCount;
  }

  if (envelope.ethicalGuardrails) {
    normalized.ethicalGuardrails = envelope.ethicalGuardrails;
  }

  return normalized;
}

function listMissingValidityFields(envelope: Partial<UrbanMethodValidityEnvelope>): string[] {
  const missing = new Set<string>();

  for (const field of REQUIRED_NON_EMPTY_ARRAY_FIELDS) {
    const value = envelope[field];
    if (!Array.isArray(value) || value.length === 0) {
      missing.add(field);
    }
  }

  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(envelope[field])) {
      missing.add(field);
    }
  }

  for (const field of REQUIRED_SCALAR_FIELDS) {
    if (!envelope[field]) {
      missing.add(field);
    }
  }

  return Array.from(missing);
}

function inferReadinessStatus(
  capabilityStatus: UrbanMethodCapabilityStatus,
  validationStatus: UrbanMethodValidityValidationStatus,
): UrbanMethodReadinessStatus {
  if (capabilityStatus === 'deferred') {
    return 'blocked';
  }

  if (capabilityStatus === 'demo_mode') {
    return 'demo-only';
  }

  if (validationStatus !== 'complete') {
    return 'needs-context';
  }

  if (capabilityStatus === 'implemented') {
    return 'ready';
  }

  return 'ready-with-caveats';
}

function buildValidationWarnings(
  source: UrbanMethodMetadataSource,
  status: UrbanMethodValidityValidationStatus,
  missingFields: string[],
  capabilityStatus: UrbanMethodCapabilityStatus,
): string[] {
  const warnings: string[] = [];
  const label = source.title ?? source.id;

  if (status === 'missing') {
    warnings.push(METHOD_VALIDITY_MISSING_WARNING);
  }

  if (status === 'partial') {
    warnings.push(`${label} has incomplete method validity metadata: ${missingFields.join(', ')}.`);
  }

  if (capabilityStatus !== 'implemented') {
    warnings.push(`${label} capability status is ${capabilityStatus}; downstream UI must not present it as fully implemented.`);
  }

  return warnings;
}
