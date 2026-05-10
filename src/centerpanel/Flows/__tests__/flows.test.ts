/**
 * Smoke tests for analytical workflows.
 * Tests cover:
 *   1. Flow definition completeness and step integrity
 *   2. Flow utility functions (export, restore, validation)
 *   3. Result summary builders for downstream review surfaces
 */

import { describe, expect, it } from "vitest";
import { FLOW_DEFINITIONS, type FlowId } from "../flowTypes";
import {
  buildChangeDetectionSummary,
  buildCompositeIndicatorSummary,
  buildEquityAuditSummary,
  buildRunReviewSummary,
  buildScenarioComparisonSummary,
  exportFlowJSON,
  restoreFormState,
  validateMinLength,
  validateRange,
  validateRequired,
} from "../flowUtils";

/* ------------------------------------------------------------------ */
/*  1. Flow definitions                                                */
/* ------------------------------------------------------------------ */

describe("FLOW_DEFINITIONS completeness", () => {
  const EXPECTED_IDS: FlowId[] = [
    "site_suitability",
    "accessibility",
    "vulnerability",
    "emerging_hot_spot",
    "urban_morphology",
    "object_detection",
    "indicator_composite",
    "scenario_comparison",
    "equity_audit",
    "change_detection",
    "voxcity_3d",
    "cityjson_loader",
    "sunlight_sim",
    "facility_optimisation",
    "urban_growth_ca",
    "system_dynamics",
    "review",
  ];

  it("contains all 17 analytical flow definitions", () => {
    expect(FLOW_DEFINITIONS).toHaveLength(17);
  });

  it.each(EXPECTED_IDS)("includes definition for %s", (flowId) => {
    const def = FLOW_DEFINITIONS.find((d) => d.id === flowId);
    expect(def).toBeDefined();
    expect(def!.label).toBeTruthy();
    expect(def!.icon).toBeTruthy();
    expect(def!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("each flow has unique step keys within its definition", () => {
    for (const def of FLOW_DEFINITIONS) {
      const keys = def.steps.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  2. Export / Restore utilities                                      */
/* ------------------------------------------------------------------ */

describe("exportFlowJSON", () => {
  it("produces a valid export payload", () => {
    const payload = exportFlowJSON(
      "indicator_composite",
      { a: 1, b: "hello" },
      { score: 42 },
    );
    expect(payload.flowId).toBe("indicator_composite");
    expect(payload.version).toBe("1.0.0");
    expect(payload.exportedAt).toBeTruthy();
    expect(payload.parameters).toEqual({ a: 1, b: "hello" });
    expect(payload.results).toEqual({ score: 42 });
  });

  it("defaults results to empty object when omitted", () => {
    const payload = exportFlowJSON("review", { run: "r1" });
    expect(payload.results).toEqual({});
  });
});

describe("restoreFormState", () => {
  it("restores stored state when key matches", () => {
    const stored = { myKey: { name: "test", count: 3 } };
    const result = restoreFormState(stored, "myKey", { name: "", count: 0 });
    expect(result).toEqual({ name: "test", count: 3 });
  });

  it("returns fallback when key is missing", () => {
    const fallback = { x: 10 };
    const result = restoreFormState({}, "missing", fallback);
    expect(result).toBe(fallback);
  });

  it("returns fallback when stored value is not an object", () => {
    const fallback = { x: 10 };
    const result = restoreFormState({ key: "string_value" }, "key", fallback);
    expect(result).toBe(fallback);
  });
});

/* ------------------------------------------------------------------ */
/*  3. Validation helpers                                              */
/* ------------------------------------------------------------------ */

describe("validation helpers", () => {
  describe("validateRequired", () => {
    it("passes for non-empty string", () => {
      expect(validateRequired("hello", "Name")).toBeNull();
    });
    it("fails for empty string", () => {
      expect(validateRequired("", "Name")).toContain("required");
    });
    it("fails for empty array", () => {
      expect(validateRequired([], "Items")).toContain("at least one");
    });
    it("passes for non-empty array", () => {
      expect(validateRequired([1, 2], "Items")).toBeNull();
    });
  });

  describe("validateMinLength", () => {
    it("passes when array meets minimum", () => {
      expect(validateMinLength([1, 2, 3], 2, "Rows")).toBeNull();
    });
    it("fails when array is too short", () => {
      expect(validateMinLength([1], 3, "Rows")).toContain("at least 3");
    });
  });

  describe("validateRange", () => {
    it("passes when value is in range", () => {
      expect(validateRange(5, 0, 10, "Score")).toBeNull();
    });
    it("fails when value is below range", () => {
      expect(validateRange(-1, 0, 10, "Score")).toContain("between");
    });
    it("fails when value is above range", () => {
      expect(validateRange(11, 0, 10, "Score")).toContain("between");
    });
  });
});

/* ------------------------------------------------------------------ */
/*  4. Result summary builders                                         */
/* ------------------------------------------------------------------ */

describe("result summary builders", () => {
  it("buildCompositeIndicatorSummary includes indicator count", () => {
    const summary = buildCompositeIndicatorSummary({
      indicators: [{ name: "A" }, { name: "B" }],
      imputationMethod: "mean",
      normMethod: "z_score",
      weightMethod: "expert",
      aggregation: "geometric",
      sensitivityRuns: 120,
      robustnessTier: "high",
      topKStability: 0.91,
      outputTitle: "Urban Livability Index",
    });
    expect(summary).toContain("Indicators selected: 2");
    expect(summary).toContain("Missing data: mean");
    expect(summary).toContain("z-score");
    expect(summary).toContain("expert");
    expect(summary).toContain("geometric");
    expect(summary).toContain("Sensitivity runs: 120");
    expect(summary).toContain("Robustness: high");
    expect(summary).toContain("Urban Livability Index");
  });

  it("buildScenarioComparisonSummary includes scenario and metric counts", () => {
    const summary = buildScenarioComparisonSummary({
      baselineName: "Current State",
      scenarios: [{ name: "A" }, { name: "B" }, { name: "C" }],
      selectedMetrics: ["pop_density", "transit_access"],
      outputTitle: "Growth Scenarios",
    });
    expect(summary).toContain("Current State");
    expect(summary).toContain("Scenarios compared: 3");
    expect(summary).toContain("Metrics evaluated: 2");
    expect(summary).toContain("Growth Scenarios");
  });

  it("buildEquityAuditSummary includes measure and spatial unit", () => {
    const summary = buildEquityAuditSummary({
      serviceLayer: "Parks",
      spatialUnit: "tract",
      equityMeasure: "gini",
      demographicDimensions: ["income", "race"],
      outputTitle: "Park Equity",
    });
    expect(summary).toContain("Parks");
    expect(summary).toContain("tract");
    expect(summary).toContain("gini");
    expect(summary).toContain("income, race");
    expect(summary).toContain("Park Equity");
  });

  it("buildChangeDetectionSummary includes temporal sources", () => {
    const summary = buildChangeDetectionSummary({
      t0Source: "Sentinel-2",
      t0Date: "2020-01-15",
      t1Source: "Sentinel-2",
      t1Date: "2024-01-15",
      method: "post_classification",
      changeThreshold: 0.15,
      outputTitle: "Urban Expansion",
    });
    expect(summary).toContain("Sentinel-2");
    expect(summary).toContain("2020-01-15");
    expect(summary).toContain("2024-01-15");
    expect(summary).toContain("post classification");
    expect(summary).toContain("0.15");
    expect(summary).toContain("Urban Expansion");
  });

  it("buildRunReviewSummary includes annotations and flags", () => {
    const summary = buildRunReviewSummary({
      selectedRunId: "run-123",
      annotations: "Looks good",
      qualityFlags: ["Data quality verified", "Reproducible"],
      exportFormat: "pdf",
    });
    expect(summary).toContain("run-123");
    expect(summary).toContain("Looks good");
    expect(summary).toContain("Data quality verified");
    expect(summary).toContain("Reproducible");
    expect(summary).toContain("pdf");
  });

  it("summary builders handle missing fields gracefully", () => {
    expect(() => buildCompositeIndicatorSummary({})).not.toThrow();
    expect(() => buildScenarioComparisonSummary({})).not.toThrow();
    expect(() => buildEquityAuditSummary({})).not.toThrow();
    expect(() => buildChangeDetectionSummary({})).not.toThrow();
    expect(() => buildRunReviewSummary({})).not.toThrow();
  });
});
