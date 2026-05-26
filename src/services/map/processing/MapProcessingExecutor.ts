/* ==================================================================== */
/*  MapProcessingExecutor — Prompt 24a                                   */
/*                                                                        */
/*  Turns a tool + parameters + input layer into a derived layer and      */
/*  routes the apply through the P9 command lifecycle (applyMapCommand),  */
/*  so every processing run is preflighted, audited (one review event),   */
/*  revertable, and carries a reproducibility manifest. The executor does */
/*  no I/O of its own — callers inject the MapActionEffects boundary       */
/*  (store-backed in the app, faked in tests).                            */
/* ==================================================================== */

import type {
  MapCommandResult,
  ProcessingToolDescriptor,
} from "@/services/map/contracts/gisContracts";
import type {
  MapReproducibilityManifest,
  OverlayLayerConfig,
} from "@/centerpanel/components/map/mapTypes";
import {
  applyMapCommand,
  type MapActionEffects,
  type MapActionOutcome,
} from "@/services/map/actions/MapActionExecutor";
import {
  buildProcessingManifest,
  REFERENCE_TOOL_EXECUTORS,
  type ProcessingToolExecutor,
  type ProcessingToolInputs,
  type ProcessingToolPreview,
} from "./referenceTools";
import { NOT_IMPLEMENTED_TOOL_DESCRIPTORS, SERVICE_TOOL_EXECUTORS } from "./serviceTools";

/** All wired executors (reference + service-backed), keyed by tool id. */
const ALL_EXECUTORS: Readonly<Record<string, ProcessingToolExecutor>> = {
  ...REFERENCE_TOOL_EXECUTORS,
  ...SERVICE_TOOL_EXECUTORS,
};

/** Full catalogue: implemented executors + not-yet-wired stub descriptors. */
const ALL_DESCRIPTORS: ProcessingToolDescriptor[] = [
  ...Object.values(ALL_EXECUTORS).map((executor) => executor.descriptor),
  ...NOT_IMPLEMENTED_TOOL_DESCRIPTORS,
];

function getExecutor(toolId: string): ProcessingToolExecutor | null {
  return ALL_EXECUTORS[toolId] ?? null;
}

export interface ProcessingRunOptions {
  now?: () => string;
  /** Deterministic id seed (tests). Derives layer/manifest/command ids. */
  idFactory?: () => string;
  mapContextId?: string;
}

export interface ProcessingPreviewOutcome {
  descriptor: ProcessingToolDescriptor;
  inputLayer: OverlayLayerConfig | null;
  preview: ProcessingToolPreview;
}

export interface ProcessingRunResult {
  toolId: string;
  descriptor: ProcessingToolDescriptor;
  status: "applied" | "blocked";
  preview: ProcessingToolPreview;
  command: MapCommandResult;
  outputLayer: OverlayLayerConfig | null;
  manifest: MapReproducibilityManifest | null;
  logs: string[];
  reviewEvent: MapActionOutcome["reviewEvent"] | null;
  revertToken: MapActionOutcome["revertToken"] | null;
}

/** Descriptor lookup over the full catalogue (implemented + stubs). */
export function getProcessingToolDescriptor(toolId: string): ProcessingToolDescriptor | null {
  return ALL_DESCRIPTORS.find((descriptor) => descriptor.toolId === toolId) ?? null;
}

export function listProcessingToolDescriptors(): ProcessingToolDescriptor[] {
  return [...ALL_DESCRIPTORS];
}

function blockedPreview(blocker: string, geometryClass = "Geometry"): ProcessingToolPreview {
  return {
    ok: false,
    blockers: [blocker],
    caveats: [],
    logs: [blocker],
    crs: null,
    outputFeatures: { type: "FeatureCollection", features: [] },
    outputFeatureCount: 0,
    outputGeometryClass: geometryClass,
    parameters: {},
  };
}

/**
 * Run a tool's preview (preflight + computed output) without applying. Returns
 * `null` when the tool id is unknown. Used by the toolbox UI to surface blocked
 * reasons and caveats *before* the apply.
 */
