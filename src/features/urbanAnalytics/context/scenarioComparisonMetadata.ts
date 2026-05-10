import type {
  CompletedAnalysisRun,
  UrbanScenarioComparison,
  UrbanScenarioComparisonHandoffMetadata,
} from '../lib/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function clip(value: string, max = 240): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > max ? normalized.slice(0, max) : normalized;
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = clip(String(value), 320);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}

function asScenarioComparison(value: unknown): UrbanScenarioComparison | null {
  if (!isRecord(value)) return null;
  if (value.flowId !== 'scenario_comparison') return null;
  if (typeof value.comparisonId !== 'string' || typeof value.runId !== 'string') return null;
  if (!Array.isArray(value.candidateRuns) || !Array.isArray(value.indicatorsCompared) || !Array.isArray(value.deltas)) {
    return null;
  }
  if (!Array.isArray(value.limitations)) return null;
  return value as UrbanScenarioComparison;
}

function readComparisonFromOutput(
  output: { scenarioComparison?: unknown; metadata?: Record<string, unknown> },
): UrbanScenarioComparison | null {
  const direct = output.scenarioComparison;
  if (isRecord(direct) && direct.comparison !== undefined) {
    const nested = asScenarioComparison(direct.comparison);
    if (nested) return nested;
  }

  const directComparison = asScenarioComparison(direct);
  if (directComparison) return directComparison;

  if (isRecord(output.metadata)) {
    const metadataComparison = asScenarioComparison(output.metadata.scenarioComparison);
    if (metadataComparison) return metadataComparison;
  }

  return null;
}

export function extractUrbanScenarioComparison(
  run: CompletedAnalysisRun | null | undefined,
): UrbanScenarioComparison | null {
  if (!run || run.flowId !== 'scenario_comparison') return null;

  const comparisons: UrbanScenarioComparison[] = [];
  for (const output of run.mapOutputs) {
    const comparison = readComparisonFromOutput(output);
    if (comparison) comparisons.push(comparison);
  }
  for (const output of run.chartOutputs) {
    const comparison = readComparisonFromOutput(output);
    if (comparison) comparisons.push(comparison);
  }
  for (const output of run.dataOutputs) {
    const comparison = readComparisonFromOutput(output);
    if (comparison) comparisons.push(comparison);
  }

  if (comparisons.length === 0) return null;

  const deduped = new Map<string, UrbanScenarioComparison>();
  for (const comparison of comparisons) {
    if (!deduped.has(comparison.comparisonId)) {
      deduped.set(comparison.comparisonId, comparison);
    }
  }

  const values = [...deduped.values()];
  return values.find((comparison) => comparison.runId === run.runId) ?? values[0] ?? null;
}

export function buildUrbanScenarioComparisonHandoff(
  comparison: UrbanScenarioComparison,
): UrbanScenarioComparisonHandoffMetadata {
  return {
    comparisonId: comparison.comparisonId,
    baselineLabel: comparison.baseline.label,
    candidateCount: comparison.candidateRuns.length,
    indicatorCount: comparison.indicatorsCompared.length,
    deltaCount: comparison.deltas.length,
    policyInterpretationMode: comparison.policyInterpretation.mode,
    guidanceSummary: clip(
      comparison.policyInterpretation.summary
      || comparison.policyInterpretation.guidance[0]
      || 'Scenario comparison is guidance-only and requires analyst review.',
      220,
    ),
    uncertaintyNotes: buildUrbanScenarioUncertaintyNotes(comparison),
    limitationCount: comparison.limitations.length,
  };
}

export function buildUrbanScenarioInterpretationGuidance(comparison: UrbanScenarioComparison): string[] {
  return unique([
    comparison.policyInterpretation.summary,
    ...comparison.policyInterpretation.guidance,
    ...comparison.policyInterpretation.recommendedFollowUps.map((item) => `Follow-up: ${item}`),
  ]);
}

export function buildUrbanScenarioUncertaintyNotes(comparison: UrbanScenarioComparison): string[] {
  return unique([
    ...comparison.uncertaintyNotes,
    ...comparison.policyInterpretation.uncertaintyNotes,
  ]);
}

export function buildUrbanScenarioLimitationNotes(comparison: UrbanScenarioComparison): string[] {
  return unique([
    ...comparison.limitations,
    ...buildUrbanScenarioUncertaintyNotes(comparison).map((item) => `Uncertainty: ${item}`),
  ]);
}
