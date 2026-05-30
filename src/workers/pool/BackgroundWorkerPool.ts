import {
  type BackgroundTaskEnqueueOptions,
  type BackgroundTaskHandle,
  type BackgroundTaskPoolSnapshot,
  type BackgroundTaskProgress,
  type BackgroundTaskSnapshot,
  type BackgroundTaskStatus,
  resolveTaskDomain,
  type WorkerMainToWorkerMessage,
  type WorkerTaskInput,
  type WorkerTaskKind,
  type WorkerTaskOutput,
  type WorkerToMainMessage,
} from './taskDefinitions';

export class BackgroundTaskCancelledError extends Error {
  readonly jobId: string;

  constructor(jobId: string, message = 'Background task cancelled.') {
    super(message);
    this.name = 'BackgroundTaskCancelledError';
    this.jobId = jobId;
  }
}

export function isBackgroundTaskCancelledError(error: unknown): error is BackgroundTaskCancelledError {
  return error instanceof BackgroundTaskCancelledError;
}

type WorkerFactory = () => Worker;

interface WorkerSlot {
  id: number;
  worker: Worker;
  jobId: string | null;
}

interface InternalJob<K extends WorkerTaskKind = WorkerTaskKind> {
  snapshot: BackgroundTaskSnapshot<K>;
  input: WorkerTaskInput<K>;
  resolve: (value: WorkerTaskOutput<K>) => void;
  reject: (reason?: unknown) => void;
  timeoutHandle?: ReturnType<typeof setTimeout>;
}

export interface BackgroundWorkerPoolLifecycleEvent {
  status: Extract<BackgroundTaskStatus, 'completed' | 'failed' | 'cancelled'>;
  snapshot: BackgroundTaskSnapshot;
  error?: unknown;
}

export interface BackgroundWorkerPoolOptions {
  workerCount?: number;
  workerFactory: WorkerFactory;
  maxRetainedJobs?: number;
  onTaskEvent?: (event: BackgroundWorkerPoolLifecycleEvent) => void;
}

function clampWorkerCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.floor(value));
}

function createJobId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeProgress(progress: BackgroundTaskProgress): BackgroundTaskProgress {
  return {
    ...progress,
    percent: Math.max(0, Math.min(100, Math.round(progress.percent))),
  };
}

export class BackgroundWorkerPool {
  private readonly workerFactory: WorkerFactory;
  private readonly listeners = new Set<(snapshot: BackgroundTaskPoolSnapshot) => void>();
  private readonly jobs = new Map<string, InternalJob>();
  private readonly queue: string[] = [];
  private readonly maxRetainedJobs: number;
  private readonly onTaskEvent?: (event: BackgroundWorkerPoolLifecycleEvent) => void;
  private workerCountTarget: number;
  private workers: WorkerSlot[] = [];

  constructor(options: BackgroundWorkerPoolOptions) {
    this.workerFactory = options.workerFactory;
    this.maxRetainedJobs = Math.max(4, options.maxRetainedJobs ?? 18);
    this.onTaskEvent = options.onTaskEvent;
    this.workerCountTarget = clampWorkerCount(options.workerCount ?? 1);
  }

