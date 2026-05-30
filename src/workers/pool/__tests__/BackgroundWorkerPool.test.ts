import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BackgroundTaskCancelledError,
  BackgroundWorkerPool,
  type BackgroundWorkerPoolLifecycleEvent,
} from '../BackgroundWorkerPool';
import type {
  WorkerMainToWorkerMessage,
  WorkerToMainMessage,
} from '../taskDefinitions';

type WorkerListener = (event: MessageEvent<WorkerToMainMessage>) => void;
type ErrorListener = (event: ErrorEvent) => void;

class FakeWorker {
  private readonly listeners = new Map<'message' | 'error', Set<WorkerListener | ErrorListener>>([
    ['message', new Set()],
    ['error', new Set()],
  ]);

  private terminated = false;

  addEventListener(type: 'message' | 'error', listener: WorkerListener | ErrorListener): void {
    this.listeners.get(type)?.add(listener);
  }

  postMessage(message: WorkerMainToWorkerMessage): void {
    if (this.terminated || message.type !== 'execute') {
      return;
    }

    const failureInput = message.task.input as { shouldFail?: boolean; errorMessage?: string };
    if (failureInput.shouldFail) {
      setTimeout(() => {
        if (this.terminated) {
          return;
        }
        this.emit('message', {
          type: 'error',
          jobId: message.jobId,
          error: failureInput.errorMessage ?? 'Forced worker failure',
        });
      }, 10);
      return;
    }

    setTimeout(() => {
      if (this.terminated) {
        return;
      }
      this.emit('message', {
        type: 'progress',
        jobId: message.jobId,
        progress: {
          percent: 52,
          stage: 'Synthetic progress',
        },
      });
    }, 10);

    setTimeout(() => {
      if (this.terminated) {
        return;
      }
      this.emit('message', {
        type: 'result',
        jobId: message.jobId,
        result: {
          synthetic: true,
          kind: message.task.kind,
        } as never,
      });
    }, 50);
  }

  terminate(): void {
    this.terminated = true;
  }

  private emit(type: 'message', payload: WorkerToMainMessage): void;
  private emit(type: 'error', payload: ErrorEvent): void;
  private emit(type: 'message' | 'error', payload: WorkerToMainMessage | ErrorEvent): void {
    const callbacks = this.listeners.get(type);
    if (!callbacks) {
      return;
    }
    callbacks.forEach((listener) => {
      if (type === 'message') {
        (listener as WorkerListener)({ data: payload } as MessageEvent<WorkerToMainMessage>);
      } else {
        (listener as ErrorListener)(payload as ErrorEvent);
      }
    });
  }
}

function makeRasterInput() {
  return {
    truth: [0, 1, 1, 0],
    prediction: [0, 1, 0, 0],
    classLabels: ['background', 'urban'],
  };
}

