import { describe, expect, it } from 'vitest';
import type {
  CellularAutomataResult,
  CompositeIndicatorResult,
  FacilityOptimisationResult,
  ScenarioComparisonResult,
} from '@/engine/simulation';
import type { CompletedAnalysisRun } from '@/features/urbanAnalytics/lib/types';
import type {
  BuildingExposureSummary,
  SunlightConfig,
  SunlightResult,
} from '@/features/urbanAnalytics/voxcity/sunlightTypes';
import type { ScenarioComparisonForm } from '../scenarioComparisonShared';
import {
  buildCellularAutomataNarrativeInput,
  buildCompletedRunNarrativeInput,
  buildCompositeIndicatorNarrativeInput,
  buildFacilityOptimisationNarrativeInput,
  buildScenarioComparisonNarrativeInput,
  buildSunlightNarrativeInput,
} from '../narrativeBuilders';

function makePolygon(): GeoJSON.Polygon {
  return {
    type: 'Polygon',
    coordinates: [[
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ]],
  };
}

describe('narrativeBuilders', () => {
  it('builds composite-indicator narrative inputs with score spread and robustness findings', () => {
    const result = {
      units: [
        {
          unitId: 'north',
          label: 'North District',
          geometry: makePolygon(),
          score: 0.82,
          scorePercent: 82,
          rank: 1,
          confidenceBand: { lower: 78, upper: 86 },
          rankBand: { lower: 1, upper: 1 },
          meanScorePercent: 81,
          scoreStdDev: 1.2,
          meanRank: 1,
          rankStdDev: 0,
          topKInclusionFrequency: 1,
          values: [],
        },
        {
          unitId: 'south',
          label: 'South District',
          geometry: makePolygon(),
          score: 0.41,
          scorePercent: 41,
          rank: 2,
          confidenceBand: { lower: 37, upper: 46 },
          rankBand: { lower: 2, upper: 2 },
          meanScorePercent: 42,
          scoreStdDev: 1.4,
          meanRank: 2,
          rankStdDev: 0,
          topKInclusionFrequency: 0.1,
          values: [],
        },
      ],
      sensitivity: {
        runs: 120,
        confidenceLevel: 0.9,
        weightPerturbation: 0.1,
        indicatorNoise: 0.05,
        topK: 3,
        meanKendallTauToBaseline: 0.84,
        meanAbsoluteRankShift: 0.31,
        topKStability: 0.91,
        robustnessTier: 'high',
        sobolStyle: [],
        notes: [],
      },
      configurationPackage: {
        version: '1',
        generatedAt: '2026-04-12T10:00:00.000Z',
        selectedIndicatorIds: [],
        imputation: { method: 'mean' },
        normalization: { method: 'min_max' },
        weighting: { method: 'equal' },
        aggregation: { method: 'additive' },
        sensitivity: {
          runs: 120,
          weightPerturbation: 0.1,
          indicatorNoise: 0.05,
          topK: 3,
        },
        derivedWeights: [],
        notes: [],
      },
    } as CompositeIndicatorResult;

    const input = buildCompositeIndicatorNarrativeInput({
      outputTitle: 'Urban Wellbeing Composite Index',
      scenarioName: 'Pilot District',
      normalizationMethod: 'min_max',
      weightingMethod: 'equal',
      aggregationMethod: 'additive',
    }, result);

    expect(input.analysisTitle).toBe('Urban Wellbeing Composite Index');
    expect(input.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'composite-top-unit', value: 82 }),
      expect.objectContaining({ id: 'composite-bottom-unit', value: 41 }),
      expect.objectContaining({ id: 'composite-topk-stability', value: 91 }),
    ]));
    expect(input.comparisons?.[0]).toMatchObject({
      label: 'Composite score spread',
      groupA: 'North District',
      groupB: 'South District',
      valueA: 82,
      valueB: 41,
    });
    expect(input.methodology?.description).toContain('Min Max normalization');
  });

  it('builds facility-optimisation narrative inputs with equity-aware comparisons', () => {
    const result = {
      assignments: [{}, {}, {}],
      demandSummary: {
        coveredDemandRatio: 0.78,
        meanTravelBurdenKm: 1.9,
      },
      equityDiagnostics: {
        groups: [
          { group: 'priority_area', coverageRatio: 0.42 },
          { group: 'balanced_area', coverageRatio: 0.67 },
          { group: 'high_income', coverageRatio: 0.91 },
        ],
        coverageGap: 0.49,
      },
    } as FacilityOptimisationResult;

    const input = buildFacilityOptimisationNarrativeInput({
      scenarioName: 'Primary Care Access',
      model: 'p_median',
      serviceRadiusKm: 2.4,
      equityMode: 'constraint',
      priorityGroups: ['priority area'],
    }, result);

    expect(input.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'facility-covered-demand', value: 78 }),
      expect.objectContaining({ id: 'facility-coverage-gap', value: 49 }),
    ]));
    expect(input.comparisons?.[0]).toMatchObject({
      groupA: 'Priority Area',
      groupB: 'High Income',
      valueA: 42,
      valueB: 91,
    });
    expect(input.recommendations?.[0]?.priority).toBe('high');
  });

  it('builds cellular-automata narrative inputs with validation and growth trends', () => {
    const result = {
      predictedStates: [
        {
          step: 1,
          values: [0, 1, 0, 0],
          width: 2,
          height: 2,
        },
        {
          step: 2,
          values: [1, 1, 1, 0],
          width: 2,
          height: 2,
        },
      ],
      observedState: {
        step: 'observed',
        values: [1, 1, 0, 0],
        width: 2,
        height: 2,
      },
      validation: {
        figureOfMerit: 0.52,
        overallAccuracy: 0.81,
        fitQuality: 'moderate',
      },
    } as CellularAutomataResult;

    const input = buildCellularAutomataNarrativeInput({
      scenarioName: 'Edge Expansion Test',
      predictionSteps: 4,
      perturbationFactor: 0.15,
      growthMultiplier: 1.2,
    }, result, ['1985', '2005', '2025']);

    expect(input.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'ca-final-urban-cells', value: 3 }),
      expect.objectContaining({ id: 'ca-figure-of-merit', value: 52 }),
      expect.objectContaining({ id: 'ca-overall-accuracy', value: 81 }),
    ]));
    expect(input.comparisons?.[0]).toMatchObject({
      groupA: 'Predicted final state',
      groupB: 'Observed state',
      valueA: 3,
      valueB: 2,
    });
    expect(input.trends?.[0]).toMatchObject({
      label: 'Urban cell growth across simulated states',
      from: { t: 'Initial predicted state', value: 1 },
      to: { t: 'Final predicted state', value: 3 },
    });
    expect(input.recommendations?.[0]?.priority).toBe('high');
  });

  it('builds scenario-comparison narrative inputs from live dashboard results', () => {
    const form: ScenarioComparisonForm = {
      baselineName: 'Current Plan',
      baselineDescription: 'Baseline',
      scenarios: [],
      selectedMetricIds: ['housing_capacity'],
      activeScenarioId: 'green-corridor',
      activeMetricId: 'housing_capacity',
      deltaMode: 'absolute',
      tradeoffNotes: '',
      outputTitle: 'Scenario Comparison Dashboard',
    };

    const result = {
      baselineName: 'Current Plan',
      metricDefinitions: [{ id: 'housing_capacity', label: 'Housing Capacity' }],
      scenarios: [
        {
          scenarioId: 'green-corridor',
          name: 'Green Corridor',
          compositeScore: 84,
          meanImprovement: 12,
          metrics: [],
        },
        {
          scenarioId: 'road-capacity',
          name: 'Road Capacity',
          compositeScore: 61,
          meanImprovement: -4,
          metrics: [],
        },
      ],
      paretoScenarioIds: ['green-corridor'],
    } as ScenarioComparisonResult;

    const input = buildScenarioComparisonNarrativeInput(form, result);

    expect(input.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'scenario-best-score', value: 84 }),
      expect.objectContaining({ id: 'scenario-best-improvement', value: 12 }),
      expect.objectContaining({ id: 'scenario-pareto-count', value: 1 }),
    ]));
    expect(input.comparisons?.[0]).toMatchObject({
      groupA: 'Green Corridor',
      groupB: 'Road Capacity',
      valueA: 84,
      valueB: 61,
    });
    expect(input.methodology?.description).toContain('2 scenarios');
  });

  it('builds sunlight narrative inputs with exposure contrast and screening priority', () => {
    const config: SunlightConfig = {
      location: { latitude: 41.0082, longitude: 28.9784 },
      startDate: '2026-06-01',
      endDate: '2026-06-02',
      startHour: 8,
      endHour: 18,
      intervalMinutes: 30,
      utcOffset: 3,
    };

    const result: SunlightResult = {
      id: 'sun-01',
      config,
      buildings: [{ id: 'b1', label: 'Tower A', bbox: [0, 0, 1, 1], height: 30 }],
      gridResolution: 5,
      gridSize: [2, 2],
      gridOrigin: [0, 0],
      samples: [],
      shadowHours: new Float32Array([0, 1, 2, 3]),
      exposureHours: new Float32Array([8, 7, 6, 5]),
      buildingCastHours: new Map([['b1', 12]]),
      sampleCount: 4,
      totalDaylightHours: 10,
      stats: {
        minExposure: 5,
        maxExposure: 8,
        meanExposure: 6.5,
      },
    };

    const summaries: readonly BuildingExposureSummary[] = [
      {
        buildingId: 'b1',
        label: 'Courtyard Block',
        avgExposureHours: 4.2,
        minExposureHours: 2.1,
        maxExposureHours: 5.4,
        sunlitFraction: 0.38,
      },
      {
        buildingId: 'b2',
        label: 'Setback Tower',
        avgExposureHours: 7.9,
        minExposureHours: 6.1,
        maxExposureHours: 8.5,
        sunlitFraction: 0.81,
      },
    ];

    const input = buildSunlightNarrativeInput(config, result, summaries);

    expect(input.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'sunlight-mean-exposure', value: 6.5 }),
      expect.objectContaining({ id: 'sunlight-total-daylight', value: 10 }),
      expect.objectContaining({ id: 'sunlight-building-count', value: 1 }),
    ]));
    expect(input.comparisons?.[0]).toMatchObject({
      groupA: 'Courtyard Block',
      groupB: 'Setback Tower',
      valueA: 4.2,
      valueB: 7.9,
    });
    expect(input.recommendations?.[0]?.priority).toBe('high');
  });

  it('builds completed-run narrative inputs from saved statistical summaries', () => {
    const run = {
      runId: 'run-01',
      flowId: 'object_detection',
      label: 'Object Detection — Scene 01',
      insertedAt: '2026-04-12T10:30:00.000Z',
      paragraph: 'Existing summary',
      paragraphPreview: 'Existing summary',
      paragraphFull: 'Existing summary',
      mapOutputs: [
        {
          id: 'map-01',
          type: 'choropleth',
          title: 'Detection Layer',
          layerName: 'Detection Layer',
          geojson: { type: 'FeatureCollection', features: [] },
          engineBridge: {
            engine: 'ObjectDetector',
            domain: 'geoai',
            statisticalSummary: {
              detectionCount: 7,
              threshold: 0.4,
              classCount: 3,
            },
          },
        },
      ],
      chartOutputs: [],
      dataOutputs: [
        {
          id: 'data-01',
          format: 'object-detections',
          rows: 7,
          columns: [],
          preview: [],
        },
      ],
    } as CompletedAnalysisRun;

    const input = buildCompletedRunNarrativeInput(run);

    expect(input).not.toBeNull();
    expect(input?.sampleSize).toBe(7);
    expect(input?.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Detection Count', value: 7 }),
      expect.objectContaining({ label: 'Threshold', value: 0.4 }),
      expect.objectContaining({ label: 'Class Count', value: 3 }),
    ]));
    expect(input?.methodology?.name).toContain('Object Detector review envelope');
  });

  it('falls back to output counts when a saved run has no numeric summary metrics', () => {
    const run = {
      runId: 'run-02',
      flowId: 'review',
      label: 'Completed Review Package',
      insertedAt: '2026-04-12T10:35:00.000Z',
      paragraph: 'Existing summary',
      paragraphPreview: 'Existing summary',
      paragraphFull: 'Existing summary',
      mapOutputs: [
        {
          id: 'map-02',
          type: 'choropleth',
          title: 'Review Layer',
          layerName: 'Review Layer',
          geojson: { type: 'FeatureCollection', features: [] },
          engineBridge: {
            engine: 'CompositeIndicator',
            domain: 'indicator',
            statisticalSummary: {
              robustnessTier: 'high',
            },
          },
        },
      ],
      chartOutputs: [],
      dataOutputs: [
        {
          id: 'data-02',
          format: 'review-package',
          rows: 3,
          columns: [],
          preview: [],
        },
      ],
    } as CompletedAnalysisRun;

    const input = buildCompletedRunNarrativeInput(run);

    expect(input?.findings).toEqual([
      expect.objectContaining({ id: 'completed-run-map-count', value: 1 }),
      expect.objectContaining({ id: 'completed-run-data-count', value: 1 }),
    ]);
  });
});