import { busTimestamp, synapseBus } from '@/services/synapseBus';
import type {
  EvidenceArtifactRegisterPayload,
  SynapseBusSubscription,
} from '@/types/synapse-bus';
import { useUrbanStore } from '../store';
import { useUrbanContextStore } from '../useUrbanContextStore';
import type {
  AnalyticalFlowId,
  UrbanAnalysisContext,
  UrbanEvidenceArtifactKind,
  UrbanEvidenceScalar,
  UrbanEvidenceSourceModule,
  UrbanIdeArtifactKind,
  UrbanIdeArtifactLanguage,
  UrbanIdeArtifactManifestMetadata,
  UrbanIdeArtifactRecommendation,
  UrbanIdeArtifactRecognitionPayload,
  UrbanIdeArtifactRecognitionResult,
  UrbanIdeArtifactRecognitionStatus,
  UrbanWorkflowRuntimeMode,
} from '../lib/types';

const MAX_FILE_PATH_LENGTH = 1024;
const MAX_TEXT_LENGTH = 240;
const MAX_REFERENCE_COUNT = 64;
const URBAN_IDE_INBOX_LIMIT = 32;

const IDE_REFERENCE_LIMITATION =
  'Urban Analytics stores only the file reference and scalar metadata; it does not read or mutate Synapse IDE buffers.';

const ANALYTICAL_FLOW_VALUES = [
  'site_suitability',
  'accessibility',
  'vulnerability',
  'emerging_hot_spot',
  'object_detection',
  'indicator_composite',
  'scenario_comparison',
  'equity_audit',
  'change_detection',
  'urban_growth_ca',
  'facility_optimisation',
  'system_dynamics',
  'walkability',
  'fifteen_min_city',
  'urban_morphology',
  'transit_gap',
  'heat_island',
  'green_deficit',
  'voxcity_3d',
  'cityjson_loader',
  'sunlight_sim',
  'review',
] as const satisfies readonly AnalyticalFlowId[];

const RUNTIME_MODE_VALUES = ['live', 'demo', 'synthetic', 'unknown'] as const satisfies readonly UrbanWorkflowRuntimeMode[];

const ARTIFACT_KIND_VALUES = [
  'urban-manifest',
  'geojson-layer',
  'notebook',
  'python-script',
  'sql-query',
  'project-manifest',
  'unsupported',
] as const satisfies readonly UrbanIdeArtifactKind[];

const LANGUAGE_VALUES = [
  'python',
  'json',
  'markdown',
  'typescript',
  'sql',
  'ipynb',
  'geojson',
  'yaml',
  'plaintext',
  'unknown',
] as const satisfies readonly UrbanIdeArtifactLanguage[];

const PROJECT_MANIFEST_FILENAMES = new Set([
  'manifest.json',
  'project.manifest.json',
  'workflow.manifest.json',
  'urban.manifest.json',
  'synapse.manifest.json',
  'synapse.json',
]);

interface UrbanIdeArtifactClassification {
  status: UrbanIdeArtifactRecognitionStatus;
  artifactKind: UrbanIdeArtifactKind;
  language: UrbanIdeArtifactLanguage;
  normalizedPath: string;
  filename: string;
  extension: string;
  warnings: string[];
  reason?: string;
}

export type UrbanIdeArtifactIncomingEvent = {
  kind: 'evidence.register';
  receivedAt: string;
  payload: EvidenceArtifactRegisterPayload;
  result: UrbanIdeArtifactRecognitionResult;
};

const inbox: UrbanIdeArtifactIncomingEvent[] = [];
const inboxListeners = new Set<(event: UrbanIdeArtifactIncomingEvent) => void>();
const busSubscriptions: SynapseBusSubscription[] = [];
let installed = false;

function clipText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== 'string') return '';
  const text = value.trim().replace(/\s+/g, ' ');
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeFilePath(value: string): string {
  return value.trim().replace(/\\/g, '/').replace(/^\/+/, '');
}

function filenameFromPath(path: string): string {
  const parts = normalizeFilePath(path).split('/');
  return parts[parts.length - 1] || path;
}

function extensionFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.urban.json')) return '.urban.json';
  const dot = lower.lastIndexOf('.');
  return dot === -1 ? '' : lower.slice(dot);
}

function isAnalyticalFlowId(value: unknown): value is AnalyticalFlowId {
  return ANALYTICAL_FLOW_VALUES.includes(value as AnalyticalFlowId);
}

