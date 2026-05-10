/**
 * Urban Analytics — UI-facing code artifact actions.
 *
 * Presentation surfaces use these helpers to build explicit Urban → IDE
 * artifact requests without owning editor state. All dispatch still flows
 * through `dispatchUrbanCodeArtifactRequest`, which opens a new IDE tab,
 * registers the code-artifact evidence entry, and updates run manifests.
 */

import { SCRIPT_TEMPLATES } from '../python/ScriptTemplates';
import { useUrbanContextStore } from '../useUrbanContextStore';
import type {
  AnalyticalFlowId,
  Card,
  CompletedAnalysisRun,
  UrbanCodeArtifactRequest,
  UrbanWorkflowRunManifest,
} from '../lib/types';
import {
  buildJsonManifestRequest,
  buildMarkdownMethodNoteRequest,
  buildPythonScriptRequest,
  buildTypeScriptAdapterRequest,
  dispatchUrbanCodeArtifactRequest,
  type DispatchUrbanCodeArtifactOptions,
  type DispatchUrbanCodeArtifactResult,
  type UrbanCodeArtifactSeed,
} from './codeArtifactRequests';
import { resolveLegacyRunManifest } from '../lib/runManifest';

export interface BuildAndDispatchUrbanCodeArtifactResult {
  request: UrbanCodeArtifactRequest;
  result: DispatchUrbanCodeArtifactResult;
}

type RequestBuilder = (seed: UrbanCodeArtifactSeed) => UrbanCodeArtifactRequest;

const FLOW_TEMPLATE_IDS: Partial<Record<AnalyticalFlowId, string>> = {
  accessibility: 'accessibility_analysis',
  walkability: 'accessibility_analysis',
  fifteen_min_city: 'accessibility_analysis',
  transit_gap: 'accessibility_analysis',
  emerging_hot_spot: 'spatial_autocorrelation',
  equity_audit: 'spatial_autocorrelation',
  indicator_composite: 'spatial_autocorrelation',
  change_detection: 'remote_sensing_ndvi',
  green_deficit: 'remote_sensing_ndvi',
  heat_island: 'remote_sensing_ndvi',
  urban_morphology: 'urban_morphology',
  voxcity_3d: 'urban_morphology',
};

