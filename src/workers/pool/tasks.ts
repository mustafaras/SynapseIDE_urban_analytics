import {
  BackgroundTaskCancelledError,
  BackgroundWorkerPool,
  type BackgroundWorkerPoolLifecycleEvent,
  isBackgroundTaskCancelledError,
} from './BackgroundWorkerPool';
import { recordMapTelemetryEvent } from '../../services/map/observability';
import type {
  BackgroundTaskEnqueueOptions,
  BackgroundTaskHandle,
  WorkerTaskInput,
  WorkerTaskKind,
  WorkerTaskOutput,
} from './taskDefinitions';

function resolveDefaultWorkerCount(): number {
  const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
  if (!hardwareConcurrency || !Number.isFinite(hardwareConcurrency)) {
    return 2;
  }
  return Math.max(1, Math.min(4, Math.floor(hardwareConcurrency / 2)));
}

export const analyticsWorkerPool = new BackgroundWorkerPool({
  workerCount: resolveDefaultWorkerCount(),
  workerFactory: () => new Worker(new URL('./analytics.worker.ts', import.meta.url), { type: 'module' }),
  onTaskEvent: recordWorkerPoolTelemetry,
});

function recordWorkerPoolTelemetry(event: BackgroundWorkerPoolLifecycleEvent): void {
  if (event.status !== 'failed') {
    return;
  }
  const errorMessage = event.snapshot.error ?? (event.error instanceof Error ? event.error.message : 'Background worker task failed.');
  recordMapTelemetryEvent({
    kind: 'worker.failure',
    severity: 'error',
    source: 'worker-pool',
    message: `${event.snapshot.title} failed: ${errorMessage}`,
    code: 'WORKER_TASK_FAILED',
    recoverable: true,
    recoveryLabel: 'Retry worker job',
    entityIds: {
      jobId: event.snapshot.id,
      taskKind: event.snapshot.kind,
    },
    details: {
      jobId: event.snapshot.id,
      taskKind: event.snapshot.kind,
      domain: event.snapshot.domain,
      title: event.snapshot.title,
      progressStage: event.snapshot.progress.stage ?? 'Worker failed',
      error: errorMessage,
    },
    fingerprint: `worker:${event.snapshot.kind}:${event.snapshot.id}:${errorMessage}`,
  });
}

export interface InlineTaskHandle<K extends WorkerTaskKind = WorkerTaskKind> extends BackgroundTaskHandle<K> {
  inline: true;
}

export function enqueueWorkerTask<K extends WorkerTaskKind>(
  kind: K,
  input: WorkerTaskInput<K>,
  options: BackgroundTaskEnqueueOptions,
): BackgroundTaskHandle<K> {
  return analyticsWorkerPool.enqueue(kind, input, options);
}

export function createInlineTaskHandle<K extends WorkerTaskKind>(
  kind: K,
  executor: () => WorkerTaskOutput<K> | Promise<WorkerTaskOutput<K>>,
): InlineTaskHandle<K> {
  return {
    id: `inline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    promise: Promise.resolve().then(() => executor()),
    cancel: () => false,
    inline: true,
  };
}

export {
  BackgroundTaskCancelledError,
  isBackgroundTaskCancelledError,
};