function normalizeFlowId(value: unknown): AnalyticalFlowId | undefined {
  return isAnalyticalFlowId(value) ? value : undefined;
}

function normalizeRuntimeMode(value: unknown): UrbanWorkflowRuntimeMode | undefined {
  return RUNTIME_MODE_VALUES.includes(value as UrbanWorkflowRuntimeMode)
    ? value as UrbanWorkflowRuntimeMode
    : undefined;
}

function normalizeArtifactKind(value: unknown): UrbanIdeArtifactKind | undefined {
  return ARTIFACT_KIND_VALUES.includes(value as UrbanIdeArtifactKind)
    ? value as UrbanIdeArtifactKind
    : undefined;
}

function normalizeLanguage(value: unknown, fallback: UrbanIdeArtifactLanguage): UrbanIdeArtifactLanguage {
  if (typeof value !== 'string') return fallback;
  const lower = value.trim().toLowerCase();
  if (lower === 'py') return 'python';
  if (lower === 'ts') return 'typescript';
  if (lower === 'md') return 'markdown';
  if (LANGUAGE_VALUES.includes(lower as UrbanIdeArtifactLanguage)) {
    return lower as UrbanIdeArtifactLanguage;
  }
  return fallback;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of value) {
    const text = clipText(item);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
    if (output.length >= MAX_REFERENCE_COUNT) break;
  }
  return output;
}

function normalizeManifestMetadata(input: unknown): UrbanIdeArtifactManifestMetadata | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const record = input as Record<string, unknown>;
  const metadata: UrbanIdeArtifactManifestMetadata = {};

  const schemaVersion = clipText(record.schemaVersion, 80);
  if (schemaVersion) metadata.schemaVersion = schemaVersion;
  const contextId = clipText(record.contextId);
  if (contextId) metadata.contextId = contextId;
  const runId = clipText(record.runId);
  if (runId) metadata.runId = runId;
  const runIds = normalizeStringList(record.runIds);
  if (runIds.length > 0) metadata.runIds = runIds;
  const flowId = normalizeFlowId(record.flowId);
  if (flowId) metadata.flowId = flowId;
  const methodId = clipText(record.methodId);
  if (methodId) metadata.methodId = methodId;
  const methodName = clipText(record.methodName);
  if (methodName) metadata.methodName = methodName;
  const runtimeMode = normalizeRuntimeMode(record.runtimeMode);
  if (runtimeMode) metadata.runtimeMode = runtimeMode;
  const studyAreaId = clipText(record.studyAreaId);
  if (studyAreaId) metadata.studyAreaId = studyAreaId;
  const studyAreaName = clipText(record.studyAreaName);
  if (studyAreaName) metadata.studyAreaName = studyAreaName;

  const layerIds = normalizeStringList(record.layerIds);
  if (layerIds.length > 0) metadata.layerIds = layerIds;
  const evidenceIds = normalizeStringList(record.evidenceIds);
  if (evidenceIds.length > 0) metadata.evidenceIds = evidenceIds;
  const codeArtifactIds = normalizeStringList(record.codeArtifactIds);
  if (codeArtifactIds.length > 0) metadata.codeArtifactIds = codeArtifactIds;
  const mapArtifactIds = normalizeStringList(record.mapArtifactIds);
  if (mapArtifactIds.length > 0) metadata.mapArtifactIds = mapArtifactIds;
  const artifactIds = normalizeStringList(record.artifactIds);
  if (artifactIds.length > 0) metadata.artifactIds = artifactIds;

  const summary = clipText(record.summary, 600);
  if (summary) metadata.summary = summary;
  const createdAt = clipText(record.createdAt, 80);
  if (createdAt) metadata.createdAt = createdAt;
  const generatedAt = clipText(record.generatedAt, 80);
  if (generatedAt) metadata.generatedAt = generatedAt;

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function stableHash(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const text = clipText(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
    if (output.length >= MAX_REFERENCE_COUNT) break;
  }
  return output;
}

