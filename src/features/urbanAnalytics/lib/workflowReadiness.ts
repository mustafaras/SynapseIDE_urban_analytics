/**
 * Workflow Readiness Evaluator - Prompt 15
 *
 * Centralized preflight gate that evaluates whether a workflow can execute
 * responsibly by checking active context, data fitness, method validity,
 * and environment dependencies.
 *
 * Scientific contract:
 *  - `blocked` prevents execution with actionable remediation.
 *  - `demo_only` allows execution only under explicit demo labeling.
 *  - `unknown` means key metadata could not be verified - not equivalent to ready.
 *  - Missing inputs produce `unknown` or `blocked`, never false readiness.
 */

import type {
  AnalyticalFlowId,
  UrbanAnalysisContext,
  UrbanDataFitnessProfile,
  UrbanDataFitnessStatus,
  UrbanMethodValidityEnvelope,
  UrbanWorkflowReadinessIssue,
  UrbanWorkflowReadinessResult,
  UrbanWorkflowReadinessStatus,
  UrbanWorkflowRuntimeMode,
} from './types';

import type {
  UrbanMethodMetadataSource,
  UrbanMethodValidityValidationResult,
} from '../context/methodValidity';

import { validateUrbanMethodMetadata } from '../context/methodValidity';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface EvaluateWorkflowReadinessInput {
  /** Flow to evaluate readiness for. */
  flowId: AnalyticalFlowId;
  /** Active Urban Analysis Context (null = no context bound). */
  context: UrbanAnalysisContext | null;
  /** Data fitness profile evaluated for current inputs (null = not evaluated). */
  dataFitness: UrbanDataFitnessProfile | null;
  /** Method metadata source for validity evaluation. */
  methodSource: UrbanMethodMetadataSource | null;
  /** Pre-computed validity result (skips re-evaluation when provided). */
  validityResult?: UrbanMethodValidityValidationResult;
  /** Explicit runtime mode override (e.g. forced demo). */
  runtimeMode?: UrbanWorkflowRuntimeMode;
  /** Whether required environment dependencies are available (API keys, services). */
  environmentReady?: boolean;
}

// ---------------------------------------------------------------------------
// evaluateWorkflowReadiness
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a workflow is ready for responsible execution.
 *
 * Checks (in severity order):
 * 1. Context presence and completeness.
 * 2. Data fitness profile status.
 * 3. Method validity envelope and capability status.
 * 4. Environment dependency availability.
 *
 * Returns a `UrbanWorkflowReadinessResult` suitable for recording in the
 * run manifest and displaying in readiness gate UI.
 */
