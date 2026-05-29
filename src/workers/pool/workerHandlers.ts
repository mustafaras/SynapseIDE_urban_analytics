import { accuracyReport } from '../../engine/geoai/cv/LandCoverClassifier';
import { runCellularAutomataScenario } from '../../engine/simulation/CellularAutomata';
import { kMeans } from '../../engine/spatial-stats/multivariate/ClusterAnalysis';
import { giStar } from '../../engine/spatial-stats/autocorrelation/GetisOrdGi';
import { localMoransI } from '../../engine/spatial-stats/autocorrelation/LocalMoransI';
import { buildWeights } from '../../engine/spatial-stats/autocorrelation/SpatialWeights';
import { analyseEmergingHotSpots } from '../../engine/spatial-stats/spatiotemporal/EmergingHotSpots';
import {
  adaptEmergingHotSpotResult,
  adaptHotSpotResult,
  adaptLISAResult,
} from '../../services/map/MapEngineAdapter';
import { fetchOverpassBuildingsForBounds } from '../../services/map/ExternalServiceConnector';
import { computeGeometryWorkflow } from '../../services/map/geometry/GeometryWorkflowEngine';
import { runMapJoinWorkerTask } from '../../services/map/join/MapJoinPreviewService';
import {
  assertPreparedDataset,
  assertPreparedSpatiotemporalDataset,
  buildEmergingHotSpotLayerName,
  buildHotSpotLayerName,
  buildLisaLayerName,
  prepareSpatialDataset,
  prepareSpatiotemporalDataset,
  resolveSourceDataVersion,
} from '../../services/map/SpatialStatsExecutionService';
import type {
  BackgroundTaskProgress,
  WorkerTaskInput,
  WorkerTaskKind,
  WorkerTaskOutput,
} from './taskDefinitions';

type ReportProgress = (progress: BackgroundTaskProgress) => void;

export async function runWorkerTask<K extends WorkerTaskKind>(
  kind: K,
  input: WorkerTaskInput<K>,
  report: ReportProgress,
): Promise<WorkerTaskOutput<K>> {
  switch (kind) {
    case 'spatial-stats/lisa':
      return runLisaTask(input as WorkerTaskInput<'spatial-stats/lisa'>, report) as WorkerTaskOutput<K>;
    case 'spatial-stats/hotspot':
      return runHotSpotTask(input as WorkerTaskInput<'spatial-stats/hotspot'>, report) as WorkerTaskOutput<K>;
    case 'spatial-stats/emerging-hotspot':
      return runEmergingHotSpotTask(
        input as WorkerTaskInput<'spatial-stats/emerging-hotspot'>,
        report,
      ) as WorkerTaskOutput<K>;
    case 'clustering/kmeans':
      return runKMeansTask(input as WorkerTaskInput<'clustering/kmeans'>, report) as WorkerTaskOutput<K>;
    case 'simulation/cellular-automata':
      return runCellularAutomataTask(
        input as WorkerTaskInput<'simulation/cellular-automata'>,
        report,
      ) as WorkerTaskOutput<K>;
    case 'raster/classification-accuracy':
      return runRasterAccuracyTask(
        input as WorkerTaskInput<'raster/classification-accuracy'>,
        report,
      ) as WorkerTaskOutput<K>;
    case 'external/overpass-buildings':
      return await runOverpassBuildingsTask(
        input as WorkerTaskInput<'external/overpass-buildings'>,
        report,
      ) as WorkerTaskOutput<K>;
    case 'geometry/workflow':
      return await runGeometryWorkflowTask(
        input as WorkerTaskInput<'geometry/workflow'>,
        report,
      ) as WorkerTaskOutput<K>;
    case 'map/join-preview':
      return runMapJoinWorkerTask(
        input as WorkerTaskInput<'map/join-preview'>,
        report,
      ) as WorkerTaskOutput<K>;
    default:
      throw new Error(`Unsupported worker task kind: ${kind}`);
  }
}

async function runGeometryWorkflowTask(
  input: WorkerTaskInput<'geometry/workflow'>,
  report: ReportProgress,
): Promise<WorkerTaskOutput<'geometry/workflow'>> {
  return computeGeometryWorkflow(input, (progress) => report(progress));
}

