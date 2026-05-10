import type { Encounter, Patient } from "../../registry/types";
import type { FlowId } from "../flowTypes";

export interface FlowSuggestion {
  flowId: FlowId;
  priority: number;
  titleLine: string;
  explainerLine: string;
  reasonCode?: string;
}

export function getSuggestions(project?: Patient, session?: Encounter): FlowSuggestion[] {
  const out: FlowSuggestion[] = [];
  const flags = session?.flags || {};
  const completed = new Set<string>(Array.isArray(session?.completedFlows) ? (session!.completedFlows as string[]) : []);

  const grade = typeof project?.grade === "number" ? project!.grade : (typeof project?.risk === "number" ? project!.risk : undefined);

  const push = (s: FlowSuggestion) => { out.push(s); };

  // Data Quality Review trigger
  const safetyTrigger = (
    (typeof grade === "number" && grade >= 4) ||
    flags.dataQualityConcernsRaised === true ||
    flags.safetyConcernsRaised === true
  );
  const safetyCooldownAllows = (
    !completed.has("safety") || flags.dataQualityConcernsRaised === true || flags.safetyConcernsRaised === true
  );
  if (safetyTrigger && safetyCooldownAllows) {
    push({
      flowId: "vulnerability",
      priority: 1,
      titleLine: "Consider Data Quality Review",
      explainerLine:
        "High indicator burden and recent escalation → review current data integrity and quality status.",
      reasonCode: "DATA_QUALITY_CONCERN",
    });
  }

  // Anomaly Detection trigger
  const anomalyEvent = (
    flags.anomalyDetected === true ||
    flags.securityInvolved === true ||
    flags.deescalationAttemptsMade === true
  );
  const anomalyCooldownAllows = (!completed.has("change_detection") || anomalyEvent);
  if (anomalyEvent && anomalyCooldownAllows) {
    push({
      flowId: "change_detection",
      priority: 2,
      titleLine: "Consider Anomaly Detection & Resolution",
      explainerLine:
        "Marked anomaly detected → document observed patterns, resolution efforts, and escalation rationale.",
      reasonCode: "ANOMALY_EVENT",
    });
  }

  // Spatial Pattern Analysis trigger
  const patternSignal = (
    (typeof grade === "number" && grade >= 3) ||
    flags.spatialPatternObserved === true ||
    flags.sensitivityAnalysisDiscussed === true
  );
  if (patternSignal) {
    if (flags.sensitivityAnalysisDiscussed === true && !completed.has("scenario_comparison")) {
      push({
        flowId: "scenario_comparison",
        priority: 3,
        titleLine: "Consider Sensitivity Analysis",
        explainerLine:
          "Sensitivity analysis underway → document baseline parameters, input variations, observed response, and validation monitoring.",
        reasonCode: "SENSITIVITY_ANALYSIS_IN_PROGRESS",
      });
    }
    if (!completed.has("urban_morphology")) {
      push({
        flowId: "urban_morphology",
        priority: 3,
        titleLine: "Consider Spatial Pattern Analysis",
        explainerLine:
          "Pattern anomalies observed → document spatial findings, stability metrics, and monitoring plan.",
        reasonCode: "SPATIAL_PATTERN_DETECTED",
      });
    }
  }

  // Data Fitness Assessment trigger
  const capacityTrigger = (
    flags.dataCompletenessLow === true ||
    flags.refusalOfRecommendedCare === true ||
    flags.questionableCapacityForDecision === true ||
    flags.highRiskIfExcluded === true
  );
  const capacityCooldownAllows = (!completed.has("capacity") || flags.questionableCapacityForDecision === true);
  if (capacityTrigger && capacityCooldownAllows) {
    push({
      flowId: "indicator_composite",
      priority: 4,
      titleLine: "Consider Data Fitness Assessment",
      explainerLine:
        "Data fitness concerns identified → document completeness, temporal resolution, standards compliance, and provenance.",
      reasonCode: "DATA_FITNESS_CONCERN",
    });
  }

  // Monitoring & Validation trigger
  const observationSignal = (
    flags.activeMonitoring === true ||
    flags.constantObservationActive === true ||
    flags.continuousOneToOne === true
  );
  if (observationSignal && !completed.has("observation")) {
    push({
      flowId: "change_detection",
      priority: 2,
      titleLine: "Consider Monitoring & Validation",
      explainerLine:
        "Active monitoring in effect → document observed patterns, validation attempts, rationale, and step-down plan.",
      reasonCode: "ACTIVE_MONITORING",
    });
  }

  return out.sort((a, b) => (a.priority - b.priority));
}
