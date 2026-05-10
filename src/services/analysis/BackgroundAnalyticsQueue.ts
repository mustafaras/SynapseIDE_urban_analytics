import { accuracyReport } from '@/engine/geoai/cv/LandCoverClassifier';
import { runCellularAutomataScenario } from '@/engine/simulation';
import { kMeans } from '@/engine/spatial-stats/multivariate/ClusterAnalysis';
import {
  type BackgroundTaskHandle,
  type BackgroundTaskViewAction,
  type CellularAutomataTaskInput,
  createInlineTaskHandle,
  enqueueWorkerTask,
  type KMeansTaskInput,
  type RasterAccuracyTaskInput,
} from '@/workers/pool';

interface BackgroundAnalyticsQueueOptions {
  viewAction?: BackgroundTaskViewAction;
  timeoutMs?: number;
}

function hasWorkerSupport(): boolean {
  return typeof Worker !== 'undefined';
}

function resolveRasterClassCount(input: RasterAccuracyTaskInput): number {
  if (typeof input.numClasses === 'number' && Number.isFinite(input.numClasses) && input.numClasses > 0) {
    return Math.floor(input.numClasses);
  }

  if (input.classLabels?.length) {
    return input.classLabels.length;
  }

  const observedMax = Math.max(
    ...Array.from(input.prediction, (value) => Number(value) || 0),
    ...Array.from(input.truth, (value) => Number(value) || 0),
    0,
  );
  return observedMax + 1;
}

function normalizeRasterAccuracyInput(input: RasterAccuracyTaskInput): Required<RasterAccuracyTaskInput> {
  const classLabels = input.classLabels ? [...input.classLabels] : [];
  const numClasses = resolveRasterClassCount(input);

  return {
    prediction: Uint8Array.from(Array.from(input.prediction, (value) => Number(value) || 0)),
    truth: Uint8Array.from(Array.from(input.truth, (value) => Number(value) || 0)),
    classLabels,
    numClasses,
  };
}

export function executeKMeansClusteringAsync(
  input: KMeansTaskInput,
  options: BackgroundAnalyticsQueueOptions = {},
): BackgroundTaskHandle<'clustering/kmeans'> {
  if (!hasWorkerSupport()) {
    return createInlineTaskHandle('clustering/kmeans', () => kMeans(input.data, input.options));
  }

  return enqueueWorkerTask('clustering/kmeans', input, {
    title: `K-Means Clustering · k=${input.options.k}`,
    description: 'Background morphology segmentation run',
    timeoutMs: options.timeoutMs ?? 180_000,
    viewAction: options.viewAction,
  });
}

export function executeCellularAutomataScenarioAsync(
  input: CellularAutomataTaskInput,
  options: BackgroundAnalyticsQueueOptions = {},
): BackgroundTaskHandle<'simulation/cellular-automata'> {
  const scenarioName = input.options.scenarioName?.trim() || 'Urban growth scenario';

  if (!hasWorkerSupport()) {
    return createInlineTaskHandle('simulation/cellular-automata', () => runCellularAutomataScenario(input.options));
  }

  return enqueueWorkerTask('simulation/cellular-automata', input, {
    title: `Cellular Automata · ${scenarioName}`,
    description: 'Background constrained urban growth simulation',
    timeoutMs: options.timeoutMs ?? 240_000,
    viewAction: options.viewAction,
  });
}

export function executeRasterAccuracyReportAsync(
  input: RasterAccuracyTaskInput,
  options: BackgroundAnalyticsQueueOptions = {},
): BackgroundTaskHandle<'raster/classification-accuracy'> {
  const normalizedInput = normalizeRasterAccuracyInput(input);

  if (!hasWorkerSupport()) {
    return createInlineTaskHandle('raster/classification-accuracy', () => (
      accuracyReport(
        normalizedInput.prediction as Uint8Array,
        normalizedInput.truth as Uint8Array,
        normalizedInput.numClasses,
        normalizedInput.classLabels,
      )
    ));
  }

  return enqueueWorkerTask('raster/classification-accuracy', normalizedInput, {
    title: `Raster Accuracy · ${normalizedInput.numClasses} classes`,
    description: 'Background confusion-matrix and per-class metrics run',
    timeoutMs: options.timeoutMs ?? 120_000,
    viewAction: options.viewAction,
  });
}