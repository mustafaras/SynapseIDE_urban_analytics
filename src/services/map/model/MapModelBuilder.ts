import type {
  MapReproducibilityLayerReference,
  MapReproducibilityManifest,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import { resolveOverlayLayerCrsSummary } from "@/centerpanel/components/map/mapLayerMetadata";
import {
  applyMapCommand,
  type MapActionEffects,
  type MapActionOutcome,
} from "@/services/map/actions/MapActionExecutor";
import {
  buildWorkflowScriptRequest,
  type MapCodeArtifactRequest,
  type MapCodeArtifactRequestInput,
} from "@/services/map/MapCodeArtifactRequestService";
import {
  MapProcessingRegistry,
  runProcessingTool,
  type ProcessingRunResult,
} from "@/services/map/processing";

export const MAP_MODEL_DEFINITION_VERSION = 1;
export const MAP_MODEL_ENGINE_VERSION = "map-model-builder-1";

export type MapModelLiteralValue = string | number | boolean;

export type MapModelParameterBinding =
  | { kind: "literal"; value: MapModelLiteralValue }
  | { kind: "source"; inputId: string }
  | { kind: "step-output"; stepId: string }
  | { kind: "batch-aoi" };

export interface MapModelSourceInput {
  inputId: string;
  label: string;
  layerId: string;
}

export interface MapModelStep {
  stepId: string;
  toolId: string;
  label: string;
  parameters: Record<string, MapModelParameterBinding>;
}

export interface MapModelDefinition {
  version: typeof MAP_MODEL_DEFINITION_VERSION;
  modelId: string;
  title: string;
  description?: string;
  inputs: MapModelSourceInput[];
  steps: MapModelStep[];
}

export interface MapSavedModel {
  definition: MapModelDefinition;
  serialized: string;
  definitionHash: string;
  savedAt: string;
}

export interface MapModelValidationIssue {
  code: string;
  message: string;
  stepId?: string;
}

export interface MapModelValidationResult {
  valid: boolean;
  issues: MapModelValidationIssue[];
}

export interface MapModelExecutionOptions {
  mapContextId?: string;
  now?: () => string;
  aoiId?: string | null;
}

export interface MapModelStepRun {
  step: MapModelStep;
  resolvedParameters: Record<string, MapModelLiteralValue>;
  result: ProcessingRunResult;
}

export interface MapModelRunResult {
  status: "applied" | "blocked";
  model: MapModelDefinition;
  definitionHash: string;
  executionHash: string;
  manifestHash: string | null;
  manifest: MapReproducibilityManifest | null;
  finalOutputLayer: OverlayLayerConfig | null;
  stepRuns: MapModelStepRun[];
  finalOutcome: MapActionOutcome | null;
  blockers: string[];
  caveats: string[];
  logs: string[];
}

export interface MapModelBatchTarget {
  targetId: string;
  label: string;
  layerBindings: Record<string, string>;
  aoiId?: string | null;
}

export interface MapModelBatchResult {
  status: "applied" | "partial" | "blocked";
  results: Array<{ target: MapModelBatchTarget; result: MapModelRunResult }>;
  blockers: string[];
}

export interface BuildMapModelArtifactRequestInput
  extends Omit<MapCodeArtifactRequestInput, "requestedLayerId" | "workflowManifest"> {
  result: MapModelRunResult;
}

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

function safePart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "model";
}

function canonicalize(value: unknown): CanonicalValue {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (typeof value === "object") {
    const result: { [key: string]: CanonicalValue } = {};
    for (const key of Object.keys(value as object).sort((left, right) => left.localeCompare(right))) {
      const item = (value as Record<string, unknown>)[key];
      if (item !== undefined) result[key] = canonicalize(item);
    }
    return result;
  }
  return String(value);
}

function stableJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/** Deterministic reference hash for manifest identity; not a cryptographic content digest. */
export function hashMapModelReference(value: unknown): string {
  const text = stableJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function normalizedDefinition(model: MapModelDefinition): CanonicalValue {
  return canonicalize(model);
}

export function serializeMapModel(model: MapModelDefinition): string {
  return JSON.stringify(normalizedDefinition(model), null, 2);
}

function isBinding(value: unknown): value is MapModelParameterBinding {
  if (!value || typeof value !== "object") return false;
  const binding = value as Partial<MapModelParameterBinding>;
  if (binding.kind === "batch-aoi") return true;
  if (binding.kind === "literal") {
    return typeof binding.value === "string" || typeof binding.value === "number" || typeof binding.value === "boolean";
  }
  return (binding.kind === "source" && typeof binding.inputId === "string")
    || (binding.kind === "step-output" && typeof binding.stepId === "string");
}

function isModelDefinition(value: unknown): value is MapModelDefinition {
  if (!value || typeof value !== "object") return false;
  const model = value as Partial<MapModelDefinition>;
  if (model.version !== MAP_MODEL_DEFINITION_VERSION || typeof model.modelId !== "string" || typeof model.title !== "string") {
    return false;
  }
  if (!Array.isArray(model.inputs) || !Array.isArray(model.steps)) return false;
  const validInputs = model.inputs.every((input) => (
    input != null
    && typeof input === "object"
    && typeof (input as MapModelSourceInput).inputId === "string"
    && typeof (input as MapModelSourceInput).label === "string"
    && typeof (input as MapModelSourceInput).layerId === "string"
  ));
  const validSteps = model.steps.every((step) => {
    if (!step || typeof step !== "object") return false;
    const candidate = step as MapModelStep;
    return typeof candidate.stepId === "string"
      && typeof candidate.toolId === "string"
      && typeof candidate.label === "string"
      && candidate.parameters != null
      && typeof candidate.parameters === "object"
      && Object.values(candidate.parameters).every((binding) => isBinding(binding));
  });
  return validInputs && validSteps;
}

export function deserializeMapModel(serialized: string): MapModelDefinition {
  const parsed: unknown = JSON.parse(serialized);
  if (!isModelDefinition(parsed)) {
    throw new Error("Saved map model does not match the model definition contract.");
  }
  return parsed;
}

export function saveMapModel(model: MapModelDefinition, savedAt = new Date().toISOString()): MapSavedModel {
  const serialized = serializeMapModel(model);
  return {
    definition: deserializeMapModel(serialized),
    serialized,
    definitionHash: hashMapModelReference(normalizedDefinition(model)),
    savedAt,
  };
}

export function validateMapModel(
  model: MapModelDefinition,
  registry: MapProcessingRegistry,
): MapModelValidationResult {
  const issues: MapModelValidationIssue[] = [];
  const inputIds = new Set<string>();
  for (const input of model.inputs) {
    if (!input.inputId.trim() || !input.layerId.trim()) {
      issues.push({ code: "invalid-input", message: "Each model input requires an input ID and a layer binding." });
    }
    if (inputIds.has(input.inputId)) {
      issues.push({ code: "duplicate-input", message: `Input "${input.inputId}" is declared more than once.` });
    }
    inputIds.add(input.inputId);
  }
  if (model.steps.length === 0) {
    issues.push({ code: "missing-step", message: "Add at least one processing tool step before running the model." });
  }

  const precedingSteps = new Set<string>();
  for (const step of model.steps) {
    if (precedingSteps.has(step.stepId)) {
      issues.push({ code: "duplicate-step", message: `Step "${step.stepId}" is declared more than once.`, stepId: step.stepId });
      continue;
    }
    const descriptor = registry.get(step.toolId);
    if (!descriptor) {
      issues.push({ code: "unknown-tool", message: `Step "${step.label}" uses an unknown processing tool.`, stepId: step.stepId });
    } else if (!descriptor.implemented) {
      issues.push({ code: "unimplemented-tool", message: `Step "${step.label}" uses a tool that is not implemented.`, stepId: step.stepId });
    } else {
      for (const parameter of descriptor.parameters) {
        const binding = step.parameters[parameter.key];
        if (!binding && parameter.required && parameter.defaultValue === undefined) {
          issues.push({
            code: "missing-parameter",
            message: `Step "${step.label}" requires parameter "${parameter.label}".`,
            stepId: step.stepId,
          });
        }
        if (binding?.kind === "literal" && parameter.type === "layer") {
          issues.push({
            code: "unbound-layer",
            message: `Step "${step.label}" must bind layer parameter "${parameter.label}" to an input or prior output.`,
            stepId: step.stepId,
          });
        }
        if (binding?.kind === "batch-aoi" && parameter.type !== "aoi") {
          issues.push({
            code: "invalid-aoi-binding",
            message: `Step "${step.label}" may use a batch AOI binding only for an AOI parameter.`,
            stepId: step.stepId,
          });
        }
      }
    }
    for (const binding of Object.values(step.parameters)) {
      if (binding.kind === "source" && !inputIds.has(binding.inputId)) {
        issues.push({ code: "missing-input-reference", message: `Step "${step.label}" references missing input "${binding.inputId}".`, stepId: step.stepId });
      }
      if (binding.kind === "step-output" && !precedingSteps.has(binding.stepId)) {
        issues.push({ code: "forward-step-reference", message: `Step "${step.label}" must reference an earlier step output.`, stepId: step.stepId });
      }
    }
    precedingSteps.add(step.stepId);
  }
  return { valid: issues.length === 0, issues };
}

function inputSignature(input: MapModelSourceInput, layer: OverlayLayerConfig | null): Record<string, unknown> {
  return {
    inputId: input.inputId,
    layerId: input.layerId,
    layerAvailable: layer !== null,
    dataVersion: layer?.metadata?.dataVersion ?? null,
    featureCount: layer?.metadata?.featureCount ?? null,
    crs: layer ? resolveOverlayLayerCrsSummary(layer).crs : null,
  };
}

function resolveStepParameters(
  model: MapModelDefinition,
  step: MapModelStep,
  stepOutputs: ReadonlyMap<string, string>,
  registry: MapProcessingRegistry,
  aoiId: string | null,
): { params: Record<string, MapModelLiteralValue>; blockers: string[] } {
  const descriptor = registry.get(step.toolId);
  const sourceById = new Map(model.inputs.map((input) => [input.inputId, input.layerId]));
  const params: Record<string, MapModelLiteralValue> = {};
  const blockers: string[] = [];
  for (const parameter of descriptor?.parameters ?? []) {
    const binding = step.parameters[parameter.key];
    if (!binding) {
      if (parameter.defaultValue !== undefined) params[parameter.key] = parameter.defaultValue;
      continue;
    }
    switch (binding.kind) {
      case "literal":
        params[parameter.key] = binding.value;
        break;
      case "source": {
        const layerId = sourceById.get(binding.inputId);
        if (!layerId) blockers.push(`Step "${step.label}" cannot resolve input "${binding.inputId}".`);
        else params[parameter.key] = layerId;
        break;
      }
      case "step-output": {
        const layerId = stepOutputs.get(binding.stepId);
        if (!layerId) blockers.push(`Step "${step.label}" cannot resolve output from "${binding.stepId}".`);
        else params[parameter.key] = layerId;
        break;
      }
      case "batch-aoi":
        if (!aoiId) blockers.push(`Step "${step.label}" requires a batch AOI target.`);
        else params[parameter.key] = aoiId;
        break;
    }
  }
  return { params, blockers };
}

function planningEffects(effects: MapActionEffects): MapActionEffects {
  const layers = new Map<string, OverlayLayerConfig>();
  const removed = new Set<string>();
  const addedOrder: string[] = [];
  return {
    getLayer: (id) => layers.get(id) ?? (removed.has(id) ? null : effects.getLayer(id)),
    getLayerOrder: () => [...effects.getLayerOrder().filter((id) => !removed.has(id)), ...addedOrder],
    addLayer: (layer) => {
      layers.set(layer.id, layer);
      if (!addedOrder.includes(layer.id)) addedOrder.push(layer.id);
    },
    removeLayer: (id) => {
      removed.add(id);
      layers.delete(id);
    },
    setLayerOrder: () => {},
    setLayerStyle: () => {},
    removeReportItem: () => {},
  };
}

function sourceReference(layer: OverlayLayerConfig): MapReproducibilityLayerReference {
  return {
    layerId: layer.id,
    role: "source",
    name: layer.name,
    ...(layer.sourceKind ? { sourceKind: layer.sourceKind } : {}),
    ...(typeof layer.metadata?.featureCount === "number" ? { featureCount: layer.metadata.featureCount } : {}),
  };
}

function uniqueTexts(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function buildModelManifest(
  model: MapModelDefinition,
  definitionHash: string,
  executionHash: string,
  manifestHash: string,
  stepRuns: readonly MapModelStepRun[],
  finalOutputLayerId: string,
  finalOutputName: string,
  sourceLayers: readonly OverlayLayerConfig[],
  createdAt: string,
  mapContextId: string,
  aoiId: string | null,
): MapReproducibilityManifest {
  const lastManifest = stepRuns[stepRuns.length - 1]!.result.manifest!;
  const caveats = uniqueTexts(stepRuns.flatMap((step) => step.result.preview.caveats));
  return {
    version: 1,
    manifestId: `manifest-model-${safePart(model.modelId)}-${manifestHash}`,
    workflowId: `model:${safePart(model.modelId)}:${executionHash}`,
    status: "applied",
    createdAt,
    mapContextId,
    operation: "model.execute",
    workflowKind: `model.${safePart(model.modelId)}`,
    inputLayerIds: sourceLayers.map((layer) => layer.id),
    sourceLayerIds: sourceLayers.map((layer) => layer.id),
    outputLayerIds: [finalOutputLayerId],
    sourceLayers: sourceLayers.map(sourceReference),
    outputLayers: [{
      layerId: finalOutputLayerId,
      role: "derived",
      name: finalOutputName,
      sourceKind: "derived",
      featureCount: lastManifest.expectedOutput.featureCount,
    }],
    aoiReference: {
      source: aoiId ? "batch-aoi" : "model-input",
      ...(aoiId ? { aoiId, label: aoiId } : {}),
      selectedLayerIds: sourceLayers.map((layer) => layer.id),
      selectedFeatureCount: 0,
      drawnPolygonCount: 0,
    },
    viewportBounds: null,
    parameters: {
      modelId: model.modelId,
      modelTitle: model.title,
      definitionHash,
      executionHash,
      manifestHash,
      stepCount: model.steps.length,
      steps: stepRuns.map((step) => ({
        stepId: step.step.stepId,
        toolId: step.step.toolId,
        parameters: step.resolvedParameters,
        outputLayerId: step.result.outputLayer?.id ?? null,
        manifestId: step.result.manifest?.manifestId ?? null,
      })),
    },
    crsSummary: {
      ...lastManifest.crsSummary,
      notes: uniqueTexts([...lastManifest.crsSummary.notes, ...caveats]),
    },
    qaSummary: {
      status: caveats.length > 0 ? "warning" : "passed",
      issueIds: [],
      blockerCount: 0,
      warningCount: caveats.length,
      infoCount: 0,
      blockers: [],
      warnings: caveats,
      caveats,
    },
    expectedOutput: {
      ...lastManifest.expectedOutput,
      layerName: finalOutputName,
      dashboardCompatible: true,
      ideCompatible: true,
    },
    handoffReferences: {
      reportItemIds: [],
      dashboardBindingIds: [],
      ideArtifactIds: [],
    },
    qaIssueIds: [],
    sourceDataVersions: Object.fromEntries(
      sourceLayers.map((layer) => [layer.id, layer.metadata?.dataVersion ?? null]),
    ),
    engine: "MapWorkflowService",
    engineVersion: MAP_MODEL_ENGINE_VERSION,
  };
}

export function executeMapModel(
  model: MapModelDefinition,
  registry: MapProcessingRegistry,
  effects: MapActionEffects,
  options: MapModelExecutionOptions = {},
): MapModelRunResult {
  const definitionHash = hashMapModelReference(normalizedDefinition(model));
  const validation = validateMapModel(model, registry);
  if (!validation.valid) {
    return {
      status: "blocked",
      model,
      definitionHash,
      executionHash: definitionHash,
      manifestHash: null,
      manifest: null,
      finalOutputLayer: null,
      stepRuns: [],
      finalOutcome: null,
      blockers: validation.issues.map((issue) => issue.message),
      caveats: [],
      logs: validation.issues.map((issue) => issue.message),
    };
  }

  const sourceLayers = model.inputs
    .map((input) => effects.getLayer(input.layerId))
    .filter((layer): layer is OverlayLayerConfig => layer !== null);
  const missingLayers = model.inputs.filter((input) => !effects.getLayer(input.layerId));
  if (missingLayers.length > 0) {
    const blockers = missingLayers.map((input) => `Model input "${input.label}" cannot find layer "${input.layerId}".`);
    return {
      status: "blocked",
      model,
      definitionHash,
      executionHash: definitionHash,
      manifestHash: null,
      manifest: null,
      finalOutputLayer: null,
      stepRuns: [],
      finalOutcome: null,
      blockers,
      caveats: [],
      logs: blockers,
    };
  }

  const executionHash = hashMapModelReference({
    definitionHash,
    sources: model.inputs.map((input) => inputSignature(input, effects.getLayer(input.layerId))),
    aoiId: options.aoiId ?? null,
  });
  const createdAt = options.now?.() ?? new Date().toISOString();
  const shadowEffects = planningEffects(effects);
  const plannedRuns: MapModelStepRun[] = [];
  const outputLayerIds = new Map<string, string>();

  for (const step of model.steps) {
    const resolved = resolveStepParameters(model, step, outputLayerIds, registry, options.aoiId ?? null);
    if (resolved.blockers.length > 0) {
      return {
        status: "blocked",
        model,
        definitionHash,
        executionHash,
        manifestHash: null,
        manifest: null,
        finalOutputLayer: null,
        stepRuns: plannedRuns,
        finalOutcome: null,
        blockers: resolved.blockers,
        caveats: [],
        logs: resolved.blockers,
      };
    }
    const result = runProcessingTool(step.toolId, resolved.params, shadowEffects, {
      now: () => createdAt,
      idFactory: () => `model-${executionHash}-${safePart(step.stepId)}`,
      mapContextId: options.mapContextId ?? "map-explorer",
    });
    if (!result || result.status === "blocked" || !result.outputLayer || !result.manifest) {
      const blockers = result?.preview.blockers ?? [`Step "${step.label}" could not be executed.`];
      return {
        status: "blocked",
        model,
        definitionHash,
        executionHash,
        manifestHash: null,
        manifest: null,
        finalOutputLayer: null,
        stepRuns: plannedRuns,
        finalOutcome: null,
        blockers,
        caveats: result?.preview.caveats ?? [],
        logs: result?.logs ?? blockers,
      };
    }
    plannedRuns.push({ step, resolvedParameters: resolved.params, result });
    outputLayerIds.set(step.stepId, result.outputLayer.id);
  }

  const lastOutput = plannedRuns[plannedRuns.length - 1]!.result.outputLayer!;
  const finalOutputLayerId = `model-output:${safePart(model.modelId)}:${executionHash}`;
  const finalOutputName = `${model.title} · result`;
  const manifestHash = hashMapModelReference({
    definitionHash,
    executionHash,
    steps: plannedRuns.map((step) => ({
      stepId: step.step.stepId,
      toolId: step.step.toolId,
      parameters: step.resolvedParameters,
      expectedOutput: step.result.manifest!.expectedOutput,
    })),
    finalOutputLayerId,
  });
  const manifest = buildModelManifest(
    model,
    definitionHash,
    executionHash,
    manifestHash,
    plannedRuns,
    finalOutputLayerId,
    finalOutputName,
    sourceLayers,
    createdAt,
    options.mapContextId ?? "map-explorer",
    options.aoiId ?? null,
  );
  const finalOutputLayer: OverlayLayerConfig = {
    ...lastOutput,
    id: finalOutputLayerId,
    name: finalOutputName,
    visible: true,
    provenance: {
      label: finalOutputName,
      method: `Map model: ${model.title}`,
      generatedAt: createdAt,
      sourceLayerIds: sourceLayers.map((layer) => layer.id),
      notes: [`Model manifest hash: ${manifestHash}`, ...manifest.qaSummary.caveats],
    },
    metadata: {
      ...(lastOutput.metadata ?? {}),
      updatedAt: createdAt,
      reproducibilityManifest: manifest,
    },
  };

  const appliedRuns = plannedRuns.map((planned) => {
    const outcome = applyMapCommand(
      {
        kind: "workflow.apply",
        workflowId: `processing:${planned.step.toolId}`,
        outputLayer: planned.result.outputLayer!,
        canApply: true,
        manifest: planned.result.manifest!,
        caveats: planned.result.preview.caveats,
      },
      effects,
      { now: () => createdAt, idFactory: () => planned.result.command.commandId },
    );
    return {
      ...planned,
      result: {
        ...planned.result,
        command: outcome.result,
        reviewEvent: outcome.reviewEvent,
        revertToken: outcome.revertToken ?? null,
      },
    };
  });
  const finalOutcome = applyMapCommand(
    {
      kind: "workflow.apply",
      workflowId: manifest.workflowId,
      outputLayer: finalOutputLayer,
      canApply: true,
      manifest,
      caveats: manifest.qaSummary.caveats,
    },
    effects,
    { now: () => createdAt, idFactory: () => `mapcmd-${manifest.manifestId}` },
  );

  return {
    status: "applied",
    model,
    definitionHash,
    executionHash,
    manifestHash,
    manifest,
    finalOutputLayer,
    stepRuns: appliedRuns,
    finalOutcome,
    blockers: [],
    caveats: manifest.qaSummary.caveats,
    logs: appliedRuns.flatMap((step) => step.result.logs),
  };
}

function bindBatchTarget(model: MapModelDefinition, target: MapModelBatchTarget): MapModelDefinition {
  return {
    ...model,
    inputs: model.inputs.map((input) => ({
      ...input,
      layerId: target.layerBindings[input.inputId] ?? input.layerId,
    })),
  };
}

export function executeMapModelBatch(
  model: MapModelDefinition,
  targets: readonly MapModelBatchTarget[],
  registry: MapProcessingRegistry,
  effects: MapActionEffects,
  options: Omit<MapModelExecutionOptions, "aoiId"> = {},
): MapModelBatchResult {
  if (targets.length === 0) {
    return { status: "blocked", results: [], blockers: ["Select at least one batch layer or AOI target."] };
  }
  const targetSignatures = new Set<string>();
  const blockers: string[] = [];
  for (const target of targets) {
    const signature = stableJson({ layers: target.layerBindings, aoiId: target.aoiId ?? null });
    if (targetSignatures.has(signature)) {
      blockers.push(`Batch target "${target.label}" duplicates an existing layer/AOI binding.`);
    }
    targetSignatures.add(signature);
  }
  if (blockers.length > 0) return { status: "blocked", results: [], blockers };

  const results = targets.map((target) => ({
    target,
    result: executeMapModel(bindBatchTarget(model, target), registry, effects, {
      ...options,
      aoiId: target.aoiId ?? null,
    }),
  }));
  const appliedCount = results.filter((entry) => entry.result.status === "applied").length;
  return {
    status: appliedCount === results.length ? "applied" : appliedCount > 0 ? "partial" : "blocked",
    results,
    blockers: results.flatMap((entry) => entry.result.blockers.map((blocker) => `${entry.target.label}: ${blocker}`)),
  };
}

export function buildMapModelCodeArtifactRequest(
  input: BuildMapModelArtifactRequestInput,
): MapCodeArtifactRequest {
  if (!input.result.manifest || !input.result.finalOutputLayer) {
    throw new Error("Run the model successfully before generating a Synapse IDE artifact.");
  }
  return buildWorkflowScriptRequest({
    contextSummary: input.contextSummary,
    overlayLayers: input.overlayLayers,
    ...(input.mapEvidenceArtifacts ? { mapEvidenceArtifacts: input.mapEvidenceArtifacts } : {}),
    ...(input.scientificQA !== undefined ? { scientificQA: input.scientificQA } : {}),
    requestedLayerId: input.result.finalOutputLayer.id,
    workflowManifest: input.result.manifest,
    ...(input.publicationReadiness !== undefined ? { publicationReadiness: input.publicationReadiness } : {}),
    ...(input.compositionOptions !== undefined ? { compositionOptions: input.compositionOptions } : {}),
    ...(input.now !== undefined ? { now: input.now } : {}),
  });
}