async function runOverpassBuildingsTask(
  input: WorkerTaskInput<'external/overpass-buildings'>,
  report: ReportProgress,
): Promise<WorkerTaskOutput<'external/overpass-buildings'>> {
  report({ percent: 12, stage: 'Clamping viewport to public Overpass safety limit' });
  report({ percent: 34, stage: 'Requesting OSM building footprints' });
  const result = await fetchOverpassBuildingsForBounds(input.bounds, input.bypassCache ? { bypassCache: true } : {});
  report({
    percent: 88,
    stage: 'Normalising Overpass buildings to GeoJSON',
    detail: `${result.featureCollection.features.length} footprints`,
  });
  report({ percent: 100, stage: 'OSM building footprints ready' });
  return result;
}

function runLisaTask(
  input: WorkerTaskInput<'spatial-stats/lisa'>,
  report: ReportProgress,
): WorkerTaskOutput<'spatial-stats/lisa'> {
  report({ percent: 12, stage: 'Preparing polygon dataset' });
  const dataset = prepareSpatialDataset(input.featureCollection, input.valueField);
  assertPreparedDataset(dataset, input.valueField);

  report({ percent: 42, stage: 'Constructing spatial weights' });
  const weights = buildWeights(dataset.spatialFeatures, input.weightsMethod, {
    rowStandardize: true,
  });

  report({ percent: 82, stage: 'Running Local Moran permutation inference' });
  const result = localMoransI(dataset.values, weights, {
    permutations: input.permutations,
    alpha: input.alpha,
    correction: input.correction,
  });

  const sourceDataVersion = resolveSourceDataVersion(input.sourceLayer);
  const adaptedResult = adaptLISAResult({
    featureCollection: dataset.featureCollection,
    result,
    significanceThreshold: input.significanceThreshold,
    layerName: input.layerName ?? buildLisaLayerName(input.sourceLayer, input.valueField),
    parameters: {
      alpha: input.alpha,
      correction: input.correction,
      permutations: input.permutations,
      rowStandardize: true,
      significanceThreshold: input.significanceThreshold,
      valueField: input.valueField,
      weightsMethod: input.weightsMethod,
    },
    sourceLayerIds: [input.sourceLayer.id],
    ...(input.layerId ? { layerId: input.layerId } : {}),
    ...(input.runId ? { runId: input.runId } : {}),
    ...(input.runTimestamp ? { runTimestamp: input.runTimestamp } : {}),
    ...(sourceDataVersion ? { sourceDataVersion } : {}),
  });

  report({ percent: 100, stage: 'LISA analysis complete' });
  return {
    adaptedResult,
    summary: result.summary,
    validFeatureCount: dataset.validFeatureCount,
    skippedFeatureCount: dataset.skippedFeatureCount,
  };
}

function runHotSpotTask(
  input: WorkerTaskInput<'spatial-stats/hotspot'>,
  report: ReportProgress,
): WorkerTaskOutput<'spatial-stats/hotspot'> {
  report({ percent: 16, stage: 'Preparing polygon dataset' });
  const dataset = prepareSpatialDataset(input.featureCollection, input.valueField);
  assertPreparedDataset(dataset, input.valueField);

  report({ percent: 48, stage: 'Constructing spatial weights' });
  const weights = buildWeights(dataset.spatialFeatures, input.weightsMethod, {
    rowStandardize: true,
  });

  report({ percent: 84, stage: 'Computing Getis-Ord Gi* z-scores' });
  const result = giStar(dataset.values, weights, {
    selfWeight: input.selfWeight,
  });

  const sourceDataVersion = resolveSourceDataVersion(input.sourceLayer);
  const adaptedResult = adaptHotSpotResult({
    featureCollection: dataset.featureCollection,
    result,
    significanceThreshold: input.significanceThreshold,
    layerName: input.layerName ?? buildHotSpotLayerName(input.sourceLayer, input.valueField),
    parameters: {
      rowStandardize: true,
      selfWeight: input.selfWeight,
      significanceThreshold: input.significanceThreshold,
      valueField: input.valueField,
      weightsMethod: input.weightsMethod,
    },
    sourceLayerIds: [input.sourceLayer.id],
    ...(input.layerId ? { layerId: input.layerId } : {}),
    ...(input.runId ? { runId: input.runId } : {}),
    ...(input.runTimestamp ? { runTimestamp: input.runTimestamp } : {}),
    ...(sourceDataVersion ? { sourceDataVersion } : {}),
  });

  report({ percent: 100, stage: 'Hot spot analysis complete' });
  return {
    adaptedResult,
    summary: result.summary,
    validFeatureCount: dataset.validFeatureCount,
    skippedFeatureCount: dataset.skippedFeatureCount,
  };
}

