import type {
  AnalysisOutputMode,
  LayerQaStatus,
  LayerScientificQABadge,
  LayerSourceKind,
  OverlayLayerConfig,
} from '@/centerpanel/components/map/mapTypes';
import type { MapToUrbanContextPayload } from '@/services/map/bridge/MapUrbanBridgeService';
import type {
  MapScientificQAGeometryFamily,
  MapScientificQAState,
} from '@/services/map/MapScientificQA';
import type {
  CompletedAnalysisRun,
  MapOutput,
  UrbanDataFitnessDimension,
  UrbanDataFitnessFieldAvailability,
  UrbanDataFitnessGrade,
  UrbanDataFitnessIssue,
  UrbanDataFitnessIssueCategory,
  UrbanDataFitnessIssueSeverity,
  UrbanDataFitnessProfile,
  UrbanDataFitnessSampleSize,
  UrbanDataFitnessStatus,
  UrbanEvidenceScalar,
  UrbanScale,
} from '../lib/types';

const SCORE_WEIGHTS = {
  geometry: 20,
  crs: 15,
  attributes: 20,
  temporal: 15,
  completeness: 15,
  scale: 15,
} as const;

const STALE_AFTER_DAYS = 365;

export interface UrbanDataFitnessLayerInput {
  id: string;
  name?: string;
  geometryType?: string;
  crs?: string;
  /** True when `crs` originates from a user declaration (a caveated assertion, not verified). */
  crsUserDeclared?: boolean;
  fields?: string[];
  featureCount?: number;
  license?: string;
  sourceKind?: LayerSourceKind | string;
  /** Declared execution mode for derived or demonstration data. */
  runtimeMode?: AnalysisOutputMode;
  qaStatus?: LayerQaStatus;
  qaBadges?: LayerScientificQABadge[] | string[];
  qaCaveats?: string[];
  temporalDate?: string;
  scale?: UrbanScale;
  missingValueCount?: number;
  totalValueCount?: number;
}

export interface UrbanDataFitnessComputationInput {
  layers?: readonly UrbanDataFitnessLayerInput[];
  runs?: readonly CompletedAnalysisRun[];
  requiredFields?: readonly string[];
  requiredGeometryTypes?: readonly MapScientificQAGeometryFamily[];
  minimumFeatureCount?: number;
  analysisScale?: UrbanScale | null;
  sourceScale?: UrbanScale | null;
  requiresTemporalCoverage?: boolean;
  requiresLicense?: boolean;
  mapQA?: MapScientificQAState | null;
  uncertaintyNotes?: readonly string[];
  computedAt?: string;
}

export type UrbanMapContextFitnessOptions = Omit<
  UrbanDataFitnessComputationInput,
  'layers' | 'runs' | 'mapQA' | 'computedAt'