describe('BackgroundWorkerPool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('queues jobs beyond worker capacity and advances progress snapshots', async () => {
    const workerFactory = vi.fn(() => new FakeWorker() as unknown as Worker);
    const pool = new BackgroundWorkerPool({ workerCount: 1, workerFactory });

    const first = pool.enqueue('raster/classification-accuracy', makeRasterInput(), {
      title: 'First raster accuracy run',
    });
    const second = pool.enqueue('raster/classification-accuracy', makeRasterInput(), {
      title: 'Second raster accuracy run',
    });

    let snapshot = pool.getSnapshot();
    expect(snapshot.activeCount).toBe(1);
    expect(snapshot.queuedCount).toBe(1);
    expect(snapshot.jobs.find((job) => job.id === second.id)?.queuePosition).toBe(1);

    vi.advanceTimersByTime(10);
    await Promise.resolve();

    snapshot = pool.getSnapshot();
    expect(snapshot.jobs.find((job) => job.id === first.id)?.progress.percent).toBe(52);
    expect(snapshot.jobs.find((job) => job.id === first.id)?.progress.stage).toBe('Synthetic progress');

    vi.advanceTimersByTime(40);
    await expect(first.promise).resolves.toEqual(expect.objectContaining({ synthetic: true }));

    snapshot = pool.getSnapshot();
    expect(snapshot.activeCount).toBe(1);
    expect(snapshot.queuedCount).toBe(0);
    expect(snapshot.jobs.find((job) => job.id === first.id)?.status).toBe('completed');

    vi.advanceTimersByTime(50);
    await expect(second.promise).resolves.toEqual(expect.objectContaining({ synthetic: true }));

    snapshot = pool.getSnapshot();
    expect(snapshot.jobs.filter((job) => job.status === 'completed')).toHaveLength(2);

    pool.clearFinished();
    expect(pool.getSnapshot().jobs).toHaveLength(0);
    expect(workerFactory).toHaveBeenCalledTimes(1);
  });

  it('cancels a running job by recycling the active worker and starting the next job', async () => {
    const workerFactory = vi.fn(() => new FakeWorker() as unknown as Worker);
    const pool = new BackgroundWorkerPool({ workerCount: 1, workerFactory });

    const first = pool.enqueue('raster/classification-accuracy', makeRasterInput(), {
      title: 'Cancellable run',
    });
    const second = pool.enqueue('raster/classification-accuracy', makeRasterInput(), {
      title: 'Queued successor',
    });

    expect(first.cancel()).toBe(true);
    await expect(first.promise).rejects.toBeInstanceOf(BackgroundTaskCancelledError);

    let snapshot = pool.getSnapshot();
    expect(snapshot.jobs.find((job) => job.id === first.id)?.status).toBe('cancelled');
    expect(snapshot.activeCount).toBe(1);
    expect(snapshot.queuedCount).toBe(0);

    vi.advanceTimersByTime(50);
    await expect(second.promise).resolves.toEqual(expect.objectContaining({ synthetic: true }));

    snapshot = pool.getSnapshot();
    expect(snapshot.jobs.find((job) => job.id === second.id)?.status).toBe('completed');
    expect(workerFactory).toHaveBeenCalledTimes(2);
  });

  it('cancels a queued job without touching the running worker', async () => {
    const workerFactory = vi.fn(() => new FakeWorker() as unknown as Worker);
    const pool = new BackgroundWorkerPool({ workerCount: 1, workerFactory });

    const first = pool.enqueue('raster/classification-accuracy', makeRasterInput(), {
      title: 'Running job',
    });
    const queued = pool.enqueue('raster/classification-accuracy', makeRasterInput(), {
      title: 'Queued job',
    });

    expect(queued.cancel()).toBe(true);
    await expect(queued.promise).rejects.toBeInstanceOf(BackgroundTaskCancelledError);

    const snapshot = pool.getSnapshot();
    expect(snapshot.jobs.find((job) => job.id === queued.id)?.status).toBe('cancelled');
    expect(snapshot.queuedCount).toBe(0);

    vi.advanceTimersByTime(50);
    await expect(first.promise).resolves.toEqual(expect.objectContaining({ synthetic: true }));
    expect(workerFactory).toHaveBeenCalledTimes(1);
  });

  it('surfaces failed worker jobs through lifecycle events', async () => {
    const workerFactory = vi.fn(() => new FakeWorker() as unknown as Worker);
    const lifecycleEvents: BackgroundWorkerPoolLifecycleEvent[] = [];
    const pool = new BackgroundWorkerPool({
      workerCount: 1,
      workerFactory,
      onTaskEvent: (event) => lifecycleEvents.push(event),
    });

    const handle = pool.enqueue('raster/classification-accuracy', {
      ...makeRasterInput(),
      shouldFail: true,
      errorMessage: 'Forced raster worker failure token=abc123abc123abc123abc123abc123abc123',
    } as never, {
      title: 'Forced failure run',
    });

    vi.advanceTimersByTime(10);
    await expect(handle.promise).rejects.toThrow('Forced raster worker failure');

    const snapshot = pool.getSnapshot();
    const failedJob = snapshot.jobs.find((job) => job.id === handle.id);
    expect(failedJob?.status).toBe('failed');
    expect(failedJob?.error).toContain('Forced raster worker failure');
    expect(lifecycleEvents).toHaveLength(1);
    expect(lifecycleEvents[0]).toEqual(expect.objectContaining({
      status: 'failed',
      snapshot: expect.objectContaining({
        id: handle.id,
        kind: 'raster/classification-accuracy',
        error: expect.stringContaining('Forced raster worker failure'),
      }),
    }));
    const retry = pool.retryJob(handle.id);
    expect(retry?.id).not.toBe(handle.id);
    void retry?.promise.catch(() => undefined);
  });
});
