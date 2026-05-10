/**
 * Shared utilities for analytical flow components:
 * JSON export, state restore, validation, and result summaries.
 */
import type { FlowId } from "./flowTypes";

/* ------------------------------------------------------------------ */
/*  JSON export                                                        */
/* ------------------------------------------------------------------ */

export interface FlowExportPayload {
  flowId: FlowId;
  version: string;
  exportedAt: string;
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
}

export function exportFlowJSON(
  flowId: FlowId,
  parameters: Record<string, unknown>,
  results: Record<string, unknown> = {},
): FlowExportPayload {
  return {
    flowId,
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    parameters,
    results,
  };
}

export function downloadJSON(payload: FlowExportPayload): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${payload.flowId}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  State restore                                                      */
/* ------------------------------------------------------------------ */

export function restoreFormState<T>(
  stepData: Record<string, unknown>,
  key: string,
  fallback: T,
): T {
  const stored = stepData[key];
  if (stored && typeof stored === "object") return stored as T;
  return fallback;
}

/* ------------------------------------------------------------------ */
/*  Validation helpers                                                 */
/* ------------------------------------------------------------------ */

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === "") {
    return `${fieldName} is required.`;
  }
  if (Array.isArray(value) && value.length === 0) {
    return `${fieldName} must have at least one entry.`;
  }
  return null;
}

export function validateMinLength(arr: unknown[], min: number, fieldName: string): string | null {
  if (arr.length < min) {
    return `${fieldName} must have at least ${min} entries.`;
  }
  return null;
}

export function validateRange(value: number, min: number, max: number, fieldName: string): string | null {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}.`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Result summary builders                                            */
/* ------------------------------------------------------------------ */

export function buildCompositeIndicatorSummary(form: {
  indicators?: { name: string }[];
  normMethod?: string;
  weightMethod?: string;
  aggregation?: string;
  outputTitle?: string;
  imputationMethod?: string;
  sensitivityRuns?: number;
  robustnessTier?: string;
  topKStability?: number;
}): string {
  const indicators = form.indicators ?? [];
  return [
    `Composite Indicator Analysis`,
    `Indicators selected: ${indicators.length} (${indicators.map((i) => i.name).filter(Boolean).join(", ") || "none named"})`,
    `Missing data: ${String(form.imputationMethod ?? "mean").replace(/_/g, " ")}`,
    `Normalization: ${String(form.normMethod ?? "min_max").replace(/_/g, "-")}`,
    `Weighting: ${String(form.weightMethod ?? "equal").replace(/_/g, " ")}`,
    `Aggregation: ${form.aggregation ?? "arithmetic"}`,
    `Sensitivity runs: ${form.sensitivityRuns ?? "not configured"}`,
    `Robustness: ${form.robustnessTier ?? "not estimated"}`,
    `Top-K stability: ${
      typeof form.topKStability === "number"
        ? `${(form.topKStability * 100).toFixed(1)}%`
        : "not estimated"
    }`,
    `Output: ${form.outputTitle || "Untitled"}`,
    `This composite index combines ${indicators.length} indicator(s) using ${form.aggregation ?? "arithmetic"} aggregation.`,
  ].join("\n");
}

export function buildScenarioComparisonSummary(form: {
  baselineName?: string;
  scenarios?: { name: string }[];
  selectedMetrics?: string[];
  outputTitle?: string;
}): string {
  const scenarios = form.scenarios ?? [];
  const metrics = form.selectedMetrics ?? [];
  return [
    `Scenario Comparison Analysis`,
    `Baseline: ${form.baselineName || "unnamed"}`,
    `Scenarios compared: ${scenarios.length} (${scenarios.map((s) => s.name).filter(Boolean).join(", ") || "none named"})`,
    `Metrics evaluated: ${metrics.length} (${metrics.join(", ") || "none"})`,
    `Output: ${form.outputTitle || "Untitled"}`,
  ].join("\n");
}

export function buildEquityAuditSummary(form: {
  demographicSource?: string;
  demographicDimensions?: string[];
  serviceLayer?: string;
  spatialUnit?: string;
  equityMeasure?: string;
  outputTitle?: string;
}): string {
  const dims = form.demographicDimensions ?? [];
  return [
    `Equity Audit Analysis`,
    `Demographic source: ${form.demographicSource || "unspecified"}`,
    `Demographic dimensions: ${dims.join(", ") || "none"}`,
    `Service layer: ${form.serviceLayer || "unspecified"}`,
    `Spatial unit: ${form.spatialUnit || "unspecified"}`,
    `Equity measure: ${form.equityMeasure || "unspecified"}`,
    `Output: ${form.outputTitle || "Untitled"}`,
  ].join("\n");
}

export function buildChangeDetectionSummary(form: {
  t0Source?: string;
  t0Date?: string;
  t1Source?: string;
  t1Date?: string;
  method?: string;
  changeThreshold?: number;
  outputTitle?: string;
}): string {
  return [
    `Change Detection Analysis`,
    `T0: ${form.t0Source || "unspecified"} (${form.t0Date || "no date"})`,
    `T1: ${form.t1Source || "unspecified"} (${form.t1Date || "no date"})`,
    `Method: ${String(form.method ?? "unspecified").replace(/_/g, " ")}`,
    `Threshold: ${form.changeThreshold ?? "default"}`,
    `Output: ${form.outputTitle || "Untitled"}`,
  ].join("\n");
}

export function buildRunReviewSummary(form: {
  selectedRunId?: string;
  annotations?: string;
  qualityFlags?: string[];
  exportFormat?: string;
}): string {
  return [
    `Analytical Run Review`,
    `Run: ${form.selectedRunId || "none selected"}`,
    `Annotations: ${form.annotations || "none"}`,
    `Quality flags: ${(form.qualityFlags ?? []).join(", ") || "none"}`,
    `Export format: ${form.exportFormat || "json"}`,
  ].join("\n");
}