export function previewProcessingTool(
  toolId: string,
  params: Readonly<Record<string, unknown>>,
  getLayer: (id: string) => OverlayLayerConfig | null,
): ProcessingPreviewOutcome | null {
  const executor = getExecutor(toolId);
  if (!executor) {
    const descriptor = getProcessingToolDescriptor(toolId);
    if (descriptor && !descriptor.implemented) {
      return {
        descriptor,
        inputLayer: null,
        preview: blockedPreview(`“${descriptor.title}” is registered but not yet wired — ${descriptor.summary}`),
      };
    }
    return null;
  }

  const layerId = typeof params.layer === "string" ? params.layer : "";
  const inputLayer = layerId ? getLayer(layerId) : null;
  if (!inputLayer) {
    return {
      descriptor: executor.descriptor,
      inputLayer: null,
      preview: blockedPreview("Select an input layer before running this tool."),
    };
  }

  const inputs: ProcessingToolInputs = { params, inputLayer, getLayer };
  return { descriptor: executor.descriptor, inputLayer, preview: executor.preview(inputs) };
}

let runCounter = 0;
function nextRunSeed(): string {
  runCounter += 1;
  return `${Date.now().toString(36)}-${runCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Preview, then (if not blocked) apply the tool through the command lifecycle.
 * Returns `null` for an unknown tool id. A blocked preview yields a blocked
 * {@link MapCommandResult} and never mutates the store.
 */
export function runProcessingTool(
  toolId: string,
  params: Readonly<Record<string, unknown>>,
  effects: MapActionEffects,
  options: ProcessingRunOptions = {},
): ProcessingRunResult | null {
  const outcome = previewProcessingTool(toolId, params, effects.getLayer);
  if (!outcome) return null;

  const { descriptor, inputLayer, preview } = outcome;
  const createdAt = options.now?.() ?? new Date().toISOString();
  const seed = options.idFactory?.() ?? nextRunSeed();
  const commandId = `mapcmd-processing-${descriptor.toolId}-${seed}`;

  if (!preview.ok || !inputLayer) {
    const command: MapCommandResult = {
      commandId,
      kind: "workflow.apply",
      status: "blocked",
      revertable: false,
      createdAt,
    };
    return {
      toolId,
      descriptor,
      status: "blocked",
      preview,
      command,
      outputLayer: null,
      manifest: null,
      logs: preview.logs,
      reviewEvent: null,
      revertToken: null,
    };
  }

  const outputLayerId = `processing:${descriptor.toolId}:${seed}`;
  const outputLayerName = `${descriptor.title} · ${inputLayer.name}`;
  const additionalSourceLayers = (preview.secondarySourceIds ?? [])
    .map((id) => effects.getLayer(id))
    .filter((layer): layer is OverlayLayerConfig => layer !== null);
  const sourceLayerIds = [inputLayer.id, ...additionalSourceLayers.map((layer) => layer.id)];
  const manifest = buildProcessingManifest({
    descriptor,
    inputLayer,
    additionalSourceLayers,
    outputLayerId,
    outputLayerName,
    preview,
    createdAt,
    manifestId: `manifest-processing-${descriptor.toolId}-${seed}`,
    mapContextId: options.mapContextId ?? "map-explorer",
  });

  const outputLayer: OverlayLayerConfig = {
    id: outputLayerId,
    name: outputLayerName,
    type: "geojson",
    visible: true,
    opacity: 0.9,
    sourceData: preview.outputFeatures,
    sourceKind: "derived",
    group: "analysis",
    queryable: true,
    qaStatus: preview.caveats.length > 0 ? "warning" : "passed",
    provenance: {
      label: outputLayerName,
      method: `Processing toolbox: ${descriptor.title}`,
      generatedAt: createdAt,
      sourceLayerIds,
      notes: preview.caveats,
    },
    metadata: {
      featureCount: preview.outputFeatureCount,
      geometryType: preview.outputGeometryClass,
      updatedAt: createdAt,
      reproducibilityManifest: manifest,
    },
  };

  const applied = applyMapCommand(
    {
      kind: "workflow.apply",
      workflowId: `processing:${descriptor.toolId}`,
      outputLayer,
      canApply: true,
      manifest,
      caveats: preview.caveats,
    },
    effects,
    { now: () => createdAt, idFactory: () => commandId },
  );

  return {
    toolId,
    descriptor,
    status: applied.result.status === "applied" ? "applied" : "blocked",
    preview,
    command: applied.result,
    outputLayer: applied.result.status === "applied" ? outputLayer : null,
    manifest: applied.result.status === "applied" ? manifest : null,
    logs: preview.logs,
    reviewEvent: applied.reviewEvent,
    revertToken: applied.revertToken ?? null,
  };
}
