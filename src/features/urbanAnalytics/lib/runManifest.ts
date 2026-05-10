/**
 * Workflow Run Manifest — Prompt 14
 *
 * Builder and compatibility helpers for `UrbanWorkflowRunManifest`.
 *
 * Scientific contract:
 *   - Never fabricate methodValidity, dataFitness, contextId, or runtimeMode.
 *   - Legacy runs get `runtimeMode: 'unknown'` and null context/fitness/validity.
 *   - All artifact ID arrays default to empty — absence is not the same as success.
 */

import type {
  AnalyticalFlowId,
  CompletedAnalysisRun,
  UrbanDataFitnessProfile,
  UrbanMethodValidityEnvelope,
  UrbanWorkflowReadinessResult,
  UrbanWorkflowRunManifest,
  UrbanWorkflowRuntimeMode,
} from './types';

// ---------------------------------------------------------------------------
// BuildRunManifestOptions
// ---------------------------------------------------------------------------

export interface BuildRunManifestOptions {
  /**
   * Urban Analysis Context ID active at execution time.
   * Pass null explicitly for runs that have no context (acceptable for
   * single-flow executions outside a study context).
   */
  contextId: string | null;
  /**
   * Raw step-level inputs collected by the workflow wizard.
   * Omit to record an empty inputs map.
   */
  inputs?: Record<string, unknown>;
  /**
   * Method configuration parameters (weighting, normalization, thresholds, etc.).
   * Omit to record an empty parameters map.
   */
  parameters?: Record<string, unknown>;
  /**
   * Snapshot of the method validity envelope at execution time.
   * Pass null when no envelope is available — never fabricate.
   */
  methodValidity?: UrbanMethodValidityEnvelope | null;
  /**
   * Data fitness profile evaluated before or during execution.
   * Pass null when fitness was not evaluated — treat as unknown, not as ready.
   */
  dataFitness?: UrbanDataFitnessProfile | null;
  /** Map artifact IDs published to Map Explorer from this run. */
  mapArtifactIds?: string[];
  /** Code artifact IDs generated for this run via the IDE bridge. */
  codeArtifactIds?: string[];
  /** Report insert IDs created from this run. */
  reportInsertIds?: string[];
  /** Dashboard binding IDs created from this run. */
  dashboardBindingIds?: string[];
  /** Indicator result IDs computed during this run. */
  indicatorResultIds?: string[];
  /**
   * Execution mode.
   * Defaults to `'live'` — set explicitly to `'demo'` or `'synthetic'`
   * when the workflow ran against non-real data.
   */
  runtimeMode?: UrbanWorkflowRuntimeMode;
  /** Readiness snapshot captured immediately before execution. */
  readiness?: UrbanWorkflowReadinessResult | null;
}

// ---------------------------------------------------------------------------
// buildRunManifest
// ---------------------------------------------------------------------------

/**
 * Build a typed `UrbanWorkflowRunManifest` from a completed analysis run
 * and the execution context that produced it.
 *
 * Caller is responsible for providing truthful values.  This function does
 * not infer or guess missing context — it records exactly what is supplied.
 *
 * ```ts
 * const manifest = buildRunManifest(completedRun, {
 *   contextId: context.contextId,
 *   inputs: stepData,
 *   parameters: { weightingMethod: 'ahp' },
 *   methodValidity: flowLibraryItem.validityEnvelope ?? null,
 *   dataFitness: evaluatedFitnessProfile ?? null,
 *   runtimeMode: 'live',
 * });
 * useFlowStore.getState().registerManifest(manifest);
 * ```
 */
export function buildRunManifest(
  run: CompletedAnalysisRun,
  options: BuildRunManifestOptions,
): UrbanWorkflowRunManifest {
  return {
    runId: run.runId,
    flowId: run.flowId,
    contextId: options.contextId,
    inputs: options.inputs ?? {},
    parameters: options.parameters ?? {},
    methodValidity: options.methodValidity ?? null,
    dataFitness: options.dataFitness ?? null,
    mapArtifactIds: options.mapArtifactIds ?? [],
    codeArtifactIds: options.codeArtifactIds ?? [],
    reportInsertIds: options.reportInsertIds ?? [],
    dashboardBindingIds: options.dashboardBindingIds ?? [],
    indicatorResultIds: options.indicatorResultIds ?? [],
    runtimeMode: options.runtimeMode ?? 'live',
    readiness: options.readiness ?? null,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// resolveLegacyRunManifest
// ---------------------------------------------------------------------------

/**
 * Produce a minimal `UrbanWorkflowRunManifest` shell from a legacy
 * `CompletedAnalysisRun` that predates the manifest system.
 *
 * Scientific contract:
 *   - `contextId` is null — legacy runs had no explicit Urban Analysis Context.
 *   - `methodValidity` and `dataFitness` are null — legacy runs had no evaluation.
 *   - `runtimeMode` is `'unknown'` — mode cannot be inferred retroactively.
 *   - All artifact ID arrays are empty — not that the run had no outputs, but
 *     that those outputs were not recorded in the manifest system.
 *
 * Consumers receiving `runtimeMode === 'unknown'` must treat the run as
 * analytically unverified, never as a confirmed real-data result.
 */
export function resolveLegacyRunManifest(
  run: CompletedAnalysisRun,
): UrbanWorkflowRunManifest {
  return {
    runId: run.runId,
    flowId: run.flowId,
    contextId: null,
    inputs: {},
    parameters: {},
    methodValidity: null,
    dataFitness: null,
    mapArtifactIds: [],
    codeArtifactIds: [],
    reportInsertIds: [],
    dashboardBindingIds: [],
    indicatorResultIds: [],
    runtimeMode: 'unknown',
    readiness: null,
    createdAt: run.insertedAt,
  };
}

// ---------------------------------------------------------------------------
// assertManifestForFlow
// ---------------------------------------------------------------------------

/**
 * Narrow-check that a manifest belongs to a specific flow.
 * Useful in typed dispatch logic where a caller knows which flow produced
 * the manifest and wants a compile-time guarantee.
 */
export function assertManifestForFlow(
  manifest: UrbanWorkflowRunManifest,
  flowId: AnalyticalFlowId,
): asserts manifest is UrbanWorkflowRunManifest & { flowId: typeof flowId } {
  if (manifest.flowId !== flowId) {
    throw new Error(
      `Run manifest flowId mismatch: expected "${flowId}", got "${manifest.flowId}".`,
    );
  }
}
