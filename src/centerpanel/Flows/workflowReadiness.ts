import type {
  UrbanDataFitnessProfile,
  UrbanMethodCapabilityStatus,
  UrbanMethodValidityEnvelope,
  UrbanWorkflowReadinessIssue,
  UrbanWorkflowReadinessResult,
  UrbanWorkflowReadinessStatus,
  UrbanWorkflowRuntimeMode,
} from "@/features/urbanAnalytics/lib/types";

export interface WorkflowReadinessCheck {
  id: string;
  message: string;
  remediation: string;
  satisfied: boolean;
  severity?: "warning" | "blocked";
}

export interface WorkflowReadinessInput {
  runtimeMode: UrbanWorkflowRuntimeMode;
  hasActiveContext: boolean;
  requiredInputs: WorkflowReadinessCheck[];
  environmentChecks?: WorkflowReadinessCheck[];
  methodValidity: UrbanMethodValidityEnvelope | null;
  dataFitness: UrbanDataFitnessProfile | null;
  checkedAt?: string;
}

function addIssue(
  issues: UrbanWorkflowReadinessIssue[],
  reasons: string[],
  actions: Set<string>,
  issue: UrbanWorkflowReadinessIssue,
  remediation: string,
): void {
  issues.push(issue);
  reasons.push(issue.message);
  if (remediation.trim()) {
    actions.add(remediation.trim());
  }
}

function finalizeStatus(input: {
  runtimeMode: UrbanWorkflowRuntimeMode;
  hasBlocked: boolean;
  hasWarning: boolean;
  hasUnknown: boolean;
  capabilityStatus: UrbanMethodCapabilityStatus | null;
}): UrbanWorkflowReadinessStatus {
  if (input.hasBlocked) return "blocked";

  if (input.runtimeMode === "demo" || input.capabilityStatus === "demo_mode") {
    return "demo_only";
  }

  if (input.hasUnknown) return "unknown";
  if (input.hasWarning) return "warning";
  return "ready";
}

export function evaluateWorkflowReadiness(
  input: WorkflowReadinessInput,
): UrbanWorkflowReadinessResult {
  const issues: UrbanWorkflowReadinessIssue[] = [];
  const reasons: string[] = [];
  const actions = new Set<string>();

  const allChecks = [...input.requiredInputs, ...(input.environmentChecks ?? [])];
  for (const check of allChecks) {
    if (check.satisfied) continue;
    const severity = check.severity ?? "blocked";
    addIssue(
      issues,
      reasons,
      actions,
      {
        code: `check:${check.id}`,
        severity,
        message: check.message,
      },
      check.remediation,
    );
  }

  if (!input.hasActiveContext) {
    addIssue(
      issues,
      reasons,
      actions,
      {
        code: "context:missing",
        severity: "unknown",
        message: "No active Urban Analysis Context is linked to this run.",
      },
      "Create or restore an Urban Analysis Context before publishing production evidence.",
    );
  }

  const capabilityStatus = input.methodValidity?.capabilityStatus ?? null;
  if (input.methodValidity == null) {
    addIssue(
      issues,
      reasons,
      actions,
      {
        code: "validity:not-evaluated",
        severity: "unknown",
        message: "Method validity envelope is not available for this workflow.",
      },
      "Attach a method validity envelope to the workflow metadata.",
    );
  } else {
    if (capabilityStatus === "deferred") {
      addIssue(
        issues,
        reasons,
        actions,
        {
          code: "validity:deferred",
          severity: "blocked",
          message: "Workflow capability is marked as deferred and cannot run in production mode.",
        },
        "Use a workflow with implemented or demo_mode capability, or complete deferred implementation.",
      );
    } else if (capabilityStatus === "environment_dependent" || capabilityStatus === "residual_gap") {
      addIssue(
        issues,
        reasons,
        actions,
        {
          code: `validity:${capabilityStatus}`,
          severity: "warning",
          message: `Workflow capability is ${capabilityStatus.replace("_", " ")} and requires explicit caveats.`,
        },
        "Review workflow limitations and include caveats in report/dashboard exports.",
      );
    } else if (capabilityStatus === "demo_mode") {
      addIssue(
        issues,
        reasons,
        actions,
        {
          code: "validity:demo-mode",
          severity: "warning",
          message: "Workflow capability is demo_mode and outputs must be labeled as non-production evidence.",
        },
        "Keep demo labeling visible in map, report, and dashboard surfaces.",
      );
    }
  }

  if (input.dataFitness == null) {
    addIssue(
      issues,
      reasons,
      actions,
      {
        code: "fitness:not-evaluated",
        severity: "unknown",
        message: "Data fitness profile is not evaluated for this run.",
      },
      "Evaluate data fitness before interpreting this run as production-ready evidence.",
    );
  } else if (input.dataFitness.status === "blocked") {
    addIssue(
      issues,
      reasons,
      actions,
      {
        code: "fitness:blocked",
        severity: "blocked",
        message: input.dataFitness.blockedReasons[0] ?? "Data fitness is blocked for this run.",
      },
      "Resolve blocked data fitness requirements before execution.",
    );
  } else if (input.dataFitness.status === "warning") {
    addIssue(
      issues,
      reasons,
      actions,
      {
        code: "fitness:warning",
        severity: "warning",
        message: "Data fitness contains warning-level caveats.",
      },
      "Document warning-level caveats in workflow interpretation.",
    );
  } else if (input.dataFitness.status === "unknown") {
    addIssue(
      issues,
      reasons,
      actions,
      {
        code: "fitness:unknown",
        severity: "unknown",
        message: "Data fitness remains unknown due to incomplete metadata.",
      },
      "Collect missing metadata fields and recompute data fitness.",
    );
  }

  if (input.runtimeMode === "synthetic") {
    addIssue(
      issues,
      reasons,
      actions,
      {
        code: "runtime:synthetic",
        severity: "warning",
        message: "Workflow is configured for synthetic mode; outputs are not real-world evidence.",
      },
      "Switch to live data inputs for production evidence.",
    );
  }

  if (input.runtimeMode === "demo") {
    addIssue(
      issues,
      reasons,
      actions,
      {
        code: "runtime:demo",
        severity: "warning",
        message: "Workflow is running in demo mode and must remain explicitly labeled.",
      },
      "Keep demo labels visible in all downstream publications.",
    );
  }

  const hasBlocked = issues.some((issue) => issue.severity === "blocked");
  const hasWarning = issues.some((issue) => issue.severity === "warning");
  const hasUnknown = issues.some((issue) => issue.severity === "unknown");

  return {
    status: finalizeStatus({
      runtimeMode: input.runtimeMode,
      hasBlocked,
      hasWarning,
      hasUnknown,
      capabilityStatus,
    }),
    runtimeMode: input.runtimeMode,
    reasons,
    remediationActions: [...actions],
    issues,
    checkedAt: input.checkedAt ?? new Date().toISOString(),
  };
}