  subscribe(listener: (snapshot: BackgroundTaskPoolSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): BackgroundTaskPoolSnapshot {
    const queuedOrder = new Map<string, number>();
    this.queue.forEach((jobId, index) => {
      queuedOrder.set(jobId, index + 1);
    });

    const jobs = Array.from(this.jobs.values())
      .map(({ snapshot }) => ({
        ...snapshot,
        ...(snapshot.status === 'queued'
          ? { queuePosition: queuedOrder.get(snapshot.id) ?? snapshot.queuePosition ?? 1 }
          : {}),
      }))
      .sort((left, right) => {
        const statusRank = (status: BackgroundTaskStatus) => {
          if (status === 'running') return 0;
          if (status === 'queued') return 1;
          if (status === 'failed') return 2;
          if (status === 'completed') return 3;
          return 4;
        };

        const rankDiff = statusRank(left.status) - statusRank(right.status);
        if (rankDiff !== 0) {
          return rankDiff;
        }

        const leftTime = left.finishedAt ?? left.startedAt ?? left.createdAt;
        const rightTime = right.finishedAt ?? right.startedAt ?? right.createdAt;
        return rightTime - leftTime;
      });

    return {
      jobs,
      workerCount: Math.max(this.workerCountTarget, this.workers.length),
      activeCount: jobs.filter((job) => job.status === 'running').length,
      queuedCount: jobs.filter((job) => job.status === 'queued').length,
    };
  }

  enqueue<K extends WorkerTaskKind>(
    kind: K,
    input: WorkerTaskInput<K>,
    options: BackgroundTaskEnqueueOptions,
  ): BackgroundTaskHandle<K> {
    const id = createJobId();
    const snapshot: BackgroundTaskSnapshot<K> = {
      id,
      kind,
      domain: resolveTaskDomain(kind),
      title: options.title,
      description: options.description,
      status: 'queued',
      progress: { percent: 0, stage: 'Queued' },
      createdAt: Date.now(),
      timeoutMs: options.timeoutMs,
      viewAction: options.viewAction,
      queuePosition: this.queue.length + 1,
    };

    let resolvePromise!: (value: WorkerTaskOutput<K>) => void;
    let rejectPromise!: (reason?: unknown) => void;
    const promise = new Promise<WorkerTaskOutput<K>>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    this.jobs.set(id, {
      snapshot,
      input,
      resolve: resolvePromise as InternalJob['resolve'],
      reject: rejectPromise,
    });
    this.queue.push(id);
    this.pruneRetainedJobs();
    this.dispatchSnapshot();
    this.startNextJobs();

    return {
      id,
      kind,
      promise,
      cancel: () => this.cancelJob(id),
    };
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.snapshot.status === 'queued') {
      this.removeFromQueue(jobId);
      this.finishJob(jobId, 'cancelled', undefined, new BackgroundTaskCancelledError(jobId), 'Cancelled before execution');
      return true;
    }

    if (job.snapshot.status === 'running') {
      const slot = this.workers.find((entry) => entry.jobId === jobId);
      if (!slot) {
        return false;
      }
      this.recycleWorkerSlot(slot.id);
      this.finishJob(jobId, 'cancelled', undefined, new BackgroundTaskCancelledError(jobId), 'Cancelled');
      this.startNextJobs();
      return true;
    }

    return false;
  }

  retryJob(jobId: string): BackgroundTaskHandle | null {
    const job = this.jobs.get(jobId);
    if (!job || job.snapshot.status !== 'failed') {
      return null;
    }
    const retryOptions: BackgroundTaskEnqueueOptions = {
      title: `Retry ${job.snapshot.title}`,
      ...(job.snapshot.description ? { description: job.snapshot.description } : {}),
      ...(typeof job.snapshot.timeoutMs === 'number' ? { timeoutMs: job.snapshot.timeoutMs } : {}),
      ...(job.snapshot.viewAction ? { viewAction: job.snapshot.viewAction } : {}),
    };
    return this.enqueue(job.snapshot.kind, job.input as WorkerTaskInput<WorkerTaskKind>, retryOptions);
  }