function inferKindAndLanguage(
  filename: string,
  metadata: UrbanIdeArtifactManifestMetadata | undefined,
): Pick<UrbanIdeArtifactClassification, 'artifactKind' | 'language' | 'extension'> {
  const lower = filename.toLowerCase();
  const extension = extensionFromFilename(filename);

  if (lower.endsWith('.urban.json')) {
    return { artifactKind: 'urban-manifest', language: 'json', extension };
  }
  if (extension === '.geojson') {
    return { artifactKind: 'geojson-layer', language: 'geojson', extension };
  }
  if (extension === '.ipynb') {
    return { artifactKind: 'notebook', language: 'ipynb', extension };
  }
  if (extension === '.py') {
    return { artifactKind: 'python-script', language: 'python', extension };
  }
  if (extension === '.sql') {
    return { artifactKind: 'sql-query', language: 'sql', extension };
  }
  if (
    extension === '.json'
    && (metadata || PROJECT_MANIFEST_FILENAMES.has(lower) || lower.endsWith('.manifest.json'))
  ) {
    return { artifactKind: 'project-manifest', language: 'json', extension };
  }
  if (extension === '.yaml' || extension === '.yml') {
    return { artifactKind: 'project-manifest', language: 'yaml', extension };
  }

  return { artifactKind: 'unsupported', language: 'unknown', extension };
}

export function classifyUrbanIdeArtifact(
  payload: UrbanIdeArtifactRecognitionPayload,
): UrbanIdeArtifactClassification {
  const warnings: string[] = [];
  if (typeof payload.filePath !== 'string') {
    return {
      status: 'invalid',
      artifactKind: 'unsupported',
      language: 'unknown',
      normalizedPath: '',
      filename: '',
      extension: '',
      warnings,
      reason: 'Incoming IDE artifact reference is missing a file path.',
    };
  }

  const normalizedPath = normalizeFilePath(payload.filePath);
  if (!normalizedPath) {
    return {
      status: 'invalid',
      artifactKind: 'unsupported',
      language: 'unknown',
      normalizedPath,
      filename: '',
      extension: '',
      warnings,
      reason: 'Incoming IDE artifact reference is missing a file path.',
    };
  }
  if (normalizedPath.length > MAX_FILE_PATH_LENGTH || normalizedPath.includes('\0')) {
    return {
      status: 'invalid',
      artifactKind: 'unsupported',
      language: 'unknown',
      normalizedPath,
      filename: filenameFromPath(normalizedPath),
      extension: extensionFromFilename(normalizedPath),
      warnings,
      reason: 'Incoming IDE artifact file path is invalid or too long.',
    };
  }

  const metadata = normalizeManifestMetadata(payload.manifestMetadata);
  const filename = filenameFromPath(normalizedPath);
  const inferred = inferKindAndLanguage(filename, metadata);
  const explicitKind = normalizeArtifactKind(payload.artifactKind);
  const artifactKind = explicitKind ?? inferred.artifactKind;
  const language = normalizeLanguage(payload.language, inferred.language);

  if (explicitKind && explicitKind !== inferred.artifactKind && inferred.artifactKind !== 'unsupported') {
    warnings.push(`IDE artifact kind hint "${explicitKind}" differs from file extension inference "${inferred.artifactKind}".`);
  }

  if (artifactKind === 'unsupported') {
    return {
      status: 'unsupported',
      artifactKind,
      language,
      normalizedPath,
      filename,
      extension: inferred.extension,
      warnings,
      reason: `Unsupported IDE artifact type for "${filename}".`,
    };
  }

  return {
    status: 'recognized',
    artifactKind,
    language,
    normalizedPath,
    filename,
    extension: inferred.extension,
    warnings,
  };
}

function evidenceKindFor(
  artifactKind: UrbanIdeArtifactKind,
  runIds: readonly string[],
): UrbanEvidenceArtifactKind {
  if (artifactKind === 'geojson-layer') return 'dataset';
  if (artifactKind === 'urban-manifest' && runIds.length > 0) return 'workflow-run';
  return 'code-artifact';
}

function codeArtifactIdFor(
  artifactKind: UrbanIdeArtifactKind,
  path: string,
  metadata: UrbanIdeArtifactManifestMetadata | undefined,
): string | null {
  const explicit = metadata?.codeArtifactIds?.[0];
  if (explicit) return explicit;
  if (artifactKind === 'python-script' || artifactKind === 'sql-query' || artifactKind === 'notebook') {
    return `ide-code-${stableHash(path)}`;
  }
  if (artifactKind === 'urban-manifest' || artifactKind === 'project-manifest') {
    return `ide-manifest-${stableHash(path)}`;
  }
  return null;
}