export function evaluateWorkflowReadiness(
  input: EvaluateWorkflowReadinessInput,
): UrbanWorkflowReadinessResult {
  const issues: UrbanWorkflowReadinessIssue[] = [];
  const remediationActions: string[] = [];

  evaluateContext(input, issues, remediationActions);
  evaluateDataFitness(input.dataFitness, issues, remediationActions);

  const validity = input.validityResult ??
    (input.methodSource ? validateUrbanMethodMetadata(input.methodSource) : null);
  evaluateMethodValidity(validity, issues, remediationActions);
  evaluateEnvironment(input.environmentReady, issues, remediationActions);

  const status = deriveOverallStatus(issues, validity);
  const runtimeMode = deriveRuntimeMode(input, validity, status);
  const reasons = issues.map((i) => i.message);

  return {
    status,
    runtimeMode,
    reasons,
    remediationActions,
    issues,
    checkedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Check: Context
// ---------------------------------------------------------------------------

function evaluateContext(
  input: EvaluateWorkflowReadinessInput,
  issues: UrbanWorkflowReadinessIssue[],
  remediationActions: string[],
): void {
  const ctx = input.context;

  if (!ctx) {
    issues.push({
      code: 'NO_CONTEXT',
      severity: 'warning',
      message: 'No Urban Analysis Context is active; results cannot be linked to a study area.',
    });
    remediationActions.push('Create or restore an Urban Analysis Context before running.');
    return;
  }

  if (!ctx.activeFlowId) {
    issues.push({
      code: 'NO_ACTIVE_FLOW',
      severity: 'warning',
      message: 'No active workflow is set in the analysis context.',
    });
  }

  if (ctx.activeLayerIds.length === 0) {
    issues.push({
      code: 'NO_LAYERS',
      severity: 'warning',
      message: 'No map layers are linked to the analysis context; spatial data may be unavailable.',
    });
    remediationActions.push('Add at least one spatial data layer from Map Explorer.');
  }

  if (!ctx.studyAreaId && !ctx.activeAoiId) {
    issues.push({
      code: 'NO_STUDY_AREA',
      severity: 'warning',
      message: 'No study area or AOI is defined; analysis scope is unbounded.',
    });
    remediationActions.push('Define a study area or select an AOI.');
  }
}

// ---------------------------------------------------------------------------
// Check: Data Fitness
// ---------------------------------------------------------------------------

const FITNESS_SEVERITY_MAP: Record<UrbanDataFitnessStatus, UrbanWorkflowReadinessIssue['severity'] | null> = {
  ready: null,
  warning: 'warning',
  blocked: 'blocked',
  unknown: 'unknown',
};

function evaluateDataFitness(
  profile: UrbanDataFitnessProfile | null,
  issues: UrbanWorkflowReadinessIssue[],
  remediationActions: string[],
): void {
  if (!profile) {
    issues.push({
      code: 'NO_DATA_FITNESS',
      severity: 'unknown',
      message: 'Data fitness has not been evaluated; input quality is unverified.',
    });
    remediationActions.push('Evaluate data fitness before running the workflow.');
    return;
  }

  const severity = FITNESS_SEVERITY_MAP[profile.status];
  if (!severity) return;

  if (profile.status === 'blocked') {
    const blockedReasons = profile.blockedReasons?.length
      ? profile.blockedReasons.join('; ')
      : 'Input data does not meet minimum requirements.';
    issues.push({
      code: 'DATA_FITNESS_BLOCKED',
      severity: 'blocked',
      message: `Data fitness is blocked: ${blockedReasons}`,
    });
    remediationActions.push('Resolve data fitness issues before running.');
  } else if (profile.status === 'warning') {
    issues.push({
      code: 'DATA_FITNESS_WARNING',
      severity: 'warning',
      message: `Data fitness has warnings: ${(profile.issues ?? []).map((i) => i.message ?? i.code).join('; ') || 'review data quality.'}`,
    });
  } else {
    issues.push({
      code: 'DATA_FITNESS_UNKNOWN',
      severity: 'unknown',
      message: 'Data fitness status is unknown; input quality cannot be confirmed.',
    });
  }
}

// ---------------------------------------------------------------------------
// Check: Method Validity
// ---------------------------------------------------------------------------

function evaluateMethodValidity(
  validity: UrbanMethodValidityValidationResult | null,
  issues: UrbanWorkflowReadinessIssue[],
  remediationActions: string[],
): void {
  if (!validity) {
    issues.push({
      code: 'NO_METHOD_VALIDITY',
      severity: 'unknown',
      message: 'Method validity metadata is unavailable; analytical defensibility is unverified.',
    });
    remediationActions.push('Ensure method metadata is available for the selected workflow.');
    return;
  }

  if (validity.capabilityStatus === 'deferred') {
    issues.push({
      code: 'METHOD_DEFERRED',
      severity: 'blocked',
      message: 'This method is deferred and not available for execution.',
    });
    return;
  }

  if (validity.capabilityStatus === 'demo_mode') {
    issues.push({
      code: 'METHOD_DEMO_ONLY',
      severity: 'warning',
      message: 'This method is in demo mode; results must not be treated as production-grade evidence.',
    });
  }

  if (validity.status === 'missing') {
    issues.push({
      code: 'METHOD_VALIDITY_MISSING',
      severity: 'unknown',
      message: 'Method validity envelope is entirely missing; assumptions and limitations are unknown.',
    });
    remediationActions.push('Complete method validity metadata before formal use.');
  } else if (validity.status === 'partial') {
    issues.push({
      code: 'METHOD_VALIDITY_PARTIAL',
      severity: 'warning',
      message: `Method validity is incomplete: missing ${validity.missingFields.join(', ')}.`,
    });
  }

  for (const warning of validity.warnings) {
    if (!issues.some((i) => i.message === warning)) {
      issues.push({
        code: 'METHOD_VALIDITY_WARNING',
        severity: 'warning',
        message: warning,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Check: Environment
// ---------------------------------------------------------------------------

function evaluateEnvironment(
  environmentReady: boolean | undefined,
  issues: UrbanWorkflowReadinessIssue[],
  remediationActions: string[],
): void {
  if (environmentReady === false) {
    issues.push({
      code: 'ENVIRONMENT_NOT_READY',
      severity: 'blocked',
      message: 'Required environment dependencies (API keys, services) are not available.',
    });
    remediationActions.push('Check environment configuration and required service availability.');
  }
}

// ---------------------------------------------------------------------------
// Derivation helpers
// ---------------------------------------------------------------------------

function deriveOverallStatus(
  issues: UrbanWorkflowReadinessIssue[],
  validity: UrbanMethodValidityValidationResult | null,
): UrbanWorkflowReadinessStatus {
  if (issues.some((i) => i.severity === 'blocked')) return 'blocked';
  if (validity?.capabilityStatus === 'demo_mode') return 'demo_only';
  if (issues.some((i) => i.severity === 'unknown')) return 'unknown';
  if (issues.some((i) => i.severity === 'warning')) return 'warning';
  return 'ready';
}

function deriveRuntimeMode(
  input: EvaluateWorkflowReadinessInput,
  validity: UrbanMethodValidityValidationResult | null,
  status: UrbanWorkflowReadinessStatus,
): UrbanWorkflowRuntimeMode {
  if (input.runtimeMode) return input.runtimeMode;
  if (validity?.capabilityStatus === 'demo_mode' || status === 'demo_only') return 'demo';
  if (status === 'unknown') return 'unknown';
  return 'live';
}