  clearFinished(): void {
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.snapshot.status === 'completed' || job.snapshot.status === 'failed' || job.snapshot.status === 'cancelled') {
        this.jobs.delete(jobId);
      }
    }
    this.dispatchSnapshot();
  }

  setWorkerCount(workerCount: number): void {
    this.workerCountTarget = clampWorkerCount(workerCount);
    this.ensureWorkerCount();
    this.dispatchSnapshot();
    this.startNextJobs();
  }

  private ensureWorkerCount(): void {
    while (this.workers.length < this.workerCountTarget) {
      this.workers.push(this.createWorkerSlot(this.workers.length));
    }

    if (this.workers.length <= this.workerCountTarget) {
      return;
    }

    for (let index = this.workers.length - 1; index >= 0 && this.workers.length > this.workerCountTarget; index -= 1) {
      const slot = this.workers[index];
      if (slot.jobId !== null) {
        continue;
      }
      slot.worker.terminate();
      this.workers.splice(index, 1);
    }
  }

  private createWorkerSlot(id: number): WorkerSlot {
    const worker = this.workerFactory();
    const slot: WorkerSlot = { id, worker, jobId: null };

    worker.addEventListener('message', (event: MessageEvent<WorkerToMainMessage>) => {
      this.handleWorkerMessage(slot.id, event.data);
    });

    worker.addEventListener('error', (event) => {
      const activeJobId = this.workers[slot.id]?.jobId;
      if (!activeJobId) {
        return;
      }
      const message = event.message || 'Background worker execution failed.';
      this.recycleWorkerSlot(slot.id);
      this.finishJob(activeJobId, 'failed', undefined, new Error(message), message);
      this.startNextJobs();
    });

    return slot;
  }

  private recycleWorkerSlot(slotId: number): void {
    const existing = this.workers[slotId];
    if (!existing) {
      return;
    }
    existing.worker.terminate();
    this.workers[slotId] = this.createWorkerSlot(slotId);
  }

  private startNextJobs(): void {
    this.ensureWorkerCount();
    for (const slot of this.workers) {
      if (slot.jobId !== null) {
        continue;
      }
      const jobId = this.queue.shift();
      if (!jobId) {
        break;
      }
      this.startJobOnSlot(jobId, slot.id);
    }
    this.dispatchSnapshot();
  }

  private startJobOnSlot(jobId: string, slotId: number): void {
    const slot = this.workers[slotId];
    const job = this.jobs.get(jobId);
    if (!slot || !job) {
      return;
    }

    slot.jobId = jobId;
    job.snapshot = {
      ...job.snapshot,
      status: 'running',
      startedAt: Date.now(),
      queuePosition: undefined,
      progress: { percent: 4, stage: 'Worker dispatched' },
    };

    if (typeof job.snapshot.timeoutMs === 'number' && job.snapshot.timeoutMs > 0) {
      job.timeoutHandle = setTimeout(() => {
        if (this.workers[slotId]?.jobId !== jobId) {
          return;
        }
        const timeoutMessage = `${job.snapshot.title} timed out after ${job.snapshot.timeoutMs} ms.`;
        this.recycleWorkerSlot(slotId);
        this.finishJob(jobId, 'failed', undefined, new Error(timeoutMessage), timeoutMessage);
        this.startNextJobs();
      }, job.snapshot.timeoutMs);
    }

    const message: WorkerMainToWorkerMessage = {
      type: 'execute',
      jobId,
      task: {
        kind: job.snapshot.kind,
        input: job.input as WorkerTaskInput,
      },
    };
    slot.worker.postMessage(message);
  }

  private handleWorkerMessage(slotId: number, message: WorkerToMainMessage): void {
    const slot = this.workers[slotId];
    if (!slot || slot.jobId !== message.jobId) {
      return;
    }

    if (message.type === 'progress') {
      const job = this.jobs.get(message.jobId);
      if (!job) {
        return;
      }
      job.snapshot = {
        ...job.snapshot,
        progress: normalizeProgress(message.progress),
      };
      this.dispatchSnapshot();
      return;
    }

    if (message.type === 'result') {
      slot.jobId = null;
      this.finishJob(message.jobId, 'completed', message.result, undefined, 'Complete');
      this.startNextJobs();
      return;
    }

    slot.jobId = null;
    this.finishJob(message.jobId, 'failed', undefined, new Error(message.error), message.error);
    this.startNextJobs();
  }

  private finishJob(
    jobId: string,
    status: Extract<BackgroundTaskStatus, 'completed' | 'failed' | 'cancelled'>,
    result?: unknown,
    error?: unknown,
    finalStage?: string,
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    if (job.timeoutHandle) {
      clearTimeout(job.timeoutHandle);
    }

    job.snapshot = {
      ...job.snapshot,
      status,
      finishedAt: Date.now(),
      progress: {
        percent: status === 'completed' ? 100 : job.snapshot.progress.percent,
        stage: finalStage,
        detail: job.snapshot.progress.detail,
      },
      ...(status === 'failed'
        ? { error: error instanceof Error ? error.message : String(error ?? 'Background task failed.') }
        : {}),
    };

    if (status === 'completed') {
      job.resolve(result as never);
    } else {
      job.reject(error ?? new Error(job.snapshot.error ?? 'Background task failed.'));
    }

    this.emitLifecycleEvent({
      status,
      snapshot: job.snapshot,
      ...(error !== undefined ? { error } : {}),
    });

    this.pruneRetainedJobs();
    this.dispatchSnapshot();
  }

  private emitLifecycleEvent(event: BackgroundWorkerPoolLifecycleEvent): void {
    try {
      this.onTaskEvent?.(event);
    } catch {
      // Telemetry hooks must never block worker recovery or promise settlement.
    }
  }

  private removeFromQueue(jobId: string): void {
    const index = this.queue.indexOf(jobId);
    if (index >= 0) {
      this.queue.splice(index, 1);
    }
  }

  private pruneRetainedJobs(): void {
    const terminalJobs = Array.from(this.jobs.values())
      .filter((job) => job.snapshot.status === 'completed' || job.snapshot.status === 'failed' || job.snapshot.status === 'cancelled')
      .sort((left, right) => (right.snapshot.finishedAt ?? 0) - (left.snapshot.finishedAt ?? 0));

    for (const staleJob of terminalJobs.slice(this.maxRetainedJobs)) {
      this.jobs.delete(staleJob.snapshot.id);
    }
  }

  private dispatchSnapshot(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => {
      listener(snapshot);
    });
  }
}