> & {
  computedAt?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function addIssue(
  issues: UrbanDataFitnessIssue[],
  input: {
    code: string;
    category: UrbanDataFitnessIssueCategory;
    severity: UrbanDataFitnessIssueSeverity;
    message: string;
    layerId?: string;
    runId?: string;
    field?: string;
    detail?: Record<string, UrbanEvidenceScalar>;
  },
): void {
  const issue: UrbanDataFitnessIssue = {
    code: input.code,
    category: input.category,
    severity: input.severity,
    message: input.message,
  };
  if (input.layerId) issue.layerId = input.layerId;
  if (input.runId) issue.runId = input.runId;
  if (input.field) issue.field = input.field;
  if (input.detail) issue.detail = input.detail;
  issues.push(issue);
}

function dimension<TFit extends string>(
  status: UrbanDataFitnessStatus,
  fit: TFit,
  score: number | null,
  notes: string[] = [],
): UrbanDataFitnessDimension<TFit> {
  return { status, fit, score, notes: unique(notes) };
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function featureCountFromGeoJson(value: unknown): number | null {
  if (
    value &&
    typeof value === 'object' &&
    (value as { type?: unknown }).type === 'FeatureCollection' &&
    Array.isArray((value as { features?: unknown }).features)
  ) {
    return (value as { features: unknown[] }).features.length;
  }
  if (value && typeof value === 'object' && (value as { type?: unknown }).type === 'Feature') {
    return 1;
  }
  return null;
}

function fieldsFromGeoJson(value: unknown): string[] {
  if (
    !value ||
    typeof value !== 'object' ||
    (value as { type?: unknown }).type !== 'FeatureCollection' ||
    !Array.isArray((value as { features?: unknown }).features)
  ) {
    return [];
  }
  const fields = new Set<string>();
  for (const feature of (value as { features: Array<{ properties?: unknown }> }).features) {
    const props = feature.properties;
    if (!props || typeof props !== 'object' || Array.isArray(props)) continue;
    for (const key of Object.keys(props)) fields.add(key);
  }
  return [...fields].sort();
}

function geometryFamilyFromText(value: string | undefined): MapScientificQAGeometryFamily {
  const normalized = value?.toLowerCase() ?? '';
  if (normalized.includes('point')) return 'point';
  if (normalized.includes('line')) return 'line';
  if (normalized.includes('polygon')) return 'polygon';
  if (normalized.includes('mixed')) return 'mixed';
  return 'unknown';
}

function resolveLayerCrs(layer: OverlayLayerConfig): string | undefined {
  return (
    layer.metadata?.crsSummary?.crs ??
    layer.metadata?.datasetContext?.crs ??
    layer.metadata?.columnar?.crs ??
    layer.metadata?.eoSource?.crs ??
    layer.metadata?.externalService?.crs ??
    undefined
  );
}

function resolveLayerFeatureCount(layer: OverlayLayerConfig): number | undefined {
  const candidates = [
    layer.metadata?.featureCount,
    layer.metadata?.columnar?.rowCount,
    layer.metadata?.datasetContext?.packageFeatureCount,
    featureCountFromGeoJson(layer.sourceData),
  ];
  return candidates.find((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function resolveLayerTemporalDate(layer: OverlayLayerConfig): string | undefined {
  return normalizeDate(
    layer.provenance?.collectedAt ??
      layer.provenance?.generatedAt ??
      layer.metadata?.datasetContext?.updateDate ??
      layer.metadata?.eoSource?.timeLabel ??
      layer.metadata?.externalService?.refreshedAt ??
      layer.metadata?.analysisResult?.runTimestamp ??
      layer.metadata?.updatedAt,
  );
}

function resolveLayerLicense(layer: OverlayLayerConfig): string | undefined {
  return layer.provenance?.license ?? layer.metadata?.datasetContext?.license;
}

export function extractUrbanDataFitnessLayerFromMapLayer(
  layer: OverlayLayerConfig,
): UrbanDataFitnessLayerInput {
  const result: UrbanDataFitnessLayerInput = { id: layer.id, name: layer.name };
  const geometryType = layer.metadata?.geometryType ?? layer.metadata?.columnar?.geometryTypes?.join(',');
  if (geometryType) result.geometryType = geometryType;
  const crs = resolveLayerCrs(layer);
  if (crs) result.crs = crs;
  if (layer.metadata?.crsSummary?.source === 'user-declared') result.crsUserDeclared = true;
  const fields = layer.metadata?.fields?.length ? layer.metadata.fields : fieldsFromGeoJson(layer.sourceData);
  if (fields.length) result.fields = fields;
  const featureCount = resolveLayerFeatureCount(layer);
  if (featureCount !== undefined) result.featureCount = featureCount;
  const license = resolveLayerLicense(layer);
  if (license) result.license = license;
  if (layer.sourceKind) result.sourceKind = layer.sourceKind;
  const runtimeMode = layer.metadata?.analysisResult?.outputMode
    ?? (layer.sourceKind === 'demo' ? 'demo' : undefined);
  if (runtimeMode) result.runtimeMode = runtimeMode;
  const qaStatus = layer.qaStatus ?? layer.metadata?.scientificQA?.status;
  if (qaStatus) result.qaStatus = qaStatus;
  const qaBadges = layer.metadata?.scientificQA?.badges;
  if (qaBadges?.length) result.qaBadges = [...qaBadges];
  const qaCaveats = layer.metadata?.scientificQA?.caveats;
  if (qaCaveats?.length) result.qaCaveats = [...qaCaveats];
  const temporalDate = resolveLayerTemporalDate(layer);
  if (temporalDate) result.temporalDate = temporalDate;
  return result;
}

function isLayerQaStatus(value: string): value is LayerQaStatus {
  return value === 'unchecked' || value === 'passed' || value === 'warning' || value === 'error';
}

/**
 * Converts the bridge contract into Urban-owned fitness inputs. It consumes
 * summary metadata only; raw map geometry and source buffers never cross into
 * the Urban recommendation path.
 */
export function extractUrbanDataFitnessLayersFromMapContext(
  payload: MapToUrbanContextPayload,
): UrbanDataFitnessLayerInput[] {
  return payload.layerSummaries.map((layer) => {
    const result: UrbanDataFitnessLayerInput = {
      id: layer.layerId,
      name: layer.name,
    };

    if (layer.registry.geometryType) result.geometryType = layer.registry.geometryType;
    if (layer.crs.crs) result.crs = layer.crs.crs;
    if (layer.crs.source === 'user-declared') result.crsUserDeclared = true;
    const fields = layer.fieldSummary.fields.map((field) => field.name);
    if (fields.length > 0) result.fields = fields;
    if (layer.registry.featureCount !== undefined) result.featureCount = layer.registry.featureCount;
    if (layer.registry.license) result.license = layer.registry.license;
    if (layer.registry.sourceKind) result.sourceKind = layer.registry.sourceKind;
    if (layer.registry.runtimeMode) {
      result.runtimeMode = layer.registry.runtimeMode;
    } else if (layer.registry.sourceKind === 'demo') {
      result.runtimeMode = 'demo';
    } else if (layer.registry.sourceKind === 'derived' || layer.registry.sourceKind === undefined) {
      result.runtimeMode = 'unknown';
    }
    if (isLayerQaStatus(layer.qa.status)) result.qaStatus = layer.qa.status;
    if (layer.qa.badges.length > 0) result.qaBadges = [...layer.qa.badges];
    if (layer.qa.caveats.length > 0) result.qaCaveats = [...layer.qa.caveats];
    return result;
  });
}

function mapContextAttribution(payload: MapToUrbanContextPayload): string {
  const layers = payload.layerSummaries.map((layer) => layer.name).join(', ') || 'no active layer';
  const aoi = payload.aoiReference.label ?? payload.aoiReference.aoiId;
  return `Based on: ${layers}${aoi ? ` / AOI ${aoi}` : ''}.`;
}

export function computeUrbanDataFitnessFromMapContext(
  payload: MapToUrbanContextPayload,
  options: UrbanMapContextFitnessOptions = {},
): UrbanDataFitnessProfile {
  return computeUrbanDataFitnessProfile({
    ...options,
    layers: extractUrbanDataFitnessLayersFromMapContext(payload),
    uncertaintyNotes: [
      ...(options.uncertaintyNotes ?? []),
      mapContextAttribution(payload),
      ...payload.aoiReference.caveats,
      ...payload.disabledReasons,
    ],
    computedAt: options.computedAt ?? payload.createdAt,
  });
}

export function extractUrbanDataFitnessLayerFromMapOutput(
  output: MapOutput,
): UrbanDataFitnessLayerInput {
  const result: UrbanDataFitnessLayerInput = {
    id: output.id,
    name: output.layerName ?? output.title,
  };
  if (output.engineBridge?.geometryType) result.geometryType = output.engineBridge.geometryType;
  const featureCount = featureCountFromGeoJson(output.geojson);
  if (featureCount !== null) result.featureCount = featureCount;
  const fields = fieldsFromGeoJson(output.geojson);
  if (fields.length) result.fields = fields;
  const temporalDate = normalizeDate(output.engineBridge?.runTimestamp);
  if (temporalDate) result.temporalDate = temporalDate;
  result.sourceKind = 'derived';
  result.license = 'Derived analysis output';
  return result;
}

function collectLayers(input: UrbanDataFitnessComputationInput): UrbanDataFitnessLayerInput[] {
  const layers = [...(input.layers ?? [])];
  for (const run of input.runs ?? []) {
    layers.push(...run.mapOutputs.map(extractUrbanDataFitnessLayerFromMapOutput));
  }
  return layers;
}

function layerIds(layers: readonly UrbanDataFitnessLayerInput[]): string[] {
  return unique(layers.map((layer) => layer.id));
}

function mapQAIssuesForLayers(
  mapQA: MapScientificQAState | null | undefined,
  ids: readonly string[],
): MapScientificQAState['issues'] {
  if (!mapQA) return [];
  const layerIdSet = new Set(ids);
  return mapQA.issues.filter((issue) => !issue.layerId || layerIdSet.has(issue.layerId));
}

function evaluateGeometry(
  layers: readonly UrbanDataFitnessLayerInput[],
  requiredGeometryTypes: readonly MapScientificQAGeometryFamily[],
  mapQA: MapScientificQAState | null | undefined,
  issues: UrbanDataFitnessIssue[],
  missingInputs: string[],
  blockedReasons: string[],
): UrbanDataFitnessDimension<UrbanDataFitnessProfile['geometryFit']> {
  if (layers.length === 0) {
    missingInputs.push('layer metadata');
    addIssue(issues, {
      code: 'missing_layer_metadata',
      category: 'geometry',
      severity: 'unknown',
      message: 'No layer metadata is available to evaluate geometry fitness.',
    });
    return dimension('unknown', 'unknown', null, ['Layer geometry metadata is unavailable.']);
  }

  const ids = layerIds(layers);
  const relatedQAIssues = mapQAIssuesForLayers(mapQA, ids);
  const invalidLayer = layers.find((layer) =>
    layer.qaStatus === 'error' || layer.qaBadges?.includes('invalid_geometry'),
  );
  const invalidQAIssue = relatedQAIssues.find((issue) =>
    issue.category === 'geometry' && (issue.severity === 'error' || issue.severity === 'blocker'),
  );
  if (invalidLayer || invalidQAIssue) {
    const reason = invalidQAIssue?.explanation ?? `${invalidLayer?.name ?? invalidLayer?.id ?? 'A layer'} has invalid geometry QA.`;
    blockedReasons.push(reason);
    addIssue(issues, {
      code: 'invalid_geometry',
      category: 'geometry',
      severity: 'blocked',
      message: reason,
      ...(invalidLayer ? { layerId: invalidLayer.id } : {}),
    });
    return dimension('blocked', 'invalid', 0, [reason]);
  }

  const families = layers.map((layer) => geometryFamilyFromText(layer.geometryType));
  if (families.some((family) => family === 'unknown')) {
    missingInputs.push('geometry type metadata');
    addIssue(issues, {
      code: 'unknown_geometry_type',
      category: 'geometry',
      severity: 'unknown',
      message: 'One or more input layers do not expose geometry type metadata.',
    });
    return dimension('unknown', 'unknown', null, ['Geometry type is missing for at least one input layer.']);
  }

  if (requiredGeometryTypes.length) {
    const mismatch = families.find((family) =>
      family !== 'mixed' && !requiredGeometryTypes.includes(family),
    );
    if (mismatch) {
      const message = `Required geometry is ${requiredGeometryTypes.join(' or ')}, but an input layer is ${mismatch}.`;
      blockedReasons.push(message);
      addIssue(issues, {
        code: 'geometry_type_mismatch',
        category: 'geometry',
        severity: 'blocked',
        message,
      });
      return dimension('blocked', 'invalid', 0, [message]);
    }
  }

  const warningQAIssue = relatedQAIssues.find((issue) => issue.category === 'geometry' && issue.severity === 'warning');
  if (warningQAIssue) {
    addIssue(issues, {
      code: 'geometry_warning',
      category: 'geometry',
      severity: 'warning',
      message: warningQAIssue.explanation,
    });
    return dimension('warning', 'limited', 65, [warningQAIssue.explanation]);
  }

  return dimension('ready', requiredGeometryTypes.length ? 'excellent' : 'usable', 100, []);
}

function isKnownCrs(value: string): boolean {
  return /^EPSG:\d+$/i.test(value) || /^OGC:CRS84$/i.test(value);
}

function isGeographicCrs(value: string): boolean {
  return /^EPSG:4326$/i.test(value) || /^OGC:CRS84$/i.test(value);
}

function evaluateCrs(
  layers: readonly UrbanDataFitnessLayerInput[],
  mapQA: MapScientificQAState | null | undefined,
  issues: UrbanDataFitnessIssue[],
  missingInputs: string[],
  blockedReasons: string[],
): UrbanDataFitnessDimension<UrbanDataFitnessProfile['crsFit']> {
  if (layers.length === 0) {
    missingInputs.push('CRS metadata');
    return dimension('unknown', 'unknown', null, ['No layer is available for CRS evaluation.']);
  }

  const crsValues = layers.map((layer) => layer.crs?.trim()).filter((value): value is string => Boolean(value));
  if (crsValues.length < layers.length) {
    missingInputs.push('CRS metadata');
    addIssue(issues, {
      code: 'missing_crs',
      category: 'crs',
      severity: 'unknown',
      message: 'At least one input layer is missing CRS metadata.',
    });
    return dimension('unknown', 'missing', null, ['Missing CRS metadata prevents confident measurement or overlay interpretation.']);
  }

  const normalized = unique(crsValues.map((value) => value.toUpperCase()));
  const crsMismatchIssue = mapQAIssuesForLayers(mapQA, layerIds(layers)).find((issue) =>
    issue.code.includes('crs_mismatch') || issue.code === 'visible_crs_mismatch',
  );
  if (normalized.length > 1 || crsMismatchIssue) {
    const message = crsMismatchIssue?.explanation ?? `Input layers declare mismatched CRS values: ${normalized.join(', ')}.`;
    blockedReasons.push(message);
    addIssue(issues, {
      code: 'crs_mismatch',
      category: 'crs',
      severity: 'blocked',
      message,
    });
    return dimension('blocked', 'mismatch', 0, [message]);
  }

  const crs = normalized[0]!;
  if (!isKnownCrs(crs)) {
    addIssue(issues, {
      code: 'unknown_crs',
      category: 'crs',
      severity: 'warning',
      message: `CRS value "${crs}" is present but not normalized to a recognized EPSG or OGC identifier.`,
    });
    return dimension('warning', 'available', 65, [`CRS "${crs}" is present but should be normalized.`]);
  }

  if (isGeographicCrs(crs)) {
    addIssue(issues, {
      code: 'geographic_crs_for_analysis',
      category: 'crs',
      severity: 'warning',
      message: `${crs} is geographic; distance or area methods need projected measurement handling.`,
    });
    return dimension('warning', 'geographic', 75, [`${crs} is documented but geographic.`]);
  }

  const userDeclaredCrs = layers.some((layer) => layer.crsUserDeclared && Boolean(layer.crs));
  if (userDeclaredCrs) {
    addIssue(issues, {
      code: 'user_declared_crs',
      category: 'crs',
      severity: 'warning',
      message: `CRS ${crs} is user-declared and not verified from source metadata; treat distance and area results as caveated.`,
    });
    return dimension('warning', 'projected', 70, [`${crs} is user-declared (caveat); not verified from source metadata.`]);
  }

  return dimension('ready', 'projected', 100, [`${crs} is documented.`]);
}

function evaluateTemporal(
  layers: readonly UrbanDataFitnessLayerInput[],
  requiresTemporalCoverage: boolean,
  computedAt: string,
  issues: UrbanDataFitnessIssue[],
  missingInputs: string[],
): UrbanDataFitnessDimension<UrbanDataFitnessProfile['temporalFit']> {
  if (!requiresTemporalCoverage) {
    return dimension('ready', 'not-required', 100, ['Temporal coverage is not required for this profile.']);
  }

  const dates = layers
    .map((layer) => normalizeDate(layer.temporalDate))
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date).getTime());
  if (dates.length < layers.length || dates.length === 0) {
    missingInputs.push('temporal coverage metadata');
    addIssue(issues, {
      code: 'missing_temporal_metadata',
      category: 'temporal',
      severity: 'unknown',
      message: 'Temporal coverage is required but one or more layers have no usable timestamp.',
    });
    return dimension('unknown', 'unknown', null, ['Temporal coverage metadata is incomplete.']);
  }

  const spanDays = (Math.max(...dates) - Math.min(...dates)) / 86_400_000;
  if (spanDays > STALE_AFTER_DAYS) {
    addIssue(issues, {
      code: 'mixed_temporal_coverage',
      category: 'temporal',
      severity: 'warning',
      message: `Input layer timestamps span about ${Math.round(spanDays)} days.`,
      detail: { spanDays: Math.round(spanDays) },
    });
    return dimension('warning', 'mixed', 65, ['Input dates span more than one year.']);
  }

  const ageDays = (new Date(computedAt).getTime() - Math.max(...dates)) / 86_400_000;
  if (ageDays > STALE_AFTER_DAYS) {
    addIssue(issues, {
      code: 'stale_temporal_coverage',
      category: 'temporal',
      severity: 'warning',
      message: `Most recent input timestamp is about ${Math.round(ageDays)} days old.`,
      detail: { ageDays: Math.round(ageDays) },
    });
    return dimension('warning', 'stale', 60, ['Input data is older than one year.']);
  }

  return dimension('ready', 'current', 100, []);
}

function evaluateMissingness(
  layers: readonly UrbanDataFitnessLayerInput[],
  issues: UrbanDataFitnessIssue[],
  missingInputs: string[],
): UrbanDataFitnessDimension<UrbanDataFitnessProfile['completenessFit']> {
  const known = layers
    .map((layer) => ({
      missing: normalizeNumber(layer.missingValueCount),
      total: normalizeNumber(layer.totalValueCount),
    }))
    .filter((entry): entry is { missing: number; total: number } => entry.missing !== null && entry.total !== null);

  if (known.length === 0) {
    missingInputs.push('missingness metadata');
    addIssue(issues, {
      code: 'missing_missingness_metadata',
      category: 'missingness',
      severity: 'unknown',
      message: 'No missing-value counts are available for input data.',
    });
    return dimension('unknown', 'unknown', null, ['Missingness has not been evaluated.']);
  }

  const missing = known.reduce((sum, entry) => sum + entry.missing, 0);
  const total = known.reduce((sum, entry) => sum + entry.total, 0);
  if (total <= 0) {
    addIssue(issues, {
      code: 'invalid_missingness_denominator',
      category: 'missingness',
      severity: 'blocked',
      message: 'Missingness denominator is zero or invalid.',
    });
    return dimension('blocked', 'major-gaps', 0, ['Missingness denominator is invalid.']);
  }

  const ratio = missing / total;
  if (ratio === 0) return dimension('ready', 'complete', 100, []);
  if (ratio <= 0.05) {
    return dimension('warning', 'minor-gaps', 85, [`Missingness is ${(ratio * 100).toFixed(1)}%.`]);
  }
  if (ratio <= 0.2) {
    return dimension('warning', 'minor-gaps', 65, [`Missingness is ${(ratio * 100).toFixed(1)}%.`]);
  }
  return dimension('blocked', 'major-gaps', 20, [`Missingness is ${(ratio * 100).toFixed(1)}%.`]);
}

const SCALE_ORDER: UrbanScale[] = [
  'parcel',
  'block',
  'neighborhood',
  'district',
  'city',
  'metropolitan',
  'regional',
  'national',
];

function evaluateScale(
  analysisScale: UrbanScale | null | undefined,
  sourceScale: UrbanScale | null | undefined,
  layers: readonly UrbanDataFitnessLayerInput[],
  issues: UrbanDataFitnessIssue[],
  missingInputs: string[],
  blockedReasons: string[],
): UrbanDataFitnessDimension<UrbanDataFitnessProfile['scaleFit']> {
  const resolvedSourceScale = sourceScale ?? layers.find((layer) => layer.scale)?.scale ?? null;
  if (!analysisScale || !resolvedSourceScale) {
    missingInputs.push('scale suitability metadata');
    addIssue(issues, {
      code: 'missing_scale_metadata',
      category: 'scale',
      severity: 'unknown',
      message: 'Analysis scale or source scale is unavailable.',
    });
    return dimension('unknown', 'unknown', null, ['Scale suitability cannot be evaluated from available metadata.']);
  }

  const analysisIndex = SCALE_ORDER.indexOf(analysisScale);
  const sourceIndex = SCALE_ORDER.indexOf(resolvedSourceScale);
  if (analysisIndex === sourceIndex) {
    return dimension('ready', 'native', 100, [`Source and analysis scale are both ${analysisScale}.`]);
  }
  if (sourceIndex < analysisIndex) {
    return dimension('warning', 'aggregated', 80, [`${resolvedSourceScale} data will be aggregated to ${analysisScale}.`]);
  }

  const message = `${resolvedSourceScale} data is too coarse for ${analysisScale} analysis without downscaling assumptions.`;
  blockedReasons.push(message);
  addIssue(issues, {
    code: 'scale_mismatch',
    category: 'scale',
    severity: 'blocked',
    message,
  });
  return dimension('blocked', 'mismatch', 20, [message]);
}

function evaluateLicense(
  layers: readonly UrbanDataFitnessLayerInput[],
  requiresLicense: boolean,
  issues: UrbanDataFitnessIssue[],
  missingInputs: string[],
): UrbanDataFitnessDimension<UrbanDataFitnessProfile['licenseStatus']> {
  const demoLayer = layers.find((layer) => layer.sourceKind === 'demo');
  if (demoLayer) {
    addIssue(issues, {
      code: 'demo_data',
      category: 'license',
      severity: 'warning',
      message: `${demoLayer.name ?? demoLayer.id} is marked as demo/sample data.`,
      layerId: demoLayer.id,
    });
    return dimension('warning', 'demo', 60, ['Demo/sample data must be labeled in outputs.']);
  }

  const licenses = layers.map((layer) => layer.license?.trim()).filter((value): value is string => Boolean(value));
  if (licenses.length < layers.length) {
    missingInputs.push('license metadata');
    addIssue(issues, {
      code: 'missing_license',
      category: 'license',
      severity: requiresLicense ? 'unknown' : 'warning',
      message: 'One or more input layers are missing license metadata.',
    });
    return dimension(requiresLicense ? 'unknown' : 'warning', 'missing', requiresLicense ? null : 65, [
      'License metadata is incomplete.',
    ]);
  }

  const restricted = licenses.find((license) => /restricted|proprietary|internal|non[- ]?commercial/i.test(license));
  if (restricted) {
    addIssue(issues, {
      code: 'restricted_license',
      category: 'license',
      severity: 'warning',
      message: `License "${restricted}" may restrict publication or reuse.`,
    });
    return dimension('warning', 'restricted', 60, [`Review license "${restricted}" before publication.`]);
  }

  return dimension('ready', 'clear', 100, []);
}

function evaluateRuntimeMode(
  layers: readonly UrbanDataFitnessLayerInput[],
  issues: UrbanDataFitnessIssue[],
  missingInputs: string[],
  uncertaintyNotes: string[],
): UrbanDataFitnessStatus {
  const syntheticLayer = layers.find((layer) => layer.runtimeMode === 'synthetic');
  if (syntheticLayer) {
    addIssue(issues, {
      code: 'synthetic_data',
      category: 'lineage',
      severity: 'warning',
      message: `${syntheticLayer.name ?? syntheticLayer.id} is marked as synthetic data and is not production-ready evidence.`,
      layerId: syntheticLayer.id,
    });
    uncertaintyNotes.push('Synthetic data remains labelled and cannot be treated as production-ready evidence.');
    return 'warning';
  }

  const demoLayer = layers.find((layer) => layer.runtimeMode === 'demo' || layer.sourceKind === 'demo');
  if (demoLayer) {
    uncertaintyNotes.push('Demo/sample data remains labelled and cannot be treated as production-ready evidence.');
    return 'warning';
  }

  const unknownLayer = layers.find((layer) => layer.runtimeMode === 'unknown');
  if (unknownLayer) {
    missingInputs.push('runtime mode metadata');
    addIssue(issues, {
      code: 'unknown_runtime_mode',
      category: 'lineage',
      severity: 'unknown',
      message: `${unknownLayer.name ?? unknownLayer.id} has unknown runtime mode; readiness cannot be confirmed.`,
      layerId: unknownLayer.id,
    });
    uncertaintyNotes.push('Unknown runtime mode remains unresolved; do not treat this context as production-ready.');
    return 'unknown';
  }

  return 'ready';
}

function evaluateSampleSize(
  layers: readonly UrbanDataFitnessLayerInput[],
  minimumFeatureCount: number | undefined,
  issues: UrbanDataFitnessIssue[],
  missingInputs: string[],
  blockedReasons: string[],
): UrbanDataFitnessSampleSize {
  const counts = layers
    .map((layer) => normalizeNumber(layer.featureCount))
    .filter((count): count is number => count !== null);
  const totalFeatureCount = counts.length > 0 ? counts.reduce((sum, count) => sum + count, 0) : null;
  const minimumRequired = minimumFeatureCount ?? null;

  if (totalFeatureCount === null) {
    missingInputs.push('feature count');
    addIssue(issues, {
      code: 'missing_feature_count',
      category: 'sample-size',
      severity: 'unknown',
      message: 'Feature count or sample size is unavailable.',
    });
    return {
      status: 'unknown',
      featureCount: null,
      minimumRequired,
      notes: ['Feature count is unavailable.'],
    };
  }

  if (totalFeatureCount <= 0) {
    const message = 'Input feature count is zero.';
    blockedReasons.push(message);
    addIssue(issues, {
      code: 'empty_sample',
      category: 'sample-size',
      severity: 'blocked',
      message,
    });
    return { status: 'blocked', featureCount: totalFeatureCount, minimumRequired, notes: [message] };
  }

  if (minimumRequired != null && totalFeatureCount < minimumRequired) {
    const message = `Input feature count ${totalFeatureCount} is below required minimum ${minimumRequired}.`;
    blockedReasons.push(message);
    addIssue(issues, {
      code: 'minimum_feature_count_not_met',
      category: 'sample-size',
      severity: 'blocked',
      message,
      detail: { featureCount: totalFeatureCount, minimumRequired },
    });
    return { status: 'blocked', featureCount: totalFeatureCount, minimumRequired, notes: [message] };
  }

  return {
    status: 'ready',
    featureCount: totalFeatureCount,
    minimumRequired,
    notes: [],
  };
}

function evaluateFields(
  layers: readonly UrbanDataFitnessLayerInput[],
  requiredFields: readonly string[],
  issues: UrbanDataFitnessIssue[],
  missingInputs: string[],
  blockedReasons: string[],
): UrbanDataFitnessFieldAvailability {
  const required = unique([...requiredFields]);
  const present = unique(layers.flatMap((layer) => layer.fields ?? []));
  if (required.length === 0) {
    return {
      status: 'ready',
      requiredFields: [],
      presentFields: present,
      missingFields: [],
      notes: ['No required fields were declared for this profile.'],
    };
  }

  if (present.length === 0) {
    missingInputs.push('field list metadata');
    addIssue(issues, {
      code: 'missing_field_metadata',
      category: 'fields',
      severity: 'unknown',
      message: 'Required fields are declared, but no layer field list is available.',
    });
    return {
      status: 'unknown',
      requiredFields: required,
      presentFields: [],
      missingFields: required,
      notes: ['Layer field metadata is unavailable.'],
    };
  }

  const presentSet = new Set(present.map((field) => field.toLowerCase()));
  const missing = required.filter((field) => !presentSet.has(field.toLowerCase()));
  if (missing.length > 0) {
    const message = `Missing required field(s): ${missing.join(', ')}.`;
    blockedReasons.push(message);
    missing.forEach((field) => addIssue(issues, {
      code: 'missing_required_field',
      category: 'fields',
      severity: 'blocked',
      message,
      field,
    }));
    return {
      status: 'blocked',
      requiredFields: required,
      presentFields: present,
      missingFields: missing,
      notes: [message],
    };
  }

  return {
    status: 'ready',
    requiredFields: required,
    presentFields: present,
    missingFields: [],
    notes: [],
  };
}

function statusFromParts(parts: readonly UrbanDataFitnessStatus[]): UrbanDataFitnessStatus {
  if (parts.includes('blocked')) return 'blocked';
  if (parts.includes('unknown')) return 'unknown';
  if (parts.includes('warning')) return 'warning';
  return 'ready';
}

function gradeFromScore(score: number | null): UrbanDataFitnessGrade {
  if (score == null) return 'unknown';
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

function componentScore(...scores: Array<number | null>): number | null {
  const known = scores.filter((score): score is number => score !== null);
  if (known.length !== scores.length || known.length === 0) return null;
  return known.reduce((sum, score) => sum + score, 0) / known.length;
}

function computeScore(input: {
  geometry: UrbanDataFitnessDimension;
  crs: UrbanDataFitnessDimension;
  temporal: UrbanDataFitnessDimension;
  missingness: UrbanDataFitnessDimension;
  scale: UrbanDataFitnessDimension;
  sample: UrbanDataFitnessSampleSize;
  fields: UrbanDataFitnessFieldAvailability;
  license: UrbanDataFitnessDimension;
  status: UrbanDataFitnessStatus;
}): number | null {
  if (input.status === 'unknown') return null;
  const sampleScore = input.sample.status === 'ready' ? 100 : input.sample.status === 'warning' ? 70 : 0;
  const fieldScore = input.fields.status === 'ready' ? 100 : input.fields.status === 'warning' ? 70 : 0;
  const attributeScore = componentScore(sampleScore, fieldScore);
  if (
    input.geometry.score == null ||
    input.crs.score == null ||
    input.temporal.score == null ||
    input.missingness.score == null ||
    input.scale.score == null ||
    attributeScore == null
  ) {
    return null;
  }

  let score = (
    input.geometry.score * SCORE_WEIGHTS.geometry +
    input.crs.score * SCORE_WEIGHTS.crs +
    attributeScore * SCORE_WEIGHTS.attributes +
    input.temporal.score * SCORE_WEIGHTS.temporal +
    input.missingness.score * SCORE_WEIGHTS.completeness +
    input.scale.score * SCORE_WEIGHTS.scale
  ) / 100;

  if (input.license.status === 'warning') score = Math.min(score, 85);
  if (input.license.fit === 'demo') score = Math.min(score, 65);
  return Math.round(score);
}

export function computeUrbanDataFitnessProfile(
  input: UrbanDataFitnessComputationInput,
): UrbanDataFitnessProfile {
  const computedAt = normalizeDate(input.computedAt) ?? nowIso();
  const layers = collectLayers(input);
  const issues: UrbanDataFitnessIssue[] = [];
  const missingInputs: string[] = [];
  const blockedReasons: string[] = [];
  const uncertaintyNotes = unique([...(input.uncertaintyNotes ?? [])]);
  const requiredGeometryTypes = input.requiredGeometryTypes ?? [];
  const requiredFields = input.requiredFields ?? [];

  const geometry = evaluateGeometry(layers, requiredGeometryTypes, input.mapQA, issues, missingInputs, blockedReasons);
  const crs = evaluateCrs(layers, input.mapQA, issues, missingInputs, blockedReasons);
  const temporalCoverage = evaluateTemporal(
    layers,
    input.requiresTemporalCoverage ?? false,
    computedAt,
    issues,
    missingInputs,
  );
  const missingness = evaluateMissingness(layers, issues, missingInputs);
  const scaleSuitability = evaluateScale(
    input.analysisScale,
    input.sourceScale,
    layers,
    issues,
    missingInputs,
    blockedReasons,
  );
  const license = evaluateLicense(layers, input.requiresLicense ?? true, issues, missingInputs);
  const runtimeModeStatus = evaluateRuntimeMode(layers, issues, missingInputs, uncertaintyNotes);
  const sampleSize = evaluateSampleSize(layers, input.minimumFeatureCount, issues, missingInputs, blockedReasons);
  const fieldAvailability = evaluateFields(layers, requiredFields, issues, missingInputs, blockedReasons);

  for (const layer of layers) {
    if (layer.qaCaveats?.length) {
      uncertaintyNotes.push(...layer.qaCaveats);
    }
  }

  const status = statusFromParts([
    geometry.status,
    crs.status,
    temporalCoverage.status,
    missingness.status,
    scaleSuitability.status,
    license.status,
    runtimeModeStatus,
    sampleSize.status,
    fieldAvailability.status,
  ]);
  const baseScore = computeScore({
    geometry,
    crs,
    temporal: temporalCoverage,
    missingness,
    scale: scaleSuitability,
    sample: sampleSize,
    fields: fieldAvailability,
    license,
    status,
  });
  const containsNonProductionRuntime = layers.some((layer) =>
    layer.runtimeMode === 'demo' || layer.runtimeMode === 'synthetic' || layer.sourceKind === 'demo',
  );
  const score = containsNonProductionRuntime && baseScore !== null
    ? Math.min(baseScore, 65)
    : baseScore;

  return {
    status,
    grade: gradeFromScore(score),
    score,
    geometryFit: geometry.fit,
    crsFit: crs.fit,
    temporalFit: temporalCoverage.fit,
    completenessFit: missingness.fit,
    scaleFit: scaleSuitability.fit,
    licenseStatus: license.fit,
    geometry,
    crs,
    temporalCoverage,
    missingness,
    scaleSuitability,
    license,
    sampleSize,
    fieldAvailability,
    blockedReasons: unique(blockedReasons),
    missingInputs: unique(missingInputs),
    uncertaintyNotes: unique(uncertaintyNotes),
    issues,
    sourceLayerIds: layerIds(layers),
    sourceRunIds: unique((input.runs ?? []).map((run) => run.runId)),
    computedAt,
  };
}
