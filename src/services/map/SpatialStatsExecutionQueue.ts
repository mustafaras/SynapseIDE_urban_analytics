import {
  type BackgroundTaskHandle,
  type BackgroundTaskViewAction,
  createInlineTaskHandle,
  enqueueWorkerTask,
} from '@/workers/pool';
import {
  type EmergingHotSpotSpatialStatsExecutionInput,
  executeEmergingHotSpotSpatialStats,
  executeHotSpotSpatialStats,
  executeLisaSpatialStats,
  type HotSpotSpatialStatsExecutionInput,
  type LisaSpatialStatsExecutionInput,
} from './SpatialStatsExecutionService';

interface SpatialStatsQueueOptions {
  viewAction?: BackgroundTaskViewAction;
  timeoutMs?: number;
}

function hasWorkerSupport(): boolean {
  return typeof Worker !== 'undefined';
}

export function executeLisaSpatialStatsAsync(
  input: LisaSpatialStatsExecutionInput,
  options: SpatialStatsQueueOptions = {},
): BackgroundTaskHandle<'spatial-stats/lisa'> {
  if (!hasWorkerSupport()) {
    return createInlineTaskHandle('spatial-stats/lisa', () => executeLisaSpatialStats(input));
  }
  return enqueueWorkerTask('spatial-stats/lisa', input, {
    title: `Local Moran's I · ${input.sourceLayer.name} · ${input.valueField}`,
    description: 'Background local spatial autocorrelation run',
    timeoutMs: options.timeoutMs ?? 300_000,
    viewAction: options.viewAction,
  });
}

export function executeHotSpotSpatialStatsAsync(
  input: HotSpotSpatialStatsExecutionInput,
  options: SpatialStatsQueueOptions = {},
): BackgroundTaskHandle<'spatial-stats/hotspot'> {
  if (!hasWorkerSupport()) {
    return createInlineTaskHandle('spatial-stats/hotspot', () => executeHotSpotSpatialStats(input));
  }
  return enqueueWorkerTask('spatial-stats/hotspot', input, {
    title: `Getis-Ord Gi* · ${input.sourceLayer.name} · ${input.valueField}`,
    description: 'Background hot spot detection run',
    timeoutMs: options.timeoutMs ?? 180_000,
    viewAction: options.viewAction,
  });
}

export function executeEmergingHotSpotSpatialStatsAsync(
  input: EmergingHotSpotSpatialStatsExecutionInput,
  options: SpatialStatsQueueOptions = {},
): BackgroundTaskHandle<'spatial-stats/emerging-hotspot'> {
  if (!hasWorkerSupport()) {
    return createInlineTaskHandle('spatial-stats/emerging-hotspot', () => executeEmergingHotSpotSpatialStats(input));
  }
  return enqueueWorkerTask('spatial-stats/emerging-hotspot', input, {
    title: `Emerging Hot Spots · ${input.sourceLayer.name}`,
    description: 'Background space-time hot spot mining run',
    timeoutMs: options.timeoutMs ?? 240_000,
    viewAction: options.viewAction,
  });
}
