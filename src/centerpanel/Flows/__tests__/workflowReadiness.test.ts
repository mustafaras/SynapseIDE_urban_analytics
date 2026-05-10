import { describe, expect, it } from "vitest";
import type {
  UrbanDataFitnessProfile,
  UrbanMethodValidityEnvelope,
} from "@/features/urbanAnalytics/lib/types";
import { evaluateWorkflowReadiness } from "../workflowReadiness";

function makeValidityEnvelope(
  capabilityStatus: UrbanMethodValidityEnvelope["capabilityStatus"],
): UrbanMethodValidityEnvelope {
  return {
    validSpatialScales: ["neighborhood"],
    requiredDataTypes: ["vector"],
    requiredFields: ["population"],
    crsAssumptions: ["Projected CRS required for metric operations."],
    temporalAssumptions: [],
    methodFamily: "spatial-statistics",
    maturityLevel: "beta",
    capabilityStatus,
    assumptions: ["Inputs are complete."],
    limitations: ["Demo fixture only."],
    failureModes: ["Insufficient sample size."],
    interpretationWarnings: ["Interpret cautiously."],
    misuseWarnings: ["Do not treat as statutory evidence without validation."],
    peerReferenceIds: [],
  };
}

function makeFitness(status: UrbanDataFitnessProfile["status"]): UrbanDataFitnessProfile {
  return {
    status,
    blockedReasons: status === "blocked" ? ["Required fields are missing."] : [],
  } as UrbanDataFitnessProfile;
}

describe("evaluateWorkflowReadiness", () => {
  it("returns demo_only for demo execution even when context and fitness are unknown", () => {
    const readiness = evaluateWorkflowReadiness({
      runtimeMode: "demo",
      hasActiveContext: false,
      requiredInputs: [
        {
          id: "input-a",
          message: "Input is available.",
          remediation: "None.",
          satisfied: true,
        },
      ],
      methodValidity: null,
      dataFitness: null,
    });

    expect(readiness.status).toBe("demo_only");
    expect(readiness.issues.some((issue) => issue.code === "runtime:demo")).toBe(true);
  });

  it("returns blocked when required inputs fail", () => {
    const readiness = evaluateWorkflowReadiness({
      runtimeMode: "live",
      hasActiveContext: true,
      requiredInputs: [
        {
          id: "missing-required-input",
          message: "Required source layer is missing.",
          remediation: "Select a source layer before running.",
          satisfied: false,
        },
      ],
      methodValidity: makeValidityEnvelope("implemented"),
      dataFitness: makeFitness("ready"),
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.reasons).toContain("Required source layer is missing.");
    expect(readiness.remediationActions).toContain("Select a source layer before running.");
  });

  it("returns ready when checks pass for live mode", () => {
    const readiness = evaluateWorkflowReadiness({
      runtimeMode: "live",
      hasActiveContext: true,
      requiredInputs: [
        {
          id: "all-good",
          message: "All required inputs are present.",
          remediation: "None.",
          satisfied: true,
        },
      ],
      environmentChecks: [
        {
          id: "worker",
          message: "Worker available.",
          remediation: "None.",
          satisfied: true,
        },
      ],
      methodValidity: makeValidityEnvelope("implemented"),
      dataFitness: makeFitness("ready"),
    });

    expect(readiness.status).toBe("ready");
    expect(readiness.issues).toHaveLength(0);
  });

  it("returns blocked when capability is deferred", () => {
    const readiness = evaluateWorkflowReadiness({
      runtimeMode: "live",
      hasActiveContext: true,
      requiredInputs: [],
      methodValidity: makeValidityEnvelope("deferred"),
      dataFitness: makeFitness("ready"),
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.issues.some((issue) => issue.code === "validity:deferred")).toBe(true);
  });

  it("returns blocked when data fitness is blocked", () => {
    const readiness = evaluateWorkflowReadiness({
      runtimeMode: "live",
      hasActiveContext: true,
      requiredInputs: [],
      methodValidity: makeValidityEnvelope("implemented"),
      dataFitness: makeFitness("blocked"),
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.reasons).toContain("Required fields are missing.");
  });
});
