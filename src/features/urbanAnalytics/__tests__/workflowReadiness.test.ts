import { describe, it, expect } from 'vitest';
import {
  evaluateWorkflowReadiness,
  type EvaluateWorkflowReadinessInput,
} from '../lib/workflowReadiness';
import type { UrbanAnalysisContext, UrbanDataFitnessProfile } from '../lib/types';

function makeContext(overrides: Partial<UrbanAnalysisContext> = {}): UrbanAnalysisContext {
  return {
    contextId: 'ctx-1',
    studyAreaId: 'sa-1',
    studyAreaName: 'Test Area',
    studyAreaBounds: [28.9, 41.0, 29.1, 41.1],
    activeQuestion: 'What is the walkability score?',
    activeScale: 'neighborhood',
    activeAoiId: 'aoi-1',
    activeLayerIds: ['layer-1'],
    selectedIndicatorKinds: [],
    activeFlowId: 'walkability',
    activeRunId: null,
    activeCodeArtifactId: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeFitness(status: UrbanDataFitnessProfile['status']): UrbanDataFitnessProfile {
  return {
    status,
    grade: status === 'ready' ? 'A' : 'unknown',
    score: status === 'ready' ? 1 : 0,
    geometryFit: status,
    crsFit: status,
    temporalFit: status,
    completenessFit: status,
    scaleFit: status,
    licenseStatus: status === 'ready' ? 'open' : 'unknown',
    geometry: { valid: true, type: 'Polygon', issues: [] },
    crs: { available: true, code: 'EPSG:4326', projected: false, issues: [] },
    temporalCoverage: { available: false, issues: [] },
    missingness: { ratio: 0, issues: [] },
    scaleSuitability: { suitable: true, issues: [] },
    license: { status: 'open', issues: [] },
    sampleSize: { count: 100, sufficient: true, issues: [] },
    fieldAvailability: { available: [], missing: [], issues: [] },
    blockedReasons: status === 'blocked' ? ['CRS is invalid'] : [],
    missingInputs: [],
    uncertaintyNotes: [],
    issues: [],
    sourceLayerIds: [],
    sourceRunIds: [],
    computedAt: new Date().toISOString(),
  } as unknown as UrbanDataFitnessProfile;
}

describe('evaluateWorkflowReadiness', () => {
  it('returns ready when all inputs are valid', () => {
    const input: EvaluateWorkflowReadinessInput = {
      flowId: 'walkability',
      context: makeContext(),
      dataFitness: makeFitness('ready'),
      methodSource: {
        id: 'walkability',
        sourceKind: 'workflow',
        capabilityStatus: 'implemented',
        validityEnvelope: {
          validSpatialScales: ['neighborhood'],
          requiredDataTypes: ['vector'],
          requiredFields: ['geometry'],
          crsAssumptions: ['Projected CRS required'],
          temporalAssumptions: ['Cross-sectional'],
          methodFamily: 'accessibility',
          maturityLevel: 'established',
          capabilityStatus: 'implemented',
          assumptions: ['Flat terrain'],
          limitations: ['Does not account for elevation'],
          failureModes: ['Insufficient network data'],
          interpretationWarnings: ['Index is relative, not absolute'],
          misuseWarnings: ['Do not compare across cities without normalization'],
          peerReferenceIds: ['ref-1'],
        },
      },
      environmentReady: true,
    };

    const result = evaluateWorkflowReadiness(input);
    expect(result.status).toBe('ready');
    expect(result.runtimeMode).toBe('live');
    expect(result.issues).toHaveLength(0);
  });

  it('returns warning when context has no layers', () => {
    const input: EvaluateWorkflowReadinessInput = {
      flowId: 'walkability',
      context: makeContext({ activeLayerIds: [] }),
      dataFitness: makeFitness('ready'),
      methodSource: null,
      environmentReady: true,
    };

    const result = evaluateWorkflowReadiness(input);
    expect(result.issues.some((i) => i.code === 'NO_LAYERS')).toBe(true);
  });

  it('returns blocked when data fitness is blocked', () => {
    const input: EvaluateWorkflowReadinessInput = {
      flowId: 'walkability',
      context: makeContext(),
      dataFitness: makeFitness('blocked'),
      methodSource: null,
      environmentReady: true,
    };

    const result = evaluateWorkflowReadiness(input);
    expect(result.status).toBe('blocked');
    expect(result.issues.some((i) => i.code === 'DATA_FITNESS_BLOCKED')).toBe(true);
  });

  it('returns blocked when environment is not ready', () => {
    const input: EvaluateWorkflowReadinessInput = {
      flowId: 'walkability',
      context: makeContext(),
      dataFitness: makeFitness('ready'),
      methodSource: null,
      environmentReady: false,
    };

    const result = evaluateWorkflowReadiness(input);
    expect(result.status).toBe('blocked');
    expect(result.issues.some((i) => i.code === 'ENVIRONMENT_NOT_READY')).toBe(true);
  });

  it('returns demo_only when method is demo_mode', () => {
    const input: EvaluateWorkflowReadinessInput = {
      flowId: 'walkability',
      context: makeContext(),
      dataFitness: makeFitness('ready'),
      methodSource: {
        id: 'walkability',
        sourceKind: 'workflow',
        capabilityStatus: 'demo_mode',
      },
      environmentReady: true,
    };

    const result = evaluateWorkflowReadiness(input);
    expect(result.status).toBe('demo_only');
    expect(result.runtimeMode).toBe('demo');
  });

  it('returns blocked when method is deferred', () => {
    const input: EvaluateWorkflowReadinessInput = {
      flowId: 'walkability',
      context: makeContext(),
      dataFitness: makeFitness('ready'),
      methodSource: {
        id: 'walkability',
        sourceKind: 'workflow',
        capabilityStatus: 'deferred',
      },
      environmentReady: true,
    };

    const result = evaluateWorkflowReadiness(input);
    expect(result.status).toBe('blocked');
    expect(result.issues.some((i) => i.code === 'METHOD_DEFERRED')).toBe(true);
  });

  it('returns unknown when no context and no fitness', () => {
    const input: EvaluateWorkflowReadinessInput = {
      flowId: 'walkability',
      context: null,
      dataFitness: null,
      methodSource: null,
    };

    const result = evaluateWorkflowReadiness(input);
    expect(result.status).toBe('unknown');
    expect(result.runtimeMode).toBe('unknown');
    expect(result.remediationActions.length).toBeGreaterThan(0);
  });

  it('respects explicit runtimeMode override', () => {
    const input: EvaluateWorkflowReadinessInput = {
      flowId: 'walkability',
      context: makeContext(),
      dataFitness: makeFitness('ready'),
      methodSource: null,
      runtimeMode: 'synthetic',
    };

    const result = evaluateWorkflowReadiness(input);
    expect(result.runtimeMode).toBe('synthetic');
  });

  it('includes remediation actions for missing study area', () => {
    const input: EvaluateWorkflowReadinessInput = {
      flowId: 'walkability',
      context: makeContext({ studyAreaId: null, activeAoiId: null }),
      dataFitness: makeFitness('ready'),
      methodSource: null,
      environmentReady: true,
    };

    const result = evaluateWorkflowReadiness(input);
    expect(result.issues.some((i) => i.code === 'NO_STUDY_AREA')).toBe(true);
    expect(result.remediationActions.some((a) => a.includes('study area'))).toBe(true);
  });
});