function runEmergingHotSpotTask(
  input: WorkerTaskInput<'spatial-stats/emerging-hotspot'>,
  report: ReportProgress,
): WorkerTaskOutput<'spatial-stats/emerging-hotspot'> {
  report({ percent: 12, stage: 'Preparing temporal polygon dataset' });
  const dataset = prepareSpatiotemporalDataset(input.featureCollection, input.timeFields);
  assertPreparedSpatiotemporalDataset(dataset, input.timeFields);

  report({ percent: 38, stage: 'Constructing spatial weights' });
  const weights = buildWeights(dataset.spatialFeatures, input.weightsMethod, {
    rowStandardize: true,
  });

  report({ percent: 82, stage: 'Mining emerging hot spot trajectories' });
  const result = analyseEmergingHotSpots(dataset.timeSteps, weights, {
    significanceThreshold: input.significanceThreshold,
    trendAlpha: input.significanceThreshold,
    selfWeight: input.selfWeight,
  });

  const sourceDataVersion = resolveSourceDataVersion(input.sourceLayer);
  const adaptedResult = adaptEmergingHotSpotResult({
    featureCollection: dataset.featureCollection,
    result,
    significanceThreshold: input.significanceThreshold,
    layerName: input.layerName
      ?? buildEmergingHotSpotLayerName(input.sourceLayer, dataset.timeSteps.map((step) => step.key)),
    parameters: {
      rowStandardize: true,
      selfWeight: input.selfWeight,
      significanceThreshold: input.significanceThreshold,
      timeFields: dataset.timeSteps.map((step) => step.key),
      weightsMethod: input.weightsMethod,
    },
    sourceLayerIds: [input.sourceLayer.id],
    ...(input.layerId ? { layerId: input.layerId } : {}),
    ...(input.runId ? { runId: input.runId } : {}),
    ...(input.runTimestamp ? { runTimestamp: input.runTimestamp } : {}),
    ...(sourceDataVersion ? { sourceDataVersion } : {}),
  });

  report({ percent: 100, stage: 'Emerging hot spot analysis complete' });
  return {
    adaptedResult,
    summary: result.summary,
    legend: result.legend,
    unclassifiedCount: result.unclassifiedCount,
    validFeatureCount: dataset.validFeatureCount,
    skippedFeatureCount: dataset.skippedFeatureCount,
    timeStepCount: result.timeStepCount,
  };
}

function runKMeansTask(
  input: WorkerTaskInput<'clustering/kmeans'>,
  report: ReportProgress,
): WorkerTaskOutput<'clustering/kmeans'> {
  report({ percent: 20, stage: 'Validating clustering matrix' });
  report({ percent: 72, stage: 'Running k-means++ partitioning' });
  const result = kMeans(input.data, input.options);
  report({ percent: 100, stage: 'Cluster analysis complete' });
  return result;
}

function runCellularAutomataTask(
  input: WorkerTaskInput<'simulation/cellular-automata'>,
  report: ReportProgress,
): WorkerTaskOutput<'simulation/cellular-automata'> {
  report({ percent: 18, stage: 'Preparing simulation surfaces' });
  report({ percent: 66, stage: 'Running cellular automata scenario' });
  const result = runCellularAutomataScenario(input.options);
  report({ percent: 100, stage: 'Simulation complete' });
  return result;
}

function runRasterAccuracyTask(
  input: WorkerTaskInput<'raster/classification-accuracy'>,
  report: ReportProgress,
): WorkerTaskOutput<'raster/classification-accuracy'> {
  const prediction = Uint8Array.from(Array.from(input.prediction, (value) => Number(value) || 0));
  const truth = Uint8Array.from(Array.from(input.truth, (value) => Number(value) || 0));
  const numClasses = input.numClasses
    ?? input.classLabels?.length
    ?? Math.max(...prediction, ...truth, 0) + 1;

  report({ percent: 24, stage: 'Building confusion matrix' });
  const result = accuracyReport(prediction, truth, numClasses, input.classLabels);
  report({ percent: 100, stage: 'Raster accuracy report complete' });
  return result;
}