function titleCaseFlow(value: string): string {
  return value
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function uniqueStrings(values: Iterable<string | null | undefined>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = raw?.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function scalarizeValue(value: unknown): unknown {
  if (
    value == null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return `array(${value.length})`;
  }
  if (typeof value === 'object') {
    return `object(${Object.keys(value as Record<string, unknown>).length} keys)`;
  }
  return String(value);
}

function scalarizeRecord(
  value: Record<string, unknown> | undefined,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (!value) return result;
  for (const [key, raw] of Object.entries(value)) {
    result[`${prefix}${key}`] = scalarizeValue(raw);
  }
  return result;
}

function resolveTemplateBodyForFlow(flowId: AnalyticalFlowId): string | undefined {
  const direct = SCRIPT_TEMPLATES.find((template) => template.id === flowId);
  if (direct) return direct.code;
  const mappedId = FLOW_TEMPLATE_IDS[flowId];
  if (!mappedId) return undefined;
  return SCRIPT_TEMPLATES.find((template) => template.id === mappedId)?.code;
}

function collectRunInputDescriptors(
  run: CompletedAnalysisRun,
  manifest: UrbanWorkflowRunManifest,
): string[] {
  return uniqueStrings([
    `run:${run.runId}`,
    `flow:${run.flowId}`,
    ...Object.keys(manifest.inputs).map((key) => `input:${key}`),
    ...run.mapOutputs.map((output) => `map-output:${output.id}`),
    ...run.chartOutputs.map((output) => `chart-output:${output.id}`),
    ...run.dataOutputs.map((output) => `data-output:${output.id}`),
    ...manifest.mapArtifactIds.map((id) => `map-artifact:${id}`),
    ...(manifest.dataFitness?.sourceLayerIds ?? []).map((id) => `layer:${id}`),
  ]);
}

function collectRunLimitations(manifest: UrbanWorkflowRunManifest): string[] {
  return uniqueStrings([
    ...(manifest.methodValidity?.limitations ?? []),
    ...(manifest.methodValidity?.failureModes ?? []).map((value) => `Failure mode: ${value}`),
    ...(manifest.dataFitness?.blockedReasons ?? []).map((value) => `Data fitness blocker: ${value}`),
    ...(manifest.dataFitness?.missingInputs ?? []).map((value) => `Missing input: ${value}`),
    ...(manifest.dataFitness?.uncertaintyNotes ?? []).map((value) => `Uncertainty: ${value}`),
    ...(manifest.readiness?.reasons ?? []).map((value) => `Readiness: ${value}`),
  ]);
}

function collectCardInputDescriptors(card: Card): string[] {
  const context = useUrbanContextStore.getState().context;
  return uniqueStrings([
    `method-card:${card.id}`,
    ...(context?.activeLayerIds ?? []).map((id) => `layer:${id}`),
    ...(card.datasets ?? []).map((dataset) => `dataset:${dataset}`),
    ...(card.tools ?? []).map((tool) => `tool:${tool}`),
  ]);
}

async function buildAndDispatch(
  seed: UrbanCodeArtifactSeed,
  builder: RequestBuilder,
  options?: DispatchUrbanCodeArtifactOptions,
): Promise<BuildAndDispatchUrbanCodeArtifactResult> {
  const request = builder(seed);
  const result = await dispatchUrbanCodeArtifactRequest(request, options);
  return { request, result };
}

export function buildSeedFromCompletedRun(
  run: CompletedAnalysisRun,
  manifestInput: UrbanWorkflowRunManifest | null,
): UrbanCodeArtifactSeed {
  const manifest = manifestInput ?? resolveLegacyRunManifest(run);
  const context = useUrbanContextStore.getState().context;
  const runtimeMode = manifest.runtimeMode;
  const methodName = run.label?.trim() || `${titleCaseFlow(run.flowId)} workflow run`;
  const pythonBody = resolveTemplateBodyForFlow(run.flowId);
  return {
    methodId: run.flowId,
    methodName,
    methodSlug: run.flowId,
    flowId: run.flowId,
    runId: run.runId,
    runManifest: manifest,
    contextId: context?.contextId ?? manifest.contextId,
    studyAreaId: context?.studyAreaId ?? null,
    studyAreaName: context?.studyAreaName ?? null,
    studyAreaBounds: context?.studyAreaBounds ?? null,
    inputDescriptors: collectRunInputDescriptors(run, manifest),
    parameters: {
      runtimeMode,
      ...scalarizeRecord(manifest.inputs, 'input.'),
      ...scalarizeRecord(manifest.parameters),
    },
    assumptions: uniqueStrings(manifest.methodValidity?.assumptions ?? []),
    limitations: collectRunLimitations(manifest),
    citations: uniqueStrings(manifest.methodValidity?.peerReferenceIds ?? []),
    ...(pythonBody ? { pythonBody } : {}),
    outputContract: {
      summary: run.paragraphPreview || run.paragraph || `Reproducibility artifact for ${methodName}.`,
      publishedLayerIds: manifest.mapArtifactIds,
      outputPaths: run.dataOutputs.map((output) => `data-output:${output.id}`),
    },
    origin: 'workflow-run',
  };
}

export function buildSeedFromMethodCard(card: Card): UrbanCodeArtifactSeed {
  const context = useUrbanContextStore.getState().context;
  const envelope = card.validityEnvelope;
  return {
    methodId: card.id,
    methodName: card.title,
    methodSlug: card.id,
    contextId: context?.contextId ?? null,
    studyAreaId: context?.studyAreaId ?? null,
    studyAreaName: context?.studyAreaName ?? null,
    studyAreaBounds: context?.studyAreaBounds ?? null,
    inputDescriptors: collectCardInputDescriptors(card),
    parameters: scalarizeRecord({
      activeScale: context?.activeScale ?? null,
      capabilityStatus: card.capabilityStatus ?? envelope?.capabilityStatus ?? null,
    }),
    assumptions: uniqueStrings(envelope?.assumptions ?? []),
    limitations: uniqueStrings([
      ...(envelope?.limitations ?? []),
      ...(card.limitations ? [card.limitations] : []),
    ]),
    citations: uniqueStrings(card.evidence ?? []),
    outputContract: {
      summary: card.summary,
    },
    origin: 'method-card',
  };
}

export function buildAndDispatchPythonScript(
  seed: UrbanCodeArtifactSeed,
  options?: DispatchUrbanCodeArtifactOptions,
): Promise<BuildAndDispatchUrbanCodeArtifactResult> {
  return buildAndDispatch(seed, buildPythonScriptRequest, options);
}

export function buildAndDispatchJsonManifest(
  seed: UrbanCodeArtifactSeed,
  options?: DispatchUrbanCodeArtifactOptions,
): Promise<BuildAndDispatchUrbanCodeArtifactResult> {
  return buildAndDispatch(seed, buildJsonManifestRequest, options);
}

export function buildAndDispatchMarkdownMethodNote(
  seed: UrbanCodeArtifactSeed,
  options?: DispatchUrbanCodeArtifactOptions,
): Promise<BuildAndDispatchUrbanCodeArtifactResult> {
  return buildAndDispatch(seed, buildMarkdownMethodNoteRequest, options);
}

export function buildAndDispatchTypeScriptAdapter(
  seed: UrbanCodeArtifactSeed,
  options?: DispatchUrbanCodeArtifactOptions,
): Promise<BuildAndDispatchUrbanCodeArtifactResult> {
  return buildAndDispatch(seed, buildTypeScriptAdapterRequest, options);
}