function formatFlowLabel(flowId: AnalyticalFlowId): string {
  return flowId
    .split('_')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function inferFlowFromText(text: string): AnalyticalFlowId | null {
  const lower = text.toLowerCase();
  const keywordRules: Array<{ flowId: AnalyticalFlowId; tokens: string[] }> = [
    { flowId: 'urban_morphology', tokens: ['morphology', 'footprint', 'building', 'height', 'block'] },
    { flowId: 'accessibility', tokens: ['access', 'isochrone', 'amenity', 'service-area'] },
    { flowId: 'walkability', tokens: ['walk', 'sidewalk', 'pedestrian'] },
    { flowId: 'transit_gap', tokens: ['transit', 'gtfs', 'bus', 'metro'] },
    { flowId: 'heat_island', tokens: ['heat', 'uhi', 'lst', 'temperature'] },
    { flowId: 'green_deficit', tokens: ['green', 'ndvi', 'vegetation', 'canopy'] },
    { flowId: 'emerging_hot_spot', tokens: ['hotspot', 'hot-spot', 'lisa', 'moran', 'cluster'] },
    { flowId: 'equity_audit', tokens: ['equity', 'justice', 'disparity'] },
    { flowId: 'vulnerability', tokens: ['vulnerability', 'risk', 'exposure'] },
    { flowId: 'scenario_comparison', tokens: ['scenario', 'alternative'] },
    { flowId: 'change_detection', tokens: ['change', 'before-after', 'timeseries'] },
    { flowId: 'cityjson_loader', tokens: ['cityjson', 'city-json'] },
    { flowId: 'sunlight_sim', tokens: ['sunlight', 'solar', 'shadow'] },
  ];

  return keywordRules.find((rule) => rule.tokens.some((token) => lower.includes(token)))?.flowId ?? null;
}

function buildRecommendations(
  payload: UrbanIdeArtifactRecognitionPayload,
  classification: UrbanIdeArtifactClassification,
  metadata: UrbanIdeArtifactManifestMetadata | undefined,
): UrbanIdeArtifactRecommendation[] {
  const recommendations: UrbanIdeArtifactRecommendation[] = [];
  const add = (recommendation: UrbanIdeArtifactRecommendation): void => {
    if (recommendations.some((entry) => entry.id === recommendation.id)) return;
    recommendations.push(recommendation);
  };

  if (metadata?.flowId) {
    add({
      id: `workflow:${metadata.flowId}`,
      target: 'workflow',
      targetId: metadata.flowId,
      label: `Review ${formatFlowLabel(metadata.flowId)} workflow`,
      reason: `Manifest metadata declares flowId "${metadata.flowId}".`,
      confidence: 'high',
    });
  }

  if (metadata?.methodId) {
    add({
      id: `method:${metadata.methodId}`,
      target: 'method',
      targetId: metadata.methodId,
      label: metadata.methodName ? `Open ${metadata.methodName}` : `Open method ${metadata.methodId}`,
      reason: 'Manifest metadata declares a method identifier.',
      confidence: metadata.flowId ? 'high' : 'medium',
    });
  }

  const inferredFlow = inferFlowFromText(`${classification.filename} ${payload.title ?? ''} ${payload.summary ?? ''}`);
  if (!metadata?.flowId && inferredFlow) {
    add({
      id: `workflow:${inferredFlow}`,
      target: 'workflow',
      targetId: inferredFlow,
      label: `Consider ${formatFlowLabel(inferredFlow)}`,
      reason: `Filename or title tokens suggest the ${formatFlowLabel(inferredFlow)} workflow; validate inputs before running it.`,
      confidence: 'medium',
    });
  }

  if (classification.artifactKind === 'geojson-layer') {
    add({
      id: 'workflow:review:geojson',
      target: 'workflow',
      targetId: 'review',
      label: 'Validate layer before analysis',
      reason: 'GeoJSON references should be validated by Map Explorer for CRS, geometry, and feature-count QA before Urban methods treat them as data evidence.',
      confidence: 'high',
    });
  }

  if (classification.artifactKind === 'sql-query') {
    add({
      id: 'workflow:review:sql',
      target: 'workflow',
      targetId: 'review',
      label: 'Review SQL-derived evidence',
      reason: 'SQL files can define reproducible data preparation, but table lineage and CRS assumptions must be checked before method execution.',
      confidence: 'medium',
    });
  }

  if (classification.artifactKind === 'notebook') {
    add({
      id: 'workflow:review:notebook',
      target: 'workflow',
      targetId: 'review',
      label: 'Review notebook reproducibility',
      reason: 'Notebook references need execution-order, parameter, and output checks before they become formal Urban evidence.',
      confidence: 'medium',
    });
  }

  return recommendations.slice(0, 6);
}

function runtimeModeWarning(runtimeMode: UrbanWorkflowRuntimeMode | undefined): string | null {
  if (!runtimeMode || runtimeMode === 'live') return null;
  if (runtimeMode === 'demo') {
    return 'Manifest runtimeMode is demo; outputs must stay labeled as demonstration evidence.';
  }
  if (runtimeMode === 'synthetic') {
    return 'Manifest runtimeMode is synthetic; outputs are not real-world analytical evidence.';
  }
  return 'Manifest runtimeMode is unknown; do not treat the referenced output as analytically ready.';
}

function buildMetadata(
  payload: UrbanIdeArtifactRecognitionPayload,
  classification: UrbanIdeArtifactClassification,
  metadata: UrbanIdeArtifactManifestMetadata | undefined,
  counts: {
    layerCount: number;
    runCount: number;
    relatedArtifactCount: number;
    recommendationCount: number;
  },
): Record<string, UrbanEvidenceScalar> {
  const result: Record<string, UrbanEvidenceScalar> = {
    recognitionStatus: classification.status,
    artifactKind: classification.artifactKind,
    language: classification.language,
    fileExtension: classification.extension || null,
    relatedLayerCount: counts.layerCount,
    relatedRunCount: counts.runCount,
    relatedArtifactCount: counts.relatedArtifactCount,
    recommendationCount: counts.recommendationCount,
  };
  if (metadata?.schemaVersion) result.manifestSchemaVersion = metadata.schemaVersion;
  if (metadata?.contextId) result.manifestContextId = metadata.contextId;
  if (metadata?.runId) result.manifestRunId = metadata.runId;
  if (metadata?.flowId) result.manifestFlowId = metadata.flowId;
  if (metadata?.methodId) result.manifestMethodId = metadata.methodId;
  if (metadata?.runtimeMode) result.runtimeMode = metadata.runtimeMode;
  if (typeof payload.contentHash === 'string' && payload.contentHash.trim()) {
    result.contentHash = clipText(payload.contentHash, 160);
  }
  if (typeof payload.sizeBytes === 'number' && Number.isFinite(payload.sizeBytes) && payload.sizeBytes >= 0) {
    result.sizeBytes = payload.sizeBytes;
  }
  return result;
}

function updateUrbanContext(
  layerIds: readonly string[],
  runIds: readonly string[],
  flowId: AnalyticalFlowId | undefined,
  codeArtifactId: string | null,
  metadata: UrbanIdeArtifactManifestMetadata | undefined,
): boolean {
  const store = useUrbanContextStore.getState();
  const current = store.context;
  const patch: Partial<Omit<UrbanAnalysisContext, 'contextId'>> = {};

  if (layerIds.length > 0) {
    patch.activeLayerIds = unique([...(current?.activeLayerIds ?? []), ...layerIds]);
  }
  if (flowId) {
    patch.activeFlowId = flowId;
  }
  if (runIds[0]) {
    patch.activeRunId = runIds[0];
  }
  if (codeArtifactId) {
    patch.activeCodeArtifactId = codeArtifactId;
  }
  if (metadata?.studyAreaName) {
    patch.studyAreaName = metadata.studyAreaName;
  }
  if (metadata?.studyAreaId) {
    patch.studyAreaId = metadata.studyAreaId;
  }

  const hasPatch = Object.keys(patch).length > 0;
  if (!hasPatch) return false;

  if (current) {
    store.patchContext(patch);
  } else {
    store.createContext(patch);
  }

  return true;
}

function qaStateFor(warnings: readonly string[]): 'unvalidated' | 'warning' {
  return warnings.length > 0 ? 'warning' : 'unvalidated';
}

export interface RecognizeUrbanIdeArtifactOptions {
  updateContext?: boolean;
  registerEvidence?: boolean;
  triggerRecommendations?: boolean;
}

export function recognizeUrbanIdeArtifact(
  payload: UrbanIdeArtifactRecognitionPayload,
  options: RecognizeUrbanIdeArtifactOptions = {},
): UrbanIdeArtifactRecognitionResult {
  const classification = classifyUrbanIdeArtifact(payload);
  if (classification.status !== 'recognized') {
    return {
      ok: false,
      status: classification.status,
      artifactKind: classification.artifactKind,
      language: classification.language,
      evidenceArtifactId: null,
      recommendations: [],
      contextUpdated: false,
      recommendationTriggered: false,
      warnings: [...classification.warnings],
      ...(classification.reason ? { reason: classification.reason } : {}),
    };
  }

  const metadata = normalizeManifestMetadata(payload.manifestMetadata);
  const layerIds = unique([
    ...(payload.relatedLayerIds ?? []),
    ...(metadata?.layerIds ?? []),
  ]);
  const runIds = unique([
    ...(payload.relatedRunIds ?? []),
    ...(metadata?.runId ? [metadata.runId] : []),
    ...(metadata?.runIds ?? []),
  ]);
  const relatedArtifactIds = unique([
    ...(payload.relatedArtifactIds ?? []),
    ...(metadata?.evidenceIds ?? []),
    ...(metadata?.codeArtifactIds ?? []),
    ...(metadata?.mapArtifactIds ?? []),
    ...(metadata?.artifactIds ?? []),
  ]);
  const flowId = metadata?.flowId;
  const codeArtifactId = codeArtifactIdFor(classification.artifactKind, classification.normalizedPath, metadata);
  const recommendations = buildRecommendations(payload, classification, metadata);
  const runtimeWarning = runtimeModeWarning(metadata?.runtimeMode);
  const warnings = unique([
    ...classification.warnings,
    ...(runtimeWarning ? [runtimeWarning] : []),
  ]);

  let contextUpdated = false;
  if (options.updateContext !== false) {
    contextUpdated = updateUrbanContext(layerIds, runIds, flowId, codeArtifactId, metadata);
  }

  let recommendationTriggered = false;
  if (options.triggerRecommendations !== false && recommendations.length > 0) {
    const urbanStore = useUrbanStore.getState();
    if (!urbanStore.recMode) {
      urbanStore.setRecMode(true);
      recommendationTriggered = true;
    }
  }

  const urbanContext = useUrbanContextStore.getState().context;
  const evidenceArtifactId = `urban-ide-artifact-${stableHash(`${classification.artifactKind}:${classification.normalizedPath}`)}`;
  const evidenceKind = evidenceKindFor(classification.artifactKind, runIds);
  const sourceModule: UrbanEvidenceSourceModule = payload.sourceModule ?? 'synapse-ide';
  const evidenceSummary = clipText(
    payload.summary
      ?? metadata?.summary
      ?? `Recognized ${classification.artifactKind} reference from Synapse IDE.`,
    600,
  );

  if (options.registerEvidence !== false) {
    useUrbanContextStore.getState().registerEvidenceArtifact({
      id: evidenceArtifactId,
      kind: evidenceKind,
      title: clipText(payload.title, 180) || `${classification.filename} (${classification.artifactKind})`,
      ...(evidenceSummary ? { summary: evidenceSummary } : {}),
      state: 'active',
      sourceModule,
      sourceId: classification.normalizedPath,
      ...(urbanContext?.contextId ? { linkedContextId: urbanContext.contextId } : {}),
      ...(metadata?.studyAreaId ? { linkedStudyAreaId: metadata.studyAreaId } : {}),
      ...(runIds[0] ? { linkedRunId: runIds[0] } : {}),
      linkedLayerIds: layerIds,
      linkedFilePaths: [classification.normalizedPath],
      linkedArtifactIds: relatedArtifactIds,
      ...(flowId ? { flowId } : {}),
      ...(codeArtifactId ? { codeArtifactId } : {}),
      tags: ['data_engineering', 'gis_methods'],
      provenance: {
        sourceModule,
        createdAt: payload.receivedAt ?? busTimestamp(),
        sourceId: classification.normalizedPath,
        sourceTitle: classification.filename,
        sourceUri: classification.normalizedPath,
        ...(urbanContext?.contextId ? { contextId: urbanContext.contextId } : {}),
        ...(runIds[0] ? { runId: runIds[0] } : {}),
        ...(flowId ? { flowId } : {}),
        ...(metadata?.methodId ? { methodId: metadata.methodId } : {}),
        ...(metadata?.methodName ? { methodName: metadata.methodName } : {}),
        layerIds,
        filePaths: [classification.normalizedPath],
        inputArtifactIds: relatedArtifactIds,
        notes: IDE_REFERENCE_LIMITATION,
      },
      qa: {
        state: qaStateFor(warnings),
        warnings,
        limitations: classification.artifactKind === 'geojson-layer'
          ? [
              IDE_REFERENCE_LIMITATION,
              'Map Explorer must validate GeoJSON geometry, CRS, and feature counts before Urban methods treat this as analytical data evidence.',
            ]
          : [IDE_REFERENCE_LIMITATION],
      },
      metadata: buildMetadata(payload, classification, metadata, {
        layerCount: layerIds.length,
        runCount: runIds.length,
        relatedArtifactCount: relatedArtifactIds.length,
        recommendationCount: recommendations.length,
      }),
    });
  }

  return {
    ok: true,
    status: 'recognized',
    artifactKind: classification.artifactKind,
    language: classification.language,
    evidenceArtifactId,
    recommendations,
    contextUpdated,
    recommendationTriggered,
    warnings,
  };
}

function mapEvidenceRegisterPayload(
  payload: EvidenceArtifactRegisterPayload,
): UrbanIdeArtifactRecognitionPayload {
  const relatedFilePaths = payload.relatedFilePaths ?? [];
  const filePath = relatedFilePaths[0] ?? '';
  const sourceModule: UrbanEvidenceSourceModule =
    payload.sourceModule === 'ide' || payload.source === 'ide'
      ? 'synapse-ide'
      : 'urban-analytics';
  const mapped: UrbanIdeArtifactRecognitionPayload = {
    filePath,
    relatedLayerIds: payload.relatedLayerIds ?? [],
    relatedRunIds: payload.relatedRunIds ?? [],
    relatedArtifactIds: unique([payload.artifactId, ...(payload.relatedArtifactIds ?? [])]),
    sourceModule,
    title: payload.title,
    receivedAt: payload.requestedAt,
  };
  const artifactKind = normalizeArtifactKind(payload.artifactKind);
  const manifestMetadata = normalizeManifestMetadata(payload.manifestMetadata);
  if (payload.language) mapped.language = payload.language;
  if (artifactKind) mapped.artifactKind = artifactKind;
  if (manifestMetadata) mapped.manifestMetadata = manifestMetadata;
  if (payload.summary) mapped.summary = payload.summary;
  if (payload.contentHash) mapped.contentHash = payload.contentHash;
  if (typeof payload.sizeBytes === 'number') mapped.sizeBytes = payload.sizeBytes;
  return mapped;
}

function pushIncomingEvent(event: UrbanIdeArtifactIncomingEvent): void {
  inbox.unshift(event);
  if (inbox.length > URBAN_IDE_INBOX_LIMIT) {
    inbox.length = URBAN_IDE_INBOX_LIMIT;
  }
  for (const listener of Array.from(inboxListeners)) {
    listener(event);
  }
}

function onEvidenceArtifactRegister(payload: EvidenceArtifactRegisterPayload): void {
  if (payload.source !== 'ide' && payload.sourceModule !== 'ide') return;
  const result = recognizeUrbanIdeArtifact(mapEvidenceRegisterPayload(payload));
  pushIncomingEvent({
    kind: 'evidence.register',
    receivedAt: busTimestamp(),
    payload,
    result,
  });
}

export function installUrbanIdeArtifactReceiver(): boolean {
  if (installed) return false;
  busSubscriptions.push(synapseBus.on('evidence.artifact.register', onEvidenceArtifactRegister));
  installed = true;
  return true;
}

export function isUrbanIdeArtifactReceiverInstalled(): boolean {
  return installed;
}

export function _uninstallUrbanIdeArtifactReceiverForTesting(): void {
  for (const sub of busSubscriptions) {
    sub.off();
  }
  busSubscriptions.length = 0;
  inbox.length = 0;
  inboxListeners.clear();
  installed = false;
}

export function getUrbanIdeArtifactInbox(): UrbanIdeArtifactIncomingEvent[] {
  return inbox.slice();
}

export function getLastUrbanIdeArtifactEvent(): UrbanIdeArtifactIncomingEvent | null {
  return inbox[0] ?? null;
}

export function subscribeUrbanIdeArtifactInbox(
  listener: (event: UrbanIdeArtifactIncomingEvent) => void,
): () => void {
  inboxListeners.add(listener);
  return () => {
    inboxListeners.delete(listener);
  };
}
