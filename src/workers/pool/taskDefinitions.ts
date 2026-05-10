import type {
  AccuracyReport,
} from '../../engine/geoai/cv/types';
import type {
  CellularAutomataResult,
  CellularAutomataSimulationOptions,
} from '../../engine/simulation/CellularAutomata';
import type { ClusterResult } from '../../engine/spatial-stats/types';
import type { KMeansOptions } from '../../engine/spatial-stats/multivariate/ClusterAnalysis';
import type {
  EmergingHotSpotSpatialStatsExecutionInput,
  EmergingHotSpotSpatialStatsExecutionResult,
  HotSpotSpatialStatsExecutionInput,
  HotSpotSpatialStatsExecutionResult,
  LisaSpatialStatsExecutionInput,
  LisaSpatialStatsExecutionResult,
} from '../../services/map/SpatialStatsExecutionService';
import type { OverpassBuildingsResult } from '../../services/map/ExternalServiceConnector';

export type BackgroundTaskDomain = 'spatial-stats' | 'clustering' | 'simulation' | 'raster' | 'external';

export interface RasterAccuracyTaskInput {
  prediction: ArrayLike<number>;
  truth: ArrayLike<number>;
  classLabels?: string[];
  numClasses?: number;
}

export interface KMeansTaskInput {
  data: number[][];
  options: KMeansOptions;
}

export interface CellularAutomataTaskInput {
  options: CellularAutomataSimulationOptions;
}

export interface BackgroundTaskDefinitions {
  'spatial-stats/lisa': {
    domain: 'spatial-stats';
    input: LisaSpatialStatsExecutionInput;
    output: LisaSpatialStatsExecutionResult;
  };
  'spatial-stats/hotspot': {
    domain: 'spatial-stats';
    input: HotSpotSpatialStatsExecutionInput;
    output: HotSpotSpatialStatsExecutionResult;
  };
  'spatial-stats/emerging-hotspot': {
    domain: 'spatial-stats';
    input: EmergingHotSpotSpatialStatsExecutionInput;
    output: EmergingHotSpotSpatialStatsExecutionResult;
  };
  'clustering/kmeans': {
    domain: 'clustering';
    input: KMeansTaskInput;
    output: ClusterResult;
  };
  'simulation/cellular-automata': {
    domain: 'simulation';
    input: CellularAutomataTaskInput;
    output: CellularAutomataResult;
  };
  'raster/classification-accuracy': {
    domain: 'raster';
    input: RasterAccuracyTaskInput;
    output: AccuracyReport;
  };
  'external/overpass-buildings': {
    domain: 'external';
    input: {
      bounds: [number, number, number, number];
      bypassCache?: boolean;
    };
    output: OverpassBuildingsResult;
  };
}

export type WorkerTaskKind = keyof BackgroundTaskDefinitions;

export type WorkerTaskInput<K extends WorkerTaskKind = WorkerTaskKind> =
  BackgroundTaskDefinitions[K]['input'];

export type WorkerTaskOutput<K extends WorkerTaskKind = WorkerTaskKind> =
  BackgroundTaskDefinitions[K]['output'];

export type WorkerTaskDomain<K extends WorkerTaskKind = WorkerTaskKind> =
  BackgroundTaskDefinitions[K]['domain'];

export interface BackgroundTaskProgress {
  percent: number;
  stage?: string | undefined;
  detail?: string | undefined;
}

export interface BackgroundTaskViewAction {
  label: string;
  onClick?: (() => void) | undefined;
}

export type BackgroundTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BackgroundTaskSnapshot<K extends WorkerTaskKind = WorkerTaskKind> {
  id: string;
  kind: K;
  domain: WorkerTaskDomain<K>;
  title: string;
  description?: string | undefined;
  status: BackgroundTaskStatus;
  progress: BackgroundTaskProgress;
  createdAt: number;
  startedAt?: number | undefined;
  finishedAt?: number | undefined;
  queuePosition?: number | undefined;
  error?: string | undefined;
  timeoutMs?: number | undefined;
  viewAction?: BackgroundTaskViewAction | undefined;
}

export interface BackgroundTaskPoolSnapshot {
  jobs: BackgroundTaskSnapshot[];
  workerCount: number;
  activeCount: number;
  queuedCount: number;
}

export interface BackgroundTaskEnqueueOptions {
  title: string;
  description?: string | undefined;
  timeoutMs?: number | undefined;
  viewAction?: BackgroundTaskViewAction | undefined;
}

export interface BackgroundTaskHandle<K extends WorkerTaskKind = WorkerTaskKind> {
  id: string;
  kind: K;
  promise: Promise<WorkerTaskOutput<K>>;
  cancel: () => boolean;
}

export interface WorkerExecuteMessage<K extends WorkerTaskKind = WorkerTaskKind> {
  type: 'execute';
  jobId: string;
  task: {
    kind: K;
    input: WorkerTaskInput<K>;
  };
}

export interface WorkerProgressMessage {
  type: 'progress';
  jobId: string;
  progress: BackgroundTaskProgress;
}

export interface WorkerResultMessage<K extends WorkerTaskKind = WorkerTaskKind> {
  type: 'result';
  jobId: string;
  result: WorkerTaskOutput<K>;
}

export interface WorkerErrorMessage {
  type: 'error';
  jobId: string;
  error: string;
}

export type WorkerMainToWorkerMessage = WorkerExecuteMessage;

export type WorkerToMainMessage =
  | WorkerProgressMessage
  | WorkerResultMessage
  | WorkerErrorMessage;

export function resolveTaskDomain(kind: WorkerTaskKind): BackgroundTaskDomain {
  if (kind.startsWith('spatial-stats/')) return 'spatial-stats';
  if (kind.startsWith('clustering/')) return 'clustering';
  if (kind.startsWith('simulation/')) return 'simulation';
  if (kind.startsWith('external/')) return 'external';
  return 'raster';
}
