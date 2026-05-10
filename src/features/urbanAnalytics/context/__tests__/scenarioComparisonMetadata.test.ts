import {
  buildScenarioComparisonResult,
  DEFAULT_SCENARIO_COMPARISON_FORM,
} from '@/centerpanel/Flows/scenarioComparisonShared';
import { buildScenarioComparisonCompletedRun } from '@/centerpanel/Flows/scenarioComparisonArtifacts';
import type { CompletedAnalysisRun } from '@/features/urbanAnalytics/lib/types';
import {
  buildUrbanScenarioComparisonHandoff,
  buildUrbanScenarioInterpretationGuidance,
  buildUrbanScenarioLimitationNotes,
  extractUrbanScenarioComparison,
} from '../scenarioComparisonMetadata';

describe('scenarioComparisonMetadata helpers', () => {
  it('extracts stable scenario comparison metadata from scenario-comparison run outputs', () => {
    const form = {
      ...DEFAULT_SCENARIO_COMPARISON_FORM,
      outputTitle: 'Prompt 24 scenario metadata fixture',
    };
    const result = buildScenarioComparisonResult(form);
    const run = buildScenarioComparisonCompletedRun(form, result, {
      runId: 'scenario-meta-run-1',
      insertedAt: '2026-05-09T12:10:00.000Z',
    });

    const comparison = extractUrbanScenarioComparison(run);
    expect(comparison).toBeTruthy();
    expect(comparison?.comparisonId).toBe('scenario-meta-run-1-comparison');
    expect(comparison?.runId).toBe(run.runId);
    expect(comparison?.flowId).toBe('scenario_comparison');
    expect(comparison?.candidateRuns).toHaveLength(form.scenarios.length);
    expect(comparison?.indicatorsCompared).toHaveLength(result.metricDefinitions.length);
    expect(comparison?.deltas.length).toBeGreaterThan(0);
    expect(comparison?.policyInterpretation.mode).toBe('guidance');
    expect(comparison?.evidence.mapOutputIds).toEqual(['scenario-meta-run-1-delta']);
    expect(comparison?.evidence.chartOutputIds).toEqual([
      'scenario-meta-run-1-radar',
      'scenario-meta-run-1-parallel',
    ]);

    const handoff = buildUrbanScenarioComparisonHandoff(comparison!);
    expect(handoff.comparisonId).toBe('scenario-meta-run-1-comparison');
    expect(handoff.policyInterpretationMode).toBe('guidance');
    expect(handoff.candidateCount).toBe(form.scenarios.length);
    expect(handoff.indicatorCount).toBe(result.metricDefinitions.length);

    const guidance = buildUrbanScenarioInterpretationGuidance(comparison!);
    expect(guidance.length).toBeGreaterThan(0);
    expect(guidance.join(' ')).toContain('guidance');

    const limitations = buildUrbanScenarioLimitationNotes(comparison!);
    expect(limitations.some((entry) => entry.startsWith('Uncertainty:'))).toBe(true);
  });

  it('returns null when run flow is not scenario_comparison', () => {
    const run: CompletedAnalysisRun = {
      runId: 'run-non-scenario',
      flowId: 'indicator_composite',
      label: 'Non scenario run',
      insertedAt: '2026-05-09T12:10:00.000Z',
      paragraph: 'Run complete.',
      paragraphPreview: 'Run complete.',
      paragraphFull: 'Run complete.',
      mapOutputs: [],
      chartOutputs: [],
      dataOutputs: [],
    };

    expect(extractUrbanScenarioComparison(run)).toBeNull();
  });
});
